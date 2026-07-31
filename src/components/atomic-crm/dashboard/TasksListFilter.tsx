import {
  ListContextProvider,
  ResourceContextProvider,
  useGetIdentity,
  useGetList,
  useList,
  usePermissions,
} from "ra-core";

import { TasksIterator } from "../tasks/TasksIterator";

export const TasksListFilter = ({
  title,
  filter,
  selectedSalesId,
}: {
  title: string;
  filter: any;
  selectedSalesId?: number | string | null;
}) => {
  const { identity } = useGetIdentity();
  const { permissions } = usePermissions();

  const filterWithSalesId = { ...filter };
  if (permissions === "user") {
    filterWithSalesId.sales_id = identity?.id;
  } else if (selectedSalesId != null) {
    filterWithSalesId.sales_id = selectedSalesId;
  }

  const {
    data: tasks,
    total,
    isPending,
  } = useGetList(
    "tasks",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "due_date", order: "ASC" },
      filter: filterWithSalesId,
    },
    { enabled: !!identity },
  );

  const listContext = useList({
    data: tasks,
    isPending,
    resource: "tasks",
    perPage: 5,
  });

  if (isPending || !tasks || !total) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
        {title}
      </p>
      <ResourceContextProvider value="tasks">
        <ListContextProvider value={listContext}>
          <TasksIterator showContact />
        </ListContextProvider>
      </ResourceContextProvider>
      {total > listContext.perPage && (
        <div className="flex justify-center">
          <a
            href="#"
            onClick={(e) => {
              listContext.setPerPage(listContext.perPage + 10);
              e.preventDefault();
            }}
            className="text-sm underline hover:no-underline"
          >
            Load more
          </a>
        </div>
      )}
    </div>
  );
};
