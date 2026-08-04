import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://bxosgtiwjkpuguyggicm.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUsers() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    console.log("=== AUTH USERS ===");
    console.log(users?.users?.map(u => ({ id: u.id, email: u.email, user_metadata: u.user_metadata })));

    const { data: sales } = await supabase.from("sales").select("*");
    console.log("=== SALES TABLE ===");
    console.log(sales);
}

checkAuthUsers();
