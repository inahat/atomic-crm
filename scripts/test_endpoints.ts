
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_KEY = process.env.TWO_CHAT_API_KEY;
const NUMBER = process.env.TWO_CHAT_NUMBER;

async function run() {
    console.log("Testing API Endpoint Variations...");

    const endpoints = [
        `https://api.p.2chat.io/open/whatsapp/check-number-status/${encodeURIComponent(NUMBER!)}`,
        `https://api.p.2chat.io/open/whatsapp/groups/${encodeURIComponent(NUMBER!)}`,
        `https://api.p.2chat.io/open/whatsapp/get-groups/${encodeURIComponent(NUMBER!)}`,
        `https://api.p.2chat.io/open/whatsapp/numbers`, // Retry
    ];

    for (const url of endpoints) {
        try {
            console.log(`GET ${url}`);
            const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
            console.log(`Status: ${res.status} ${res.statusText}`);
            if (res.ok) {
                const text = await res.text();
                // Log non-empty prefix
                console.log(`Body: ${text.substring(0, 300)}`);
            }
        } catch (e) {
            console.error("Error:", e);
        }
        console.log('---');
    }
}

run();
