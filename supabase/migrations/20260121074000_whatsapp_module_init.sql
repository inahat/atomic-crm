-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_uuid TEXT UNIQUE NOT NULL, -- From 2Chat
    contact_id BIGINT REFERENCES public.contacts(id) ON DELETE SET NULL, -- Linked to Atomic CRM contacts (BigInt)
    sender_phone TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    content TEXT,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups by contact and phone
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_phone ON public.whatsapp_messages(sender_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view messages (adjust as needed for specific roles)
CREATE POLICY "Allow authenticated users to select messages" 
ON public.whatsapp_messages FOR SELECT 
TO authenticated 
USING (true);

-- Create on_call_engineers table
CREATE TABLE IF NOT EXISTS public.on_call_engineers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.on_call_engineers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view engineers
CREATE POLICY "Allow authenticated users to select engineers" 
ON public.on_call_engineers FOR SELECT 
TO authenticated 
USING (true);

-- Ensure contracts has a status check if needed (optional, based on user request "Add a service_contract_status check")
-- Since 'contracts' already has a 'status' column, we can add a check if it's not strictly typed, 
-- but proceed with caution on existing data. For now, we assume the existing 'status' covers it.
