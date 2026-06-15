
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY || '';

if (!SUPABASE_URL || !TWO_CHAT_API_KEY) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TwoChatContact {
    uuid: string;
    first_name: string;
    last_name: string;
    profile_pic_url?: string;
    details: { type: string, value: string, created_at?: number }[];
}

async function run() {
    console.log("Starting 2Chat Contact Sync (Robust GET Strategy)...");

    let foundContacts: TwoChatContact[] = [];

    // 1. Try GET /open/contacts/search?query= (Bulk check)
    try {
        console.log(`Searching contacts with GET query: (empty)`);
        const res = await fetch('https://api.p.2chat.io/open/contacts/search?query=', {
            method: 'GET',
            headers: { 'X-User-API-Key': TWO_CHAT_API_KEY }
        });

        if (res.ok) {
            const json = await res.json();
            if (json.contacts) {
                foundContacts.push(...json.contacts);
                console.log(`-> Found ${json.contacts.length} with GET search.`);
            }
        } else {
            console.log(`-> Failed GET search: ${res.status} ${res.statusText}`);
        }
    } catch (e) { }

    // Deduplicate from bulk
    const uniqueContacts = new Map<string, TwoChatContact>();
    foundContacts.forEach(c => uniqueContacts.set(c.uuid || c.profile_pic_url, c));

    // 2. Always search specifically for missing numbers 
    const { data: missing } = await supabase
        .from('contacts')
        .select('phone_1_number')
        .or('first_name.ilike.WhatsApp,first_name.is.null')
        .not('phone_1_number', 'is', null);

    if (missing && missing.length > 0) {
        console.log(`Searching specifically for ${missing.length} missing numbers...`);
        for (const m of missing) {
            const phone = m.phone_1_number?.replace('+', '') || '';
            if (!phone) continue;

            // Optimization: Skip if we already found it in bulk
            if (Array.from(uniqueContacts.values()).some(c => c.details.some(d => d.value.includes(phone)))) {
                continue;
            }

            try {
                const res = await fetch(`https://api.p.2chat.io/open/contacts/search?query=${phone}`, {
                    method: 'GET',
                    headers: { 'X-User-API-Key': TWO_CHAT_API_KEY }
                });

                if (res.ok) {
                    const json = await res.json();
                    if (json.contacts && json.contacts.length > 0) {
                        console.log(`-> Found match for ${phone}: ${json.contacts[0].first_name}`);
                        foundContacts.push(...json.contacts);
                        // Add to map for final sync
                        json.contacts.forEach((c: TwoChatContact) => uniqueContacts.set(c.uuid || c.profile_pic_url!, c));
                    } else {
                        // console.log(`-> No match for ${phone}`);
                    }
                }
            } catch (e) { }
        }
    }

    console.log(`Syncing ${uniqueContacts.size} unique contacts to DB...`);

    for (const c of uniqueContacts.values()) {
        const details = c.details || [];
        const phoneDetail = details.find((d: any) => d.type === 'WAPH' || d.type === 'PH');

        // If no details array, maybe simple object?
        const phone = phoneDetail?.value;

        if (!phone) continue;

        const firstName = c.first_name || '';
        const lastName = c.last_name || '';
        const avatar = c.profile_pic_url;

        if (!firstName) continue;

        // Normalize phone: if no '+', add it?
        const searchPhone = phone.startsWith('+') ? phone : `+${phone}`;

        // Update DB
        const { error } = await supabase
            .from('contacts')
            .update({
                first_name: firstName,
                last_name: lastName,
                avatar: avatar ? { url: avatar } : undefined
            })
            .eq('phone_1_number', searchPhone);

        if (error) {
            console.error(`Failed to update ${searchPhone}:`, error.message);
        } else {
            console.log(`Updated ${firstName} ${lastName} (${searchPhone})`);
        }
    }

    console.log("Sync Complete.");
}

run();
