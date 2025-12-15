import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Product } from '@/types/order';

interface ProductSearchProps {
  products: Product[];
  onSearch: (query: string) => Product[];
  onSelectProduct: (product: Product) => void;
}

export function ProductSearch({ products, onSearch, onSelectProduct }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredProducts = query.trim() ? onSearch(query) : [];

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar produto por código ou descrição..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="pl-10"
        />
      </div>

      {showResults && filteredProducts.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto shadow-lg">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-foreground">{product.code}</div>
                <div className="text-sm text-muted-foreground">{product.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  R$ {product.default_price.toFixed(2)}
                </span>
                <Plus className="h-4 w-4 text-primary" />
              </div>
            </button>
          ))}
        </Card>
      )}

      {showResults && query.trim() && filteredProducts.length === 0 && (
        <Card className="absolute z-10 w-full mt-1 p-4 text-center text-muted-foreground shadow-lg">
          Nenhum produto encontrado
        </Card>
      )}
    </div>
  );
}
