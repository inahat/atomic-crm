import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ServiceReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (report: string) => void;
    title: string;
    initialReport?: string;
}

export const ServiceReportDialog = ({
    isOpen,
    onClose,
    onSave,
    title,
    initialReport,
}: ServiceReportDialogProps) => {
    const [report, setReport] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setReport(initialReport || "");
        }
    }, [isOpen, initialReport]);

    const handleSave = () => {
        onSave(report);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Service Report</DialogTitle>
                    <DialogDescription>
                        {title}. Enter the details of the service performed.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="report">Report Details</Label>
                        <Textarea
                            id="report"
                            placeholder="Enter service details, observations, and tasks completed..."
                            className="min-h-[200px]"
                            value={report}
                            onChange={(e) => setReport(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
