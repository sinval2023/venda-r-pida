import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/hooks/useClients';

interface Order {
  id: string;
  order_number: number;
  total: number;
  created_at: string;
  seller_name: string;
  observations: string | null;
  status: string | null;
}

interface OrderItem {
  id: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total: number;
  observations: string | null;
}

interface ClientOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

const getFormattedDate = (date: Date) => format(date, 'yyyy-MM-dd');

export function ClientOrdersModal({ open, onOpenChange, client }: ClientOrdersModalProps) {
  const today = getFormattedDate(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('hoje');

  const applyQuickFilter = (filter: string) => {
    const now = new Date();
    setActiveFilter(filter);
    
    switch (filter) {
      case 'hoje':
        setStartDate(getFormattedDate(now));
        setEndDate(getFormattedDate(now));
        break;
      case '15':
        setStartDate(getFormattedDate(subDays(now, 15)));
        setEndDate(getFormattedDate(now));
        break;
      case '30':
        setStartDate(getFormattedDate(subDays(now, 30)));
        setEndDate(getFormattedDate(now));
        break;
      case '90':
        setStartDate(getFormattedDate(subDays(now, 90)));
        setEndDate(getFormattedDate(now));
        break;
      case '180':
        setStartDate(getFormattedDate(subDays(now, 180)));
        setEndDate(getFormattedDate(now));
        break;
      case 'geral':
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  const fetchOrders = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('id, order_number, total, created_at, seller_name, observations, status')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching client orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
      return;
    }

    setLoadingItems(orderId);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('id, product_code, product_description, quantity, unit_price, total, observations')
        .eq('order_id', orderId);

      if (error) throw error;
      
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
      setExpandedOrderId(orderId);
    } catch (err) {
      console.error('Error fetching order items:', err);
    } finally {
      setLoadingItems(null);
    }
  };

  useEffect(() => {
    if (open && client) {
      fetchOrders();
    }
  }, [open, client]);

  useEffect(() => {
    if (open && client) {
      fetchOrders();
    }
  }, [startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'em_espera': return 'Em Espera';
      case 'finalizado': return 'Finalizado';
      default: return 'Finalizado';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'em_espera': return 'bg-amber-100 text-amber-800';
      case 'finalizado': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedidos de {client?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 border-b pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyQuickFilter('hoje')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                activeFilter === 'hoje'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-background border-border hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => applyQuickFilter('15')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                activeFilter === '15'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-background border-border hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
              }`}
            >
              Últimos 15 dias
            </button>
            <button
              onClick={() => applyQuickFilter('30')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                activeFilter === '30'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-background border-border hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => applyQuickFilter('90')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                activeFilter === '90'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-background border-border hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
              }`}
            >
              Últimos 90 dias
            </button>
            <button
              onClick={() => applyQuickFilter('180')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                activeFilter === '180'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-background border-border hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
              }`}
            >
              Últimos 180 dias
            </button>
            <button
              onClick={() => applyQuickFilter('geral')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                activeFilter === 'geral'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-background border-border hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
              }`}
            >
              Geral
            </button>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                Data Inicial
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveFilter('');
                  }}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                Data Final
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveFilter('');
                  }}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Carregando pedidos...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum pedido encontrado</p>
              {(startDate || endDate) && (
                <p className="text-xs mt-1">Tente ajustar os filtros de data</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => fetchOrderItems(order.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">Pedido</span>
                        <p className="font-bold">#{order.order_number}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Data</span>
                        <p className="font-medium">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Total</span>
                        <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Status</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2">
                      {loadingItems === order.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : expandedOrderId === order.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {expandedOrderId === order.id && orderItems[order.id] && (
                    <div className="border-t bg-muted/30 p-3">
                      {order.observations && (
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          Obs: {order.observations}
                        </p>
                      )}
                      <div className="space-y-2">
                        {orderItems[order.id].map((item) => (
                          <div key={item.id} className="flex items-start justify-between text-sm bg-background rounded p-2">
                            <div className="flex-1">
                              <p className="font-medium">
                                <span className="text-muted-foreground">{item.product_code}</span> - {item.product_description}
                              </p>
                              {item.observations && (
                                <p className="text-xs text-amber-600 mt-0.5">📝 {item.observations}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-muted-foreground">
                                {item.quantity}x {formatCurrency(item.unit_price)}
                              </p>
                              <p className="font-bold">{formatCurrency(item.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Vendedor: {order.seller_name}</span>
                        <span className="font-bold">Total: {formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="pt-4 border-t flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {orders.length} pedido(s) encontrado(s)
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
