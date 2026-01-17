
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    // First, find which table might have the name
    const tables = ['contacts', 'people', 'companies', 'leads'];

    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { data, error } = await supabase.rpc('exec_sql_readonly', {
            sql_query: `SELECT * FROM ${table} WHERE name ILIKE '%Ian Grabiner%' OR first_name ILIKE '%Ian Grabiner%' OR last_name ILIKE '%Ian Grabiner%' LIMIT 1`
        });

        if (data && data.length > 0) {
            console.log(`Found in table: ${table}`);
            console.log(JSON.stringify(data[0], null, 2));
            return;
        }
    }
    console.log("Could not find Ian Grabiner in common tables.");
}

run();
