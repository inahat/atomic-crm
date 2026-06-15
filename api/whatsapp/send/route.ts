
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const TWO_CHAT_API_KEY = process.env.TWO_CHAT_API_KEY;

if (!supabaseUrl || !supabaseKey || !TWO_CHAT_API_KEY) {
    console.error('Missing environment variables for WhatsApp Send');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function POST(req: Request) {
    const { contact_id, content } = await req.json();

    if (!contact_id || !content) {
        return new Response(JSON.stringify({ error: 'Missing contact_id or content' }), { status: 400 });
    }

    try {
        // 1. Get Contact Phone
        const { data: contact, error: dbError } = await supabase
            .from('contacts')
            .select('phone_1_number')
            .eq('id', parseInt(contact_id)) // contact_id is bigint, not UUID
            .single();

        if (dbError || !contact || !contact.phone_1_number) {
            console.error("Contact not found or no phone:", dbError);
            return new Response(JSON.stringify({ error: 'Contact not found' }), { status: 404 });
        }

        const toNumber = contact.phone_1_number;

        // 2. Send to 2Chat
        // Doc reference: POST https://api.p.2chat.io/open/whatsapp/send-message
        const TWO_CHAT_NUMBER = process.env.TWO_CHAT_NUMBER || process.env.VITE_TWO_CHAT_NUMBER;

        const res = await fetch('https://api.p.2chat.io/open/whatsapp/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-API-Key': TWO_CHAT_API_KEY!
            },
            body: JSON.stringify({
                from_number: TWO_CHAT_NUMBER,
                to_number: toNumber,
                text: content
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("2Chat Send Failed:", res.status, errText);
            return new Response(JSON.stringify({ error: 'Failed to send to 2Chat', details: errText }), { status: res.status });
        }

        const json = await res.json();

        // Don't insert here - the webhook will handle it with the correct 2Chat UUID
        // This prevents duplicate messages in the UI

        return new Response(JSON.stringify({ success: true, '2chat': json }), { status: 200 });

    } catch (e: any) {
        console.error("Send Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
