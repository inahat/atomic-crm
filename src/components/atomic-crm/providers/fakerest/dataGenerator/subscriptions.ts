import type { Subscription } from "../../../types";
import type { Db } from "./types";

export const generateSubscriptions = (db: Db): Subscription[] => {
  const now = new Date();
  const dateIn = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const sampleCompanies = db.companies.slice(0, 5);

  return [
    {
      id: 1,
      company_id: sampleCompanies[0]?.id || 1,
      subscription_type: "Control4 4Sight",
      title: "Control4 4Sight License Renewal",
      amount: 120,
      billing_frequency: "Annual",
      renewal_date: dateIn(14), // Urgent: 14 days left (<30)
      status: "Active",
      notes: "Annual 4Sight Remote Access License",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      company_id: sampleCompanies[1]?.id || 2,
      subscription_type: "Re:Sure",
      title: "Re:Sure CCTV Monitoring",
      amount: 450,
      billing_frequency: "Annual",
      renewal_date: dateIn(25), // Urgent: 25 days left (<30)
      status: "Active",
      notes: "24/7 Live Monitoring",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      company_id: sampleCompanies[2]?.id || 3,
      subscription_type: "2n Intercom",
      title: "2n Access Commander Cloud",
      amount: 280,
      billing_frequency: "Annual",
      renewal_date: dateIn(42), // Upcoming: 42 days left (<60)
      status: "Active",
      notes: "Intercom Mobile Calling Cloud License",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      company_id: sampleCompanies[3]?.id || 4,
      subscription_type: "Security",
      title: "Intruder Alarm Monitoring Subscription",
      amount: 350,
      billing_frequency: "Annual",
      renewal_date: dateIn(55), // Upcoming: 55 days left (<60)
      status: "Active",
      notes: "DualCom ARC Connection",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      company_id: sampleCompanies[4]?.id || 5,
      subscription_type: "Fire",
      title: "Fire Alarm Central Station Connection",
      amount: 380,
      billing_frequency: "Annual",
      renewal_date: dateIn(120), // Active: >60 days
      status: "Active",
      notes: "Annual Fire Signalling Service",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};
