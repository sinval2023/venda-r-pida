import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/types/order';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { ProductWithCategory } from '@/hooks/useProducts';

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
}

export function ProductCard({ product, onAddToOrder }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [editPrice, setEditPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState(product.default_price);

  const priceInputRef = useRef<HTMLInputElement>(null);
  const editPriceRef = useRef(false);
  const customPriceRef = useRef(product.default_price);

  // Mantém refs sincronizadas para evitar usar valores antigos em cliques rápidos
  useEffect(() => {
    editPriceRef.current = editPrice;
    customPriceRef.current = customPrice;
  }, [editPrice, customPrice]);

  // Sempre que não estiver editando, garante que o preço editável volte ao original
  useEffect(() => {
    if (!editPrice) {
      setCustomPrice(product.default_price);
      customPriceRef.current = product.default_price;
    }
  }, [editPrice, product.default_price]);

  // Ao entrar no modo edição, reseta para o preço original e foca no input
  useEffect(() => {
    if (editPrice) {
      setCustomPrice(product.default_price);
      customPriceRef.current = product.default_price;

      // Deixa o DOM renderizar o input antes de focar
      requestAnimationFrame(() => {
        if (priceInputRef.current) {
          priceInputRef.current.focus();
          priceInputRef.current.select();
        }
      });
    }
  }, [editPrice, product.default_price]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleAddToOrder = () => {
    const finalPrice = editPriceRef.current ? customPriceRef.current : product.default_price;

    // Reseta imediatamente (sincrono) para que o próximo clique use sempre o preço original
    editPriceRef.current = false;
    customPriceRef.current = product.default_price;

    setQuantity(1);
    setEditPrice(false);
    setCustomPrice(product.default_price);

    onAddToOrder(product, quantity, finalPrice);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      handleAddToOrder();
    }
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] border-2 border-emerald-300 hover:border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200 dark:from-emerald-900/40 dark:via-green-900/30 dark:to-emerald-800/40 group"
      onClick={handleAddToOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Code Badge and Cart Icon */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded shadow">
          {product.code}
        </div>
        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110" />
      </div>

      {/* Product Info */}
      <div className="p-1 sm:p-1.5">
        {/* Product Name - Centered, Roboto, Responsive */}
        <h3 className="font-roboto font-bold text-[10px] sm:text-xs md:text-sm lg:text-base text-foreground line-clamp-2 h-6 sm:h-8 md:h-9 mb-0.5 text-center group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
          {product.description}
        </h3>
        
        {/* Price - Centered, Black, Larger */}
        {!editPrice ? (
          <div className="text-xs sm:text-sm md:text-base font-bold text-black dark:text-white text-center mb-0.5 sm:mb-1">
            {formatCurrency(product.default_price)}
          </div>
        ) : (
          <div className="flex justify-center mb-0.5 sm:mb-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={priceInputRef}
              type="number"
              step="0.01"
              min="0"
              value={customPrice}
              onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handlePriceKeyDown}
              className="w-16 sm:w-20 h-5 sm:h-6 text-center text-xs sm:text-sm font-bold text-foreground bg-background border-2 border-emerald-500 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-600 hover:shadow-md transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}

        {/* Quantity Controls and Edit Price - Only visible on hover */}
        {isHovered && (
          <div className="space-y-0.5 sm:space-y-1 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Edit Price Checkbox */}
            <div 
              className="flex items-center justify-center gap-1 sm:gap-2 p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors duration-200"
            >
              <Checkbox
                id={`edit-price-${product.id}`}
                checked={editPrice}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  setEditPrice(next);
                  editPriceRef.current = next;

                  if (!next) {
                    setCustomPrice(product.default_price);
                    customPriceRef.current = product.default_price;
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-3 w-3 sm:h-4 sm:w-4 border-emerald-500 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <label 
                htmlFor={`edit-price-${product.id}`}
                className="text-[10px] sm:text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Editar preço
              </label>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-center gap-1">
              <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/50 dark:hover:bg-red-900 dark:text-red-400"
                  onClick={handleDecrement}
                >
                  <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    e.stopPropagation();
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, val));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      handleAddToOrder();
                    }
                  }}
                  className="w-8 sm:w-10 h-5 sm:h-6 text-center text-[10px] sm:text-xs font-bold text-foreground bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/50 dark:hover:bg-emerald-900 dark:text-emerald-400"
                  onClick={handleIncrement}
                >
                  <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
