
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Fallback to various common prefixes
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER;

if (!SUPABASE_URL || !SUPABASE_KEY || !TWO_CHAT_NUMBER) {
    console.error("Missing Env Vars:");
    if (!SUPABASE_URL) console.error("- SUPABASE_URL");
    if (!SUPABASE_KEY) console.error("- SUPABASE_SERVICE_ROLE_KEY");
    if (!TWO_CHAT_NUMBER) console.error("- TWO_CHAT_NUMBER");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let contactsCache: any[] = [];

async function loadContacts() {
    console.log("Loading contacts...");
    const { data, error } = await supabase
        .from('contacts')
        .select('id, phone_1_number, phone_2_number');

    if (error) {
        console.error("Failed to load contacts:", error.message);
        process.exit(1);
    }
    contactsCache = data || [];
    console.log(`Loaded ${contactsCache.length} contacts.`);
}

function normalize(phone: string | null): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

function findContactInMemory(remotePhone: string): number | null {
    if (!remotePhone) return null;
    const normalizedRemote = normalize(remotePhone);
    if (!normalizedRemote) return null;

    // Heuristic: Last 9 digits
    const suffix = normalizedRemote.slice(-9);

    const match = contactsCache.find(c => {
        const p1 = normalize(c.phone_1_number);
        const p2 = normalize(c.phone_2_number);

        return (p1 && p1.endsWith(suffix)) || (p2 && p2.endsWith(suffix));
    });

    return match ? match.id : null;
}

async function createContact(phoneNumber: string): Promise<any> {
    console.log(`Creating new contact for ${phoneNumber}...`);
    const { data, error } = await supabase
        .from('contacts')
        .insert({
            first_name: 'WhatsApp',
            last_name: phoneNumber,
            phone_1_number: phoneNumber,
            phone_1_type: 'Mobile'
        })
        .select()
        .single();

    if (error) {
        console.error(`Failed to create contact for ${phoneNumber}:`, error.message);
        return null;
    }
    return data;
}

async function run() {
    await loadContacts();

    // Fetch orphans
    // Pagination needed if too many? 1400 is fine for one fetch usually, but let's page.
    // Supabase max rows is 1000 usually.

    let totalFixed = 0;
    let totalCreated = 0;

    let offset = 0;
    const limit = 1000;

    while (true) {
        console.log(`Fetching orphans offset ${offset}...`);
        const { data: messages, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .is('contact_id', null)
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching messages:", error.message);
            break;
        }

        if (!messages || messages.length === 0) {
            console.log("No more orphans found.");
            break;
        }

        console.log(`Processing ${messages.length} orphans...`);

        for (const msg of messages) {
            // Determine remote phone
            // msg.sender_phone or msg.receiver_phone
            // We know TWO_CHAT_NUMBER.
            // If sender_phone == TWO_CHAT_NUMBER, then receiver is remote.
            // But wait, numbers might be formatted differently?
            // "447..." vs "+44..."

            // Normalize all
            const sender = normalize(msg.sender_phone);
            const receiver = normalize(msg.receiver_phone);
            const myNumber = normalize(TWO_CHAT_NUMBER);

            let remotePhoneRaw = '';

            // Note: strict equality might fail if one has + and other doesn't, but we normalized.
            // But sender/receiver DB columns likely have whatever API gave.
            // Ideally we use direction if available?
            // msg.direction: 'inbound' | 'outbound'

            if (msg.direction === 'inbound') {
                remotePhoneRaw = msg.sender_phone;
            } else {
                remotePhoneRaw = msg.receiver_phone;
            }

            // Fallback if direction is weird, assuming one is NOT my number
            if (!remotePhoneRaw) {
                if (sender !== myNumber) remotePhoneRaw = msg.sender_phone;
                else remotePhoneRaw = msg.receiver_phone;
            }

            if (!remotePhoneRaw) {
                console.warn(`Could not determine remote phone for msg ${msg.message_uuid}. sender=${msg.sender_phone}, receiver=${msg.receiver_phone}`);
                continue;
            }

            // Find or Create
            let contactId = findContactInMemory(remotePhoneRaw);

            if (!contactId) {
                const newContact = await createContact(remotePhoneRaw);
                if (newContact) {
                    contactId = newContact.id;
                    totalCreated++;
                    contactsCache.push(newContact);
                }
            }

            if (contactId) {
                // Update message
                const { error: updateError } = await supabase
                    .from('whatsapp_messages')
                    .update({ contact_id: contactId })
                    .eq('message_uuid', msg.message_uuid);

                if (updateError) {
                    console.error(`Failed to update msg ${msg.message_uuid}:`, updateError.message);
                } else {
                    totalFixed++;
                }
            }
        }

        offset += limit;
    }

    console.log(`Done. Fixed: ${totalFixed}, Created: ${totalCreated}`);
}

run();
