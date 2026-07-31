import { useRecordContext } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";

import { TopToolbar } from "../layout/TopToolbar";

const SalesListActions = () => (
  <TopToolbar>
    <ExportButton />
    <CreateButton label="New user" />
  </TopToolbar>
);

const filters = [<SearchInput source="q" alwaysOn />];

const OptionsField = (_props: { label?: string | boolean }) => {
  const record = useRecordContext();
  if (!record) return null;
  const role =
    record.administrator === true
      ? "admin"
      : record.role === "manager"
      ? "manager"
      : record.role === "admin"
      ? "admin"
      : "user";
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    user: "User",
  };
  const badgeColor: Record<string, string> = {
    admin: "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400",
    manager: "border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400",
    user: "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400",
  };

  return (
    <div className="flex flex-row gap-1">
      <Badge variant="outline" className={badgeColor[role] || badgeColor.user}>
        {roleLabels[role] || "User"}
      </Badge>
      {record.disabled && (
        <Badge
          variant="outline"
          className="border-orange-300 dark:border-orange-700"
        >
          Disabled
        </Badge>
      )}
    </div>
  );
};

export function SalesList() {
  return (
    <List
      filters={filters}
      actions={<SalesListActions />}
      sort={{ field: "first_name", order: "ASC" }}
    >
      <DataTable>
        <DataTable.Col source="first_name" />
        <DataTable.Col source="last_name" />
        <DataTable.Col source="email" />
        <DataTable.Col label={false}>
          <OptionsField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
}
