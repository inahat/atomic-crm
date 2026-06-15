
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_KEY = process.env.TWO_CHAT_API_KEY;
const NUMBER = process.env.TWO_CHAT_NUMBER;

async function run() {
    console.log("Fetching one page to inspect Timestamp and Group Data...");
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(NUMBER!)}?page_number=1&page_size=10`;

    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
        const data = await res.json();
        const messages = data.messages || [];

        if (messages.length > 0) {
            console.log("--- MESSAGE SAMPLE ---");
            // Log first 3 messages fully
            for (let i = 0; i < Math.min(messages.length, 3); i++) {
                console.log(JSON.stringify(messages[i], null, 2));
            }
        } else {
            console.log("No messages found.");
        }
    } catch (e) {
        console.error(e);
    }
}

run();
