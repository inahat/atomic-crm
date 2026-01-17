
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const { data, error } = await supabase.rpc('exec_sql_readonly', {
        sql_query: `
      SELECT 
        table_name, 
        string_agg(column_name, ', ') as columns 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      GROUP BY table_name
    `
    });

    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

run();
