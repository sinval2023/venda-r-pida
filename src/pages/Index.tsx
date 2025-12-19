import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrder } from '@/hooks/useOrder';
import { useFTPHistory } from '@/hooks/useFTPHistory';
import { useProducts } from '@/hooks/useProducts';
import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { OrderTotal } from '@/components/OrderTotal';
import { OrderReviewModal } from '@/components/OrderReviewModal';
import { ExportModal } from '@/components/ExportModal';
import { FTPHistoryList } from '@/components/FTPHistoryList';
import { ClientSearchInput } from '@/components/ClientSearchInput';
import { SellerCodeInput } from '@/components/SellerCodeInput';
import { XMLImportButtons } from '@/components/XMLImportButtons';
import { Order, Product } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, Search } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { Seller } from '@/hooks/useSellers';

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, getTotal, clearOrder, finalizeOrder } = useOrder();
  const { history: ftpHistory, loading: historyLoading } = useFTPHistory();
  const { products, refetch: refetchProducts } = useProducts();
  const [exportOrder, setExportOrder] = useState<Order | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [observations, setObservations] = useState('');

  // Calculate total quantity of products in order
  const totalProductQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

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
    setSelectedClient(null);
    setSelectedSeller(null);
    setObservations('');
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

      <main className="flex-1 container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col mt-14 pb-24">
        {/* Client and Seller Info - Compact */}
        <div className="bg-card border border-border rounded-lg p-2 mb-2 space-y-2">
          <ClientSearchInput 
            onClientSelect={setSelectedClient}
            selectedClient={selectedClient}
          />
          <SellerCodeInput
            onSellerSelect={setSelectedSeller}
            selectedSeller={selectedSeller}
          />
          <Input
            placeholder="OBSERVAÇÕES..."
            value={observations}
            onChange={(e) => setObservations(e.target.value.toUpperCase())}
            className="h-8 text-xs sm:text-sm font-bold uppercase placeholder:font-bold placeholder:uppercase border-2 hover:border-primary hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-primary"
            maxLength={100}
          />
        </div>

        {/* Search Bar, XML Import and History Button */}
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por código ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
          </div>
          <XMLImportButtons 
            onProductsImported={refetchProducts}
          />
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowHistory(true)}
            className="gap-1.5 text-sm font-semibold px-3 hover:bg-gradient-to-r hover:from-orange-400 hover:to-amber-500 hover:text-white hover:border-orange-400 transition-all duration-300 shadow-sm"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </Button>
        </div>

        {/* Product Grid - No categories, directly showing cards */}
        <ProductGrid 
          onAddToOrder={handleAddToOrder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </main>

      <OrderTotal 
        total={total} 
        itemCount={items.length}
        productCount={totalProductQuantity}
        onReview={handleReview}
        onFinalize={handleFinalize}
        onCancelOrder={clearOrder}
        disabled={total === 0}
        items={items}
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
            <DialogTitle className="text-xl font-bold">Últimos Pedidos Enviados</DialogTitle>
          </DialogHeader>
          <FTPHistoryList history={ftpHistory} loading={historyLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
