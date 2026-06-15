
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log("Checking if 'identities' table exists...");
    const { data, error } = await supabase
        .from('identities')
        .select('id')
        .limit(1);

    if (error) {
        console.error("Error accessing 'identities' table:", error);
    } else {
        console.log("'identities' table exists and is accessible.");
    }
}

checkTable();
