import { useState } from 'react';
import { ClipboardCheck, Send, XCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface OrderTotalProps {
  total: number;
  itemCount: number;
  onReview: () => void;
  onFinalize: () => void;
  onCancelOrder: () => void;
  disabled: boolean;
  items?: OrderItem[];
}

export function OrderTotal({ total, itemCount, productCount, onReview, onFinalize, onCancelOrder, disabled, items = [] }: OrderTotalProps & { productCount?: number }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
                <span className="hidden sm:inline">CANCELA PEDIDO</span>
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                disabled={disabled}
                size="sm"
                className="font-bold text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <MessageCircle className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">WHATSAPP</span>
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
    </>
  );
}