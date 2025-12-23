-- Create printer settings table for thermal printer configuration
CREATE TABLE public.printer_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  printer_name text DEFAULT 'Impressora Térmica',
  paper_width integer DEFAULT 80,
  font_size integer DEFAULT 12,
  show_logo boolean DEFAULT false,
  logo_url text,
  company_name text,
  company_address text,
  company_phone text,
  footer_message text DEFAULT 'Obrigado pela preferência!',
  auto_print boolean DEFAULT false,
  copies integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.printer_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own printer settings" 
ON public.printer_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own printer settings" 
ON public.printer_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own printer settings" 
ON public.printer_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own printer settings" 
ON public.printer_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_printer_settings_updated_at
BEFORE UPDATE ON public.printer_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();