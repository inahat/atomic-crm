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

async function rollbackBadNames() {
    console.log("Rolling back contacts with 'iHomes London & RE:SURE' name...\n");

    // Find contacts that were incorrectly set to the group name
    const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone_1_number')
        .eq('first_name', 'iHomes')
        .eq('last_name', 'London & RE:SURE');

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!contacts || contacts.length === 0) {
        console.log("No contacts to rollback");
        return;
    }

    console.log(`Found ${contacts.length} contacts to rollback\n`);

    for (const contact of contacts) {
        // Check if this is a group ID or individual phone
        const isGroupId = contact.phone_1_number.startsWith('+1203') && contact.phone_1_number.length > 15;

        if (isGroupId) {
            console.log(`Keeping group: ${contact.id} (${contact.phone_1_number.substring(0, 20)}...)`);
            continue;
        }

        // Rollback to Unknown for individual contacts
        console.log(`Rolling back contact ${contact.id}: ${contact.phone_1_number}`);

        const { error: updateError } = await supabase
            .from('contacts')
            .update({
                first_name: 'Unknown',
                last_name: contact.phone_1_number
            })
            .eq('id', contact.id);

        if (updateError) {
            console.error(`  ✗ Failed:`, updateError.message);
        } else {
            console.log(`  ✅ Rolled back`);
        }
    }

    console.log("\n✅ Rollback complete");
}

rollbackBadNames();
