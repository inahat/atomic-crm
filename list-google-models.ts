
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function listModels() {
    console.log("Saving model list to models.txt...");
    if (!apiKey) {
        console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            fs.writeFileSync('models.txt', JSON.stringify(data.error, null, 2));
            return;
        }

        const list = data.models.map((m: any) => `${m.name} (${m.displayName})`).join('\n');
        fs.writeFileSync('models.txt', list);
        console.log("Done.");
    } catch (e: any) {
        fs.writeFileSync('models.txt', e.toString());
    }
}

listModels();
