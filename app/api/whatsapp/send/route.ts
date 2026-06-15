import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client to bypass RLS when inserting sent messages
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { contact_id, content } = await req.json();

        if (!contact_id || !content) {
            return NextResponse.json({ error: 'Missing contact_id or content' }, { status: 400 });
        }

        // 1. Fetch Contact Phone Number
        const { data: contact, error: contactError } = await supabaseAdmin
            .from('contacts')
            .select('phone_1_number, phone_2_number')
            .eq('id', contact_id)
            .single();

        if (contactError || !contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const phoneNumber = contact.phone_1_number || contact.phone_2_number;
        if (!phoneNumber) {
            return NextResponse.json({ error: 'Contact has no phone number' }, { status: 400 });
        }

        // 2. Call 2Chat.io API
        const twoChatUrl = 'https://api.p.2chat.io/open/whatsapp/send-message';
        const apiKey = process.env.TWO_CHAT_API_KEY;

        if (!apiKey) {
            console.error('Missing TWO_CHAT_API_KEY');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const payload = {
            to_number: phoneNumber,
            text: content
        };

        const response = await fetch(twoChatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-API-Key': apiKey
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('2Chat API Error:', responseData);
            return NextResponse.json({ error: 'Failed to send message via 2Chat' }, { status: 500 });
        }

        // 3. Insert into whatsapp_messages (Outbound)
        // We use the ID returned from 2Chat or generate a UUID if not provided clearly
        const messageUuid = responseData.message_uuid || crypto.randomUUID();

        const { error: dbError } = await supabaseAdmin
            .from('whatsapp_messages')
            .insert({
                message_uuid: messageUuid,
                contact_id: contact_id,
                sender_phone: 'SYSTEM', // Or your business number
                receiver_phone: phoneNumber,
                content: content,
                direction: 'outbound',
                status: 'sent'
            });

        if (dbError) {
            console.error('Database ID Insert Error:', dbError);
            // We still return success because the message WAS sent
        }

        return NextResponse.json({ success: true, message_uuid: messageUuid });

    } catch (error: any) {
        console.error('Send Message Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
