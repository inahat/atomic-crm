
import * as React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import WarningIcon from '@mui/icons-material/Warning';
import { useRecordContext } from 'ra-core';

interface StatusPillProps {
    status?: string;
    source?: string;
}

export const StatusPill = (props: StatusPillProps) => {
    const record = useRecordContext(props);
    const { source = 'status' } = props;

    // Use explicit status prop, or get from record using source, or fallback to 'unknown'
    const statusValue = props.status || (record ? record[source] : null);

    let color: "default" | "success" | "error" | "warning" | "info" = "default";
    let icon = <HelpIcon />;

    const normalizedStatus = (statusValue || 'unknown').toString().toLowerCase();

    if (normalizedStatus === 'online' || normalizedStatus === 'connected' || normalizedStatus === 'restored') {
        color = "success";
        icon = <CheckCircleIcon />;
    } else if (normalizedStatus === 'offline' || normalizedStatus === 'disconnected' || normalizedStatus === 'lost') {
        color = "error";
        icon = <ErrorIcon />;
    } else if (normalizedStatus === 'rebooting') {
        color = "warning";
        icon = <WarningIcon />;
    } else if (normalizedStatus === 'limited') {
        color = "info";
        icon = <WarningIcon />;
    }

    return (
        <Chip
            icon={icon}
            label={statusValue || 'Unknown'}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
        />
    );
};
