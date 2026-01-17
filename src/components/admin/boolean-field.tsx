import * as React from "react";
import { useRecordContext, useTranslate, type FieldProps } from "ra-core";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface BooleanFieldProps extends FieldProps {
    valueLabelTrue?: string;
    valueLabelFalse?: string;
    trueIcon?: React.ReactNode;
    falseIcon?: React.ReactNode;
    loose?: boolean;
}

export const BooleanField = (props: BooleanFieldProps) => {
    const {
        source,
        valueLabelTrue = "ra.boolean.true",
        valueLabelFalse = "ra.boolean.false",
        trueIcon,
        falseIcon,
        loose = false,
        className,
        emptyText,
    } = props;
    const record = useRecordContext(props);
    const translate = useTranslate();

    if (!record || source == null) {
        return null;
    }

    let value = record[source];

    if (loose) {
        value = !!value;
    }

    if (value == null && emptyText) {
        return (
            <span className={cn("text-sm text-muted-foreground", className)}>
                {emptyText}
            </span>
        );
    }

    if (value === false || value === 0 || value === "false" || value === null || value === undefined) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className={cn("flex items-center justify-center text-muted-foreground", className)} aria-label={translate(valueLabelFalse, { _: "False" })}>
                            {falseIcon ?? <X className="h-4 w-4" />}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{translate(valueLabelFalse, { _: "False" })}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (value === true || value === 1 || value === "true") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className={cn("flex items-center justify-center text-primary", className)} aria-label={translate(valueLabelTrue, { _: "True" })}>
                            {trueIcon ?? <Check className="h-4 w-4" />}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{translate(valueLabelTrue, { _: "True" })}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <span className={cn("text-sm", className)}>
            {emptyText}
        </span>
    );
};
