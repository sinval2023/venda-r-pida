import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Database, Loader2, RefreshCw, Trash2, Cloud, ArrowRightLeft, Save, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
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

  const getExportData = () => {
    return apiData.map((record) => {
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
    if (apiData.length === 0) {
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
    if (apiData.length === 0) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Cloud className="h-5 w-5 text-blue-500" />
            Integração API
          </DialogTitle>
        </DialogHeader>

        <Card className="bg-gradient-to-br from-blue-400 via-sky-300 to-blue-200 border-2 border-blue-300 shadow-lg p-4 rounded-2xl">
          <Label className="text-xs text-white/90 flex items-center gap-1 mb-2 font-semibold">
            <Database className="h-3 w-3" /> Configuração da API
          </Label>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="api-url" className="text-white/80 text-xs">
                URL da API
              </Label>
              <div className="flex gap-2">
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://exemplo.ngrok-free.app/endpoint"
                  className="bg-white/90 border-white/60 text-sm flex-1"
                />
                <Button
                  onClick={handleSaveUrl}
                  disabled={savingUrl || apiUrl === savedApiUrl}
                  size="icon"
                  variant="outline"
                  className="bg-white/90 hover:bg-white text-green-600 border-green-300 hover:border-green-400"
                  title="Salvar URL"
                >
                  {savingUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {apiUrl !== savedApiUrl && (
                <p className="text-[10px] text-white/70 mt-1">URL alterada - clique no ícone para salvar</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleProcessData}
                disabled={loading || syncing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {loading ? 'Processando...' : 'Processar Dados'}
              </Button>

              <Button
                onClick={handleClearData}
                variant="outline"
                disabled={loading || syncing}
                className="bg-white/90 hover:bg-white text-red-600 border-red-300 hover:border-red-400 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Dados
              </Button>
            </div>

            {loading && totalItems > 0 && (
              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-xs text-white/90 font-medium">
                  <span>Importando itens...</span>
                  <span>{processedItems} de {totalItems} ({progress}%)</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/30" />
              </div>
            )}
          </div>
        </Card>

        {/* Sync to Products Section */}
        <Card className="bg-gradient-to-br from-green-400 via-emerald-300 to-green-200 border-2 border-green-300 shadow-lg p-4 rounded-2xl">
          <Label className="text-xs text-white/90 flex items-center gap-1 mb-2 font-semibold">
            <ArrowRightLeft className="h-3 w-3" /> Sincronizar com Produtos
          </Label>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="clear-products"
                checked={clearProductsBeforeSync}
                onCheckedChange={(checked) => setClearProductsBeforeSync(checked === true)}
                className="border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-green-600"
              />
              <Label
                htmlFor="clear-products"
                className="text-white/90 text-sm cursor-pointer"
              >
                Desativar produtos existentes antes de sincronizar
              </Label>
            </div>

            <Button
              onClick={handleSyncToProducts}
              disabled={loading || syncing || apiData.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4" />
              )}
              {syncing ? 'Sincronizando...' : `Sincronizar ${apiData.length} item(s) para Produtos`}
            </Button>

            {syncing && syncTotalItems > 0 && (
              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-xs text-white/90 font-medium">
                  <span>Sincronizando produtos...</span>
                  <span>{syncProcessedItems} de {syncTotalItems} ({syncProgress}%)</span>
                </div>
                <Progress value={syncProgress} className="h-3 bg-white/30" />
              </div>
            )}
          </div>
        </Card>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">
              Dados Armazenados ({apiData.length} registros)
            </Label>
            <div className="flex gap-2">
              <Button
                onClick={handleExportExcel}
                disabled={apiData.length === 0}
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-7"
              >
                <FileSpreadsheet className="h-3 w-3" />
                Excel
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={apiData.length === 0}
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-7"
              >
                <FileText className="h-3 w-3" />
                CSV
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[250px] border rounded-lg">
            {apiData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado armazenado. Clique em "Processar Dados" para importar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200">
                    {displayColumns.map((col) => (
                      <TableHead key={col} className="text-white font-bold">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiData.map((record) => (
                    <TableRow key={record.id} className="hover:bg-blue-50">
                      {displayColumns.map((col) => (
                        <TableCell key={col} className="text-sm">
                          {typeof record.data === 'object' && record.data !== null
                            ? String((record.data as Record<string, unknown>)[col] ?? '-')
                            : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}