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
import { ArrowLeft, Send } from 'lucide-react';

interface OrderReviewModalProps {
  items: OrderItem[];
  total: number;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrderReviewModal({ items, total, open, onClose, onConfirm }: OrderReviewModalProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Conferência do Pedido</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center w-[60px]">Qtd</TableHead>
                <TableHead className="text-right w-[100px]">Unit.</TableHead>
                <TableHead className="text-right w-[100px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.code}</TableCell>
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold text-lg">
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
  );
}
