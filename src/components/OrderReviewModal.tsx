import { useState } from 'react';
import { OrderItem } from '@/types/order';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { ArrowLeft, Send, Trash2, MessageSquare, Pencil } from 'lucide-react';
import { ItemObservationModal } from './ItemObservationModal';

interface OrderReviewModalProps {
  items: OrderItem[];
  total: number;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateObservation?: (itemId: string, observation: string) => void;
}

export function OrderReviewModal({ items, total, open, onClose, onConfirm, onRemoveItem, onUpdateObservation }: OrderReviewModalProps) {
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Conferência do Pedido</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center w-[50px]">Qtd</TableHead>
                  <TableHead className="text-right w-[80px]">Unit.</TableHead>
                  <TableHead className="text-right w-[80px]">Total</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <>
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell className="text-sm">{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {onUpdateObservation && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                              onClick={() => handleEditObservation(item)}
                              title="Editar observação"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {item.observations && (
                      <TableRow key={`${item.id}-obs`} className="bg-amber-50/50 dark:bg-amber-900/10">
                        <TableCell colSpan={6} className="py-2">
                          <div 
                            className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 p-1 rounded transition-colors"
                            onClick={() => onUpdateObservation && handleEditObservation(item)}
                          >
                            <MessageSquare className="h-3 w-3 text-amber-600 flex-shrink-0" />
                            <span className="flex-1">{item.observations}</span>
                            {onUpdateObservation && <Pencil className="h-3 w-3 text-amber-600 opacity-50" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-bold text-lg">
                    Total Geral:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    {formatCurrency(total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Digitação
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
            >
              <Send className="h-4 w-4 mr-2" />
              CONCLUIR / ENVIAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
