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

interface ServiceReminderBookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string) => void;
    title: string;
    initialDate?: string;
}

export const ServiceReminderBookingDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    initialDate,
}: ServiceReminderBookingDialogProps) => {
    const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

    useEffect(() => {
        if (isOpen && initialDate) {
            setDate(format(new Date(initialDate), "yyyy-MM-dd'T'HH:mm"));
        } else if (isOpen) {
            setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        }
    }, [isOpen, initialDate]);

    const handleConfirm = () => {
        // Ensure we have a valid date
        if (!date) return;

        // Create a date object and convert to ISO string
        const dateObj = new Date(date);
        onConfirm(dateObj.toISOString());
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Book Service</DialogTitle>
                    <DialogDescription>
                        {title}. Please confirm the date and time for the booking.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="booking-date" className="text-right">
                            Date & Time
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="booking-date"
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
                    <Button onClick={handleConfirm}>Confirm Booking</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
