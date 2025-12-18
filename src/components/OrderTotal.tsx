import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderTotalProps {
  total: number;
  itemCount: number;
  onReview: () => void;
  disabled: boolean;
}

export function OrderTotal({ total, itemCount, onReview, disabled }: OrderTotalProps) {
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
          <div>
            <div className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(total)}
            </div>
          </div>
          
          <Button
            onClick={onReview}
            disabled={disabled}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-8 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ClipboardCheck className="h-5 w-5 mr-2" />
            CONFERE PEDIDO
          </Button>
        </div>
      </div>
    </div>
  );
}