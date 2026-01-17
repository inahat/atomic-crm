
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testPersistence = async () => {
    // 1. Create a dummy test contract or find an existing one?
    // Let's try to find an existing one to minimize garbage.
    const { data: contracts, error: listError } = await supabase
        .from('contracts')
        .select('id, contract_number')
        .limit(1);

    if (listError || !contracts || contracts.length === 0) {
        console.error("Could not list contracts to test:", listError);
        return;
    }

    const testId = contracts[0].id;
    console.log(`Testing persistence on Contract ID: ${testId} (${contracts[0].contract_number})`);

    // 2. Define test values
    const testValues = {
        amount: 1234.56,
        included_hours: 10,
        // We need a valid address ID. Let's list addresses for the company or just valid addresses.
        // Actually, we can't easily guess a valid address id without querying company_addresses.
        // Let's just test 'amount' and 'included_hours' for now as they are scalar.
        // If we can fetch a valid address, we'll try that too.
    };

    // Try to get a valid address
    const { data: addresses } = await supabase.from('company_addresses').select('id').limit(1);
    const validAddressId = addresses && addresses.length > 0 ? addresses[0].id : null;

    if (validAddressId) {
        testValues.site_address_id = validAddressId;
        testValues.billing_address_id = validAddressId;
        console.log("Using Address ID:", validAddressId);
    }

    // 3. Update
    console.log("Attempting UPDATE with:", testValues);
    const { error: updateError } = await supabase
        .from('contracts')
        .update(testValues)
        .eq('id', testId);

    if (updateError) {
        console.error("UPDATE Failed:", updateError);
        return; // RLS or constraint might be here
    }
    console.log("UPDATE Successful (no error returned).");

    // 4. Read back (Immediately)
    const { data: readData, error: readError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', testId)
        .single();

    if (readError) {
        console.error("READ Failed:", readError);
        return;
    }

    // 5. Verify
    console.log("Read back data:", {
        amount: readData.amount,
        included_hours: readData.included_hours,
        site_address_id: readData.site_address_id,
        billing_address_id: readData.billing_address_id
    });

    const isAmountMatch = readData.amount == testValues.amount; // fuzzy equality for float?
    const isHoursMatch = readData.included_hours == testValues.included_hours;
    const isAddressMatch = !validAddressId || readData.site_address_id === validAddressId;

    if (isAmountMatch && isHoursMatch && isAddressMatch) {
        console.log("✅ SUCCESS: Data persisted correctly.");
    } else {
        console.error("❌ FAILURE: Data did NOT persist.");
        if (!isAmountMatch) console.error(`Amount mismatch: Expected ${testValues.amount}, got ${readData.amount}`);
        if (!isHoursMatch) console.error(`Hours mismatch: Expected ${testValues.included_hours}, got ${readData.included_hours}`);
        if (!isAddressMatch) console.error(`Address mismatch: Expected ${validAddressId}, got ${readData.site_address_id}`);
    }

    // Optional: Check contracts_summary to see if it has these columns
    const { data: summaryData, error: summaryError } = await supabase
        .from('contracts_summary')
        .select('*')
        .eq('id', testId)
        .single();

    if (summaryError) {
        console.log("Could not query contracts_summary (might expect this if we don't know structure):", summaryError.message);
    } else {
        console.log("contracts_summary data (checking for missing cols):", Object.keys(summaryData));
        console.log("summary amount:", summaryData.amount); // Check if it's there
    }
};

testPersistence();
