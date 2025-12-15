import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types/order';
import { toast } from '@/hooks/use-toast';

interface AdminProductFormProps {
  product?: Product;
  onSave: (product: Omit<Product, 'id' | 'active'>) => Promise<{ error: Error | null }>;
  onCancel?: () => void;
}

export function AdminProductForm({ product, onSave, onCancel }: AdminProductFormProps) {
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  const [defaultPrice, setDefaultPrice] = useState(product?.default_price || 0);
  const [loading, setLoading] = useState(false);

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
    const { error } = await onSave({ code, description, default_price: defaultPrice });
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
            <Button type="submit" disabled={loading} className="flex-1">
              {product ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {loading ? 'Salvando...' : product ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
