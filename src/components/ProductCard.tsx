import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/order';
import { Plus, Minus, ShoppingCart, Package } from 'lucide-react';
import { ProductWithCategory } from '@/hooks/useProducts';

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
}

export function ProductCard({ product, onAddToOrder }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

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
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-emerald-400 bg-gradient-to-br from-card to-muted/30 group"
      onClick={handleAddToOrder}
    >
      {/* Product Image */}
      <div className="relative h-28 sm:h-32 bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900 dark:to-blue-800 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.description}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-sky-500 dark:text-sky-400 opacity-60" />
        )}
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md shadow">
          {product.code}
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 h-10 mb-2">
          {product.description}
        </h3>
        
        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-3">
          {formatCurrency(product.default_price)}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900"
              onClick={handleDecrement}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900"
              onClick={handleIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            size="sm"
            className="h-8 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-md"
            onClick={handleAddToOrder}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
