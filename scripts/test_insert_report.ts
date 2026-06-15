import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('service_reports')
        .insert({
            company_id: 11, // Using a dummy company_id
            visit_date: '2026-03-06',
            report_data: { test: true },
            status: 'draft'
        })
        .select();

    if (error) {
        console.error('Error inserting report without contract_id:', error);
    } else {
        console.log('Successfully inserted report without contract_id:', data);
        // clean up
        await supabase.from('service_reports').delete().eq('id', data[0].id);
    }
}
main();
