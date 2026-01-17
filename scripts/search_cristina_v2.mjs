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

const searchCorrectly = async () => {
    console.log("1. Searching Companies by 'name'...");
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', '%Cristina%'); // Try broad search first

    if (companyError) {
        console.error("Company search error:", companyError);
    } else if (companies.length > 0) {
        console.log(`Found ${companies.length} companies:`);
        companies.forEach(c => console.log(`- ${c.name} (ID: ${c.id})`));

        // Check contracts for these companies
        for (const c of companies) {
            await checkContractsForCompany(c.id);
        }
    } else {
        console.log("No companies found with 'Cristina' in the name.");
    }

    console.log("\n2. Inspecting Contact ID 369 Details...");
    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', 369)
        .single();

    if (contactError) {
        console.error("Contact fetch error:", contactError);
    } else {
        console.log(JSON.stringify(contact, null, 2));
    }

    // 3. Search for ANY contract that mentions Cristina in the name?
    // (Already tried this and failed, but maybe try 'Stenbeck')
    console.log("\n3. Searching Contracts for 'Stenbeck'...");
    const { data: contracts, error: contractErr } = await supabase
        .from('contracts')
        .select('*')
        .ilike('contract_name', '%Stenbeck%');

    if (contracts && contracts.length > 0) {
        console.log(`Found ${contracts.length} contracts:`);
        for (const contract of contracts) {
            console.log(`\nContract: ${contract.contract_name} (ID: ${contract.id})`);
            console.log(`- Site Address ID: ${contract.site_address_id}`);
            if (contract.site_address_id) {
                await fetchAddress(contract.site_address_id);
            }
        }
    } else {
        console.log("No contracts found with 'Stenbeck'.");
    }
};

async function checkContractsForCompany(companyId) {
    console.log(`\nChecking contracts for Company ID ${companyId}...`);
    const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('company_id', companyId);

    if (contracts && contracts.length > 0) {
        for (const contract of contracts) {
            console.log(`\nContract: ${contract.contract_name} (ID: ${contract.id})`);
            console.log(`- Site Address ID: ${contract.site_address_id}`);
            if (contract.site_address_id) {
                await fetchAddress(contract.site_address_id);
            }
        }
    } else {
        console.log("No contracts found.");
    }
}

async function fetchAddress(addressId) {
    console.log(`\nFetching Address ID: ${addressId}...`);
    const { data: address } = await supabase
        .from('company_addresses')
        .select('*')
        .eq('id', addressId)
        .single();
    if (address) {
        console.log("SITE ADDRESS DATA:");
        console.log(JSON.stringify(address, null, 2));
    }
}

searchCorrectly();
