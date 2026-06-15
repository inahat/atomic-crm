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

interface Contact {
    id: number;
    first_name: string;
    last_name: string;
    phone_1_number: string;
}

function extractNameFromWebhook(payload: any, phoneNumber: string): { firstName: string, lastName: string } | null {
    // For group messages, check if this phone is a participant
    if (payload.participant) {
        const participantPhone = payload.participant.phone_number || payload.participant;
        const normalizedParticipant = participantPhone.replace(/\D/g, '');
        const normalizedTarget = phoneNumber.replace(/\D/g, '');

        if (normalizedParticipant.endsWith(normalizedTarget.slice(-9)) ||
            normalizedTarget.endsWith(normalizedParticipant.slice(-9))) {
            const pushname = payload.participant.pushname;
            if (pushname) {
                const parts = pushname.trim().split(/\s+/);
                return {
                    firstName: parts[0],
                    lastName: parts.length > 1 ? parts.slice(1).join(' ') : ''
                };
            }
        }
    }

    // For individual messages
    const remotePhone = payload.remote_phone_number || '';
    const normalizedRemote = remotePhone.replace(/\D/g, '');
    const normalizedTarget = phoneNumber.replace(/\D/g, '');

    if (normalizedRemote.endsWith(normalizedTarget.slice(-9)) ||
        normalizedTarget.endsWith(normalizedRemote.slice(-9))) {

        // Try structured name first
        const firstName = payload.contact?.first_name;
        const lastName = payload.contact?.last_name;
        if (firstName || lastName) {
            return {
                firstName: firstName || 'Unknown',
                lastName: lastName || ''
            };
        }

        // Try pushname
        const pushname = payload.pushname || payload.contact?.pushname;
        if (pushname) {
            const parts = pushname.trim().split(/\s+/);
            return {
                firstName: parts[0],
                lastName: parts.length > 1 ? parts.slice(1).join(' ') : ''
            };
        }

        // Try friendly name
        const friendlyName = payload.contact?.friendly_name;
        if (friendlyName) {
            const parts = friendlyName.trim().split(/\s+/);
            return {
                firstName: parts[0],
                lastName: parts.length > 1 ? parts.slice(1).join(' ') : ''
            };
        }
    }

    return null;
}

async function healFromWebhookData(dryRun: boolean = true) {
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

    // Fetch all webhook payloads
    console.log("Fetching webhook payloads from database...");
    const { data: webhooks } = await supabase
        .from('webhook_debug')
        .select('payload, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

    if (!webhooks || webhooks.length === 0) {
        console.log("⚠️  No webhook payloads found in database");
        return;
    }

    console.log(`Fetched ${webhooks.length} webhook payloads\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const contact of unknownContacts as Contact[]) {
        const phoneNumber = contact.phone_1_number;

        // Skip group IDs (they start with 1203... and are very long)
        if (phoneNumber.startsWith('+1203') && phoneNumber.length > 15) {
            console.log(`⏭️  Skipping group ID: ${contact.id} (${phoneNumber.substring(0, 20)}...)`);
            skippedCount++;
            continue;
        }

        console.log(`\n📞 Processing contact ID ${contact.id}: ${contact.first_name} ${contact.last_name}`);
        console.log(`   Phone: ${phoneNumber}`);

        // Search through webhooks for this phone number
        let foundName = null;
        for (const webhook of webhooks) {
            const payload = webhook.payload as any;
            const extractedName = extractNameFromWebhook(payload, phoneNumber);
            if (extractedName) {
                foundName = extractedName;
                break;
            }
        }

        if (!foundName) {
            console.log(`   ⚠️  No name found in webhook history`);
            skippedCount++;
            continue;
        }

        console.log(`   ✅ Found name: "${foundName.firstName}" "${foundName.lastName}"`);

        if (dryRun) {
            console.log(`   [DRY RUN] Would update to: first_name="${foundName.firstName}", last_name="${foundName.lastName}"`);
            updatedCount++;
        } else {
            const { error: updateError } = await supabase
                .from('contacts')
                .update({
                    first_name: foundName.firstName,
                    last_name: foundName.lastName
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
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total contacts processed: ${unknownContacts.length}`);
    console.log(`   ${dryRun ? 'Would update' : 'Successfully updated'}: ${updatedCount}`);
    console.log(`   Skipped (groups/no data): ${skippedCount}`);
    console.log(`   Failed: ${failedCount}`);

    if (dryRun) {
        console.log(`\n💡 Run with --live flag to actually update the database:`);
        console.log(`   npx tsx scripts/heal-from-webhooks.ts --live`);
    } else {
        console.log(`\n✅ Healing complete!`);
        console.log(`\n📝 Note: Contacts without webhook history will be auto-healed`);
        console.log(`   when they send their next message (thanks to the updated webhook handler).`);
    }
}

// Check for --live flag
const isLive = process.argv.includes('--live');
healFromWebhookData(!isLive);
