import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ServiceReminderCompleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string) => void;
    title: string;
}

export const ServiceReminderCompleteDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
}: ServiceReminderCompleteDialogProps) => {
    // Default to the current exact time when opened
    const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

    useEffect(() => {
        if (isOpen) {
            setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!date) return;
        const dateObj = new Date(date);
        onConfirm(dateObj.toISOString());
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Complete Service Visit</DialogTitle>
                    <DialogDescription>
                        {title}. When was this service actually performed?
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="completion-date" className="text-right">
                            Actual Date
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="completion-date"
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">Mark Completed</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
