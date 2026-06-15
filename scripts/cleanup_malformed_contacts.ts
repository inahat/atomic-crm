
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Fallback logic for env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalize(phone: string | null): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

async function run() {
    console.log("Fetching malformed contacts...");
    const { data: badContacts, error } = await supabase
        .from('contacts')
        .select('*')
        .like('phone_1_number', '{%');

    if (error) {
        console.error("Error fetching:", error.message);
        return;
    }

    if (!badContacts || badContacts.length === 0) {
        console.log("No malformed contacts found.");
        return;
    }

    console.log(`Found ${badContacts.length} malformed contacts. Processing...`);

    for (const bad of badContacts) {
        let parsed = null;
        try {
            parsed = JSON.parse(bad.phone_1_number);
        } catch (e) {
            console.warn(`Could not parse JSON for contact ${bad.id}: ${bad.phone_1_number}`);
            continue;
        }

        const cleanPhone = parsed.phone_number;
        const pushName = parsed.pushname || 'WhatsApp';

        if (!cleanPhone) {
            console.warn(`No phone_number in JSON for contact ${bad.id}`);
            continue;
        }

        console.log(`Fixing contact ${bad.id}. Phone: ${cleanPhone}, Name: ${pushName}`);

        // Check if a GOOD contact already exists
        const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('phone_1_number', cleanPhone)
            .neq('id', bad.id)
            .maybeSingle();

        if (existing) {
            console.log(`  -> Valid contact ${existing.id} already exists. Merging...`);
            // Update messages to point to existing
            const { error: moveError } = await supabase
                .from('whatsapp_messages')
                .update({ contact_id: existing.id })
                .eq('contact_id', bad.id);

            if (moveError) {
                console.error(`  Failed to move messages: ${moveError.message}`);
            } else {
                // Delete bad contact
                const { error: delError } = await supabase
                    .from('contacts')
                    .delete()
                    .eq('id', bad.id);
                if (delError) console.error(`  Failed to delete bad contact: ${delError.message}`);
                else console.log("  -> Merged and deleted bad contact.");
            }
        } else {
            console.log("  -> No existing contact. Updating bad contact...");
            const { error: updateError } = await supabase
                .from('contacts')
                .update({
                    first_name: pushName,
                    last_name: 'WhatsApp', // Or keep 'WhatsApp' as surname
                    phone_1_number: cleanPhone
                })
                .eq('id', bad.id);

            if (updateError) {
                console.error(`  Failed to update contact: ${updateError.message}`);
                // If unique violation, weird race condition, but ignore for now
            } else {
                console.log("  -> Updated.");
            }
        }
    }
    console.log("Cleanup complete.");
}

run();
