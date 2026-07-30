import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskCategoryBreakdown, ContractRiskItem } from "../types";
import { FileText, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface ContractRiskBreakdownProps {
    risk: RiskCategoryBreakdown;
}

interface RiskCardItemProps {
    categoryKey: string;
    label: string;
    count: number;
    value: number;
    icon: any;
    badgeBg: string;
    contracts: ContractRiskItem[];
    formatGBP: (val: number) => string;
}

const RiskCardItem = ({
    label,
    count,
    value,
    icon: Icon,
    badgeBg,
    contracts,
    formatGBP
}: RiskCardItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                    className={`flex items-center justify-between rounded-lg border p-3.5 transition-all cursor-pointer hover:shadow-md ${badgeBg}`}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                        </div>
                        <div className="text-lg font-bold">
                            {count} <span className="text-xs font-normal">contracts</span>
                        </div>
                    </div>
                    <div className="text-right font-semibold text-sm">
                        {formatGBP(value)}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="w-96 p-4 shadow-xl"
                align="start"
            >
                <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Icon className="h-4 w-4 shrink-0" />
                            {label} ({count})
                        </h4>
                        <span className="font-bold text-xs font-mono">{formatGBP(value)}</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
                        {contracts.length === 0 ? (
                            <p className="text-muted-foreground py-2 text-center">No contracts in this category.</p>
                        ) : (
                            contracts.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-start justify-between p-2 rounded border bg-muted/40 hover:bg-muted transition-colors"
                                >
                                    <div className="space-y-0.5 pr-2">
                                        <div className="font-medium text-foreground flex items-center gap-1">
                                            <span>{c.contract_name}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground">({c.contract_number})</span>
                                        </div>
                                        <div className="text-muted-foreground text-[11px]">{c.company_name}</div>
                                    </div>
                                    <div className="text-right space-y-1 shrink-0">
                                        <div className="font-semibold font-mono">{formatGBP(c.amount)}</div>
                                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                                            {c.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const ContractRiskBreakdown = ({ risk }: ContractRiskBreakdownProps) => {
    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const categories = [
        {
            key: "open",
            label: "Open (Billed & Unbilled)",
            count: risk.open.count,
            value: risk.open.value,
            icon: FileText,
            badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
            contracts: risk.open.contracts
        },
        {
            key: "critical",
            label: "Critical (Expiring < 30 days)",
            count: risk.critical.count,
            value: risk.critical.value,
            icon: AlertTriangle,
            badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            contracts: risk.critical.contracts
        },
        {
            key: "warning",
            label: "Warning (Expiring 30 - 60 days)",
            count: risk.warning.count,
            value: risk.warning.value,
            icon: Clock,
            badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            contracts: risk.warning.contracts
        },
        {
            key: "healthy",
            label: "Healthy (> 60 days remaining)",
            count: risk.healthy.count,
            value: risk.healthy.value,
            icon: CheckCircle2,
            badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            contracts: risk.healthy.contracts
        }
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                    Contract Renewal & Expiry Risk Assessment (Hover for details)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {categories.map((cat) => (
                        <RiskCardItem
                            key={cat.key}
                            categoryKey={cat.key}
                            label={cat.label}
                            count={cat.count}
                            value={cat.value}
                            icon={cat.icon}
                            badgeBg={cat.badgeBg}
                            contracts={cat.contracts}
                            formatGBP={formatGBP}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
