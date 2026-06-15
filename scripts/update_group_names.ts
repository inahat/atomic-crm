
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.TWO_CHAT_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_KEY) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("Fetching Group Contacts...");
    const { data: groups } = await supabase
        .from('contacts')
        .select('*')
        .eq('first_name', 'Group'); // Filter by our 'Group' convention

    if (!groups || groups.length === 0) {
        console.log("No groups found.");
        return;
    }

    console.log(`Found ${groups.length} groups. Updating Metadata...`);

    for (const group of groups) {
        const groupId = group.phone_1_number; // e.g., 123-456@g.us

        // 2Chat API to get group info?
        // Documentation implies /open/whatsapp/get-group-info or similar
        // Let's try to get info.

        const url = `https://api.p.2chat.io/open/whatsapp/group-info/${groupId}`;
        try {
            const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY } });
            if (res.ok) {
                const info = await res.json();
                console.log(`Info for ${groupId}:`, info);

                if (info && info.subject) {
                    // Update Contact Name
                    const { error } = await supabase
                        .from('contacts')
                        .update({
                            first_name: info.subject,
                            last_name: '(Group)'
                        })
                        .eq('id', group.id);

                    if (!error) console.log(`Updated group ${groupId} -> ${info.subject}`);
                }
            } else {
                console.warn(`Failed to fetch info for ${groupId}: ${res.status}`);
            }
        } catch (e) {
            console.error(`Error processing ${groupId}:`, e);
        }
    }
}

run();
