import { useState, useMemo } from "react";
import { useGetList, useUpdate, useNotify } from "ra-core";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Repeat,
    Plus,
    Search,
    AlertCircle,
    Calendar,
    CheckCircle2,
    Edit,
    Building2,
    Shield,
    Flame,
    Tv,
    Lock
} from "lucide-react";
import { Subscription, Company, SubscriptionType } from "../types";
import { SUBSCRIPTION_TYPES, SubscriptionCreateModal } from "./SubscriptionCreateModal";
import { SubscriptionEditModal } from "./SubscriptionEditModal";
import { RenewSubscriptionModal } from "./RenewSubscriptionModal";

export const SubscriptionList = () => {
    const notify = useNotify();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
    const [renewingSubscription, setRenewingSubscription] = useState<{ subscription: Subscription; companyName?: string } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
    const [horizonFilter, setHorizonFilter] = useState<string>("ALL");

    // Fetch subscriptions
    const { data: subscriptions = [], isPending: isSubscriptionsPending, refetch } = useGetList<Subscription>("subscriptions", {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "renewal_date", order: "ASC" }
    });

    // Fetch companies for company name resolution
    const { data: companies = [] } = useGetList<Company>("companies", {
        pagination: { page: 1, perPage: 1000 }
    });

    const companyMap = useMemo(() => {
        const map = new Map<string, string>();
        companies.forEach(c => map.set(String(c.id), c.name));
        return map;
    }, [companies]);

    // Quick renew handler trigger
    const handleQuickRenew = (sub: Subscription, clientName: string) => {
        setRenewingSubscription({ subscription: sub, companyName: clientName });
    };

    // Filter logic
    const filteredSubscriptions = useMemo(() => {
        const now = new Date();

        return subscriptions.filter(sub => {
            // 1. Search text filter
            const companyName = companyMap.get(String(sub.company_id)) || "";
            const matchesSearch =
                !searchQuery ||
                sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sub.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

            // 2. Type filter
            const matchesType = selectedTypeFilter === "ALL" || sub.subscription_type === selectedTypeFilter;

            // 3. Renewal horizon filter
            let matchesHorizon = true;
            if (sub.renewal_date) {
                const daysLeft = differenceInDays(new Date(sub.renewal_date), now);
                if (horizonFilter === "EXPIRED") matchesHorizon = daysLeft < 0;
                else if (horizonFilter === "UNDER_30") matchesHorizon = daysLeft >= 0 && daysLeft <= 30;
                else if (horizonFilter === "UNDER_60") matchesHorizon = daysLeft >= 0 && daysLeft <= 60;
                else if (horizonFilter === "OVER_60") matchesHorizon = daysLeft > 60;
            }

            return matchesSearch && matchesType && matchesHorizon;
        });
    }, [subscriptions, companyMap, searchQuery, selectedTypeFilter, horizonFilter]);

    // Icon helper for subscription type
    const renderTypeIcon = (type: string) => {
        switch (type) {
            case "Control4 4Sight":
                return <Tv className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
            case "Re:Sure":
                return <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
            case "2n Intercom":
                return <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
            case "Security":
                return <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
            case "Fire":
                return <Flame className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
            default:
                return <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
        }
    };

    const getRenewalBadge = (renewalDateStr?: string) => {
        if (!renewalDateStr) return null;
        const now = new Date();
        const daysLeft = differenceInDays(new Date(renewalDateStr), now);

        if (daysLeft < 0) {
            return (
                <Badge variant="destructive" className="gap-1 text-[11px] font-semibold bg-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    Expired ({Math.abs(daysLeft)} days ago)
                </Badge>
            );
        }
        if (daysLeft <= 30) {
            return (
                <Badge className="gap-1 text-[11px] font-semibold bg-rose-500 hover:bg-rose-600 text-white">
                    <AlertCircle className="h-3 w-3" />
                    Renew in {daysLeft} Days (&lt;30)
                </Badge>
            );
        }
        if (daysLeft <= 60) {
            return (
                <Badge className="gap-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-white">
                    <Calendar className="h-3 w-3" />
                    Renew in {daysLeft} Days (&lt;60)
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="gap-1 text-[11px] font-semibold border-emerald-500 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Active ({daysLeft} days)
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <Repeat className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Client Subscriptions</h1>
                  <p className="text-xs text-muted-foreground">
                    Manage recurring client licenses &amp; subscriptions (Control4 4Sight, Re:Sure, 2n Intercom, Security, Fire)
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Subscription
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card p-4 rounded-xl border shadow-sm">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, client, notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Subscription Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Subscription Types</SelectItem>
                {SUBSCRIPTION_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Horizon Filter */}
            <Select value={horizonFilter} onValueChange={setHorizonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Renewal Horizons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Renewal Horizons</SelectItem>
                <SelectItem value="EXPIRED">🚨 Expired</SelectItem>
                <SelectItem value="UNDER_30">🚨 Renewing in &lt; 30 Days</SelectItem>
                <SelectItem value="UNDER_60">⚠️ Renewing in &lt; 60 Days</SelectItem>
                <SelectItem value="OVER_60">🟢 Active (&gt; 60 Days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table View */}
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            {isSubscriptionsPending ? (
              <div className="p-12 text-center text-muted-foreground">Loading subscriptions...</div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <Repeat className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <h3 className="font-semibold text-base">No subscriptions found</h3>
                <p className="text-xs">Create your first client subscription or adjust filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Subscription</th>
                      <th className="py-3 px-4">Client / Company</th>
                      <th className="py-3 px-4">Renewal Date</th>
                      <th className="py-3 px-4">Frequency</th>
                      <th className="py-3 px-4">Annual Charge</th>
                      <th className="py-3 px-4">Status &amp; Reminders</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSubscriptions.map(sub => {
                      const clientName = companyMap.get(String(sub.company_id)) || "Unassigned Client";

                      return (
                        <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                          {/* Title & Type */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-muted border">
                                {renderTypeIcon(sub.subscription_type)}
                              </div>
                              <div>
                                <div className="font-bold text-foreground text-sm">{sub.title}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>{sub.subscription_type}</span>
                                  {sub.notes && <span>• {sub.notes}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Client Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {clientName}
                            </div>
                          </td>

                          {/* Renewal Date */}
                          <td className="py-3.5 px-4 font-medium text-xs">
                            {sub.renewal_date ? format(new Date(sub.renewal_date), "dd MMM yyyy") : "N/A"}
                          </td>

                          {/* Frequency */}
                          <td className="py-3.5 px-4 text-xs font-medium">
                            <Badge variant="outline" className="text-[11px]">
                              {sub.billing_frequency || "Annual"}
                            </Badge>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-bold text-foreground text-sm">
                            £{Number(sub.amount || 0).toLocaleString()}
                          </td>

                          {/* Renewal Badge */}
                          <td className="py-3.5 px-4">
                            {getRenewalBadge(sub.renewal_date)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={() => handleQuickRenew(sub, clientName)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Renew +1yr
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingSubscription(sub)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Modal */}
          <SubscriptionCreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={refetch}
          />

          {/* Edit Modal */}
          <SubscriptionEditModal
            subscription={editingSubscription}
            isOpen={!!editingSubscription}
            onClose={() => setEditingSubscription(null)}
            onSuccess={refetch}
          />

          {/* Renew Modal */}
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
