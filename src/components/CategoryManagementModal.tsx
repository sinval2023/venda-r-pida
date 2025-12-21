import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2, FolderOpen, Save, X, Upload, Image } from 'lucide-react';
import { useCategories, Category } from '@/hooks/useCategories';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManagementModal({ open, onOpenChange }: CategoryManagementModalProps) {
  const { categories, loading, addCategory, updateCategory, deleteCategory, refetch } = useCategories();
  
  // Form state
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormMode('add');
    setEditingCategory(null);
    setName('');
    setCode('');
    setImageUrl(null);
    setPendingFile(null);
  };

  const startEdit = (category: Category) => {
    setFormMode('edit');
    setEditingCategory(category);
    setName(category.name);
    setCode(category.code || '');
    setImageUrl(category.image_url || null);
    setPendingFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      // Create preview
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category_${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

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
    if (!name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome da categoria.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    let finalImageUrl = imageUrl;
    
    // Upload pending file if exists
    if (pendingFile) {
      const uploadedUrl = await uploadImage(pendingFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    if (formMode === 'edit' && editingCategory) {
      const { error } = await updateCategory(editingCategory.id, {
        name,
        code: code.trim() || null,
        image_url: finalImageUrl,
      });

      if (error) {
        toast({
          title: 'Erro ao atualizar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Categoria atualizada!' });
        resetForm();
      }
    } else {
      const { error } = await addCategory({
        name,
        code: code.trim() || undefined,
        image_url: finalImageUrl || undefined,
      });

      if (error) {
        toast({
          title: 'Erro ao criar categoria',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Categoria criada!' });
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteCategory(id);
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Categoria excluída!' });
      if (editingCategory?.id === id) {
        resetForm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Cadastro de Categorias
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="shadow-md" key={editingCategory?.id || 'new'}>
            <CardHeader>
              <CardTitle className="text-lg">
                {formMode === 'edit' ? 'Editar Categoria' : 'Nova Categoria'}
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
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
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
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20"
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
                        className="w-32 h-32 flex flex-col items-center justify-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Adicionar</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cat-code">Código</Label>
                  <Input
                    id="cat-code"
                    placeholder="Ex: CAT001"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <Label htmlFor="cat-name">Descrição *</Label>
                  <Input
                    id="cat-name"
                    placeholder="Nome da categoria"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
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
              <CardTitle className="text-lg">Categorias Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhuma categoria cadastrada
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        editingCategory?.id === category.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {/* Image thumbnail */}
                      <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{category.name}</p>
                        {category.code && (
                          <p className="text-xs text-muted-foreground">{category.code}</p>
                        )}
                      </div>

                      <Button size="icon" variant="ghost" onClick={() => startEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(category.id)} 
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