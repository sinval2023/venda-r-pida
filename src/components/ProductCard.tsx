import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/order';
import { Plus, Minus, ShoppingCart, Package, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { ProductWithCategory } from '@/hooks/useProducts';
import { ImageLightbox } from './ImageLightbox';

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
}

export function ProductCard({ product, onAddToOrder }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.image_url 
      ? [{ id: 'main', image_url: product.image_url, is_primary: true }]
      : [];

  const hasMultipleImages = images.length > 1;

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

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const handleOpenLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOpen(true);
  };

  const lightboxImages = images.map(img => ({ url: img.image_url, alt: product.description }));

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-emerald-400 bg-gradient-to-br from-card to-muted/30 group"
      onClick={handleAddToOrder}
    >
      {/* Product Image Gallery - Smaller */}
      <div className="relative h-16 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex].image_url} 
              alt={product.description}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105 cursor-zoom-in shadow-inner"
              onClick={handleOpenLightbox}
            />
            {/* Zoom button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0.5 left-8 h-5 w-5 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleOpenLightbox}
            >
              <Maximize2 className="h-2.5 w-2.5" />
            </Button>
            {/* Navigation arrows */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0.5 top-1/2 -translate-y-1/2 h-5 w-5 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                {/* Dots indicator */}
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-1 h-1 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <Package className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 dark:text-sky-400 opacity-60" />
        )}
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
          {product.code}
        </div>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-1.5">
        {/* Product Name - Larger and Black */}
        <h3 className="font-bold text-sm text-foreground line-clamp-2 h-10 mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
          {product.description}
        </h3>
        
        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">
          {formatCurrency(product.default_price)}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/50 dark:hover:bg-red-900 dark:text-red-400"
              onClick={handleDecrement}
            >
              <Minus className="h-3 w-3" />
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
              className="w-8 h-7 text-center text-xs font-bold text-foreground bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/50 dark:hover:bg-emerald-900 dark:text-emerald-400"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            size="sm"
            className="h-7 px-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow text-xs"
            onClick={handleAddToOrder}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Card>
  );
}
