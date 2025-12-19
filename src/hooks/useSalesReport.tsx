import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrderReport {
  id: string;
  order_number: number;
  seller_name: string;
  client_name: string | null;
  total: number;
  created_at: string;
}

export interface SellerRanking {
  seller_name: string;
  total_sales: number;
  order_count: number;
}

export interface ProductRanking {
  product_code: string;
  product_description: string;
  total_quantity: number;
  total_value: number;
}

export function useSalesReport() {
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [sellerRanking, setSellerRanking] = useState<SellerRanking[]>([]);
  const [productRanking, setProductRanking] = useState<ProductRanking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      // Adjust end date to include the full day
      const endDateAdjusted = new Date(endDate);
      endDateAdjusted.setHours(23, 59, 59, 999);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, seller_name, client_name, total, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDateAdjusted.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Calculate seller ranking
      const sellerMap = new Map<string, { total: number; count: number }>();
      (ordersData || []).forEach(order => {
        const current = sellerMap.get(order.seller_name) || { total: 0, count: 0 };
        sellerMap.set(order.seller_name, {
          total: current.total + Number(order.total),
          count: current.count + 1
        });
      });

      const sellerRankingData: SellerRanking[] = Array.from(sellerMap.entries())
        .map(([seller_name, data]) => ({
          seller_name,
          total_sales: data.total,
          order_count: data.count
        }))
        .sort((a, b) => b.total_sales - a.total_sales);

      setSellerRanking(sellerRankingData);

      // Fetch order items for product ranking
      const orderIds = (ordersData || []).map(o => o.id);
      
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('product_code, product_description, quantity, total')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Calculate product ranking
        const productMap = new Map<string, { description: string; quantity: number; value: number }>();
        (itemsData || []).forEach(item => {
          const current = productMap.get(item.product_code) || { 
            description: item.product_description, 
            quantity: 0, 
            value: 0 
          };
          productMap.set(item.product_code, {
            description: item.product_description,
            quantity: current.quantity + item.quantity,
            value: current.value + Number(item.total)
          });
        });

        const productRankingData: ProductRanking[] = Array.from(productMap.entries())
          .map(([code, data]) => ({
            product_code: code,
            product_description: data.description,
            total_quantity: data.quantity,
            total_value: data.value
          }))
          .sort((a, b) => b.total_value - a.total_value);

        setProductRanking(productRankingData);
      } else {
        setProductRanking([]);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSales = () => {
    return orders.reduce((sum, order) => sum + Number(order.total), 0);
  };

  return {
    orders,
    sellerRanking,
    productRanking,
    loading,
    fetchReport,
    getTotalSales
  };
}
