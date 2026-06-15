import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const apiKey = process.env.TWO_CHAT_API_KEY!;
const channelNumber = process.env.TWO_CHAT_NUMBER!;

async function inspectMessages() {
    const url = `https://api.p.2chat.io/open/whatsapp/messages/${encodeURIComponent(channelNumber)}?page_number=1&page_size=5`;

    const response = await fetch(url, {
        headers: {
            'X-User-API-Key': apiKey
        }
    });

    if (!response.ok) {
        console.error("Failed:", response.status);
        return;
    }

    const data = await response.json();
    const messages = Array.isArray(data) ? data : (data.messages || []);

    console.log("Sample messages structure:\n");
    messages.slice(0, 2).forEach((msg: any, index: number) => {
        console.log(`\n========== Message ${index + 1} ==========`);
        console.log(JSON.stringify(msg, null, 2));
    });
}

inspectMessages();
