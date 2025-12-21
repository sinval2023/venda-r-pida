-- Create client sequence table
CREATE TABLE IF NOT EXISTS public.client_sequence (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0
);

-- Insert initial value if not exists
INSERT INTO public.client_sequence (id, last_number) 
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.client_sequence ENABLE ROW LEVEL SECURITY;

-- Create policies for client_sequence
CREATE POLICY "Authenticated users can read client sequence" 
ON public.client_sequence 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can update client sequence" 
ON public.client_sequence 
FOR UPDATE 
USING (true);

-- Create function to get next client code
CREATE OR REPLACE FUNCTION public.get_next_client_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  UPDATE public.client_sequence
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO next_number;
  
  RETURN LPAD(next_number::text, 6, '0');
END;
$$;