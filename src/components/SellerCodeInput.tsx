import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSellers, Seller } from '@/hooks/useSellers';
import { UserCheck, AlertCircle } from 'lucide-react';

interface SellerCodeInputProps {
  onSellerSelect: (seller: Seller | null) => void;
  selectedSeller: Seller | null;
}

export function SellerCodeInput({ onSellerSelect, selectedSeller }: SellerCodeInputProps) {
  const { getSellerByCode } = useSellers();
  const [code, setCode] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (selectedSeller) {
      setCode(selectedSeller.code);
      setSellerName(selectedSeller.name);
      setNotFound(false);
    }
  }, [selectedSeller]);

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase());
    setNotFound(false);
    
    if (value.length >= 1) {
      const seller = getSellerByCode(value);
      if (seller) {
        setSellerName(seller.name);
        onSellerSelect(seller);
        setNotFound(false);
      } else {
        setSellerName('');
        onSellerSelect(null);
        if (value.length >= 2) {
          setNotFound(true);
        }
      }
    } else {
      setSellerName('');
      onSellerSelect(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <UserCheck className="h-3 w-3" /> Cód. Vendedor
        </Label>
        <Input
          placeholder="Código"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className={`h-9 text-sm font-medium ${notFound ? 'border-destructive' : ''}`}
        />
      </div>
      <div className="col-span-2">
        <Label className="text-xs text-muted-foreground">Nome do Vendedor</Label>
        <div className={`h-9 px-3 flex items-center text-sm rounded-md border ${
          sellerName 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium' 
            : notFound 
              ? 'bg-destructive/10 border-destructive/50 text-destructive'
              : 'bg-muted/50 border-border text-muted-foreground'
        }`}>
          {sellerName ? (
            sellerName
          ) : notFound ? (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Vendedor não encontrado
            </span>
          ) : (
            'Informe o código'
          )}
        </div>
      </div>
    </div>
  );
}
