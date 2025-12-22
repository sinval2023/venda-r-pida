import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';

interface ItemObservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productCode: string;
  productDescription: string;
  currentObservation?: string;
  onSave: (observation: string) => void;
}

export function ItemObservationModal({
  open,
  onOpenChange,
  productCode,
  productDescription,
  currentObservation = '',
  onSave,
}: ItemObservationModalProps) {
  const [observation, setObservation] = useState(currentObservation);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setObservation(currentObservation);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, currentObservation]);

  const handleSave = () => {
    onSave(observation.trim());
    setObservation('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setObservation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Observações do Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-primary">{productCode}</p>
            <p className="text-sm text-muted-foreground">{productDescription}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              ref={textareaRef}
              id="observation"
              placeholder="Digite a observação para este item..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
