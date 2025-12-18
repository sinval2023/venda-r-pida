import { useState, useEffect, useRef } from 'react';
import { Plus, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types/order';
import { useCategories } from '@/hooks/useCategories';
import { toast } from '@/hooks/use-toast';
import { ProductWithCategory } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';

interface AdminProductFormProps {
  product?: ProductWithCategory;
  onSave: (product: Omit<Product, 'id' | 'active'> & { category_id?: string; image_url?: string }) => Promise<{ error: Error | null }>;
  onCancel?: () => void;
}

export function AdminProductForm({ product, onSave, onCancel }: AdminProductFormProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  const [defaultPrice, setDefaultPrice] = useState(product?.default_price || 0);
  const [categoryId, setCategoryId] = useState<string | undefined>(product?.category_id || undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(product?.image_url || undefined);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setCode(product.code);
      setDescription(product.description);
      setDefaultPrice(product.default_price);
      setCategoryId(product.category_id || undefined);
      setImageUrl(product.image_url || undefined);
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: 'Imagem carregada!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar imagem',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    const { error } = await onSave({ 
      code, 
      description, 
      default_price: defaultPrice,
      category_id: categoryId || undefined,
      image_url: imageUrl,
    });
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: product ? 'Produto atualizado!' : 'Produto cadastrado!',
        description: `${code} - ${description}`,
      });
      if (!product) {
        setCode('');
        setDescription('');
        setDefaultPrice(0);
        setCategoryId(undefined);
        setImageUrl(undefined);
      }
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
          {/* Image Upload */}
          <div>
            <Label>Imagem do Produto</Label>
            <div className="mt-2">
              {imageUrl ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  {uploading ? (
                    <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-1" />
                      <span className="text-xs text-muted-foreground">Clique para adicionar</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              placeholder="Ex: PROD001"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição do produto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId || ''} onValueChange={(value) => setCategoryId(value || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
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
            <Label htmlFor="price">Preço Padrão</Label>
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

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading || categoriesLoading || uploading} className="flex-1">
              {product ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {loading ? 'Salvando...' : product ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
