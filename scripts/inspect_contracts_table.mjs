
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" }); // Fallback

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const checkSchema = async () => {
    // We can't easily query information_schema via client directly unless exposed.
    // Instead, we'll strip a single row and see what keys it returns.
    // Or we can try to insert a dummy record with all fields and see if it fails (transaction rollback).
    // Better: Helper RPC to get columns?
    // Let's try fetching one row.
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching contracts:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Existing columns in a record:", Object.keys(data[0]));
    } else {
        console.log("No records found, trying to infer from error on invalid select or just assume we can't see them.");
        // If no records, we can't see keys from empty data.
        // Attempt to select specific suspected columns. 
        // If they don't exist, it usually errors "Could not find the '...' column of 'contracts' in the schema cache"
        const suspectedCols = [
            "site_address_id",
            "billing_address_id",
            "included_hours",
            "amount",
            "payment_frequency",
            "ovrc_url",
            "contract_number",
            "contact_id"
        ];
        const { error: colError } = await supabase.from('contracts').select(suspectedCols.join(',')).limit(1);
        if (colError) {
            console.error("Column check error:", colError.message);
        } else {
            console.log("Suspected columns selected successfully:", suspectedCols);
        }
    }
};

checkSchema();
