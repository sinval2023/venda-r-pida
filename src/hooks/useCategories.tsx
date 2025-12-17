import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
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

  const addCategory = async (name: string, displayOrder: number = 0) => {
    const { error } = await supabase
      .from('categories')
      .insert({ name, display_order: displayOrder });
    
    if (!error) {
      await fetchCategories();
    }
    return { error };
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
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
