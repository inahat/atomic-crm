
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    // Validate authorization
    // The database triggers this with the service_role key or anon key depending on config
    // For extra security, we should check for a specific secret or JWT claim.
    // For this implementation, we'll verify the Authorization header exists.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const payload = await req.json();

        // Retrieve Zapier Webhook URL from Environment Variables
        // Make sure to set this via: supabase secrets set ZAPIER_RENEWAL_WEBHOOK=...
        const zapierUrl = Deno.env.get('ZAPIER_RENEWAL_WEBHOOK');

        if (!zapierUrl) {
            // Fallback for testing if env var not set (REMOVE IN PRODUCTION)
            // return new Response(JSON.stringify({ error: "ZAPIER_RENEWAL_WEBHOOK not set" }), { status: 500 });
            throw new Error("ZAPIER_RENEWAL_WEBHOOK env var is not set");
        }

        console.log(`Forwarding contract renewal for: ${payload.client_name}`);

        // Transmit to Zapier
        const response = await fetch(zapierUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Zapier responded with ${response.status}: ${await response.text()}`);
        }

        // Attempt to parse JSON, fallback to success: true if not JSON
        let responseData = { success: true };
        try {
            responseData = await response.json();
        } catch (e) {
            // ignore
        }

        return new Response(JSON.stringify(responseData), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
})
