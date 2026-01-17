import jsonExport from "jsonexport/dist";
import {
  downloadCSV,
  useGetIdentity,
  useListContext,
  usePermissions,
  type Exporter,
} from "ra-core";
import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SortButton } from "@/components/admin/sort-button";
import { Card } from "@/components/ui/card";

import type { Company, Contact, Sale, Tag } from "../types";
import { ContactEmpty } from "./ContactEmpty";
import { ContactImportButton } from "./ContactImportButton";
import { ContactListContent } from "./ContactListContent";
import { ContactListFilter } from "./ContactListFilter";
import { TopToolbar } from "../layout/TopToolbar";

export const ContactList = () => {
  const { identity } = useGetIdentity();

  if (!identity) return null;

  return (
    <List
      title={false}
      actions={<ContactListActions />}
      perPage={25}
      sort={{ field: "last_seen", order: "DESC" }}
      exporter={exporter}
    >
      <ContactListLayout />
    </List>
  );
};

const ContactListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const { identity } = useGetIdentity();
  const { permissions } = usePermissions();

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!identity || isPending) return null;

  if (!data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <div className="flex flex-row gap-8">
      <ContactListFilter />
      <div className="w-full flex flex-col gap-4">
        <Card className="py-0">
          <ContactListContent />
        </Card>
      </div>
      {/* 
      // @ts-ignore */}
      {permissions === 'admin' && <BulkActionsToolbar />}
    </div>
  );
};

const ContactListActions = () => (
  <TopToolbar>
    <SortButton fields={["first_name", "last_name", "last_seen"]} />
    <ContactImportButton />
    <ExportButton exporter={exporter} />
    <CreateButton />
  </TopToolbar>
);

const exporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const companies = await fetchRelatedRecords<Company>(
    records,
    "company_id",
    "companies",
  );
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");

  const contacts = records.map((contact) => {
    // Extract phones from jsonb
    const phones = contact.phone_jsonb || [];
    const businessPhone = phones.find(p => p.type === 'Work')?.number || phones[0]?.number || '';
    const mobilePhone = phones.find(p => p.type === 'Other' || p.type === 'Home')?.number || '';

    const exportedContact: any = {
      ...contact,
      company:
        contact.company_id != null
          ? companies[contact.company_id].name
          : undefined,
      sales: `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name
        }`,
      tags: contact.tags.map((tagId) => tags[tagId].name).join(", "),
      business_phone: businessPhone,
      mobile_phone: mobilePhone,
    };
    // Remove internal fields
    delete exportedContact.email_jsonb;
    delete exportedContact.phone_jsonb;
    // FTS fields not in type, removing delete
    delete exportedContact.avatar;
    return exportedContact;
  });
  return jsonExport(contacts, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "contacts");
  });
};
