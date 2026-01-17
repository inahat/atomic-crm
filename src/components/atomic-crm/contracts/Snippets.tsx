import { required } from 'ra-core';
import {
    List,
    DataTable,
    Create,
    SimpleForm,
    TextInput,
    Edit,
    SelectInput,
} from '@/components/admin';

// ... categories ...
const categories = [
    { id: 'Heading', name: 'Heading' },
    { id: 'Scope', name: 'Scope' },
    { id: 'Body', name: 'Body' },
    { id: 'SLA', name: 'SLA' },
    { id: 'Payment', name: 'Payment' },
    { id: 'Legal', name: 'Legal' },
];

export const SnippetList = () => (
    <List sort={{ field: 'title', order: 'ASC' }}>
        <DataTable rowClick="edit">
            <DataTable.Col source="title" sortable={false} />
            <DataTable.Col source="category" sortable={false} />
        </DataTable>
    </List>
);

export const SnippetCreate = () => (
    <Create redirect="list">
        <SimpleForm>
            <TextInput source="title" validate={required()} className="w-full" />
            <SelectInput source="category" choices={categories} validate={required()} />
            <TextInput source="content" multiline rows={10} className="w-full" label="HTML Content" helperText="You can use {{client_name}} variables here." />
        </SimpleForm>
    </Create>
);

export const SnippetEdit = () => (
    <Edit mutationMode="pessimistic" redirect="list">
        <SimpleForm>
            <TextInput source="title" validate={required()} className="w-full" />
            <SelectInput source="category" choices={categories} validate={required()} />
            <TextInput source="content" multiline rows={10} className="w-full" label="HTML Content" />
        </SimpleForm>
    </Edit>
);

const snippets = {
    list: SnippetList,
    create: SnippetCreate,
    edit: SnippetEdit
};

export default snippets;
