-- Allow authenticated users to delete network events
-- First drop to ensure we update any existing definition
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.device_events;

CREATE POLICY "Authenticated users can delete events" 
ON public.device_events 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE user_id = auth.uid() 
    AND administrator = true
  )
);
