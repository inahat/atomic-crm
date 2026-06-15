
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY || '';
const API_URL = 'https://api.p.2chat.io/open/contacts';

async function listContacts() {
    console.log(`Fetching contacts from ${API_URL}...`);
    try {
        const res = await fetch(API_URL, {
            headers: { 'X-User-API-Key': TWO_CHAT_API_KEY }
        });

        if (!res.ok) {
            console.error(`Failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
            return;
        }

        const json = await res.json();
        console.log("Success! Showing first 3 contacts:");
        console.log(JSON.stringify(json.contacts ? json.contacts.slice(0, 3) : json, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

listContacts();
