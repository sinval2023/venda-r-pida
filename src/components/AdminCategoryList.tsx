import { useState } from 'react';
import { Plus, Trash2, Edit2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories, Category } from '@/hooks/useCategories';
import { toast } from '@/hooks/use-toast';

export function AdminCategoryList() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    
    setSaving(true);
    const { error } = await addCategory(newCategoryName, categories.length);
    setSaving(false);

    if (error) {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Categoria criada!' });
      setNewCategoryName('');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    
    setSaving(true);
    const { error } = await updateCategory(id, { name: editingName });
    setSaving(false);

    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Categoria atualizada!' });
      setEditingId(null);
      setEditingName('');
    }
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
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={saving || !newCategoryName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Category list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhuma categoria cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
              >
                {editingId === category.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleUpdate(category.id)} disabled={saving}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{category.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(category)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(category.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}