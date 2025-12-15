import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductSearch } from './ProductSearch';
import { Product } from '@/types/order';
import { useProducts } from '@/hooks/useProducts';

interface AddItemFormProps {
  onAddItem: (product: Product, quantity: number, unitPrice: number) => void;
}

export function AddItemForm({ onAddItem }: AddItemFormProps) {
  const { products, searchProducts, loading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.default_price);
    }
  }, [selectedProduct]);

  const total = quantity * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0 || unitPrice <= 0) return;

    onAddItem(selectedProduct, quantity, unitPrice);
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleCodeChange = (code: string) => {
    const product = products.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (product) {
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Adicionar Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label htmlFor="productCode">Código</Label>
              <Input
                id="productCode"
                type="text"
                placeholder="Ex: 1"
                value={selectedProduct?.code || ''}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center"
              />
            </div>
            <div className="col-span-2">
              <Label>Buscar Produto</Label>
              <ProductSearch
                products={products}
                onSearch={searchProducts}
                onSelectProduct={setSelectedProduct}
              />
            </div>
          </div>

          {selectedProduct && (
            <Card className="bg-accent/50 p-3">
              <div className="font-medium">{selectedProduct.code}</div>
              <div className="text-sm text-muted-foreground">{selectedProduct.description}</div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Valor Unitário</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total do Item:</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!selectedProduct || quantity <= 0 || unitPrice <= 0}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
