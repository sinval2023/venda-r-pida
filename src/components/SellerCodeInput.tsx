import { useState } from 'react';
import { useSellers, Seller } from '@/hooks/useSellers';
import { UserCheck, UserPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SellerManagementModal } from './SellerManagementModal';

interface SellerCodeInputProps {
  onSellerSelect: (seller: Seller | null) => void;
  selectedSeller: Seller | null;
}

export function SellerCodeInput({ onSellerSelect, selectedSeller }: SellerCodeInputProps) {
  const { sellers, getSellerByCode, refetch } = useSellers();
  const [showSellerModal, setShowSellerModal] = useState(false);

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
        <div className="flex gap-3 items-center flex-wrap">
          {sellers.map((seller) => {
            const isSelected = selectedSeller?.code === seller.code;
            
            return (
              <button
                key={seller.id}
                onClick={() => handleSelectSeller(seller.code)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-xl border-3 
                  transition-all duration-300 min-w-[70px] group
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-500 via-blue-400 to-sky-300 border-blue-600 shadow-xl scale-110' 
                    : 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 border-blue-300 hover:from-blue-100 hover:via-sky-100 hover:to-blue-200 hover:border-blue-500 hover:scale-105 hover:shadow-lg'
                  }
                  cursor-pointer
                `}
              >
                {/* Round Image with Hover Effect */}
                <div className={`
                  w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden mb-1 
                  transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                  ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-blue-500' : 'ring-2 ring-blue-200 group-hover:ring-blue-400'}
                `}>
                  {seller.image_url ? (
                    <img
                      src={seller.image_url}
                      alt={seller.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-bold text-lg
                      ${isSelected ? 'bg-white/30 text-white' : 'bg-blue-200 text-blue-700'}
                    `}>
                      {seller.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Name below image */}
                <span className={`text-[10px] md:text-xs font-bold truncate max-w-[65px] text-center
                  ${isSelected ? 'text-white' : 'text-black'}
                `}>
                  {seller.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
          
          {/* Add New Seller Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSellerModal(true)}
            className="h-10 w-10 rounded-full border-2 border-dashed border-blue-400 hover:border-blue-500 hover:bg-blue-50"
            title="Adicionar vendedor"
          >
            <UserPlus className="h-5 w-5 text-blue-500" />
          </Button>
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

      <SellerManagementModal
        open={showSellerModal}
        onOpenChange={setShowSellerModal}
        onSellersChanged={refetch}
      />
    </div>
  );
}
