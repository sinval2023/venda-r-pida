import { useState } from 'react';
import { Trash2, Edit2, FolderOpen, Barcode, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProductWithCategory } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface AdminProductListProps {
  products: ProductWithCategory[];
  onEdit: (product: ProductWithCategory) => void;
  onDelete: (productId: string) => void;
  onSelect?: (product: ProductWithCategory) => void;
  loading: boolean;
  selectedProductId?: string;
}

const ITEMS_PER_PAGE = 10;

export function AdminProductList({ 
  products, 
  onEdit, 
  onDelete, 
  onSelect,
  loading,
  selectedProductId 
}: AdminProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.code.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      (product.barcode?.toLowerCase().includes(query)) ||
      (product.category_name?.toLowerCase().includes(query))
    );
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando produtos...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Produtos Cadastrados ({products.length})</span>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, descrição, código de barras..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredProducts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
          </div>
        ) : (
          <>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {visibleProducts.map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => onSelect?.(product)}
                  className={cn(
                    "p-4 flex items-center gap-3 animate-fade-in transition-colors",
                    onSelect && "cursor-pointer hover:bg-muted/50",
                    selectedProductId === product.id && "bg-primary/10 border-l-4 border-l-primary"
                  )}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {/* Product Image Thumbnail */}
                  {product.image_url && (
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={product.image_url} 
                        alt={product.description}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{product.code}</span>
                      {product.category_name && (
                        <Badge variant="secondary" className="text-xs">
                          <FolderOpen className="h-3 w-3 mr-1" />
                          {product.category_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{product.description}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-medium text-primary">
                        {formatCurrency(product.default_price)}
                      </span>
                      {product.barcode && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(product);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o produto "{product.code} - {product.description}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {onSelect && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="p-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  className="w-full"
                >
                  Mostrar próximos {ITEMS_PER_PAGE} ({filteredProducts.length - visibleCount} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}