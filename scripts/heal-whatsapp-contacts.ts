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
const apiKey = process.env.TWO_CHAT_API_KEY!;
const channelNumber = process.env.TWO_CHAT_NUMBER!;

if (!supabaseUrl || !supabaseServiceKey || !apiKey || !channelNumber) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    phone_1_number: string;
}

async function fetchMessagesForContact(phoneNumber: string): Promise<any[]> {
    try {
        // Fetch recent messages for this contact from 2Chat API
        const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(channelNumber)}?page_number=1&page_size=100`;

        const response = await fetch(url, {
            headers: {
                'X-User-API-Key': apiKey
            }
        });

        if (!response.ok) {
            console.error(`  ✗ 2Chat API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const messages = Array.isArray(data) ? data : (data.messages || []);

        // Filter messages for this specific phone number
        const normalizedPhone = phoneNumber.replace(/\D/g, '');
        const relevantMessages = messages.filter((msg: any) => {
            const remotePhone = msg.remote_phone_number || '';
            return remotePhone.replace(/\D/g, '').includes(normalizedPhone.slice(-9));
        });

        return relevantMessages;
    } catch (error) {
        console.error(`  ✗ Error fetching messages:`, error);
        return [];
    }
}

function extractNameFromMessage(msg: any): string | null {
    // Try to extract name from various fields
    const pushname = msg.pushname || msg.contact?.pushname;
    const firstName = msg.contact?.first_name;
    const lastName = msg.contact?.last_name;
    const friendlyName = msg.contact?.friendly_name;

    if (firstName || lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim();
    }

    if (pushname) {
        return pushname;
    }

    if (friendlyName) {
        return friendlyName;
    }

    return null;
}

async function healUnknownContacts(dryRun: boolean = true) {
    console.log(dryRun ? "🔍 DRY RUN MODE - No changes will be made\n" : "✏️  LIVE MODE - Updating contacts\n");
    console.log("Finding contacts with 'Unknown' or 'WhatsApp' names...\n");

    // Find all contacts with "Unknown" or "WhatsApp" as first name
    const { data: unknownContacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone_1_number')
        .or('first_name.ilike.Unknown%,first_name.ilike.WhatsApp%')
        .not('phone_1_number', 'is', null)
        .order('id', { ascending: false });

    if (error) {
        console.error("Error fetching contacts:", error);
        return;
    }

    if (!unknownContacts || unknownContacts.length === 0) {
        console.log("✅ No contacts with 'Unknown' or 'WhatsApp' names found.");
        return;
    }

    console.log(`Found ${unknownContacts.length} contacts to process.\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Fetch all messages once to avoid rate limiting
    console.log("Fetching recent messages from 2Chat API...");
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(channelNumber)}?page_number=1&page_size=200`;
    const response = await fetch(url, {
        headers: {
            'X-User-API-Key': apiKey
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch messages from 2Chat API");
        return;
    }

    const data = await response.json();
    const allMessages = Array.isArray(data) ? data : (data.messages || []);
    console.log(`Fetched ${allMessages.length} recent messages\n`);

    for (const contact of unknownContacts as Contact[]) {
        const phoneNumber = contact.phone_1_number;

        // Skip group IDs (they start with 1203... and are very long)
        if (phoneNumber.startsWith('+1203') && phoneNumber.length > 15) {
            console.log(`⏭️  Skipping group ID: ${contact.id} (${phoneNumber})`);
            skippedCount++;
            continue;
        }

        console.log(`\n📞 Processing contact ID ${contact.id}: ${contact.first_name} ${contact.last_name}`);
        console.log(`   Phone: ${phoneNumber}`);

        // Find messages for this contact
        const normalizedPhone = phoneNumber.replace(/\D/g, '');
        const contactMessages = allMessages.filter((msg: any) => {
            const remotePhone = msg.remote_phone_number || '';
            const normalizedRemote = remotePhone.replace(/\D/g, '');
            // Match on last 9 digits to handle different country code formats
            return normalizedRemote.endsWith(normalizedPhone.slice(-9)) ||
                normalizedPhone.endsWith(normalizedRemote.slice(-9));
        });

        if (contactMessages.length === 0) {
            console.log(`   ⚠️  No messages found in recent history`);
            skippedCount++;
            continue;
        }

        console.log(`   Found ${contactMessages.length} message(s)`);

        // Try to extract name from the most recent message
        let extractedName = null;
        for (const msg of contactMessages) {
            extractedName = extractNameFromMessage(msg);
            if (extractedName) break;
        }

        if (!extractedName) {
            console.log(`   ⚠️  No name found in message data`);
            skippedCount++;
            continue;
        }

        // Split name into first/last
        const nameParts = extractedName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        console.log(`   ✅ Found name: "${firstName}" "${lastName}"`);

        if (dryRun) {
            console.log(`   [DRY RUN] Would update to: first_name="${firstName}", last_name="${lastName}"`);
            updatedCount++;
        } else {
            const { error: updateError } = await supabase
                .from('contacts')
                .update({
                    first_name: firstName,
                    last_name: lastName
                })
                .eq('id', contact.id);

            if (updateError) {
                console.error(`   ✗ Failed to update:`, updateError.message);
                failedCount++;
            } else {
                console.log(`   ✅ Updated successfully`);
                updatedCount++;
            }
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total contacts processed: ${unknownContacts.length}`);
    console.log(`   ${dryRun ? 'Would update' : 'Successfully updated'}: ${updatedCount}`);
    console.log(`   Skipped (groups/no data): ${skippedCount}`);
    console.log(`   Failed: ${failedCount}`);

    if (dryRun) {
        console.log(`\n💡 Run with --live flag to actually update the database:`);
        console.log(`   npx tsx scripts/heal-whatsapp-contacts.ts --live`);
    }
}

// Check for --live flag
const isLive = process.argv.includes('--live');
healUnknownContacts(!isLive);
