
import { createClient } from '@supabase/supabase-js';

// Using the verified working Anon Key
const SUPABASE_URL = 'https://bxosgtiwjkpuguyggicm.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3NndGl3amtwdWd1eWdnaWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MzEyMjcsImV4cCI6MjA4MzUwNzIyN30.-uzc962PLSr1izYQeX2L0KTEvpnQyxtoea6af1UPirI';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const NEW_USER = {
    email: 'admin@atomic.ltd',
    password: 'password123',
    first_name: 'Admin',
    last_name: 'User',
};

async function createAdmin() {
    console.log(`Creating user ${NEW_USER.email}...`);

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: NEW_USER.email,
        password: NEW_USER.password,
    });

    if (authError) {
        console.error('Sign Up Error:', authError.message);
        return;
    }

    if (!authData.user) {
        console.error('Sign Up Failed: No user returned (Check email confirmation settings).');
        return;
    }

    console.log('Auth User Created:', authData.user.id);

    // 2. Create Sales Profile
    // Note: We need a session to insert into 'sales' due to RLS. 
    // signUp() usually returns a session if email confirmation is disabled.
    if (!authData.session) {
        console.warn('WARNING: No session returned. Email confirmation might be required.');
        console.warn('Cannot insert into public.sales without an active session.');
        console.warn('Please confirm your email and then manually insert the sales record.');
        return;
    }

    const { error: salesError } = await supabase
        .from('sales')
        .insert([
            {
                id: undefined, // Let DB generate ID
                user_id: authData.user.id,
                first_name: NEW_USER.first_name,
                last_name: NEW_USER.last_name,
                email: NEW_USER.email,
                administrator: true,
                disabled: false,
            },
        ]);

    if (salesError) {
        console.error('Sales Profile Error:', salesError.message);
    } else {
        console.log('SUCCESS: Sales profile created and linked.');
        console.log(`You can now login with: ${NEW_USER.email} / ${NEW_USER.password}`);
    }
}

createAdmin();
