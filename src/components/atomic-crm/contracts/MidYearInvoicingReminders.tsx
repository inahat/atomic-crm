import { useState, useEffect } from "react";
import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Check } from "lucide-react";
import { Contract, Company } from "../types";
import { Link } from "react-router-dom";

export const MidYearInvoicingReminders = () => {
    const { data: contracts = [], isPending: isContractsLoading } = useGetList<Contract>("contracts", {
        pagination: { page: 1, perPage: 1000 }
    });

    const { data: companies = [] } = useGetList<Company>("companies", {
        pagination: { page: 1, perPage: 1000 }
    });

    // Persistent state for cleared/dismissed reminders
    const [clearedIds, setClearedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem("midyear_cleared_reminders");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Item being confirmed in modal
    const [confirmingItem, setConfirmingItem] = useState<any | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem("midyear_cleared_reminders", JSON.stringify(clearedIds));
        } catch (e) {
            console.error("Failed to save cleared reminders:", e);
        }
    }, [clearedIds]);

    const companyMap = new Map<string, string>();
    companies.forEach(c => companyMap.set(String(c.id), c.name));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    // Filter active Bi-Annual contracts nearing/past 6-month installment date that haven't been cleared
    const midYearReminders = contracts
        .filter(c => ['Approved', 'Open-Billed', 'Open-Unbilled'].includes(c.status) && c.payment_frequency === 'Bi-Annual')
        .filter(c => !clearedIds.includes(String(c.id)))
        .map(c => {
            let startDate = c.start_date ? new Date(c.start_date) : null;
            if (!startDate && c.expiry_date) {
                const exp = new Date(c.expiry_date);
                startDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            }
            if (!startDate) return null;

            // 2nd installment date: 6 months after start_date
            const midYearDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, startDate.getDate());
            const diffDays = Math.ceil((midYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const totalAmount = Number(c.amount) || 0;
            const installmentAmount = totalAmount / 2;

            return {
                id: c.id,
                contract_number: c.contract_number || 'DRAFT',
                contract_name: c.contract_name || 'Contract',
                company_name: c.company_id ? companyMap.get(String(c.company_id)) || 'N/A' : 'N/A',
                installmentAmount,
                midYearDate,
                daysUntil: diffDays
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.daysUntil <= 60)
        .sort((a, b) => a.daysUntil - b.daysUntil);

    const handleConfirmClear = () => {
        if (!confirmingItem) return;
        setClearedIds(prev => [...prev, String(confirmingItem.id)]);
        setConfirmingItem(null);
    };

    if (isContractsLoading) return null;
    if (midYearReminders.length === 0) return null;

    return (
        <>
            <Card className="mt-6 border-cyan-200 dark:border-cyan-900/40 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        <CardTitle className="text-lg font-semibold">Mid-Year Invoicing Reminders (Bi-Annual Contracts)</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300">
                        {midYearReminders.length} Due for 2nd Installment
                    </Badge>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contract / Client</TableHead>
                                    <TableHead>2nd Installment (50%)</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {midYearReminders.map(item => {
                                    const isOverdue = item.daysUntil < 0;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <Link to={`/contracts/${item.id}`} className="hover:underline text-primary font-semibold">
                                                    {item.contract_name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">{item.company_name} ({item.contract_number})</div>
                                            </TableCell>
                                            <TableCell className="font-semibold font-mono text-cyan-700 dark:text-cyan-300">
                                                {formatGBP(item.installmentAmount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{item.midYearDate.toLocaleDateString('en-GB')}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {isOverdue ? `${Math.abs(item.daysUntil)} days ago` : `${item.daysUntil} days left`}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isOverdue ? (
                                                    <Badge className="bg-rose-500/20 text-rose-700 border-rose-400 dark:text-rose-300 text-xs">
                                                        OVERDUE 2ND INVOICE
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-cyan-500/15 text-cyan-700 border-cyan-400 dark:text-cyan-300 text-xs">
                                                        Due Soon
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                                    onClick={() => setConfirmingItem(item)}
                                                    title="Mark Invoice Sent & Clear Reminder"
                                                >
                                                    <Check className="h-5 w-5" />
                                                    <span className="sr-only">Clear reminder</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog Popup */}
            <Dialog open={!!confirmingItem} onOpenChange={open => !open && setConfirmingItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <Check className="h-5 w-5" />
                            Confirm Invoice Sent
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-foreground">
                            Has the 2nd installment invoice (<strong className="font-mono text-emerald-600">{confirmingItem ? formatGBP(confirmingItem.installmentAmount) : ''}</strong>) been sent to <strong>{confirmingItem?.company_name}</strong> for contract <strong>{confirmingItem?.contract_name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmingItem(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleConfirmClear}
                        >
                            Yes, Invoice Sent
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
