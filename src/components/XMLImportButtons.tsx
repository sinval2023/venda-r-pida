import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Users, Package } from 'lucide-react';
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

export function XMLImportButtons({ onClientsImported, onProductsImported }: XMLImportButtonsProps) {
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const clientsInputRef = useRef<HTMLInputElement>(null);
  const productsInputRef = useRef<HTMLInputElement>(null);

  const parseXML = (xmlString: string): Document => {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, 'text/xml');
  };

  const handleClientsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingClients(true);
    try {
      const text = await file.text();
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
        toast({
          title: 'Nenhum cliente encontrado',
          description: 'O arquivo XML não contém clientes válidos.',
          variant: 'destructive',
        });
        return;
      }

      // Insert clients into database
      for (const client of clients) {
        const { error } = await supabase
          .from('clients')
          .upsert({
            cpf: client.cpf,
            name: client.nome,
          }, { onConflict: 'cpf' });

        if (error) {
          console.error('Error inserting client:', error);
        }
      }

      toast({
        title: 'Clientes importados',
        description: `${clients.length} cliente(s) importado(s) com sucesso.`,
      });
      
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
      if (clientsInputRef.current) {
        clientsInputRef.current.value = '';
      }
    }
  };

  const handleProductsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingProducts(true);
    try {
      const text = await file.text();
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
        toast({
          title: 'Nenhum produto encontrado',
          description: 'O arquivo XML não contém produtos válidos. Verifique a estrutura do arquivo.',
          variant: 'destructive',
        });
        return;
      }

      // Insert products into database in batches
      let successCount = 0;
      let errorCount = 0;
      
      for (const product of products) {
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

      toast({
        title: 'Produtos importados',
        description: `${successCount} produto(s) importado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`,
      });
      
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
      if (productsInputRef.current) {
        productsInputRef.current.value = '';
      }
    }
  };

  return (
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
        disabled={loadingClients}
        className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-500 hover:text-white hover:border-blue-400 transition-all duration-300"
      >
        <Users className="h-3.5 w-3.5" />
        {loadingClients ? 'Importando...' : 'XML Clientes'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => productsInputRef.current?.click()}
        disabled={loadingProducts}
        className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-purple-400 hover:to-purple-500 hover:text-white hover:border-purple-400 transition-all duration-300"
      >
        <Package className="h-3.5 w-3.5" />
        {loadingProducts ? 'Importando...' : 'XML Produtos'}
      </Button>
    </div>
  );
}
