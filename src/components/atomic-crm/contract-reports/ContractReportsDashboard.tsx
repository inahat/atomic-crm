import { useState } from "react";
import { useContractMetrics } from "./hooks/useContractMetrics";
import { ContractReportFilters } from "./types";
import { ContractReportsHeader } from "./components/ContractReportsHeader";
import { ContractMetricsSummary } from "./components/ContractMetricsSummary";
import { ContractMonthlyRevenueChart } from "./components/ContractMonthlyRevenueChart";
import { ContractExpiryPipelineChart } from "./components/ContractExpiryPipelineChart";
import { ContractProposalPipelineChart } from "./components/ContractProposalPipelineChart";
import { ContractRiskBreakdown } from "./components/ContractRiskBreakdown";
import { ContractReportsTable } from "./components/ContractReportsTable";
import { ContractExportModal } from "./components/ContractExportModal";
import { Loading } from "@/components/admin";

export const ContractReportsDashboard = () => {
    const [filters, setFilters] = useState<ContractReportFilters>({
        search: "",
        status: []
    });
    const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

    const {
        contracts,
        rawContractsCount,
        isLoading,
        metrics,
        overdueContractsList,
        activeContractsList,
        proposalMetrics,
        monthlyRevenueTrend,
        proposalPipelineTrend,
        monthlyExpiryPipeline,
        riskBreakdown,
        exportFinancialReport,
        exportInvoicingScheduleReport,
        exportExpiryRiskReport,
        exportOperationalReport,
        exportMasterCleanReport
    } = useContractMetrics(filters);

    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto print:p-0">
            {/* Header & Filter Controls (Hidden in Print) */}
            <div className="print:hidden">
                <ContractReportsHeader
                    filters={filters}
                    onFilterChange={setFilters}
                    onOpenExport={() => setIsExportOpen(true)}
                    filteredCount={contracts.length}
                    totalCount={rawContractsCount}
                />
            </div>

            {/* Print Executive Header (Visible only when Printing) */}
            <div className="hidden print:block mb-4 border-b pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Service Contracts Executive Performance Report</h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Generated on {new Date().toLocaleDateString('en-GB')} • Scope: {contracts.length} active/billed contract profiles
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Atomic CRM Executive Review</div>
                        <div className="text-[10px] text-gray-500">Confidential Financial Presentation</div>
                    </div>
                </div>
            </div>

            {/* Metric KPI Summary Row */}
            <ContractMetricsSummary
                metrics={metrics}
                overdueContracts={overdueContractsList}
                activeContracts={activeContractsList}
            />

            {/* Renewal & Expiry Risk Assessment */}
            <ContractRiskBreakdown risk={riskBreakdown} />

            {/* Executive Charts Grid (Strictly 2 charts per row) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Chart 1: Active Contracts Cash Flow Schedule */}
                <ContractMonthlyRevenueChart
                    data={monthlyRevenueTrend}
                    onExportCSV={exportInvoicingScheduleReport}
                />
                
                {/* Chart 2: Proposals Pipeline */}
                <ContractProposalPipelineChart
                    data={proposalPipelineTrend}
                    proposalMetrics={proposalMetrics}
                />

                {/* Chart 3: Upcoming Expiry & Renewal Pipeline */}
                <ContractExpiryPipelineChart data={monthlyExpiryPipeline} />
            </div>

            {/* Detailed Contracts Summary Table (Hidden in Print) */}
            <ContractReportsTable contracts={contracts} />

            {/* Export Dialog Modal (Hidden in Print) */}
            <ContractExportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                onExportFinancial={exportFinancialReport}
                onExportExpiryRisk={exportExpiryRiskReport}
                onExportOperational={exportOperationalReport}
                onExportMasterClean={exportMasterCleanReport}
                recordCount={contracts.length}
            />
        </div>
    );
};
