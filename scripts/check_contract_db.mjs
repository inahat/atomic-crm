import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const checkContract227 = async () => {
    console.log("Checking contract 227 in database...\n");

    // Query by contract_number since we know it's CRI-001
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', 'CRI-001')
        .single();

    if (error) {
        console.error("Error fetching contract:", error);
        return;
    }

    console.log("Contract Data:");
    console.log("=============");
    console.log(`ID: ${data.id}`);
    console.log(`Contract Name: ${data.contract_name}`);
    console.log(`Contract Number: ${data.contract_number}`);
    console.log(`Company ID: ${data.company_id}`);
    console.log(`Site Address ID: ${data.site_address_id}`);
    console.log(`Billing Address ID: ${data.billing_address_id}`);
    console.log(`Amount: ${data.amount}`);
    console.log(`Included Hours: ${data.included_hours}`);
    console.log(`Start Date: ${data.start_date}`);
    console.log(`Payment Frequency: ${data.payment_frequency}`);
    console.log("\nAll fields:");
    console.log(JSON.stringify(data, null, 2));
};

checkContract227();
