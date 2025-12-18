import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/order';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProductGridProps {
  onAddToOrder: (product: Product, quantity: number, unitPrice: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProductGrid({ onAddToOrder, searchQuery, onSearchChange }: ProductGridProps) {
  const { products, loading, searchProducts } = useProducts();

  const filteredProducts = searchQuery ? searchProducts(searchQuery) : products;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToOrder={onAddToOrder}
        />
      ))}
    </div>
  );
}
