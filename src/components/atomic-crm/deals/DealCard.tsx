import { Draggable } from "@hello-pangea/dnd";
import { useRedirect } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, FileCheck, User, ExternalLink, FileText } from "lucide-react";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import type { Deal } from "../types";
import { extractLeadInfo } from "./leadUtils";

export const DealCard = ({
    deal,
    index,
    onOpenCreateClient,
    onGenerateContract
}: {
    deal: Deal;
    index: number;
    onOpenCreateClient?: (deal: Deal) => void;
    onGenerateContract?: (deal: Deal) => void;
}) => {
    if (!deal) return null;

    return (
        <Draggable draggableId={String(deal.id)} index={index}>
            {(provided, snapshot) => (
                <DealCardContent
                    provided={provided}
                    snapshot={snapshot}
                    deal={deal}
                    onOpenCreateClient={onOpenCreateClient}
                    onGenerateContract={onGenerateContract}
                />
            )}
        </Draggable>
    );
};

export const DealCardContent = ({
    provided,
    snapshot,
    deal,
    onOpenCreateClient,
    onGenerateContract
}: {
    provided?: any;
    snapshot?: any;
    deal: Deal;
    onOpenCreateClient?: (deal: Deal) => void;
    onGenerateContract?: (deal: Deal) => void;
}) => {
    const redirect = useRedirect();
    const isContractRecord = Boolean(deal.isContractRecord);

    const handleClick = () => {
        if (isContractRecord && deal.originalContractId) {
            redirect(`/contracts/${deal.originalContractId}`);
        } else {
            redirect(`/deals/${deal.id}/show`, undefined, undefined, undefined, {
                _scrollToTop: false
            });
        }
    };

    const formatGBP = (val: number) =>
        new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }).format(val);

    const hasClient = Boolean(deal.company_id);
    const leadInfo = extractLeadInfo(deal.description);
    const contactName = deal.lead_contact_name || leadInfo.contactName;
    const contactEmail = deal.lead_contact_email || leadInfo.contactEmail;
    const paymentFrequency = deal.payment_frequency || leadInfo.paymentFrequency;

    return (
        <div
            className="cursor-pointer mb-2"
            {...provided?.draggableProps}
            {...provided?.dragHandleProps}
            ref={provided?.innerRef}
            onClick={handleClick}
        >
            <Card
                className={`py-3.5 transition-all duration-200 ${
                    snapshot?.isDragging
                        ? "opacity-90 transform rotate-1 shadow-lg"
                        : "shadow-sm hover:shadow-md border-l-4 " +
                          (isContractRecord
                              ? "border-l-indigo-500"
                              : hasClient
                              ? "border-l-emerald-500"
                              : "border-l-amber-500")
                }`}
            >
                <CardContent className="px-3.5 pb-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            {hasClient ? (
                                <ReferenceField source="company_id" record={deal} reference="companies" link={false}>
                                    <CompanyAvatar width={22} height={22} />
                                </ReferenceField>
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold">
                                    <User className="h-3 w-3" />
                                </div>
                            )}
                            <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                    isContractRecord
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300"
                                        : hasClient
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                }`}
                            >
                                {isContractRecord ? "Agreement Record" : hasClient ? "Linked Client" : "Ad-Hoc Lead"}
                            </Badge>
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground">
                            {formatGBP(Number(deal.amount) || 0)}
                        </span>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{deal.name}</p>
                        {contactName && !hasClient && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                Contact: {contactName} {contactEmail ? `(${contactEmail})` : ""}
                            </p>
                        )}
                        {paymentFrequency && (
                            <p className="text-[11px] text-muted-foreground font-mono">
                                Billing: {paymentFrequency}
                            </p>
                        )}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="pt-1.5 border-t flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                        {isContractRecord ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-2 gap-1 border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 w-full"
                                onClick={() => redirect(`/contracts/${deal.originalContractId}`)}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                View Service Agreement
                            </Button>
                        ) : !hasClient ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-2 gap-1 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-300 w-full"
                                onClick={() => onOpenCreateClient && onOpenCreateClient(deal)}
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Create Client Profile
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-2 gap-1 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 w-full"
                                onClick={() => onGenerateContract && onGenerateContract(deal)}
                            >
                                <FileCheck className="h-3.5 w-3.5" />
                                Generate Service Contract
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
