import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { required, FormDataConsumer, useRedirect } from "ra-core";
import {
    Create,
    DateInput,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    TextInput,
} from "@/components/admin";
import { supabase } from "../providers/supabase/supabase";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput";

// Async validator for unique contract number
const validateUniqueContractNumber = async (value: string) => {
    if (!value) return undefined;
    const { count, error } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('contract_number', value);

    if (error) {
        console.error("Validation check failed", error);
        return undefined; // Fail open if check fails? Or warn?
    }

    if (count && count > 0) {
        return "This contract number is already in use.";
    }
    return undefined;
};

// Helper to get default start date (1st of next month)
const getDefaultStartDate = () => {
    const date = new Date();
    if (date.getMonth() === 11) {
        date.setFullYear(date.getFullYear() + 1);
        date.setMonth(0);
    } else {
        date.setMonth(date.getMonth() + 1);
    }
    date.setDate(1);
    return date.toISOString().split('T')[0];
};

// Helper to calculate expiry date (Start Date + 1 Year - 1 Day)
const calculateExpiryDate = (startDateStr: string) => {
    if (!startDateStr) return null;
    const startDate = new Date(startDateStr);
    const expiryDate = new Date(startDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    expiryDate.setDate(expiryDate.getDate() - 1);
    return expiryDate.toISOString().split('T')[0];
};

const ContractCreateContent = () => {
    const { setValue, watch } = useFormContext();
    const startDate = watch('start_date');
    const companyId = watch('company_id');

    // Auto-generate contract number when company is selected
    useEffect(() => {
        const generateNumber = async () => {
            if (companyId) {
                const { data, error } = await supabase.rpc('generate_contract_number', { company_id: companyId });
                if (data && !error) {
                    setValue('contract_number', data);
                }
            }
        };
        generateNumber();
    }, [companyId, setValue]);

    // Watch for start_date changes to update expiry_date
    useEffect(() => {
        if (startDate) {
            const newExpiry = calculateExpiryDate(startDate);
            setValue('expiry_date', newExpiry);
        }
    }, [startDate, setValue]);

    return (
        <>
            <div className="flex gap-4">
                <TextInput source="contract_name" validate={[required()]} className="flex-1" />
                <TextInput source="contract_number" validate={[validateUniqueContractNumber]} className="flex-1" />
            </div>
            <ReferenceInput source="company_id" reference="companies">
                <AutocompleteCompanyInput source="company_id" />
            </ReferenceInput>
            <FormDataConsumer>
                {({ formData }) => (
                    <div className="flex gap-4">
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
            <div className="flex gap-4">
                <DateInput source="start_date" />
                <DateInput source="expiry_date" validate={[required()]} />
            </div>
            <div className="flex gap-4">
                <TextInput source="amount" type="number" className="flex-1" />
                <TextInput source="included_hours" type="number" label="Included Hours (Monthly)" className="flex-1" />
            </div>
            <div className="flex gap-4">
                <SelectInput
                    source="payment_frequency"
                    label="Payment Terms"
                    choices={[
                        { id: 'Annual', name: 'Annual' },
                        { id: 'Bi-Annual', name: 'Bi-Annual' },
                        { id: 'Quarterly', name: 'Quarterly' },
                    ]}
                    defaultValue="Annual"
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
                    defaultValue="Open-Unbilled"
                    className="flex-1"
                />
            </div>
            <TextInput source="ovrc_url" label="OvrC URL" type="url" className="w-full" />
        </>
    );
};

export const ContractCreate = () => {
    const defaultStartDate = getDefaultStartDate();
    const defaultExpiryDate = calculateExpiryDate(defaultStartDate);
    const redirect = useRedirect();

    return (
        <Create
            redirect={false}
            mutationOptions={{ onSuccess: () => redirect('list', 'contracts') }}
        >
            <SimpleForm
                defaultValues={{
                    start_date: defaultStartDate,
                    expiry_date: defaultExpiryDate
                }}
                mode="onBlur"
            >
                <ContractCreateContent />
            </SimpleForm>
        </Create>
    );
};
