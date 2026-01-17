import { required, FormDataConsumer, useRedirect, useRecordContext, useNotify, useCreate } from "ra-core";
import {
    DateInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    TextInput,
    DeleteButton,
} from "@/components/admin";
import { supabase } from "../providers/supabase/supabase";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { useFormState } from "react-hook-form";

// Async validator for unique contract number
const validateUniqueContractNumber = async (value: string, allValues: any) => {
    if (!value) return undefined;
    let query = supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('contract_number', value);

    // Exclude current record if editing
    if (allValues && allValues.id) {
        query = query.neq('id', allValues.id);
    }

    const { count, error } = await query;

    if (error) {
        console.error("Validation check failed", error);
        return undefined;
    }

    if (count && count > 0) {
        return "This contract number is already in use.";
    }
    return undefined;
};

const ContractEditActions = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const redirect = useRedirect();
    const [create, { isPending: isCreating }] = useCreate();
    const { isDirty, isValid } = useFormState();

    // Buttons are enabled only when form is saved (not dirty) and valid
    const isActionEnabled = !isDirty && isValid && !!record?.id;

    const handleRenew = () => {
        if (!record) return;
        if (!confirm('Are you sure you want to renew this contract? This will create a new draft starting after the current expiry.')) return;

        const newStartDate = record.expiry_date ? new Date(record.expiry_date) : new Date();
        newStartDate.setDate(newStartDate.getDate() + 1);

        const newExpiry = new Date(newStartDate);
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);

        create('contracts', {
            data: {
                company_id: record.company_id,
                contract_name: `${record.contract_name} (Renewed)`,
                status: 'Draft',
                start_date: newStartDate.toISOString().split('T')[0],
                expiry_date: newExpiry.toISOString().split('T')[0],
                amount: record.amount,
                payment_frequency: record.payment_frequency,
                content_structure: record.content_structure,
                description: record.description
            }
        }, {
            onSuccess: (data) => {
                notify('Contract renewed successfully', { type: 'success' });
                redirect('edit', 'contracts', data.id);
            },
            onError: (error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                notify(`Error renewing contract: ${errorMessage}`, { type: 'error' });
            }
        });
    };

    return (
        <div className="flex justify-end gap-2 mb-4 w-full">
            <Button
                type="button"
                onClick={handleRenew}
                disabled={!isActionEnabled || isCreating}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                {isCreating ? "Renewing..." : "Renew Contract"}
            </Button>
            <Button
                type="button"
                onClick={() => window.open(`#/contracts/${record?.id}/builder`, '_self')}
                disabled={!isActionEnabled}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Open Builder
            </Button>
            <Button
                type="button"
                onClick={() => window.open(`#/contracts/${record?.id}/builder?print=true`, '_blank')}
                variant="outline"
                disabled={!isActionEnabled}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="mr-2 h-4 w-4" />
                Print Contract
            </Button>
            <DeleteButton />
        </div>
    );
};

const SaveButton = () => {
    const { isValid } = useFormState();
    return (
        <div className="flex justify-end mt-4 w-full">
            <Button type="submit" disabled={!isValid}>Save</Button>
        </div>
    );
};

export const ContractEdit = () => {
    const redirect = useRedirect();

    return (
        <Edit
            redirect={false}
            mutationMode="pessimistic"
            mutationOptions={{ onSuccess: () => redirect('list', 'contracts') }}
        >
            <SimpleForm mode="onBlur" toolbar={false}>
                <ContractEditActions />

                <div className="flex gap-4 w-full">
                    <TextInput source="contract_name" validate={[required()]} className="flex-1" />
                    <TextInput source="contract_number" validate={[validateUniqueContractNumber]} className="flex-1" />
                </div>
                <ReferenceInput source="company_id" reference="companies">
                    <AutocompleteCompanyInput source="company_id" />
                </ReferenceInput>
                <FormDataConsumer>
                    {({ formData }) => (
                        <div className="flex gap-4 w-full">
                            <ReferenceInput
                                source="site_address_id"
                                reference="company_addresses"
                                filter={{ company_id: formData.company_id, address_type: 'Site' }}
                                enableGetChoices={() => !!formData.company_id}
                            >
                                <SelectInput
                                    label="Site Address"
                                    optionText="address_line_1"
                                    className="flex-1"
                                    disabled={!formData.company_id}
                                />
                            </ReferenceInput>
                            <ReferenceInput
                                source="billing_address_id"
                                reference="company_addresses"
                                filter={{ company_id: formData.company_id, address_type: 'Billing' }}
                                enableGetChoices={() => !!formData.company_id}
                            >
                                <SelectInput
                                    label="Billing Address"
                                    optionText="address_line_1"
                                    className="flex-1"
                                    disabled={!formData.company_id}
                                />
                            </ReferenceInput>
                        </div>
                    )}
                </FormDataConsumer>
                <FormDataConsumer>
                    {({ formData }) => (
                        <ReferenceInput
                            source="contact_id"
                            reference="contacts"
                            filter={{ company_id: formData.company_id }}
                            enableGetChoices={() => !!formData.company_id}
                        >
                            <SelectInput
                                label="Contact"
                                optionText={(record) => `${record.first_name} ${record.last_name}`}
                                className="w-full"
                                disabled={!formData.company_id}
                            />
                        </ReferenceInput>
                    )}
                </FormDataConsumer>
                <div className="flex gap-4 w-full">
                    <DateInput source="start_date" />
                    <DateInput source="expiry_date" validate={[required()]} />
                </div>
                <div className="flex gap-4 w-full">
                    <NumberInput source="amount" className="flex-1" />
                    <NumberInput source="included_hours" label="Included Hours (Monthly)" className="flex-1" />
                </div>
                <div className="flex gap-4 w-full">
                    <SelectInput
                        source="payment_frequency"
                        label="Payment Terms"
                        choices={[
                            { id: 'Annual', name: 'Annual' },
                            { id: 'Bi-Annual', name: 'Bi-Annual' },
                            { id: 'Quarterly', name: 'Quarterly' },
                        ]}
                        className="flex-1"
                    />
                    <SelectInput
                        source="status"
                        choices={[
                            { id: "Proposed", name: "Proposed" },
                            { id: "Proposed-Sent", name: "Proposed-Sent" },
                            { id: "Open-Unbilled", name: "Open-Unbilled" },
                            { id: "Open-Billed", name: "Open-Billed" },
                            { id: "Approved", name: "Approved" },
                            { id: "Rejected", name: "Rejected" },
                            { id: "VIP", name: "VIP" },
                        ]}
                        className="flex-1"
                    />
                </div>
                <TextInput source="ovrc_url" label="OvrC URL" type="url" className="w-full" />

                <SaveButton />
            </SimpleForm>
        </Edit >
    );
};
