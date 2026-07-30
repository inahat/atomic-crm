import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, AlertTriangle, Wrench, Download, Printer } from "lucide-react";

interface ContractExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportFinancial: () => void;
    onExportExpiryRisk: () => void;
    onExportOperational: () => void;
    onExportMasterClean: () => void;
    recordCount: number;
}

export const ContractExportModal = ({
    isOpen,
    onClose,
    onExportFinancial,
    onExportExpiryRisk,
    onExportOperational,
    onExportMasterClean,
    recordCount
}: ContractExportModalProps) => {
    const [selectedType, setSelectedType] = useState<string>("financial");

    const handleExport = () => {
        if (selectedType === "pdf") {
            onClose();
            setTimeout(() => {
                window.print();
            }, 200);
            return;
        }

        switch (selectedType) {
            case "financial":
                onExportFinancial();
                break;
            case "expiry":
                onExportExpiryRisk();
                break;
            case "operational":
                onExportOperational();
                break;
            case "master":
                onExportMasterClean();
                break;
        }
        onClose();
    };

    const options = [
        {
            id: "financial",
            title: "Financial & Revenue Schedule Report (CSV)",
            description: "Calculates Net Amount, VAT (20%), Grand Total, and payment terms breakdown.",
            icon: FileSpreadsheet,
            badge: "Accounting"
        },
        {
            id: "expiry",
            title: "Contract Expiry & Renewal Risk Report (CSV)",
            description: "Surfaces primary contacts, days remaining, and categorizes renewal risk.",
            icon: AlertTriangle,
            badge: "Account Managers"
        },
        {
            id: "operational",
            title: "Operational & Included Hours Report (CSV)",
            description: "Includes monthly/annual included hours, OvrC links, and service parameters.",
            icon: Wrench,
            badge: "Operations"
        },
        {
            id: "master",
            title: "Clean Master Export (CSV)",
            description: "Exports all contract fields with resolved client names and stripped JSON blobs.",
            icon: Download,
            badge: "Audit"
        },
        {
            id: "pdf",
            title: "Print / Save Executive PDF Presentation",
            description: "Formats the active analytics dashboard and charts for senior executive review.",
            icon: Printer,
            badge: "Executive"
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] print:hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Download className="h-5 w-5 text-primary" />
                        Export Contract Reports
                    </DialogTitle>
                    <DialogDescription>
                        Select a report profile to output {recordCount} filtered contract records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    {options.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedType === opt.id;
                        return (
                            <div
                                key={opt.id}
                                onClick={() => setSelectedType(opt.id)}
                                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                                    isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "hover:bg-muted/50"
                                }`}
                            >
                                <div className={`mt-0.5 rounded-md p-2 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{opt.title}</span>
                                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                                            {opt.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport}>
                        Generate Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
