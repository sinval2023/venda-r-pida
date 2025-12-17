-- Create table for storing FTP credentials per user
CREATE TABLE public.ftp_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ftp_host TEXT NOT NULL DEFAULT '177.234.159.174',
  ftp_user TEXT NOT NULL DEFAULT 'gsn',
  ftp_password TEXT,
  ftp_port INTEGER NOT NULL DEFAULT 21,
  ftp_folder TEXT NOT NULL DEFAULT '/XML',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ftp_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credentials
CREATE POLICY "Users can view own FTP credentials"
ON public.ftp_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert own FTP credentials"
ON public.ftp_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update own FTP credentials"
ON public.ftp_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete own FTP credentials"
ON public.ftp_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ftp_credentials_updated_at
BEFORE UPDATE ON public.ftp_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();