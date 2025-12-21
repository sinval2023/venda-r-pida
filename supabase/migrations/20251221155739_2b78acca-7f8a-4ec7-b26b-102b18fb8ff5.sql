-- Adicionar novos campos à tabela clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS phone2 text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zipcode text;

-- Adicionar campos status e identification à tabela orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS status text DEFAULT 'finalizado',
ADD COLUMN IF NOT EXISTS identification text;

-- Criar índice para buscar pedidos em espera
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Adicionar coluna de senha de autorização na tabela de configurações (usando sellers como referência)
-- Vamos usar a tabela sellers para armazenar uma senha padrão de autorização