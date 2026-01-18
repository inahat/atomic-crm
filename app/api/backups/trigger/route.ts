import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create Supabase client with service role
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify user is authenticated
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `backup-${timestamp}.sql`;

        // Note: This is a placeholder - actual backup creation would need to be done
        // via a different method since we can't connect to the database from Vercel
        // due to IPv6 issues. Users should use the local PowerShell script instead.

        return NextResponse.json({
            success: false,
            message: 'Manual backup creation from the web app is not available. Please use the local PowerShell script or download from Supabase Dashboard.',
            instructions: {
                local: 'Run: .\\scripts\\backup-database.ps1',
                dashboard: 'https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database'
            }
        });

    } catch (error) {
        console.error('Backup trigger failed:', error);
        return NextResponse.json({
            error: 'Failed to trigger backup',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
