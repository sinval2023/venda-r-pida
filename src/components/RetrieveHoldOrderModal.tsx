import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Clock, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HoldOrder {
  id: string;
  order_number: number;
  identification: string;
  total: number;
  created_at: string;
  seller_name: string;
  client_name: string | null;
}

interface OrderItem {
  id: string;
  product_id: string | null;
  product_code: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface RetrieveHoldOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetrieve: (orderId: string, items: OrderItem[]) => void;
}

export function RetrieveHoldOrderModal({ open, onOpenChange, onRetrieve }: RetrieveHoldOrderModalProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<HoldOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHoldOrders();
    }
  }, [open]);

  const fetchHoldOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, identification, total, created_at, seller_name, client_name')
      .eq('status', 'em_espera')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as HoldOrder[]);
    }
    setLoading(false);
  };

  const handleRetrieve = async (orderId: string) => {
    setLoading(true);
    
    // Fetch order items
    const { data: items, error } = await supabase
      .from('order_items')
      .select('id, product_id, product_code, product_description, quantity, unit_price, total')
      .eq('order_id', orderId);

    if (error) {
      toast({
        title: "Erro ao recuperar pedido",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'em_andamento' })
      .eq('id', orderId);

    toast({ title: "Pedido recuperado com sucesso!" });
    onRetrieve(orderId, items as OrderItem[]);
    onOpenChange(false);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-xl font-bold text-white">
              Pedidos em Espera
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-4">
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="font-bold text-lg">{order.identification}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Pedido #{order.order_number}</div>
                      <div>Vendedor: {order.seller_name}</div>
                      {order.client_name && <div>Cliente: {order.client_name}</div>}
                      <div>{formatDate(order.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">
                      {formatCurrency(order.total)}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRetrieve(order.id)}
                      disabled={loading}
                      className="mt-2 gap-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Package className="h-4 w-4" />
                      Resgatar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pedido em espera
              </div>
            )}
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}