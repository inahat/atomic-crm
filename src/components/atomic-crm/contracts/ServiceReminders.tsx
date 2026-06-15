import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { Calendar, FileText, Check, X } from "lucide-react";
import { useGetList, useUpdate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate, Link } from "react-router-dom";
import { ServiceTask, Contract } from "../types";

import { Loading } from "@/components/admin";

import { ServiceReminderBookingDialog } from "./ServiceReminderBookingDialog";
import { ServiceReminderCompleteDialog } from "./ServiceReminderCompleteDialog";

export const ServiceReminders = () => {
    const navigate = useNavigate();
    const [days, setDays] = useState<30 | 60>(30);

    // Fetch pending/booked service tasks
    const { data: serviceTasks, isPending, error } = useGetList<ServiceTask>("service_tasks", {
        filter: {
            status: ["pending", "booked"]
        },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "due_date", order: "ASC" },
    });

    // Also fetch contracts to get names/numbers
    const { data: contracts } = useGetList<Contract>("contracts", {
        pagination: { page: 1, perPage: 1000 },
    });

    const [selectedReminder, setSelectedReminder] = useState<{ id: string | number; initialDate?: string; type: string } | null>(null);
    const [completingReminder, setCompletingReminder] = useState<{ id: string | number; type: string } | null>(null);

    const [update] = useUpdate();

    if (error) {
        console.error("ServiceReminders Error:", error);
        return (
            <Card className="mt-6 border-red-200 bg-red-50">
                <CardContent className="p-4 text-red-600 text-sm">
                    Error loading reminders: {error.message}
                </CardContent>
            </Card>
        );
    }

    if (isPending) {
        return (
            <Card className="mt-6">
                <CardContent className="p-4">
                    <Loading loadingPrimary="Loading reminders..." />
                </CardContent>
            </Card>
        );
    }

    const today = new Date();
    const safeTasks = serviceTasks || [];
    const safeContracts = contracts || [];

    // Map tasks to include contract info and filter by deadline
    const allReminders = safeTasks
        .map(task => {
            const contract = safeContracts.find(c => c.id === task.contract_id);
            return {
                ...task,
                contract_name: contract?.contract_name || 'Unknown Contract',
                contract_number: contract?.contract_number || 'N/A',
                deadline: new Date(task.due_date)
            };
        })
        .filter(reminder => {
            if (reminder.status === 'completed' || reminder.status === 'dismissed') return false;
            const daysUntilDeadline = differenceInDays(reminder.deadline, today);
            return daysUntilDeadline <= days && daysUntilDeadline >= -30;
        })
        .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

    const handleAction = (id: string | number, action: 'booked' | 'completed' | 'dismissed' | 'report') => {
        const task = safeTasks.find(t => t.id === id);
        const type = task?.service_type === 'mid-year' ? 'Mid-Year' : 'End-of-Year';

        if (action === 'dismissed') {
            if (!window.confirm("Are you sure you want to dismiss this reminder?")) return;
            updateTask(id, action);
        } else if (action === 'booked') {
            setSelectedReminder({ id, initialDate: task?.booked_date, type });
        } else if (action === 'completed') {
            setCompletingReminder({ id, type });
        } else if (action === 'report') {
            navigate(`/service_tasks/${id}/report`);
        } else {
            updateTask(id, action);
        }
    };

    const handleConfirmBooking = (date: string) => {
        if (!selectedReminder) return;
        updateTask(selectedReminder.id, 'booked', date);
        setSelectedReminder(null);
    };

    const handleConfirmCompletion = (date: string) => {
        if (!completingReminder) return;
        updateTask(completingReminder.id, 'completed', date);
        setCompletingReminder(null);
    };


    const updateTask = (id: string | number, action: 'booked' | 'completed' | 'dismissed', date?: string) => {
        const data: any = { status: action, updated_at: new Date().toISOString() };
        if (action === 'booked' && date) {
            data.booked_date = date;
        } else if (action === 'completed' && date) {
            data.completed_date = date;
        }

        update(
            "service_tasks",
            {
                id,
                data,
                previousData: safeTasks.find(t => t.id === id)
            },
            {
                onError: (error: Error) => {
                    console.error("Failed to update service task:", error);
                    alert(`Failed to save changes: ${error.message}`);
                }
            }
        );
    };

    return (
        <>
            <ServiceReminderBookingDialog
                isOpen={!!selectedReminder}
                onClose={() => setSelectedReminder(null)}
                onConfirm={handleConfirmBooking}
                title={selectedReminder?.type || ''}
                initialDate={selectedReminder?.initialDate}
            />
            <ServiceReminderCompleteDialog
                isOpen={!!completingReminder}
                onClose={() => setCompletingReminder(null)}
                onConfirm={handleConfirmCompletion}
                title={completingReminder?.type || ''}
            />
            <Card className="mt-6 border-none shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-1">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-semibold">Service Reminders</CardTitle>
                    </div>
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={days === 30 ? "default" : "ghost"}
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={() => setDays(30)}
                        >
                            30d
                        </Button>
                        <Button
                            variant={days === 60 ? "default" : "ghost"}
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={() => setDays(60)}
                        >
                            60d
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contract</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allReminders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No upcoming service visits due in the next {days} days.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    allReminders.map(reminder => (
                                        <TableRow key={reminder.id}>
                                            <TableCell className="font-medium">
                                                <Link to={`/contracts/${reminder.contract_id}`} className="hover:underline text-primary">
                                                    {reminder.contract_name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">{reminder.contract_number}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${reminder.service_type === 'mid-year'
                                                    ? 'bg-orange-50 text-orange-700 ring-orange-600/20'
                                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}>
                                                    {reminder.service_type === 'mid-year' ? 'Mid-Year' : 'End-of-Year'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {format(reminder.deadline, "MMM d, yyyy")}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {differenceInDays(reminder.deadline, today)} days left
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {reminder.status === 'booked' && reminder.booked_date ? (
                                                    <span
                                                        onClick={() => handleAction(reminder.id, 'booked')}
                                                        className="inline-flex cursor-pointer items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 transition-colors"
                                                        title="Click to reschedule"
                                                    >
                                                        Booked: {format(new Date(reminder.booked_date), "MMM d, HH:mm")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                                        Pending
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {reminder.status !== 'booked' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleAction(reminder.id, 'booked')}
                                                            title="Book Service"
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-8 w-8 ${reminder.report ? 'text-purple-600' : 'text-gray-500'} hover:text-purple-700 hover:bg-purple-50`}
                                                        onClick={() => handleAction(reminder.id, 'report')}
                                                        title={reminder.report ? "Edit Report" : "Write Report"}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleAction(reminder.id, 'completed')}
                                                        title="Mark Completed"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleAction(reminder.id, 'dismissed')}
                                                        title="Dismiss"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
