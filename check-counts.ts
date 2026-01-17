
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    console.log("Checking for any data in tables...");

    // Just get a count from a few tables to see if DB is populated
    const tables = ['contracts_summary', 'companies', 'contacts'];

    for (const t of tables) {
        const { data } = await supabase.rpc('exec_sql_readonly', { sql_query: `SELECT count(*) FROM ${t}` });
        console.log(`Table ${t} count:`, JSON.stringify(data));
    }
}

run();
