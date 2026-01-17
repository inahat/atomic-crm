import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useGetOne, useGetList, useUpdate, useNotify } from 'ra-core';
import { Loading } from '@/components/admin';
import { Card, CardContent, Typography, Box, Button, IconButton } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X } from 'lucide-react';

// Helper to generate unique IDs for dropped items
const generateId = () => Math.random().toString(36).substr(2, 9);

const GLOBAL_PRINT_STYLES = `
@media print {
    body * {
        visibility: hidden;
    }
    #contract-canvas, #contract-canvas * {
        visibility: visible;
    }
    #contract-canvas {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none !important;
    }
    @page {
        size: auto;
        margin: 20mm;
    }
    .snippet-controls {
        display: none !important;
    }
}
`;

export const ContractBuilder = () => {
    const { id } = useParams();
    const notify = useNotify();

    const { data: contract, isPending: isContractLoading, error: contractError } = useGetOne(
        'contracts',
        { id },
        { enabled: !!id }
    );

    const { data: snippets, isPending: isSnippetsLoading } = useGetList(
        'contract_snippets',
        {
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'title', order: 'ASC' }
        }
    );

    const [update] = useUpdate();
    const [items, setItems] = useState<any[]>([]);

    // Auto-print logic
    const handlePrint = () => {
        const originalTitle = document.title;
        if (contract) {
            const expiryYear = contract.expiry_date ? new Date(contract.expiry_date).getFullYear() : '';
            document.title = `${contract.contract_name || 'Contract'}${contract.contract_number ? ` - ${contract.contract_number}` : ''}${expiryYear ? `-${expiryYear}` : ''}`;
        }

        const cleanup = () => {
            document.title = originalTitle;
            window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);
        window.print();
    };

    // Auto-print logic
    useEffect(() => {
        const hash = window.location.hash;
        const [path, queryString] = hash.split('?');
        const params = new URLSearchParams(queryString);

        if (params.get('print') === 'true' && contract && !isContractLoading && !isSnippetsLoading && items.length > 0) {
            // Remove the print param immediately so it doesn't loop
            params.delete('print');
            const newQuery = params.toString();
            // detailed history replace to avoid back-button loop
            window.history.replaceState(null, '', `${path}${newQuery ? '?' + newQuery : ''}`);

            // Small delay to ensure rendering
            setTimeout(() => {
                handlePrint();
            }, 1000);
        }
    }, [contract, isContractLoading, isSnippetsLoading, items]);

    useEffect(() => {
        if (contract && contract.content_structure) {
            // content_structure is expected to be an array. defaults to []
            setItems(Array.isArray(contract.content_structure) ? contract.content_structure : []);
        }
    }, [contract]);

    const { data: company } = useGetOne(
        'companies',
        { id: contract?.company_id },
        { enabled: !!contract?.company_id }
    );

    // Variable Substitution & Style Scoping Helper
    const processContent = (content: string, contractData: any, settingsData: any, companyData: any) => {
        let newContent = content;

        // Helper to format currency
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
            }).format(amount);
        };

        const amount = contractData?.amount || 0;
        const vatRate = 0.20;
        const vatAmount = amount * vatRate;
        const grandTotal = amount + vatAmount;

        // Payment Breakdown Logic
        let paymentBreakdownRow = '';
        const frequency = contractData?.payment_frequency || 'Annual';

        if (frequency === 'Bi-Annual') {
            const installment = grandTotal / 2;
            paymentBreakdownRow = `<tr>
                <td class="label">Payable by 2 Bi-Annual installments of</td>
                <td class="value">${formatCurrency(installment)} inc. VAT</td>
             </tr>`;
        } else if (frequency === 'Quarterly') {
            const installment = grandTotal / 4;
            paymentBreakdownRow = `<tr>
                <td class="label">Payable by 4 Quarterly installments of</td>
                <td class="value">${formatCurrency(installment)} inc. VAT</td>
             </tr>`;
        }

        // 1. Variable Substitution
        const variables = {
            // Contract/Client Data
            '{{client_name}}': companyData?.name || 'Client Name',
            '{{contract_name}}': contractData?.contract_name || 'Contract',
            '{{contract_number}}': contractData?.contract_number || 'DRAFT',
            '{{start_date}}': contractData?.start_date || 'TBD',
            '{{expiry_date}}': contractData?.expiry_date || 'TBD',
            '{{amount}}': contractData?.amount ? formatCurrency(amount) : 'TBD',
            '{{vat_amount}}': contractData?.amount ? formatCurrency(vatAmount) : 'TBD',
            '{{grand_total}}': contractData?.amount ? formatCurrency(grandTotal) : 'TBD',
            '{{payment_breakdown_row}}': paymentBreakdownRow,
            '{{included_hours}}': contractData?.included_hours || '0',
            '{{payment_terms}}': contractData?.payment_frequency || 'Annual',
            '{{site_address}}': [
                companyData?.address,
                companyData?.city,
                companyData?.stateAbbr,
                companyData?.zipcode,
                companyData?.country
            ].filter(Boolean).join(', ') || 'Site Address TBD',

            // Company (Org) Data
            '{{my_company_name}}': settingsData?.org_name || 'My Company',
            '{{my_company_address}}': settingsData?.org_address || '',
            '{{my_company_email}}': settingsData?.org_email || '',
            '{{my_company_phone}}': settingsData?.org_phone || '',
            '{{my_company_website}}': settingsData?.org_website || '',
            '{{my_company_logo}}': settingsData?.org_logo_url ? `<img src="${settingsData.org_logo_url}" alt="Logo" class="company-logo"/>` : '',
            '{{my_company_logo_url}}': settingsData?.org_logo_url || '',
        };

        const escapeRegExp = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        Object.entries(variables).forEach(([key, value]) => {
            newContent = newContent.replace(new RegExp(escapeRegExp(key), 'g'), String(value));
        });

        // 2. CSS Scoping
        newContent = newContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
            const scopedCss = css
                .replace(/body\s*\{/gi, '#contract-canvas {')
                .replace(/html\s*\{/gi, '#contract-canvas {');
            return `<style>${scopedCss}</style>`;
        });

        return newContent;
    };

    const { data: settingsList } = useGetList('crm_settings', { pagination: { page: 1, perPage: 1 } });
    const settings = settingsList?.[0] || {};

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        // Dropped outside the list
        if (!destination) return;

        // Copy from Sidebar to Canvas
        if (source.droppableId === 'sidebar' && destination.droppableId === 'canvas') {
            const snippet = snippets?.find((s: any) => s.id === result.draggableId);
            if (!snippet) return;

            const newItem = {
                id: generateId(), // New unique ID for this instance
                snippet_id: snippet.id,
                title: snippet.title,
                content: processContent(snippet.content, contract, settings, company), // Apply substitution & scoping
            };

            const newItems = Array.from(items);
            newItems.splice(destination.index, 0, newItem);
            setItems(newItems);
            return;
        }

        // Reorder within Canvas
        if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
            const newItems = Array.from(items);
            const [reorderedItem] = newItems.splice(source.index, 1);
            newItems.splice(destination.index, 0, reorderedItem);
            setItems(newItems);
        }
    };

    const handleContentChange = (index: number, newContent: string) => {
        const newItems = Array.from(items);
        newItems[index].content = newContent;
        setItems(newItems);
    };

    const handleSave = () => {
        if (!contract) return;
        update('contracts', { id, data: { content_structure: items }, previousData: contract }, {
            onSuccess: () => {
                notify('Contract saved successfully', { type: 'success' });
            },
            onError: () => {
                notify('Error saving contract', { type: 'error' });
            }
        });
    };

    const handleDeleteItem = (index: number) => {
        const newItems = Array.from(items);
        newItems.splice(index, 1);
        setItems(newItems);
    };

    if (isContractLoading || isSnippetsLoading) return <Loading />;
    if (contractError) {
        return (
            <Box p={4}>
                <Typography color="error" variant="h6">
                    Error loading contract: {contractError.message}
                </Typography>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </Box>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: 'flex', height: 'calc(100vh - 50px)', overflow: 'hidden' }}>
                {/* Sidebar: Snippet Library */}
                <Box sx={{ width: 320, borderRight: '1px solid #ddd', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
                    <Box p={2} borderBottom="1px solid #eee">
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Snippets</Typography>
                            <Button size="small" onClick={() => window.open('#/contract_snippets', '_blank')}>
                                + New
                            </Button>
                        </Box>
                        <Typography variant="caption" color="textSecondary">Drag to add</Typography>
                    </Box>
                    <Droppable droppableId="sidebar" isDropDisabled={true}>
                        {(provided) => (
                            <Box
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{ p: 2, overflowY: 'auto', flex: 1 }}
                            >
                                {snippets?.map((snippet: any, index: number) => (
                                    <Draggable key={snippet.id} draggableId={snippet.id} index={index}>
                                        {(provided, snapshot) => (
                                            <Card
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                sx={{
                                                    mb: 1,
                                                    cursor: 'grab',
                                                    bgcolor: snapshot.isDragging ? '#e3f2fd' : '#fff',
                                                    '&:hover': { boxShadow: 3 }
                                                }}
                                            >
                                                <CardContent sx={{ p: '12px !important' }}>
                                                    <Typography variant="subtitle2">{snippet.title}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{snippet.category}</Typography>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </Box>

                {/* Canvas: Document Editor */}
                <Box sx={{ flex: 1, bgcolor: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>

                    {/* Toolbar */}
                    <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={() => window.history.back()}>Close</Button>
                        <Button variant="outlined" onClick={handlePrint}>Print / PDF</Button>
                        <Button variant="contained" onClick={handleSave}>Save Contract</Button>
                    </Box>

                    {/* Scrollable Canvas Area */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
                        <style>{GLOBAL_PRINT_STYLES}</style>
                        <Droppable droppableId="canvas">
                            {(provided, snapshot) => (
                                <Box
                                    id="contract-canvas"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                        minHeight: '1123px', // A4 Height approx
                                        width: '210mm', // A4 Width
                                        mx: 'auto',
                                        bgcolor: '#fff',
                                        boxShadow: 3,
                                        p: 8, // Roughly 1 inch margin
                                        transition: 'background-color 0.2s ease',
                                        backgroundColor: snapshot.isDraggingOver ? '#fafafa' : '#fff'
                                    }}
                                >


                                    {items.length === 0 && (
                                        <Box sx={{ p: 4, border: '2px dashed #ddd', borderRadius: 2, textAlign: 'center', color: '#999' }}>
                                            Drag snippets from the sidebar here
                                        </Box>
                                    )}

                                    {items.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <Box
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    sx={{
                                                        mb: 2,
                                                        width: '100%',
                                                        position: 'relative',
                                                        border: snapshot.isDragging ? '1px solid #2196f3' : '1px solid transparent',
                                                        '&:hover': { border: '1px dashed #ccc' }
                                                    }}
                                                >
                                                    {/* Controls (Visible on Hover/Focus) */}
                                                    <Box
                                                        className="snippet-controls"
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            bgcolor: '#f5f5f5',
                                                            p: 0.5,
                                                            opacity: snapshot.isDragging ? 1 : 0,
                                                            transition: 'opacity 0.2s',
                                                            '.MuiBox-root:hover &': { opacity: 1 }
                                                        }}
                                                    >
                                                        <IconButton size="small" onClick={() => handleDeleteItem(index)} color="error">
                                                            <X size={16} />
                                                        </IconButton>
                                                    </Box>

                                                    {/* Content Renderer / Editor */}
                                                    <Box
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => handleContentChange(index, e.currentTarget.innerHTML)}
                                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                                        sx={{
                                                            p: 1,
                                                            outline: 'none',
                                                            cursor: 'text',
                                                            minHeight: '1em',
                                                            wordBreak: 'break-word',
                                                            '& img': { maxWidth: '100%' },
                                                            '& table': { width: '100%', borderCollapse: 'collapse' },
                                                            '&:focus': {
                                                                bgcolor: '#e8f0fe',
                                                                boxShadow: '0 0 0 2px #2196f3'
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </Box>
                </Box>
            </Box>
        </DragDropContext>
    );
};
