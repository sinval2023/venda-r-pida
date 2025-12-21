import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { Seller } from '@/hooks/useSellers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, getTotal, clearOrder, finalizeOrder, setOrderItems } = useOrder();
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
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleAddToOrder = (product: Product, quantity: number, unitPrice: number) => {
    if (!selectedSeller) {
      toast.error('Selecionar um vendedor');
      return;
    }
    addItem(product, quantity, unitPrice);
  };

  const handleReview = () => {
    setShowReview(true);
  };

  const handleFinalize = async () => {
    setShowReview(false);
    const order = await finalizeOrder({
      sellerId: selectedSeller?.id,
      sellerName: selectedSeller?.name,
      clientId: selectedClient?.id,
      clientName: selectedClient?.name,
      observations
    });
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

  const handleReportsClick = () => {
    navigate('/relatorios');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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
            orderTotal={total}
          />
          <Input
            placeholder="OBSERVAÇÕES..."
            value={observations}
            onChange={(e) => setObservations(e.target.value.toUpperCase())}
            className="h-8 text-xs sm:text-sm font-bold uppercase placeholder:font-bold placeholder:uppercase border-2 hover:border-primary hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-primary"
            maxLength={100}
          />
        </div>

        {/* Search Bar and XML Import */}
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por código ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="pl-10 h-10 text-sm uppercase"
            />
          </div>
          <XMLImportButtons 
            onProductsImported={refetchProducts}
            onShowHistory={() => setShowHistory(true)}
          />
        </div>

        {/* Product Grid - No categories, directly showing cards */}
        <ProductGrid
          onAddToOrder={handleAddToOrder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hasSelectedSeller={!!selectedSeller}
        />
      </main>

      <OrderTotal 
        total={total} 
        itemCount={items.length}
        productCount={totalProductQuantity}
        onReview={handleReview}
        onFinalize={handleFinalize}
        onCancelOrder={clearOrder}
        onHoldOrder={async (identification) => {
          // Hold order in database with identification
          const { data: nextNumber } = await supabase.rpc('get_next_order_number');
          if (nextNumber && user) {
            const { data: savedOrder } = await supabase.from('orders').insert({
              order_number: nextNumber,
              seller_id: selectedSeller?.id || null,
              seller_name: selectedSeller?.name || user.user_metadata?.full_name || user.email || 'Vendedor',
              client_id: selectedClient?.id || null,
              client_name: selectedClient?.name || null,
              user_id: user.id,
              total: total,
              observations: observations || null,
              status: 'em_espera',
              identification: identification
            }).select().single();

            // Save order items
            if (savedOrder) {
              const orderItems = items.map(item => ({
                order_id: savedOrder.id,
                product_id: item.productId || null,
                product_code: item.code,
                product_description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.total
              }));
              await supabase.from('order_items').insert(orderItems);
            }

            // Clear order after hold
            clearOrder();
            setSelectedClient(null);
            setSelectedSeller(null);
            setObservations('');
          }
        }}
        onRetrieveOrder={(orderId, orderItems) => {
          // Convert order items to OrderItem format and set them
          const convertedItems = orderItems.map(item => ({
            id: item.id || crypto.randomUUID(),
            productId: item.product_id || '',
            code: item.product_code,
            description: item.product_description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            total: item.total,
          }));
          setOrderItems(convertedItems);
        }}
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
