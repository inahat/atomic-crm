
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
    console.log("Inspecting Full Status Response...");

    const url = `https://api.p.2chat.io/open/whatsapp/check-number-status/${encodeURIComponent(NUMBER!)}`;

    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
        if (res.ok) {
            const data = await res.json();
            console.log("FULL DATA:", JSON.stringify(data, null, 2));
        } else {
            console.log(`Failed: ${res.status}`);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
