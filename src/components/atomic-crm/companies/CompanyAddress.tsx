
import { FormDataConsumer, required, useCreate, useNotify, useRedirect } from "ra-core";
import { useLocation } from "react-router-dom";
import {
    Create,
    Edit,
    SimpleForm,
    TextInput,
    SelectInput,
    BooleanInput
} from "@/components/admin";

export const CompanyAddressCreate = () => {
    const location = useLocation();
    const companyId = location.state?.record?.company_id;
    const [create] = useCreate();
    const notify = useNotify();
    const redirectAction = useRedirect();

    const redirect = companyId ? `/companies/${companyId}/show` : 'list';

    const save = async (data: any) => {
        const { create_billing, ...rest } = data;
        const siteData = { ...rest, company_id: companyId }; // Ensure company_id

        try {
            // 1. Create the primary (Site) address
            await create('company_addresses', { data: siteData }, { returnPromise: true });

            // 2. If checked, duplicate as Billing
            if (create_billing) {
                await create('company_addresses', {
                    data: {
                        ...siteData,
                        address_type: 'Billing',
                        is_primary: false, // Avoid duplicate primary
                    }
                }, { returnPromise: true });
                notify('Site and Billing addresses created', { type: 'success' });
            } else {
                notify('ra.notification.created', { messageArgs: { smart_count: 1 } });
            }

            // 3. Redirect
            redirectAction(redirect);
        } catch (error) {
            console.error(error);
            notify('Error creating address', { type: 'error' });
        }
    };

    return (
        <Create redirect={false}>
            <SimpleForm
                defaultValues={{ company_id: companyId, address_type: 'Site' }}
                onSubmit={save}
            >
                <TextInput source="company_id" className="hidden" />
                <SelectInput
                    source="address_type"
                    choices={[
                        { id: 'Site', name: 'Site' },
                        { id: 'Billing', name: 'Billing' },
                        { id: 'Other', name: 'Other' },
                    ]}
                    validate={required()}
                />
                <FormDataConsumer>
                    {({ formData }) =>
                        formData.address_type === 'Site' && (
                            <BooleanInput
                                source="create_billing"
                                label="Also create as Billing Address"
                                helperText="Check this to automatically create a copy of this address marked as Billing"
                            />
                        )
                    }
                </FormDataConsumer>

                <TextInput source="address_line_1" label="Address" validate={required()} className="w-full" />
                <TextInput source="address_line_2" label="Address Line 2" className="w-full" />
                <div className="flex gap-4">
                    <TextInput source="city" className="flex-1" validate={required()} />
                    <TextInput source="postal_code" label="Postcode" className="flex-1" validate={required()} />
                </div>
                <div className="flex gap-4">
                    <TextInput source="state_province" label="State/Region" className="flex-1" />
                    <TextInput source="country" className="flex-1" />
                </div>
                <BooleanInput source="is_primary" label="Primary Address" />
            </SimpleForm>
        </Create>
    );
};

export const CompanyAddressEdit = () => (
    <Edit>
        <SimpleForm>
            <SelectInput
                source="address_type"
                choices={[
                    { id: 'Site', name: 'Site' },
                    { id: 'Billing', name: 'Billing' },
                    { id: 'Other', name: 'Other' },
                ]}
                validate={required()}
            />
            <TextInput source="address_line_1" label="Address" validate={required()} className="w-full" />
            <TextInput source="address_line_2" label="Address Line 2" className="w-full" />
            <div className="flex gap-4">
                <TextInput source="city" className="flex-1" validate={required()} />
                <TextInput source="postal_code" label="Postcode" className="flex-1" validate={required()} />
            </div>
            <div className="flex gap-4">
                <TextInput source="state_province" label="State/Region" className="flex-1" />
                <TextInput source="country" className="flex-1" />
            </div>
            <BooleanInput source="is_primary" label="Primary Address" />
        </SimpleForm>
    </Edit>
);
