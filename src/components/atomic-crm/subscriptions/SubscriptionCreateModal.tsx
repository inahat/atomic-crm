import { useState } from "react";
import { useCreate, useGetList, useNotify } from "ra-core";
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
import { Repeat, Building2 } from "lucide-react";
import { Company, SubscriptionType } from "../types";
import { CompanyCombobox } from "../companies/CompanyCombobox";

export const SUBSCRIPTION_TYPES: SubscriptionType[] = [
    'Control4 4Sight',
    'Re:Sure',
    '2n Intercom',
    'Security',
    'Fire'
];

interface SubscriptionCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const SubscriptionCreateModal = ({ isOpen, onClose, onSuccess }: SubscriptionCreateModalProps) => {
    const [createSubscription] = useCreate();
    const notify = useNotify();

    const { data: companies = [] } = useGetList<Company>("companies", {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "name", order: "ASC" }
    });

    const [companyId, setCompanyId] = useState<string>("");
    const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>("Control4 4Sight");
    const [title, setTitle] = useState<string>("");
    const [amount, setAmount] = useState<string>("100");
    const [frequency, setFrequency] = useState<string>("Annual");
    const [renewalDate, setRenewalDate] = useState<string>(
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0]
    );
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleCompanyChange = (val: string) => {
        setCompanyId(val);
        const comp = companies.find(c => String(c.id) === val);
        if (comp) {
            setTitle(`${subscriptionType} - ${comp.name}`);
        }
    };

    const handleTypeChange = (val: SubscriptionType) => {
        setSubscriptionType(val);
        const comp = companies.find(c => String(c.id) === companyId);
        if (comp) {
            setTitle(`${val} - ${comp.name}`);
        } else {
            setTitle(`${val} Subscription`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId || !title) return;

        setIsSubmitting(true);

        const payload = {
            company_id: Number(companyId) || companyId,
            subscription_type: subscriptionType,
            title: title || `${subscriptionType} Subscription`,
            amount: Number(amount) || 0,
            billing_frequency: frequency,
            renewal_date: renewalDate,
            status: "Active",
            notes: notes || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            await new Promise((resolve, reject) => {
                createSubscription(
                    "subscriptions",
                    { data: payload },
                    { onSuccess: resolve, onError: reject }
                );
            });

            notify(`Successfully created subscription "${title}"`, { type: "info" });
            setIsSubmitting(false);
            onClose();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            notify(`Error creating subscription: ${err.message}`, { type: "error" });
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Repeat className="h-5 w-5 text-indigo-600" />
                        Add Client Subscription
                    </DialogTitle>
                    <DialogDescription>
                        Set up a new recurring client subscription with renewal tracking.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-2">
                        {/* Searchable Client / Company Combobox */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                                Client / Company <span className="text-rose-500">*</span>
                            </Label>
                            <CompanyCombobox
                                companies={companies}
                                value={companyId}
                                onChange={handleCompanyChange}
                                placeholder="Type first or last name to filter..."
                            />
                        </div>

                        {/* Subscription Type & Billing Terms */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="type" className="text-xs font-semibold">
                                    Subscription Type <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={subscriptionType} onValueChange={(v) => handleTypeChange(v as SubscriptionType)}>
                                    <SelectTrigger id="type">
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
                                <Label htmlFor="freq" className="text-xs font-semibold">
                                    Billing Frequency
                                </Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger id="freq">
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

                        {/* Subscription Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-semibold">
                                Subscription Name / Title <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="e.g. Control4 4Sight - Acme Corp"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Amount & Renewal Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="amount" className="text-xs font-semibold">
                                    Renewal Charge Amount (£)
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="100"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="renewalDate" className="text-xs font-semibold">
                                    Next Renewal Date <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="renewalDate"
                                    type="date"
                                    value={renewalDate}
                                    onChange={e => setRenewalDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold">
                                Internal Notes / Serial / Ref
                            </Label>
                            <Input
                                id="notes"
                                placeholder="e.g. License key or account number"
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
                            disabled={isSubmitting || !companyId}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                            {isSubmitting ? "Creating..." : "Save Subscription"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
