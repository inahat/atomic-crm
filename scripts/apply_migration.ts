
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

// Default local supabase credentials
const DB_CONFIG = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres', // Default for local supabase
    port: 54322,
};

const MIGRATION_FILE = 'supabase/migrations/20260126_init_identities.sql';

async function applyMigration() {
    const client = new Client(DB_CONFIG);

    try {
        await client.connect();
        console.log('Connected to database.');

        const migrationPath = path.resolve(process.cwd(), MIGRATION_FILE);
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`Applying migration: ${MIGRATION_FILE}`);

        await client.query(sql);
        console.log('Migration applied successfully.');

    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
