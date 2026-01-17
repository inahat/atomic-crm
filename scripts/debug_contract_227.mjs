
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const inspectRecord = async () => {
    // 1. Fetch Contract using the number CRI-001 from screenshot, or ID 227 if we can assume ID match
    // Screenshot says "Contract #227" and "CRI-001".

    // Search by number first as it's more reliable across envs? No, user URL said /contracts/227.
    // So ID is likely 227 (int8 or uuid?). React Admin usually uses string IDs if UUID.
    // Let's search by contract_number "CRI-001".

    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', 'CRI-001')
        .single();

    if (error) {
        console.error("Could not find contract CRI-001:", error);
    } else {
        console.log("Contract Data (Table):", data);

        // Check if address IDs are valid
        if (data.site_address_id) {
            const { data: address } = await supabase.from('company_addresses').select('*').eq('id', data.site_address_id).single();
            console.log("Site Address found:", !!address);
            if (address) console.log("Site Address Company ID:", address.company_id, "Expected:", data.company_id);
        }
    }

    // Check View
    const { data: viewData, error: viewError } = await supabase
        .from('contracts_summary')
        .select('*')
        .eq('contract_number', 'CRI-001')
        .single();

    if (viewError) {
        console.error("View check error:", viewError);
    } else {
        console.log("Contract View Data:", viewData);
    }
};

inspectRecord();
