import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { AdminProductForm } from '@/components/AdminProductForm';
import { AdminProductList } from '@/components/AdminProductList';
import { AdminCategoryList } from '@/components/AdminCategoryList';
import { useProducts, ProductWithCategory } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  const handleSave = async (productData: { code: string; description: string; default_price: number; category_id?: string; image_url?: string }) => {
    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, productData);
      if (!result.error) {
        setEditingProduct(null);
      }
      return result;
    }
    return addProduct(productData);
  };

  const handleDelete = async (productId: string) => {
    const { error } = await deleteProduct(productId);
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Produto excluído',
        description: 'O produto foi removido do catálogo.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Administração" />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Vendas
        </Button>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <AdminProductForm
                  product={editingProduct || undefined}
                  onSave={handleSave}
                  onCancel={editingProduct ? () => setEditingProduct(null) : undefined}
                />
              </div>
              
              <div>
                <AdminProductList
                  products={products}
                  onEdit={setEditingProduct}
                  onDelete={handleDelete}
                  loading={loading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="max-w-md">
              <AdminCategoryList />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
