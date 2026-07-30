import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyRevenuePoint } from "../types";
import { TrendingUp, Download } from "lucide-react";

interface ContractMonthlyRevenueChartProps {
    data: MonthlyRevenuePoint[];
    onExportCSV?: () => void;
}

export const ContractMonthlyRevenueChart = ({ data, onExportCSV }: ContractMonthlyRevenueChartProps) => {
    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const grandTotal = data.reduce((sum, item) => sum + item.revenue, 0);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        Contract Revenue by Month
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">
                        Grand Total: <span className="font-bold text-foreground font-mono">{formatGBP(grandTotal)}</span> (Installment-Aware Schedule)
                    </p>
                </div>
                {onExportCSV && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 print:hidden"
                        onClick={onExportCSV}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 pt-4">
                <div className="h-[360px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No monthly revenue data available
                        </div>
                    ) : (
                        <ResponsiveBar
                            data={data}
                            keys={["revenue"]}
                            indexBy="label"
                            margin={{ top: 25, right: 20, bottom: 50, left: 65 }}
                            padding={0.3}
                            colors={["#10b981"]}
                            borderRadius={4}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: "Month",
                                legendPosition: "middle",
                                legendOffset: 40
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                format: value => `£${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(0)}k` : value}`
                            }}
                            enableLabel={false}
                            theme={{
                                axis: {
                                    ticks: {
                                        text: { fontSize: 11, fontWeight: 500 }
                                    },
                                    legend: {
                                        text: { fontSize: 12, fontWeight: 600 }
                                    }
                                }
                            }}
                            tooltip={({ data }) => (
                                <div className="rounded-lg border bg-popover p-2.5 shadow-md text-xs text-popover-foreground">
                                    <div className="font-semibold">{data.label}</div>
                                    <div>Cash Flow Revenue: <span className="font-bold text-emerald-600 font-mono">{formatGBP(Number(data.revenue))}</span></div>
                                    <div>Installments / Contracts: <span className="font-medium">{data.count}</span></div>
                                </div>
                            )}
                            animate={true}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
