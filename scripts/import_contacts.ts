
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CsvContact {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
}

const CSV_PATH = path.resolve(process.cwd(), 'test-data/contactiphone.csv');

async function importContacts() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log(`Starting contact import... ${dryRun ? '(DRY RUN)' : ''}`);

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`CSV file not found: ${CSV_PATH}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records: CsvContact[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`Found ${records.length} records in CSV.`);

    let stats = {
        processed: 0,
        added: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        identitiesCreated: 0
    };

    let tagId: number | null = null;
    if (!dryRun) {
        // Find or create tag
        const tagName = 'Imported-iPhone-CSV';
        const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .maybeSingle();

        if (existingTag) {
            tagId = existingTag.id;
        } else {
            const { data: newTag, error: tagError } = await supabase
                .from('tags')
                .insert({ name: tagName, color: '#FF0000' }) // Red color for import
                .select('id')
                .single();

            if (tagError) {
                console.error(`Error creating tag: ${tagError.message}`);
            } else {
                tagId = newTag.id;
            }
        }
    }

    for (const record of records) {
        stats.processed++;
        const { id: csvId, first_name, last_name, phone_number } = record;
        const fullName = `${first_name || ''} ${last_name || ''}`.trim();

        // Normalize phone number
        let normalizedPhone = phone_number;
        // Basic cleanup for spaces if libphonenumber needs it, but it handles most.
        // Assuming UK/International context based on previous data seen (e.g. +44).
        // If it starts with 0, assume it might be local (e.g. UK).
        // Let's try to parse with a default region if needed, or strictly allow E.164.
        // The CSV showed "+44..." and "0 845...".

        let phoneNumberObj;
        try {
            // Try parsing with GB default if no country code provided and it looks like a local number
            phoneNumberObj = parsePhoneNumber(phone_number, 'GB');
        } catch (e) {
            // ignore
        }

        if (!phoneNumberObj || !phoneNumberObj.isValid()) {
            console.log(`[SKIP] Invalid phone number for ${fullName}: ${phone_number}`);
            stats.skipped++;
            continue;
        }

        normalizedPhone = phoneNumberObj.number as string; // E.164 format

        console.log(`Processing: ${fullName} (${normalizedPhone})`);

        try {
            // 1. Check Identities
            const { data: existingIdentities } = await supabase
                .from('identities')
                .select('contact_id')
                .eq('type', 'phone')
                .eq('value', normalizedPhone)
                .maybeSingle();

            if (existingIdentities) {
                console.log(`  -> Match found in Identities (Contact ID: ${existingIdentities.contact_id})`);
                // Match found, maybe update contact name if empty?
                // For now, just log.
                stats.skipped++;
                continue;
            }

            // 2. Check Contacts (legacy match)
            const { data: existingContacts } = await supabase
                .from('contacts')
                .select('id, first_name, last_name')
                .or(`phone_1_number.eq.${normalizedPhone},phone_2_number.eq.${normalizedPhone}`) // simple check, might need better normalization check if DB has weird formats
                // Actually, best to rely on normalized format. If DB has raw Format, this might miss.
                // But we have updated heal scripts so assume DB is relatively clean or we just migrate forward.
                .order('id', { ascending: false }) // get latest
                .limit(1);

            let contactId;

            if (existingContacts && existingContacts.length > 0) {
                const existingContact = existingContacts[0];
                contactId = existingContact.id;
                console.log(`  -> Match found in Contacts (ID: ${contactId})`);

                // Create Identity for future
                if (!dryRun) {
                    const { error: idError } = await supabase.from('identities').insert({
                        contact_id: contactId,
                        type: 'phone',
                        value: normalizedPhone,
                        is_primary: true // assume found phone is primary if matched
                    });
                    if (idError) console.error(`    Error creating identity: ${idError.message}`);
                    else {
                        console.log(`    Created Identity record.`);
                        stats.identitiesCreated++;
                    }
                }
            } else {
                // 3. Create New Contact
                console.log(`  -> New Contact`);
                if (!dryRun) {
                    const { data: newContact, error: createError } = await supabase
                        .from('contacts')
                        .insert({
                            first_name: first_name,
                            last_name: last_name,
                            phone_1_number: normalizedPhone,
                            tags: tagId ? [tagId] : [],
                            // organization_id? 
                        })
                        .select('id')
                        .single();

                    if (createError) {
                        console.error(`    Error creating contact: ${createError.message}`);
                        stats.errors++;
                        continue;
                    }

                    contactId = newContact.id;
                    stats.added++;
                    console.log(`    Created Contact (ID: ${contactId})`);

                    // Create Identity
                    const { error: idError } = await supabase.from('identities').insert({
                        contact_id: contactId,
                        type: 'phone',
                        value: normalizedPhone,
                        is_primary: true
                    });
                    if (idError) console.error(`    Error creating identity: ${idError.message}`);
                    else stats.identitiesCreated++;

                } else {
                    stats.added++;
                }
            }

        } catch (error) {
            console.error(`  Error processing ${fullName}:`, error);
            stats.errors++;
        }
    }

    console.log('\nImport Summary:');
    console.log(JSON.stringify(stats, null, 2));
}

importContacts();
