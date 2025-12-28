import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Database, Loader2, RefreshCw, Trash2, Cloud, ArrowRightLeft, Save, FileSpreadsheet, FileText, FileDown, Search, ChevronUp, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApiSettings } from '@/hooks/useApiSettings';

interface ApiDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApiDataRecord {
  id: string;
  data: Record<string, unknown>;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export function ApiDataModal({ open, onOpenChange }: ApiDataModalProps) {
  const { apiUrl: savedApiUrl, saveApiUrl, saving: savingUrl, loading: loadingUrl } = useApiSettings();
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [apiData, setApiData] = useState<ApiDataRecord[]>([]);
  const [fetchedData, setFetchedData] = useState<unknown[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [processedItems, setProcessedItems] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotalItems, setSyncTotalItems] = useState(0);
  const [syncProcessedItems, setSyncProcessedItems] = useState(0);
  const [clearProductsBeforeSync, setClearProductsBeforeSync] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load saved URL when available
  useEffect(() => {
    if (savedApiUrl && !loadingUrl) {
      setApiUrl(savedApiUrl);
    }
  }, [savedApiUrl, loadingUrl]);

  const handleSaveUrl = async () => {
    await saveApiUrl(apiUrl);
  };

  const fetchStoredData = async () => {
    const { data, error } = await supabase
      .from('api_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stored data:', error);
      return;
    }

    setApiData(data as ApiDataRecord[] || []);
  };

  useEffect(() => {
    if (open) {
      fetchStoredData();
    }
  }, [open]);

  // Filter data by search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return apiData;
    
