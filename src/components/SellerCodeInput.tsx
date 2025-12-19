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
                  flex flex-col items-center justify-center px-6 py-3 rounded-2xl border-4 
                  transition-all duration-300 min-w-[90px] md:min-w-[100px]
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-500 via-blue-400 to-sky-300 text-white border-blue-600 shadow-xl scale-110' 
                    : 'bg-gradient-to-br from-blue-100 via-sky-100 to-blue-50 border-blue-400 text-black hover:from-blue-200 hover:via-sky-200 hover:to-blue-100 hover:border-blue-500 hover:scale-105 hover:shadow-lg'
                  }
                  ${!seller ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                disabled={!seller}
              >
                <span className="font-black text-2xl md:text-3xl">{code}</span>
                {seller && (
                  <span className={`text-xs md:text-sm font-bold truncate max-w-[80px] ${isSelected ? 'text-white' : 'text-black'}`}>
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
