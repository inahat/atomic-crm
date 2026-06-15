import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bxosgtiwjkpuguyggicm.supabase.co";
// Using the service role key from .env.local
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3NndGl3amtwdWd1eWdnaWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzkzMTIyNywiZXhwIjoyMDgzNTA3MjI3fQ.xozQ5zlJhH3uRGbLepW0X8crG_5Y37H2C6wuHl-6-u4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { count, error: countError } = await supabase
        .from('device_events')
        .select('*', { count: 'exact', head: true });

    console.log("Total events:", count);

    // Get oldest
    const { data: oldest } = await supabase
        .from('device_events')
        .select('occurred_at')
        .order('occurred_at', { ascending: true })
        .limit(1);

    // Get newest
    const { data: newest } = await supabase
        .from('device_events')
        .select('occurred_at')
        .order('occurred_at', { ascending: false })
        .limit(1);

    console.log("Oldest event:", oldest?.[0]?.occurred_at);
    console.log("Newest event:", newest?.[0]?.occurred_at);
}

main();
