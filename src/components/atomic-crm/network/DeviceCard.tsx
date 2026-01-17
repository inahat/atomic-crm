
import * as React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { StatusPill } from './StatusPill';
import { useRecordContext } from 'ra-core';

export const DeviceCard = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" component="div" noWrap title={record.name}>
                        {record.name}
                    </Typography>
                    <StatusPill status={record.status} />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    MAC: {record.mac_address}
                </Typography>

                {/* Note: relationships fields like company name might need 'company_id.name' if joining, 
                    or if we used a separate query. For simple list view, we usually just have local fields 
                    unless we configure the API to Embed. */}

                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    Last Seen: {record.last_seen ? new Date(record.last_seen).toLocaleString() : 'Never'}
                </Typography>
            </CardContent>
        </Card>
    );
};
