-- Fix WhatsApp Messages RLS Policy
-- The current policy might be too restrictive or there might be missing policies

-- Drop existing policy
DROP POLICY IF EXISTS "Allow authenticated users to select messages" ON public.whatsapp_messages;

-- Create comprehensive RLS policies for whatsapp_messages

-- SELECT policy: Allow all authenticated users to read all messages
CREATE POLICY "whatsapp_messages_select_policy"
ON public.whatsapp_messages
FOR SELECT
TO authenticated
USING (true);

-- INSERT policy: Allow all authenticated users to insert messages
CREATE POLICY "whatsapp_messages_insert_policy"
ON public.whatsapp_messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE policy: Allow all authenticated users to update messages
CREATE POLICY "whatsapp_messages_update_policy"
ON public.whatsapp_messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE policy: Allow all authenticated users to delete messages
CREATE POLICY "whatsapp_messages_delete_policy"
ON public.whatsapp_messages
FOR DELETE
TO authenticated
USING (true);

-- Also ensure anon role can read (for public access if needed)
CREATE POLICY "whatsapp_messages_anon_select_policy"
ON public.whatsapp_messages
FOR SELECT
TO anon
USING (true);
