import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Loader2, Users, X, ClipboardEdit, FolderOpen, MoreHorizontal, TrendingUp, BarChart3, History, UserPlus, ShoppingBag, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductManagementModal } from "./ProductManagementModal";
import { CategoryManagementModal } from "./CategoryManagementModal";
import { ClientManagementModal } from "./ClientManagementModal";
import { ClientOrdersModal } from "./ClientOrdersModal";
import { ApiDataModal } from "./ApiDataModal";
import { Client } from "@/hooks/useClients";

interface XMLImportButtonsProps {
  onClientsImported?: () => void;
  onProductsImported?: () => void;
  onShowHistory?: () => void;
  selectedClient?: Client | null;
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

export function XMLImportButtons({ onClientsImported, onProductsImported, onShowHistory, selectedClient }: XMLImportButtonsProps) {
  const navigate = useNavigate();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientOrdersModalOpen, setClientOrdersModalOpen] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [clearData, setClearData] = useState(false);

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
    setProgress({ current: 0, total: 1, type: "clients" });
    cancelRef.current = false;

    try {
      const text = await file.text();
      setProgress({ current: 1, total: 1, type: "clients" });

      const { data, error } = await supabase.functions.invoke("import-xml", {
        body: { type: "clients", xml: text, clearData },
      });

      if (error) {
        console.error("Import clients function error:", error);
        throw error;
      }

      if (!data?.success) {
        setNotice({
          variant: "destructive",
          title: "Erro ao importar",
          description: data?.error || "Não foi possível importar os clientes.",
        });
        return;
      }

      setNotice({
        title: "Clientes importados",
        description: `${data.total ?? 0} cliente(s) processado(s) com sucesso.`,
      });

      setTimeout(() => onClientsImported?.(), 0);
    } catch (err) {
      console.error("Error importing clients XML:", err);
      setNotice({
        variant: "destructive",
        title: "Erro ao importar",
        description: err instanceof Error ? err.message : "Não foi possível importar os clientes.",
      });
    } finally {
      setLoadingClients(false);
      setProgress(null);
      cancelRef.current = false;
      resetClientsInput();
    }
  };

  const handleProductsXML = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);
    setLoadingProducts(true);
    setProgress({ current: 0, total: 1, type: "products" });
    cancelRef.current = false;

    try {
      const text = await file.text();
      setProgress({ current: 1, total: 1, type: "products" });

      const { data, error } = await supabase.functions.invoke("import-xml", {
        body: { type: "products", xml: text, clearData },
      });

      if (error) {
        console.error("Import products function error:", error);
        throw error;
      }

      if (!data?.success) {
        setNotice({
          variant: "destructive",
          title: "Erro ao importar",
          description: data?.error || "Não foi possível importar os produtos.",
        });
        return;
      }

      setNotice({
        title: "Produtos importados",
        description: `${data.total ?? 0} produto(s) processado(s) com sucesso.`,
      });

      setTimeout(() => onProductsImported?.(), 0);
    } catch (err) {
      console.error("Error importing products XML:", err);
      setNotice({
        variant: "destructive",
        title: "Erro ao importar",
        description: err instanceof Error ? err.message : "Não foi possível importar os produtos.",
      });
    } finally {
      setLoadingProducts(false);
      setProgress(null);
      cancelRef.current = false;
      resetProductsInput();
    }
  };

  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <input
        key={`clients-${clientsInputKey}`}
        id={clientsInputId}
        type="file"
        accept=".xml"
        onChange={handleClientsXML}
        className="hidden"
      />
      <input
        key={`products-${productsInputKey}`}
        id={productsInputId}
        type="file"
        accept=".xml"
        onChange={handleProductsXML}
        className="hidden"
      />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className="gap-2 text-sm font-semibold px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] transition-all duration-300 shadow-md"
          >
            <MoreHorizontal className="h-4 w-4" />
            Mais Opções
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="clear-data"
                checked={clearData}
                onCheckedChange={(checked) => setClearData(checked === true)}
                disabled={loadingClients || loadingProducts}
              />
              <Label
                htmlFor="clear-data"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                Limpar dados antes de importar
              </Label>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-emerald-400 hover:to-teal-500 hover:text-white hover:border-emerald-400 transition-all duration-300"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Painel
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/relatorios')}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-500 hover:text-white hover:border-blue-400 transition-all duration-300"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Relatórios
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowHistory?.()}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-orange-400 hover:to-amber-500 hover:text-white hover:border-orange-400 transition-all duration-300"
              >
                <History className="h-3.5 w-3.5" />
                Histórico
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientModalOpen(true)}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-pink-400 hover:to-rose-500 hover:text-white hover:border-pink-400 transition-all duration-300"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Clientes
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientOrdersModalOpen(true)}
                disabled={!selectedClient}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-cyan-400 hover:to-sky-500 hover:text-white hover:border-cyan-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!selectedClient ? "Selecione um cliente primeiro" : "Ver pedidos do cliente"}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Pedidos Cliente
              </Button>

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductModalOpen(true)}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-emerald-400 hover:to-teal-500 hover:text-white hover:border-emerald-400 transition-all duration-300"
              >
                <ClipboardEdit className="h-3.5 w-3.5" />
                Produtos
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setApiModalOpen(true)}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-sky-400 hover:to-blue-500 hover:text-white hover:border-sky-400 transition-all duration-300"
              >
                <Cloud className="h-3.5 w-3.5" />
                API
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryModalOpen(true)}
                className="gap-1.5 text-xs font-semibold hover:bg-gradient-to-r hover:from-amber-400 hover:to-orange-500 hover:text-white hover:border-amber-400 transition-all duration-300"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Categorias
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ProductManagementModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onProductsChanged={onProductsImported}
      />

      <CategoryManagementModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
      />

      <ClientManagementModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        onClientsChanged={onClientsImported}
      />

      <ApiDataModal
        open={apiModalOpen}
        onOpenChange={setApiModalOpen}
      />

      {selectedClient && (
        <ClientOrdersModal
          open={clientOrdersModalOpen}
          onOpenChange={setClientOrdersModalOpen}
          client={selectedClient}
        />
      )}

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
