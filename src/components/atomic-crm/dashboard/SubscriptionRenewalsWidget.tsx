import { useState, useMemo } from "react";
import { useGetList, useNotify } from "ra-core";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repeat, AlertCircle, Calendar, CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router";
import { Subscription, Company } from "../types";
import { RenewSubscriptionModal } from "../subscriptions/RenewSubscriptionModal";

export const SubscriptionRenewalsWidget = () => {
    const notify = useNotify();
    const [renewingSubscription, setRenewingSubscription] = useState<{ subscription: Subscription; companyName?: string } | null>(null);

    const { data: subscriptions = [], refetch } = useGetList<Subscription>("subscriptions", {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "renewal_date", order: "ASC" }
    });

    const { data: companies = [] } = useGetList<Company>("companies", {
        pagination: { page: 1, perPage: 1000 }
    });

    const companyMap = useMemo(() => {
        const map = new Map<string, string>();
        companies.forEach(c => map.set(String(c.id), c.name));
        return map;
    }, [companies]);

    // Categorize into <30 days and 31-60 days
    const { under30, under60, total30Value, total60Value } = useMemo(() => {
        const now = new Date();
        const u30: Subscription[] = [];
        const u60: Subscription[] = [];
        let val30 = 0;
        let val60 = 0;

        subscriptions.forEach(sub => {
            if (!sub.renewal_date) return;
            const daysLeft = differenceInDays(new Date(sub.renewal_date), now);

            if (daysLeft <= 30) {
                u30.push(sub);
                val30 += Number(sub.amount) || 0;
            } else if (daysLeft <= 60) {
                u60.push(sub);
                val60 += Number(sub.amount) || 0;
            }
        });

        return {
            under30: u30,
            under60: u60,
            total30Value: val30,
            total60Value: val60
        };
    }, [subscriptions]);

    // Quick renew handler trigger
    const handleQuickRenew = (sub: Subscription, clientName: string) => {
        setRenewingSubscription({ subscription: sub, companyName: clientName });
    };

    return (
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <Repeat className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold tracking-tight">Subscription Renewal Reminders</h2>
                        <p className="text-xs text-muted-foreground">
                            Control4 4Sight, Re:Sure, 2n Intercom, Security, Fire renewals due within 30 &amp; 60 days
                        </p>
                    </div>
                </div>

                <Link to="/subscriptions">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                        View All
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            </div>

            {/* Metrics Header */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                            Under 30 Days ({under30.length})
                        </span>
                        <Badge className="bg-rose-600 text-white text-[10px]">Urgent</Badge>
                    </div>
                    <div className="text-lg font-bold text-rose-900 dark:text-rose-200">
                        £{total30Value.toLocaleString()}
                    </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-amber-600" />
                            31 - 60 Days ({under60.length})
                        </span>
                        <Badge className="bg-amber-500 text-white text-[10px]">Upcoming</Badge>
                    </div>
                    <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                        £{total60Value.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Subscriptions List */}
            {under30.length === 0 && under60.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
                    No subscriptions requiring renewal in the next 60 days.
                </div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {/* Render < 30 Days Subscriptions */}
                    {under30.map(sub => {
                        const daysLeft = differenceInDays(new Date(sub.renewal_date), new Date());
                        const clientName = companyMap.get(String(sub.company_id)) || "Unassigned Client";

                        return (
                            <div
                                key={sub.id}
                                className="p-3 rounded-lg border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900 flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                        <span>{sub.title}</span>
                                        <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-700 border-rose-300">
                                            {sub.subscription_type}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {clientName}
                                        </span>
                                        <span>• Due: {format(new Date(sub.renewal_date), "dd MMM yyyy")}</span>
                                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                                            ({daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} days left`})
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-sm text-foreground">£{Number(sub.amount || 0).toLocaleString()}</span>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1"
                                        onClick={() => handleQuickRenew(sub, clientName)}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Renew
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Render 31 - 60 Days Subscriptions */}
                    {under60.map(sub => {
                        const daysLeft = differenceInDays(new Date(sub.renewal_date), new Date());
                        const clientName = companyMap.get(String(sub.company_id)) || "Unassigned Client";

                        return (
                            <div
                                key={sub.id}
                                className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900 flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                        <span>{sub.title}</span>
                                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                                            {sub.subscription_type}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            {clientName}
                                        </span>
                                        <span>• Due: {format(new Date(sub.renewal_date), "dd MMM yyyy")}</span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                            ({daysLeft} days left)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-sm text-foreground">£{Number(sub.amount || 0).toLocaleString()}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 gap-1 font-semibold"
                                        onClick={() => handleQuickRenew(sub, clientName)}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Renew
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <RenewSubscriptionModal
                subscription={renewingSubscription?.subscription || null}
                companyName={renewingSubscription?.companyName}
                isOpen={!!renewingSubscription}
                onClose={() => setRenewingSubscription(null)}
                onSuccess={refetch}
            />
        </div>
    );
};
