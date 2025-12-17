import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrder } from '@/hooks/useOrder';
import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { OrderItemsList } from '@/components/OrderItemsList';
import { OrderTotal } from '@/components/OrderTotal';
import { ExportModal } from '@/components/ExportModal';
import { Order, Product } from '@/types/order';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, getTotal, clearOrder, finalizeOrder } = useOrder();
  const [exportOrder, setExportOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleAddToOrder = (product: Product, quantity: number, unitPrice: number) => {
    addItem(product, quantity, unitPrice);
    toast.success(`${product.code} adicionado ao pedido`, {
      description: `${quantity}x ${product.description}`,
      duration: 2000,
    });
  };

  const handleFinalize = async () => {
    const order = await finalizeOrder();
    if (order) {
      setExportOrder(order);
    }
  };

  const handleExportSuccess = () => {
    setExportOrder(null);
    clearOrder();
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="Novo Pedido" 
        showAdminLink={isAdmin}
        onAdminClick={handleAdminClick}
      />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col mt-16 pb-28">
        {/* Product Grid */}
        <ProductGrid onAddToOrder={handleAddToOrder} />

        {/* Order Items List */}
        {items.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-bold mb-4 text-foreground">Itens do Pedido ({items.length})</h2>
            <OrderItemsList
              items={items}
              onRemoveItem={removeItem}
            />
          </div>
        )}
      </main>

      <OrderTotal 
        total={total} 
        itemCount={items.length}
        onFinalize={handleFinalize}
        disabled={total === 0}
      />

      {exportOrder && (
        <ExportModal
          order={exportOrder}
          open={!!exportOrder}
          onClose={() => setExportOrder(null)}
          onSuccess={handleExportSuccess}
        />
      )}
    </div>
  );
};

export default Index;
