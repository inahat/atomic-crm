import { streamText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const systemPrompt = `You are a helpful CRM assistant with access to a PostgreSQL database.

You have access to a tool called 'queryDatabase' that allows you to execute SQL queries.

When a user asks about contracts, companies, or deals, you should:
1. Construct an appropriate SQL query to fetch the data
2. Execute the query using the queryDatabase tool
3. Format the results in a clear, readable way (use markdown tables for structured data)

Available tables:
- contracts: id, name, company_id, value, status, start_date, end_date
- companies: id, name, industry, size
- deals: id, name, value, stage, company_id

Always be helpful and provide context with your answers.`;

const queryDatabase = {
    description: 'Execute a SQL query against the database',
    inputSchema: z.object({
        query: z.string().describe('The SQL query to execute'),
    }),
    execute: async ({ query }: { query: string }) => {
        console.log('TOOL EXECUTE:', query);
        try {
            const { data, error } = await supabase.rpc('exec_sql_readonly', { sql_query: query });
            if (error) {
                console.error('SQL ERROR:', error);
                return { error: error.message };
            }
            console.log(`SQL SUCCESS: ${data?.length || 0} rows`);
            return { results: data };
        } catch (e: any) {
            console.error('EXECUTE ERROR:', e);
            return { error: e.message };
        }
    },
};

export async function POST(req: Request) {
    const { messages } = await req.json();
    console.log(`[${new Date().toISOString()}] POST /api/chat`);

    // Convert UIMessages (with parts) to CoreMessages (with content)
    const coreMessages = messages.map((msg: any) => {
        if (msg.role === 'user') {
            return {
                role: 'user',
                content: msg.content || ''
            };
        } else if (msg.role === 'assistant') {
            // Extract text from parts array
            const textParts = msg.parts?.filter((p: any) => p.type === 'text') || [];
            const content = textParts.map((p: any) => p.text).join('') || '';
            return {
                role: 'assistant',
                content
            };
        }
        return msg;
    });

    const result = streamText({
        model: google("gemini-2.5-flash"),
        messages: coreMessages,
        system: systemPrompt,
        tools: { queryDatabase },
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
}