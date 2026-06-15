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

if (!supabaseUrl || !supabaseServiceKey || !apiKey) {
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

async function fetchContactFromTwoChat(phoneNumber: string): Promise<{ name: string | null }> {
    try {
        // Try to get contact info from 2Chat API
        // Note: This endpoint may vary - check 2Chat API docs
        const response = await fetch(`https://api.p.2chat.io/open/contacts/${encodeURIComponent(phoneNumber)}`, {
            headers: {
                'X-User-API-Key': apiKey
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Extract name from response - adjust based on actual API response structure
            const name = data.pushname || data.name || data.friendly_name || null;
            return { name };
        }
    } catch (error) {
        console.error(`Error fetching contact ${phoneNumber} from 2Chat:`, error);
    }

    return { name: null };
}

async function healUnknownContacts() {
    console.log("Finding contacts with 'Unknown' names...\n");

    // Find all contacts with "Unknown" as first name
    const { data: unknownContacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone_1_number')
        .eq('first_name', 'Unknown')
        .not('phone_1_number', 'is', null);

    if (error) {
        console.error("Error fetching contacts:", error);
        return;
    }

    if (!unknownContacts || unknownContacts.length === 0) {
        console.log("No contacts with 'Unknown' names found.");
        return;
    }

    console.log(`Found ${unknownContacts.length} contacts with 'Unknown' names.\n`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const contact of unknownContacts as Contact[]) {
        console.log(`Processing contact ID ${contact.id} (${contact.phone_1_number})...`);

        // Try to fetch name from 2Chat
        const { name } = await fetchContactFromTwoChat(contact.phone_1_number);

        if (name) {
            // Split name into first/last
            const nameParts = name.trim().split(/\s+/);
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            console.log(`  → Updating to: ${firstName} ${lastName}`);

            const { error: updateError } = await supabase
                .from('contacts')
                .update({
                    first_name: firstName,
                    last_name: lastName
                })
                .eq('id', contact.id);

            if (updateError) {
                console.error(`  ✗ Failed to update:`, updateError.message);
                failedCount++;
            } else {
                console.log(`  ✓ Updated successfully`);
                updatedCount++;
            }
        } else {
            console.log(`  → No name found in 2Chat API`);
            failedCount++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n========== Summary ==========`);
    console.log(`Total contacts processed: ${unknownContacts.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed/No data: ${failedCount}`);
}

healUnknownContacts();
