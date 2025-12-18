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
    <div className="flex items-center gap-4">
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
                  flex flex-col items-center justify-center px-4 py-2 rounded-lg border text-sm
                  transition-all duration-200 min-w-[65px]
                  ${isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                    : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-500 hover:scale-105 hover:shadow-md'
                  }
                  ${!seller ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                disabled={!seller}
              >
                <span className="font-bold text-xl">{code}</span>
                {seller && (
                  <span className={`text-[10px] truncate max-w-[50px] ${isSelected ? 'text-white/90' : 'text-blue-600'}`}>
                    {seller.name.split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {selectedSeller && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <UserCheck className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Vendedor: <span className="font-bold">{selectedSeller.name}</span>
          </span>
        </div>
      )}
    </div>
  );
}
