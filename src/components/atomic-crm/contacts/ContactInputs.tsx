import { email, required } from "ra-core";
import type { FocusEvent, ClipboardEventHandler } from "react";
import { useFormContext } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { BooleanInput } from "@/components/admin/boolean-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { RadioButtonGroupInput } from "@/components/admin/radio-button-group-input";
import { SelectInput } from "@/components/admin/select-input";

import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
// Check available imports from admin/index.ts first
import { useRecordContext } from "ra-core";

import { isLinkedinUrl } from "../misc/isLinkedInUrl";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale } from "../types";
import { Avatar } from "./Avatar";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput";

export const ContactInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-2 p-1">
      <Avatar />
      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="flex flex-col gap-10 flex-1">
          <ContactIdentityInputs />
          <ContactPositionInputs />
        </div>
        <Separator
          orientation={isMobile ? "horizontal" : "vertical"}
          className="flex-shrink-0"
        />
        <div className="flex flex-col gap-10 flex-1">
          <ContactPersonalInformationInputs />
          <ContactMiscInputs />
        </div>
      </div>
    </div>
  );
};

const ContactIdentityInputs = () => {
  const { contactGender } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Identity</h6>
      <RadioButtonGroupInput
        label={false}
        row
        source="gender"
        choices={contactGender}
        helperText={false}
        optionText="label"
        optionValue="value"
        defaultValue={contactGender[0].value}
      />
      <TextInput source="first_name" validate={required()} helperText={false} />
      <TextInput source="last_name" validate={required()} helperText={false} />
    </div>
  );
};

const ContactPositionInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Position</h6>
      <TextInput source="title" helperText={false} />
      <ReferenceInput source="company_id" reference="companies" perPage={10}>
        <AutocompleteCompanyInput label="Primary Client" />
      </ReferenceInput>
      <TextInput source="owner_company" label="Owner Company" helperText={false} />

      <Separator className="my-2" />

      <AssociatedClients />
    </div>
  );
};

const AssociatedClients = () => {
  const record = useRecordContext();
  if (!record?.id) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h6 className="text-sm font-semibold text-muted-foreground">Associated Clients</h6>
      </div>
      <ReferenceManyField
        reference="contact_companies"
        target="contact_id"
        label={false}
      >
        <div className="flex flex-col gap-2">
          <DataTable>
            <DataTable.Col
              source="company_id"
              label="Client"
              render={(record: any) => (
                <ReferenceField record={record} source="company_id" reference="companies" link="show">
                  <TextField source="name" />
                </ReferenceField>
              )}
            />
            <DataTable.Col source="role" label="Role" />
          </DataTable>
          <CreateButton
            resource="contact_companies"
            label="Add Client Association"
            state={{ record: { contact_id: record.id } }}
          />
        </div>
      </ReferenceManyField>
    </div>
  );
};


const ContactPersonalInformationInputs = () => {
  const { getValues, setValue } = useFormContext();

  // set first and last name based on email
  const handleEmailChange = (email: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !email) return;
    const [first, last] = email.split("@")[0].split(".");
    setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
    setValue(
      "last_name",
      last ? last.charAt(0).toUpperCase() + last.slice(1) : "",
    );
  };

  const handleEmailPaste: ClipboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (e) => {
    const email = e.clipboardData?.getData("text/plain");
    handleEmailChange(email);
  };

  const handleEmailBlur = (
    e: FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const email = e.target.value;
    handleEmailChange(email);
  };

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Personal info</h6>

      <TextInput
        source="email"
        className="w-full"
        helperText={false}
        validate={email()}
        onPaste={handleEmailPaste}
        onBlur={handleEmailBlur}
      />

      <div className="flex gap-4">
        <TextInput
          source="phone_1_number"
          label="Work Phone"
          className="flex-1"
          helperText={false}
        />
        <TextInput
          source="phone_2_number"
          label="Mobile Phone"
          className="flex-1"
          helperText={false}
        />
      </div>

      <TextInput
        source="linkedin_url"
        label="Linkedin URL"
        helperText={false}
        validate={isLinkedinUrl}
      />
    </div>
  );
};



const ContactMiscInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">Misc</h6>
      <TextInput
        source="background"
        label="Background info (bio, how you met, etc)"
        multiline
        helperText={false}
      />
      <div className="flex flex-col gap-2">
        <h6 className="text-lg font-semibold">Address</h6>
        <TextInput source="address_line_1" label="Street Address" helperText={false} />
        <div className="flex gap-4">
          <TextInput source="city" className="flex-1" helperText={false} />
          <TextInput source="postcode" className="flex-1" helperText={false} />
        </div>
        <TextInput source="country" helperText={false} />
      </div>
      <BooleanInput source="has_newsletter" helperText={false} />
      <ReferenceInput
        reference="sales"
        source="sales_id"
        sort={{ field: "last_name", order: "ASC" }}
        filter={{
          "disabled@neq": true,
        }}
      >
        <SelectInput
          helperText={false}
          label="Account manager"
          optionText={saleOptionRenderer}
          validate={required()}
        />
      </ReferenceInput>
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  `${choice.first_name} ${choice.last_name}`;
