import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/order';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PRODUCTS_PER_PAGE = 10;

interface ProductGridProps {
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasSelectedSeller: boolean;
}

export function ProductGrid({ onAddToOrder, searchQuery, onSearchChange, hasSelectedSeller }: ProductGridProps) {
  const { products, loading, searchProducts } = useProducts();
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const filteredProducts = searchQuery ? searchProducts(searchQuery) : products;

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchQuery]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
          <Card key={i} className="h-40 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-base font-medium">Nenhum produto encontrado</p>
        <p className="text-sm">Tente ajustar sua busca</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToOrder={onAddToOrder}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            className="min-w-[220px]"
          >
            Mostrar próximos {PRODUCTS_PER_PAGE} ({filteredProducts.length - visibleCount} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
