export interface WhatsAppMessage {
    id: string;
    message_uuid: string;
    contact_id: number | null;
    sender_phone: string;
    receiver_phone: string;
    content: string;
    direction: 'inbound' | 'outbound';
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'draft';
    created_at: string;
}

export interface WhatsAppContact {
    contact_id: number;
    name: string;
    avatar_url?: string; // or jsonb logic
    last_message: string;
    last_message_at: string;
    unread_count: number;
    phone_number: string;
}

export interface OnCallEngineer {
    id: string;
    name: string;
    phone_number: string;
    is_active: boolean;
}
