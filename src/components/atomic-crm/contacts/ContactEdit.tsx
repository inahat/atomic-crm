import { Card, CardContent } from "@/components/ui/card";
import { useEditContext } from "ra-core";

import type { Contact } from "../types";
import { ContactAside } from "./ContactAside";
import { ContactInputs } from "./ContactInputs";

import { Edit, SimpleForm, SaveButton, CancelButton, FormToolbar } from "@/components/admin";

const ContactFormToolbar = () => (
  <FormToolbar>
    <CancelButton />
    <SaveButton />
  </FormToolbar>
);

export const ContactEdit = () => (
  <Edit
    redirect="show"
    disableBreadcrumb
    title="Edit Contact"
    transform={(data) => {
      console.log('Submitting contact data:', data);
      return data;
    }}
  >
    <ContactEditContent />
  </Edit>
);

const ContactEditContent = () => {
  const { isPending, record } = useEditContext<Contact>();
  if (isPending || !record) return null;
  return (
    <div className="mt-2 flex gap-8">
      <SimpleForm
        className="flex flex-1 flex-col gap-4 max-w-none"
        toolbar={<ContactFormToolbar />}
      >
        <Card>
          <CardContent>
            <ContactInputs />
          </CardContent>
        </Card>
      </SimpleForm>

      <ContactAside link="show" />
    </div>
  );
};
