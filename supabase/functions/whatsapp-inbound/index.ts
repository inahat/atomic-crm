import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from whatsapp-inbound!")

serve(async (req: Request) => {
    const { method } = req;

    // 1. Health check / GET
    if (method === 'GET') {
        return new Response(JSON.stringify({ message: "WhatsApp Inbound Service is healthy" }), {
            headers: { "Content-Type": "application/json" },
        })
    }

    // 2. Handle POST (Webhook)
    if (method === 'POST') {
        try {
            const body = await req.json();
            console.log("Webhook payload:", JSON.stringify(body, null, 2));

            // Initialize Supabase Client
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // DEBUG: Store all payloads for inspection
            await supabase.from('webhook_debug').insert({
                payload: body,
                event_type: body.event || 'unknown'
            });

            // Handle Message Status Updates (delivered/read receipts)
            if (body.event === 'message.read' || body.event === 'message.delivered' || body.event === 'message.status') {
                const messageUuid = body.message_uuid || body.uuid;
                // Map 2Chat event names to our status values
                let newStatus = body.status;
                if (body.event === 'message.read') newStatus = 'read';
                if (body.event === 'message.delivered') newStatus = 'delivered';

                if (messageUuid && newStatus) {
                    console.log(`Updating message ${messageUuid} status to: ${newStatus}`);
                    const { error } = await supabase
                        .from('whatsapp_messages')
                        .update({ status: newStatus })
                        .eq('message_uuid', messageUuid);

                    if (error) {
                        console.error('Failed to update message status:', error);
                    }

                    return new Response(JSON.stringify({ success: true, updated: 'status' }), {
                        headers: { "Content-Type": "application/json" },
                    });
                }
            }

            // Handle API-sent messages (from CRM) AND agent-sent messages (from 2Chat dashboard) - insert with 2Chat's UUID
            if (body.sent_by === 'api' || body.sent_by === 'agent') {
                const twoChatUuid = body.uuid || body.message_uuid || body.id;
                const messageText = typeof body.message === 'object' ? body.message.text : body.message;
                const toNumber = body.remote_phone_number;
                const fromNumber = body.channel_phone_number;

                if (twoChatUuid && messageText) {
                    console.log('Inserting API-sent message with 2Chat UUID:', twoChatUuid);

                    // Find contact by phone number
                    const { data: contact } = await supabase
                        .from('contacts')
                        .select('id')
                        .or(`phone_1_number.eq.${toNumber},phone_2_number.eq.${toNumber}`)
                        .maybeSingle();

                    // Insert the outbound message with 2Chat's UUID
                    const { error: insertError } = await supabase
                        .from('whatsapp_messages')
                        .insert({
                            message_uuid: twoChatUuid,
                            contact_id: contact?.id,
                            sender_phone: fromNumber,
                            receiver_phone: toNumber,
                            content: messageText,
                            direction: 'outbound',
                            status: 'sent',
                            created_at: body.created_at || new Date().toISOString()
                        });

                    if (insertError && insertError.code !== '23505') {
                        console.error('Failed to insert API-sent message:', insertError);
                    }
                }

                return new Response(JSON.stringify({ success: true, inserted: 'api_message' }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            // 2Chat Payload Parsing for new messages
            const messageUuid = body.uuid || body.message_uuid || body.id;
            const fromNumber = body.remote_phone_number || body.from_number || body.from;
            const toNumber = body.channel_phone_number || body.to_number || body.to;

            // Improved Text Extraction
            let textBody = body.content || body.text?.body;

            if (!textBody && body.message) {
                if (typeof body.message === 'string') {
                    textBody = body.message;
                } else if (typeof body.message === 'object') {
                    const m = body.message;
                    // 2Chat sends message.text as a plain string, not an object
                    // Handle 'media' object unique to some 2Chat events
                    const mediaUrl = m.media?.url ? ` ${m.media.url}` : '';

                    // PRIORITIZE MEDIA: If media object exists, use it to construct the body
                    // ignoring the plain 'text' field which often just duplicates the filename/caption
                    if (m.media?.type === 'document') {
                        textBody = `[Document] ${typeof m.text === 'string' ? m.text : ''}${mediaUrl}`;
                    } else if (m.media?.type === 'image') {
                        textBody = `[Image] ${typeof m.text === 'string' ? m.text : ''}${mediaUrl}`;
                    } else if (m.media?.type === 'video') {
                        textBody = `[Video] ${typeof m.text === 'string' ? m.text : ''}${mediaUrl}`;
                    } else if (m.media?.type === 'vcard') {
                        textBody = `[Contact Card] ${typeof m.text === 'string' ? m.text : ''}${mediaUrl}`;
                    }

                    // Fallback to standard hierarchy if no media (or media type unknown)
                    if (!textBody) {
                        textBody = (typeof m.text === 'string' ? m.text : null)
                            || m.conversation
                            || m.text?.body
                            || m.extendedTextMessage?.text
                            || m.imageMessage?.caption || (m.imageMessage ? '[Image]' : null)
                            || m.videoMessage?.caption || (m.videoMessage ? '[Video]' : null)
                            || m.audioMessage?.caption || (m.audioMessage ? '[Audio]' : null)
                            || (m.documentMessage ? `[Document] ${m.documentMessage.fileName || m.documentMessage.caption || 'File'} ${m.documentMessage.url || ''}` : null)
                            || (m.buttonsResponseMessage?.selectedButtonId ? `[Button: ${m.buttonsResponseMessage.selectedButtonId}]` : null)
                            || null;
                    }
                }
            }

            if (!textBody || !fromNumber) {
                console.log("SKIP REASON - textBody:", !!textBody, "fromNumber:", !!fromNumber);
                console.log("Body keys:", Object.keys(body));
                console.log("Body.message type:", typeof body.message);
                console.log("Body.event:", body.event);
                console.log("Skipping: No text or sender found. Body keys:", Object.keys(body));
                return new Response(JSON.stringify({ skipped: true, reason: !textBody ? 'no_text' : 'no_sender' }), { headers: { "Content-Type": "application/json" } });
            }

            // 3. Find Contact & DETAILS
            let lookupNumber = fromNumber;
            let actualSender = fromNumber;
            const isGroup = fromNumber?.includes('@g.us');

            // Extract contact name from webhook payload
            let contactFirstName = null;
            let contactLastName = null;
            let contactPushName = null;

            if (isGroup && body.participant) {
                const p = body.participant;
                actualSender = typeof p === 'string' ? p : p.phone_number || p;
                // For group messages, use participant's pushname
                contactPushName = p.pushname || null;
            } else {
                // For individual messages, extract from contact object or root pushname
                contactPushName = body.pushname || body.contact?.pushname || null;
                contactFirstName = body.contact?.first_name || null;
                contactLastName = body.contact?.last_name || null;
            }

            // Fallback: use friendly_name if available
            const friendlyName = body.contact?.friendly_name || null;

            let { data: contact, error: contactError } = await supabase
                .from('contacts')
                .select('id, first_name, last_name, status, contracts(status)')
                .or(`phone_1_number.eq.${lookupNumber},phone_2_number.eq.${lookupNumber}`)
                .maybeSingle();

            if (contactError) console.error("Error finding contact:", contactError);

            // Auto-create for Groups OR Individuals if missing
            if (!contact) {
                console.log(`Auto-creating contact for ${lookupNumber} (Group: ${isGroup})`);

                // Determine the best name to use
                let firstName = 'Unknown';
                let lastName = '';

                if (isGroup) {
                    firstName = friendlyName || 'Group';
                    lastName = '';
                } else {
                    // For individual contacts, prefer structured name, then pushname
                    if (contactFirstName || contactLastName) {
                        firstName = contactFirstName || 'Unknown';
                        lastName = contactLastName || '';
                    } else if (contactPushName) {
                        // Split pushname into first/last if it contains a space
                        const nameParts = contactPushName.trim().split(/\s+/);
                        if (nameParts.length > 1) {
                            firstName = nameParts[0];
                            lastName = nameParts.slice(1).join(' ');
                        } else {
                            firstName = contactPushName;
                            lastName = '';
                        }
                    } else {
                        firstName = 'Unknown';
                        lastName = actualSender;
                    }
                }

                const { data: newContact, error: createError } = await supabase
                    .from('contacts')
                    .insert({
                        first_name: firstName,
                        last_name: lastName,
                        phone_1_number: lookupNumber,
                        phone_1_type: 'Mobile',
                        metadata: isGroup ? {
                            is_group: true,
                            group_name: friendlyName || body.group?.wa_group_name
                        } : {}
                    })
                    .select()
                    .single();

                if (newContact) {
                    contact = newContact;
                } else {
                    console.error("Failed to create contact:", createError);
                }
            } else {
                // Contact exists - update name if we have better information
                const shouldUpdate =
                    (contact.first_name === 'Unknown' || !contact.first_name) &&
                    (contactPushName || contactFirstName);

                if (shouldUpdate) {
                    console.log(`Updating contact name for ${lookupNumber}`);

                    let updatedFirstName = contact.first_name;
                    let updatedLastName = contact.last_name;

                    if (contactFirstName || contactLastName) {
                        updatedFirstName = contactFirstName || contact.first_name;
                        updatedLastName = contactLastName || contact.last_name;
                    } else if (contactPushName) {
                        const nameParts = contactPushName.trim().split(/\s+/);
                        if (nameParts.length > 1) {
                            updatedFirstName = nameParts[0];
                            updatedLastName = nameParts.slice(1).join(' ');
                        } else {
                            updatedFirstName = contactPushName;
                            updatedLastName = '';
                        }
                    }

                    const { error: updateError } = await supabase
                        .from('contacts')
                        .update({
                            first_name: updatedFirstName,
                            last_name: updatedLastName
                        })
                        .eq('id', contact.id);

                    if (!updateError) {
                        // Update local contact object
                        contact.first_name = updatedFirstName;
                        contact.last_name = updatedLastName;
                    } else {
                        console.error("Failed to update contact name:", updateError);
                    }
                }
            }

            const contactId = contact?.id || null;
            const contactName = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : actualSender;
            const clientStatus = contact?.status || 'Unknown';
            const contractStatus = contact?.contracts?.[0]?.status || 'No Contract';

            // 4. Insert Message
            // Prioritize body.created_at (ISO) over timestamp (Unix)
            let msgDate = body.created_at || (body.timestamp ? new Date(body.timestamp * 1000).toISOString() : new Date().toISOString());

            // Determine message direction based on sender
            const channelNumber = toNumber; // Our WhatsApp number

            // FIX: Rely on 2Chat's direction field or fromMe flag
            // Comparing fromNumber (Remote) == channelNumber (Us) is unreliable if 2Chat normalizes Remote to always be the contact
            const isOutbound =
                body.direction === 'outbound' ||
                body.message?.fromMe === true ||
                body.sent_by === 'api' ||
                body.sent_by === 'agent' || // Messages sent from 2Chat dashboard
                body.sent_by === 'user' ||
                fromNumber === channelNumber;

            // For outbound messages, swap sender/receiver
            const finalSender = isOutbound ? channelNumber : actualSender;
            const finalReceiver = isOutbound ? actualSender : channelNumber;
            const finalDirection = isOutbound ? 'outbound' : 'inbound';

            const { error: insertError } = await supabase
                .from('whatsapp_messages')
                .insert({
                    message_uuid: messageUuid || crypto.randomUUID(),
                    contact_id: contactId,
                    sender_phone: finalSender,
                    receiver_phone: finalReceiver,
                    content: textBody,
                    direction: finalDirection,
                    status: 'delivered',
                    created_at: msgDate
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    console.log("Duplicate message ignored");
                    return new Response(JSON.stringify({ status: 'duplicate' }), { headers: { "Content-Type": "application/json" } });
                }
                throw insertError;
            }

            // 5. Auto-Forwarding to On-Call Engineers
            const { data: engineers } = await supabase
                .from('on_call_engineers')
                .select('phone_number')
                .eq('is_active', true);

            if (engineers && engineers.length > 0) {
                const apiKey = Deno.env.get('TWO_CHAT_API_KEY');
                if (apiKey) {
                    const fwdContent = `FWD from ${contactName} [${contractStatus}]: ${textBody}`;

                    const forwardPromises = engineers.map(async (eng: any) => {
                        try {
                            await fetch('https://api.p.2chat.io/open/whatsapp/send-message', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-User-API-Key': apiKey
                                },
                                body: JSON.stringify({
                                    to_number: eng.phone_number,
                                    text: fwdContent
                                })
                            });
                        } catch (err) {
                            console.error(`Failed to forward to ${eng.phone_number}`, err);
                        }
                    });
                    await Promise.all(forwardPromises);
                }
            }

            // 6. Gemini AI Auto-Drafting
            const geminiKey = Deno.env.get('GEMINI_API_KEY');
            if (geminiKey) {
                try {
                    const prompt = `
            You are a helpful assistant for Atomic CRM.
            The user ${contactName} (Status: ${clientStatus}, Contract: ${contractStatus}) sent: "${textBody}".
            Draft a brief, professional, friendly reply. 
            If the contract is not active, kindly mention they might need to renew if they need urgent support.
            `;

                    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    });

                    const aiData = await aiResponse.json();
                    const draftContent = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (draftContent) {
                        // Insert DRAFT message
                        await supabase.from('whatsapp_messages').insert({
                            message_uuid: 'draft-' + crypto.randomUUID(),
                            contact_id: contactId,
                            sender_phone: 'AI_DRAFT',
                            receiver_phone: fromNumber,
                            content: draftContent,
                            direction: 'outbound',
                            status: 'draft' // Special status for UI
                        });
                        console.log("Draft created via Gemini");
                    }
                } catch (aiErr) {
                    console.error("Gemini Error:", aiErr);
                }
            }


            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            })

        } catch (error: any) {
            console.error("Error processing webhook:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }
    }

    return new Response("Method Not Allowed", { status: 405 })
})
