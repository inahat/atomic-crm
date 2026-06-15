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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables:");
    console.error("VITE_SUPABASE_URL:", !!supabaseUrl);
    console.error("VITE_SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectWebhooks() {
    console.log("Fetching recent webhook payloads...\n");

    const { data, error } = await supabase
        .from('webhook_debug')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No webhook payloads found in webhook_debug table");
        return;
    }

    data.forEach((record, index) => {
        console.log(`\n========== Webhook ${index + 1} ==========`);
        console.log(`Event Type: ${record.event_type}`);
        console.log(`Created At: ${record.created_at}`);
        console.log(`\nPayload:`);
        console.log(JSON.stringify(record.payload, null, 2));
        console.log("\n" + "=".repeat(50));
    });
}

inspectWebhooks();
