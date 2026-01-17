
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("Checking plain JS connection...");

    const tables = ['contracts', 'companies', 'contacts'];
    for (const t of tables) {
        const { data } = await supabase.rpc('exec_sql_readonly', { sql_query: `SELECT count(*) FROM ${t}` });
        console.log(`Table ${t} count:`, JSON.stringify(data));
    }

    // Check specific
    const { data } = await supabase.rpc('exec_sql_readonly', {
        sql_query: "SELECT * FROM contacts WHERE first_name ILIKE '%Ian%' OR last_name ILIKE '%Grabiner%'"
    });
    console.log("Ian Search:", JSON.stringify(data));
}

run();
