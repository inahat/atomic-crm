import { ResponsiveBar } from "@nivo/bar";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { PoundSterling, FileText, Send, CheckCircle2 } from "lucide-react";
import { useGetList } from "ra-core";
import { memo, useMemo } from "react";

import type { Deal, Contract } from "../types";

const DEFAULT_LOCALE = "en-GB";
const CURRENCY = "GBP";

export const DealsChart = memo(() => {
  const acceptedLanguages = navigator
    ? navigator.languages || [navigator.language]
    : [DEFAULT_LOCALE];

  // Fetch last 3 months of deals & contracts
  const now = new Date();

  const { data: deals = [], isPending: isDealsPending } = useGetList<Deal>("deals", {
    pagination: { perPage: 1000, page: 1 },
    sort: { field: "created_at", order: "ASC" },
  });

  const { data: contracts = [], isPending: isContractsPending } = useGetList<Contract>("contracts", {
    pagination: { perPage: 1000, page: 1 },
    sort: { field: "start_date", order: "ASC" },
  });

  // Build 3 discrete calendar month buckets (e.g. May, Jun, Jul)
  const monthBuckets = useMemo(() => {
    const buckets = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      buckets.push({
        label: format(monthStart, "MMM yyyy"),
        shortLabel: format(monthStart, "MMM"),
        start: monthStart,
        end: monthEnd,
      });
    }
    return buckets;
  }, [now]);

  const chartData = useMemo(() => {
    return monthBuckets.map((bucket) => {
      let proposalDraftSum = 0;
      let proposalDraftCount = 0;

      let proposalSentSum = 0;
      let proposalSentCount = 0;

      let wonSum = 0;
      let wonCount = 0;

      let lostSum = 0;
      let lostCount = 0;

      // Process Service Contracts originating from proposal pipeline
      contracts.forEach((c) => {
        const statusLower = (c.status || "").trim().toLowerCase();
        const val = Number(c.amount) || 0;

        const dateStr = statusLower === "proposal-sent"
          ? ((c as any).updated_at || (c as any).created_at || c.start_date)
          : ((c as any).created_at || c.start_date);

        const contractDate = dateStr ? new Date(dateStr) : new Date();

        let isMatch = isWithinInterval(contractDate, { start: bucket.start, end: bucket.end });

        // For open active sent proposals whose date falls outside the past 3-month window,
        // map them to the current active month (July / latest bucket) so open sent proposals are always reflected!
        const isCurrentMonthBucket = bucket === monthBuckets[monthBuckets.length - 1];
        if (!isMatch && isCurrentMonthBucket && (statusLower === "proposal-sent" || statusLower === "proposed")) {
          isMatch = true;
        }

        if (isMatch) {
          const isProposalOrigin =
            statusLower === "proposal" ||
            statusLower === "proposal-sent" ||
            statusLower === "proposed" ||
            statusLower === "opportunity" ||
            ((c as any).description && (c as any).description.includes("[Lead Contact:")) ||
            deals.some(
              (d) =>
                d.company_id === c.company_id &&
                d.name.toLowerCase().trim() === (c.contract_name || "").toLowerCase().trim()
            );

          if (statusLower === "approved" || statusLower === "won") {
            if (isProposalOrigin) {
              wonSum += val;
              wonCount += 1;
            }
          } else if (statusLower === "rejected" || statusLower === "lost") {
            if (isProposalOrigin) {
              lostSum += val;
              lostCount += 1;
            }
          } else if (statusLower === "proposal-sent" || statusLower === "proposed") {
            proposalSentSum += val;
            proposalSentCount += 1;
          } else if (statusLower === "proposal" || statusLower === "opportunity") {
            proposalDraftSum += val;
            proposalDraftCount += 1;
          }
        }
      });

      return {
        month: bucket.shortLabel,
        fullMonth: bucket.label,
        "Proposals Drafted": proposalDraftSum,
        "Proposals DraftedCount": proposalDraftCount,
        "Proposals Sent": proposalSentSum,
        "Proposals SentCount": proposalSentCount,
        "Won (Approved)": wonSum,
        "Won (Approved)Count": wonCount,
        "Lost (Rejected)": lostSum,
        "Lost (Rejected)Count": lostCount,
      };
    });
  }, [monthBuckets, deals, contracts]);

  // Compute 3-Month Running Pipeline Totals
  const pipelineSummary = useMemo(() => {
    let totalDraftValue = 0;
    let totalDraftCount = 0;

    let totalSentValue = 0;
    let totalSentCount = 0;

    let totalWonValue = 0;
    let totalWonCount = 0;

    chartData.forEach((item) => {
      totalDraftValue += item["Proposals Drafted"];
      totalDraftCount += item["Proposals DraftedCount"];

      totalSentValue += item["Proposals Sent"];
      totalSentCount += item["Proposals SentCount"];

      totalWonValue += item["Won (Approved)"];
      totalWonCount += item["Won (Approved)Count"];
    });

    const totalOpportunities = totalDraftCount + totalSentCount + totalWonCount;

    return {
      totalOpportunities,
      totalDraftValue,
      totalDraftCount,
      totalSentValue,
      totalSentCount,
      totalWonValue,
      totalWonCount,
    };
  }, [chartData]);

  if (isDealsPending || isContractsPending) return null;

  // Compute maximum height dynamically for scaling
  const maxVal = Math.max(
    ...chartData.map((d) =>
      Math.max(d["Proposals Drafted"], d["Proposals Sent"], d["Won (Approved)"], d["Lost (Rejected)"])
    ),
    1000
  );

  return (
    <div className="flex flex-col bg-card p-5 rounded-xl border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <PoundSterling className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Pipeline Performance (Last 3 Months)
            </h2>
            <p className="text-xs text-muted-foreground">
              New proposal contracts sent per month &amp; 3-month running pipeline totals.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3.5 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            <span>Proposals Drafted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span>Proposals Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Won (Approved)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span>Lost (Rejected)</span>
          </div>
        </div>
      </div>

      {/* Running 3-Month Pipeline Summary Banner */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border dark:bg-slate-900/50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Draft Proposals (3m Total)</div>
            <div className="text-sm font-bold text-foreground">
              £{pipelineSummary.totalDraftValue.toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              {pipelineSummary.totalDraftCount} {pipelineSummary.totalDraftCount === 1 ? "proposal" : "proposals"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l pl-3">
          <div className="p-2 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Sent Proposals (3m Total)</div>
            <div className="text-sm font-bold text-foreground">
              £{pipelineSummary.totalSentValue.toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {pipelineSummary.totalSentCount} {pipelineSummary.totalSentCount === 1 ? "proposal" : "proposals"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l pl-3">
          <div className="p-2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Pipeline Opportunities (3m)</div>
            <div className="text-sm font-bold text-foreground">
              {pipelineSummary.totalOpportunities} Total Opportunities
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Won: £{pipelineSummary.totalWonValue.toLocaleString()} ({pipelineSummary.totalWonCount} {pipelineSummary.totalWonCount === 1 ? "contract" : "contracts"})
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveBar
          data={chartData}
          indexBy="month"
          keys={["Proposals Drafted", "Proposals Sent", "Won (Approved)", "Lost (Rejected)"]}
          groupMode="grouped"
          colors={["#a855f7", "#3b82f6", "#10b981", "#ef4444"]}
          margin={{ top: 20, right: 30, bottom: 40, left: 65 }}
          padding={0.18}
          innerPadding={5}
          borderRadius={4}
          valueScale={{
            type: "linear",
            min: 0,
            max: maxVal * 1.18,
          }}
          indexScale={{ type: "band", round: true }}
          enableGridX={false}
          enableGridY={true}
          enableLabel={true}
          labelSkipHeight={28}
          label={(d: any) => {
            const val = Number(d.value);
            if (!val) return "";
            const countKey = `${d.id}Count`;
            const count = (d.data as any)[countKey] || 0;
            const formattedVal = val >= 1000 ? `£${(val / 1000).toFixed(1)}k` : `£${val.toLocaleString()}`;
            return `${formattedVal} (${count})`;
          }}
          labelTextColor="#ffffff"
          theme={{
            labels: {
              text: {
                fontSize: 11,
                fontWeight: 700,
              },
            },
          }}
          tooltip={({ id, value, indexValue, color, data }: any) => {
            const countKey = `${id}Count`;
            const count = data[countKey] || 0;
            const avg = count > 0 ? Number(value) / count : 0;

            return (
              <div className="p-3 bg-popover text-popover-foreground border rounded-lg shadow-md text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold border-b pb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span>{indexValue} — {id}</span>
                </div>
                <div className="flex justify-between gap-4 pt-0.5">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-bold text-foreground font-mono">
                    £{Number(value).toLocaleString(acceptedLanguages.at(0) ?? DEFAULT_LOCALE)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Number of Contracts:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {count} {count === 1 ? "contract" : "contracts"}
                  </span>
                </div>
                {count > 1 && (
                  <div className="flex justify-between gap-4 text-[11px] text-muted-foreground pt-0.5 border-t border-dashed">
                    <span>Average Value:</span>
                    <span className="font-mono font-medium text-foreground">
                      £{Math.round(avg).toLocaleString()} / contract
                    </span>
                  </div>
                )}
              </div>
            );
          }}
          axisTop={null}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            format: (v: any) => `£${Number(v).toLocaleString()}`,
          }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
          }}
          axisRight={null}
        />
      </div>

      {/* Monthly Breakdown Summary Cards */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t">
        {chartData.map((item) => {
          const totalContracts = item["Proposals DraftedCount"] + item["Proposals SentCount"] + item["Won (Approved)Count"] + item["Lost (Rejected)Count"];
          const totalVal = item["Proposals Drafted"] + item["Proposals Sent"] + item["Won (Approved)"] + item["Lost (Rejected)"];

          return (
            <div key={item.month} className="p-3 rounded-lg bg-muted/30 border text-xs space-y-2">
              <div className="font-bold text-foreground flex items-center justify-between border-b pb-1">
                <span>{item.fullMonth}</span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {totalContracts} {totalContracts === 1 ? "contract" : "contracts"} • £{totalVal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                <div className="p-1.5 rounded bg-purple-50/80 border border-purple-100 dark:bg-purple-950/40 dark:border-purple-900/50">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Drafted</div>
                  <div className="font-bold text-purple-900 dark:text-purple-200">£{item["Proposals Drafted"].toLocaleString()}</div>
                  <div className="text-[10px] text-purple-600/90 font-medium">{item["Proposals DraftedCount"]} {item["Proposals DraftedCount"] === 1 ? "contract" : "contracts"}</div>
                </div>
                <div className="p-1.5 rounded bg-blue-50/80 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/50">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Sent</div>
                  <div className="font-bold text-blue-900 dark:text-blue-200">£{item["Proposals Sent"].toLocaleString()}</div>
                  <div className="text-[10px] text-blue-600/90 font-medium">{item["Proposals SentCount"]} {item["Proposals SentCount"] === 1 ? "contract" : "contracts"}</div>
                </div>
                <div className="p-1.5 rounded bg-emerald-50/80 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/50">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Won</div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">£{item["Won (Approved)"].toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-600/90 font-medium">{item["Won (Approved)Count"]} {item["Won (Approved)Count"] === 1 ? "contract" : "contracts"}</div>
                </div>
                <div className="p-1.5 rounded bg-rose-50/80 border border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/50">
                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Lost</div>
                  <div className="font-bold text-rose-900 dark:text-rose-200">£{item["Lost (Rejected)"].toLocaleString()}</div>
                  <div className="text-[10px] text-rose-600/90 font-medium">{item["Lost (Rejected)Count"]} {item["Lost (Rejected)Count"] === 1 ? "contract" : "contracts"}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
