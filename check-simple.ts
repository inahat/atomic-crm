
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    try {
        const result = streamText({
            model: google('gemini-1.5-flash'),
            messages: [{ role: 'user', content: 'hi' }]
        });

        console.log("Keys:", Object.keys(result));
        console.log("Has fullStream:", typeof (result as any).fullStream);
    } catch (e) {
        console.error(e);
    }
}

check();
