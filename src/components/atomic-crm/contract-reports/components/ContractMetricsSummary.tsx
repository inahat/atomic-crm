import { useState } from "react";
import { MetricCard } from "./MetricCard";
import { ContractMetrics, OverdueContractSummary, ActiveContractSummary } from "../types";
import { PoundSterling, AlertCircle, FileCheck, Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface ContractMetricsSummaryProps {
    metrics: ContractMetrics;
    overdueContracts: OverdueContractSummary[];
    activeContracts: ActiveContractSummary[];
}

export const ContractMetricsSummary = ({ metrics, overdueContracts, activeContracts }: ContractMetricsSummaryProps) => {
    const [isOverdueHovered, setIsOverdueHovered] = useState(false);
    const [isActiveHovered, setIsActiveHovered] = useState(false);

    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const totalOutstandingValue = metrics.overdueBilledValue + metrics.unbilledActiveValue;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Value */}
            <MetricCard
                title="Total Value"
                value={formatGBP(metrics.staticTcvNet)}
                subtext={`Approved/Billed (inc. VAT: ${formatGBP(metrics.staticTcvGrand)})`}
                icon={PoundSterling}
                variant="default"
            />
            
            {/* Card 2: Overdue & Outstanding Invoices */}
            <Popover open={isOverdueHovered} onOpenChange={setIsOverdueHovered}>
                <PopoverTrigger asChild>
                    <div
                        onMouseEnter={() => setIsOverdueHovered(true)}
                        onMouseLeave={() => setIsOverdueHovered(false)}
                        className="cursor-pointer"
                    >
                        <MetricCard
                            title="Overdue & Outstanding"
                            value={formatGBP(totalOutstandingValue)}
                            subtext={`${metrics.overdueBilledCount} overdue billed • ${metrics.unbilledActiveCount} unbilled active (Hover for details)`}
                            icon={AlertCircle}
                            variant={metrics.overdueBilledCount > 0 ? "danger" : "warning"}
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    onMouseEnter={() => setIsOverdueHovered(true)}
                    onMouseLeave={() => setIsOverdueHovered(false)}
                    className="w-96 p-4 shadow-xl border-rose-200 dark:border-rose-900"
                    align="start"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4" />
                                Overdue & Outstanding ({overdueContracts.length})
                            </h4>
                            <span className="font-bold text-xs font-mono">{formatGBP(totalOutstandingValue)}</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
                            {overdueContracts.length === 0 ? (
                                <p className="text-muted-foreground py-2 text-center">No overdue or outstanding invoices.</p>
                            ) : (
                                overdueContracts.map(c => (
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
                                            {c.status === 'Open-Billed' ? (
                                                <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] py-0 px-1 font-semibold">
                                                    OVERDUE ({c.daysOverdue}d)
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20 text-[10px] py-0 px-1">
                                                    Needs Invoicing
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Card 3: Active Contracts */}
            <Popover open={isActiveHovered} onOpenChange={setIsActiveHovered}>
                <PopoverTrigger asChild>
                    <div
                        onMouseEnter={() => setIsActiveHovered(true)}
                        onMouseLeave={() => setIsActiveHovered(false)}
                        className="cursor-pointer"
                    >
                        <MetricCard
                            title="Active Contracts"
                            value={metrics.activeContractsCount}
                            subtext="Approved, Open-Billed, Open-Unbilled (Hover for details)"
                            icon={FileCheck}
                            variant="default"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    onMouseEnter={() => setIsActiveHovered(true)}
                    onMouseLeave={() => setIsActiveHovered(false)}
                    className="w-96 p-4 shadow-xl border-emerald-200 dark:border-emerald-900"
                    align="start"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <FileCheck className="h-4 w-4" />
                                Active Contracts ({activeContracts.length})
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-medium">Strictly Approved/Billed/Unbilled</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-xs">
                            {activeContracts.length === 0 ? (
                                <p className="text-muted-foreground py-2 text-center">No active contracts.</p>
                            ) : (
                                activeContracts.map(c => (
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

            {/* Card 4: Average Contract Price */}
            <MetricCard
                title="Average Contract Price"
                value={formatGBP(metrics.averageContractValue)}
                subtext="Across active contract commitments"
                icon={Calculator}
                variant="success"
            />
        </div>
    );
};
