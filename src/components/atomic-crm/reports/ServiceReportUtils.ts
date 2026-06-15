import { Contract, ServiceReport } from "../types";

/**
 * Generates an initial report data structure by scanning a contract's content structure.
 * It looks for items that likely represent "Scope" sections.
 */
export const generateReportFromContract = (contract: Contract): ServiceReport["report_data"] => {
    const sections: ServiceReport["report_data"]["sections"] = [];

    if (contract.content_structure && Array.isArray(contract.content_structure)) {
        contract.content_structure.forEach((item: any) => {
            // Check if it's a scope section based on title patterns
            // Patterns: "2. Scope", "Scope:", or explicitly contains "Scope"
            if (item.title && (
                item.title.toLowerCase().includes("scope") ||
                item.title.match(/^\d+\.\s*Scope/i)
            )) {
                sections.push({
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    title: cleanSectionTitle(item.title),
                    content: item.content, // Original scope description for reference
                    status: "not-checked",
                    notes: ""
                });
            }
        });
    }

    return {
        sections,
        general_notes: ""
    };
};

/**
 * Cleans up section titles (e.g., "2. Scope - Lighting" -> "Lighting")
 */
export const cleanSectionTitle = (title: string): string => {
    // Remove "2. Scope - ", "2- Scope - ", "Scope -", etc.
    // Handles any leading numbers, periods, dashes, or spaces before and after 'Scope'
    return title
        .replace(/^[0-9\s.-]*Scope[0-9\s.-]*/i, "")
        .replace(/^Scope\s*[:.-]\s*/i, "")
        .trim();
};
