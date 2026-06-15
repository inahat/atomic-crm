
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
    console.log("Fetching latest page of messages...");
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(NUMBER!)}?page_number=1&page_size=5`;

    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
        if (!res.ok) {
            console.log("Error:", res.status, await res.text());
            return;
        }
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
