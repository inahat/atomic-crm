
import { useState } from "react";
import {
    DataTable,
    DateField,
    List,
    ReferenceField,
    TextField,
    TextInput,
    DateInput,
    CheckboxGroupInput,
} from "@/components/admin";
import { Link as LinkIcon, BarChart3, ListFilter } from "lucide-react";
import { usePermissions, useRecordContext } from "ra-core";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ContractStatus } from "./ContractStatus";
import { ContractReportsDashboard } from "../contract-reports";

export const ContractList = () => {
    const [activeTab, setActiveTab] = useState<string>("list");
    const { permissions } = usePermissions();

    const isUser = permissions === "user";
    const showAnalytics = permissions === "admin" || permissions === "manager";

    return (
        <div className="space-y-2">
            {showAnalytics && (
                <div className="flex items-center justify-between px-4 pt-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                        <TabsList className="grid grid-cols-2 w-[300px]">
                            <TabsTrigger value="list" className="flex items-center gap-1.5 text-xs">
                                <ListFilter className="h-3.5 w-3.5" />
                                All Contracts
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
                                <BarChart3 className="h-3.5 w-3.5" />
                                Analytics & Reports
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {showAnalytics && activeTab === "analytics" ? (
                <ContractReportsDashboard />
            ) : (
                <List
                    filters={[
                        <TextInput label="Search" source="q" alwaysOn key="q" />,
                        <DateInput label="Expiring Before" source="expiry_date_lte" alwaysOn key="exp" />,
                        <CheckboxGroupInput
                            key="status"
                            source="status"
                            choices={[
                                { id: 'Proposal', name: 'Proposal' },
                                { id: 'Proposal-Sent', name: 'Proposal-Sent' },
                                { id: 'Open-Unbilled', name: 'Open-Unbilled' },
                                { id: 'Open-Billed', name: 'Open-Billed' },
                                { id: 'Approved', name: 'Approved' },
                                { id: 'Rejected', name: 'Rejected' },
                                { id: 'VIP', name: 'VIP' },
                            ]}
                            alwaysOn
                            row
                        />
                    ]}
                    filterDefaultValues={{ status: ['Proposal', 'Proposal-Sent', 'Open-Unbilled', 'Open-Billed', 'Approved'] }}
                    sort={{ field: "expiry_date", order: "ASC" }}
                    perPage={50}
                >
                    <DataTable rowClick={isUser ? "show" : "edit"} bulkActionButtons={false}>
                        <DataTable.Col source="contract_number" label="No." />
                        <DataTable.Col source="contract_name" />
                        <DataTable.Col label="Client" source="company_id">
                            <ReferenceField source="company_id" reference="companies">
                                <TextField source="name" />
                            </ReferenceField>
                        </DataTable.Col>
                        <DataTable.Col source="start_date">
                            <DateField source="start_date" locales="en-GB" />
                        </DataTable.Col>
                        <DataTable.Col source="expiry_date">
                            <DateField source="expiry_date" locales="en-GB" />
                        </DataTable.Col>
                        {!isUser && (
                            <DataTable.NumberCol
                                source="amount"
                                options={{ style: 'currency', currency: 'GBP' }}
                            />
                        )}
                        <DataTable.Col label="Status" source="status">
                            <ContractStatus source="status" />
                        </DataTable.Col>
                        <DataTable.Col label="OvrC" source="ovrc_url">
                            <OvrCLinkField source="ovrc_url" />
                        </DataTable.Col>
                    </DataTable>
                </List>
            )}
        </div>
    );
};


const OvrCLinkField = ({ source }: { source: string }) => {
    const record = useRecordContext();
    if (!record || !source || !record[source]) return null;

    return (
        <a
            href={record[source]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
            title="open in OvrC"
        >
            <LinkIcon className="h-4 w-4" />
        </a>
    );
};
