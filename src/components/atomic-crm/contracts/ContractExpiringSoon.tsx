import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router";
import { useGetList } from "ra-core";
import { Loading } from "@/components/admin";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ContractExpiringSoon = () => {
    const [days, setDays] = useState<30 | 60>(30);

    // Calculate target date based on selected days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, isLoading } = useGetList("contracts", {
        pagination: { page: 1, perPage: 5 },
        sort: { field: "expiry_date", order: "ASC" },
        filter: {
            expiry_date_lte: targetDateStr,
            expiry_date_gte: todayStr, // Only future expirations (or today)
            status: ["Open-Unbilled", "Open-Billed", "Approved"]
        },
    });

    if (isLoading) return <Loading />;

    // Use mock data if API returns empty (for visual testing) or show empty state
    const contracts = data && data.length > 0 ? data : [];

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="h-4 w-4" />
                    Expiring Soon
                </CardTitle>
                <div className="flex gap-1">
                    <Button
                        variant={days === 30 ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setDays(30)}
                    >
                        30d
                    </Button>
                    <Button
                        variant={days === 60 ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setDays(60)}
                    >
                        60d
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {contracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground pt-4">No contracts expiring in the next {days} days.</p>
                ) : (
                    <div className="space-y-4 pt-4">
                        {contracts.map((contract: any) => (
                            <div
                                key={contract.id}
                                className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                            >
                                <div className="space-y-1">
                                    <Link
                                        to={`/contracts/${contract.id}/show`}
                                        className="text-sm font-medium leading-none hover:underline"
                                    >
                                        {contract.contract_name || contract.contract_number}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                        {contract.contract_number}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-destructive">
                                        {new Date(contract.expiry_date).toLocaleDateString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(contract.expiry_date), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
