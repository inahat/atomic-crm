
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
import { Link as LinkIcon } from "lucide-react";
import { useRecordContext } from "ra-core";


import { ContractStatus } from "./ContractStatus";

// Using basic List for now
export const ContractList = () => (
    <List
        filters={[
            <TextInput label="Search" source="q" alwaysOn />,
            <DateInput label="Expiring Before" source="expiry_date_lte" alwaysOn />,
            <CheckboxGroupInput
                source="status"
                choices={[
                    { id: 'Proposed', name: 'Proposed' },
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
        filterDefaultValues={{ status: ['Open-Unbilled', 'Open-Billed', 'Approved'] }}
        sort={{ field: "expiry_date", order: "ASC" }}
        perPage={50}
    >
        <DataTable rowClick="edit" bulkActionButtons={false}>
            <DataTable.Col source="contract_number" label="No." />
            <DataTable.Col source="contract_name" />
            <DataTable.Col label="Client" source="company_id">
                <ReferenceField source="company_id" reference="companies">
                    <TextField source="name" />
                </ReferenceField>
            </DataTable.Col>
            <DataTable.Col source="start_date">
                <DateField source="start_date" />
            </DataTable.Col>
            <DataTable.Col source="expiry_date">
                <DateField source="expiry_date" />
            </DataTable.Col>
            <DataTable.NumberCol
                source="amount"
                options={{ style: 'currency', currency: 'GBP' }}
            />
            <DataTable.Col label="Status" source="status">
                <ContractStatus source="status" />
            </DataTable.Col>
            <DataTable.Col label="OvrC" source="ovrc_url">
                <OvrCLinkField source="ovrc_url" />
            </DataTable.Col>
        </DataTable>
    </List>
);


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
