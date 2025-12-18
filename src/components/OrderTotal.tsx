import { ClipboardCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderTotalProps {
  total: number;
  itemCount: number;
  onReview: () => void;
  onFinalize: () => void;
  disabled: boolean;
}

export function OrderTotal({ total, itemCount, onReview, onFinalize, disabled }: OrderTotalProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {itemCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {itemCount === 1 ? 'item' : 'itens'}
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(total)}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onReview}
              disabled={disabled}
              variant="outline"
              size="lg"
              className="font-bold"
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />
              CONFERE
            </Button>
            <Button
              onClick={onFinalize}
              disabled={disabled}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Send className="h-5 w-5 mr-2" />
              FINALIZAR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}