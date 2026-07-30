import { supabase } from "../providers/supabase/supabase";

export interface ExtractedLeadInfo {
    contactName?: string;
    contactEmail?: string;
    paymentFrequency?: string;
    cleanDescription: string;
}

export const extractLeadInfo = (description?: string): ExtractedLeadInfo => {
    if (!description) return { cleanDescription: "" };

    const match = description.match(/^\[Lead Contact: (.*?) \((.*?)\) \| Billing: (.*?)\]\n\n?/);
    if (match) {
        return {
            contactName: match[1] !== "N/A" ? match[1] : undefined,
            contactEmail: match[2] !== "N/A" ? match[2] : undefined,
            paymentFrequency: match[3] || "Annual",
            cleanDescription: description.replace(match[0], "")
        };
    }

    return { cleanDescription: description };
};

export const buildLeadDescription = (
    contactName?: string,
    contactEmail?: string,
    paymentFrequency?: string,
    notes?: string
): string => {
    const name = contactName?.trim() || "N/A";
    const email = contactEmail?.trim() || "N/A";
    const freq = paymentFrequency || "Annual";
    const header = `[Lead Contact: ${name} (${email}) | Billing: ${freq}]`;
    const cleanNotes = notes?.trim() || "";
    return cleanNotes ? `${header}\n\n${cleanNotes}` : header;
};

export const generateStandardContractNumber = async (
    companyId?: any,
    companyName?: string,
    fallbackTitle?: string
): Promise<string> => {
    // 1. Try Supabase RPC if companyId is present
    if (companyId) {
        try {
            const { data, error } = await supabase.rpc("generate_contract_number", {
                company_id: Number(companyId) || companyId
            });
            if (data && !error) {
                return data;
            }
        } catch {
            // Fallback to JS generator if RPC fails or running in fakerest mode
        }
    }

    // 2. JS Fallback following the exact same standard algorithm:
    // Takes first 3 alphanumeric chars uppercased
    const nameToUse = companyName || fallbackTitle || "CON";
    let prefix = nameToUse.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
    if (prefix.length < 3) {
        prefix = prefix.padEnd(3, "X");
    }
    const randSeq = Math.floor(1 + Math.random() * 9);
    return `${prefix}-00${randSeq}`;
};
