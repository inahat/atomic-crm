import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    badgeText?: string;
    variant?: "default" | "warning" | "danger" | "success";
}

const variantStyles = {
    default: "border-border text-foreground bg-card",
    success: "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-900 dark:text-amber-300",
    danger: "border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-300"
};

const iconStyles = {
    default: "text-muted-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400"
};

export const MetricCard = ({
    title,
    value,
    subtext,
    icon: Icon,
    badgeText,
    variant = "default"
}: MetricCardProps) => {
    return (
        <Card className={`transition-all hover:shadow-md ${variantStyles[variant]}`}>
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {title}
                    </span>
                    <div className={`rounded-lg p-2 bg-muted/40 ${iconStyles[variant]}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold tracking-tight">
                        {value}
                    </span>
                    {badgeText && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                            {badgeText}
                        </span>
                    )}
                </div>
                {subtext && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {subtext}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
