import { useState } from 'react';
import { History, FileCode, FileText, Server, Calendar, DollarSign, Eye } from 'lucide-react';
import { FTPHistoryEntry } from '@/hooks/useFTPHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { OrderDetailsModal } from './OrderDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FTPHistoryListProps {
  history: FTPHistoryEntry[];
  loading: boolean;
}

interface OrderData {
  id: string;
  order_number: number;
  created_at: string;
  seller_name: string;
  client_name: string | null;
  total: number;
}

export function FTPHistoryList({ history, loading }: FTPHistoryListProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const handleOrderClick = async (orderNumber: number) => {
    setLoadingOrder(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, created_at, seller_name, client_name, total')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSelectedOrder(data);
        setShowDetailsModal(true);
      } else {
        toast({
          title: 'Pedido não encontrado',
          description: `O pedido #${orderNumber} não foi localizado no banco de dados.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      toast({
        title: 'Erro ao buscar pedido',
        description: 'Ocorreu um erro ao buscar os detalhes do pedido.',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground text-lg">
        Carregando histórico...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-lg flex flex-col items-center gap-3">
        <History className="h-8 w-8 opacity-50" />
        Nenhum envio FTP registrado
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-base font-medium text-muted-foreground">
          <History className="h-5 w-5" />
          Últimos envios FTP ({history.length})
        </div>
        <ScrollArea className="h-[280px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-3">
            {history.map((entry) => (
              <Card
                key={entry.id}
                onClick={() => handleOrderClick(entry.order_number)}
                className="p-3 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/30 border-border/50 cursor-pointer group"
              >
                {/* Order Number - Highlighted */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {entry.file_format === 'xml' ? (
                      <FileCode className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-lg font-bold text-primary">
                      #{entry.order_number.toString().padStart(6, '0')}
                    </span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(entry.created_at)}</span>
                </div>

                {/* FTP Server */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 truncate">
                  <Server className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{entry.ftp_host}{entry.ftp_folder}</span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-sm">Total</span>
                  </div>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(entry.order_total)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.order_number}
          orderDate={selectedOrder.created_at}
          sellerName={selectedOrder.seller_name}
          clientName={selectedOrder.client_name}
          orderTotal={selectedOrder.total}
        />
      )}
    </>
  );
}
