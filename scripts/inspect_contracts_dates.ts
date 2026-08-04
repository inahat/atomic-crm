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

async function inspectDates() {
    const { data: contracts } = await supabase
        .from("contracts")
        .select("*");

    console.log("=== CONTRACTS WITH PROPOSAL / PROPOSAL-SENT STATUS ===");
    contracts?.filter(c => (c.status || "").toLowerCase().includes("proposal")).forEach(c => {
        console.log({
            id: c.id,
            contract_number: c.contract_number,
            contract_name: c.contract_name,
            amount: c.amount,
            status: c.status,
            start_date: c.start_date,
            created_at: c.created_at,
            updated_at: c.updated_at
        });
    });
}

inspectDates();
