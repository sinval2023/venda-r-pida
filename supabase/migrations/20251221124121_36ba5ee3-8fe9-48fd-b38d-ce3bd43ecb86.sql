-- Add new columns to sellers table for complete seller profile
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS password text,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS api_key text,
ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0;

-- Update RLS policies to allow public CRUD for sellers (same as products/categories)
DROP POLICY IF EXISTS "Authenticated users can view active sellers" ON public.sellers;
DROP POLICY IF EXISTS "Admins can manage sellers" ON public.sellers;

CREATE POLICY "Public can view active sellers" ON public.sellers
FOR SELECT USING (active = true);

CREATE POLICY "Public can insert sellers" ON public.sellers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update sellers" ON public.sellers
FOR UPDATE USING (true);

CREATE POLICY "Public can delete sellers" ON public.sellers
FOR DELETE USING (true);