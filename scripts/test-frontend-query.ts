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

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

// Use ANON key (same as frontend) to simulate what the UI sees
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendQuery() {
    console.log("Testing query with ANON key (same as frontend)...\n");

    const contactId = 384; // Lawson Joseph

    const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Total messages fetched: ${data?.length}\n`);

    // Count directions
    const inbound = data?.filter(m => m.direction === 'inbound').length || 0;
    const outbound = data?.filter(m => m.direction === 'outbound').length || 0;

    console.log(`Inbound: ${inbound}`);
    console.log(`Outbound: ${outbound}\n`);

    // Show first 10 messages
    console.log("First 10 messages:");
    data?.slice(0, 10).forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.direction.toUpperCase()}] ${msg.sender_phone} → ${msg.receiver_phone}`);
        console.log(`   "${msg.content.substring(0, 40)}..."`);
    });
}

testFrontendQuery();
