import { email, required, useGetIdentity, useRecordContext } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";

import type { Sale } from "../types";

const roleChoices = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "user", name: "User" },
];

export function SalesInputs() {
  const { identity } = useGetIdentity();
  const record = useRecordContext<Sale>();
  
  const defaultRole =
    record?.administrator === true
      ? "admin"
      : record?.role === "manager"
      ? "manager"
      : record?.role === "admin"
      ? "admin"
      : "user";

  return (
    <div className="space-y-4 w-full">
      <TextInput source="first_name" validate={required()} helperText={false} />
      <TextInput source="last_name" validate={required()} helperText={false} />
      <TextInput
        source="email"
        validate={[required(), email()]}
        helperText={false}
      />
      <SelectInput
        source="role"
        label="Permission Level (Role)"
        choices={roleChoices}
        defaultValue={defaultRole}
        validate={required()}
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
      <BooleanInput
        source="disabled"
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
    </div>
  );
}
