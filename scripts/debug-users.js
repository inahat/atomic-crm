
import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging purposes
const SUPABASE_URL = 'https://bxosgtiwjkpuguyggicm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugUsers() {
    console.log('--- Auth Users (auth.users) ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching auth users:', authError);
    } else {
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Verified: ${u.email_confirmed_at ? 'Yes' : 'No'} | Last Sign In: ${u.last_sign_in_at}`);
        });
        if (users.length === 0) console.log('No auth users found.');
    }

    console.log('\n--- CRM Profiles (public.sales) ---');
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*');

    if (salesError) {
        console.error('Error fetching sales profiles:', salesError);
    } else {
        sales.forEach(s => {
            console.log(`ID: ${s.id} | Name: ${s.first_name} ${s.last_name} | Email: ${s.email} | User ID (FK): ${s.user_id}`);
        });
        if (sales.length === 0) console.log('No sales profiles found.');
    }
}

debugUsers();
