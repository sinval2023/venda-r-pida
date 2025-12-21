-- Allow admins to view all sellers (including inactive)
DROP POLICY IF EXISTS "Admins can view all sellers" ON public.sellers;
CREATE POLICY "Admins can view all sellers"
ON public.sellers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
