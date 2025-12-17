import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrder } from '@/hooks/useOrder';
import { Header } from '@/components/Header';
import { AddItemForm, AddItemFormRef } from '@/components/AddItemForm';
import { OrderItemsList } from '@/components/OrderItemsList';
import { OrderTotal } from '@/components/OrderTotal';
import { ExportModal } from '@/components/ExportModal';
import { ProductQuickPanel } from '@/components/ProductQuickPanel';
import { Order, Product } from '@/types/order';

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, getTotal, clearOrder, finalizeOrder } = useOrder();
  const [exportOrder, setExportOrder] = useState<Order | null>(null);
  const addItemFormRef = useRef<AddItemFormRef>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleFinalize = async () => {
    const order = await finalizeOrder();
    if (order) {
      setExportOrder(order);
    }
  };

  const handleExportSuccess = () => {
    setExportOrder(null);
    clearOrder();
    // Focus on code input after a short delay
    setTimeout(() => {
      addItemFormRef.current?.focusCode();
    }, 100);
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleQuickProductSelect = (product: Product) => {
    addItemFormRef.current?.setProduct(product);
    setTimeout(() => {
      addItemFormRef.current?.focusQuantity();
    }, 50);
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

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl flex flex-col mt-16 pb-24">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Acesso Rápido</h3>
          <ProductQuickPanel onSelectProduct={handleQuickProductSelect} />
        </div>
        
        <AddItemForm ref={addItemFormRef} onAddItem={addItem} />

        <div className="flex-1 mt-6">
          <OrderItemsList
            items={items}
            onRemoveItem={removeItem}
          />
        </div>
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
