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

const inspectSchema = async () => {
    console.log("Inspecting contracts table schema...\n");

    // Get column information
    const { data: columns, error } = await supabase
        .rpc('exec_sql', {
            sql: `
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable,
                    column_default
                FROM information_schema.columns 
                WHERE table_name = 'contracts' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `
        });

    if (error) {
        console.log("RPC not available, trying direct query...");

        // Try a simpler approach - just get a sample record
        const { data: sample, error: sampleError } = await supabase
            .from('contracts')
            .select('*')
            .limit(1)
            .single();

        if (sampleError) {
            console.error("Error:", sampleError);
        } else {
            console.log("Sample contract record:");
            console.log(JSON.stringify(sample, null, 2));
            console.log("\nColumn names:");
            Object.keys(sample).forEach(key => {
                console.log(`  - ${key}: ${typeof sample[key]} (value: ${sample[key]})`);
            });
        }

        // Now test an update
        console.log("\n\nTesting UPDATE on contract 227...");
        const testData = {
            amount: 1234.56,
            included_hours: 15,
        };

        console.log("Attempting to update with:", testData);

        const { data: updateResult, error: updateError } = await supabase
            .from('contracts')
            .update(testData)
            .eq('contract_number', 'CRI-001')
            .select();

        if (updateError) {
            console.error("UPDATE ERROR:", updateError);
        } else {
            console.log("UPDATE SUCCESS:", updateResult);
        }

        // Read it back
        const { data: readBack, error: readError } = await supabase
            .from('contracts')
            .select('amount, included_hours, site_address_id, billing_address_id')
            .eq('contract_number', 'CRI-001')
            .single();

        if (readError) {
            console.error("READ ERROR:", readError);
        } else {
            console.log("\nRead back after update:");
            console.log(readBack);
        }
    }
};

inspectSchema();
