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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus } from "lucide-react";
import { Company } from "../types";
import { buildLeadDescription } from "./leadUtils";

interface ContractLeadCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const ContractLeadCreateModal = ({ isOpen, onClose, onSuccess }: ContractLeadCreateModalProps) => {
    const [createDeal] = useCreate();
    const notify = useNotify();

    const { data: companies = [] } = useGetList<Company>("companies", {
        pagination: { page: 1, perPage: 1000 }
    });

    const [leadName, setLeadName] = useState("");
    const [category, setCategory] = useState("Service Agreement");
    const [amount, setAmount] = useState("");
    const [paymentFrequency, setPaymentFrequency] = useState("Annual");
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [companyId, setCompanyId] = useState<string>("none");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadName.trim()) {
            notify("Please enter a Service Lead Title", { type: "error" });
            return;
        }

        setIsSubmitting(true);

        const fullDescription = buildLeadDescription(contactName, contactEmail, paymentFrequency, notes);

        const data: any = {
            name: leadName.trim(),
            amount: Number(amount) || 0,
            expected_closing_date: startDate,
            description: fullDescription,
            stage: "opportunity",
            category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            index: 0
        };

        if (companyId !== "none") {
            data.company_id = Number(companyId) || companyId;
        }

        createDeal(
            "deals",
            { data },
            {
                onSuccess: () => {
                    notify(`Service Lead "${leadName}" created successfully!`, { type: "info" });
                    setIsSubmitting(false);
                    onClose();
                    if (onSuccess) onSuccess();
                    resetForm();
                },
                onError: (err: any) => {
                    notify(`Failed to create lead: ${err.message}`, { type: "error" });
                    setIsSubmitting(false);
                }
            }
        );
    };

    const resetForm = () => {
        setLeadName("");
        setCategory("Service Agreement");
        setAmount("");
        setPaymentFrequency("Annual");
        setContactName("");
        setContactEmail("");
        setCompanyId("none");
        setNotes("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-[520px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <FilePlus className="h-5 w-5 text-indigo-600" />
                            New Lead (Ad-Hoc)
                        </DialogTitle>
                        <DialogDescription>
                            Create an ad-hoc service lead. You can convert it to a client later when moving to proposal stage.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Lead Title & Category */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1.5">
                                <Label htmlFor="leadName" className="text-xs font-semibold">
                                    Lead / Agreement Title <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="leadName"
                                    placeholder="e.g. Acme Corp Service Agreement"
                                    value={leadName}
                                    onChange={e => setLeadName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="category" className="text-xs font-semibold">
                                    Category
                                </Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                                        <SelectItem value="Project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Amount & Frequency */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="amount" className="text-xs font-semibold">
                                    Est. Value (£ Net)
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">£</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="5000"
                                        className="pl-6 font-mono"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="frequency" className="text-xs font-semibold">
                                    Billing Frequency
                                </Label>
                                <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                                    <SelectTrigger id="frequency">
                                        <SelectValue placeholder="Select Frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Annual">Annual (100%)</SelectItem>
                                        <SelectItem value="Bi-Annual">Bi-Annual (50% / 50%)</SelectItem>
                                        <SelectItem value="Quarterly">Quarterly (25% x 4)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Lead Contact Person & Email */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="contactName" className="text-xs font-semibold">
                                    Contact Person (Ad-Hoc)
                                </Label>
                                <Input
                                    id="contactName"
                                    placeholder="John Smith"
                                    value={contactName}
                                    onChange={e => setContactName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="contactEmail" className="text-xs font-semibold">
                                    Contact Email
                                </Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={contactEmail}
                                    onChange={e => setContactEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Optional Client Link */}
                        <div className="space-y-1.5">
                            <Label htmlFor="companyId" className="text-xs font-semibold">
                                Existing Client Profile (Optional)
                            </Label>
                            <Select value={companyId} onValueChange={setCompanyId}>
                                <SelectTrigger id="companyId">
                                    <SelectValue placeholder="-- Select Existing Company --" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Create as Ad-Hoc Lead)</SelectItem>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Target Start Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate" className="text-xs font-semibold">
                                Target Start Date
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* Service Requirements / Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-semibold">
                                Service Notes & Requirements
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Details regarding included hours, SLA requirements..."
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? "Creating Lead..." : "Save Lead"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
