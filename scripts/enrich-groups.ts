
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
const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TWO_CHAT_API_KEY || !TWO_CHAT_NUMBER) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface GroupData {
    uuid: string;
    wa_group_id: string; // "123...@g.us"
    wa_group_name: string;
    profile_pic_url: string | null;
}

interface Participant {
    wa_participant_id: string; // "123@c.us"
    wa_pushname: string | null;
    profile_pic_url: string | null;
    wa_is_admin: boolean;
    wa_is_super_admin: boolean;
}

async function fetchGroups(number: string): Promise<GroupData[]> {
    console.log(`Fetching groups for number: ${number}...`);
    const url = `https://api.p.2chat.io/open/whatsapp/groups/${encodeURIComponent(number)}`;
    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': TWO_CHAT_API_KEY } });
        if (!res.ok) {
            console.error(`Failed to fetch groups: ${res.status} ${res.statusText}`);
            return [];
        }
        const json = await res.json();
        // The API returns { success: true, data: [ ... ] } usually
        // Based on docs: { success: true, data: [...] }
        if (json.success && Array.isArray(json.data)) {
            return json.data;
        } else if (Array.isArray(json)) {
            // Sometimes APIs are inconsistent, handling array root
            return json;
        }
        console.log("Unexpected response format for groups:", JSON.stringify(json).substring(0, 200));
        return [];
    } catch (e) {
        console.error("Error fetching groups:", e);
        return [];
    }
}

async function fetchParticipants(groupUuid: string): Promise<Participant[]> {
    // console.log(`Fetching participants for group UUID: ${groupUuid}...`);
    const url = `https://api.p.2chat.io/open/whatsapp/group/${groupUuid}`;
    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': TWO_CHAT_API_KEY } });
        if (!res.ok) {
            console.error(`Failed to fetch participants for ${groupUuid}: ${res.status}`);
            return [];
        }
        const json = await res.json();
        // Docs say: { success: true, data: { participants: [...] } }
        if (json.success && json.data && Array.isArray(json.data.participants)) {
            return json.data.participants;
        }
        return [];
    } catch (e) {
        console.error("Error fetching participants:", e);
        return [];
    }
}

async function run() {
    console.log("Starting Group Enrichment...");

    // 1. Fetch All Groups
    const groups = await fetchGroups(TWO_CHAT_NUMBER);
    console.log(`Found ${groups.length} groups.`);

    for (const group of groups) {
        try {
            console.log(`Processing Group: ${group.wa_group_name} (${group.wa_group_id})`);

            // 2. Fetch Participants
            const participants = await fetchParticipants(group.uuid);

            // 3. Prepare Metadata
            const metadata = {
                is_group: true,
                group_uuid: group.uuid,
                participants: participants.map(p => ({
                    id: p.wa_participant_id,
                    name: p.wa_pushname,
                    admin: p.wa_is_admin || p.wa_is_super_admin,
                    avatar: p.profile_pic_url
                }))
            };

            // 4. Upsert Contact
            // Match by phone_1_number = wa_group_id (e.g., 12345@g.us)
            // We want to update the name and metadata.

            // First check if it exists to get ID? Or just upsert based on phone?
            // "contacts" usually doesn't have a unique constraint on phone_1_number unless we added it?
            // The backfill script matched by phone number. 

            const { data: existing, error: searchError } = await supabase
                .from('contacts')
                .select('id')
                .eq('phone_1_number', group.wa_group_id)
                .single();

            if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is no rows
                console.error(`Error searching contact ${group.wa_group_id}:`, searchError);
            }

            let contactId;

            if (existing) {
                // Update
                contactId = existing.id;
                const { error: updateError } = await supabase
                    .from('contacts')
                    .update({
                        first_name: group.wa_group_name, // Store Group Name as First Name
                        avatar: group.profile_pic_url ? { url: group.profile_pic_url } : null,
                        metadata: metadata
                    })
                    .eq('id', contactId);

                if (updateError) console.error("Error updating group contact:", updateError);
                else console.log(`Updated contact ${contactId} for group "${group.wa_group_name}"`);

            } else {
                // Insert
                // For groups, what do we use for Last Name? user?
                // Lets put "Group"
                const { data: newContact, error: insertError } = await supabase
                    .from('contacts')
                    .insert({
                        first_name: group.wa_group_name,
                        last_name: '(WhatsApp Group)',
                        phone_1_number: group.wa_group_id,
                        phone_1_type: 'whatsapp_group',
                        avatar: group.profile_pic_url ? { url: group.profile_pic_url } : null,
                        metadata: metadata
                    })
                    .select('id')
                    .single();

                if (insertError) console.error("Error creating group contact:", insertError);
                else {
                    contactId = newContact?.id;
                    console.log(`Created new contact ${contactId} for group "${group.wa_group_name}"`);
                }
            }

        } catch (err) {
            console.error(`Error processing group ${group.wa_group_id}:`, err);
        }
    }
    console.log("Group Enrichment Complete.");
}

run();
