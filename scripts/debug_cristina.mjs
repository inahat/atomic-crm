import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production.local" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const debugSchemaAndContracts = async () => {
    console.log("1. Checking 'companies' table schema (first row)...");
    const { data: companySample, error: schemaError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);

    if (schemaError) {
        console.error("Error fetching company sample:", schemaError);
    } else if (companySample.length > 0) {
        console.log("Company columns:", Object.keys(companySample[0]));
    } else {
        console.log("No companies found to inspect schema.");
    }

    console.log("\n2. Searching for contracts linked to Contact ID 369 (Cristina Stenbeck)...");
    const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('contact_id', 369);

    if (contractError) {
        console.error("Contract search error:", contractError);
    } else if (contracts.length === 0) {
        console.log("No contracts found for Contact ID 369.");

        // Try searching for any contract with 'Cristina' in the name?
        console.log("Trying loose search for contracts...");
        const { data: looseContracts } = await supabase
            .from('contracts')
            .select('*')
            .ilike('contract_name', '%Cristina%');

        if (looseContracts && looseContracts.length > 0) {
            console.log(`Found ${looseContracts.length} contracts by name match:`);
            looseContracts.forEach(c => console.log(`- ${c.contract_name} (ID: ${c.id}, Site Address ID: ${c.site_address_id})`));

            if (looseContracts[0].site_address_id) {
                await fetchAddress(looseContracts[0].site_address_id);
            }
        }
    } else {
        console.log(`Found ${contracts.length} contracts for Contact ID 369:`);
        for (const contract of contracts) {
            console.log(`\nContract: ${contract.contract_name} (ID: ${contract.id})`);
            console.log(`- Site Address ID: ${contract.site_address_id}`);
            if (contract.site_address_id) {
                await fetchAddress(contract.site_address_id);
            }
        }
    }
};

async function fetchAddress(addressId) {
    console.log(`\nFetching Address ID: ${addressId}...`);
    const { data: address, error } = await supabase
        .from('company_addresses')
        .select('*')
        .eq('id', addressId)
        .single();

    if (error) console.error("Error fetching address:", error);
    else {
        console.log("SITE ADDRESS DATA:");
        console.log(JSON.stringify(address, null, 2));
    }
}

debugSchemaAndContracts();
