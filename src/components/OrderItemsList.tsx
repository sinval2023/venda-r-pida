import { Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderItem } from '@/types/order';

interface OrderItemsListProps {
  items: OrderItem[];
  onRemoveItem: (itemId: string) => void;
}

export function OrderItemsList({ items, onRemoveItem }: OrderItemsListProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (items.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum item adicionado ao pedido
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Itens do Pedido ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-4 flex flex-col gap-2 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{item.code}</div>
                  <div className="text-sm text-muted-foreground truncate">{item.description}</div>
                  <div className="text-sm mt-1">
                    <span className="text-muted-foreground">{item.quantity} × </span>
                    <span>{formatCurrency(item.unitPrice)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatCurrency(item.total)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Item Observation */}
              {item.observations && (
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">{item.observations}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
