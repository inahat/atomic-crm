
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    let debugTrace = "BOOT";

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    let subject = "INTERNAL_ERROR_FALLBACK";
    let htmlContent = "NO_BODY";
    let clientName: string | null = null;
    let projectName: string | null = null;

    try {
        debugTrace += " -> READ_JSON";
        const payload = await req.json();
        subject = payload.subject || payload.Subject || 'No Subject';
        htmlContent = payload.body_plain || payload.body || payload.bodyHtml || payload.Body || '';
        debugTrace += " -> JSON_OK";

        debugTrace += " -> INIT_SB";
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        debugTrace += " -> SB_OK";

        const logFailure = async (reason: string, extractedClient: string | null, extractedProject: string | null) => {
            console.error(`Alert Failed: ${reason}`);
            try {
                await supabaseClient.from('failed_events').insert({
                    subject: subject,
                    raw_body: htmlContent,
                    error_reason: reason,
                    extracted_client_name: extractedClient,
                    extracted_project_name: extractedProject
                });
            } catch (dbErr: any) {
                console.error("Critical: Could not log failure to DB", dbErr);
            }
            return new Response(JSON.stringify({ success: false, message: `Logged failure: ${reason}`, trace: debugTrace }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        };

        // --- HIGH PRECISION PARSING (ID-BASED) ---
        debugTrace += " -> HIGH_PRECISION_PARSE";

        const getById = (id: string) => {
            const regex = new RegExp(`id="${id}"[^>]*>\\s*([^<]+)`, 'i');
            const match = htmlContent.match(regex);
            return match ? match[1].trim() : null;
        };

        const idCustomer = getById('customerName');
        const idLocation = getById('locationName');
        const idJobCode = getById('jobCode');

        // Extract Dashboard URL
        const dashboardMatch = htmlContent.match(/href="([^"]+)"[^>]*>Go To Location/i);
        let extractedOvrcUrl = dashboardMatch ? dashboardMatch[1].trim() : null;

        // Determine Context
        clientName = idCustomer || null;
        projectName = idLocation || null;

        // Fallback for context if IDs missing
        if (!clientName) {
            debugTrace += " -> SUBJECT_FALLBACK";
            const subjectRegexes = [
                /at\s+(.+?)(?:\s+-\s+(.+))?$/i,
                /Alert:\s+(.+?)(?:\s+-\s+(.+))?$/i,
                /(?:restored|connected|lost)\s+(?:at\s+)?(.+)/i
            ];
            for (const regex of subjectRegexes) {
                const match = subject.match(regex);
                if (match) {
                    clientName = match[1].trim();
                    projectName = projectName || (match[2] ? match[2].trim() : null);
                    break;
                }
            }
        }

        if (clientName && !projectName && clientName.includes(' - ')) {
            const parts = clientName.split(' - ');
            clientName = parts[0].trim();
            projectName = parts.slice(1).join(' - ').trim();
        }
        if (!clientName) clientName = "Unknown Client";

        debugTrace += " -> DB_QUERY_COMPANY";
        let jobCode = idJobCode || null;
        let companyData = null;
        let contractId = null;
        let ovrcUrl = extractedOvrcUrl; // Current dashboard link

        // RESOLVE VIA JOB CODE (Highest Priority)
        if (jobCode) {
            const { data: contractData } = await supabaseClient
                .from('contracts')
                .select('id, company_id, contract_name, ovrc_url')
                .eq('contract_number', jobCode)
                .maybeSingle();

            if (contractData) {
                contractId = contractData.id;
                ovrcUrl = contractData.ovrc_url || ovrcUrl; // Prefer DB link if available
                projectName = contractData.contract_name || projectName;

                if (contractData.company_id) {
                    const { data: companyRes } = await supabaseClient
                        .from('companies')
                        .select('id, name')
                        .eq('id', contractData.company_id)
                        .maybeSingle();
                    if (companyRes) companyData = companyRes;
                }
            }
        }

        // FALLBACK TO SUBJECT RESOLUTION
        if (!companyData) {
            let orQuery = `name.ilike."${clientName}"`;
            if (clientName.includes(',')) {
                const parts = clientName.split(',').map((p: string) => p.trim());
                if (parts.length === 2) {
                    const reversed = `${parts[1]} ${parts[0]}`;
                    orQuery += `,name.ilike."${reversed}"`;
                }
            }
            const { data: companyRes } = await supabaseClient
                .from('companies')
                .select('id, name')
                .or(orQuery)
                .limit(1)
                .maybeSingle();
            companyData = companyRes;
        }

        if (!companyData) {
            return await logFailure(`Company '${clientName}' not found`, clientName, projectName);
        }
        debugTrace += " -> COMPANY_FOUND";

        // --- PARSE ALERTS (Iterate IDs) ---
        const alerts = [];
        let i = 0;
        while (i < 50) { // Safety limit
            const dName = getById(`deviceName-${i}`);
            if (!dName) break;

            const rId = getById(`eventID-${i}`) || 'unknown';
            const eMsg = getById(`deviceEvent-${i}`) || 'No details';

            alerts.push({ name: dName, refId: rId, event: eMsg });
            i++;
        }

        // Fallback to legacy regex if no devices found via ID
        if (alerts.length === 0) {
            debugTrace += " -> REGEX_FALLBACK";
            const cleanText = htmlContent.replace(/<[^>]+>/g, '|');
            const normalizedText = cleanText.replace(/\|+/g, '|').replace(/\s+/g, ' ');
            const alertRegex = /(?:\||\s)Device Name(?:\||\s)\s*(.*?)\s*(?:\||\s)Reference ID(?:\||\s)\s*(.*?)\s*(?:\||\s)Device Event(?:\||\s)\s*(.*?)\s*(?:\||Notification|&nbsp;|Other limited|Status|$)/gi;
            let pMatch;
            while ((pMatch = alertRegex.exec(normalizedText)) !== null) {
                const dName = pMatch[1].trim().replace(/^\||\|$/g, '').trim();
                const rId = pMatch[2].trim().replace(/^\||\|$/g, '').trim();
                const eMsg = pMatch[3].trim().replace(/^\||\|$/g, '').trim();
                if (dName && dName.length < 100 && !dName.includes('Device Name')) {
                    alerts.push({ name: dName, refId: rId || 'unknown', event: eMsg });
                }
            }
        }

        if (alerts.length === 0) {
            return await logFailure("No devices found in body", clientName, projectName);
        }
        debugTrace += ` -> ALERTS_PARSED(${alerts.length})`;

        debugTrace += " -> DB_UPSERT_DEVICES";
        const results = [];
        for (const alert of alerts) {
            let status = 'Unknown';
            const subj = subject.toLowerCase();
            if (/\b(restored|connected|online|up)\b/i.test(subj)) status = 'Online';
            else if (/\b(lost|disconnected|offline|down)\b/i.test(subj)) status = 'Offline';

            const { data: device, error: saveError } = await supabaseClient
                .from('devices')
                .upsert({
                    company_id: companyData.id,
                    name: alert.name,
                    status: status,
                    last_seen: new Date().toISOString(),
                    project_name: projectName,
                    job_code: jobCode,
                    contract_id: contractId,
                    ovrc_url: ovrcUrl,
                    metadata: { last_ref_id: alert.refId }
                }, { onConflict: 'company_id, name' })
                .select()
                .single();

            if (saveError) throw new Error(`DB_UPSERT_FAIL: ${saveError.message}`);

            await supabaseClient.from('device_events').insert({
                device_id: device.id,
                event_type: status,
                description: alert.event,
                device_name: alert.name,
                company_id: companyData.id,
                contract_id: contractId,
                project_name: projectName,
                job_code: jobCode,
                ovrc_url: ovrcUrl,
                reference_id: alert.refId
            });
            results.push({ device: alert.name, status });
        }
        debugTrace += " -> SUCCESS";

        return new Response(JSON.stringify({ success: true, processed: results, trace: debugTrace }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("CRASH:", error);
        return new Response(JSON.stringify({
            error: error.message,
            trace: debugTrace,
            subject: subject
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
