-- Create product_images table for multiple images per product
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view product images
CREATE POLICY "All authenticated users can view product images"
ON public.product_images
FOR SELECT
USING (true);

-- Admins can manage product images
CREATE POLICY "Admins can manage product images"
ON public.product_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);