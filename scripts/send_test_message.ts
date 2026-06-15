import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY;
const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER;

async function sendTestMessage() {
    console.log('Sending test message to self...');

    const res = await fetch('https://api.p.2chat.io/open/whatsapp/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-API-Key': TWO_CHAT_API_KEY!
        },
        body: JSON.stringify({
            from_number: TWO_CHAT_NUMBER,
            to_number: TWO_CHAT_NUMBER, // Send to self
            text: `Test inbound webhook at ${new Date().toISOString()}`
        })
    });

    if (!res.ok) {
        console.error('Failed:', res.status, await res.text());
    } else {
        const json = await res.json();
        console.log('Success:', json);
        console.log('\nNow check if this message appears in the CRM as an inbound message...');
    }
}

sendTestMessage();
