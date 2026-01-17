
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        // 1. Check contracts count
        const { data: countData, error: countError } = await supabase.rpc('exec_sql_readonly', {
            sql_query: "SELECT count(*) as c FROM contracts_summary"
        });

        if (countError) console.error("Count Error:", countError.message);
        else console.log(`Contracts Summary Count: ${JSON.stringify(countData)}`);

        // 2. Check Ian
        const { data: ianData, error: ianError } = await supabase.rpc('exec_sql_readonly', {
            sql_query: "SELECT * FROM contacts WHERE first_name ILIKE '%Ian%' OR last_name ILIKE '%Grabiner%'"
        });

        if (ianError) console.error("Ian Error:", ianError.message);
        else console.log(`Ian Found: ${ianData ? ianData.length : 0} records`);

    } catch (err) {
        console.error("Script Error:", err);
    }
}

run();
