import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Package, MessageSquare, Eye, EyeOff, Calendar, User, DollarSign } from 'lucide-react';

interface OrderItem {
  id: string;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total: number;
  observations: string | null;
}

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: number;
  orderDate: string;
  sellerName: string;
  clientName: string | null;
  orderTotal: number;
}

export function OrderDetailsModal({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  orderDate,
  sellerName,
  clientName,
  orderTotal,
}: OrderDetailsModalProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showObservations, setShowObservations] = useState(true);

  useEffect(() => {
    if (open && orderId) {
      fetchOrderItems();
    }
  }, [open, orderId]);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('id, product_code, product_description, quantity, unit_price, total, observations')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasAnyObservation = items.some(item => item.observations);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5 text-primary" />
            Pedido #{orderNumber.toString().padStart(6, '0')}
          </DialogTitle>
        </DialogHeader>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">{formatDate(orderDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vendedor:</span>
            <span className="font-medium">{sellerName}</span>
          </div>
          {clientName && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{clientName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm col-span-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-primary">{formatCurrency(orderTotal)}</span>
          </div>
        </div>

        {/* Toggle Observations Button */}
        {hasAnyObservation && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowObservations(!showObservations)}
              className="gap-2"
            >
              {showObservations ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ocultar Observações
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Mostrar Observações
                </>
              )}
            </Button>
          </div>
        )}

        {/* Items List */}
        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando itens...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-card border border-border rounded-lg animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primary">{item.product_code}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.product_description}</p>
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground">{item.quantity} × </span>
                        <span>{formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(item.total)}</p>
                    </div>
                  </div>

                  {/* Item Observation */}
                  {showObservations && item.observations && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">{item.observations}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
