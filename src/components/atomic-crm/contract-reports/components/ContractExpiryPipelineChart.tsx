import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyPipelinePoint } from "../types";
import { CalendarRange } from "lucide-react";

interface ContractExpiryPipelineChartProps {
    data: MonthlyPipelinePoint[];
}

export const ContractExpiryPipelineChart = ({ data }: ContractExpiryPipelineChartProps) => {
    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const grandTotal = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CalendarRange className="h-5 w-5 text-amber-500" />
                        Upcoming Expiry & Renewal Pipeline (12 Months)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">
                        Grand Total: <span className="font-bold text-foreground font-mono">{formatGBP(grandTotal)}</span> (Next 12 Months)
                    </p>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
                <div className="h-[360px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No expiration timeline data available
                        </div>
                    ) : (
                        <ResponsiveBar
                            data={data}
                            keys={["value"]}
                            indexBy="label"
                            margin={{ top: 25, right: 20, bottom: 50, left: 65 }}
                            padding={0.3}
                            colors={["#f59e0b"]}
                            borderRadius={4}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: -30,
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
                                    <div>Expiring Value: <span className="font-bold text-amber-600 font-mono">{formatGBP(Number(data.value))}</span></div>
                                    <div>Contracts: <span className="font-medium">{data.count}</span></div>
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
