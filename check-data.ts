
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    console.log("Checking tables for 'Ian Grabiner'...");

    const queries = [
        "SELECT * FROM contracts_summary WHERE company_name ILIKE '%Ian Grabiner%'",
        "SELECT * FROM contacts WHERE first_name ILIKE '%Ian%' OR last_name ILIKE '%Grabiner%'",
        "SELECT * FROM companies WHERE name ILIKE '%Ian Grabiner%'"
    ];

    for (const q of queries) {
        console.log(`Running: ${q}`);
        const { data, error } = await supabase.rpc('exec_sql_readonly', { sql_query: q });
        if (error) console.error(error);
        else console.log(`Result: ${JSON.stringify(data)}`);
    }
}

run();
