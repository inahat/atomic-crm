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

const findClientData = async () => {
    console.log("Searching for 'Cristina Stenbeck'...");

    // 1. Search in Companies
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .ilike('company_name', '%Cristina Stenbeck%');

    if (companyError) console.error("Company search error:", companyError);

    // 2. Search in Contacts if no company found (or just to be sure)
    const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .or(`first_name.ilike.%Cristina%,last_name.ilike.%Stenbeck%`);

    if (contactError) console.error("Contact search error:", contactError);

    let companyId = null;

    if (companies && companies.length > 0) {
        console.log(`Found ${companies.length} companies:`);
        companies.forEach(c => {
            console.log(`- ID: ${c.id}, Name: ${c.company_name}`);
            companyId = c.id;
        });
    } else {
        console.log("No companies found.");
    }

    if (contacts && contacts.length > 0) {
        console.log(`Found ${contacts.length} contacts:`);
        contacts.forEach(c => {
            console.log(`- ID: ${c.id}, Name: ${c.first_name} ${c.last_name}, Company ID: ${c.company_id}`);
            if (!companyId) companyId = c.company_id;
        });
    } else {
        console.log("No contacts found.");
    }

    if (!companyId) {
        console.log("Could not identify a Company ID. Aborting.");
        return;
    }

    // 3. Find Contracts for this Company
    console.log(`\nSearching for contracts for Company ID: ${companyId}...`);
    const { data: contracts, error: contractError2 } = await supabase
        .from('contracts')
        .select('*')
        .eq('company_id', companyId);

    if (contractError2) {
        console.error("Contract search error:", contractError2);
    } else if (contracts.length === 0) {
        console.log("No contracts found for this company.");
    } else {
        console.log(`Found ${contracts.length} contracts:`);
        for (const contract of contracts) {
            console.log(`\nContract: ${contract.contract_name} (${contract.contract_number})`);
            console.log(`- Site Address ID: ${contract.site_address_id}`);

            if (contract.site_address_id) {
                // 4. Fetch the Site Address
                const { data: address, error: addressError } = await supabase
                    .from('company_addresses')
                    .select('*')
                    .eq('id', contract.site_address_id)
                    .single();

                if (addressError) {
                    console.error("Error fetching address:", addressError);
                } else {
                    console.log("  -> SITE ADDRESS DATA:");
                    console.log(JSON.stringify(address, null, 2));
                }
            } else {
                console.log("  -> No Site Address ID set on this contract.");
            }
        }
    }
};

findClientData();
