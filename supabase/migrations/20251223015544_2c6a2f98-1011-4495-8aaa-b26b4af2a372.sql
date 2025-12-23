-- Add receipt_template column to printer_settings table
ALTER TABLE public.printer_settings 
ADD COLUMN receipt_template text DEFAULT 'classic';

COMMENT ON COLUMN public.printer_settings.receipt_template IS 'Template style for receipt: classic, modern, minimal, detailed';