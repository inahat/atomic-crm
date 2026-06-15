
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
    console.log("Fetching messages to find groups...");
    let page = 1;
    let found = 0;

    while (found < 5 && page <= 5) {
        const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(NUMBER!)}?page_number=${page}&page_size=50`;
        try {
            const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
            const data = await res.json();
            const messages = data.messages || [];

            if (messages.length === 0) break;

            for (const msg of messages) {
                const raw = JSON.stringify(msg);
                // Look for common group indicators in raw JSON
                if (raw.includes('@g.us') || raw.includes('participant') || (msg.remote_phone_number && msg.remote_phone_number.includes('-'))) {
                    console.log("\n--- POSSIBLE GROUP MESSAGE ---");
                    console.log(JSON.stringify(msg, null, 2));
                    found++;
                    if (found >= 5) break;
                }
            }
            page++;
        } catch (e) {
            console.error(e);
            break;
        }
    }
}

run();
