
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');

console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Error loading .env.local:", result.error);
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing credentials. URL:", !!url, "Key:", !!key);
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    console.log("Connected to Supabase. Checking for 'Ian Grabiner'...");

    const tables = ['contacts', 'companies', 'contracts_summary'];
    let found = false;

    for (const t of tables) {
        // We use the RPC because we might not have direct Select access with this client setup if policies align weirdly, 
        // but actually service_role key bypasses RLS so simple select is fine.
        // However, let's stick to the RPC we built to test THAT too.

        // Construct a safe query
        const fuzzyName = "%Ian%";
        let query = `SELECT * FROM ${t} LIMIT 5`;
        if (t === 'contacts') query = `SELECT * FROM ${t} WHERE first_name ILIKE '%Ian%' OR last_name ILIKE '%Grabiner%'`;
        if (t === 'companies') query = `SELECT * FROM ${t} WHERE name ILIKE '%Ian%'`;
        if (t === 'contracts_summary') query = `SELECT * FROM ${t} WHERE contract_name ILIKE '%Ian%' OR company_name ILIKE '%Ian%'`;

        console.log(`Querying ${t}...`);
        const { data, error } = await supabase.rpc('exec_sql_readonly', { sql_query: query });

        if (error) {
            console.error(`Error querying ${t}:`, error.message);
        } else {
            console.log(`Table ${t} hits: ${data?.length || 0}`);
            if (data && data.length > 0) {
                console.log(JSON.stringify(data.slice(0, 1), null, 2));
                found = true;
            }
        }
    }

    if (!found) console.log("Ian Grabiner NOT FOUND in any common table.");
}

run();
