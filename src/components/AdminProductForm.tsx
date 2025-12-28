import { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/types/order';
import { useCategories } from '@/hooks/useCategories';
import { toast } from '@/hooks/use-toast';
import { ProductWithCategory } from '@/hooks/useProducts';
import { ProductImageGallery } from './ProductImageGallery';
import { useProductImages, ProductImage } from '@/hooks/useProductImages';
import { supabase } from '@/integrations/supabase/client';

interface AdminProductFormProps {
  product?: ProductWithCategory | null;
  onSave: (product: Omit<Product, 'id' | 'active'> & { category_id?: string; image_url?: string; barcode?: string; show_on_card?: boolean }) => Promise<{ error: Error | null }>;
  onCancel?: () => void;
  onCodeSearch?: (product: ProductWithCategory) => void;
}

export function AdminProductForm({ product, onSave, onCancel, onCodeSearch }: AdminProductFormProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const { getProductImages } = useProductImages();
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [defaultPrice, setDefaultPrice] = useState(product?.default_price || 0);
  const [categoryId, setCategoryId] = useState<string | undefined>(product?.category_id || undefined);
  const [showOnCard, setShowOnCard] = useState(product?.show_on_card ?? false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setCode(product.code);
      setDescription(product.description);
      setBarcode(product.barcode || '');
      setDefaultPrice(product.default_price);
      setCategoryId(product.category_id || undefined);
      setShowOnCard(product.show_on_card ?? false);
      loadProductImages(product.id);
      setPendingFiles([]);
    } else {
      setCode('');
      setDescription('');
      setBarcode('');
      setDefaultPrice(0);
      setCategoryId(undefined);
      setShowOnCard(false);
      setImages([]);
      setPendingFiles([]);
    }
  }, [product?.id]);

  const loadProductImages = async (productId: string) => {
    const productImages = await getProductImages(productId);
    setImages(productImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o código e a descrição do produto.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const primaryImage = images.find(img => img.is_primary) || images[0];
    const imageUrl = primaryImage?.image_url || product?.image_url;

    const { error } = await onSave({ 
      code, 
      description, 
      default_price: defaultPrice,
      category_id: categoryId || undefined,
      image_url: imageUrl,
      barcode: barcode.trim() || undefined,
      show_on_card: showOnCard,
    });

    if (error) {
      setLoading(false);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (pendingFiles.length > 0 && !product) {
      toast({
        title: 'Aviso',
        description: 'Para adicionar múltiplas imagens, edite o produto após criá-lo.',
      });
    }

    setLoading(false);
    toast({
      title: product ? 'Produto atualizado!' : 'Produto cadastrado!',
      description: `${code} - ${description}`,
    });

    if (!product) {
      setCode('');
      setDescription('');
      setBarcode('');
      setDefaultPrice(0);
      setCategoryId(undefined);
      setShowOnCard(false);
      setImages([]);
      setPendingFiles([]);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">
          {product ? 'Editar Produto' : 'Novo Produto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Gallery */}
          <div>
            <Label>Imagens do Produto</Label>
            <div className="mt-2">
              <ProductImageGallery
                productId={product?.id}
                images={images}
                onImagesChange={setImages}
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="Ex: PROD001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onBlur={async (e) => {
                  const searchCode = e.target.value.trim().toUpperCase();
                  if (!searchCode || product) return;
                  const { data } = await supabase
                    .from('products')
                    .select('*, categories(name)')
                    .eq('code', searchCode)
                    .eq('active', true)
                    .maybeSingle();
                  if (data) {
                    const foundProduct: ProductWithCategory = {
                      ...data,
                      category_name: data.categories?.name || null,
                    };
                    // Use setTimeout to defer state update and avoid DOM issues
                    setTimeout(() => {
                      onCodeSearch?.(foundProduct);
                    }, 0);
                    toast({ title: "Produto encontrado", description: data.description });
                  } else {
                    toast({ title: "Código não localizado", variant: "destructive" });
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                placeholder="Ex: 7891234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição do produto"
              value={description}
              onChange={(e) => setDescription(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId || ''} onValueChange={(value) => setCategoryId(value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Show on Card Checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Checkbox
              id="show-on-card"
              checked={showOnCard}
              onCheckedChange={(checked) => setShowOnCard(checked === true)}
              className="h-5 w-5 border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label
              htmlFor="show-on-card"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              Exibir no card da tela principal
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || categoriesLoading} 
              className="flex-1 bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}