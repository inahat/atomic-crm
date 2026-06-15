
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY;
const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER;

async function check() {
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(TWO_CHAT_NUMBER!)}?page_number=1`;
    console.log("Fetching:", url);
    const res = await fetch(url, {
        headers: { 'X-User-API-Key': TWO_CHAT_API_KEY! }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data keys:", Object.keys(data));
    if (Array.isArray(data)) {
        console.log("Is Array. Length:", data.length);
    } else {
        console.log("Not Array. messages length:", data.messages?.length);
    }
}

check();
