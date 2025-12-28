import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, FileSpreadsheet, FileText } from "lucide-react";
import { AdminProductForm } from "./AdminProductForm";
import { AdminProductList } from "./AdminProductList";
import { useProducts, ProductWithCategory } from "@/hooks/useProducts";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProductManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsChanged?: () => void;
}

export function ProductManagementModal({ 
  open, 
  onOpenChange,
  onProductsChanged 
}: ProductManagementModalProps) {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleSaveProduct = async (productData: {
    code: string;
    description: string;
    default_price: number;
    category_id?: string;
    image_url?: string;
    barcode?: string;
    show_on_card?: boolean;
  }) => {
    try {
      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, productData);
        if (result.error) {
          return { error: result.error };
        }
        toast({ title: "Produto atualizado com sucesso!" });
        // Reset after successful save
        setEditingProduct(null);
        setSelectedProductId(null);
      } else {
        const result = await addProduct(productData);
        if (result.error) {
          return { error: result.error };
        }
        toast({ title: "Produto adicionado com sucesso!" });
      }
      onProductsChanged?.();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setSelectedProductId(product.id);
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await deleteProduct(productId);
    if (result.error) {
      toast({
        title: "Erro ao excluir produto",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Produto excluído com sucesso!" });
      if (selectedProductId === productId) {
        setSelectedProductId(null);
      }
      if (editingProduct?.id === productId) {
        setEditingProduct(null);
      }
      onProductsChanged?.();
    }
  };

  const handleSelectProduct = (product: ProductWithCategory) => {
    setSelectedProductId(product.id);
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setSelectedProductId(null);
  };

  const exportToExcel = () => {
    const exportData = products.map(p => ({
      'Código': p.code,
      'Descrição': p.description,
      'Preço': p.default_price,
      'Categoria': p.category_name || '',
      'Código de Barras': p.barcode || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'produtos.xlsx');
    toast({ title: "Exportado para Excel com sucesso!" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Lista de Produtos', 14, 20);

    const tableData = products.map(p => [
      p.code,
      p.description.substring(0, 30) + (p.description.length > 30 ? '...' : ''),
      p.default_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      p.category_name || '',
    ]);

    autoTable(doc, {
      head: [['Código', 'Descrição', 'Preço', 'Categoria']],
      body: tableData,
      startY: 30,
    });

    doc.save('produtos.pdf');
    toast({ title: "Exportado para PDF com sucesso!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Cadastro de Produtos
              </DialogTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToExcel}
                className="gap-1 text-white hover:bg-white/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToPDF}
                className="gap-1 text-white hover:bg-white/20"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
          <div>
            <AdminProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={editingProduct ? handleCancelEdit : undefined}
              onCodeSearch={handleEditProduct}
            />
          </div>
          
          <div>
            <AdminProductList
              products={products}
              loading={loading}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onSelect={handleSelectProduct}
              selectedProductId={selectedProductId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
