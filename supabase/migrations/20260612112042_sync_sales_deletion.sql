-- Sync sales deletion with auth.users and allow admins to delete standard users (but not themselves)

-- 1. Create function to delete auth.users when a sales record is deleted
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = old.user_id;
  RETURN old;
END;
$$;

-- 2. Create the trigger on public.sales
DROP TRIGGER IF EXISTS on_sale_deleted ON public.sales;
CREATE TRIGGER on_sale_deleted
  AFTER DELETE ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.handle_deleted_user();

-- 3. Create RLS delete policy for public.sales
DROP POLICY IF EXISTS "Admins can delete standard users" ON public.sales;
CREATE POLICY "Admins can delete standard users"
ON public.sales
FOR DELETE
TO authenticated
USING (
  -- The current user must be an administrator
  EXISTS (
    SELECT 1 FROM public.sales
    WHERE user_id = auth.uid()
    AND administrator = true
  )
  -- The user being deleted cannot be the current user
  AND user_id != auth.uid()
);
