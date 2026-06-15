
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Support both standard and VITE_ prefixed env vars
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY || '';
const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TWO_CHAT_API_KEY || !TWO_CHAT_NUMBER) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CheckNumberResponse {
    on_whatsapp: boolean;
    whatsapp_info?: {
        pushname?: string;
        contact_profile_pic?: string;
        verified_name?: string;
        is_business?: boolean;
        public_name?: string; // Sometimes seen in documentation or other APIs
        business_information?: {
            verified_name?: string;
        }
    };
}

async function fetchContactInfo(phoneNumber: string): Promise<{ name: string | null; avatar: string | null }> {
    // console.log(`Checking status for ${phoneNumber}...`);
    const url = `https://api.p.2chat.io/open/whatsapp/check-number-status/${encodeURIComponent(phoneNumber)}?number=${encodeURIComponent(TWO_CHAT_NUMBER)}`;

    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': TWO_CHAT_API_KEY } });
        if (!res.ok) {
            console.error(`Failed to check number ${phoneNumber}: ${res.status}`);
            return { name: null, avatar: null };
        }
        const json = await res.json() as CheckNumberResponse;

        if (json.on_whatsapp && json.whatsapp_info) {
            const info = json.whatsapp_info;
            // Prioritize verified name, then pushname
            let name = info.verified_name || info.pushname || info.business_information?.verified_name || null;
            const avatar = info.contact_profile_pic || null;
            return { name, avatar };
        }
    } catch (e) {
        console.error(`Error checking number ${phoneNumber}:`, e);
    }
    return { name: null, avatar: null };
}

async function run() {
    console.log("Starting Individual Contact Enrichment...");

    // 1. Fetch Candidates (contacts named 'WhatsApp' or missing name, and ignore groups we just enriched)
    // We can filter where metadata->>'is_group' is null or false
    const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, phone_1_number, first_name, last_name, metadata')
        .or('first_name.ilike.WhatsApp,first_name.is.null')
        .not('phone_1_number', 'is', null);

    if (error) {
        console.error("Error fetching candidates:", error);
        return;
    }

    if (!contacts || contacts.length === 0) {
        console.log("No candidates found for enrichment.");
        return;
    }

    // Filter out known groups just in case
    const candidates = contacts.filter(c => !c.metadata || !c.metadata.is_group);

    console.log(`Found ${candidates.length} candidates to enrich.`);

    for (const contact of candidates) {
        const phone = contact.phone_1_number;
        if (!phone) continue;

        console.log(`Enriching Contact ${contact.id} (${phone})...`);
        const { name, avatar } = await fetchContactInfo(phone);

        if (name || avatar) {
            console.log(`  -> Found Name: ${name}, Avatar: ${avatar ? 'Yes' : 'No'}`);

            const updates: any = {};
            if (name) {
                // If the current name is "WhatsApp" or null, replace it.
                // Assuming we put the full name in first_name for now or split it?
                // Simple split
                const parts = name.split(' ');
                updates.first_name = parts[0];
                if (parts.length > 1) {
                    updates.last_name = parts.slice(1).join(' ');
                } else {
                    updates.last_name = ''; // Clear the phone number if it was stored as last name
                }
            }
            if (avatar) {
                updates.avatar = { url: avatar };
            }

            const { error: updateError } = await supabase
                .from('contacts')
                .update(updates)
                .eq('id', contact.id);

            if (updateError) {
                console.error(`  -> Failed to update contact ${contact.id}:`, updateError);
            } else {
                console.log(`  -> Successfully updated.`);
            }
        } else {
            console.log(`  -> No info found.`);
        }

        // Rate limit kindness
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("Enrichment Complete.");
}

run();
