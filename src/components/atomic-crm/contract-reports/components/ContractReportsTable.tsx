import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetList } from "ra-core";
import { FileText, Eye, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface ContractReportsTableProps {
    contracts: any[];
}

export const ContractReportsTable = ({ contracts }: ContractReportsTableProps) => {
    const { data: companies = [] } = useGetList("companies", {
        pagination: { page: 1, perPage: 1000 }
    });

    const companyMap = useMemo(() => {
        const map = new Map<string, string>();
        companies.forEach((c) => map.set(String(c.id), c.name));
        return map;
    }, [companies]);

    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">Approved</Badge>;
            case "Open-Billed":
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20">Open-Billed</Badge>;
            case "Open-Unbilled":
                return <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20">Open-Unbilled</Badge>;
            case "Proposal-Sent":
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20">Proposal-Sent</Badge>;
            case "Proposal":
            case "Proposed":
                return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/15">Proposal</Badge>;
            case "VIP":
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20">VIP</Badge>;
            case "Rejected":
                return <Badge variant="outline" className="text-muted-foreground">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const getPaymentBadge = (c: any) => {
        const startDate = c.start_date ? new Date(c.start_date) : null;
        const expDate = c.expiry_date ? new Date(c.expiry_date) : null;
        const isStarted = startDate ? startDate <= now : (expDate ? (expDate.getTime() - now.getTime()) < (365 * 24 * 60 * 60 * 1000) : true);

        // Check for Bi-Annual Mid-Year 2nd Installment Due
        if (c.payment_frequency === "Bi-Annual" && startDate) {
            const midYearDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, startDate.getDate());
            const diffDaysMid = Math.ceil((midYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDaysMid <= 30 && diffDaysMid >= -180) {
                return (
                    <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20 gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Mid-Year 2nd Invoice (50%)
                    </Badge>
                );
            }
        }

        if (c.status === "Open-Billed") {
            if (isStarted) {
                const daysOverdue = startDate ? Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                return (
                    <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1 font-semibold">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        OVERDUE {daysOverdue > 0 ? `(${daysOverdue}d)` : ""}
                    </Badge>
                );
            }
            return (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20 gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    Invoice Sent
                </Badge>
            );
        }

        if (c.status === "Open-Unbilled") {
            if (isStarted) {
                return (
                    <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1 font-semibold">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        UNBILLED OVERDUE
                    </Badge>
                );
            }
            return (
                <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20 gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    Needs Invoicing
                </Badge>
            );
        }

        if (c.status === "Approved" || c.status === "VIP") {
            return (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    Paid & Active
                </Badge>
            );
        }

        return <span className="text-muted-foreground text-xs">—</span>;
    };

    return (
        <Card className="print:hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Filtered Contracts Summary ({contracts.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                            <tr>
                                <th className="py-3 px-4">No.</th>
                                <th className="py-3 px-4">Contract Name</th>
                                <th className="py-3 px-4">Client</th>
                                <th className="py-3 px-4">Expiry Date</th>
                                <th className="py-3 px-4 text-right">Net Value</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Invoicing / Payment</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-6 text-muted-foreground text-sm">
                                        No contracts found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((c) => {
                                    const companyName = companyMap.get(String(c.company_id)) || "N/A";
                                    const expDateStr = c.expiry_date
                                        ? new Date(c.expiry_date).toLocaleDateString("en-GB")
                                        : "—";

                                    return (
                                        <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="py-3 px-4 font-mono text-xs font-medium text-muted-foreground">
                                                {c.contract_number || "DRAFT"}
                                            </td>
                                            <td className="py-3 px-4 font-medium">
                                                <Link to={`/contracts/${c.id}`} className="hover:underline text-primary">
                                                    {c.contract_name}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">{companyName}</td>
                                            <td className="py-3 px-4 text-xs font-mono">{expDateStr}</td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold">
                                                {formatGBP(Number(c.amount) || 0)}
                                            </td>
                                            <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                                            <td className="py-3 px-4">{getPaymentBadge(c)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1">
                                                    <Link to={`/contracts/${c.id}`}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
