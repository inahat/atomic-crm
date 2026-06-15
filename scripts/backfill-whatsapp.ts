
console.log("MARKER: Start script execution");
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function log(msg: string) {
    fs.appendFileSync('backfill.log', msg + '\n');
    console.log(msg);
}

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn("Warning: .env.local not found at", envPath);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Must be service role to bypass RLS if needed
const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY;
const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER; // The connected source number

if (!SUPABASE_URL || !SUPABASE_KEY || !TWO_CHAT_API_KEY || !TWO_CHAT_NUMBER) {
    log("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchPage(pageNumber: number) {
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(TWO_CHAT_NUMBER!)}?page_number=${pageNumber}&page_size=50`;
    log(`Fetching page ${pageNumber} from ${url}`);

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'X-User-API-Key': TWO_CHAT_API_KEY!
        }
    });

    if (!res.ok) {
        throw new Error(`2Chat API Error: ${res.status} ${res.statusText} - ${await res.text()}`);
    }

    const data = await res.json();
    return data;
}

let contactsCache: any[] = [];

// Helper to identify group ID
function getGroupId(msg: any): string | null {
    // Check fields for @g.us
    const candidates = [msg.remote_phone_number, msg.from, msg.to, msg.session_key];
    for (const c of candidates) {
        if (c && typeof c === 'string') {
            const match = c.match(/(\d+(?:-\d+)?@g\.us)/);
            if (match) return match[1];
        }
    }
    return null;
}

async function loadContacts() {
    log("Loading contacts into memory...");
    const { data, error } = await supabase
        .from('contacts')
        .select('id, phone_1_number, phone_2_number');

    if (error) {
        log(`Failed to load contacts: ${error.message}`);
        process.exit(1);
    }
    contactsCache = data || [];
    log(`Loaded ${contactsCache.length} contacts.`);
}

function normalize(phone: string | null): string {
    if (!phone) return '';
    if (phone.includes('@g.us')) return phone.trim();
    return phone.replace(/\D/g, '');
}

function findContactInMemory(remotePhone: string): number | null {
    if (!remotePhone) return null;
    const normalizedRemote = normalize(remotePhone);
    if (!normalizedRemote) return null;

    if (normalizedRemote.includes('@g.us')) {
        const match = contactsCache.find(c => {
            return c.phone_1_number === normalizedRemote || c.phone_2_number === normalizedRemote;
        });
        return match ? match.id : null;
    }

    const suffix = normalizedRemote.slice(-9);
    const match = contactsCache.find(c => {
        const p1 = normalize(c.phone_1_number);
        const p2 = normalize(c.phone_2_number);
        if (p1.includes('@g.us') || p2.includes('@g.us')) return false;
        return (p1 && p1.endsWith(suffix)) || (p2 && p2.endsWith(suffix));
    });

    return match ? match.id : null;
}

async function createContact(phoneNumber: string, isGroup = false): Promise<any> {
    log(`Creating new contact for ${phoneNumber} (Group: ${isGroup})...`);
    const { data, error } = await supabase
        .from('contacts')
        .insert({
            first_name: isGroup ? 'Group' : 'WhatsApp',
            last_name: phoneNumber,
            phone_1_number: phoneNumber,
            phone_1_type: 'Mobile'
        })
        .select()
        .single();

    if (error) {
        log(`Failed to create contact for ${phoneNumber}: ${error.message}`);
        return null;
    }
    return data;
}

async function run() {
    let page = 1;
    let totalProcessed = 0;

    log(`Starting backfill for number: ${TWO_CHAT_NUMBER}`);
    await loadContacts();

    while (true) {
        try {
            const data = await fetchPage(page);
            let messages: any[] = [];
            if (Array.isArray(data)) {
                messages = data;
            } else if (data.messages && Array.isArray(data.messages)) {
                messages = data.messages;
            } else {
                log(`Unknown API response structure`);
                break;
            }

            if (messages.length === 0) {
                log("No more messages found.");
                break;
            }

            log(`Processing ${messages.length} messages from page ${page}...`);

            for (const msg of messages) {
                try {
                    const uuid = msg.uuid || msg.id;
                    let isInbound = msg.sent_by === 'user' || msg.direction === 'inbound';
                    let direction = isInbound ? 'inbound' : 'outbound';

                    const groupId = getGroupId(msg); // Check for group ID
                    let remotePhone = groupId;
                    let isGroup = !!groupId;

                    if (!isGroup) {
                        remotePhone = msg.remote_phone_number;
                        if (!remotePhone) {
                            if (msg.from && msg.from !== TWO_CHAT_NUMBER) remotePhone = msg.from;
                            else if (msg.to && msg.to !== TWO_CHAT_NUMBER) remotePhone = msg.to;
                            else if (msg.participant) remotePhone = msg.participant;

                            if (!remotePhone && msg.session_key) {
                                const match = msg.session_key.match(/-(\d+)@([a-z]\.us)$/);
                                if (match && match[1]) remotePhone = '+' + match[1];
                            }
                        }
                    }

                    if (!remotePhone) {
                        continue;
                    }

                    // Fix: 2Chat API sends message.text as string sometimes, or message.text.body
                    let textBody = '';
                    if (typeof msg.message === 'string') textBody = msg.message;
                    else if (typeof msg.message?.text === 'string') textBody = msg.message.text;
                    else if (msg.message?.text?.body) textBody = msg.message.text.body;
                    else textBody = msg.text || '';

                    let contactId = null;
                    if (remotePhone) {
                        contactId = findContactInMemory(remotePhone);
                        if (!contactId) {
                            const newContact = await createContact(remotePhone, isGroup);
                            if (newContact) {
                                contactId = newContact.id;
                                contactsCache.push(newContact);
                            }
                        }
                    }

                    let senderPhone = TWO_CHAT_NUMBER;
                    let receiverPhone = TWO_CHAT_NUMBER;

                    if (isGroup) {
                        receiverPhone = remotePhone!;
                        if (isInbound) {
                            const participantIdentity = msg.participant?.phone_number || msg.participant || 'Unknown';
                            senderPhone = participantIdentity;
                        } else {
                            senderPhone = TWO_CHAT_NUMBER;
                        }
                    } else {
                        if (isInbound) {
                            senderPhone = remotePhone!;
                            receiverPhone = TWO_CHAT_NUMBER;
                        } else {
                            senderPhone = TWO_CHAT_NUMBER;
                            receiverPhone = remotePhone!;
                        }
                    }

                    // DATE FIX: Use created_at (ISO) strictly
                    let msgDate = msg.created_at;
                    if (!msgDate) {
                        if (msg.timestamp) {
                            if (msg.timestamp > 1000000000000) msgDate = new Date(msg.timestamp).toISOString();
                            else msgDate = new Date(msg.timestamp * 1000).toISOString();
                        } else {
                            log(`WARNING: msg ${uuid} has no date! Defaulting to NOW.`);
                            msgDate = new Date().toISOString();
                        }
                    }

                    const { error } = await supabase
                        .from('whatsapp_messages')
                        .upsert({
                            message_uuid: uuid,
                            contact_id: contactId,
                            sender_phone: senderPhone,
                            receiver_phone: receiverPhone,
                            content: textBody,
                            direction: direction,
                            status: msg.status || (isInbound ? 'delivered' : 'sent'),
                            created_at: msgDate
                        }, { onConflict: 'message_uuid' });

                    if (error) {
                        log(`Failed to insert message ${uuid}: ${error.message}`);
                    }

                } catch (loopErr) {
                    log(`CRASH processing message ${msg.id || msg.uuid}: ${loopErr}`);
                }
            }

            totalProcessed += messages.length;
            page++;

            if (page > 50) {
                console.log("Reached safety limit of 50 pages. Stopping.");
                break;
            }

        } catch (e) {
            console.error("Fatal error in loop:", e);
            break;
        }
    }

    log(`Backfill complete. Processed: ${totalProcessed}`);
}

run();
