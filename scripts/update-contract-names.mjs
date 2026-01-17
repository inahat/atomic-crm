
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.production.local" });
// Fallback to local if production not found or keys missing
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const run = async () => {
    console.log("Starting batch update of contract names...");

    // 1. Fetch all contracts with company address
    const { data: contracts, error: fetchError } = await supabase
        .from("contracts")
        .select(`
            id,
            contract_name,
            company_id,
            companies (
                address
            )
        `);

    if (fetchError) {
        console.error("Error fetching contracts:", fetchError);
        process.exit(1);
    }

    console.log(`Found ${contracts.length} contracts.`);

    let updatedCount = 0;
    let skippedCount = 0;

    // 2. Iterate and update
    for (const contract of contracts) {
        const companyAddress = contract.companies?.address;

        if (!companyAddress) {
            console.warn(`Contract ${contract.id} has no company address. Skipping.`);
            skippedCount++;
            continue;
        }

        // Optional: Check if update is needed (though user said "overwrite")
        // if (contract.contract_name === companyAddress) { ... }

        const { error: updateError } = await supabase
            .from("contracts")
            .update({ contract_name: companyAddress })
            .eq("id", contract.id);

        if (updateError) {
            console.error(`Failed to update contract ${contract.id}:`, updateError);
        } else {
            updatedCount++;
        }
    }

    console.log(`Batch update complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
};

run().catch(console.error);
