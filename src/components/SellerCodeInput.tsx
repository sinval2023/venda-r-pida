import { useState } from 'react';
import { useSellers, Seller } from '@/hooks/useSellers';
import { UserCheck, UserPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SellerManagementModal } from './SellerManagementModal';
import { PasswordAuthModal } from './PasswordAuthModal';

interface SellerCodeInputProps {
  onSellerSelect: (seller: Seller | null) => void;
  selectedSeller: Seller | null;
  orderTotal?: number;
}

export function SellerCodeInput({ onSellerSelect, selectedSeller, orderTotal = 0 }: SellerCodeInputProps) {
  const { sellers, getSellerByCode, refetch } = useSellers();
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingSellerCode, setPendingSellerCode] = useState<string | null>(null);

  const handleSelectSeller = (code: string) => {
    // Se já tem um vendedor selecionado e está tentando trocar, pedir senha APENAS se o pedido foi iniciado (total > 0)
    if (selectedSeller && selectedSeller.code !== code && orderTotal > 0) {
      setPendingSellerCode(code);
      setShowPasswordModal(true);
      return;
    }
    
    const seller = getSellerByCode(code);
    if (seller) {
      onSellerSelect(seller);
    } else {
      onSellerSelect(null);
    }
  };

  const handlePasswordSuccess = () => {
    if (pendingSellerCode) {
      const seller = getSellerByCode(pendingSellerCode);
      if (seller) {
        onSellerSelect(seller);
      }
      setPendingSellerCode(null);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Card className="bg-gradient-to-br from-blue-400 via-sky-300 to-blue-200 border-2 border-blue-300 shadow-lg p-4 rounded-2xl">
        <Label className="text-xs text-white/90 flex items-center gap-1 mb-2 font-semibold">
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
                  flex flex-col items-center justify-center p-2 rounded-xl border-2 
                  transition-all duration-300 min-w-[70px] group
                  ${isSelected 
                    ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 border-white shadow-xl scale-110' 
                    : 'bg-white/90 border-white/60 hover:bg-white hover:border-white hover:scale-105 hover:shadow-lg'
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
                  ${isSelected ? 'text-white' : 'text-blue-700'}
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
            className="h-10 w-10 rounded-full border-2 border-dashed border-white/70 hover:border-white hover:bg-white/20 bg-white/10"
            title="Adicionar vendedor"
          >
            <UserPlus className="h-5 w-5 text-white" />
          </Button>
        </div>
        
        {selectedSeller && (
          <div className="flex items-center gap-2 bg-white/90 border border-white/60 rounded-lg px-3 py-2 mt-3">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Vendedor: <span className="font-bold">{selectedSeller.name}</span>
            </span>
          </div>
        )}
      </Card>

      <SellerManagementModal
        open={showSellerModal}
        onOpenChange={setShowSellerModal}
        onSellersChanged={refetch}
      />

      <PasswordAuthModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onSuccess={handlePasswordSuccess}
        title="Autorização para Trocar Vendedor"
        description="Digite a senha para alterar o vendedor do pedido."
      />
    </div>
  );
}
