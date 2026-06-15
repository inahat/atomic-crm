import { format, formatDistance } from "date-fns";
import { UserPlus, FileText, Trash2 } from "lucide-react";
import {
  RecordContextProvider,
  ShowBase,
  useListContext,
  useRecordContext,
  useShowContext,
  useDelete,
  useNotify,
} from "ra-core";
import {
  Link as RouterLink,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { ReferenceField } from "@/components/admin/reference-field";

import { ActivityLog } from "../activity/ActivityLog";
import { Avatar } from "../contacts/Avatar";
import { TagsList } from "../contacts/TagsList";
import { findDealLabel } from "../deals/deal";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company, Contact, Contract, Deal } from "../types";
import { CompanyAside } from "./CompanyAside";
import { CompanyAvatar } from "./CompanyAvatar";

export const CompanyShow = () => (
  <ShowBase>
    <CompanyShowContent />
  </ShowBase>
);

const CompanyShowContent = () => {
  const { record, isPending } = useShowContext<Company>();
  const navigate = useNavigate();

  // Get tab from URL or default to "activity"
  const tabMatch = useMatch("/companies/:id/show/:tab");
  const currentTab = tabMatch?.params?.tab || "activity";

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === "activity") {
      navigate(`/companies/${record?.id}/show`);
      return;
    }
    navigate(`/companies/${record?.id}/show/${value}`);
  };

  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="flex mb-3">
              <CompanyAvatar />
              <h5 className="text-xl ml-2 flex-1">{record.name}</h5>
            </div>
            <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="contacts">
                  {record.nb_contacts
                    ? record.nb_contacts === 1
                      ? "Contacts (1)"
                      : `Contacts (${record.nb_contacts})`
                    : "Contacts (0)"}
                </TabsTrigger>
                <TabsTrigger value="deals">
                  Deals ({record.nb_deals || 0})
                </TabsTrigger>
                <TabsTrigger value="contracts">Contracts</TabsTrigger>
                <TabsTrigger value="service_history">Service History</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="pt-2">
                <ActivityLog companyId={record.id} context="company" />
              </TabsContent>
              <TabsContent value="contacts">
                <ReferenceManyField
                  reference="contact_companies"
                  target="company_id"
                  sort={{ field: "created_at", order: "DESC" }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-row justify-end space-x-2 mt-1">
                      <CreateRelatedContactButton />
                    </div>
                    <ContactsIterator />
                  </div>
                </ReferenceManyField>
              </TabsContent>
              <TabsContent value="deals">
                {record.nb_deals ? (
                  <ReferenceManyField
                    reference="deals"
                    target="company_id"
                    sort={{ field: "name", order: "ASC" }}
                  >
                    <DealsIterator />
                  </ReferenceManyField>
                ) : null}
              </TabsContent>
              <TabsContent value="contracts">
                <ReferenceManyField
                  reference="contracts"
                  target="company_id"
                  sort={{ field: "expiry_date", order: "ASC" }}
                >
                  <ContractsIterator />
                </ReferenceManyField>
              </TabsContent>
              <TabsContent value="service_history">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-row justify-end space-x-2 mt-1">
                    <Button variant="outline" size="sm" asChild>
                      <RouterLink to={`/companies/${record.id}/service_reports/create`}>
                        <FileText className="h-4 w-4 mr-2" />
                        New Call-out Report
                      </RouterLink>
                    </Button>
                  </div>
                  <ReferenceManyField
                    reference="service_reports"
                    target="company_id"
                    sort={{ field: "visit_date", order: "DESC" }}
                  >
                    <ReportsIterator />
                  </ReferenceManyField>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <CompanyAside />
    </div >
  );
};

const ContactsIterator = () => {
  const { data: contactCompanies, error, isPending } = useListContext();
  if (isPending || error || !contactCompanies) return null;

  if (contactCompanies.length === 0) return <div className="text-sm text-muted-foreground p-4">No associated contacts</div>;

  return (
    <div className="flex flex-col">
      {contactCompanies.map((link: any) => (
        <RecordContextProvider key={link.id} value={link}>
          <div className="p-0 text-sm border-b last:border-0 hover:bg-muted/50 transition-colors">
            <ReferenceField source="contact_id" reference="contacts" link="show">
              <ContactItemLink role={link.role} />
            </ReferenceField>
          </div>
        </RecordContextProvider>
      ))}
    </div>
  );
};

