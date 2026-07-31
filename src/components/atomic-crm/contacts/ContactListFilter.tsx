import { endOfYesterday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { CheckSquare, Clock, Tag, TrendingUp, Users, RotateCcw } from "lucide-react";
import { FilterLiveForm, useGetIdentity, useGetList, useListContext } from "ra-core";
import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { FilterCategory } from "../filters/FilterCategory";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";

const ClearFiltersButton = () => {
  const { filterValues, setFilters } = useListContext();
  const activeCount = Object.keys(filterValues || {}).filter(
    (k) => filterValues[k] !== undefined && filterValues[k] !== ""
  ).length;

  if (activeCount === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full text-xs gap-1.5 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 cursor-pointer font-semibold"
      onClick={() => setFilters({})}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Clear All Filters ({activeCount})
    </Button>
  );
};

export const ContactListFilter = () => {
  const { noteStatuses } = useConfigurationContext();
  const { identity } = useGetIdentity();
  const { data } = useGetList("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });

  return (
    <div className="w-52 min-w-52 order-first pt-0.75 flex flex-col gap-4">
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search name, company..." />
      </FilterLiveForm>

      <ClearFiltersButton />

      <FilterCategory label="Last activity" icon={<Clock />}>
        <ToggleFilterButton
          className="w-full justify-between"
          label="Active Recently (30d)"
          value={{
            "last_seen@gte": subMonths(new Date(), 1).toISOString(),
            "last_seen@lte": undefined,
          }}
        />
        <ToggleFilterButton
          className="w-full justify-between"
          label="Inactive (> 30d)"
          value={{
            "last_seen@gte": undefined,
            "last_seen@lte": subMonths(new Date(), 1).toISOString(),
          }}
        />
      </FilterCategory>

      <FilterCategory label="Contact Role / Type" icon={<TrendingUp />}>
        {noteStatuses.map((status) => (
          <ToggleFilterButton
            key={status.value}
            className="w-full justify-between"
            label={
              <span>
                {status.label} <Status status={status.value} />
              </span>
            }
            value={{ status: status.value }}
          />
        ))}
      </FilterCategory>

      <FilterCategory label="Tags" icon={<Tag />}>
        {data &&
          data
            .filter((record) => !record?.name?.toLowerCase().includes("imported-iphone"))
            .map((record) => (
              <ToggleFilterButton
                className="w-full justify-between"
                key={record.id}
                label={
                  <Badge
                    variant="secondary"
                    className="text-black text-xs font-normal cursor-pointer"
                    style={{
                      backgroundColor: record?.color,
                    }}
                  >
                    {record?.name}
                  </Badge>
                }
                value={{ "tags@cs": `{${record.id}}` }}
              />
            ))}
      </FilterCategory>

      <FilterCategory icon={<CheckSquare />} label="Tasks">
        <ToggleFilterButton
          className="w-full justify-between"
          label={"With pending tasks"}
          value={{ "nb_tasks@gt": 0 }}
        />
      </FilterCategory>

      <FilterCategory icon={<Users />} label="Account Manager">
        <ToggleFilterButton
          className="w-full justify-between"
          label={"Me"}
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>
    </div>
  );
};
