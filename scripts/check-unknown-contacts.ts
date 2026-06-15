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

async function checkUnknownContacts() {
    console.log("Checking contacts with 'Unknown' or 'WhatsApp' names...\n");

    // Get all contacts that start with "Unknown" or "WhatsApp"
    const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone_1_number, phone_2_number, metadata')
        .or('first_name.ilike.Unknown%,first_name.ilike.WhatsApp%')
        .order('id', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!contacts || contacts.length === 0) {
        console.log("No contacts found with 'Unknown' or 'WhatsApp' names");
        return;
    }

    console.log(`Found ${contacts.length} contacts:\n`);

    contacts.forEach((contact, index) => {
        console.log(`${index + 1}. Contact ID: ${contact.id}`);
        console.log(`   Name: ${contact.first_name} ${contact.last_name}`);
        console.log(`   Phone 1: ${contact.phone_1_number}`);
        console.log(`   Phone 2: ${contact.phone_2_number || 'N/A'}`);
        console.log(`   Metadata: ${JSON.stringify(contact.metadata || {})}`);
        console.log('');
    });

    // Now check recent messages for these contacts to see what data we have
    console.log("\n========== Recent Messages ==========\n");

    for (const contact of contacts.slice(0, 5)) {
        const { data: messages } = await supabase
            .from('whatsapp_messages')
            .select('id, sender_phone, content, created_at')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (messages && messages.length > 0) {
            const msg = messages[0];
            console.log(`Contact: ${contact.first_name} ${contact.last_name}`);
            console.log(`  Last message: ${msg.content.substring(0, 50)}...`);
            console.log(`  Sender phone: ${msg.sender_phone}`);
            console.log(`  Date: ${msg.created_at}`);
            console.log('');
        }
    }

    // Check webhook_debug for recent payloads with these phone numbers
    console.log("\n========== Recent Webhook Payloads ==========\n");

    const phoneNumbers = contacts.map(c => c.phone_1_number).filter(Boolean);

    const { data: webhooks } = await supabase
        .from('webhook_debug')
        .select('payload, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (webhooks) {
        webhooks.forEach((webhook, index) => {
            const payload = webhook.payload as any;
            const remotePhone = payload.remote_phone_number;

            if (remotePhone && phoneNumbers.some(p => remotePhone.includes(p.replace('+', '')))) {
                console.log(`\nWebhook ${index + 1} for ${remotePhone}:`);
                console.log(`  pushname: ${payload.pushname || 'N/A'}`);
                console.log(`  contact.first_name: ${payload.contact?.first_name || 'N/A'}`);
                console.log(`  contact.last_name: ${payload.contact?.last_name || 'N/A'}`);
                console.log(`  contact.friendly_name: ${payload.contact?.friendly_name || 'N/A'}`);
                console.log(`  participant.pushname: ${payload.participant?.pushname || 'N/A'}`);
            }
        });
    }
}

checkUnknownContacts();
