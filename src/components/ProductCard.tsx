import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/order';
import { Plus, Minus, ShoppingCart, Package, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { ProductWithCategory } from '@/hooks/useProducts';
import { ImageLightbox } from './ImageLightbox';
import plantIcon from '@/assets/plant-icon.png';
import fertilizerIcon from '@/assets/fertilizer-icon-2.png';
import vaseIcon from '@/assets/vase-icon.png';

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
}

export function ProductCard({ product, onAddToOrder }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  // Get category icon based on product code
  const getCategoryIcon = () => {
    const codeNum = parseInt(product.code);
    if (!isNaN(codeNum)) {
      if (codeNum >= 1 && codeNum <= 100) return plantIcon;
      if (codeNum >= 101 && codeNum <= 200) return fertilizerIcon;
      if (codeNum >= 201) return vaseIcon;
    }
    return null;
  };

  const categoryIcon = getCategoryIcon();

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] border-2 border-emerald-300 hover:border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200 dark:from-emerald-900/40 dark:via-green-900/30 dark:to-emerald-800/40 group"
      onClick={handleAddToOrder}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Gallery - Smaller */}
      <div className="relative h-12 sm:h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
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
        ) : categoryIcon ? (
          <div className="p-1.5 rounded-lg border-2 border-sky-300 hover:border-sky-500 bg-gradient-to-br from-sky-50 via-blue-100 to-sky-200 dark:from-sky-900/40 dark:via-blue-900/30 dark:to-sky-800/40 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <img src={categoryIcon} alt="Categoria" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          </div>
        ) : (
          <div className="p-1.5 rounded-lg border-2 border-sky-300 bg-gradient-to-br from-sky-50 via-blue-100 to-sky-200 dark:from-sky-900/40 dark:via-blue-900/30 dark:to-sky-800/40">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-sky-500 dark:text-sky-400" />
          </div>
        )}
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
          {product.code}
        </div>
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-2">
        {/* Product Name - Larger and Highlighted */}
        <h3 className="font-extrabold text-base text-foreground line-clamp-2 h-12 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
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

      <ImageLightbox
        images={lightboxImages}
        initialIndex={currentImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Card>
  );
}
