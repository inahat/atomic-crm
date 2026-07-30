import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YoYMetrics } from "../types";
import { History, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ContractYoYSummaryProps {
    yoy: YoYMetrics;
}

export const ContractYoYSummary = ({ yoy }: ContractYoYSummaryProps) => {
    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const isPositive = yoy.yoyGrowthPercent >= 0;

    return (
        <Card className="hidden print:block border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                    <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Year-on-Year (YoY) Executive Performance Breakdown ({yoy.priorYear} vs {yoy.currentYear})
                </CardTitle>
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    isPositive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}>
                    {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {isPositive ? "+" : ""}{yoy.yoyGrowthPercent.toFixed(1)}% YoY Growth
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="grid grid-cols-4 gap-4 text-sm">
                    {/* Current Year Revenue */}
                    <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">{yoy.currentYear} Contract Revenue</div>
                        <div className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                            {formatGBP(yoy.currentYearRevenue)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{yoy.currentYearCount} active/billed contracts</div>
                    </div>

                    {/* Prior Year Revenue */}
                    <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">{yoy.priorYear} Contract Revenue</div>
                        <div className="text-xl font-bold font-mono text-zinc-700 dark:text-zinc-300">
                            {formatGBP(yoy.priorYearRevenue)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{yoy.priorYearCount} contracts</div>
                    </div>

                    {/* Current Year Average Contract */}
                    <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">{yoy.currentYear} Avg. Contract Value</div>
                        <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            {formatGBP(yoy.currentYearAvg)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Per contract commitment</div>
                    </div>

                    {/* Prior Year Average Contract */}
                    <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">{yoy.priorYear} Avg. Contract Value</div>
                        <div className="text-xl font-bold font-mono text-muted-foreground">
                            {formatGBP(yoy.priorYearAvg)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">Historical baseline</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
