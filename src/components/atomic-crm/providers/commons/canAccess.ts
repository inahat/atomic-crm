// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

export const canAccess = <
  RecordType extends Record<string, any> = Record<string, any>,
>(
  role: string,
  params: CanAccessParams<RecordType> & { currentUserId?: number | string },
) => {
  if (role === "admin") {
    // Still cannot delete own account
    if (
      params.resource === "sales" &&
      params.action === "delete" &&
      params.record &&
      params.record.id === params.currentUserId
    ) {
      return false;
    }
    return true;
  }

  // Non-admins cannot access or modify sales resource or crm_settings
  if (params.resource === "sales" || params.resource === "crm_settings") {
    return false;
  }

  // Non-admins (managers and users) cannot delete anything
  if (params.action === "delete") {
    return false;
  }

  // Standard User specific restrictions
  if (role === "user") {
    // Standard users cannot edit or create service contracts
    if (
      params.resource === "contracts" &&
      (params.action === "edit" || params.action === "create")
    ) {
      return false;
    }
    // Standard users cannot access contract analytics/reports or dashboard pipeline chart
    if (
      params.resource === "contracts_analytics" ||
      params.resource === "dashboard_pipeline_chart"
    ) {
      return false;
    }
  }

  return true;
};
