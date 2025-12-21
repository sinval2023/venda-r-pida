-- Add code and image_url columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS image_url text;

-- Update products table policies to allow public access (matching the modal's free access design)
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "All authenticated users can view active products" ON public.products;

-- Allow public SELECT on active products
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (active = true);

-- Allow public INSERT on products
CREATE POLICY "Public can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

-- Allow public UPDATE on products
CREATE POLICY "Public can update products" 
ON public.products 
FOR UPDATE 
USING (true);

-- Allow public DELETE on products
CREATE POLICY "Public can delete products" 
ON public.products 
FOR DELETE 
USING (true);

-- Update categories table policies to allow public access
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "All authenticated users can view active categories" ON public.categories;

-- Allow public SELECT on active categories
CREATE POLICY "Public can view active categories" 
ON public.categories 
FOR SELECT 
USING (active = true);

-- Allow public INSERT on categories
CREATE POLICY "Public can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

-- Allow public UPDATE on categories
CREATE POLICY "Public can update categories" 
ON public.categories 
FOR UPDATE 
USING (true);

-- Allow public DELETE on categories
CREATE POLICY "Public can delete categories" 
ON public.categories 
FOR DELETE 
USING (true);