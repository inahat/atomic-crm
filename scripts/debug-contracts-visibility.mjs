
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error("Missing VITE_SUPABASE_URL");
    process.exit(1);
}

const run = async () => {
    console.log("--- DEBUG START ---");

    // Check Keys existence
    console.log("Service Key defined?", !!serviceKey);
    console.log("Anon Key defined?", !!anonKey);

    if (serviceKey) {
        // Test Service Role Access (Should Bypass RLS)
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log("\nQuerying with SERVICE_ROLE_KEY...");
        const { count, error } = await supabaseAdmin
            .from("contracts")
            .select("*", { count: "exact", head: true });

        if (error) console.error("Service Role Query Error:", error.message);
        else console.log(`Total contracts (Service Role): ${count}`);

        // If count is 0, Import Failed.
    } else {
        console.warn("\nWARNING: No VITE_SUPABASE_SERVICE_ROLE_KEY found. Import likely ran as Anon.");
    }

    // Test Anon Access (Simulating Frontend)
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    console.log("\nQuerying with ANON_KEY...");
    const { count: countAnon, error: errorAnon } = await supabaseAnon
        .from("contracts")
        .select("*", { count: "exact", head: true });

    if (errorAnon) console.error("Anon Query Error:", errorAnon.message);
    else console.log(`Total contracts (Anon): ${countAnon}`);

    console.log("--- DEBUG END ---");
};

run().catch(console.error);
