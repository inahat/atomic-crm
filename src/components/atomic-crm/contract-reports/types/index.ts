export interface ContractReportFilters {
    search: string;
    status: string[];
    startDate?: string;
    endDate?: string;
}

export interface OverdueContractSummary {
    id: string;
    contract_number: string;
    contract_name: string;
    company_name: string;
    amount: number;
    status: string;
    start_date?: string;
    daysOverdue?: number;
}

export interface ActiveContractSummary {
    id: string;
    contract_number: string;
    contract_name: string;
    company_name: string;
    amount: number;
    status: string;
}

export interface ContractRiskItem {
    id: string;
    contract_number: string;
    contract_name: string;
    company_name: string;
    amount: number;
    status: string;
    expiry_date?: string;
    daysRemaining?: number;
}

export interface YoYMetrics {
    currentYear: number;
    priorYear: number;
    currentYearRevenue: number;
    priorYearRevenue: number;
    yoyGrowthPercent: number;
    currentYearCount: number;
    priorYearCount: number;
    currentYearAvg: number;
    priorYearAvg: number;
}

export interface ContractMetrics {
    staticTcvNet: number;            // Static sum of Approved, Open-Billed, Open-Unbilled contracts
    staticTcvVat: number;
    staticTcvGrand: number;
    filteredTcvNet: number;          // Dynamic sum of currently filtered contracts
    filteredTcvVat: number;
    filteredTcvGrand: number;
    expiringRiskValue: number;       // Sum of net amount for contracts expiring in < 60 days
    expiringCriticalCount: number;   // < 30 days
    expiringSoonCount: number;       // 30 - 60 days
    expiredCount: number;
    overdueBilledValue: number;      // Open-Billed where start_date <= today
    overdueBilledCount: number;
    unbilledActiveValue: number;
    unbilledActiveCount: number;
    totalContractsCount: number;
    activeContractsCount: number;    // Strictly Approved, Open-Billed, Open-Unbilled only
    averageContractValue: number;
    yoy: YoYMetrics;
}

export interface RevenueByStatusPoint {
    status: string;
    count: number;
    amount: number;
    formattedAmount: string;
}

export interface MonthlyPipelinePoint {
    monthKey: string;
    label: string;
    value: number;
    count: number;
}

export interface MonthlyRevenuePoint {
    monthKey: string;
    label: string;
    revenue: number;
    count: number;
}

export interface RiskCategoryBreakdown {
    open: { count: number; value: number; contracts: ContractRiskItem[] };      // Open-Billed & Open-Unbilled
    critical: { count: number; value: number; contracts: ContractRiskItem[] };  // < 30 days
    warning: { count: number; value: number; contracts: ContractRiskItem[] };   // 30-60 days
    healthy: { count: number; value: number; contracts: ContractRiskItem[] };   // > 60 days & Approved only
}
