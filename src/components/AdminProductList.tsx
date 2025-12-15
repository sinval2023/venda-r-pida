import { Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types/order';
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

interface AdminProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  loading: boolean;
}

export function AdminProductList({ products, onEdit, onDelete, loading }: AdminProductListProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
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

  if (products.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum produto cadastrado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Produtos Cadastrados ({products.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="p-4 flex items-center justify-between gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{product.code}</div>
                <div className="text-sm text-muted-foreground truncate">{product.description}</div>
                <div className="text-sm font-medium text-primary mt-1">
                  {formatCurrency(product.default_price)}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
