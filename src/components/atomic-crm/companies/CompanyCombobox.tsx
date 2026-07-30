import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Building2, Search, Check, ChevronDown } from "lucide-react";
import { Company } from "../types";

interface CompanyComboboxProps {
    companies: Company[];
    value: string; // companyId as string
    onChange: (companyId: string) => void;
    placeholder?: string;
}

export const CompanyCombobox: React.FC<CompanyComboboxProps> = ({
    companies,
    value,
    onChange,
    placeholder = "Type first or last name to filter..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedCompany = companies.find(c => String(c.id) === value);

    // Sync search input display with selected company name when closed
    useEffect(() => {
        if (selectedCompany && !isOpen) {
            setSearch(selectedCompany.name);
        } else if (!selectedCompany && !isOpen) {
            setSearch("");
        }
    }, [selectedCompany, isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                if (selectedCompany) {
                    setSearch(selectedCompany.name);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedCompany]);

    const filteredCompanies = companies.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase().trim();
        return c.name.toLowerCase().includes(q);
    });

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="text"
                    className="pl-9 pr-8 text-xs h-9"
                    placeholder={placeholder}
                    value={search}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch(""); // clear input text on focus to allow immediate filtering
                    }}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                />
                <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-[220px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                    {filteredCompanies.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground text-center">
                            No clients matching "{search}"
                        </div>
                    ) : (
                        <div className="py-1">
                            {filteredCompanies.map(c => {
                                const isSelected = String(c.id) === value;
                                return (
                                    <div
                                        key={c.id}
                                        className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-accent hover:text-accent-foreground ${
                                            isSelected ? "bg-accent font-semibold" : ""
                                        }`}
                                        onClick={() => {
                                            onChange(String(c.id));
                                            setSearch(c.name);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span>{c.name}</span>
                                            {c.sector && (
                                                <span className="text-[11px] text-muted-foreground">({c.sector})</span>
                                            )}
                                        </div>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
