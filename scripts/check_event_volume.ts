import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bxosgtiwjkpuguyggicm.supabase.co";
// Using the service role key from .env.local
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4b3NndGl3amtwdWd1eWdnaWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzkzMTIyNywiZXhwIjoyMDgzNTA3MjI3fQ.xozQ5zlJhH3uRGbLepW0X8crG_5Y37H2C6wuHl-6-u4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const now = new Date();

    const ranges = [1, 7, 14, 28, 180]; // days

    for (const days of ranges) {
        const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from('device_events')
            .select('*', { count: 'exact', head: true })
            .gte('occurred_at', date);

        console.log(`Last ${days} days (since ${date}): ${count} events`);
    }
}

main();
