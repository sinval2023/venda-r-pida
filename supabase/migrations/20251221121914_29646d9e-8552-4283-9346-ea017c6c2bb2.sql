-- Update storage policies to allow public upload/modify for product images
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Allow anyone to upload product images
CREATE POLICY "Anyone can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to update product images
CREATE POLICY "Anyone can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images');

-- Allow anyone to delete product images
CREATE POLICY "Anyone can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images');

-- Also update product_images table policies to allow public access
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated select" ON public.product_images;

-- Allow public access to product_images table
CREATE POLICY "Allow public select" 
ON public.product_images 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert" 
ON public.product_images 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON public.product_images 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete" 
ON public.product_images 
FOR DELETE 
USING (true);