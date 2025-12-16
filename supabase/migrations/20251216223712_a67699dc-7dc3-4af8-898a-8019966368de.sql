-- Create table for FTP upload history
CREATE TABLE public.ftp_upload_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number INTEGER NOT NULL,
  filename TEXT NOT NULL,
  ftp_host TEXT NOT NULL,
  ftp_folder TEXT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'xml',
  order_total NUMERIC NOT NULL DEFAULT 0,
  items_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ftp_upload_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own upload history
CREATE POLICY "Users can view own upload history"
ON public.ftp_upload_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own upload history
CREATE POLICY "Users can insert own upload history"
ON public.ftp_upload_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_ftp_upload_history_user_id ON public.ftp_upload_history(user_id);
CREATE INDEX idx_ftp_upload_history_created_at ON public.ftp_upload_history(created_at DESC);