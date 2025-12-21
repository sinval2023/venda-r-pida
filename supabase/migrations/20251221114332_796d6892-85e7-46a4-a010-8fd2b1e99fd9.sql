-- Adicionar coluna de código de barras na tabela de produtos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS barcode text;