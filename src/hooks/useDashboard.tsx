import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  sellerId?: string;
  productCode?: string;
}

export interface SalesOverTime {
  date: string;
  total: number;
  orderCount: number;
}

export interface SellerPerformance {
  seller_name: string;
  total_sales: number;
  order_count: number;
  average_ticket: number;
}

export interface ProductPerformance {
  product_code: string;
  product_description: string;
  total_quantity: number;
  total_value: number;
}

export interface DashboardSummary {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  totalProducts: number;
  totalSellers: number;
}

export function useDashboard() {
  const [salesOverTime, setSalesOverTime] = useState<SalesOverTime[]>([]);
  const [sellerPerformance, setSellerPerformance] = useState<SellerPerformance[]>([]);
  const [topProductsByValue, setTopProductsByValue] = useState<ProductPerformance[]>([]);
  const [topProductsByQuantity, setTopProductsByQuantity] = useState<ProductPerformance[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    totalProducts: 0,
    totalSellers: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async (filters: DashboardFilters) => {
    setLoading(true);
    try {
      const startDateAdjusted = new Date(filters.startDate + 'T00:00:00');
      const endDateAdjusted = new Date(filters.endDate + 'T23:59:59.999');

      // Build orders query
      let ordersQuery = supabase
        .from('orders')
        .select('id, order_number, seller_name, seller_id, total, created_at')
        .gte('created_at', startDateAdjusted.toISOString())
        .lte('created_at', endDateAdjusted.toISOString());

      if (filters.sellerId) {
        ordersQuery = ordersQuery.eq('seller_id', filters.sellerId);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery.order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      const orders = ordersData || [];
      const orderIds = orders.map(o => o.id);

      // Fetch order items
      let itemsData: any[] = [];
      if (orderIds.length > 0) {
        let itemsQuery = supabase
          .from('order_items')
          .select('product_code, product_description, quantity, total, order_id')
          .in('order_id', orderIds);

        if (filters.productCode) {
          itemsQuery = itemsQuery.eq('product_code', filters.productCode);
        }

        const { data, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;
        itemsData = data || [];
      }

      // Filter orders if product filter is applied
      let filteredOrders = orders;
      if (filters.productCode && itemsData.length > 0) {
        const orderIdsWithProduct = [...new Set(itemsData.map(item => item.order_id))];
        filteredOrders = orders.filter(o => orderIdsWithProduct.includes(o.id));
      }

      // Calculate sales over time (grouped by day)
      const salesByDate = new Map<string, { total: number; count: number }>();
      filteredOrders.forEach(order => {
        const date = order.created_at.split('T')[0];
        const current = salesByDate.get(date) || { total: 0, count: 0 };
        salesByDate.set(date, {
          total: current.total + Number(order.total),
          count: current.count + 1
        });
      });

      const salesTimeData: SalesOverTime[] = Array.from(salesByDate.entries())
        .map(([date, data]) => ({
          date,
          total: data.total,
          orderCount: data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setSalesOverTime(salesTimeData);

      // Calculate seller performance
      const sellerMap = new Map<string, { total: number; count: number }>();
      filteredOrders.forEach(order => {
        const current = sellerMap.get(order.seller_name) || { total: 0, count: 0 };
        sellerMap.set(order.seller_name, {
          total: current.total + Number(order.total),
          count: current.count + 1
        });
      });

      const sellerData: SellerPerformance[] = Array.from(sellerMap.entries())
        .map(([seller_name, data]) => ({
          seller_name,
          total_sales: data.total,
          order_count: data.count,
          average_ticket: data.count > 0 ? data.total / data.count : 0
        }))
        .sort((a, b) => b.total_sales - a.total_sales);

      setSellerPerformance(sellerData);

      // Calculate product performance
      const productMap = new Map<string, { description: string; quantity: number; value: number }>();
      itemsData.forEach(item => {
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

      const productData: ProductPerformance[] = Array.from(productMap.entries())
        .map(([code, data]) => ({
          product_code: code,
          product_description: data.description,
          total_quantity: data.quantity,
          total_value: data.value
        }));

      setTopProductsByValue([...productData].sort((a, b) => b.total_value - a.total_value).slice(0, 10));
      setTopProductsByQuantity([...productData].sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10));

      // Calculate summary
      const totalSales = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = filteredOrders.length;
      const uniqueSellers = new Set(filteredOrders.map(o => o.seller_name)).size;
      const uniqueProducts = productMap.size;

      setSummary({
        totalSales,
        totalOrders,
        averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
        totalProducts: uniqueProducts,
        totalSellers: uniqueSellers
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    salesOverTime,
    sellerPerformance,
    topProductsByValue,
    topProductsByQuantity,
    summary,
    loading,
    fetchDashboardData
  };
}
