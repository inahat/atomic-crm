
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixProfiles() {
    console.log('Fetching users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`Checking profile for user: ${user.email} (${user.id})`);

        const { data: profile, error: profileError } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "Row not found" (JSON) or 406 equivalent
            console.error(`Error checking profile for ${user.email}:`, profileError);
            continue;
        }

        if (profile) {
            console.log(`- Profile exists for ${user.email}.`);
        } else {
            console.log(`- Missing profile for ${user.email}. Creating...`);
            const { error: insertError } = await supabase
                .from('sales')
                .insert({
                    user_id: user.id,
                    first_name: 'Admin', // Placeholder
                    last_name: 'User',
                    email: user.email,
                    administrator: true,
                    disabled: false
                });

            if (insertError) {
                console.error(`Failed to create profile for ${user.email}:`, insertError);
            } else {
                console.log(`- Profile created successfully for ${user.email}`);
            }
        }
    }
}

fixProfiles();
