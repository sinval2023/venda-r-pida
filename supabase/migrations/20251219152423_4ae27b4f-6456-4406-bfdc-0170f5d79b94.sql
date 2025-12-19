-- Create orders table to store completed orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number INTEGER NOT NULL,
  seller_id UUID REFERENCES public.sellers(id),
  seller_name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT,
  user_id UUID NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table to store individual items per order
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_code TEXT NOT NULL,
  product_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders - authenticated users can view all orders for reporting
CREATE POLICY "Authenticated users can view all orders"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for order_items - authenticated users can view all order items
CREATE POLICY "Authenticated users can view all order items"
ON public.order_items
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);