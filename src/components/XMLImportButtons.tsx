import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, Loader2, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  type: "clients" | "products";
}

type Notice = {
  variant?: "default" | "destructive";
  title: string;
  description?: string;
};

export function XMLImportButtons({ onClientsImported, onProductsImported }: XMLImportButtonsProps) {
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Re-monta o <input type="file" /> após cada import (evita mexer em input.value e reduz bugs de DOM)
  const [clientsInputKey, setClientsInputKey] = useState(0);
  const [productsInputKey, setProductsInputKey] = useState(0);

  const cancelRef = useRef(false);

  const clientsInputId = `xml-clients-${clientsInputKey}`;
  const productsInputId = `xml-products-${productsInputKey}`;

  const resetClientsInput = () => setClientsInputKey((k) => k + 1);
  const resetProductsInput = () => setProductsInputKey((k) => k + 1);

  const parseXML = (xmlString: string): Document => {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
  };

  const ensureValidXML = (xml: Document) => {
    const parserError = xml.querySelector("parsererror");
    if (parserError) {
      throw new Error("XML inválido: verifique o arquivo selecionado.");
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const handleClientsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);
    setLoadingClients(true);
    setProgress(null);
    cancelRef.current = false;

    let shouldNotify = false;

    try {
      let text = "";
      try {
        text = await file.text();
      } catch (readError) {
        console.error("Error reading file:", readError);
        setNotice({
          variant: "destructive",
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo selecionado.",
        });
        return;
      }

      const xml = parseXML(text);
      ensureValidXML(xml);

      const clients: ClientXMLData[] = [];
      const clientNodes = xml.querySelectorAll("cliente, CLIENTE, Client, CLIENT");

      clientNodes.forEach((node) => {
        const codigo = node.querySelector("codigo, CODIGO, Codigo")?.textContent?.trim() || "";
        const nome = node.querySelector("nome, NOME, Nome")?.textContent?.trim() || "";
        const cpf = node.querySelector("cpf, CPF, Cpf")?.textContent?.trim() || "";

        if (nome && cpf) {
          clients.push({ codigo, nome: nome.toUpperCase(), cpf });
        }
      });

      if (clients.length === 0) {
        setNotice({
          variant: "destructive",
          title: "Nenhum cliente encontrado",
          description: "O arquivo XML não contém clientes válidos.",
        });
        return;
      }

      const chunkSize = 200;
      let successCount = 0;

      for (let start = 0; start < clients.length; start += chunkSize) {
        if (cancelRef.current) {
          setNotice({
            title: "Importação cancelada",
            description: `${successCount} cliente(s) importado(s) antes do cancelamento.`,
          });
          break;
        }

        const end = Math.min(start + chunkSize, clients.length);
        setProgress({ current: end, total: clients.length, type: "clients" });

        const batch = clients.slice(start, end).map((c) => ({
          cpf: c.cpf,
          name: c.nome,
        }));

        const { error } = await supabase.from("clients").upsert(batch, { onConflict: "cpf" });

        if (error) {
          console.error("Error inserting clients batch:", error);
          throw error;
        }

        successCount += batch.length;
      }

      if (!cancelRef.current) {
        setNotice({
          title: "Clientes importados",
          description: `${successCount} cliente(s) importado(s) com sucesso.`,
        });
        shouldNotify = successCount > 0;
      }
    } catch (error) {
      console.error("Error importing clients XML:", error);
      setNotice({
        variant: "destructive",
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Não foi possível ler o arquivo XML.",
      });
    } finally {
      setLoadingClients(false);
      setProgress(null);
      cancelRef.current = false;
      resetClientsInput();

      if (shouldNotify) {
        // Deixa a UI assentar antes do refetch
        setTimeout(() => onClientsImported?.(), 0);
      }
    }
  };

  const handleProductsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);
    setLoadingProducts(true);
    setProgress(null);
    cancelRef.current = false;

    let shouldNotify = false;

    try {
      let text = "";
      try {
        text = await file.text();
      } catch (readError) {
        console.error("Error reading file:", readError);
        setNotice({
          variant: "destructive",
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo selecionado.",
        });
        return;
      }

      const xml = parseXML(text);
      ensureValidXML(xml);

      const products: ProductXMLData[] = [];

      // Try DATAPACKET format first (ROW elements with attributes)
      const rowNodes = xml.querySelectorAll("ROW, Row, row");

      if (rowNodes.length > 0) {
        rowNodes.forEach((node) => {
          const code =
            node.getAttribute("CODIGO") ||
            node.getAttribute("Codigo") ||
            node.getAttribute("codigo") ||
            node.getAttribute("COD_BARRA") ||
            node.getAttribute("cod_barra") ||
            "";

          const description =
            node.getAttribute("DESCRICAO") || node.getAttribute("Descricao") || node.getAttribute("descricao") || "";

          const priceStr =
            node.getAttribute("PRECO_VENDA") ||
            node.getAttribute("preco_venda") ||
            node.getAttribute("PRECO") ||
            node.getAttribute("preco") ||
            node.getAttribute("VALOR") ||
            node.getAttribute("valor") ||
            "0";

          const default_price = parseFloat(priceStr.replace(",", ".")) || 0;

          if (code && description) {
            products.push({
              code: code.trim(),
              description: description.trim().toUpperCase(),
              default_price,
            });
          }
        });
      } else {
        // Traditional format - try produto/PRODUTO nodes with child elements
        const productNodes = xml.querySelectorAll("produto, PRODUTO, Product, PRODUCT");

        productNodes.forEach((node) => {
          const code =
            node.querySelector("codigo, CODIGO, Codigo, code, CODE, Code")?.textContent?.trim() || "";

          const description =
            node
              .querySelector(
                "descricao, DESCRICAO, Descricao, description, DESCRIPTION, Description, nome, NOME, Nome",
              )
              ?.textContent?.trim() || "";

          const priceStr =
            node.querySelector("preco, PRECO, Preco, price, PRICE, Price, valor, VALOR, Valor")?.textContent?.trim() ||
            "0";

          const default_price = parseFloat(priceStr.replace(",", ".")) || 0;

          if (code && description) {
            products.push({ code, description: description.toUpperCase(), default_price });
          }
        });
      }

      if (products.length === 0) {
        setNotice({
          variant: "destructive",
          title: "Nenhum produto encontrado",
          description: "O arquivo XML não contém produtos válidos. Verifique a estrutura do arquivo.",
        });
        return;
      }

      const chunkSize = 200;
      let successCount = 0;

      for (let start = 0; start < products.length; start += chunkSize) {
        if (cancelRef.current) {
          setNotice({
            title: "Importação cancelada",
            description: `${successCount} produto(s) importado(s) antes do cancelamento.`,
          });
          break;
        }

        const end = Math.min(start + chunkSize, products.length);
        setProgress({ current: end, total: products.length, type: "products" });

        const batch = products.slice(start, end).map((p) => ({
          code: p.code,
          description: p.description,
          default_price: p.default_price,
        }));

        const { error } = await supabase.from("products").upsert(batch, { onConflict: "code" });

        if (error) {
          console.error("Error inserting products batch:", error);
          throw error;
        }

        successCount += batch.length;
      }

      if (!cancelRef.current) {
        setNotice({
          title: "Produtos importados",
          description: `${successCount} produto(s) importado(s) com sucesso.`,
        });
        shouldNotify = successCount > 0;
      }
    } catch (error) {
      console.error("Error importing products XML:", error);
      setNotice({
        variant: "destructive",
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Não foi possível ler o arquivo XML.",
      });
    } finally {
      setLoadingProducts(false);
      setProgress(null);
      cancelRef.current = false;
      resetProductsInput();

      if (shouldNotify) {
        setTimeout(() => onProductsImported?.(), 0);
      }
    }
  };

  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          key={clientsInputKey}
          id={clientsInputId}
          type="file"
          accept=".xml"
          onChange={handleClientsXML}
          className="hidden"
        />
        <input
          key={productsInputKey}
          id={productsInputId}
          type="file"
          accept=".xml"
          onChange={handleProductsXML}
          className="hidden"
        />

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-500 hover:text-white hover:border-blue-400 transition-all duration-300"
        >
          <label
            htmlFor={clientsInputId}
            onClick={(e) => {
              if (loadingClients || loadingProducts) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={loadingClients || loadingProducts ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={loadingClients || loadingProducts}
          >
            {loadingClients ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            {loadingClients ? "Importando..." : "XML Clientes"}
          </label>
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-purple-400 hover:to-purple-500 hover:text-white hover:border-purple-400 transition-all duration-300"
        >
          <label
            htmlFor={productsInputId}
            onClick={(e) => {
              if (loadingProducts || loadingClients) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={loadingProducts || loadingClients ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={loadingProducts || loadingClients}
          >
            {loadingProducts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
            {loadingProducts ? "Importando..." : "XML Produtos"}
          </label>
        </Button>
      </div>

      {notice && (
        <Alert variant={notice.variant} className="py-3">
          <AlertTitle className="flex items-center justify-between">
            <span>{notice.title}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertTitle>
          {notice.description && (
            <AlertDescription>
              <p>{notice.description}</p>
            </AlertDescription>
          )}
        </Alert>
      )}

      {progress && (
        <div className="animate-fade-in space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Importando {progress.type === "products" ? "produtos" : "clientes"}...</span>
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
