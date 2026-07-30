import { useCreate, useUpdate, useNotify, type Identifier } from "ra-core";
import { Deal } from "../types";
import { extractLeadInfo, generateStandardContractNumber } from "./leadUtils";

export const useContractLeadConverter = () => {
    const [createCompany] = useCreate();
    const [createContact] = useCreate();
    const [createContract] = useCreate();
    const [updateDeal] = useUpdate();
    const notify = useNotify();

    const linkLeadToExistingClient = async (deal: Deal, companyId: Identifier, contactId?: Identifier) => {
        try {
            const sanitizedDeal: any = {
                name: deal.name,
                company_id: companyId,
                contact_ids: contactId ? [contactId] : deal.contact_ids || [],
                category: deal.category || "Service Agreement",
                stage: deal.stage,
                description: deal.description || "",
                amount: Number(deal.amount) || 0,
                expected_closing_date: deal.expected_closing_date || new Date().toISOString().split("T")[0],
                sales_id: deal.sales_id,
                index: deal.index || 0
            };

            await new Promise<any>((resolve, reject) => {
                updateDeal(
                    "deals",
                    {
                        id: deal.id,
                        data: sanitizedDeal,
                        previousData: deal
                    },
                    {
                        onSuccess: resolve,
                        onError: reject
                    }
                );
            });

            notify(`Lead "${deal.name}" successfully linked to existing client profile!`, { type: "info" });
            return { companyId, contactId };
        } catch (error: any) {
            notify(`Error linking lead to client: ${error.message}`, { type: "error" });
            throw error;
        }
    };

    const convertLeadToClient = async (
        deal: Deal,
        companyName: string,
        contactFirstName: string,
        contactLastName: string,
        contactEmail: string,
        contactPhone?: string
    ) => {
        try {
            // 1. Create Company
            const companyResult = await new Promise<any>((resolve, reject) => {
                createCompany(
                    "companies",
                    {
                        data: {
                            name: companyName,
                            sector: "Information Technology",
                            size: 10,
                            created_at: new Date().toISOString()
                        }
                    },
                    {
                        onSuccess: resolve,
                        onError: reject
                    }
                );
            });

            const companyId = companyResult.id;

            // 2. Create Contact linked to Company (using standard 'email' & 'phone_1_number' PostgREST columns)
            const contactResult = await new Promise<any>((resolve, reject) => {
                createContact(
                    "contacts",
                    {
                        data: {
                            first_name: contactFirstName,
                            last_name: contactLastName,
                            company_id: companyId,
                            email: contactEmail,
                            phone_1_number: contactPhone,
                            phone_1_type: "Work",
                            first_seen: new Date().toISOString(),
                            last_seen: new Date().toISOString(),
                            status: "active"
                        }
                    },
                    {
                        onSuccess: resolve,
                        onError: reject
                    }
                );
            });

            const contactId = contactResult.id;

            // Clean update payload strictly matching PostgREST deals schema
            const sanitizedDeal: any = {
                name: deal.name,
                company_id: companyId,
                contact_ids: [contactId],
                category: deal.category || "Service Agreement",
                stage: deal.stage,
                description: deal.description || "",
                amount: Number(deal.amount) || 0,
                expected_closing_date: deal.expected_closing_date || new Date().toISOString().split("T")[0],
                sales_id: deal.sales_id,
                index: deal.index || 0
            };

            // 3. Update Deal with linked Client & Contact
            await new Promise<any>((resolve, reject) => {
                updateDeal(
                    "deals",
                    {
                        id: deal.id,
                        data: sanitizedDeal,
                        previousData: deal
                    },
                    {
                        onSuccess: resolve,
                        onError: reject
                    }
                );
            });

            notify(`Successfully created client "${companyName}" and linked to lead "${deal.name}"`, { type: "info" });
            return { companyId, contactId };
        } catch (error: any) {
            notify(`Error converting lead to client: ${error.message}`, { type: "error" });
            throw error;
        }
    };

    const convertLeadToContract = async (deal: Deal, customStatus?: string) => {
        try {
            const leadInfo = extractLeadInfo(deal.description);
            const freq = deal.payment_frequency || leadInfo.paymentFrequency || "Annual";

            // Status for newly generated Service Contract defaults to Proposal
            const contractStatus = customStatus || "Proposal";

            // Generate standard contract number using RPC / standard prefix algorithm (e.g. JAM-001)
            const contractNumber = await generateStandardContractNumber(deal.company_id, undefined, deal.name);
            const primaryContactId = deal.contact_ids && deal.contact_ids.length > 0 ? deal.contact_ids[0] : undefined;

            // Payload strictly matching contracts table schema columns
            const contractData: any = {
                contract_number: contractNumber,
                contract_name: deal.name,
                company_id: deal.company_id,
                amount: Number(deal.amount) || 0,
                status: contractStatus,
                payment_frequency: freq,
                start_date: deal.expected_closing_date || new Date().toISOString().split("T")[0],
                expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
                included_hours: 10
            };

            if (primaryContactId) {
                contractData.contact_id = primaryContactId;
            }

            // 1. Create Service Contract
            const contractResult = await new Promise<any>((resolve, reject) => {
                createContract(
                    "contracts",
                    { data: contractData },
                    {
                        onSuccess: resolve,
                        onError: reject
                    }
                );
            });

            // 2. Move deal stage to "proposal"
            if (!deal.isContractRecord) {
                const updatedDealData: any = {
                    name: deal.name,
                    company_id: deal.company_id,
                    contact_ids: deal.contact_ids,
                    category: deal.category || "Service Agreement",
                    stage: "proposal",
                    description: deal.description || "",
                    amount: Number(deal.amount) || 0,
                    expected_closing_date: deal.expected_closing_date || new Date().toISOString().split("T")[0],
                    sales_id: deal.sales_id,
                    index: deal.index || 0
                };

                await new Promise<any>((resolve) => {
                    updateDeal(
                        "deals",
                        { id: deal.id, data: updatedDealData, previousData: deal },
                        {
                            onSuccess: resolve,
                            onError: (err) => {
                                console.warn("Could not update deal stage to proposal", err);
                                resolve(null);
                            }
                        }
                    );
                });
            }

            notify(`Service Agreement "${contractNumber}" created and deal moved to Proposal stage!`, { type: "info" });
            return contractResult;
        } catch (error: any) {
            notify(`Error creating Service Agreement: ${error.message}`, { type: "error" });
            throw error;
        }
    };

    return {
        linkLeadToExistingClient,
        convertLeadToClient,
        convertLeadToContract
    };
};
