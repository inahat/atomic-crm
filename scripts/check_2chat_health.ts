
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY || '';
const API_URL = 'https://api.p.2chat.io/open/whatsapp/get-numbers';

async function checkStatus() {
    console.log(`Checking 2Chat Status...`);
    try {
        const res = await fetch(API_URL, {
            headers: { 'X-User-API-Key': TWO_CHAT_API_KEY }
        });

        if (!res.ok) {
            console.error(`Failed: ${res.status} ${res.statusText}`);
            return;
        }

        const json = await res.json();
        const numbers = json.numbers || [];

        if (numbers.length === 0) {
            console.log("No numbers connected!");
        } else {
            numbers.forEach((n: any) => {
                console.log(`Number: ${n.phone_number}`);
                console.log(`Status: ${n.connection_status} (${n.connection_status === 'C' ? 'Connected' : 'Disconnected'})`);
                console.log(`Last Updated: ${n.updated_at}`);
                console.log('---');
            });
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkStatus();
