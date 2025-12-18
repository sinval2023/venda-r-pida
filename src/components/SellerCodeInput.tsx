import { useSellers, Seller } from '@/hooks/useSellers';
import { UserCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface SellerCodeInputProps {
  onSellerSelect: (seller: Seller | null) => void;
  selectedSeller: Seller | null;
}

export function SellerCodeInput({ onSellerSelect, selectedSeller }: SellerCodeInputProps) {
  const { getSellerByCode } = useSellers();

  const sellerCodes = ['1', '2', '3', '4', '5'];

  const handleSelectSeller = (code: string) => {
    const seller = getSellerByCode(code);
    if (seller) {
      onSellerSelect(seller);
    } else {
      onSellerSelect(null);
    }
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
        <UserCheck className="h-3 w-3" /> Vendedor
      </Label>
      <div className="flex gap-2">
        {sellerCodes.map((code) => {
          const seller = getSellerByCode(code);
          const isSelected = selectedSeller?.code === code;
          
          return (
            <button
              key={code}
              onClick={() => handleSelectSeller(code)}
              className={`
                flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-sm
                transition-all duration-200 min-w-[60px]
                ${isSelected 
                  ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' 
                  : 'bg-card border-border hover:bg-accent hover:border-primary/50 hover:scale-105 hover:shadow-md'
                }
                ${!seller ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={!seller}
            >
              <span className="font-bold text-base">{code}</span>
              {seller && (
                <span className={`text-[10px] truncate max-w-[50px] ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {seller.name.split(' ')[0]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
