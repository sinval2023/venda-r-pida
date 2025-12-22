import { useState } from 'react';
import { Trash2, MessageSquare, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderItem } from '@/types/order';
import { ItemObservationModal } from './ItemObservationModal';

interface OrderItemsListProps {
  items: OrderItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateObservation?: (itemId: string, observation: string) => void;
}

export function OrderItemsList({ items, onRemoveItem, onUpdateObservation }: OrderItemsListProps) {
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [showObservationModal, setShowObservationModal] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleEditObservation = (item: OrderItem) => {
    setEditingItem(item);
    setShowObservationModal(true);
  };

  const handleSaveObservation = (observation: string) => {
    if (editingItem && onUpdateObservation) {
      onUpdateObservation(editingItem.id, observation);
    }
    setEditingItem(null);
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
    <>
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
                  
                  <div className="flex items-center gap-1">
                    <div className="text-right mr-1">
                      <div className="font-bold text-primary">{formatCurrency(item.total)}</div>
                    </div>
                    {onUpdateObservation && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditObservation(item)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 shrink-0"
                        title="Editar observação"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
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
                  <div 
                    className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    onClick={() => onUpdateObservation && handleEditObservation(item)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">{item.observations}</p>
                      {onUpdateObservation && (
                        <Pencil className="h-3 w-3 text-amber-600 opacity-50" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Observation Modal */}
      {editingItem && (
        <ItemObservationModal
          open={showObservationModal}
          onOpenChange={setShowObservationModal}
          productCode={editingItem.code}
          productDescription={editingItem.description}
          currentObservation={editingItem.observations || ''}
          onSave={handleSaveObservation}
        />
      )}
    </>
  );
}
