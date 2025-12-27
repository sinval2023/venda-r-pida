import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Database, Loader2, RefreshCw, Trash2, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const [apiUrl, setApiUrl] = useState('https://merrilee-unopted-dangelo.ngrok-free.dev/listadados');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<ApiDataRecord[]>([]);
  const [fetchedData, setFetchedData] = useState<unknown[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [processedItems, setProcessedItems] = useState(0);

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

  const getDataColumns = () => {
    if (apiData.length === 0) return [];
    const firstItem = apiData[0].data;
    if (typeof firstItem === 'object' && firstItem !== null) {
      return Object.keys(firstItem);
    }
    return ['valor'];
  };

  const columns = getDataColumns();

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
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://exemplo.ngrok-free.app/endpoint"
                className="bg-white/90 border-white/60 text-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleProcessData}
                disabled={loading}
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

        <div className="flex-1 overflow-hidden">
          <Label className="text-sm font-semibold mb-2 block">
            Dados Armazenados ({apiData.length} registros)
          </Label>
          
          <ScrollArea className="h-[300px] border rounded-lg">
            {apiData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado armazenado. Clique em "Processar Dados" para importar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200">
                    <TableHead className="text-white font-bold">ID</TableHead>
                    {columns.slice(0, 5).map((col) => (
                      <TableHead key={col} className="text-white font-bold">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead className="text-white font-bold">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiData.map((record) => (
                    <TableRow key={record.id} className="hover:bg-blue-50">
                      <TableCell className="font-mono text-xs">
                        {record.id.substring(0, 8)}...
                      </TableCell>
                      {columns.slice(0, 5).map((col) => (
                        <TableCell key={col} className="text-sm">
                          {typeof record.data === 'object' && record.data !== null
                            ? String((record.data as Record<string, unknown>)[col] ?? '-')
                            : String(record.data)}
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleString('pt-BR')}
                      </TableCell>
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
