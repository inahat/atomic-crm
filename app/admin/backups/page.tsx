'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Trash2, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Backup {
    name: string;
    created_at: string;
    metadata: {
        size: number;
    };
}

export default function BackupsPage() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        loadBackups();
    }, []);

    async function loadBackups() {
        setLoading(true);
        const { data, error } = await supabase.storage.from('backups').list();

        if (data) {
            const sorted = data
                .filter(file => file.name.endsWith('.sql'))
                .sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            setBackups(sorted as Backup[]);
        }

        if (error) {
            console.error('Failed to load backups:', error);
        }

        setLoading(false);
    }

    async function downloadBackup(filename: string) {
        setDownloading(filename);
        try {
            const { data, error } = await supabase.storage
                .from('backups')
                .download(filename);

            if (error) throw error;

            if (data) {
                const url = URL.createObjectURL(data);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download backup');
        } finally {
            setDownloading(null);
        }
    }

    async function deleteBackup(filename: string) {
        if (!confirm(`Delete backup ${filename}?`)) return;

        const { error } = await supabase.storage
            .from('backups')
            .remove([filename]);

        if (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete backup');
        } else {
            await loadBackups();
        }
    }

    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Database className="h-8 w-8" />
                        Database Backups
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Download and manage your database backups
                    </p>
                </div>
                <Button onClick={loadBackups} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading && backups.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Loading backups...</p>
                    </CardContent>
                </Card>
            ) : backups.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No backups found</h3>
                        <p className="text-muted-foreground">
                            Backups will appear here once they are created
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {backups.map((backup) => (
                        <Card key={backup.name}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-mono">
                                            {backup.name}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Created {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                                            {' • '}
                                            {formatBytes(backup.metadata?.size || 0)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadBackup(backup.name)}
                                            disabled={downloading === backup.name}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            {downloading === backup.name ? 'Downloading...' : 'Download'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteBackup(backup.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>About Backups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• Backups are created automatically via GitHub Actions</p>
                    <p>• Only the last 7 backups are retained</p>
                    <p>• Download backups to restore your database if needed</p>
                    <p>• Backups are stored securely in Supabase Storage</p>
                </CardContent>
            </Card>
        </div>
    );
}
