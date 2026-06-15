import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('service_reports')
        .select('id, status, report_number')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching reports:', error);
        return;
    }

    console.log('Latest 5 Service Reports:');
    console.log(JSON.stringify(data, null, 2));
}
main();
