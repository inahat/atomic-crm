
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase URL and Service Key are required.');
    console.error('Expected VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DRY_RUN = process.argv.includes('--dry-run');

interface Contact {
    id: number;
    first_name: string | null;
    last_name: string | null;
    phone_1_number: string | null;
    phone_2_number: string | null;
    tags: string[] | null;
}

interface Identity {
    id: number;
    contact_id: number;
    platform: string;
    identity_data: any;
}

// Helper to normalize phone numbers
function normalizePhone(phone: string | null): string | null {
    if (!phone) return null;
    try {
        // Assume GB if no country code provided, but handle + prefix
        const parsed = parsePhoneNumber(phone, 'GB');
        if (parsed && parsed.isValid()) {
            return parsed.format('E.164');
        }
    } catch (e) {
        // If parsing fails, strip non-digits and check length
        const stripped = phone.replace(/\D/g, '');
        // simple heuristic backup if libphonenumber fails (unlikely for valid numbers)
        if (stripped.length >= 10) return '+' + stripped;
    }
    return null;
}

async function deduplicateContacts() {
    console.log(`Starting deduplication... Dry Run: ${DRY_RUN}`);

    // 1. Fetch all contacts
    const { data: allContacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*');

    if (contactsError || !allContacts) {
        console.error('Error fetching contacts:', contactsError);
        return;
    }

    console.log(`Fetched ${allContacts.length} total contacts.`);

    // 2. Fetch all identities (to move them if needed)
    const { data: allIdentities, error: identitiesError } = await supabase
        .from('identities')
        .select('*');

    if (identitiesError) {
        console.error('Error fetching identities:', identitiesError);
        return;
    }

    // 3. Separate Candidates (New Import) from Targets (Legacy)
    const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name');

    if (tagsError) {
        console.error('Error fetching tags:', tagsError);
        return;
    }

    const importTag = tagsData.find(t => t.name === 'Imported-iPhone-CSV');
    if (!importTag) {
        console.error("Error: Could not find 'Imported-iPhone-CSV' tag.");
        return;
    }
    const importTagId = importTag.id; // Keep as number
    console.log(`'Imported-iPhone-CSV' tag ID is: ${importTagId}`);

    const targets: Contact[] = [];
    const candidates: Contact[] = [];

    for (const contact of allContacts) {
        // Tags can be string[] or number[] depending on DB/Driver. Handle both.
        const contactTags = (contact.tags || []).map((t: any) => Number(t));

        // Check if contact has the import tag
        if (contactTags.includes(importTagId)) {
            candidates.push(contact);
        } else {
            targets.push(contact);
        }
    }

    console.log(`Found ${targets.length} Target (Legacy) contacts.`);
    console.log(`Found ${candidates.length} Candidate (Imported) contacts.`);

    // 4. Build Map of Normalized Phones for Targets
    // Map: NormalizedPhone -> Contact
    const targetPhoneMap = new Map<string, Contact>();

    for (const target of targets) {
        const p1 = normalizePhone(target.phone_1_number);
        const p2 = normalizePhone(target.phone_2_number);

        if (p1) {
            if (targetPhoneMap.has(p1)) {
                // Determine which one to keep in map? Perhaps just warn for now.
                // console.warn(`Duplicate phone ${p1} in Targets (IDs: ${targetPhoneMap.get(p1)?.id}, ${target.id})`);
            }
            targetPhoneMap.set(p1, target);
        }
        if (p2 && p2 !== p1) {
            targetPhoneMap.set(p2, target);
        }
    }

    // 5. Iterate Candidates and find matches
    let mergedCount = 0;

    for (const candidate of candidates) {
        const cP1 = normalizePhone(candidate.phone_1_number);
        // Candidates from this specific import likely only have phone_1 populated based on previous script,
        // but let's check both just in case.
        const cP2 = normalizePhone(candidate.phone_2_number);

        let match: Contact | undefined;

        if (cP1 && targetPhoneMap.has(cP1)) {
            match = targetPhoneMap.get(cP1);
        } else if (cP2 && targetPhoneMap.has(cP2)) {
            match = targetPhoneMap.get(cP2);
        }

        if (match) {
            console.log(`\nFound Match!`);
            console.log(`  Candidate: ${candidate.first_name} ${candidate.last_name} (ID: ${candidate.id}) - Phone: ${candidate.phone_1_number}`);
            console.log(`  Target:    ${match.first_name} ${match.last_name} (ID: ${match.id}) - Phone 1: ${match.phone_1_number}, Phone 2: ${match.phone_2_number}`);

            // MERGE LOGIC

            // A. Move Identites
            const candidateIdentities = allIdentities?.filter(i => i.contact_id === candidate.id) || [];
            const targetIdentities = allIdentities?.filter(i => i.contact_id === match!.id) || [];

            for (const identity of candidateIdentities) {
                // Check if target already has this identity type?
                // For now, let's just move it.
                console.log(`  -> Moving Identity (ID: ${identity.id}, Platform: ${identity.platform}) to Target`);

                if (!DRY_RUN) {
                    const { error: moveError } = await supabase
                        .from('identities')
                        .update({ contact_id: match.id })
                        .eq('id', identity.id);
                    if (moveError) console.error('     Error moving identity:', moveError);
                }
            }

            // B. Add Import Tag to Target
            const currentTargetTags = match.tags || [];
            if (!currentTargetTags.includes(importTagId)) {
                console.log(`  -> Adding 'Imported-iPhone-CSV' tag to Target`);
                const newTags = [...currentTargetTags, importTagId];
                if (!DRY_RUN) {
                    const { error: tagError } = await supabase
                        .from('contacts')
                        .update({ tags: newTags })
                        .eq('id', match.id);
                    if (tagError) console.error('     Error updating tags:', tagError);
                }
            }

            // C. Delete Candidate
            console.log(`  -> Deleting Candidate Contact (ID: ${candidate.id})`);
            if (!DRY_RUN) {
                const { error: deleteError } = await supabase
                    .from('contacts')
                    .delete()
                    .eq('id', candidate.id);
                if (deleteError) console.error('     Error deleting contact:', deleteError);
            }

            mergedCount++;
        }
    }

    console.log(`\nDeduplication complete.`);
    console.log(`${mergedCount} contacts merged.`);
    if (DRY_RUN) console.log('This was a DRY RUN. No changes were made.');
}

deduplicateContacts().catch(console.error);
