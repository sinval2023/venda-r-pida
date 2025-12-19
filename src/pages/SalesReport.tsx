import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, FileText, FileSpreadsheet, Search, TrendingUp, Package, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useSalesReport } from '@/hooks/useSalesReport';
import { exportToPDF, exportToExcel } from '@/utils/exportReport';

const SalesReport = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { orders, sellerRanking, productRanking, loading: reportLoading, fetchReport, getTotalSales } = useSalesReport();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReport(startDate, endDate);
    }
  }, [user]);

  const handleSearch = () => {
    fetchReport(startDate, endDate);
  };

  const handleExportPDF = () => {
    exportToPDF({
      orders,
      sellerRanking,
      productRanking,
      startDate,
      endDate,
      totalSales: getTotalSales()
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      orders,
      sellerRanking,
      productRanking,
      startDate,
      endDate,
      totalSales: getTotalSales()
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Relatório de Vendas</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 mt-16">
        {/* Filters */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Data Final</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={handleSearch} disabled={reportLoading} className="gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleExportPDF} disabled={orders.length === 0} className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" onClick={handleExportExcel} disabled={orders.length === 0} className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalSales())}</div>
              <p className="text-xs text-muted-foreground">Total de Vendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
              <p className="text-xs text-muted-foreground">Pedidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{sellerRanking.length}</div>
              <p className="text-xs text-muted-foreground">Vendedores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{productRanking.length}</div>
              <p className="text-xs text-muted-foreground">Produtos Vendidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sellers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="sellers" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Por Vendedor
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Por Produto
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : sellerRanking.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum dado encontrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Posição</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Qtd Pedidos</TableHead>
                        <TableHead className="text-right">Total Vendas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellerRanking.map((seller, index) => (
                        <TableRow key={seller.seller_name}>
                          <TableCell className="font-medium">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}º
                            </span>
                          </TableCell>
                          <TableCell>{seller.seller_name}</TableCell>
                          <TableCell className="text-right">{seller.order_count}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(seller.total_sales)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking por Produto</CardTitle>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : productRanking.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum dado encontrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Posição</TableHead>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productRanking.map((product, index) => (
                        <TableRow key={product.product_code}>
                          <TableCell className="font-medium">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}º
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{product.product_description}</TableCell>
                          <TableCell className="text-right">{product.total_quantity}</TableCell>
                          <TableCell className="text-right font-medium text-blue-600">
                            {formatCurrency(product.total_value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lista de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Nº Pedido</TableHead>
                        <TableHead className="w-28">Data</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>{order.seller_name}</TableCell>
                          <TableCell>{order.client_name || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-purple-600">
                            {formatCurrency(Number(order.total))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SalesReport;
