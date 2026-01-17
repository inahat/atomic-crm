
import { required } from "ra-core";
import { useLocation } from "react-router-dom";
import {
    Create,
    SimpleForm,
    TextInput,
    ReferenceInput
} from "@/components/admin";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput";

export const ContactCompanyCreate = () => {
    const location = useLocation();
    const contactId = location.state?.record?.contact_id;
    // Redirect back to the contact edit page
    const redirect = contactId ? `/contacts/${contactId}` : 'list';

    return (
        <Create
            redirect={redirect}
            transform={(data) => ({
                ...data,
                contact_id: contactId
            })}
        >
            <SimpleForm defaultValues={{ contact_id: contactId }}>
                <TextInput source="contact_id" className="hidden" />

                <ReferenceInput source="company_id" reference="companies">
                    <AutocompleteCompanyInput source="company_id" label="Client" validate={required()} />
                </ReferenceInput>

                <TextInput source="role" label="Role (e.g. Board Member)" className="w-full" />
            </SimpleForm>
        </Create>
    );
};
