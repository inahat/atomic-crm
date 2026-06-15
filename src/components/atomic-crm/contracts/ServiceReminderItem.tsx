import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { Contract } from "../types";

interface ServiceReminderItemProps {
    contract: Contract;
    type: 'mid' | 'end';
    label: string;
    labelColorClass: string;
    onAction: (id: string | number, type: 'mid' | 'end', action: 'booked' | 'completed' | 'dismissed') => void;
}

export const ServiceReminderItem = ({ contract, type, label, labelColorClass, onAction }: ServiceReminderItemProps) => {
    const status = type === 'mid' ? contract.mid_year_service_status : contract.end_year_service_status;
    const date = type === 'mid' ? contract.mid_year_service_date : contract.end_year_service_date;
    const isBooked = status === 'booked';

    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-1">
                <Link to={`/contracts/${contract.id}`} className="block text-sm font-medium hover:underline">
                    {contract.contract_name}
                </Link>
                <div className="flex items-center gap-2">
                    <p className={`text-xs ${labelColorClass} font-medium`}>{label}</p>
                    {isBooked && date && (
                        <button
                            type="button"
                            onClick={() => onAction(contract.id, type, 'booked')}
                            title="Click to change date"
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors"
                        >
                            Booked: {format(new Date(date), "MMM d, h:mm a")}
                        </button>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-100 transition-opacity">
                {!isBooked && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onAction(contract.id, type, 'booked')}
                        title="Mark Booked"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onAction(contract.id, type, 'dismissed')}
                    title="Dismiss"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
