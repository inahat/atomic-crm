import { ContractReportFilters } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, FilterX, RefreshCw } from "lucide-react";

interface ContractReportsHeaderProps {
    filters: ContractReportFilters;
    onFilterChange: (newFilters: ContractReportFilters) => void;
    onOpenExport: () => void;
    filteredCount: number;
    totalCount: number;
}

const statusOptions = [
    { id: "Approved", label: "Approved" },
    { id: "Open-Billed", label: "Open-Billed" },
    { id: "Open-Unbilled", label: "Open-Unbilled" },
    { id: "Proposal-Sent", label: "Proposal-Sent" },
    { id: "Proposal", label: "Proposal" },
    { id: "VIP", label: "VIP" },
    { id: "Rejected", label: "Rejected" },
];

export const ContractReportsHeader = ({
    filters,
    onFilterChange,
    onOpenExport,
    filteredCount,
    totalCount
}: ContractReportsHeaderProps) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, search: e.target.value });
    };

    const toggleStatus = (statusId: string) => {
        const current = filters.status || [];
        const next = current.includes(statusId)
            ? current.filter(s => s !== statusId)
            : [...current, statusId];
        onFilterChange({ ...filters, status: next });
    };

    const resetFilters = () => {
        onFilterChange({ search: "", status: [] });
    };

    const hasActiveFilters = filters.search || (filters.status && filters.status.length > 0) || filters.startDate || filters.endDate;

    return (
        <div className="space-y-3 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contract Analytics & Reports</h1>
                    <p className="text-xs text-muted-foreground">
                        Showing {filteredCount} of {totalCount} contracts (excluding Rejected by default)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                            <FilterX className="mr-1 h-3.5 w-3.5" />
                            Clear Filters
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={onOpenExport} className="gap-1.5">
                        <Download className="h-4 w-4" />
                        Export / Print Reports
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2.5 shadow-sm">
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search contract number, name, or company..."
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="pl-8 h-9 text-xs"
                    />
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pl-1">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">Status:</span>
                    {statusOptions.map(opt => {
                        const isSelected = filters.status?.includes(opt.id);
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleStatus(opt.id)}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border ${
                                    isSelected
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground hover:bg-muted border-border"
                                }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
