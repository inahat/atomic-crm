import { Building, Users, RotateCcw } from "lucide-react";
import { FilterLiveForm, useGetIdentity, useListContext } from "ra-core";
import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";

import { FilterCategory } from "../filters/FilterCategory";
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

export const CompanyListFilter = () => {
  const { identity } = useGetIdentity();
  const { companySectors } = useConfigurationContext();
  const sectors = companySectors.map((sector) => ({
    id: sector,
    name: sector,
  }));
  return (
    <div className="w-52 min-w-52 flex flex-col gap-6">
      <FilterLiveForm>
        <SearchInput source="q" placeholder="Search client name, address..." />
      </FilterLiveForm>

      <ClearFiltersButton />

      <FilterCategory icon={<Building className="h-4 w-4" />} label="Client Category">
        {sectors.map((sector) => (
          <ToggleFilterButton
            className="w-full justify-between"
            label={sector.name}
            key={sector.name}
            value={{ sector: sector.id }}
          />
        ))}
      </FilterCategory>

      <FilterCategory
        icon={<Users className="h-4 w-4" />}
        label="Account Manager"
      >
        <ToggleFilterButton
          className="w-full justify-between"
          label={"Me"}
          value={{ sales_id: identity?.id }}
        />
      </FilterCategory>
    </div>
  );
};
