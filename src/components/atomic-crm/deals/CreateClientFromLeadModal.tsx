import { useState, useEffect } from "react";
import { useGetList } from "ra-core";
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
import { Building2, UserPlus, Link as LinkIcon } from "lucide-react";
import { Deal, Company } from "../types";
import { useContractLeadConverter } from "./useContractLeadConverter";
import { extractLeadInfo } from "./leadUtils";
import { CompanyCombobox } from "../companies/CompanyCombobox";

interface CreateClientFromLeadModalProps {
    deal: Deal | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CreateClientFromLeadModal = ({ deal, isOpen, onClose, onSuccess }: CreateClientFromLeadModalProps) => {
    const { convertLeadToClient, linkLeadToExistingClient } = useContractLeadConverter();

    const { data: companies = [] } = useGetList<Company>("companies", {
        pagination: { page: 1, perPage: 1000 }
    });

    const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

    const [companyName, setCompanyName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (deal) {
            const leadInfo = extractLeadInfo(deal.description);
            const rawContact = deal.lead_contact_name || leadInfo.contactName || "";
            const rawEmail = deal.lead_contact_email || leadInfo.contactEmail || "";

            const cleanTitle = deal.name.replace(/(contract|service|annual|sla|agreement|lead)/gi, "").trim() || deal.name;
            setCompanyName(cleanTitle);

            const contactParts = rawContact.split(" ");
            setFirstName(contactParts[0] || "");
            setLastName(contactParts.slice(1).join(" ") || "");
            setEmail(rawEmail);

            // Search for an existing company matching title or contact name
            const searchLower = cleanTitle.toLowerCase();
            const matchingCompany = companies.find(c =>
                c.name.toLowerCase().includes(searchLower) ||
                searchLower.includes(c.name.toLowerCase())
            );

            if (matchingCompany) {
                setSelectedCompanyId(String(matchingCompany.id));
                setActiveTab("existing");
            } else if (companies.length > 0) {
                setSelectedCompanyId(String(companies[0].id));
            }
        }
    }, [deal, companies]);

    const handleSubmitExisting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deal || !selectedCompanyId) return;

        setIsSubmitting(true);
        try {
            await linkLeadToExistingClient(deal, Number(selectedCompanyId) || selectedCompanyId);
            setIsSubmitting(false);
            onClose();
            if (onSuccess) onSuccess();
        } catch {
            setIsSubmitting(false);
        }
    };

    const handleSubmitNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deal) return;

        setIsSubmitting(true);
        try {
            await convertLeadToClient(deal, companyName, firstName, lastName, email, phone);
            setIsSubmitting(false);
            onClose();
            if (onSuccess) onSuccess();
        } catch {
            setIsSubmitting(false);
        }
    };

    if (!deal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <UserPlus className="h-5 w-5 text-emerald-600" />
                        Link or Create Client Profile
                    </DialogTitle>
                    <DialogDescription>
                        Link lead <strong>"{deal.name}"</strong> to an existing client or create a brand new client profile.
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Switcher */}
                <div className="flex border-b mb-2">
                    <button
                        type="button"
                        className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition-colors flex items-center justify-center gap-1.5 ${
                            activeTab === "existing"
                                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setActiveTab("existing")}
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                        Link Existing Client
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition-colors flex items-center justify-center gap-1.5 ${
                            activeTab === "new"
                                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setActiveTab("new")}
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Create New Client
                    </button>
                </div>

                {activeTab === "existing" ? (
                    <form onSubmit={handleSubmitExisting}>
                        <div className="space-y-4 py-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                                    Select Existing Client / Company <span className="text-rose-500">*</span>
                                </Label>
                                <CompanyCombobox
                                    companies={companies}
                                    value={selectedCompanyId}
                                    onChange={setSelectedCompanyId}
                                    placeholder="Type first or last name to filter..."
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !selectedCompanyId}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isSubmitting ? "Linking..." : "Link Existing Client"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleSubmitNew}>
                        <div className="space-y-4 py-3">
                            {/* Company Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="companyName" className="text-xs font-semibold flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                                    New Client / Company Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="companyName"
                                    placeholder="e.g. Acme Corporation"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Primary Contact Name */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="firstName" className="text-xs font-semibold">
                                        Contact First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="lastName" className="text-xs font-semibold">
                                        Contact Last Name
                                    </Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Smith"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="clientEmail" className="text-xs font-semibold">
                                        Work Email
                                    </Label>
                                    <Input
                                        id="clientEmail"
                                        type="email"
                                        placeholder="john@acme.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="clientPhone" className="text-xs font-semibold">
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="clientPhone"
                                        placeholder="+44 20 1234 5678"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isSubmitting ? "Creating Client..." : "Create & Link New Client"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
