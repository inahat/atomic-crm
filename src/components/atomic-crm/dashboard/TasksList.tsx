import {
  endOfToday,
  endOfTomorrow,
  endOfWeek,
  getDay,
  startOfToday,
} from "date-fns";
import { useState } from "react";
import { useGetIdentity, useGetList, usePermissions } from "ra-core";
import { CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Sale } from "../types";

import { AddTask } from "../tasks/AddTask";
import { TasksListEmpty } from "./TasksListEmpty";
import { TasksListFilter } from "./TasksListFilter";

const today = new Date();
const todayDayOfWeek = getDay(today);
const isBeforeFriday = todayDayOfWeek < 5; // Friday is represented by 5
const startOfTodayDateISO = startOfToday().toISOString();
const endOfTodayDateISO = endOfToday().toISOString();
const endOfTomorrowDateISO = endOfTomorrow().toISOString();
const endOfWeekDateISO = endOfWeek(today, { weekStartsOn: 0 }).toISOString();

const taskFilters = {
  overdue: { "done_date@is": null, "due_date@lt": startOfTodayDateISO },
  today: {
    "done_date@is": null,
    "due_date@gte": startOfTodayDateISO,
    "due_date@lte": endOfTodayDateISO,
  },
  tomorrow: {
    "done_date@is": null,
    "due_date@gt": endOfTodayDateISO,
    "due_date@lt": endOfTomorrowDateISO,
  },
  thisWeek: {
    "done_date@is": null,
    "due_date@gte": endOfTomorrowDateISO,
    "due_date@lte": endOfWeekDateISO,
  },
  later: { "done_date@is": null, "due_date@gt": endOfWeekDateISO },
};

export const TasksList = () => {
  const { identity } = useGetIdentity();
  const { permissions } = usePermissions();
  const [selectedSalesId, setSelectedSalesId] = useState<string | number | null>(null);

  const { data: sales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "first_name", order: "ASC" },
  }, { enabled: permissions === "admin" || permissions === "manager" });

  const isManagerOrAdmin = permissions === "admin" || permissions === "manager";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center flex-1 min-w-0">
          <div className="mr-2 flex-shrink-0 flex">
            <CheckSquare className="text-muted-foreground w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-muted-foreground truncate">
            Upcoming Tasks
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {isManagerOrAdmin && (
            <select
              value={selectedSalesId === null ? "" : String(selectedSalesId)}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSalesId(val === "" ? null : val);
              }}
              className="text-xs border border-input bg-background rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Staff</option>
              {identity && <option value={String(identity.id)}>My Tasks</option>}
              {sales?.map((sale) => (
                <option key={sale.id} value={String(sale.id)}>
                  {sale.first_name} {sale.last_name}
                </option>
              ))}
            </select>
          )}
          <AddTask display="icon" selectContact />
        </div>
      </div>
      <Card className="p-4 mb-2">
        <div className="flex flex-col gap-4">
          <TasksListEmpty />
          <TasksListFilter title="Overdue" filter={taskFilters.overdue} selectedSalesId={selectedSalesId} />
          <TasksListFilter title="Today" filter={taskFilters.today} selectedSalesId={selectedSalesId} />
          <TasksListFilter title="Tomorrow" filter={taskFilters.tomorrow} selectedSalesId={selectedSalesId} />
          {isBeforeFriday && (
            <TasksListFilter title="This week" filter={taskFilters.thisWeek} selectedSalesId={selectedSalesId} />
          )}
          <TasksListFilter title="Later" filter={taskFilters.later} selectedSalesId={selectedSalesId} />
        </div>
      </Card>
    </div>
  );
};
