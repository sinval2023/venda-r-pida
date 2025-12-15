import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, Order, Product } from '@/types/order';
import { useAuth } from './useAuth';

export function useOrder() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const { user } = useAuth();

  const addItem = (product: Product, quantity: number, unitPrice: number) => {
    const existingIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += quantity;
      updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
      setItems(updatedItems);
    } else {
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
    }
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

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const clearOrder = () => {
    setItems([]);
  };

  const finalizeOrder = async (): Promise<Order | null> => {
    if (items.length === 0 || !user) return null;

    const { data: nextNumber, error } = await supabase.rpc('get_next_order_number');
    
    if (error || !nextNumber) {
      console.error('Error getting order number:', error);
      return null;
    }

    const order: Order = {
      number: nextNumber,
      date: new Date().toISOString(),
      vendorId: user.id,
      vendorName: user.user_metadata?.full_name || user.email || 'Vendedor',
      items: [...items],
      total: getTotal(),
    };

    return order;
  };

  return {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    getTotal,
    clearOrder,
    finalizeOrder,
  };
}
