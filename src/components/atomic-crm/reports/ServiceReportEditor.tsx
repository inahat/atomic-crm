import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetOne, useUpdate, useNotify, useCreate, useGetList } from 'ra-core';
import { Loading } from '@/components/admin';
import { Card, CardContent, Typography, Box, Button, IconButton, TextField, MenuItem, Select, FormControl, InputLabel, Divider, GlobalStyles } from '@mui/material';
import { ChevronLeft, Printer, Save, CheckCircle, AlertCircle, Circle, Trash2, Plus } from 'lucide-react';
import { generateReportFromContract, cleanSectionTitle } from './ServiceReportUtils';
import { ServiceReport, ServiceTask, Contract, Sale } from '../types';
import { useConfigurationContext } from "../root/ConfigurationContext";

export const ServiceReportEditor = () => {
    const { taskId, companyId, reportId } = useParams();
    const navigate = useNavigate();
    const notify = useNotify();
    const [update] = useUpdate();
    const [create] = useCreate();
    const { lightModeLogo } = useConfigurationContext();

    const { data: standaloneReport, isPending: isStandaloneLoading } = useGetOne<ServiceReport>(
        'service_reports',
        { id: reportId },
        { enabled: !!reportId }
    );

    // 2. Fetch the Service Task (if applicable)
    const effectiveTaskId = taskId || standaloneReport?.service_task_id;
    const { data: task, isPending: isTaskLoading } = useGetOne<ServiceTask>(
        'service_tasks',
        { id: effectiveTaskId },
        { enabled: !!effectiveTaskId }
    );

    // 3. Fetch the existing report if it exists based on task
    const { data: reports, isPending: isReportLoading } = useGetList<ServiceReport>(
        'service_reports',
        {
            filter: { service_task_id: effectiveTaskId },
            pagination: { page: 1, perPage: 1 }
        },
        { enabled: !!effectiveTaskId && !reportId }
    );

    const existingReport = standaloneReport || reports?.[0];

    // 4. Fetch Contract and Company data
    const effectiveContractId = task?.contract_id || standaloneReport?.contract_id;
    const { data: contract, isPending: isContractLoading } = useGetOne<Contract>(
        'contracts',
        { id: effectiveContractId },
        { enabled: !!effectiveContractId }
    );

    const targetCompanyId = companyId || standaloneReport?.company_id || contract?.company_id;

    const { data: company, isPending: isCompanyLoading } = useGetOne(
        'companies',
        { id: targetCompanyId },
        { enabled: !!targetCompanyId }
    );

    const { data: addresses } = useGetList('company_addresses', {
        filter: { company_id: targetCompanyId },
        pagination: { page: 1, perPage: 1 }
    }, { enabled: !!targetCompanyId });
    const siteAddress = addresses?.[0];

    // 5. Fetch Active Contracts for this company (for ad-hoc selection)
    const { data: activeContracts, isPending: isActiveContractsLoading } = useGetList<Contract>(
        'contracts',
        {
            filter: { company_id: targetCompanyId, status: 'Active' },
            pagination: { page: 1, perPage: 20 }
        },
        { enabled: !!targetCompanyId && !effectiveTaskId }
    );

    const { data: technicians } = useGetList<Sale>('sales');

    // 5. Fetch Organization Settings for Branding
    const { data: settings } = useGetList('crm_settings', { pagination: { page: 1, perPage: 1 } });
    const orgSettings = settings?.[0];

    const [reportState, setReportState] = useState<Partial<ServiceReport> | null>(null);

    // Initialize report state
    useEffect(() => {
        if (reportState) return; // Prevent overwriting user edits after initial load

        if (existingReport) {
            // Migration/Cleanup: If titles are dirty in existing draft, clean them now
            const cleanedReport = { ...existingReport };
            if (cleanedReport.report_data?.sections) {
                cleanedReport.report_data.sections = cleanedReport.report_data.sections.map(s => ({
                    ...s,
                    title: s.title ? cleanSectionTitle(s.title) : 'New Section'
                }));
            }
            setReportState(cleanedReport);
        } else if (contract && task) {
            // Generate from contract scope if new task-based report
            const initialData = generateReportFromContract(contract);
            setReportState({
                service_task_id: task.id,
                contract_id: task.contract_id,
                company_id: contract.company_id,
                visit_date: new Date().toISOString().split('T')[0],
                report_data: initialData,
                status: 'draft'
            });
        } else if (companyId && activeContracts && !reportState) {
            // Initialize ad-hoc report if we have companyId and contracts are loaded (even if empty)
            const initialContract = activeContracts[0];
            const initialData = initialContract ? generateReportFromContract(initialContract) : { sections: [], general_notes: '' };
            setReportState({
                contract_id: initialContract?.id,
                company_id: parseInt(companyId),
                visit_date: new Date().toISOString().split('T')[0],
                report_data: initialData,
                status: 'draft'
            });
        }
    }, [existingReport, contract, task, companyId, activeContracts, reportState]);

    const handleContractChange = (newContractId: string) => {
        const selected = activeContracts?.find(c => c.id.toString() === newContractId.toString());
        if (selected) {
            const initialData = generateReportFromContract(selected);
            setReportState({
                ...reportState,
                contract_id: selected.id,
                report_data: initialData
            });
        }
    };

    const handleSave = (status: 'draft' | 'completed' = 'draft') => {
        if (!reportState) return;

        const data = { ...reportState, status };

        if (existingReport) {
            update('service_reports', { id: existingReport.id, data, previousData: existingReport }, {
                onSuccess: () => {
                    notify('Report saved', { type: 'success' });
                    if (status === 'completed') navigate(-1);
                }
            });
        } else {
            create('service_reports', { data }, {
                onSuccess: () => {
                    notify('Report created', { type: 'success' });
                    if (status === 'completed') navigate(-1);
                }
            });
        }
    };

    const updateSection = (index: number, updates: any) => {
        if (!reportState?.report_data) return;
        const newSections = [...reportState.report_data.sections];
        newSections[index] = { ...newSections[index], ...updates };
        setReportState({
            ...reportState,
            report_data: { ...reportState.report_data, sections: newSections }
        });
    };

    const removeSection = (index: number) => {
        if (!reportState?.report_data) return;
        const newSections = reportState.report_data.sections.filter((_, i) => i !== index);
        setReportState({
            ...reportState,
            report_data: { ...reportState.report_data, sections: newSections }
        });
    };

    const addSection = () => {
        if (!reportState?.report_data) return;
        const newSection = {
            id: Math.random().toString(36).substr(2, 9),
            title: "New Section",
            content: "",
            status: "not-checked" as const,
            notes: ""
        };
        setReportState({
            ...reportState,
            report_data: {
                ...reportState.report_data,
                sections: [...reportState.report_data.sections, newSection]
            }
        });
    };

    const isActuallyLoading =
        (!!reportId && isStandaloneLoading) ||
        (!!effectiveTaskId && isTaskLoading) ||
        (!!effectiveTaskId && !reportId && isReportLoading) ||
        (!!targetCompanyId && isCompanyLoading) ||
        (!!effectiveContractId && isContractLoading) ||
        (!!companyId && !effectiveTaskId && isActiveContractsLoading);

    if (isActuallyLoading || !reportState) return <Loading />;

    const defaultSubtitle = company?.name
        ? `${company.name} - ${effectiveTaskId ? (task?.service_type === 'mid-year' ? 'Mid-Year' : 'End-of-Year') : 'Ad-hoc Call-out'}`
        : '';

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            <GlobalStyles styles={{
                '@media print': {
                    'nav, header, footer, .MuiButton-root, .MuiIconButton-root, .ra-notification': {
                        display: 'none !important'
                    },
                    'main': {
                        padding: '0 !important',
                        margin: '0 !important',
                        maxWidth: '100% !important'
                    },
                    'body': {
                        backgroundColor: '#fff !important',
                        color: '#000 !important'
                    },
                    '.MuiCard-root': {
                        boxShadow: 'none !important',
                        border: '1px solid #eee !important',
                        marginBottom: '20px !important'
                    },
                    'textarea': {
                        height: 'auto !important',
                        overflow: 'visible !important',
                        resize: 'none !important'
                    }
                }
            }} />
            {/* Header / Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, '@media print': { display: 'none' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ChevronLeft />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Service Visit Report
                        </Typography>
                        <TextField
                            variant="standard"
                            value={(reportState.report_data as any)?.subtitle ?? defaultSubtitle}
                            onChange={(e) => setReportState({
                                ...reportState,
                                report_data: { ...reportState.report_data!, subtitle: e.target.value }
                            })}
                            InputProps={{
                                disableUnderline: true,
                                sx: { fontSize: '0.875rem', color: 'text.secondary', p: 0, m: 0 }
                            }}
                            fullWidth
                        />
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<Printer />} onClick={() => {
                        const titleBackup = document.title;
                        const currentSubtitle = (reportState.report_data as any)?.subtitle ?? defaultSubtitle;
                        const reportNumStr = reportState.report_number ? `S${reportState.report_number} ` : '';
                        document.title = `${reportNumStr}${currentSubtitle}`.trim() || 'Service Visit Report';
                        window.print();
                        setTimeout(() => { document.title = titleBackup; }, 1000);
                    }}>
                        Print / PDF
                    </Button>
                    <Button variant="outlined" startIcon={<Save />} onClick={() => handleSave('draft')}>
                        Save Draft
                    </Button>
                    <Button variant="contained" startIcon={<CheckCircle />} onClick={() => handleSave('completed')}>
                        Complete Report
                    </Button>
                </Box>
            </Box>

            {/* Sticky Print Header */}
            <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 4 } }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    p: 3,
                    bgcolor: '#33626f', // Primary iHomes blue-ish color
                    color: '#fff',
                    borderRadius: 1
                }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Service Visit Report
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mt: 0.5, opacity: 0.9 }}>
                            {(reportState.report_data as any)?.subtitle ?? defaultSubtitle}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {(orgSettings?.org_logo_url || lightModeLogo) && (
                            <Box
                                component="img"
                                src={orgSettings?.org_logo_url || lightModeLogo}
                                sx={{ height: 60, objectFit: 'contain', mb: 1, filter: 'brightness(0) invert(1)' }}
                            />
                        )}
                        {orgSettings?.org_email && (
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {orgSettings.org_email}
                            </Typography>
                        )}
                        {orgSettings?.org_phone && (
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {orgSettings.org_phone}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, px: 1 }}>
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary">CLIENT / SITE</Typography>
                        <Typography variant="h6" fontWeight="bold">{company?.name}</Typography>
                        <Typography variant="body2">
                            {siteAddress ? (
                                <>
                                    {[
                                        siteAddress.address_line_1,
                                        siteAddress.address_line_2,
                                        siteAddress.city,
                                        siteAddress.postal_code
                                    ].filter(Boolean).join(', ')}
                                </>
                            ) : (
                                contract?.contract_name ? `${contract.contract_name} (${contract.contract_number})` : ''
                            )}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" color="textSecondary">DATE OF VISIT</Typography>
                        <Typography variant="h6" fontWeight="bold">
                            {reportState.visit_date ? format(parseISO(reportState.visit_date), 'dd/MM/yyyy') : ''}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Technician: {technicians?.find(t => t.id === reportState.technician_id)?.first_name || 'Assigned Staff'}</Typography>
                    </Box>
                </Box>
                <Divider sx={{ mt: 3, mb: 1 }} />
            </Box>

            <Card sx={{ mb: 4, '@media print': { display: 'none' } }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid #33626f', pb: 1, mb: 3 }}>
                        Visit Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <TextField
                            label="Visit Date"
                            type="date"
                            value={reportState.visit_date}
                            onChange={(e) => setReportState({ ...reportState, visit_date: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        {!effectiveTaskId && activeContracts && activeContracts.length > 0 && (
                            <FormControl fullWidth>
                                <InputLabel>Service Agreement / Scope</InputLabel>
                                <Select
                                    value={reportState.contract_id || ''}
                                    label="Service Agreement / Scope"
                                    onChange={(e) => handleContractChange(e.target.value as string)}
                                >
                                    {activeContracts.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.contract_name} ({c.contract_number})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <FormControl fullWidth>
                            <InputLabel>Technician</InputLabel>
                            <Select
                                value={reportState.technician_id || ''}
                                label="Technician"
                                onChange={(e) => setReportState({ ...reportState, technician_id: e.target.value as any })}
                            >
                                {technicians?.map(tech => (
                                    <MenuItem key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>


            {
                reportState.report_data?.sections.map((section, index) => (
                    <Card key={section.id} sx={{ mb: 3, '@media print': { mb: 4, breakInside: 'avoid', border: '1px solid #eee' } }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        placeholder="Section Title"
                                        value={section.title}
                                        onChange={(e) => updateSection(index, { title: e.target.value })}
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { fontWeight: 'bold', fontSize: '1.1rem', color: '#33626f' }
                                        }}
                                        sx={{ '@media print': { mb: 1 } }}
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ '@media print': { display: 'none' } }}>
                                        Contracted Scope: {section.content?.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, '').substring(0, 100) || 'Manual Item'}...
                                    </Typography>
                                    <Box sx={{ mt: 1, '@media print': { display: 'none' } }}>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<Trash2 size={14} />}
                                            onClick={() => removeSection(index)}
                                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                        >
                                            Remove from Report
                                        </Button>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, '@media print': { display: 'none' } }}>
                                    {[
                                        { value: 'checked', label: 'Healthy', icon: <CheckCircle className="h-4 w-4" />, color: '#10b981' },
                                        { value: 'issue-found', label: 'Issue', icon: <AlertCircle className="h-4 w-4" />, color: '#ef4444' },
                                        { value: 'not-checked', label: 'N/A', icon: <Circle className="h-4 w-4" />, color: '#94a3b8' }
                                    ].map(opt => (
                                        <Button
                                            key={opt.value}
                                            size="small"
                                            variant={section.status === opt.value ? 'contained' : 'outlined'}
                                            onClick={() => updateSection(index, { status: opt.value })}
                                            sx={{
                                                minWidth: 90,
                                                borderColor: opt.color,
                                                color: section.status === opt.value ? '#fff' : opt.color,
                                                bgcolor: section.status === opt.value ? opt.color : 'transparent',
                                                '&:hover': {
                                                    bgcolor: section.status === opt.value ? opt.color : `${opt.color}10`,
                                                    borderColor: opt.color
                                                }
                                            }}
                                            startIcon={opt.icon}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Box>
                                <Box sx={{ display: 'none', '@media print': { display: 'flex', alignItems: 'center', gap: 1 } }}>
                                    {(() => {
                                        const statusOpt = [
                                            { value: 'checked', label: 'Healthy', icon: <CheckCircle className="h-5 w-5" />, color: '#10b981' },
                                            { value: 'issue-found', label: 'Issue', icon: <AlertCircle className="h-5 w-5" />, color: '#ef4444' },
                                            { value: 'not-checked', label: 'N/A', icon: <Circle className="h-5 w-5" />, color: '#94a3b8' }
                                        ].find(opt => opt.value === section.status);
                                        return statusOpt ? (
                                            <>
                                                <Box sx={{ color: statusOpt.color, display: 'flex', alignItems: 'center' }} className="print-color-exact">
                                                    {statusOpt.icon}
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                                                    {statusOpt.label}
                                                </Typography>
                                            </>
                                        ) : null;
                                    })()}
                                </Box>
                            </Box>

                            <TextField
                                placeholder="Enter notes for this system section..."
                                multiline
                                minRows={1}
                                fullWidth
                                value={section.notes || ''}
                                onChange={(e) => updateSection(index, { notes: e.target.value })}
                                variant="outlined"
                                sx={{
                                    mt: 1,
                                    '& .MuiOutlinedInput-root': { bgcolor: '#fcfcfc' },
                                    '@media print': {
                                        display: 'none'
                                    }
                                }}
                            />
                            {section.notes && (
                                <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 1 } }}>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {section.notes}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                ))
            }

            <Box sx={{ mb: 6, '@media print': { display: 'none' } }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Plus />}
                    onClick={addSection}
                    sx={{
                        py: 2,
                        borderStyle: 'dashed',
                        color: 'text.secondary',
                        '&:hover': { borderStyle: 'dashed' }
                    }}
                >
                    Add Checklist Section
                </Button>
            </Box>

            <Card sx={{ mb: 4, mt: 4, '@media print': { breakInside: 'avoid' } }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                        General Observations & Recommendations
                    </Typography>
                    <TextField
                        placeholder="Overall summary of the visit and any recommended upgrades or follow-up actions..."
                        multiline
                        minRows={2}
                        fullWidth
                        value={reportState.report_data?.general_notes || ''}
                        onChange={(e) => setReportState({
                            ...reportState,
                            report_data: { ...reportState.report_data!, general_notes: e.target.value }
                        })}
                        sx={{
                            mt: 1,
                            '@media print': {
                                display: 'none'
                            }
                        }}
                    />
                    {reportState.report_data?.general_notes && (
                        <Box sx={{ display: 'none', '@media print': { display: 'block', mt: 1 } }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {reportState.report_data.general_notes}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 8, '@media print': { display: 'none' } }}>
                <Button variant="outlined" onClick={() => navigate(-1)}>
                    Cancel
                </Button>
                <Button variant="contained" size="large" startIcon={<CheckCircle />} onClick={() => handleSave('completed')}>
                    Complete Report
                </Button>
            </Box>
        </Box >
    );
};
