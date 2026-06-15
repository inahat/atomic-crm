
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_KEY = process.env.TWO_CHAT_API_KEY;
const NUMBER = process.env.TWO_CHAT_NUMBER;
const TARGET_UUID = 'MSG9584ef13-929b-42c8-85ee-72b7e83b0054';

async function run() {
    console.log(`Searching for ${TARGET_UUID} in first 20 pages...`);

    for (let page = 1; page <= 20; page++) {
        const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(NUMBER!)}?page_number=${page}&page_size=50`;
        try {
            const res = await fetch(url, { headers: { 'X-User-API-Key': API_KEY! } });
            const data = await res.json();
            const messages = data.messages || [];

            const found = messages.find((m: any) => (m.uuid === TARGET_UUID || m.id === TARGET_UUID));
            if (found) {
                console.log("FOUND!");
                console.log(JSON.stringify(found, null, 2));
                return;
            } else {
                process.stdout.write(`.`);
            }
        } catch (e) {
            console.error(e);
        }
    }
    console.log("\nNot found in first 20 pages.");
}

run();
