import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import { useDataProvider, useListContext, useGetList, type DataProvider, useNotify } from "ra-core";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus, RefreshCw } from "lucide-react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, Contract } from "../types";
import { DealColumn } from "./DealColumn";
import type { DealsByStage } from "./stages";
import { getDealsByStage } from "./stages";
import { ContractLeadCreateModal } from "./ContractLeadCreateModal";
import { CreateClientFromLeadModal } from "./CreateClientFromLeadModal";
import { useContractLeadConverter } from "./useContractLeadConverter";
import { buildLeadDescription } from "./leadUtils";

export const DealListContent = () => {
  const { dealStages } = useConfigurationContext();
  const { data: unorderedDeals, isPending: isDealsPending, refetch: refetchDeals } = useListContext<Deal>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const { convertLeadToContract } = useContractLeadConverter();

  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [clientModalDeal, setClientModalDeal] = useState<Deal | null>(null);

  // Fetch Service Contracts at Proposed, Proposal, or Proposal-Sent status
  const { data: contracts = [], isPending: isContractsPending, refetch: refetchContracts } = useGetList<Contract>("contracts", {
    pagination: { page: 1, perPage: 1000 }
  });

  // Convert proposed/proposal/proposal-sent contracts into Deal representation
  const contractDeals = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];
    
    return contracts
      .filter(c => {
        const s = (c.status || "").toLowerCase();
        return s === "proposed" || s === "proposal" || s === "proposal-sent";
      })
      .map(c => {
        const statusLower = (c.status || "").toLowerCase();
        let mappedStage = "opportunity";
        if (statusLower === "proposal") mappedStage = "proposal";
        if (statusLower === "proposal-sent") mappedStage = "proposal-sent";
        if (statusLower === "approved" || statusLower === "won") mappedStage = "won";
        if (statusLower === "rejected" || statusLower === "lost") mappedStage = "lost";

        const dealObj: Deal = {
          id: `contract_${c.id}`,
          name: c.contract_name || c.contract_number || `Service Agreement #${c.id}`,
          company_id: c.company_id,
          contact_ids: c.contact_id ? [c.contact_id] : [],
          category: "Service Agreement",
          stage: mappedStage,
          description: buildLeadDescription(undefined, undefined, c.payment_frequency, `Contract #${c.contract_number || c.id}`),
          amount: Number(c.amount) || 0,
          created_at: c.start_date || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expected_closing_date: c.start_date || new Date().toISOString().split("T")[0],
          sales_id: (c as any).sales_id || 1,
          index: 0,
          payment_frequency: c.payment_frequency,
          isContractRecord: true,
          originalContractId: c.id,
        };

        return dealObj;
      });
  }, [contracts]);

  // Combine deals and contract deals safely without duplicates
  const combinedDeals = useMemo(() => {
    const deals = unorderedDeals || [];
    if (!contractDeals || contractDeals.length === 0) return deals;

    // Filter out raw deals that match a generated contract by company & name
    const contractKeys = new Set(
      contractDeals.map(cd => `${cd.company_id}_${cd.name.toLowerCase().trim()}`)
    );

    const uniqueDeals = deals.filter(d => {
      if (!d.company_id) return true;
      const key = `${d.company_id}_${d.name.toLowerCase().trim()}`;
      return !contractKeys.has(key);
    });

    return [...uniqueDeals, ...contractDeals];
  }, [unorderedDeals, contractDeals]);

  const [dealsByStage, setDealsByStage] = useState<DealsByStage>(
    getDealsByStage([], dealStages),
  );

  useEffect(() => {
    if (combinedDeals) {
      const newDealsByStage = getDealsByStage(combinedDeals, dealStages);
      if (!isEqual(newDealsByStage, dealsByStage)) {
        setDealsByStage(newDealsByStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedDeals]);

  // Avoid blank screen while re-fetching
  if ((isDealsPending && !unorderedDeals) || (isContractsPending && !contracts.length)) return null;

  const handleRefetchAll = () => {
    refetchDeals();
    refetchContracts();
  };

  const handleGenerateContract = async (deal: Deal) => {
    try {
      await convertLeadToContract(deal);
      handleRefetchAll();
    } catch {
      // Notified inside hook
    }
  };

  const onDragEnd: OnDragEndResponder = async (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId;
    const destinationStage = destination.droppableId;
    const sourceDeal = dealsByStage[sourceStage][source.index]!;
    const destinationDeal = dealsByStage[destinationStage][
      destination.index
    ] ?? {
      stage: destinationStage,
      index: undefined,
    };

    // compute local state change synchronously
    setDealsByStage(
      updateDealStageLocal(
        sourceDeal,
        { stage: sourceStage, index: source.index },
        { stage: destinationStage, index: destination.index },
        dealsByStage,
      ),
    );

    // If item is a pulled Contract record, update contract status in contracts table
    if (sourceDeal.isContractRecord && sourceDeal.originalContractId) {
      let newContractStatus = "Proposed";
      if (destinationStage === "proposal") newContractStatus = "Proposal";
      if (destinationStage === "proposal-sent") newContractStatus = "Proposal-Sent";
      if (destinationStage === "won") newContractStatus = "Approved";
      if (destinationStage === "lost") newContractStatus = "Rejected";

      try {
        await dataProvider.update("contracts", {
          id: sourceDeal.originalContractId,
          data: { status: newContractStatus },
          previousData: { id: sourceDeal.originalContractId }
        });
        notify(`Updated Service Agreement status to "${newContractStatus}"`, { type: "info" });
        handleRefetchAll();
      } catch (err: any) {
        notify(`Failed to update agreement status: ${err.message}`, { type: "error" });
        handleRefetchAll();
      }
      return;
    }

    // Otherwise persist normal deal changes
    updateDealStage(sourceDeal, destinationDeal, dataProvider).then(() => {
      handleRefetchAll();
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Service Contract Leads Staging</h2>
          <p className="text-xs text-muted-foreground">
            Stage ad-hoc leads and active Service Agreements (Proposed, Proposal, Proposal Sent).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={handleRefetchAll}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            onClick={() => setIsCreateLeadOpen(true)}
          >
            <FilePlus className="h-4 w-4" />
            New Contract Lead
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {dealStages.map((stage) => (
            <DealColumn
              stage={stage.value}
              deals={dealsByStage[stage.value] || []}
              key={stage.value}
              onOpenCreateClient={(deal) => setClientModalDeal(deal)}
              onGenerateContract={handleGenerateContract}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Create Ad-Hoc Lead Modal */}
      <ContractLeadCreateModal
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
        onSuccess={handleRefetchAll}
      />

      {/* Create Client from Lead Modal */}
      <CreateClientFromLeadModal
        deal={clientModalDeal}
        isOpen={!!clientModalDeal}
        onClose={() => setClientModalDeal(null)}
        onSuccess={handleRefetchAll}
      />
    </>
  );
};

const updateDealStageLocal = (
  sourceDeal: Deal,
  source: { stage: string; index: number },
  destination: {
    stage: string;
    index?: number; // undefined if dropped after the last item
  },
  dealsByStage: DealsByStage,
) => {
  if (source.stage === destination.stage) {
    const column = dealsByStage[source.stage] ? [...dealsByStage[source.stage]] : [];
    column.splice(source.index, 1);
    column.splice(destination.index ?? column.length, 0, sourceDeal);
    return {
      ...dealsByStage,
      [destination.stage]: column,
    };
  } else {
    const sourceColumn = dealsByStage[source.stage] ? [...dealsByStage[source.stage]] : [];
    const destinationColumn = dealsByStage[destination.stage] ? [...dealsByStage[destination.stage]] : [];
    sourceColumn.splice(source.index, 1);
    destinationColumn.splice(
      destination.index ?? destinationColumn.length,
      0,
      { ...sourceDeal, stage: destination.stage },
    );
    return {
      ...dealsByStage,
      [source.stage]: sourceColumn,
      [destination.stage]: destinationColumn,
    };
  }
};

const updateDealStage = async (
  source: Deal,
  destination: {
    stage: string;
    index?: number;
  },
  dataProvider: DataProvider,
) => {
  if (source.stage === destination.stage) {
    const { data: columnDeals } = await dataProvider.getList("deals", {
      sort: { field: "index", order: "ASC" },
      pagination: { page: 1, perPage: 100 },
      filter: { stage: source.stage },
    });
    const destinationIndex = destination.index ?? columnDeals.length;

    if (source.index > destinationIndex) {
      await Promise.all([
        ...columnDeals
          .filter(
            (deal) =>
              deal.index >= destinationIndex && deal.index < source.index,
          )
          .map((deal) =>
            dataProvider.update("deals", {
              id: deal.id,
              data: { index: deal.index + 1 },
              previousData: deal,
            }),
          ),
        dataProvider.update("deals", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    } else {
      await Promise.all([
        ...columnDeals
          .filter(
            (deal) =>
              deal.index <= destinationIndex && deal.index > source.index,
          )
          .map((deal) =>
            dataProvider.update("deals", {
              id: deal.id,
              data: { index: deal.index - 1 },
              previousData: deal,
            }),
          ),
        dataProvider.update("deals", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    }
  } else {
    const [{ data: sourceDeals }, { data: destinationDeals }] =
      await Promise.all([
        dataProvider.getList("deals", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { stage: source.stage },
        }),
        dataProvider.getList("deals", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { stage: destination.stage },
        }),
      ]);
    const destinationIndex = destination.index ?? destinationDeals.length;

    await Promise.all([
      ...sourceDeals
        .filter((deal) => deal.index > source.index)
        .map((deal) =>
          dataProvider.update("deals", {
            id: deal.id,
            data: { index: deal.index - 1 },
            previousData: deal,
          }),
        ),
      ...destinationDeals
        .filter((deal) => deal.index >= destinationIndex)
        .map((deal) =>
          dataProvider.update("deals", {
            id: deal.id,
            data: { index: deal.index + 1 },
            previousData: deal,
          }),
        ),
      dataProvider.update("deals", {
        id: source.id,
        data: {
          index: destinationIndex,
          stage: destination.stage,
        },
        previousData: source,
      }),
    ]);
  }
};
