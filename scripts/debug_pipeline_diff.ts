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

async function debugDiff() {
    console.log("=== CONTRACTS (proposal-sent) ===");
    const { data: contracts } = await supabase
        .from("contracts")
        .select("id, contract_number, contract_name, company_id, amount, status, start_date");
    
    console.log("All contracts count:", contracts?.length);
    contracts?.filter(c => (c.status || "").toLowerCase().includes("proposal")).forEach(c => {
        console.log(`CONTRACT: [${c.id}] ${c.contract_number} | ${c.contract_name} | Company: ${c.company_id} | £${c.amount} | Status: ${c.status} | Start: ${c.start_date}`);
    });

    console.log("\n=== DEALS (proposal-sent / opportunity) ===");
    const { data: deals } = await supabase
        .from("deals")
        .select("id, name, company_id, amount, stage, created_at");

    console.log("All deals count:", deals?.length);
    deals?.forEach(d => {
        console.log(`DEAL: [${d.id}] ${d.name} | Company: ${d.company_id} | £${d.amount} | Stage: ${d.stage} | Created: ${d.created_at}`);
    });
}

debugDiff();