const ContactItemLink = ({ role }: { role?: string }) => {
  const contact = useRecordContext<Contact>();
  if (!contact) return null;
  const now = Date.now();

  return (
    <div className="flex items-center justify-between py-3 px-2 w-full">
      <div className="mr-4">
        <Avatar />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          {`${contact.first_name} ${contact.last_name}`}
          {role && <span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{role}</span>}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
          {contact.title}
          <TagsList />
        </div>
      </div>
      {contact.last_seen && (
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            last activity {formatDistance(contact.last_seen, now)} ago{" "}
            <Status status={contact.status} />
          </div>
        </div>
      )}
    </div>
  );
}

const CreateRelatedContactButton = () => {
  const company = useRecordContext<Company>();
  return (
    <Button variant="outline" asChild size="sm" className="h-9">
      <RouterLink
        to="/contacts/create"
        state={company ? { record: { company_id: company.id } } : undefined}
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Add contact
      </RouterLink>
    </Button>
  );
};

const DealsIterator = () => {
  const { data: deals, error, isPending } = useListContext<Deal>();
  const { dealStages } = useConfigurationContext();
  if (isPending || error) return null;

  const now = Date.now();
  return (
    <div>
      <div>
        {deals.map((deal) => (
          <div key={deal.id} className="p-0 text-sm">
            <RouterLink
              to={`/deals/${deal.id}/show`}
              className="flex items-center justify-between hover:bg-muted py-2 px-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">{deal.name}</div>
                <div className="text-sm text-muted-foreground">
                  {findDealLabel(dealStages, deal.stage)},{" "}
                  {deal.amount.toLocaleString("en-US", {
                    notation: "compact",
                    style: "currency",
                    currency: "USD",
                    currencyDisplay: "narrowSymbol",
                    minimumSignificantDigits: 3,
                  })}
                  {deal.category ? `, ${deal.category}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  last activity {formatDistance(deal.updated_at, now)} ago{" "}
                </div>
              </div>
            </RouterLink>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContractsIterator = () => {
  const { data: contracts, error, isPending } = useListContext<Contract>();

  if (isPending || error || !contracts) return null;

  if (contracts.length === 0) return <div className="p-4 text-sm text-muted-foreground">No contracts found</div>;

  return (
    <div className="flex flex-col">
      {contracts.map(contract => (
        <RouterLink
          key={contract.id}
          to={`/contracts/${contract.id}`}
          className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-md transition-colors"
        >
          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-sm">{contract.contract_name}</div>
            <div className="text-xs text-muted-foreground">
              {contract.amount?.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Expires: {format(new Date(contract.expiry_date), 'PP')}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide 
                ${contract.status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
                ${contract.status === 'Proposal' ? 'bg-blue-100 text-blue-800' : ''}
                ${contract.status === 'Proposal-Sent' ? 'bg-indigo-100 text-indigo-800' : ''}
                ${contract.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                ${contract.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${!['Approved', 'Rejected', 'Open', 'Proposal', 'Proposal-Sent'].includes(contract.status) ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {contract.status}
            </span>
          </div>
        </RouterLink>
      ))}
      <div className="mt-4">
        <Button variant="outline" size="sm" asChild>
          <RouterLink to="/contracts/create">Add Contract</RouterLink>
        </Button>
      </div>
    </div>
  );
};

const ReportsIterator = () => {
  const { data: reports, error, isPending } = useListContext<any>();
  const [deleteOne] = useDelete();
  const notify = useNotify();

  if (isPending || error || !reports) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      deleteOne('service_reports', { id }, {
        onSuccess: () => notify('Service report deleted successfully', { type: 'success' }),
        onError: (error: any) => notify(`Error deleting report: ${error?.message || 'Unknown error'}`, { type: 'error' })
      });
    }
  };

  if (reports.length === 0) return (
    <div className="text-sm text-muted-foreground p-4">No service reports found</div>
  );

  return (
    <div className="flex flex-col">
      {reports.map((report: any) => (
        <RouterLink
          key={report.id}
          to={`/service_reports/${report.id}`}
          className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-md transition-colors group"
        >
          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-sm">
              {report.status === 'draft' ? '[DRAFT] ' : ''}{report.report_data?.subtitle || 'Service Visit Report'}
            </div>
            <div className="text-xs text-muted-foreground">
              Visit Date: {format(new Date(report.visit_date), 'PP')}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide 
                            ${report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        `}>
              {report.status}
            </span>
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDelete(e, report.id)}
              title="Delete Report"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </RouterLink>
      ))}
    </div>
  );
};
