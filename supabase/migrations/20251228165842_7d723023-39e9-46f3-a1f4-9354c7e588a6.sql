-- Add show_on_card column to products table with default false
ALTER TABLE public.products 
ADD COLUMN show_on_card boolean NOT NULL DEFAULT false;