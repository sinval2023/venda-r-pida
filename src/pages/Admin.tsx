import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { AdminProductForm } from '@/components/AdminProductForm';
import { AdminProductList } from '@/components/AdminProductList';
import { AdminCategoryList } from '@/components/AdminCategoryList';
import { PrinterSettingsModal } from '@/components/PrinterSettingsModal';
import { useProducts, ProductWithCategory } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);

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

  const handleSave = async (productData: { code: string; description: string; default_price: number; category_id?: string; image_url?: string; barcode?: string }) => {
    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, productData);
      if (!result.error) {
        setEditingProduct(null);
        setSelectedProduct(null);
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
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    }
  };

  const handleSelectProduct = (product: ProductWithCategory) => {
    setSelectedProduct(product);
    setEditingProduct(product);
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
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <AdminProductForm
                  product={editingProduct || undefined}
                  onSave={handleSave}
                  onCancel={editingProduct ? () => {
                    setEditingProduct(null);
                    setSelectedProduct(null);
                  } : undefined}
                />
              </div>
              
              <div>
                <AdminProductList
                  products={products}
                  onEdit={setEditingProduct}
                  onDelete={handleDelete}
                  onSelect={handleSelectProduct}
                  selectedProductId={selectedProduct?.id}
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

          <TabsContent value="settings">
            <div className="max-w-md space-y-4">
              <h2 className="text-lg font-semibold">Configurações do Sistema</h2>
              
              {/* Printer Settings Card */}
              <div className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Impressora Térmica</h3>
                      <p className="text-sm text-muted-foreground">Configurar impressora e dados do cupom</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPrinterSettings(true)}
                  >
                    Configurar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <PrinterSettingsModal
          open={showPrinterSettings}
          onClose={() => setShowPrinterSettings(false)}
        />
      </main>
    </div>
  );
}