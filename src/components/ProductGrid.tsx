import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/order';
import { Input } from '@/components/ui/input';
import { Search, Package, FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ProductGridProps {
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
}

export function ProductGrid({ onAddToOrder }: ProductGridProps) {
  const { products, loading, searchProducts, getProductsByCategory } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [categoriesInitialized, setCategoriesInitialized] = useState(false);

  const filteredProducts = searchQuery ? searchProducts(searchQuery) : products;
  
  const groupedProducts = useMemo(() => {
    if (searchQuery) {
      return null;
    }
    return getProductsByCategory();
  }, [products, searchQuery, getProductsByCategory]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Initialize all categories as open only once when data loads
  useEffect(() => {
    if (groupedProducts && !categoriesInitialized) {
      setOpenCategories(new Set(Object.keys(groupedProducts)));
      setCategoriesInitialized(true);
    }
  }, [groupedProducts, categoriesInitialized]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            className="pl-10"
            disabled
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-52 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código ou descrição..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 text-base"
        />
      </div>

      {/* Products by Category or Flat List when searching */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar sua busca</p>
        </div>
      ) : searchQuery || !groupedProducts ? (
        // Flat list when searching
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToOrder={onAddToOrder}
            />
          ))}
        </div>
      ) : (
        // Grouped by category
        <div className="space-y-4">
          {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
            <Collapsible
              key={categoryName}
              open={openCategories.has(categoryName)}
              onOpenChange={() => toggleCategory(categoryName)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg hover:from-primary/15 hover:to-primary/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground">{categoryName}</span>
                    <span className="text-sm text-muted-foreground">({categoryProducts.length})</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openCategories.has(categoryName) ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToOrder={onAddToOrder}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
