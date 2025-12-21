import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, UserPlus, Save, X, Upload, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Seller {
  id: string;
  code: string;
  name: string;
  password?: string;
  image_url?: string;
  api_key?: string;
  commission?: number;
  active: boolean;
}

interface SellerManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSellersChanged?: () => void;
}

export function SellerManagementModal({ open, onOpenChange, onSellersChanged }: SellerManagementModalProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [commission, setCommission] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSellers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('code');
    
    if (!error && data) {
      setSellers(data);
    }
    setLoading(false);
  };

  // Fetch sellers when modal opens - removed incorrect useState usage

  const resetForm = () => {
    setFormMode('add');
    setEditingSeller(null);
    setCode('');
    setName('');
    setPassword('');
    setApiKey('');
    setCommission(0);
    setImageUrl(null);
    setPendingFile(null);
  };

  const startEdit = (seller: Seller) => {
    setFormMode('edit');
    setEditingSeller(seller);
    setCode(seller.code);
    setName(seller.name);
    setPassword(seller.password || '');
    setApiKey(seller.api_key || '');
    setCommission(seller.commission || 0);
    setImageUrl(seller.image_url || null);
    setPendingFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `seller_${Date.now()}.${fileExt}`;
      const filePath = `sellers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Erro ao fazer upload',
          description: uploadError.message,
          variant: 'destructive',
        });
        return null;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o código e nome do vendedor.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    let finalImageUrl = imageUrl;
    
    if (pendingFile) {
      const uploadedUrl = await uploadImage(pendingFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    const sellerData = {
      code: code.toUpperCase(),
      name: name.toUpperCase(),
      password: password || null,
      api_key: apiKey.toUpperCase() || null,
      commission,
      image_url: finalImageUrl,
      active: formMode === 'add' ? true : (editingSeller?.active ?? true),
    };

    if (formMode === 'edit' && editingSeller) {
      const { error } = await supabase
        .from('sellers')
        .update(sellerData)
        .eq('id', editingSeller.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Vendedor atualizado!' });
        resetForm();
        fetchSellers();
        onSellersChanged?.();
      }
    } else {
      const { error } = await supabase
        .from('sellers')
        .insert({ ...sellerData, active: true });

      if (error) {
        toast({
          title: 'Erro ao criar vendedor',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Vendedor criado!' });
        resetForm();
        fetchSellers();
        onSellersChanged?.();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('sellers')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Vendedor excluído!' });
      if (editingSeller?.id === id) {
        resetForm();
      }
      fetchSellers();
      onSellersChanged?.();
    }
  };

  // Reload sellers when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchSellers();
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastro de Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                {formMode === 'edit' ? 'Editar Vendedor' : 'Novo Vendedor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <Label>Imagem</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {imageUrl ? (
                      <div className="relative w-24 h-24 border rounded-full overflow-hidden group">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20 h-8 w-8"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20 h-8 w-8"
                            onClick={() => {
                              setImageUrl(null);
                              setPendingFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Foto</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seller-code">Código *</Label>
                    <Input
                      id="seller-code"
                      placeholder="Ex: 1"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>

                  <div>
                    <Label htmlFor="seller-commission">Comissão (%)</Label>
                    <Input
                      id="seller-commission"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={commission}
                      onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="seller-name">Nome *</Label>
                  <Input
                    id="seller-name"
                    placeholder="Nome do vendedor"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>

                <div>
                  <Label htmlFor="seller-password">Senha</Label>
                  <Input
                    id="seller-password"
                    type="password"
                    placeholder="Senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="seller-key">Chave</Label>
                  <Input
                    id="seller-key"
                    placeholder="Chave API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>

                {/* Active/Inactive Toggle */}
                <div className="flex items-center gap-3">
                  <Label htmlFor="seller-active">Status</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formMode === 'add' || (editingSeller && editingSeller.active) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (editingSeller) {
                          setEditingSeller({ ...editingSeller, active: true });
                        }
                      }}
                      className={formMode === 'add' || (editingSeller && editingSeller.active) ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      Ativo
                    </Button>
                    <Button
                      type="button"
                      variant={editingSeller && !editingSeller.active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (editingSeller) {
                          setEditingSeller({ ...editingSeller, active: false });
                        }
                      }}
                      className={editingSeller && !editingSeller.active ? 'bg-red-600 hover:bg-red-700' : ''}
                      disabled={formMode === 'add'}
                    >
                      Inativo
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {formMode === 'edit' && (
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" disabled={saving || uploading} className="flex-1">
                    {formMode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {saving || uploading ? 'Salvando...' : formMode === 'edit' ? 'Salvar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Vendedores Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : sellers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum vendedor cadastrado
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sellers.map((seller) => (
                    <div
                      key={seller.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        editingSeller?.id === seller.id 
                          ? 'bg-primary/10 border-primary' 
                          : !seller.active
                          ? 'bg-red-50 border-red-200 opacity-60'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {/* Image thumbnail */}
                      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                        {seller.image_url ? (
                          <img
                            src={seller.image_url}
                            alt={seller.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                            {seller.code}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{seller.name}</p>
                          {!seller.active && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Código: {seller.code} | Comissão: {seller.commission || 0}%
                        </p>
                      </div>

                      <Button size="icon" variant="ghost" onClick={() => startEdit(seller)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(seller.id)} 
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}