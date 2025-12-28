-- Add api_url column to printer_settings to store user's preferred API URL
ALTER TABLE public.printer_settings 
ADD COLUMN api_url text DEFAULT NULL;