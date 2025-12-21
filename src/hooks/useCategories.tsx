import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  code?: string | null;
  image_url?: string | null;
  display_order: number;
  active: boolean;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('display_order');

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const addCategory = async (category: { name: string; code?: string; image_url?: string; display_order?: number }) => {
    const { error } = await supabase
      .from('categories')
      .insert({ 
        name: category.name, 
        code: category.code || null,
        image_url: category.image_url || null,
        display_order: category.display_order ?? categories.length 
      });
    
    if (!error) {
      await fetchCategories();
    }
    return { error };
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    const { error } = await supabase
      .from('categories')
      .update({
        ...updates,
        code: updates.code ?? undefined,
        image_url: updates.image_url ?? undefined,
      })
      .eq('id', id);
    
    if (!error) {
      await fetchCategories();
    }
    return { error };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ active: false })
      .eq('id', id);
    
    if (!error) {
      await fetchCategories();
    }
    return { error };
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
