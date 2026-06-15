import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOutboundMessages() {
    console.log("Checking for outbound messages...\n");

    const { data: outbound, count: outboundCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact' })
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log(`Total outbound messages: ${outboundCount}\n`);

    if (outbound && outbound.length > 0) {
        console.log("Recent outbound messages:");
        outbound.forEach((msg: any, index) => {
            console.log(`\n${index + 1}. ID: ${msg.id}`);
            console.log(`   From: ${msg.sender_phone}`);
            console.log(`   To: ${msg.receiver_phone}`);
            console.log(`   Content: "${msg.content.substring(0, 50)}..."`);
            console.log(`   Time: ${new Date(msg.created_at).toLocaleString()}`);
        });
    }

    // Check total message counts
    const { count: totalCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true });

    const { count: inboundCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'inbound');

    console.log(`\n\n========== Summary ==========`);
    console.log(`Total messages: ${totalCount}`);
    console.log(`Inbound: ${inboundCount}`);
    console.log(`Outbound: ${outboundCount}`);
    console.log(`\nRatio: ${outboundCount && totalCount ? ((outboundCount / totalCount) * 100).toFixed(1) : 0}% outbound`);
}

checkOutboundMessages();
