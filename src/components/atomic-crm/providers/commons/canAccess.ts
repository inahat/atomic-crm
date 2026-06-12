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
  params: CanAccessParams<RecordType>,
) => {
  if (role === "admin") {
    return true;
  }

  // Non admins can't access the sales resource
  if (params.resource === "sales") {
    return false;
  }

  // Only admins can delete contacts, clients (companies), notes, and service contracts
  if (
    params.action === "delete" &&
    [
      "contacts",
      "companies",
      "contactNotes",
      "dealNotes",
      "contracts",
    ].includes(params.resource)
  ) {
    return false;
  }

  // User deletion is not supported to avoid data loss; use account disabling instead
  if (params.resource === "sales" && params.action === "delete") {
    return false;
  }

  return true;
};
