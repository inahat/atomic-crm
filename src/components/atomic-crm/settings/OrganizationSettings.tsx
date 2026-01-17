import { required, useGetList } from 'ra-core';
import { Edit, Create, SimpleForm, TextInput, Loading } from '@/components/admin';
import { Typography } from '@mui/material';

// Custom Toolbar to hide Delete button - If we really need it, we should implement it using standard HTML/Tailwind or just accept the default for now.
// Since 'Toolbar' is not exported by our admin kit, we'll revert to default SimpleForm behavior or omit the custom toolbar.
// The default toolbar usually contains Save (and Delete if supported).
// For a Singleton, Delete might be suppressed by policies or we just ignore it.
// Let's keep it simple.

export const OrganizationSettings = () => {
    // We fetch the list to find the first ID, since we're assuming Singleton
    const { data, isPending } = useGetList('crm_settings', { pagination: { page: 1, perPage: 1 } });

    if (isPending) return null; // Or <Loading />

    const id = data?.[0]?.id;

    // If no settings exist, show Create form to initialize
    if (!id) {
        return (
            <Create resource="crm_settings" redirect={false} title="Organization Settings">
                <SimpleForm>
                    <Typography variant="h6" gutterBottom>Initialize Company Details</Typography>
                    <TextInput source="org_name" label="Company Name" validate={required()} className="w-full" />
                    <TextInput source="org_address" label="Address" multiline rows={3} className="w-full" />

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Contact Info</Typography>
                    <TextInput source="org_email" label="Email" className="w-full" />
                    <TextInput source="org_phone" label="Phone" className="w-full" />
                    <TextInput source="org_website" label="Website" className="w-full" />

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Branding</Typography>
                    <TextInput source="org_logo_url" label="Logo URL" className="w-full" helperText="Link to your hosted logo image" />
                </SimpleForm>
            </Create>
        );
    }

    // If settings exist, show Edit form
    return (
        <Edit id={id} resource="crm_settings" redirect={false} title="Organization Settings">
            <SimpleForm>
                <Typography variant="h6" gutterBottom>Company Details</Typography>
                <TextInput source="org_name" label="Company Name" validate={required()} className="w-full" />
                <TextInput source="org_address" label="Address" multiline rows={3} className="w-full" />

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Contact Info</Typography>
                <TextInput source="org_email" label="Email" className="w-full" />
                <TextInput source="org_phone" label="Phone" className="w-full" />
                <TextInput source="org_website" label="Website" className="w-full" />

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Branding</Typography>
                <TextInput source="org_logo_url" label="Logo URL" className="w-full" helperText="Link to your hosted logo image" />
            </SimpleForm>
        </Edit>
    );
};
