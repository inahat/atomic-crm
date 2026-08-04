import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://bxosgtiwjkpuguyggicm.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTags() {
    const { data: tags, error } = await supabase
        .from("tags")
        .select("*");

    if (error) {
        console.error("Error fetching tags:", error);
    } else {
        console.log("Found tags:", JSON.stringify(tags, null, 2));
    }
}

listTags();
