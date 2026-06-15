
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_KEY = process.env.TWO_CHAT_API_KEY;
const NUMBER = process.env.TWO_CHAT_NUMBER; // This might not be needed for listing groups if it lists for the account, or maybe as a param?

async function run() {
    console.log("Testing List Groups Endpoint...");

    // Attempt 1: List all groups for the number
    // Based on user snippet structure: .../whatsapp/groups ? or .../whatsapp/get-groups ?
    // User snippet was: .../whatsapp/groups/messages/UUID

    const candidates = [
        `https://api.p.2chat.io/open/whatsapp/groups`, // Maybe lists all?
        `https://api.p.2chat.io/open/whatsapp/groups?number=${encodeURIComponent(NUMBER!)}`
    ];

    for (const url of candidates) {
        try {
            console.log(`Trying ${url}...`);
            const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
            if (res.ok) {
                const data = await res.json();
                console.log("SUCCESS:", JSON.stringify(data, null, 2).substring(0, 500));
                return;
            } else {
                console.log(`Failed: ${res.status} ${res.statusText}`);
            }
        } catch (e) {
            console.error("Error:", e);
        }
    }
}

run();
