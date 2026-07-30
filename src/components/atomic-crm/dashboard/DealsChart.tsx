import { ResponsiveBar } from "@nivo/bar";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { PoundSterling } from "lucide-react";
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

  // Build 3 discrete calendar month buckets (e.g., May, Jun, Jul)
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
    // Set of contract keys to deduplicate deals converted into contracts
    const contractKeys = new Set(
      contracts.map((c) => `${c.company_id}_${(c.contract_name || "").toLowerCase().trim()}`)
    );

    return monthBuckets.map((bucket) => {
      let proposalSentSum = 0;
      let wonSum = 0;
      let lostSum = 0;

      // 1. Process Service Contracts originating strictly from the proposal/lead pipeline
      contracts.forEach((c) => {
        const contractDate = c.start_date ? new Date(c.start_date) : new Date();
        if (isWithinInterval(contractDate, { start: bucket.start, end: bucket.end })) {
          const statusLower = (c.status || "").trim().toLowerCase();
          const val = Number(c.amount) || 0;

          // Check if contract originated from the proposal lead pipeline:
          // - Is currently a proposal (proposal, proposal-sent, proposed, opportunity)
          // - OR has matching lead deal in deals table
          // - OR has lead metadata in description text
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
            // ONLY count approved if it originated from a proposal pipeline (excluding open-billed -> approved)
            if (isProposalOrigin) {
              wonSum += val;
            }
          } else if (statusLower === "rejected" || statusLower === "lost") {
            if (isProposalOrigin) {
              lostSum += val;
            }
          } else if (
            statusLower === "proposal-sent" ||
            statusLower === "proposal" ||
            statusLower === "proposed" ||
            statusLower === "opportunity"
          ) {
            proposalSentSum += val;
          }
          // Note: Contracts moving from Open-Billed/Unbilled -> Approved without a proposal origin are excluded
        }
      });

      // 2. Process Deals (avoiding duplicates if converted to a contract)
      deals.forEach((deal) => {
        const dealDate = deal.created_at ? new Date(deal.created_at) : new Date();
        if (isWithinInterval(dealDate, { start: bucket.start, end: bucket.end })) {
          if (deal.company_id) {
            const key = `${deal.company_id}_${deal.name.toLowerCase().trim()}`;
            if (contractKeys.has(key)) return;
          }

          const stageLower = (deal.stage || "").trim().toLowerCase();
          const val = Number(deal.amount) || 0;

          if (stageLower === "won" || stageLower === "approved") {
            wonSum += val;
          } else if (stageLower === "lost" || stageLower === "rejected") {
            lostSum += val;
          } else if (
            stageLower === "proposal-sent" ||
            stageLower === "proposal" ||
            stageLower === "opportunity" ||
            stageLower === "proposed"
          ) {
            proposalSentSum += val;
          }
        }
      });

      return {
        month: bucket.shortLabel,
        "Proposals Sent": proposalSentSum,
        "Won (Approved)": wonSum,
        "Lost (Rejected)": lostSum,
      };
    });
  }, [monthBuckets, deals, contracts]);

  if (isDealsPending || isContractsPending) return null;

  // Compute maximum height dynamically for scaling
  const maxVal = Math.max(
    ...chartData.map((d) =>
      Math.max(d["Proposals Sent"], d["Won (Approved)"], d["Lost (Rejected)"])
    ),
    1000
  );

  return (
    <div className="flex flex-col bg-card p-4 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <PoundSterling className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Pipeline Performance (Last 3 Months)
            </h2>
            <p className="text-xs text-muted-foreground">
              Proposals sent & approved/rejected won proposals (excluding open-billed contracts).
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
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

      <div className="h-[360px] w-full">
        <ResponsiveBar
          data={chartData}
          indexBy="month"
          keys={["Proposals Sent", "Won (Approved)", "Lost (Rejected)"]}
          groupMode="grouped"
          colors={["#6366f1", "#10b981", "#ef4444"]}
          margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
          padding={0.25}
          innerPadding={4}
          valueScale={{
            type: "linear",
            min: 0,
            max: maxVal * 1.15,
          }}
          indexScale={{ type: "band", round: true }}
          enableGridX={false}
          enableGridY={true}
          enableLabel={false}
          tooltip={({ id, value, indexValue, color }) => (
            <div className="p-2.5 bg-popover text-popover-foreground border rounded-lg shadow-md text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <div>
                <span className="font-semibold">{indexValue} - {id}:</span>{" "}
                <span className="font-bold text-foreground">
                  {value.toLocaleString(acceptedLanguages.at(0) ?? DEFAULT_LOCALE, {
                    style: "currency",
                    currency: CURRENCY,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          )}
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
    </div>
  );
});
