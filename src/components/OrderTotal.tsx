import { useState, useEffect } from 'react';
import { ClipboardCheck, Send, XCircle, MessageCircle, Pause, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OrderItem } from '@/types/order';
import { HoldOrderModal } from './HoldOrderModal';
import { RetrieveHoldOrderModal } from './RetrieveHoldOrderModal';

interface OrderTotalProps {
  total: number;
  itemCount: number;
  onReview: () => void;
  onFinalize: () => void;
  onCancelOrder: () => void;
  onHoldOrder?: (identification: string) => void;
  onRetrieveOrder?: (orderId: string, items: any[], orderData?: any) => void;
  disabled: boolean;
  items?: OrderItem[];
  productCount?: number;
}

export function OrderTotal({ total, itemCount, productCount, onReview, onFinalize, onCancelOrder, onHoldOrder, onRetrieveOrder, disabled, items = [] }: OrderTotalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [holdOrderCount, setHoldOrderCount] = useState(0);

  // Fetch hold orders count
  const fetchHoldOrderCount = async () => {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'em_espera');
    
    if (!error && count !== null) {
      setHoldOrderCount(count);
    }
  };

  useEffect(() => {
    fetchHoldOrderCount();
    
    // Subscribe to orders changes to update count
    const channel = supabase
      .channel('orders-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchHoldOrderCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleCancelConfirm = () => {
    onCancelOrder();
    setShowCancelConfirm(false);
  };

  const handleSendWhatsApp = () => {
    if (items.length === 0) return;

    // Build order text
    let orderText = "📋 *PEDIDO - ESPAÇO GARDEM*\n\n";
    orderText += "━━━━━━━━━━━━━━━━━━━━\n";
    
    items.forEach((item, index) => {
      orderText += `${index + 1}. *${item.code}* - ${item.description}\n`;
      orderText += `   Qtd: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}\n\n`;
    });
    
    orderText += "━━━━━━━━━━━━━━━━━━━━\n";
    orderText += `*TOTAL: ${formatCurrency(total)}*\n\n`;
    orderText += "Segue pedido dos itens digitados emitido por: ESPAÇO GARDEM, agradecemos pela preferência.";

    // WhatsApp phone number (remove non-digits)
    const phoneNumber = "5511947791957";
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(orderText);
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40">
        <div className="container mx-auto px-2 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-primary">
                  {itemCount}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {itemCount === 1 ? 'item' : 'itens'}
                </div>
              </div>
              {productCount !== undefined && (
                <>
                  <div className="h-6 sm:h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-muted-foreground">
                      {productCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {productCount === 1 ? 'produto' : 'produtos'}
                    </div>
                  </div>
                </>
              )}
              <div className="h-6 sm:h-8 w-px bg-border" />
              <div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">Total</div>
                <div className="text-lg sm:text-xl font-extrabold text-foreground">
                  {formatCurrency(total)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 sm:gap-2">
              <Button
                onClick={() => setShowCancelConfirm(true)}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="font-bold text-xs sm:text-sm px-2 sm:px-3 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-700 transition-all duration-200"
              >
                <XCircle className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">CANCELA</span>
              </Button>
              <Button
                onClick={() => setShowHoldModal(true)}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="font-bold text-xs sm:text-sm px-2 sm:px-3 border-amber-300 text-amber-600 hover:bg-amber-100 hover:border-amber-400 hover:text-amber-700 transition-all duration-200 relative"
              >
                <Pause className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">ESPERA</span>
                {holdOrderCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {holdOrderCount}
                  </span>
                )}
              </Button>
              <Button
                onClick={() => setShowRetrieveModal(true)}
                disabled={total > 0}
                size="sm"
                variant="outline"
                className="font-bold text-xs sm:text-sm px-2 sm:px-3 border-cyan-300 text-cyan-600 hover:bg-cyan-100 hover:border-cyan-400 hover:text-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">RESGATA</span>
              </Button>
              <Button
                onClick={onReview}
                disabled={disabled}
                size="sm"
                className="font-bold text-xs sm:text-sm px-2 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <ClipboardCheck className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">CONFERE</span>
              </Button>
              <Button
                onClick={onFinalize}
                disabled={disabled}
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">FINALIZAR</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar todo o pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">NÃO</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelConfirm}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              SIM
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HoldOrderModal
        open={showHoldModal}
        onOpenChange={setShowHoldModal}
        onConfirm={(identification) => onHoldOrder?.(identification)}
      />

      <RetrieveHoldOrderModal
        open={showRetrieveModal}
        onOpenChange={setShowRetrieveModal}
        onRetrieve={(orderId, items) => onRetrieveOrder?.(orderId, items)}
      />
    </>
  );
}