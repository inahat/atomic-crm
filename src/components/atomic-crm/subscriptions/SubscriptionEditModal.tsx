import { useState, useEffect } from "react";
import { useUpdate, useNotify } from "ra-core";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat, CheckCircle2 } from "lucide-react";
import { Subscription, SubscriptionType } from "../types";
import { SUBSCRIPTION_TYPES } from "./SubscriptionCreateModal";

interface SubscriptionEditModalProps {
    subscription: Subscription | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const SubscriptionEditModal = ({ subscription, isOpen, onClose, onSuccess }: SubscriptionEditModalProps) => {
    const [updateSubscription] = useUpdate();
    const notify = useNotify();

    const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>("Control4 4Sight");
    const [title, setTitle] = useState<string>("");
    const [amount, setAmount] = useState<string>("0");
    const [frequency, setFrequency] = useState<string>("Annual");
    const [renewalDate, setRenewalDate] = useState<string>("");
    const [status, setStatus] = useState<string>("Active");
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (subscription) {
            setSubscriptionType((subscription.subscription_type as SubscriptionType) || "Control4 4Sight");
            setTitle(subscription.title || "");
            setAmount(String(subscription.amount || 0));
            setFrequency(subscription.billing_frequency || "Annual");
            setRenewalDate(subscription.renewal_date ? subscription.renewal_date.split("T")[0] : "");
            setStatus(subscription.status || "Active");
            setNotes(subscription.notes || "");
        }
    }, [subscription]);

    const handleRenewOneYear = () => {
        if (!renewalDate) return;
        const current = new Date(renewalDate);
        current.setFullYear(current.getFullYear() + 1);
        setRenewalDate(current.toISOString().split("T")[0]);
        setStatus("Active");
        notify("Advanced renewal date by 1 year", { type: "info" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscription || !title) return;

        setIsSubmitting(true);

        const updatedData = {
            ...subscription,
            subscription_type: subscriptionType,
            title,
            amount: Number(amount) || 0,
            billing_frequency: frequency,
            renewal_date: renewalDate,
            status,
            notes,
            updated_at: new Date().toISOString()
        };

        try {
            await new Promise((resolve, reject) => {
                updateSubscription(
                    "subscriptions",
                    { id: subscription.id, data: updatedData, previousData: subscription },
                    { onSuccess: resolve, onError: reject }
                );
            });

            notify(`Updated subscription "${title}"`, { type: "info" });
            setIsSubmitting(false);
            onClose();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            notify(`Error updating subscription: ${err.message}`, { type: "error" });
            setIsSubmitting(false);
        }
    };

    if (!subscription) return null;

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Repeat className="h-5 w-5 text-indigo-600" />
                        Edit Subscription
                    </DialogTitle>
                    <DialogDescription>
                        Update renewal details or extend subscription validity.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-2">
                        {/* Quick Renew Button */}
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between dark:bg-indigo-950/40 dark:border-indigo-900">
                            <div>
                                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Extend Renewal</h4>
                                <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Advance next renewal date by +1 Year</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                                onClick={handleRenewOneYear}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                                Renew +1 Year
                            </Button>
                        </div>

                        {/* Subscription Type & Frequency */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="editType" className="text-xs font-semibold">
                                    Subscription Type
                                </Label>
                                <Select value={subscriptionType} onValueChange={(v) => setSubscriptionType(v as SubscriptionType)}>
                                    <SelectTrigger id="editType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBSCRIPTION_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editFreq" className="text-xs font-semibold">
                                    Billing Frequency
                                </Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger id="editFreq">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Annual">Annual</SelectItem>
                                        <SelectItem value="Bi-Annual">Bi-Annual</SelectItem>
                                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="editTitle" className="text-xs font-semibold">
                                Title / Name
                            </Label>
                            <Input
                                id="editTitle"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Amount, Date & Status */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="editAmount" className="text-xs font-semibold">
                                    Charge (£)
                                </Label>
                                <Input
                                    id="editAmount"
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editRenewalDate" className="text-xs font-semibold">
                                    Next Renewal Date
                                </Label>
                                <Input
                                    id="editRenewalDate"
                                    type="date"
                                    value={renewalDate}
                                    onChange={e => setRenewalDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="editStatus" className="text-xs font-semibold">
                                    Status
                                </Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="editStatus">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Pending Renewal">Pending Renewal</SelectItem>
                                        <SelectItem value="Renewed">Renewed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="editNotes" className="text-xs font-semibold">
                                Notes / License Key
                            </Label>
                            <Input
                                id="editNotes"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
