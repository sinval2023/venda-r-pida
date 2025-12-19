import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    onAddToOrder(product, quantity, product.default_price);
    setQuantity(1);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] border-2 border-emerald-300 hover:border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200 dark:from-emerald-900/40 dark:via-green-900/30 dark:to-emerald-800/40 group"
      onClick={handleAddToOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Code Badge and Cart Icon */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
          {product.code}
        </div>
        <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110" />
      </div>

      {/* Product Info */}
      <div className="p-2">
        {/* Product Name - Centered, Roboto, Responsive */}
        <h3 className="font-roboto font-bold text-sm sm:text-base md:text-lg lg:text-xl text-foreground line-clamp-2 h-12 sm:h-14 mb-1 text-center group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
          {product.description}
        </h3>
        
        {/* Price - Centered, Black, Larger */}
        <div className="text-lg font-bold text-black dark:text-white text-center mb-2">
          {formatCurrency(product.default_price)}
        </div>

        {/* Quantity Controls - Only visible on hover */}
        {isHovered && (
          <div className="flex items-center justify-center gap-1 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/50 dark:hover:bg-red-900 dark:text-red-400"
                onClick={handleDecrement}
              >
                <Minus className="h-4 w-4" />
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
                className="w-14 h-8 text-center text-sm font-bold text-foreground bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/50 dark:hover:bg-emerald-900 dark:text-emerald-400"
                onClick={handleIncrement}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

    </Card>
  );
}
