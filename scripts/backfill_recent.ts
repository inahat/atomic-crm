
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Starting Backfill...");

    let totalAdded = 0;

    // Fetch pages 1 to 5 to cover more ground
    for (let page = 1; page <= 5; page++) {
        console.log(`Fetching Page ${page} (size 100)...`);
        const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(TWO_CHAT_NUMBER)}?page_number=${page}&page_size=100`;

        let messages: any[] = [];
        try {
            const res = await fetch(url, { headers: { 'X-User-API-Key': TWO_CHAT_API_KEY } });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const json = await res.json();

            // 2Chat returns { messages: [...] } or { data: [...] }
            messages = json.messages || json.data || [];
            console.log(`Page ${page}: Fetched ${messages.length} messages.`);
            if (messages.length === 0) break;

        } catch (e) {
            console.error("Failed to fetch from 2Chat:", e);
            continue;
        }

        let addedCount = 0;

        for (const msg of messages) {
            const uuid = msg.uuid || msg.id;
            if (!uuid) continue;

            // Check if exists
            const { data: existing } = await supabase
                .from('whatsapp_messages')
                .select('id')
                .eq('message_uuid', uuid)
                .maybeSingle();

            if (existing) continue;

            console.log(`Missing Message found: ${uuid} (${msg.created_at})`);

            // Parse content
            let content = null;
            const m = msg.message;
            if (typeof m === 'string') {
                content = m;
            } else if (typeof m === 'object') {
                // Handle Media
                const mediaUrl = m.media?.url ? ` ${m.media.url}` : '';
                if (m.media?.type === 'document' || m.type === 'document') { // Some payloads flatten types
                    content = `[Document] ${m.text || ''}${mediaUrl}`;
                } else if (m.media?.type === 'image' || m.type === 'image') {
                    content = `[Image] ${m.text || ''}${mediaUrl}`;
                } else if (m.media?.type === 'video' || m.type === 'video') {
                    content = `[Video] ${m.text || ''}${mediaUrl}`;
                } else if (m.media?.type === 'vcard' || m.type === 'vcard' || m.media?.mime_type === 'text/vcard') {
                    content = `[Contact Card] ${m.text || ''}${mediaUrl}`;
                } else {
                    // Fallback
                    content = m.text || m.body || m.caption || (m.media ? `[Media: ${m.media.type}]` : null);
                }
            }

            // If still null, try 2Chat flattened fields if any
            if (!content && msg.text) content = msg.text.body || msg.text;

            if (!content) {
                // Try quoted message or just filler
                if (msg.message?.quoted_msg) content = `[Quoted] ${msg.message.text || '...'}`;
                else {
                    // console.log("Skipping empty content for", uuid);
                    continue;
                }
            }

            const remotePhone = msg.remote_phone_number;
            // Direction Logic
            let direction = 'inbound';
            let status = 'delivered';

            if (msg.direction === 'outbound' || msg.sent_by === 'api' || msg.sent_by === 'agent' || msg.sent_by === 'system') {
                direction = 'outbound';
                status = 'sent';
            } else if (msg.sent_by === 'user') {
                direction = 'inbound';
            }

            // Determine Sender/Receiver phones
            // For inbound: Sender = Remote
            // For outbound: Sender = Channel
            const sender = direction === 'outbound' ? (msg.channel_phone_number || TWO_CHAT_NUMBER) : remotePhone;
            const receiver = direction === 'outbound' ? remotePhone : (msg.channel_phone_number || TWO_CHAT_NUMBER);

            // Find Contact (Best Effort)
            // If unknown, insert anyway? Yes, or message won't show.
            // But we need contact_id for UI usually. UI falls back to phone if no contact?
            // ChatWindow needs contact_id to query messages!
            // So we MUST find or creat contact.

            // For now, try to find.
            const { data: contact } = await supabase
                .from('contacts')
                .select('id')
                .or(`phone_1_number.eq.${remotePhone},phone_2_number.eq.${remotePhone}`)
                .maybeSingle();

            // If no contact, we could create one, but for now let's insert null and see if we can live with it or fix later
            // Actually, if we skip contact_id, ChatSidebar query (Step 841) might miss it if it inner joins?
            // Sidebar query: `whatsapp_messages select ..., contacts(...)`. It's a Left Join by default in Supabase unless !inner.
            // But ChatWindow Query? `eq('contact_id', contactId)`.
            // So messages WITHOUT contact_id will be ORPHANED. They won't appear in any chat window.
            // That's bad.
            // We should AUTO-CREATE contact if missing.

            let contactId = contact?.id;

            if (!contactId && remotePhone) {
                // Auto-create
                const { data: newContact } = await supabase
                    .from('contacts')
                    .insert({
                        first_name: msg.pushname || 'Unknown',
                        phone_1_number: remotePhone,
                        phone_1_type: 'Mobile'
                    })
                    .select('id')
                    .single();
                contactId = newContact?.id;
                if (contactId) console.log(`Auto-created contact for ${remotePhone}`);
            }

            // Insert
            const { error } = await supabase.from('whatsapp_messages').insert({
                message_uuid: uuid,
                contact_id: contactId,
                sender_phone: sender,
                receiver_phone: receiver,
                content: content,
                direction: direction,
                status: msg.status || status,
                created_at: msg.created_at || new Date().toISOString()
            });

            if (error) console.error("Insert failed:", error);
            else {
                addedCount++;
                totalAdded++;
            }
        }
        console.log(`Page ${page}: Restored ${addedCount} messages.`);
    }

    console.log(`Backfill complete. Total Restored: ${totalAdded}`);
}

run();
