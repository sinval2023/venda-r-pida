import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrder } from '@/hooks/useOrder';
import { useFTPHistory } from '@/hooks/useFTPHistory';
import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { OrderTotal } from '@/components/OrderTotal';
import { OrderReviewModal } from '@/components/OrderReviewModal';
import { ExportModal } from '@/components/ExportModal';
import { FTPHistoryList } from '@/components/FTPHistoryList';
import { Order, Product } from '@/types/order';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History } from 'lucide-react';

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, getTotal, clearOrder, finalizeOrder } = useOrder();
  const { history: ftpHistory, loading: historyLoading } = useFTPHistory();
  const [exportOrder, setExportOrder] = useState<Order | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleAddToOrder = (product: Product, quantity: number, unitPrice: number) => {
    addItem(product, quantity, unitPrice);
  };

  const handleReview = () => {
    setShowReview(true);
  };

  const handleFinalize = async () => {
    setShowReview(false);
    const order = await finalizeOrder();
    if (order) {
      setExportOrder(order);
    }
  };

  const handleExportSuccess = () => {
    setExportOrder(null);
    clearOrder();
  };

  const handleExportBack = () => {
    setExportOrder(null);
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
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowHistory(true)}
            className="gap-2 text-lg font-bold px-6 py-3 hover:bg-gradient-to-r hover:from-orange-400 hover:to-amber-500 hover:text-white hover:border-orange-400 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <History className="h-5 w-5" />
            Últimos Pedidos
          </Button>
        </div>
        <ProductGrid onAddToOrder={handleAddToOrder} />
      </main>

      <OrderTotal 
        total={total} 
        itemCount={items.length}
        onReview={handleReview}
        onFinalize={handleFinalize}
        disabled={total === 0}
      />

      <OrderReviewModal
        items={items}
        total={total}
        open={showReview}
        onClose={() => setShowReview(false)}
        onConfirm={handleFinalize}
        onRemoveItem={removeItem}
      />

      {exportOrder && (
        <ExportModal
          order={exportOrder}
          open={!!exportOrder}
          onClose={() => setExportOrder(null)}
          onSuccess={handleExportSuccess}
          onBack={handleExportBack}
        />
      )}

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Últimos Pedidos Enviados</DialogTitle>
          </DialogHeader>
          <FTPHistoryList history={ftpHistory} loading={historyLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
