import React from 'react';

import {
    DataTable,
    DateField,
    List,
    ReferenceField,
    TextField,
    TextInput,
    SelectInput,
    DateInput,
} from "@/components/admin";
import { Link as LinkIcon } from "lucide-react";
import { useRecordContext, usePermissions } from "ra-core";
import { StatusPill } from "./StatusPill";

const statusChoices = [
    { id: 'Online', name: 'Online' },
    { id: 'Offline', name: 'Offline' },
    { id: 'Limited', name: 'Limited' },
    { id: 'Rebooting', name: 'Rebooting' },
];

export const NetworkList = () => {
    const { permissions } = usePermissions();
    return (
        <List
            filters={[
                <TextInput label="Device Name" source="device_name" alwaysOn />,
                <SelectInput source="event_type" label="Status" choices={statusChoices} alwaysOn />,
                <TextInput label="Project" source="project_name" />,
                <DateInput label="Occurred After" source="occurred_at_gte" />,
            ]}
            sort={{ field: "occurred_at", order: "DESC" }}
            title="Network Command Center"
        >
            <DataTable
                rowClick={false}
                bulkActionButtons={permissions === 'admin' ? undefined : false}
            >
                <DataTable.Col label="Status" source="event_type">
                    <StatusPill source="event_type" />
                </DataTable.Col>

                <DataTable.Col source="device_name" label="Device Name" />

                <DataTable.Col label="Client" source="company_id">
                    <ReferenceField source="company_id" reference="companies">
                        <TextField source="name" />
                    </ReferenceField>
                </DataTable.Col>

                <DataTable.Col source="project_name" label="Project" />
                <DataTable.Col source="job_code" label="Job Code" />


                <DataTable.Col label="Contract" source="contract_id">
                    <ReferenceField source="contract_id" reference="contracts" link="show">
                        <TextField source="contract_name" />
                    </ReferenceField>
                </DataTable.Col>

                <DataTable.Col source="occurred_at" label="Time">
                    <DateField source="occurred_at" showTime />
                </DataTable.Col>

                <DataTable.Col label="OvrC" source="ovrc_url">
                    <OvrCLinkField source="ovrc_url" />
                </DataTable.Col>
            </DataTable>
        </List>
    );
};

const OvrCLinkField = ({ source }: { source: string }) => {
    const record = useRecordContext();
    // Safely check if record and field exist
    if (!record || !source || !record[source]) return null;

    return (
        <a
            href={record[source]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
            title="Open in OvrC"
            onClick={(e) => e.stopPropagation()}
        >
            <LinkIcon className="h-4 w-4" />
        </a>
    );
};
