import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, Order, Product } from '@/types/order';
import { useAuth } from './useAuth';

interface FinalizeOrderParams {
  sellerId?: string;
  sellerName?: string;
  clientId?: string;
  clientName?: string;
  observations?: string;
}

export function useOrder() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const { user } = useAuth();

  const addItem = (product: Product, quantity: number, unitPrice: number, observation?: string) => {
    // Se o mesmo produto for adicionado com preços diferentes,
    // criamos linhas separadas no pedido (evita "grudar" no último preço editado).
    const priceCents = Math.round(unitPrice * 100);

    // Se tiver observação, sempre cria uma nova linha
    if (observation) {
      const newItem: OrderItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        code: product.code,
        description: product.description,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
        observations: observation,
      };
      setItems([...items, newItem]);
      return;
    }

    const existingIndex = items.findIndex(
      (item) =>
        item.productId === product.id && Math.round(item.unitPrice * 100) === priceCents && !item.observations
    );

    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
      updatedItems[existingIndex].total =
        updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
      setItems(updatedItems);
      return;
    }

    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      code: product.code,
      description: product.description,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };

    setItems([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity, total: quantity * item.unitPrice };
      }
      return item;
    }));
  };

  const updateItemObservation = (itemId: string, observation: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, observations: observation || undefined };
      }
      return item;
    }));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const clearOrder = () => {
    setItems([]);
  };

  const finalizeOrder = async (params?: FinalizeOrderParams): Promise<Order | null> => {
    if (items.length === 0 || !user) return null;

    const { data: nextNumber, error } = await supabase.rpc('get_next_order_number');
    
    if (error || !nextNumber) {
      console.error('Error getting order number:', error);
      return null;
    }

    const orderTotal = getTotal();
    const sellerName = params?.sellerName || user.user_metadata?.full_name || user.email || 'Vendedor';

    // Save order to database
    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: nextNumber,
        seller_id: params?.sellerId || null,
        seller_name: sellerName,
        client_id: params?.clientId || null,
        client_name: params?.clientName || null,
        user_id: user.id,
        total: orderTotal,
        observations: params?.observations || null
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error saving order:', orderError);
    } else if (savedOrder) {
      // Save order items
      const orderItems = items.map(item => ({
        order_id: savedOrder.id,
        product_id: item.productId,
        product_code: item.code,
        product_description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        observations: item.observations || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error saving order items:', itemsError);
      }
    }

    const order: Order = {
      number: nextNumber,
      date: new Date().toISOString(),
      vendorId: user.id,
      vendorName: sellerName,
      items: [...items],
      total: orderTotal,
    };

    return order;
  };

  const setOrderItems = (newItems: OrderItem[]) => {
    setItems(newItems);
  };

  return {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemObservation,
    getTotal,
    clearOrder,
    finalizeOrder,
    setOrderItems,
  };
}
