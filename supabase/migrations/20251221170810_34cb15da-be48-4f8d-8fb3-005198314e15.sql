-- Drop the existing restrictive admin-only policy for ALL operations
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;

-- Create policies for authenticated users to insert and update clients
CREATE POLICY "Authenticated users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (true);

-- Keep delete only for admins
CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));