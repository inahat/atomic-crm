
async function test() {
    console.log("Testing POST http://localhost:3000/api/whatsapp/send ...");
    try {
        const res = await fetch('http://localhost:3000/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contact_id: '00000000-0000-0000-0000-000000000000', // invalid UUID
                content: 'test message'
            })
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 200)}`);
    } catch (e: any) {
        console.error("Connection Failed:", e.message);
    }
}

test();