    const lowerSearch = searchTerm.toLowerCase();
    return apiData.filter((record) => {
      if (typeof record.data === 'object' && record.data !== null) {
        const descricao = String((record.data as Record<string, unknown>)['DESCRICAO'] ?? '').toLowerCase();
        const codigo = String((record.data as Record<string, unknown>)['CODIGO'] ?? '').toLowerCase();
        return descricao.includes(lowerSearch) || codigo.includes(lowerSearch);
      }
      return false;
    });
  }, [apiData, searchTerm]);

  const handleProcessData = async () => {
    if (!apiUrl.trim()) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setFetchedData(null);

    try {
      // Call edge function to fetch data from external API
      const { data: response, error } = await supabase.functions.invoke('fetch-api-data', {
        body: { apiUrl },
      });

      if (error) {
        throw error;
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Erro ao buscar dados');
      }

      const fetchedItems = Array.isArray(response.data) ? response.data : [response.data];
      setFetchedData(fetchedItems);
      setTotalItems(fetchedItems.length);
      setProcessedItems(0);
      setProgress(0);

      // Save each item to the database with progress
      for (let i = 0; i < fetchedItems.length; i++) {
        const item = fetchedItems[i];
        const { error: insertError } = await supabase
          .from('api_data')
          .insert({
            data: item,
            source_url: apiUrl,
          });

        if (insertError) {
          console.error('Error inserting data:', insertError);
        }

        const newProcessed = i + 1;
        setProcessedItems(newProcessed);
        setProgress(Math.round((newProcessed / fetchedItems.length) * 100));
      }

      await fetchStoredData();

      toast({
        title: 'Dados processados',
        description: `${fetchedItems.length} registro(s) importado(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        title: 'Erro ao processar dados',
        description: error instanceof Error ? error.message : 'Não foi possível conectar à API.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToProducts = async () => {
    if (apiData.length === 0) {
      toast({
        title: 'Sem dados para sincronizar',
        description: 'Primeiro processe dados da API.',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);
    setSyncProgress(0);
    setSyncProcessedItems(0);
    setSyncTotalItems(apiData.length);

    try {
      // Clear products table if checkbox is checked
      if (clearProductsBeforeSync) {
        const { error: deleteError } = await supabase
          .from('products')
          .update({ active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          console.error('Error clearing products:', deleteError);
          toast({
            title: 'Erro ao limpar produtos',
            description: deleteError.message,
            variant: 'destructive',
          });
          return;
        }
      }

      let syncedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < apiData.length; i++) {
        const record = apiData[i];
        const data = record.data as Record<string, unknown>;

        // Map API data to product fields
        const productData = {
          code: String(data.codigo || data.code || data.id || `API-${i + 1}`),
          description: String(data.descricao || data.description || data.nome || data.name || 'Produto Importado'),
          default_price: Number(data.preco || data.price || data.valor || data.default_price || 0),
          barcode: data.barcode ? String(data.barcode) : data.ean ? String(data.ean) : null,
          image_url: data.image_url ? String(data.image_url) : data.imagem ? String(data.imagem) : null,
          active: true,
          show_on_card: false, // Default to not showing on card
        };

        // Check if product with same code exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('code', productData.code)
          .maybeSingle();

        let error;
        if (existingProduct) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id);
          error = updateError;
        } else {
          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);
          error = insertError;
        }

        if (error) {
          console.error('Error syncing product:', error);
          errorCount++;
        } else {
          syncedCount++;
        }

        const newProcessed = i + 1;
        setSyncProcessedItems(newProcessed);
        setSyncProgress(Math.round((newProcessed / apiData.length) * 100));
      }

      toast({
        title: 'Sincronização concluída',
        description: `${syncedCount} produto(s) sincronizado(s)${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}.`,
      });
    } catch (error) {
      console.error('Error syncing to products:', error);
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Erro ao sincronizar produtos.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = async () => {
    const { error } = await supabase
      .from('api_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      toast({
        title: 'Erro ao limpar dados',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setApiData([]);
    setFetchedData(null);
    toast({
      title: 'Dados limpos',
      description: 'Todos os dados foram removidos.',
    });
  };

  // Fixed columns to display
  const displayColumns = ['CODIGO', 'DESCRICAO', 'VLR_VENDA', 'COD_UNI', 'ESTOQUE'];

  const getExportData = (dataToExport: ApiDataRecord[] = filteredData) => {
    return dataToExport.map((record) => {
      const row: Record<string, unknown> = {};
      displayColumns.forEach((col) => {
        row[col] = typeof record.data === 'object' && record.data !== null
          ? (record.data as Record<string, unknown>)[col] ?? ''
          : '';
      });
      return row;
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Sem dados para exportar',
        description: 'Primeiro processe dados da API.',
        variant: 'destructive',
      });
      return;
    }

    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados API');
    
    const fileName = `dados_api_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: 'Exportação concluída',
      description: `Arquivo ${fileName} exportado com sucesso.`,
    });
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Sem dados para exportar',
        description: 'Primeiro processe dados da API.',
        variant: 'destructive',
      });
      return;
    }

    const data = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dados_api_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV exportado com sucesso.',
    });
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Sem dados para exportar',
        description: 'Primeiro processe dados da API.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    const data = getExportData();
    
    doc.setFontSize(16);
    doc.text('Listagem de Produtos - API', 14, 15);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    doc.text(`Total de itens: ${filteredData.length}`, 14, 28);

    const tableData = data.map((row) => 
      displayColumns.map((col) => String(row[col] ?? ''))
    );

    autoTable(doc, {
      head: [displayColumns],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 249, 255] },
    });

    const fileName = `listagem_api_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: 'PDF gerado',
      description: `Arquivo ${fileName} exportado com sucesso.`,
    });
  };

  const scrollToTop = () => {
    const tableContainer = document.getElementById('api-table-body');
    if (tableContainer) {
      tableContainer.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    const tableContainer = document.getElementById('api-table-body');
    if (tableContainer) {
      tableContainer.scrollTop = tableContainer.scrollHeight;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Cloud className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            Integração API
          </DialogTitle>
        </DialogHeader>

        {/* API Configuration Card - Compact */}
        <Card className="bg-gradient-to-br from-blue-400 via-sky-300 to-blue-200 border border-blue-300 shadow-md p-3 rounded-xl">
          <Label className="text-[10px] sm:text-xs text-white/90 flex items-center gap-1 mb-1.5 font-semibold">
            <Database className="h-3 w-3" /> Configuração da API
          </Label>
          
          <div className="space-y-2">
            <div className="flex gap-1.5 items-center">
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://exemplo.ngrok-free.app/endpoint"
                className="bg-white/90 border-white/60 text-xs sm:text-sm flex-1 h-8"
              />
              <Button
                onClick={handleSaveUrl}
                disabled={savingUrl || apiUrl === savedApiUrl}
                size="icon"
                variant="outline"
                className="bg-white/90 hover:bg-white text-green-600 border-green-300 hover:border-green-400 h-8 w-8"
                title="Salvar URL"
              >
                {savingUrl ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              <Button
                onClick={handleProcessData}
                disabled={loading || syncing}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-1 h-7 text-xs font-semibold shadow-md"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {loading ? 'Processando...' : 'Processar'}
              </Button>

              <Button
                onClick={handleClearData}
                variant="outline"
                size="sm"
                disabled={loading || syncing}
                className="bg-white/90 hover:bg-white text-red-600 border-red-300 hover:border-red-400 gap-1 h-7 text-xs font-semibold shadow-md"
              >
                <Trash2 className="h-3 w-3" />
                Limpar
              </Button>
            </div>

            {loading && totalItems > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/90 font-medium">
                  <span>Importando...</span>
                  <span>{processedItems}/{totalItems} ({progress}%)</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/30" />
              </div>
            )}
          </div>
        </Card>

        {/* Sync to Products Section - Light Green Gradient */}
        <Card className="bg-gradient-to-br from-lime-200 via-green-200 to-emerald-200 border border-green-300 shadow-md p-3 rounded-xl">
          <Label className="text-[10px] sm:text-xs text-gray-800 flex items-center gap-1 mb-1.5 font-semibold">
            <ArrowRightLeft className="h-3 w-3" /> Sincronizar com Produtos
          </Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="clear-products"
                checked={clearProductsBeforeSync}
                onCheckedChange={(checked) => setClearProductsBeforeSync(checked === true)}
                className="border-gray-500 data-[state=checked]:bg-green-600 data-[state=checked]:text-white h-4 w-4"
              />
              <Label
                htmlFor="clear-products"
                className="text-gray-700 text-xs cursor-pointer"
              >
                Desativar produtos existentes antes de sincronizar
              </Label>
            </div>

            <Button
              onClick={handleSyncToProducts}
              disabled={loading || syncing || apiData.length === 0}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-1 h-7 text-xs font-semibold shadow-md"
            >
              {syncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-3 w-3" />
              )}
              {syncing ? 'Sincronizando...' : `Sincronizar ${apiData.length} item(s)`}
            </Button>

            {syncing && syncTotalItems > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-700 font-medium">
                  <span>Sincronizando...</span>
                  <span>{syncProcessedItems}/{syncTotalItems} ({syncProgress}%)</span>
                </div>
                <Progress value={syncProgress} className="h-2 bg-white/50" />
              </div>
            )}
          </div>
        </Card>

        {/* Data Grid Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Search Field */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          {/* Header with Export Buttons */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <Label className="text-sm font-bold text-foreground">
              Dados Armazenados 
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Exibindo {filteredData.length} de {apiData.length} registros | Total: {apiData.length})
              </span>
            </Label>
            <div className="flex gap-1 flex-wrap">
              <Button
                onClick={handleExportExcel}
                disabled={filteredData.length === 0}
                size="sm"
                className="gap-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
              >
                <FileSpreadsheet className="h-3 w-3" />
                Excel
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={filteredData.length === 0}
                size="sm"
                className="gap-1 text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md"
              >
                <FileText className="h-3 w-3" />
                CSV
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={filteredData.length === 0}
                size="sm"
                className="gap-1 text-xs h-7 bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md"
              >
                <FileDown className="h-3 w-3" />
                PDF
              </Button>
            </div>
          </div>

          {/* Table Container with Fixed Header */}
          <div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-0 bg-background">
            {filteredData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center text-sm">
                {apiData.length === 0 
                  ? 'Nenhum dado armazenado. Clique em "Processar" para importar.'
                  : 'Nenhum resultado encontrado para a busca.'}
              </div>
            ) : (
              <>
                {/* Fixed Header */}
                <div className="bg-gradient-to-r from-blue-500 via-sky-400 to-blue-400 shrink-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-0">
                        {displayColumns.map((col) => (
                          <TableHead 
                            key={col} 
                            className="text-white font-bold text-xs sm:text-sm py-2 px-2 sm:px-4 whitespace-nowrap"
                          >
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                
                {/* Scrollable Body */}
                <div 
                  id="api-table-body" 
                  className="flex-1 overflow-auto min-h-0"
                  style={{ maxHeight: 'calc(100% - 40px)' }}
                >
                  <Table>
                    <TableBody>
                      {filteredData.map((record, index) => (
                        <TableRow 
                          key={record.id} 
                          className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                        >
                          {displayColumns.map((col) => (
                            <TableCell key={col} className="text-xs sm:text-sm py-1.5 px-2 sm:px-4">
                              {typeof record.data === 'object' && record.data !== null
                                ? String((record.data as Record<string, unknown>)[col] ?? '-')
                                : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Scroll Navigation Buttons */}
                <div className="flex justify-center gap-2 py-1.5 bg-muted/50 border-t shrink-0">
                  <Button
                    onClick={scrollToTop}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-3 text-xs gap-1"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Início
                  </Button>
                  <Button
                    onClick={scrollToBottom}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-3 text-xs gap-1"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Fim
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
