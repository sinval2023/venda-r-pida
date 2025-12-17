import { Card } from '@/components/ui/card';
import { Product } from '@/types/order';
import { useProducts } from '@/hooks/useProducts';

interface ProductQuickPanelProps {
  onSelectProduct: (product: Product) => void;
}

export function ProductQuickPanel({ onSelectProduct }: ProductQuickPanelProps) {
  const { products, loading } = useProducts();

  // Get first 10 products
  const quickProducts = products.slice(0, 10);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="p-2 animate-pulse bg-muted h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {quickProducts.map((product) => (
        <Card
          key={product.id}
          onClick={() => onSelectProduct(product)}
          className="p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-2 hover:border-sky-400 bg-gradient-to-br from-white to-sky-50 dark:from-slate-800 dark:to-slate-700 group"
        >
          <div className="flex items-center gap-2">
            <div className="text-base font-bold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 min-w-[60px]">
              {product.code}
            </div>
            <div className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors flex-1">
              {product.description}
            </div>
          </div>
        </Card>
      ))}
      {/* Fill remaining slots if less than 10 products */}
      {quickProducts.length < 10 && Array.from({ length: 10 - quickProducts.length }).map((_, i) => (
        <Card
          key={`empty-${i}`}
          className="p-2 bg-muted/30 border-dashed h-12"
        >
          <div className="text-center text-muted-foreground/50 text-sm">
            —
          </div>
        </Card>
      ))}
    </div>
  );
}
