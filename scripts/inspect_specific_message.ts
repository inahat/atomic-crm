
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_KEY = process.env.TWO_CHAT_API_KEY;
// const NUMBER = process.env.TWO_CHAT_NUMBER; 

const UUID = "MSG3140f6df-cfcd-4082-9acc-4f554cc6a3fe"; // One of the skeletons

async function run() {
    console.log(`Fetching message ${UUID}...`);
    // API endpoint for specific message might not exist, but we can search or list.
    // Docs say /messages/{number} lists messages. 
    // Is there /message/{uuid}?
    // Try https://api.p.2chat.io/open/whatsapp/message/{uuid}?

    // Let's try listing messages around that time or just latest.
    // Actually the skeleton payload had a timestamp: 21:19.

    // Let's try to just fetch latest messages and find it.
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(process.env.TWO_CHAT_NUMBER!)}?page_number=1&page_size=20`;

    try {
        const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
        if (!res.ok) {
            console.log("Error:", res.status, await res.text());
            return;
        }
        const json = await res.json();
        // search for uuid
        const found = json.data?.find((m: any) => m.uuid === UUID || m.id === UUID);

        console.log("Found in latest 20?", !!found);
        if (found) {
            console.log(JSON.stringify(found, null, 2));
        } else {
            console.log("Not found in latest 20. Listing skeletons...");
            // List IDs of what we found
            console.log(json.data?.map((m: any) => m.uuid));
        }

    } catch (e) {
        console.error(e);
    }
}

run();
