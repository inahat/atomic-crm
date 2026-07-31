import { Mars, NonBinary, Venus } from "lucide-react";

export const defaultDarkModeLogo = "./logos/logo_atomic_crm_dark.svg";
export const defaultLightModeLogo = "./logos/logo_atomic_crm_light.svg";

export const defaultTitle = "ih - Support";

export const defaultCompanySectors = [
  "Residential High-End",
  "Commercial / Office",
  "Property Managing Agent",
  "Architect / Developer",
  "VIP Account",
];

export const defaultDealStages = [
  { value: "opportunity", label: "Opportunity (Proposed)" },
  { value: "proposal", label: "Proposal" },
  { value: "proposal-sent", label: "Proposal Sent (In Negotiations)" },
  { value: "won", label: "Won (Approved)" },
  { value: "lost", label: "Lost (Rejected)" },
];

export const defaultDealPipelineStatuses = ["won"];

export const defaultDealCategories = [
  "Service Agreement",
  "Project",
];

export const defaultNoteStatuses = [
  { value: "service-client", label: "Service Client", color: "#6366f1" },
  { value: "homeowner", label: "Homeowner / Resident", color: "#10b981" },
  { value: "house-manager", label: "Property / House Manager", color: "#f59e0b" },
  { value: "managing-agent", label: "Managing Agent", color: "#8b5cf6" },
  { value: "contractor", label: "Architect / Builder", color: "#ec4899" },
];

export const defaultTaskTypes = [
  "None",
  "Email",
  "Demo",
  "Lunch",
  "Meeting",
  "Follow-up",
  "Thank you",
  "Ship",
  "Call",
];

export const defaultContactGender = [
  { value: "male", label: "He/Him", icon: Mars },
  { value: "female", label: "She/Her", icon: Venus },
  { value: "nonbinary", label: "They/Them", icon: NonBinary },
];
