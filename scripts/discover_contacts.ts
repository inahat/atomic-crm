
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY || '';
const HEADERS = { 'X-User-API-Key': TWO_CHAT_API_KEY, 'Content-Type': 'application/json' };

async function tryEndpoint(method: string, url: string, body?: any) {
    console.log(`Testing ${method} ${url}...`);
    try {
        const res = await fetch(url, {
            method,
            headers: HEADERS,
            body: body ? JSON.stringify(body) : undefined
        });
        console.log(`  -> Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log("  -> SUCCESS! Response sample:");
            console.log(JSON.stringify(json, null, 2).substring(0, 500) + "...");
        }
    } catch (e: any) {
        console.log(`  -> Error: ${e.message}`);
    }
}

async function run() {
    // Standard Resources
    await tryEndpoint('GET', 'https://api.p.2chat.io/open/contacts?page_number=0');
    await tryEndpoint('GET', 'https://api.p.2chat.io/open/contacts?page_number=1'); // Some start at 1

    // Explicit Action Verbs (like get-numbers)
    await tryEndpoint('GET', 'https://api.p.2chat.io/open/contacts/get-contacts?page_number=0');
    await tryEndpoint('GET', 'https://api.p.2chat.io/open/contacts/list?page_number=0');

    // Search with empty query
    await tryEndpoint('POST', 'https://api.p.2chat.io/open/contacts/search', { query: "", page_number: 0 });
}

run();
