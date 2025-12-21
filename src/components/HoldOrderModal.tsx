import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HoldOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (identification: string) => void;
}

export function HoldOrderModal({ open, onOpenChange, onConfirm }: HoldOrderModalProps) {
  const [identification, setIdentification] = useState('');
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!identification.trim()) {
      toast({
        title: "Identificação obrigatória",
        description: "Digite uma identificação para o pedido em espera.",
        variant: "destructive",
      });
      return;
    }
    onConfirm(identification.toUpperCase());
    setIdentification('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5 text-amber-500" />
            Colocar Pedido em Espera
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Digite uma identificação para encontrar este pedido depois (ex: nome do cliente, mesa, etc.)
          </p>
          <div>
            <Label htmlFor="identification">Identificação</Label>
            <Input
              id="identification"
              value={identification}
              onChange={(e) => setIdentification(e.target.value.toUpperCase())}
              placeholder="Ex: MESA 5, JOÃO, DELIVERY..."
              className="mt-1 uppercase"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}