import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { IncomingHttpHeaders } from 'http';

// Parse .env.local before anything else
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Adapter to convert Express Req to standard Request
async function expressAdapter(req: Request, res: Response) {
    try {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

        // Dynamic import to ensure env vars are loaded BEFORE module evaluation
        const { POST } = await import('./api/chat/route');

        const webReq = new Request(`http://localhost:3000${req.originalUrl}`, {
            method: req.method,
            headers: req.headers as unknown as HeadersInit,
            body: JSON.stringify(req.body)
        });

        const response = await POST(webReq);

        if (response.body) {
            const reader = response.body.getReader();
            res.status(response.status);
            response.headers.forEach((val: string, key: string) => res.setHeader(key, val));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
        } else {
            res.status(response.status).send(await response.text());
        }

    } catch (e: any) {
        console.error("Server Error:", e);
        res.status(500).json({ error: e.message, stack: e?.stack });
    }
}

app.post('/api/chat', expressAdapter);

app.post('/api/whatsapp/send', async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] POST ${req.url}`);
        const { POST } = await import('./api/whatsapp/send/route');

        // Construct Request object
        const webReq = new Request(`http://localhost:3000${req.originalUrl}`, {
            method: 'POST',
            headers: req.headers as unknown as HeadersInit,
            body: JSON.stringify(req.body) // req.body is already parsed by express.json()
        });

        const response = await POST(webReq);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (e: any) {
        console.error("WhatsApp Route Error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3000;
console.log(`AI Server running on http://localhost:${PORT}`);
console.log(`API Key Status: ${process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Found" : "MISSING"}`);
console.log(`Supabase URL Status: ${process.env.VITE_SUPABASE_URL ? "Found" : "MISSING"}`);

app.listen(PORT);
