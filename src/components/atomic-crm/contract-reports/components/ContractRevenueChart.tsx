import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueByStatusPoint } from "../types";
import { BarChart3 } from "lucide-react";

interface ContractRevenueChartProps {
    data: RevenueByStatusPoint[];
}

export const ContractRevenueChart = ({ data }: ContractRevenueChartProps) => {
    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Revenue Distribution by Status
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
                <div className="h-[320px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No contract data available
                        </div>
                    ) : (
                        <ResponsiveBar
                            data={data}
                            keys={["amount"]}
                            indexBy="status"
                            margin={{ top: 20, right: 20, bottom: 50, left: 70 }}
                            padding={0.3}
                            valueScale={{ type: "linear" }}
                            indexScale={{ type: "band", round: true }}
                            colors={({ data }) => {
                                switch (data.status) {
                                    case "Approved":
                                        return "#10b981"; // Emerald
                                    case "Open-Billed":
                                        return "#3b82f6"; // Blue
                                    case "Open-Unbilled":
                                        return "#06b6d4"; // Cyan
                                    case "Proposal-Sent":
                                        return "#f59e0b"; // Amber
                                    case "Proposal":
                                        return "#8b5cf6"; // Purple
                                    case "VIP":
                                        return "#ec4899"; // Pink
                                    default:
                                        return "#94a3b8"; // Slate
                                }
                            }}
                            borderRadius={4}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: "Status",
                                legendPosition: "middle",
                                legendOffset: 40
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                format: value => `£${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(0)}k` : value}`
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor="#ffffff"
                            label={d => formatGBP(Number(d.value))}
                            tooltip={({ data }) => (
                                <div className="rounded-lg border bg-popover p-2 shadow-md text-xs text-popover-foreground">
                                    <div className="font-semibold">{data.status}</div>
                                    <div>Value: <span className="font-medium text-emerald-600">{data.formattedAmount}</span></div>
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
