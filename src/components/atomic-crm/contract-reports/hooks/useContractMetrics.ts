import { useMemo } from 'react';
import { useGetList, downloadCSV } from 'ra-core';
import jsonExport from 'jsonexport/dist';
import {
    ContractReportFilters,
    ContractMetrics,
    OverdueContractSummary,
    ActiveContractSummary,
    ContractRiskItem,
    RevenueByStatusPoint,
    MonthlyPipelinePoint,
    MonthlyRevenuePoint,
    RiskCategoryBreakdown,
    YoYMetrics
} from '../types';

export const useContractMetrics = (filters: ContractReportFilters) => {
    const { data: contracts = [], isPending: isContractsLoading } = useGetList('contracts', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'expiry_date', order: 'ASC' }
    });

    const { data: companies = [], isPending: isCompaniesLoading } = useGetList('companies', {
        pagination: { page: 1, perPage: 1000 }
    });

    const { data: contacts = [], isPending: isContactsLoading } = useGetList('contacts', {
        pagination: { page: 1, perPage: 1000 }
    });

    const companyMap = useMemo(() => {
        const map = new Map<string, any>();
        companies.forEach(c => map.set(String(c.id), c));
        return map;
    }, [companies]);

    const contactMap = useMemo(() => {
        const map = new Map<string, any>();
        contacts.forEach(c => map.set(String(c.id), c));
        return map;
    }, [contacts]);

    // Filter contracts based on active filter state
    const filteredContracts = useMemo(() => {
        return contracts.filter(contract => {
            // Status Filter logic:
            // If user explicitly selected statuses, match them.
            // If status filter is empty (default), exclude 'Rejected' contracts.
            if (filters.status && filters.status.length > 0) {
                if (!filters.status.includes(contract.status)) return false;
            } else {
                if (contract.status === 'Rejected') return false;
            }

            // Search Query Filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const companyName = companyMap.get(String(contract.company_id))?.name || '';
                const matchesNum = contract.contract_number?.toLowerCase().includes(searchLower);
                const matchesName = contract.contract_name?.toLowerCase().includes(searchLower);
                const matchesCompany = companyName.toLowerCase().includes(searchLower);
                if (!matchesNum && !matchesName && !matchesCompany) return false;
            }

            // Start Date Filter
            if (filters.startDate && contract.start_date) {
                if (new Date(contract.start_date) < new Date(filters.startDate)) return false;
            }

            // End Date / Expiry Filter
            if (filters.endDate && contract.expiry_date) {
                if (new Date(contract.expiry_date) > new Date(filters.endDate)) return false;
            }

            return true;
        });
    }, [contracts, filters, companyMap]);

    // Year-on-Year (YoY) Historical Performance Calculation
    const yoy: YoYMetrics = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const priorYear = currentYear - 1;

        let currentYearRevenue = 0;
        let priorYearRevenue = 0;
        let currentYearCount = 0;
        let priorYearCount = 0;

        contracts.forEach(c => {
            if (!['Approved', 'Open-Billed', 'Open-Unbilled'].includes(c.status)) return;

            let startDate = c.start_date ? new Date(c.start_date) : null;
            if (!startDate && c.expiry_date) {
                const exp = new Date(c.expiry_date);
                startDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            }
            if (!startDate) return;

            const year = startDate.getFullYear();
            const amt = Number(c.amount) || 0;

            if (year === currentYear) {
                currentYearRevenue += amt;
                currentYearCount++;
            } else if (year === priorYear) {
                priorYearRevenue += amt;
                priorYearCount++;
            }
        });

        const yoyGrowthPercent = priorYearRevenue > 0
            ? ((currentYearRevenue - priorYearRevenue) / priorYearRevenue) * 100
            : 0;

        const currentYearAvg = currentYearCount > 0 ? currentYearRevenue / currentYearCount : 0;
        const priorYearAvg = priorYearCount > 0 ? priorYearRevenue / priorYearCount : 0;

        return {
            currentYear,
            priorYear,
            currentYearRevenue,
            priorYearRevenue,
            yoyGrowthPercent,
            currentYearCount,
            priorYearCount,
            currentYearAvg,
            priorYearAvg
        };
    }, [contracts]);

    // Static TCV Calculation: Static sum of Approved, Open-Billed, and Open-Unbilled contracts across whole DB
    const staticTcvMetrics = useMemo(() => {
        let staticTcvNet = 0;
        contracts.forEach(contract => {
            if (['Approved', 'Open-Billed', 'Open-Unbilled'].includes(contract.status)) {
                staticTcvNet += Number(contract.amount) || 0;
            }
        });
        const staticTcvVat = staticTcvNet * 0.20;
        const staticTcvGrand = staticTcvNet + staticTcvVat;
        return { staticTcvNet, staticTcvVat, staticTcvGrand };
    }, [contracts]);

    // Helper to evaluate if start_date has passed OR less than 1 year to expiry_date
    const checkIsContractStartedOrUnbilledExpired = (contract: any, now: Date) => {
        const startDate = contract.start_date ? new Date(contract.start_date) : null;
        const expDate = contract.expiry_date ? new Date(contract.expiry_date) : null;

        if (startDate && startDate <= now) return true;

        if (expDate) {
            const diffMs = expDate.getTime() - now.getTime();
            const oneYearMs = 365 * 24 * 60 * 60 * 1000;
            if (diffMs < oneYearMs) return true;
        }

        return false;
    };

    // Overdue Contracts List for Hover / Mouseover Details
    const overdueContractsList: OverdueContractSummary[] = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const list: OverdueContractSummary[] = [];

        filteredContracts.forEach(contract => {
            const isStartedOrExpiredUnbilled = checkIsContractStartedOrUnbilledExpired(contract, now);

            if ((contract.status === 'Open-Billed' || contract.status === 'Open-Unbilled') && isStartedOrExpiredUnbilled) {
                const startDate = contract.start_date ? new Date(contract.start_date) : null;
                const daysOverdue = startDate ? Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;

                list.push({
                    id: String(contract.id),
                    contract_number: contract.contract_number || 'DRAFT',
                    contract_name: contract.contract_name || 'Contract',
                    company_name: companyMap.get(String(contract.company_id))?.name || 'N/A',
                    amount: Number(contract.amount) || 0,
                    status: contract.status,
                    start_date: contract.start_date,
                    daysOverdue
                });
            }
        });

        return list;
    }, [filteredContracts, companyMap]);

    // Mid-Year Invoicing Due Contracts List (Bi-Annual contracts reaching 6-month installment date)
    const midYearDueContractsList = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const list: Array<{
            id: string;
            contract_number: string;
            contract_name: string;
            company_name: string;
            totalAmount: number;
            midYearAmount: number;
            midYearDate: string;
            daysUntilMidYear: number;
            isDueOrOverdue: boolean;
        }> = [];

        filteredContracts.forEach(c => {
            if (!['Approved', 'Open-Billed', 'Open-Unbilled'].includes(c.status)) return;
            if (c.payment_frequency !== 'Bi-Annual') return;

            let startDate = c.start_date ? new Date(c.start_date) : null;
            if (!startDate && c.expiry_date) {
                const exp = new Date(c.expiry_date);
                startDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            }
            if (!startDate) return;

            const midYearDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, startDate.getDate());
            const diffDays = Math.ceil((midYearDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            const totalAmount = Number(c.amount) || 0;
            const midYearAmount = totalAmount / 2;

            list.push({
                id: String(c.id),
                contract_number: c.contract_number || 'DRAFT',
                contract_name: c.contract_name || 'Contract',
                company_name: companyMap.get(String(c.company_id))?.name || 'N/A',
                totalAmount,
                midYearAmount,
                midYearDate: midYearDate.toLocaleDateString('en-GB'),
                daysUntilMidYear: diffDays,
                isDueOrOverdue: diffDays <= 30
            });
        });

        return list.sort((a, b) => a.daysUntilMidYear - b.daysUntilMidYear);
    }, [filteredContracts, companyMap]);

    // Active Contracts List strictly: Approved, Open-Billed, Open-Unbilled only
    const activeContractsList: ActiveContractSummary[] = useMemo(() => {
        return filteredContracts
            .filter(c => ['Approved', 'Open-Billed', 'Open-Unbilled'].includes(c.status))
            .map(c => ({
                id: String(c.id),
                contract_number: c.contract_number || 'DRAFT',
                contract_name: c.contract_name || 'Contract',
                company_name: c.company_id ? companyMap.get(String(c.company_id))?.name || 'N/A' : 'N/A',
                amount: Number(c.amount) || 0,
                status: c.status
            }));
    }, [filteredContracts, companyMap]);

    // Proposal Metrics Breakdown (Proposal vs Proposal-Sent totals)
    const proposalMetrics = useMemo(() => {
        let proposalValue = 0;
        let proposalSentValue = 0;

        filteredContracts.forEach(c => {
            const amt = Number(c.amount) || 0;
            if (c.status === 'Proposal' || c.status === 'Proposed') {
                proposalValue += amt;
            } else if (c.status === 'Proposal-Sent') {
                proposalSentValue += amt;
            }
        });

        const grandTotal = proposalValue + proposalSentValue;
        return { grandTotal, proposalValue, proposalSentValue };
    }, [filteredContracts]);

    // Metric Calculations
    const metrics: ContractMetrics = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let filteredTcvNet = 0;
        let activeContractsCount = 0;
        let expiringRiskValue = 0;
        let expiringCriticalCount = 0;
        let expiringSoonCount = 0;
        let expiredCount = 0;

        let overdueBilledValue = 0;
        let overdueBilledCount = 0;
        let unbilledActiveValue = 0;
        let unbilledActiveCount = 0;

        filteredContracts.forEach(contract => {
            const amount = Number(contract.amount) || 0;
            filteredTcvNet += amount;

            // Active Contracts strictly: Approved, Open-Billed, Open-Unbilled only
            if (['Approved', 'Open-Billed', 'Open-Unbilled'].includes(contract.status)) {
                activeContractsCount++;
            }

            const isStartedOrExpiredUnbilled = checkIsContractStartedOrUnbilledExpired(contract, now);

            // Overdue Billed & Unbilled Active logic
            if (contract.status === 'Open-Billed' && isStartedOrExpiredUnbilled) {
                overdueBilledValue += amount;
                overdueBilledCount++;
            } else if (contract.status === 'Open-Unbilled' && isStartedOrExpiredUnbilled) {
                unbilledActiveValue += amount;
                unbilledActiveCount++;
            }

            if (contract.expiry_date) {
                const expDate = new Date(contract.expiry_date);
                const diffTime = expDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    expiredCount++;
                } else if (diffDays <= 30) {
                    expiringCriticalCount++;
                    expiringRiskValue += amount;
                } else if (diffDays <= 60) {
                    expiringSoonCount++;
                    expiringRiskValue += amount;
                }
            }
        });

        const filteredTcvVat = filteredTcvNet * 0.20;
        const filteredTcvGrand = filteredTcvNet + filteredTcvVat;
        const totalContractsCount = filteredContracts.length;
        const averageContractValue = activeContractsCount > 0 ? staticTcvMetrics.staticTcvNet / activeContractsCount : 0;

        return {
            staticTcvNet: staticTcvMetrics.staticTcvNet,
            staticTcvVat: staticTcvMetrics.staticTcvVat,
            staticTcvGrand: staticTcvMetrics.staticTcvGrand,
            filteredTcvNet,
            filteredTcvVat,
            filteredTcvGrand,
            expiringRiskValue,
            expiringCriticalCount,
            expiringSoonCount,
            expiredCount,
            overdueBilledValue,
            overdueBilledCount,
            unbilledActiveValue,
            unbilledActiveCount,
            totalContractsCount,
            activeContractsCount,
            averageContractValue,
            yoy
        };
    }, [filteredContracts, staticTcvMetrics, yoy]);

    // Revenue by Status Data (Excludes Rejected unless toggled)
    const revenueByStatus: RevenueByStatusPoint[] = useMemo(() => {
        const formatCurrency = (amt: number) => `£${amt.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

        const statusMap = new Map<string, { count: number; amount: number }>();
        const possibleStatuses = ['Approved', 'Open-Billed', 'Open-Unbilled', 'Proposal-Sent', 'Proposal', 'VIP'];

        if (filters.status?.includes('Rejected')) {
            possibleStatuses.push('Rejected');
        }

        possibleStatuses.forEach(s => statusMap.set(s, { count: 0, amount: 0 }));

        filteredContracts.forEach(contract => {
            const status = contract.status || 'Other';
            if (statusMap.has(status)) {
                const current = statusMap.get(status)!;
                statusMap.set(status, {
                    count: current.count + 1,
                    amount: current.amount + (Number(contract.amount) || 0)
                });
            }
        });

        return Array.from(statusMap.entries()).map(([status, val]) => ({
            status,
            count: val.count,
            amount: val.amount,
            formattedAmount: formatCurrency(val.amount)
        }));
    }, [filteredContracts, filters.status]);

    // Installment-Aware Cash Flow Schedule Trend (Approved, Open-Billed, Open-Unbilled)
    const monthlyRevenueTrend: MonthlyRevenuePoint[] = useMemo(() => {
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        const monthPoints: MonthlyRevenuePoint[] = monthLabels.map((label, idx) => ({
            monthKey: String(idx),
            label,
            revenue: 0,
            count: 0
        }));

        filteredContracts.forEach(contract => {
            if (!['Approved', 'Open-Billed', 'Open-Unbilled'].includes(contract.status)) return;

            let startDate = contract.start_date ? new Date(contract.start_date) : null;
            if (!startDate && contract.expiry_date) {
                const exp = new Date(contract.expiry_date);
                startDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            }
            if (!startDate) return;

            const baseAmount = Number(contract.amount) || 0;
            const freq = contract.payment_frequency || 'Annual';
            const startMonthIdx = startDate.getMonth(); // 0 to 11

            if (freq === 'Bi-Annual') {
                const halfAmt = baseAmount / 2;
                const m1 = startMonthIdx;
                const m2 = (startMonthIdx + 6) % 12;

                monthPoints[m1].revenue += halfAmt;
                monthPoints[m1].count += 1;
                monthPoints[m2].revenue += halfAmt;
                monthPoints[m2].count += 1;
            } else if (freq === 'Quarterly') {
                const qtrAmt = baseAmount / 4;
                for (let q = 0; q < 4; q++) {
                    const m = (startMonthIdx + q * 3) % 12;
                    monthPoints[m].revenue += qtrAmt;
                    monthPoints[m].count += 1;
                }
            } else {
                monthPoints[startMonthIdx].revenue += baseAmount;
                monthPoints[startMonthIdx].count += 1;
            }
        });

        return monthPoints;
    }, [filteredContracts]);

    // Proposal Pipeline Trend (Grouping contracts by start/quoted month for Proposal, Proposed, Proposal-Sent)
    const proposalPipelineTrend: MonthlyRevenuePoint[] = useMemo(() => {
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        const monthPoints: MonthlyRevenuePoint[] = monthLabels.map((label, idx) => ({
            monthKey: String(idx),
            label,
            revenue: 0,
            count: 0
        }));

        filteredContracts.forEach(contract => {
            if (!['Proposal', 'Proposed', 'Proposal-Sent'].includes(contract.status)) return;

            let startDate = contract.start_date ? new Date(contract.start_date) : null;
            if (!startDate && contract.expiry_date) {
                const exp = new Date(contract.expiry_date);
                startDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            }
            if (!startDate) return;

            const monthIdx = startDate.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
                monthPoints[monthIdx].revenue += Number(contract.amount) || 0;
                monthPoints[monthIdx].count += 1;
            }
        });

        return monthPoints;
    }, [filteredContracts]);

    // Monthly Expiry Pipeline Data (Next 12 Months for Approved, Open-Billed, Open-Unbilled only)
    const monthlyExpiryPipeline: MonthlyPipelinePoint[] = useMemo(() => {
        const monthPoints: MonthlyPipelinePoint[] = [];
        const today = new Date();

        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            monthPoints.push({ monthKey, label, value: 0, count: 0 });
        }

        filteredContracts.forEach(contract => {
            if (!['Approved', 'Open-Billed', 'Open-Unbilled'].includes(contract.status)) return;

            if (!contract.expiry_date) return;
            const expDate = new Date(contract.expiry_date);
            const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
            const point = monthPoints.find(p => p.monthKey === monthKey);
            if (point) {
                point.value += Number(contract.amount) || 0;
                point.count += 1;
            }
        });

        return monthPoints;
    }, [filteredContracts]);

    // Risk Category Breakdown Data (Open, Critical, Warning, Healthy)
    const riskBreakdown: RiskCategoryBreakdown = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const breakdown: RiskCategoryBreakdown = {
            open: { count: 0, value: 0, contracts: [] },
            critical: { count: 0, value: 0, contracts: [] },
            warning: { count: 0, value: 0, contracts: [] },
            healthy: { count: 0, value: 0, contracts: [] }
        };

        filteredContracts.forEach(contract => {
            const amt = Number(contract.amount) || 0;
            const item: ContractRiskItem = {
                id: String(contract.id),
                contract_number: contract.contract_number || 'DRAFT',
                contract_name: contract.contract_name || 'Contract',
                company_name: companyMap.get(String(contract.company_id))?.name || 'N/A',
                amount: amt,
                status: contract.status,
                expiry_date: contract.expiry_date
            };

            // Open category: Open-Billed or Open-Unbilled
            if (contract.status === 'Open-Billed' || contract.status === 'Open-Unbilled') {
                breakdown.open.count++;
                breakdown.open.value += amt;
                breakdown.open.contracts.push(item);
            }

            if (!contract.expiry_date) {
                if (contract.status === 'Approved') {
                    breakdown.healthy.count++;
                    breakdown.healthy.value += amt;
                    breakdown.healthy.contracts.push(item);
                }
                return;
            }

            const expDate = new Date(contract.expiry_date);
            const diffTime = expDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            item.daysRemaining = diffDays;

            if (diffDays >= 0 && diffDays <= 30) {
                // Critical: < 30 days remaining, excluding VIP status
                if (contract.status !== 'VIP') {
                    breakdown.critical.count++;
                    breakdown.critical.value += amt;
                    breakdown.critical.contracts.push(item);
                }
            } else if (diffDays > 30 && diffDays <= 60) {
                // Warning: 30 - 60 days remaining, excluding VIP status
                if (contract.status !== 'VIP') {
                    breakdown.warning.count++;
                    breakdown.warning.value += amt;
                    breakdown.warning.contracts.push(item);
                }
            } else if (diffDays > 60) {
                // Healthy: >60 days remaining and strictly Approved status
                if (contract.status === 'Approved') {
                    breakdown.healthy.count++;
                    breakdown.healthy.value += amt;
                    breakdown.healthy.contracts.push(item);
                }
            }
        });

        return breakdown;
    }, [filteredContracts, companyMap]);

    // Format GBP for CSV without non-breaking space issues
    const formatGBPCSV = (val?: number) => {
        if (val === undefined || val === null || isNaN(val)) return '£0.00';
        return `£${val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const exportFinancialReport = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const rows = filteredContracts.map(c => {
            const net = Number(c.amount) || 0;
            const vat = net * 0.20;
            const grand = net + vat;
            const freq = c.payment_frequency || 'Annual';
            let installment = formatGBPCSV(grand);
            if (freq === 'Quarterly') installment = `4x ${formatGBPCSV(grand / 4)} / qtr`;
            else if (freq === 'Bi-Annual') installment = `2x ${formatGBPCSV(grand / 2)} / half-yr`;

            const isStartedOrExpiredUnbilled = checkIsContractStartedOrUnbilledExpired(c, now);
            let paymentState = 'Paid / Approved';

            if (c.status === 'Open-Billed') {
                if (isStartedOrExpiredUnbilled) {
                    const startDate = c.start_date ? new Date(c.start_date) : null;
                    const daysOverdue = startDate ? Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    paymentState = `OVERDUE (${daysOverdue}d unpaid)`;
                } else {
                    paymentState = 'Invoice Sent (Pending)';
                }
            } else if (c.status === 'Open-Unbilled') {
                if (isStartedOrExpiredUnbilled) {
                    paymentState = 'UNBILLED OVERDUE';
                } else {
                    paymentState = 'Needs Invoicing';
                }
            }

            return {
                'Contract No': c.contract_number || 'DRAFT',
                'Client Name': companyMap.get(String(c.company_id))?.name || 'N/A',
                'Contract Name': c.contract_name,
                'Payment Terms': freq,
                'Net Amount': formatGBPCSV(net),
                'VAT (20%)': formatGBPCSV(vat),
                'Grand Total (inc VAT)': formatGBPCSV(grand),
                'Installment Breakdown': installment,
                'Contract Status': c.status,
                'Payment Status': paymentState,
                'Start Date': c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB') : '',
                'Expiry Date': c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-GB') : ''
            };
        });

        jsonExport(rows, {}, (_err: any, csv: string) => {
            downloadCSV(`\uFEFF${csv}`, `financial_contracts_report_${new Date().toISOString().split('T')[0]}`);
        });
    };

    // Export Invoicing Schedule Report (Real Installment Target Dates for Annual, Bi-Annual, & Quarterly)
    const exportInvoicingScheduleReport = () => {
        const rows: any[] = [];

        filteredContracts.forEach(c => {
            if (!['Approved', 'Open-Billed', 'Open-Unbilled'].includes(c.status)) return;

            let startDate = c.start_date ? new Date(c.start_date) : null;
            if (!startDate && c.expiry_date) {
                const exp = new Date(c.expiry_date);
                startDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            }
            if (!startDate) return;

            const companyName = companyMap.get(String(c.company_id))?.name || 'N/A';
            const totalNet = Number(c.amount) || 0;
            const freq = c.payment_frequency || 'Annual';

            if (freq === 'Bi-Annual') {
                const halfNet = totalNet / 2;
                const halfVat = halfNet * 0.20;
                const halfGrand = halfNet + halfVat;
                const midYearDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, startDate.getDate());

                rows.push({
                    'Contract No': c.contract_number || 'DRAFT',
                    'Client Name': companyName,
                    'Contract Name': c.contract_name,
                    'Payment Frequency': 'Bi-Annual',
                    'Installment': '1 of 2 (50% Initial)',
                    'Invoice Target Date': startDate.toLocaleDateString('en-GB'),
                    'Net Amount': formatGBPCSV(halfNet),
                    'VAT (20%)': formatGBPCSV(halfVat),
                    'Grand Total (inc VAT)': formatGBPCSV(halfGrand),
                    'Contract Status': c.status
                });

                rows.push({
                    'Contract No': c.contract_number || 'DRAFT',
                    'Client Name': companyName,
                    'Contract Name': c.contract_name,
                    'Payment Frequency': 'Bi-Annual',
                    'Installment': '2 of 2 (50% Mid-Year)',
                    'Invoice Target Date': midYearDate.toLocaleDateString('en-GB'),
                    'Net Amount': formatGBPCSV(halfNet),
                    'VAT (20%)': formatGBPCSV(halfVat),
                    'Grand Total (inc VAT)': formatGBPCSV(halfGrand),
                    'Contract Status': c.status
                });
            } else if (freq === 'Quarterly') {
                const qtrNet = totalNet / 4;
                const qtrVat = qtrNet * 0.20;
                const qtrGrand = qtrNet + qtrVat;

                for (let q = 0; q < 4; q++) {
                    const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + q * 3, startDate.getDate());
                    rows.push({
                        'Contract No': c.contract_number || 'DRAFT',
                        'Client Name': companyName,
                        'Contract Name': c.contract_name,
                        'Payment Frequency': 'Quarterly',
                        'Installment': `${q + 1} of 4 (25%)`,
                        'Invoice Target Date': targetDate.toLocaleDateString('en-GB'),
                        'Net Amount': formatGBPCSV(qtrNet),
                        'VAT (20%)': formatGBPCSV(qtrVat),
                        'Grand Total (inc VAT)': formatGBPCSV(qtrGrand),
                        'Contract Status': c.status
                    });
                }
            } else {
                // Annual / Default
                const vat = totalNet * 0.20;
                const grand = totalNet + vat;
                rows.push({
                    'Contract No': c.contract_number || 'DRAFT',
                    'Client Name': companyName,
                    'Contract Name': c.contract_name,
                    'Payment Frequency': 'Annual',
                    'Installment': '1 of 1 (100%)',
                    'Invoice Target Date': startDate.toLocaleDateString('en-GB'),
                    'Net Amount': formatGBPCSV(totalNet),
                    'VAT (20%)': formatGBPCSV(vat),
                    'Grand Total (inc VAT)': formatGBPCSV(grand),
                    'Contract Status': c.status
                });
            }
        });

        jsonExport(rows, {}, (_err: any, csv: string) => {
            downloadCSV(`\uFEFF${csv}`, `invoicing_schedule_report_${new Date().toISOString().split('T')[0]}`);
        });
    };

    const exportExpiryRiskReport = () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const rows = filteredContracts.map(c => {
            const contact = contactMap.get(String(c.contact_id));
            const expDate = c.expiry_date ? new Date(c.expiry_date) : null;
            let daysRemaining = 'N/A';
            let risk = 'Healthy';

            if (expDate) {
                const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                daysRemaining = String(diffDays);
                if (diffDays < 0) risk = 'EXPIRED';
                else if (diffDays <= 30) risk = 'CRITICAL (<30 days)';
                else if (diffDays <= 60) risk = 'WARNING (30-60 days)';
            }

            return {
                'Contract No': c.contract_number || 'DRAFT',
                'Client Name': companyMap.get(String(c.company_id))?.name || 'N/A',
                'Primary Contact': contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : 'N/A',
                'Contact Email': contact?.email || 'N/A',
                'Expiry Date': c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-GB') : 'N/A',
                'Days Remaining': daysRemaining,
                'Status': c.status,
                'Risk Category': risk,
                'Annual Amount': formatGBPCSV(c.amount)
            };
        });

        jsonExport(rows, {}, (_err: any, csv: string) => {
            downloadCSV(`\uFEFF${csv}`, `expiry_risk_contracts_report_${new Date().toISOString().split('T')[0]}`);
        });
    };

    const exportOperationalReport = () => {
        const rows = filteredContracts.map(c => {
            const monthlyHours = Number(c.included_hours) || 0;
            return {
                'Contract No': c.contract_number || 'DRAFT',
                'Client Name': companyMap.get(String(c.company_id))?.name || 'N/A',
                'Contract Name': c.contract_name,
                'Monthly Included Hours': `${monthlyHours} hrs`,
                'Annual Equivalent Hours': `${monthlyHours * 12} hrs`,
                'Status': c.status,
                'OvrC Portal Link': c.ovrc_url || 'N/A'
            };
        });

        jsonExport(rows, {}, (_err: any, csv: string) => {
            downloadCSV(`\uFEFF${csv}`, `operational_contracts_report_${new Date().toISOString().split('T')[0]}`);
        });
    };

    const exportMasterCleanReport = () => {
        const rows = filteredContracts.map(c => ({
            'Contract No': c.contract_number || 'DRAFT',
            'Contract Name': c.contract_name,
            'Client Name': companyMap.get(String(c.company_id))?.name || 'N/A',
            'Start Date': c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB') : '',
            'Expiry Date': c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-GB') : '',
            'Net Amount': formatGBPCSV(c.amount),
            'Payment Frequency': c.payment_frequency || 'Annual',
            'Included Hours (Monthly)': c.included_hours || 0,
            'Status': c.status
        }));

        jsonExport(rows, {}, (_err: any, csv: string) => {
            downloadCSV(`\uFEFF${csv}`, `contracts_master_export_${new Date().toISOString().split('T')[0]}`);
        });
    };

    return {
        contracts: filteredContracts,
        rawContractsCount: contracts.length,
        isLoading: isContractsLoading || isCompaniesLoading || isContactsLoading,
        metrics,
        overdueContractsList,
        midYearDueContractsList,
        activeContractsList,
        proposalMetrics,
        revenueByStatus,
        monthlyRevenueTrend,
        proposalPipelineTrend,
        monthlyExpiryPipeline,
        riskBreakdown,
        exportFinancialReport,
        exportInvoicingScheduleReport,
        exportExpiryRiskReport,
        exportOperationalReport,
        exportMasterCleanReport
    };
};
