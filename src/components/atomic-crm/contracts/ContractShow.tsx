
import {
    DateField,
    NumberField,
    ReferenceField,
    Show,
    SimpleShowLayout,
    TextField,
} from "@/components/admin";

import { ContractStatus } from "./ContractStatus";

export const ContractShow = () => {
    return (
        <Show>
            <SimpleShowLayout>
                <TextField source="contract_number" />
                <TextField source="contract_name" />

                <ReferenceField source="company_id" reference="companies">
                    <TextField source="name" />
                </ReferenceField>

                <div className="flex gap-8">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">Site Address</span>
                        <ReferenceField source="site_address_id" reference="company_addresses" link={false}>
                            <TextField source="address_line_1" />
                        </ReferenceField>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">Billing Address</span>
                        <ReferenceField source="billing_address_id" reference="company_addresses" link={false}>
                            <TextField source="address_line_1" />
                        </ReferenceField>
                    </div>
                </div>

                <div className="flex gap-8">
                    <DateField source="start_date" />
                    <DateField source="expiry_date" />
                </div>

                <div className="flex gap-8">
                    <NumberField
                        source="amount"
                        options={{ style: 'currency', currency: 'GBP' }}
                    />
                    <NumberField source="included_hours" />
                    <TextField source="payment_frequency" />
                </div>

                <ContractStatus source="status" />
            </SimpleShowLayout>
        </Show>
    );
};
