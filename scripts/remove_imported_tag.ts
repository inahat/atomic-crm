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

async function removeImportedTag() {
    // Sign in first as admin / user to satisfy RLS
    console.log("Signing in...");
    const { data: sales } = await supabase.from("sales").select("email").limit(1);
    
    // Try signing in or fetching tags
    const { data: tags, error: fetchError } = await supabase
        .from("tags")
        .select("*");

    console.log("Tags response:", tags, fetchError);

    if (tags && tags.length > 0) {
        const targetTag = tags.find(t => t.name.toLowerCase().includes("imported"));
        if (targetTag) {
            console.log(`Found target tag:`, targetTag);

            // Delete tag
            const { error: deleteErr } = await supabase
                .from("tags")
                .delete()
                .eq("id", targetTag.id);

            if (deleteErr) {
                console.error("Error deleting tag:", deleteErr);
            } else {
                console.log(`Successfully deleted tag '${targetTag.name}' (ID: ${targetTag.id})!`);
            }
        } else {
            console.log("No tag containing 'imported' was found in tags list.");
        }
    }
}

removeImportedTag();
