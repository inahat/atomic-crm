import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Use ANON key to simulate frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMessages(contactId: number, contactName: string) {
    console.log(`\n--- Checking messages for ${contactName} (ID: ${contactId}) ---`);

    // Fetch last 10 messages
    const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }) // Newest first
        .limit(10);

    if (error) {
        console.error(`Error fetching messages: ${error.message}`);
        return;
    }

    if (!messages || messages.length === 0) {
        console.log("No messages found.");
        return;
    }

    // Sort back to chronological for display
    const sorted = messages.reverse();

    sorted.forEach(msg => {
        const isOutbound = msg.direction === 'outbound';
        // Check for specific text patterns we know about
        const isTargetMessage =
            msg.content.includes("Please the screen is always showing") ||
            msg.content.includes("Hi Zoe") ||
            msg.content.includes("yes that is perfect") ||
            msg.content.includes("Yep Lawson") ||
            msg.content.includes("Would you be around");

        const status = isOutbound ? "✅ OUTBOUND" : (isTargetMessage ? "❌ INBOUND (WRONG)" : "INBOUND");
        const color = isOutbound ? "GREEN" : "WHITE";

        console.log(`[${msg.created_at}] ${status} | BG: ${color}`);
        console.log(`   Sender: ${msg.sender_phone} -> Receiver: ${msg.receiver_phone}`);
        console.log(`   "${msg.content.substring(0, 50)}..."`);
    });
}

async function main() {
    // Check Robin Antony (ID 377 from previous logs)
    await checkMessages(377, "Robin Antony");

    // Check Unknown (ID 486 from previous logs)
    await checkMessages(486, "Unknown +447468357757");
}

main();
