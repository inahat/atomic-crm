
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.production.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const CSV_PATH = path.join(process.cwd(), "test-data", "Service_Plans.csv");

const run = async () => {
    console.log(`Reading CSV from ${CSV_PATH}...`);
    if (!fs.existsSync(CSV_PATH)) {
        console.error("CSV file not found!");
        process.exit(1);
    }

    const fileContent = fs.readFileSync(CSV_PATH, "utf-8");
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Found ${records.length} records. Processing...`);

    for (const record of records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error(`Error processing record ${record["Number"]}:`, error);
        }
    }

    console.log("Import completed.");
};

const processRecord = async (record) => {
    const companyName = record["Client"];
    const contractNumber = record["Number"];

    if (!companyName) {
        console.warn("Skipping record with missing Client name");
        return;
    }

    // 1. Upsert Company (Master Record logic for Address)
    // We first try to find the company to get its ID
    let companyId;
    const { data: existingCompanies, error: findError } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyName)
        .limit(1);

    if (findError) throw findError;

    const companyData = {
        name: companyName,
        address: record["Site Street"],
        // Parse other address fields if possible, or append to address
        // The CSV has "Site Street", but not City/Zip explicitly mapped in my plan, 
        // but looking at CSV, it seems strictly "Site Street".
    };

    if (existingCompanies && existingCompanies.length > 0) {
        companyId = existingCompanies[0].id;
        // Update existing company with Master Data (Address)
        const { error: updateError } = await supabase
            .from("companies")
            .update(companyData)
            .eq("id", companyId);

        if (updateError) throw updateError;
        // console.log(`Updated company: ${companyName}`);
    } else {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
            .from("companies")
            .insert([companyData])
            .select("id")
            .single();

        if (createError) throw createError;
        companyId = newCompany.id;
        console.log(`Created company: ${companyName}`);
    }

    // 2. Upsert Contract
    const contractData = {
        company_id: companyId,
        contract_number: contractNumber,
        contract_name: record["Service Plan"] || `Service Agreement ${contractNumber}`,
        start_date: parseDate(record["Start"]),
        expiry_date: parseDate(record["End"]),
        amount: parseAmount(record["Annual Price (GBP)"]),
        status: parseStatus(record["Status"]),
    };

    // Check if contract exists by number
    const { data: existingContract, error: findContractError } = await supabase
        .from("contracts")
        .select("id")
        .eq("contract_number", contractNumber)
        .limit(1);

    if (findContractError) throw findContractError;

    if (existingContract && existingContract.length > 0) {
        const { error: updateContractError } = await supabase
            .from("contracts")
            .update(contractData)
            .eq("id", existingContract[0].id);
        if (updateContractError) throw updateContractError;
    } else {
        const { error: insertContractError } = await supabase
            .from("contracts")
            .insert([contractData]);
        if (insertContractError) throw insertContractError;
        console.log(`Created contract: ${contractNumber}`);
    }
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr; // Assuming yyyy-mm-dd format in CSV which matches DB date
};

const parseAmount = (amountStr) => {
    if (!amountStr) return null;
    return parseFloat(amountStr.replace(/,/g, ""));
};

const parseStatus = (statusStr) => {
    // Map CSV status to DB status if needed, but we updated DB to accept these values
    // Logic: "Open", "Approved", "Rejected"
    if (!statusStr) return "Open";
    return statusStr;
};

run().catch(console.error);
