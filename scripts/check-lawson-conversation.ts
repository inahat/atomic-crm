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
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLawsonConversation() {
    // Find Lawson Joseph
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone_1_number')
        .or('first_name.ilike.%Lawson%,last_name.ilike.%Joseph%');

    if (!contacts || contacts.length === 0) {
        console.log("Lawson Joseph not found");
        return;
    }

    console.log("Found contacts:");
    contacts.forEach(c => {
        console.log(`  - ID ${c.id}: ${c.first_name} ${c.last_name} (${c.phone_1_number})`);
    });

    const lawson = contacts[0];
    console.log(`\nChecking conversation for: ${lawson.first_name} ${lawson.last_name} (ID: ${lawson.id})\n`);

    const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('id, sender_phone, receiver_phone, direction, content, created_at')
        .eq('contact_id', lawson.id)
        .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
        console.log("No messages found");
        return;
    }

    console.log(`Found ${messages.length} messages:\n`);

    const channelNumber = process.env.TWO_CHAT_NUMBER;
    let inboundCount = 0;
    let outboundCount = 0;

    messages.forEach((msg, index) => {
        const isOutbound = msg.sender_phone === channelNumber;
        if (isOutbound) outboundCount++;
        else inboundCount++;

        console.log(`${index + 1}. [${msg.direction.toUpperCase()}] ${new Date(msg.created_at).toLocaleString()}`);
        console.log(`   From: ${msg.sender_phone} → To: ${msg.receiver_phone}`);
        console.log(`   "${msg.content.substring(0, 60)}..."`);
        console.log('');
    });

    console.log(`\n========== Summary ==========`);
    console.log(`Total: ${messages.length}`);
    console.log(`Inbound: ${inboundCount}`);
    console.log(`Outbound: ${outboundCount}`);
}

checkLawsonConversation();
