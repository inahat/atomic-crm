import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

// Use Anon key to simulate frontend access
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrgSettings() {
    console.log('Testing orgSettings query with ANON key (same as frontend)...');

    const { data, error } = await supabase
        .from('orgSettings')
        .select('*');

    if (error) {
        console.error('Error fetching orgSettings:');
        console.error(error);
    } else {
        console.log(`Found ${data.length} records in orgSettings table:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkOrgSettings();
