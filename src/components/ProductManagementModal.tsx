import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminProductForm } from "./AdminProductForm";
import { AdminProductList } from "./AdminProductList";
import { useProducts, ProductWithCategory } from "@/hooks/useProducts";
import { toast } from "sonner";

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
  }) => {
    try {
      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, productData);
        if (result.error) {
          return { error: result.error };
        }
        toast.success("Produto atualizado com sucesso!");
        // Reset after successful save
        setEditingProduct(null);
        setSelectedProductId(null);
      } else {
        const result = await addProduct(productData);
        if (result.error) {
          return { error: result.error };
        }
        toast.success("Produto adicionado com sucesso!");
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
      toast.error("Erro ao excluir produto: " + result.error.message);
    } else {
      toast.success("Produto excluído com sucesso!");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro de Produtos</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div>
            <AdminProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={editingProduct ? handleCancelEdit : undefined}
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
