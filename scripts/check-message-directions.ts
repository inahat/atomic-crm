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

async function checkAllRecentMessages() {
    console.log("Checking recent messages across all contacts...\n");

    const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('id, contact_id, sender_phone, receiver_phone, direction, content, created_at, contacts(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!messages || messages.length === 0) {
        console.log("No messages found");
        return;
    }

    console.log(`Found ${messages.length} recent messages:\n`);

    const channelNumber = process.env.TWO_CHAT_NUMBER;
    console.log(`Your WhatsApp number: ${channelNumber}\n`);

    messages.forEach((msg: any, index) => {
        const contact = msg.contacts;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';

        const isOutbound = msg.sender_phone === channelNumber;
        const storedDirection = msg.direction;
        const mismatch = (isOutbound && storedDirection !== 'outbound') || (!isOutbound && storedDirection !== 'inbound');

        console.log(`${index + 1}. ${contactName} (Contact ID: ${msg.contact_id})`);
        console.log(`   Stored direction: ${storedDirection} ${mismatch ? '❌ MISMATCH!' : '✅'}`);
        console.log(`   From: ${msg.sender_phone}`);
        console.log(`   To: ${msg.receiver_phone}`);
        console.log(`   Should be: ${isOutbound ? 'outbound' : 'inbound'}`);
        console.log(`   Content: "${msg.content.substring(0, 40)}..."`);
        console.log(`   Time: ${new Date(msg.created_at).toLocaleString()}`);
        console.log('');
    });
}

checkAllRecentMessages();
