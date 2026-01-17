
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: '.env.development' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bxosgtiwjkpuguyggicm.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CLIENTS_FILE = path.join(process.cwd(), 'test-data', 'Clients Jan 09, 2026 11 11.csv');
const CONTACTS_FILE = path.join(process.cwd(), 'test-data', 'Contacts Jan 09, 2026 11 09.csv');

const ADMIN_EMAIL = 'admin@atomic.ltd';
const ADMIN_PASSWORD = 'password123';

async function verify() {
    console.log("🔍 Verifying Data Import Config...");

    // Authenticate to bypass RLS
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
    });

    if (authError || !authData.session) {
        console.error('Authentication checking failed (RLS may hide counts):', authError?.message);
    } else {
        console.log('✅ Authenticated as Admin for verification.');
    }

    // 1. Get CSV Counts
    let clientCsvCount = 0;
    let contactCsvCount = 0;

    if (fs.existsSync(CLIENTS_FILE)) {
        const content = fs.readFileSync(CLIENTS_FILE, 'utf8').replace(/^\uFEFF/, '');
        const records = parse(content, { columns: true, skip_empty_lines: true });
        clientCsvCount = records.length;
    }

    if (fs.existsSync(CONTACTS_FILE)) {
        const content = fs.readFileSync(CONTACTS_FILE, 'utf8').replace(/^\uFEFF/, '');
        const records = parse(content, { columns: true, skip_empty_lines: true });
        contactCsvCount = records.length;
    }

    // 2. Get DB Counts
    const { count: companyDbCount, error: err1 } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    const { count: contactDbCount, error: err2 } = await supabase.from('contacts').select('*', { count: 'exact', head: true });

    if (err1 || err2) {
        console.error("Error fetching DB counts", err1, err2);
        return;
    }

    console.log("\n📊 Verification Results:");
    console.log("------------------------------------------------");
    console.log(`TYPE       | CSV RECORDS | DB RECORDS | STATUS`);
    console.log("------------------------------------------------");
    console.log(`Companies  | ${clientCsvCount.toString().padEnd(11)} | ${companyDbCount.toString().padEnd(10)} | ${clientCsvCount <= companyDbCount ? '✅ OK' : '⚠️ MISMATCH'}`);
    console.log(`Contacts   | ${contactCsvCount.toString().padEnd(11)} | ${contactDbCount.toString().padEnd(10)} | ${contactCsvCount <= contactDbCount ? '✅ OK' : '⚠️ MISMATCH'}`);
    console.log("------------------------------------------------");
    console.log("\n(Note: DB Records may be higher if data existed previously)");
}

verify();
