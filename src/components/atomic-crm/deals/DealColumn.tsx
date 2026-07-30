import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { findDealLabel } from "./deal";
import { DealCard } from "./DealCard";

export const DealColumn = ({
  stage,
  deals,
  onOpenCreateClient,
  onGenerateContract
}: {
  stage: string;
  deals: Deal[];
  onOpenCreateClient?: (deal: Deal) => void;
  onGenerateContract?: (deal: Deal) => void;
}) => {
  const totalAmount = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);

  const formatGBP = (val: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0
    }).format(val);

  const { dealStages } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8 min-w-[220px]">
      <div className="flex flex-col items-center border-b pb-2 mb-2">
        <h3 className="text-sm font-semibold">
          {findDealLabel(dealStages, stage)} ({deals.length})
        </h3>
        <p className="text-xs text-muted-foreground font-mono font-medium">
          {formatGBP(totalAmount)}
        </p>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col rounded-xl p-1 min-h-[300px] gap-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-muted/70 ring-1 ring-primary/20" : ""
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onOpenCreateClient={onOpenCreateClient}
                onGenerateContract={onGenerateContract}
              />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
