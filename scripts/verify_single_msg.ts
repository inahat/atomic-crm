import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    // Check specific message ID: 0e5f12cd-cf71-460f-9985-59411fe04714 (Hi Zoe)
    const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('id, content, direction, sender_phone, created_at')
        .eq('id', '0e5f12cd-cf71-460f-9985-59411fe04714')
        .single();

    if (error) {
        console.error(JSON.stringify({ error: error.message }));
    } else {
        console.log(JSON.stringify({
            source: 'ANON_KEY_QUERY',
            message: data
        }, null, 2));
    }
}

main();
