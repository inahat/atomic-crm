
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bxosgtiwjkpuguyggicm.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3NndGl3amtwdWd1eWdnaWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MzEyMjcsImV4cCI6MjA4MzUwNzIyN30.-uzc962PLSr1izYQeX2L0KTEvpnQyxtoea6af1UPirI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = 'admin@atomic.ltd';
const ADMIN_PASSWORD = 'password123';

const CLIENTS_FILE = path.join(process.cwd(), 'test-data', 'Clients Jan 09, 2026 11 11.csv');
const CONTACTS_FILE = path.join(process.cwd(), 'test-data', 'Contacts Jan 09, 2026 11 09.csv');

async function importData() {
    console.log('🚀 Starting Data Import...');

    // Authenticate as Admin
    console.log(`Authenticating as ${ADMIN_EMAIL}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });

    if (authError || !authData.session) {
        console.error('Authentication failed:', authError?.message || 'No session returned');
        console.error('Ensure the user exists and credentials are correct.');
        return;
    }
    console.log('✅ Authenticated successfully.');


    // --- Phase 1: Import Companies (Clients) ---
    console.log('\n--- Phase 1: Importing Companies ---');

    if (!fs.existsSync(CLIENTS_FILE)) {
        console.error(`File not found: ${CLIENTS_FILE}`);
        return;
    }

    const clientsRaw = fs.readFileSync(CLIENTS_FILE, 'utf8').replace(/^\uFEFF/, '');
    const clients = parse(clientsRaw, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`Found ${clients.length} clients to process.`);

    // Cache existing companies to avoid duplicates and getting IDs
    // Since 'name' is not guaranteed unique in DB schema, we'll fetch all and map by Name.
    // If multiple exist with same name, we pick one (the first one).
    const companyMap = new Map(); // Name -> ID

    // Fetch existing companies
    const { data: existingCompanies, error: fetchError } = await supabase
        .from('companies')
        .select('id, name');

    if (fetchError) {
        console.error('Error fetching existing companies:', fetchError);
        return;
    }

    existingCompanies.forEach(c => {
        if (c.name) companyMap.set(c.name.trim(), c.id);
    });

    console.log(`Loaded ${companyMap.size} existing companies from DB.`);

    let companiesCreated = 0;
    let companiesUpdated = 0;

    for (const client of clients) {
        const name = client['Client Name']?.trim();
        if (!name) continue;

        const companyData = {
            name: name,
            website: client['Client Website'],
            phone_number: client['Client Phone'],
            address: client['Client Billing Street'],
            city: client['Client Billing City'],
            zipcode: client['Client Billing Postal Code'],
            country: client['Client Billing Country'],
            // Add other fields as needed
        };

        if (companyMap.has(name)) {
            // Update existing
            const id = companyMap.get(name);
            const { error } = await supabase
                .from('companies')
                .update(companyData)
                .eq('id', id);

            if (error) console.error(`Failed to update company ${name}:`, error);
            else companiesUpdated++;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('companies')
                .insert(companyData)
                .select('id')
                .single();

            if (error) {
                console.error(`Failed to create company ${name}:`, error);
            } else if (data) {
                companyMap.set(name, data.id); // Update map so we can link contacts later
                companiesCreated++;
            }
        }
    }

    console.log(`Companies processing complete. Created: ${companiesCreated}, Updated: ${companiesUpdated}`);


    // --- Phase 2: Import Contacts ---
    console.log('\n--- Phase 2: Importing Contacts ---');

    if (!fs.existsSync(CONTACTS_FILE)) {
        console.error(`File not found: ${CONTACTS_FILE}`);
        return;
    }

    const contactsRaw = fs.readFileSync(CONTACTS_FILE, 'utf8').replace(/^\uFEFF/, '');
    const contacts = parse(contactsRaw, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`Found ${contacts.length} contacts to process.`);

    let contactsCreated = 0;
    let contactsUpdated = 0; // "Updated" here might mean just skipped if we don't have a good unique key besides email

    for (const contact of contacts) {
        const firstName = contact['First Name']?.trim();
        const lastName = contact['Last Name']?.trim();
        const email = contact['E-mail']?.trim();

        // Skip if basically empty
        if (!firstName && !lastName && !email) continue;

        // Find Company ID
        const companyName = contact['Company']?.trim();
        let companyId = null;
        if (companyName) {
            companyId = companyMap.get(companyName);
            if (!companyId) {
                console.warn(`Warning: Contact ${firstName} ${lastName} belongs to unknown company '${companyName}'`);
            }
        }

        const contactData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            company_id: companyId,
            address_line_1: contact['Street'],
            city: contact['City'],
            postcode: contact['Postal Code'],
            country: contact['Country'],
            owner_company: contact['Owner'], // Mapping "Owner" from CSV to "owner_company"
            // Map other phones
            phone_1_number: contact['Phone'] || contact['Business Phone'],
            phone_2_number: contact['Mobile'] || contact['Mobile Phone'],
            title: contact['Title'],
            // 'background' or notes?
        };

        // Try to match by Email first (if exists), then by Name?
        // Let's use Email as primary de-dupe key if present.
        let existingContactId = null;

        if (email) {
            const { data } = await supabase.from('contacts').select('id').eq('email', email).maybeSingle();
            if (data) existingContactId = data.id;
        }

        // If no email match, maybe try first+last name? (Riskier)
        if (!existingContactId && firstName && lastName) {
            const { data } = await supabase.from('contacts')
                .select('id')
                .eq('first_name', firstName)
                .eq('last_name', lastName)
                .maybeSingle();
            if (data) existingContactId = data.id;
        }

        if (existingContactId) {
            // Update
            const { error } = await supabase
                .from('contacts')
                .update(contactData)
                .eq('id', existingContactId);

            if (error) console.error(`Failed to update contact ${firstName} ${lastName}:`, error);
            else contactsUpdated++;
        } else {
            // Insert
            const { error } = await supabase
                .from('contacts')
                .insert(contactData);

            if (error) console.error(`Failed to create contact ${firstName} ${lastName}:`, error);
            else contactsCreated++;
        }
    }

    console.log(`Contacts processing complete. Created: ${contactsCreated}, Updated: ${contactsUpdated}`);
    console.log('\n✅ Import finished.');
}

importData().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
