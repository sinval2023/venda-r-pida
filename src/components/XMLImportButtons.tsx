import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Package, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface XMLImportButtonsProps {
  onClientsImported?: () => void;
  onProductsImported?: () => void;
}

interface ClientXMLData {
  codigo: string;
  nome: string;
  cpf: string;
}

interface ProductXMLData {
  code: string;
  description: string;
  default_price: number;
}

interface ImportProgress {
  current: number;
  total: number;
  type: 'clients' | 'products';
}

export function XMLImportButtons({ onClientsImported, onProductsImported }: XMLImportButtonsProps) {
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const clientsInputRef = useRef<HTMLInputElement>(null);
  const productsInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  const parseXML = (xmlString: string): Document => {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, 'text/xml');
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const handleClientsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingClients(true);
    setProgress(null);
    cancelRef.current = false;
    
    let text = '';
    try {
      text = await file.text();
    } catch (readError) {
      console.error('Error reading file:', readError);
      setLoadingClients(false);
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível ler o arquivo selecionado.',
        variant: 'destructive',
      });
      if (clientsInputRef.current) clientsInputRef.current.value = '';
      return;
    }
    
    try {
      const xml = parseXML(text);
      
      const clients: ClientXMLData[] = [];
      const clientNodes = xml.querySelectorAll('cliente, CLIENTE, Client, CLIENT');
      
      clientNodes.forEach(node => {
        const codigo = node.querySelector('codigo, CODIGO, Codigo')?.textContent?.trim() || '';
        const nome = node.querySelector('nome, NOME, Nome')?.textContent?.trim() || '';
        const cpf = node.querySelector('cpf, CPF, Cpf')?.textContent?.trim() || '';
        
        if (nome && cpf) {
          clients.push({ codigo, nome: nome.toUpperCase(), cpf });
        }
      });

      if (clients.length === 0) {
        setLoadingClients(false);
        setProgress(null);
        toast({
          title: 'Nenhum cliente encontrado',
          description: 'O arquivo XML não contém clientes válidos.',
          variant: 'destructive',
        });
        if (clientsInputRef.current) clientsInputRef.current.value = '';
        return;
      }

      // Insert clients into database with progress
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < clients.length; i++) {
        if (cancelRef.current) {
          toast({
            title: 'Importação cancelada',
            description: `${successCount} cliente(s) importado(s) antes do cancelamento.`,
          });
          break;
        }
        
        const client = clients[i];
        setProgress({ current: i + 1, total: clients.length, type: 'clients' });
        
        const { error } = await supabase
          .from('clients')
          .upsert({
            cpf: client.cpf,
            name: client.nome,
          }, { onConflict: 'cpf' });

        if (error) {
          console.error('Error inserting client:', error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (!cancelRef.current) {
        toast({
          title: 'Clientes importados',
          description: `${successCount} cliente(s) importado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`,
        });
      }
      
      onClientsImported?.();
    } catch (error) {
      console.error('Error parsing XML:', error);
      toast({
        title: 'Erro ao importar',
        description: 'Não foi possível ler o arquivo XML.',
        variant: 'destructive',
      });
    } finally {
      setLoadingClients(false);
      setProgress(null);
      cancelRef.current = false;
      if (clientsInputRef.current) {
        clientsInputRef.current.value = '';
      }
    }
  };

  const handleProductsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingProducts(true);
    setProgress(null);
    cancelRef.current = false;
    
    let text = '';
    try {
      text = await file.text();
    } catch (readError) {
      console.error('Error reading file:', readError);
      setLoadingProducts(false);
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível ler o arquivo selecionado.',
        variant: 'destructive',
      });
      if (productsInputRef.current) productsInputRef.current.value = '';
      return;
    }
    
    try {
      const xml = parseXML(text);
      
      const products: ProductXMLData[] = [];
      
      // Try DATAPACKET format first (ROW elements with attributes)
      const rowNodes = xml.querySelectorAll('ROW, Row, row');
      
      if (rowNodes.length > 0) {
        // DATAPACKET format - data is in ROW attributes
        rowNodes.forEach(node => {
          const code = node.getAttribute('CODIGO') || node.getAttribute('Codigo') || node.getAttribute('codigo') || 
                       node.getAttribute('COD_BARRA') || node.getAttribute('cod_barra') || '';
          const description = node.getAttribute('DESCRICAO') || node.getAttribute('Descricao') || node.getAttribute('descricao') || '';
          const priceStr = node.getAttribute('PRECO_VENDA') || node.getAttribute('preco_venda') || 
                           node.getAttribute('PRECO') || node.getAttribute('preco') || 
                           node.getAttribute('VALOR') || node.getAttribute('valor') || '0';
          const default_price = parseFloat(priceStr.replace(',', '.')) || 0;
          
          if (code && description) {
            products.push({ code: code.trim(), description: description.trim().toUpperCase(), default_price });
          }
        });
      } else {
        // Traditional format - try produto/PRODUTO nodes with child elements
        const productNodes = xml.querySelectorAll('produto, PRODUTO, Product, PRODUCT');
        
        productNodes.forEach(node => {
          const code = node.querySelector('codigo, CODIGO, Codigo, code, CODE, Code')?.textContent?.trim() || '';
          const description = node.querySelector('descricao, DESCRICAO, Descricao, description, DESCRIPTION, Description, nome, NOME, Nome')?.textContent?.trim() || '';
          const priceStr = node.querySelector('preco, PRECO, Preco, price, PRICE, Price, valor, VALOR, Valor')?.textContent?.trim() || '0';
          const default_price = parseFloat(priceStr.replace(',', '.')) || 0;
          
          if (code && description) {
            products.push({ code, description: description.toUpperCase(), default_price });
          }
        });
      }

      if (products.length === 0) {
        setLoadingProducts(false);
        setProgress(null);
        toast({
          title: 'Nenhum produto encontrado',
          description: 'O arquivo XML não contém produtos válidos. Verifique a estrutura do arquivo.',
          variant: 'destructive',
        });
        if (productsInputRef.current) productsInputRef.current.value = '';
        return;
      }

      // Insert products into database with progress
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < products.length; i++) {
        if (cancelRef.current) {
          toast({
            title: 'Importação cancelada',
            description: `${successCount} produto(s) importado(s) antes do cancelamento.`,
          });
          break;
        }
        
        const product = products[i];
        setProgress({ current: i + 1, total: products.length, type: 'products' });
        
        const { error } = await supabase
          .from('products')
          .upsert({
            code: product.code,
            description: product.description,
            default_price: product.default_price,
          }, { onConflict: 'code' });

        if (error) {
          console.error('Error inserting product:', error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (!cancelRef.current) {
        toast({
          title: 'Produtos importados',
          description: `${successCount} produto(s) importado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`,
        });
      }
      
      onProductsImported?.();
    } catch (error) {
      console.error('Error parsing XML:', error);
      toast({
        title: 'Erro ao importar',
        description: 'Não foi possível ler o arquivo XML.',
        variant: 'destructive',
      });
    } finally {
      setLoadingProducts(false);
      setProgress(null);
      cancelRef.current = false;
      if (productsInputRef.current) {
        productsInputRef.current.value = '';
      }
    }
  };

  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={clientsInputRef}
          type="file"
          accept=".xml"
          onChange={handleClientsXML}
          className="hidden"
        />
        <input
          ref={productsInputRef}
          type="file"
          accept=".xml"
          onChange={handleProductsXML}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => clientsInputRef.current?.click()}
          disabled={loadingClients || loadingProducts}
          className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-500 hover:text-white hover:border-blue-400 transition-all duration-300"
        >
          {loadingClients ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Users className="h-3.5 w-3.5" />
          )}
          {loadingClients ? 'Importando...' : 'XML Clientes'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => productsInputRef.current?.click()}
          disabled={loadingProducts || loadingClients}
          className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-purple-400 hover:to-purple-500 hover:text-white hover:border-purple-400 transition-all duration-300"
        >
          {loadingProducts ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Package className="h-3.5 w-3.5" />
          )}
          {loadingProducts ? 'Importando...' : 'XML Produtos'}
        </Button>
      </div>
      
      {progress && (
        <div className="animate-fade-in space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Importando {progress.type === 'products' ? 'produtos' : 'clientes'}...
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {progress.current} / {progress.total} ({progressPercentage}%)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
}
