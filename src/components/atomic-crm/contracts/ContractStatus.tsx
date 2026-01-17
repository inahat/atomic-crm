
import { useRecordContext } from "ra-core";

export const ContractStatus = ({ source }: { source: string }) => {
    const record = useRecordContext();
    if (!record || !source) return null;
    const status = record[source];

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide 
            ${status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
            ${status === 'Proposed' ? 'bg-blue-100 text-blue-800' : ''}
            ${status === 'Proposed-Sent' ? 'bg-indigo-100 text-indigo-800' : ''}
            ${status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
            ${['Open-Unbilled', 'OPEN-UNBILLED'].includes(status) ? 'bg-yellow-100 text-yellow-800' : ''}
            ${['Open-Billed', 'OPEN-BILLED'].includes(status) ? 'bg-orange-100 text-orange-800' : ''}
            ${status === 'VIP' ? 'bg-pink-100 text-pink-800' : ''}
            ${!['Approved', 'Rejected', 'Open-Unbilled', 'OPEN-UNBILLED', 'Open-Billed', 'OPEN-BILLED', 'Proposed', 'Proposed-Sent', 'VIP'].includes(status) ? 'bg-gray-100 text-gray-800' : ''}
        `}>
            {status}
        </span>
    );
};
