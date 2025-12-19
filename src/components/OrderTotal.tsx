import { ClipboardCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderTotalProps {
  total: number;
  itemCount: number;
  onReview: () => void;
  onFinalize: () => void;
  disabled: boolean;
}

export function OrderTotal({ total, itemCount, productCount, onReview, onFinalize, disabled }: OrderTotalProps & { productCount?: number }) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
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
  );
}