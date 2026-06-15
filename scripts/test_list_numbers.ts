
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_KEY = process.env.TWO_CHAT_API_KEY;

async function run() {
    console.log("Testing List Numbers Endpoint...");

    // Documentation usually suggests /open/whatsapp/numbers
    const url = `https://api.p.2chat.io/open/whatsapp/numbers`;

    try {
        console.log(`Fetching ${url}...`);
        const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
        if (res.ok) {
            const data = await res.json();
            console.log("SUCCESS:", JSON.stringify(data, null, 2));
        } else {
            console.log(`Failed: ${res.status} ${res.statusText} - ${await res.text()}`);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
