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

const checkCompanyAddress = async () => {
    console.log("Checking Company ID 431 (Cristina Stenbeck) address column...");
    const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, address, city, zipcode, stateAbbr, country')
        .eq('id', 431)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("COMPANY TABLE DATA:");
        console.log(JSON.stringify(company, null, 2));
    }
};

checkCompanyAddress();
