import { useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AIChat } from "./AIChat";
import { cn } from "@/lib/utils";

export function AIChatWidget() {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className={cn(
                            "h-12 w-12 rounded-full shadow-lg transition-all duration-300",
                            open ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
                        )}
                    >
                        {open ? <X className="h-6 w-6" /> : <MessageSquareText className="h-6 w-6" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[400px] p-0 mr-4 mb-2 shadow-2xl border-none bg-transparent"
                    side="top"
                    align="end"
                    sideOffset={10}
                >
                    <AIChat className="h-[500px] border" />
                </PopoverContent>
            </Popover>
        </div>
    );
}
