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

async function checkContactMessages() {
    // Check the contacts that were just updated
    const contactIds = [486, 485, 484, 483, 408, 403, 388, 382, 372];

    for (const contactId of contactIds) {
        const { data: contact } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, phone_1_number')
            .eq('id', contactId)
            .single();

        if (!contact) continue;

        const { data: messages } = await supabase
            .from('whatsapp_messages')
            .select('sender_phone, receiver_phone, content, direction')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })
            .limit(3);

        console.log(`\nContact ${contactId}: ${contact.first_name} ${contact.last_name}`);
        console.log(`Phone: ${contact.phone_1_number}`);
        console.log(`Messages:`);
        messages?.forEach((msg, i) => {
            console.log(`  ${i + 1}. ${msg.direction}: from ${msg.sender_phone} to ${msg.receiver_phone}`);
            console.log(`     "${msg.content.substring(0, 50)}..."`);
        });
    }
}

checkContactMessages();
