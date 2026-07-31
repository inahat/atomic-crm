import { useState } from "react";
import { useUpdate, useCreate, useGetIdentity, useNotify, useDataProvider } from "ra-core";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Repeat, FileText, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { Subscription } from "../types";

interface RenewSubscriptionModalProps {
    subscription: Subscription | null;
    companyName?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const RenewSubscriptionModal = ({
    subscription,
    companyName,
    isOpen,
    onClose,
    onSuccess
}: RenewSubscriptionModalProps) => {
    const notify = useNotify();
    const { identity } = useGetIdentity();
    const dataProvider = useDataProvider();
    const [updateSubscription] = useUpdate();
    const [createTask] = useCreate();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    if (!subscription) return null;

    const currentRenewal = subscription.renewal_date ? new Date(subscription.renewal_date) : new Date();
    const newRenewal = new Date(currentRenewal);
    newRenewal.setFullYear(newRenewal.getFullYear() + 1);
    const newDateStr = newRenewal.toISOString().split("T")[0];

    const handleRenew = async (invoiceRequired: boolean) => {
        setIsSubmitting(true);

        try {
            // 1. Update subscription renewal date (+1 year) and set status to Active
            await new Promise((resolve, reject) => {
                updateSubscription(
                    "subscriptions",
                    {
                        id: subscription.id,
                        data: {
                            ...subscription,
                            renewal_date: newDateStr,
                            status: "Active",
                            updated_at: new Date().toISOString()
                        },
                        previousData: subscription
                    },
                    { onSuccess: resolve, onError: reject }
                );
            });

            // 2. If invoice is required, add a task for the admin
            if (invoiceRequired) {
                let targetContactId = subscription.contact_id || null;

                // 2a. If no contact_id on subscription, try fetching contact for the company (using ra-data-postgrest company_id@eq filter)
                if (!targetContactId && subscription.company_id) {
                    try {
                        const contactsRes = await dataProvider.getList("contacts", {
                            filter: { "company_id@eq": subscription.company_id },
                            pagination: { page: 1, perPage: 1 }
                        });
                        if (contactsRes.data && contactsRes.data.length > 0) {
                            targetContactId = contactsRes.data[0].id;
                        }
                    } catch (e) {
                        // ignore if lookup fails
                    }
                }

                // 2b. Fallback to any contact in the database if no company contact was found
                if (!targetContactId) {
                    try {
                        const anyContactRes = await dataProvider.getList("contacts", {
                            filter: {},
                            pagination: { page: 1, perPage: 1 }
                        });
                        if (anyContactRes.data && anyContactRes.data.length > 0) {
                            targetContactId = anyContactRes.data[0].id;
                        }
                    } catch (e) {
                        // ignore if lookup fails
                    }
                }

                if (!targetContactId) {
                    notify("Cannot create invoice task: No contact available in CRM to attach task to.", { type: "warning" });
                    setIsSubmitting(false);
                    onClose();
                    if (onSuccess) onSuccess();
                    return;
                }

                const taskText = `Send renewal invoice for subscription "${subscription.title}"${companyName ? ` (${companyName})` : ''} - £${subscription.amount || 0}`;

                await new Promise((resolve, reject) => {
                    createTask(
                        "tasks",
                        {
                            data: {
                                text: taskText,
                                type: "Follow-up",
                                due_date: new Date().toISOString(),
                                contact_id: targetContactId,
                                sales_id: identity?.id || null
                            }
                        },
                        { onSuccess: resolve, onError: reject }
                    );
                });

                notify(`Subscription renewed & invoice task added to admin's upcoming tasks!`, { type: "info" });
            } else {
                notify(`Renewed "${subscription.title}" to ${format(newRenewal, "dd MMM yyyy")}`, { type: "info" });
            }

            setIsSubmitting(false);
            onClose();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            notify(`Error renewing subscription: ${err.message}`, { type: "error" });
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && !isSubmitting && onClose()}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Repeat className="h-5 w-5 text-indigo-600" />
                        Renew Subscription (+1 Year)
                    </DialogTitle>
                    <DialogDescription>
                        Advance renewal date by 1 year and manage invoice task creation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Subscription Details Summary */}
                    <div className="p-3.5 rounded-lg bg-card border shadow-xs space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{subscription.title}</span>
                            <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                £{Number(subscription.amount || 0).toLocaleString()} / {subscription.billing_frequency || 'Annual'}
                            </span>
                        </div>

                        {companyName && (
                            <div className="flex items-center gap-1 text-muted-foreground font-medium">
                                <Building2 className="h-3.5 w-3.5" />
                                {companyName}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t text-[11px]">
                            <span className="text-muted-foreground">
                                Current Date: <strong className="text-foreground">{subscription.renewal_date ? format(new Date(subscription.renewal_date), "dd MMM yyyy") : "N/A"}</strong>
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                New Date: {format(newRenewal, "dd MMM yyyy")}
                            </span>
                        </div>
                    </div>

                    {/* Invoice Requirement Query Box */}
                    <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900 space-y-2">
                        <div className="flex items-start gap-2.5">
                            <FileText className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                                    Is an invoice required for this renewal?
                                </h4>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                                    Selecting <strong>"Yes"</strong> will create a task in the admin's upcoming tasks list to generate and send the renewal invoice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="sm:order-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => handleRenew(false)}
                        className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 sm:order-2"
                    >
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                        No, Just Renew
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleRenew(true)}
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold sm:order-3"
                    >
                        <FileText className="h-4 w-4" />
                        {isSubmitting ? "Processing..." : "Yes, Invoice Required"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
