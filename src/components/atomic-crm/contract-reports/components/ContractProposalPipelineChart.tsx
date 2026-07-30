import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyRevenuePoint } from "../types";
import { FileSearch } from "lucide-react";

interface ContractProposalPipelineChartProps {
    data: MonthlyRevenuePoint[];
    proposalMetrics?: {
        grandTotal: number;
        proposalValue: number;
        proposalSentValue: number;
    };
}

export const ContractProposalPipelineChart = ({ data, proposalMetrics }: ContractProposalPipelineChartProps) => {
    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const grandTotal = proposalMetrics?.grandTotal ?? data.reduce((sum, item) => sum + item.revenue, 0);
    const proposalValue = proposalMetrics?.proposalValue ?? 0;
    const proposalSentValue = proposalMetrics?.proposalSentValue ?? 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileSearch className="h-5 w-5 text-purple-600" />
                        Proposals
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground font-medium">
                        <span>Grand Total: <strong className="text-foreground font-mono">{formatGBP(grandTotal)}</strong></span>
                        <span>•</span>
                        <span>Proposal: <strong className="text-purple-600 font-mono">{formatGBP(proposalValue)}</strong></span>
                        <span>•</span>
                        <span>Proposal Sent: <strong className="text-amber-600 font-mono">{formatGBP(proposalSentValue)}</strong></span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
                <div className="h-[360px] w-full">
                    {data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No proposal pipeline data available
                        </div>
                    ) : (
                        <ResponsiveBar
                            data={data}
                            keys={["revenue"]}
                            indexBy="label"
                            margin={{ top: 25, right: 20, bottom: 50, left: 65 }}
                            padding={0.3}
                            colors={["#a855f7"]}
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
                                    <div>Proposal Value: <span className="font-bold text-purple-600 font-mono">{formatGBP(Number(data.revenue))}</span></div>
                                    <div>Proposals Quoted: <span className="font-medium">{data.count}</span></div>
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
