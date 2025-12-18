import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/order';

export interface ProductWithCategory extends Product {
  category_id?: string | null;
  category_name?: string;
  image_url?: string | null;
}

export function useProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('active', true)
      .order('code');

    if (!error && data) {
      setProducts(data.map(p => ({
        id: p.id,
        code: p.code,
        description: p.description,
        default_price: Number(p.default_price),
        active: p.active,
        category_id: p.category_id,
        category_name: p.categories?.name || 'Sem categoria',
        image_url: p.image_url,
      })));
    }
    setLoading(false);
  };

  const searchProducts = (query: string) => {
    if (!query.trim()) return products;
    const lowerQuery = query.toLowerCase();
    return products.filter(
      p => p.code.toLowerCase().includes(lowerQuery) || 
           p.description.toLowerCase().includes(lowerQuery)
    );
  };

  const addProduct = async (product: Omit<Product, 'id' | 'active'> & { category_id?: string; image_url?: string }) => {
    const { error } = await supabase
      .from('products')
      .insert({
        code: product.code,
        description: product.description,
        default_price: product.default_price,
        category_id: product.category_id || null,
        image_url: product.image_url || null,
      });
    
    if (!error) {
      await fetchProducts();
    }
    return { error };
  };

  const updateProduct = async (id: string, product: Partial<Product> & { category_id?: string; image_url?: string | null }) => {
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id);
    
    if (!error) {
      await fetchProducts();
    }
    return { error };
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);
    
    if (!error) {
      await fetchProducts();
    }
    return { error };
  };

  const getProductsByCategory = () => {
    const grouped: { [key: string]: ProductWithCategory[] } = {};
    
    products.forEach(product => {
      const categoryName = product.category_name || 'Sem categoria';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(product);
    });

    return grouped;
  };

  return {
    products,
    loading,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    refetch: fetchProducts,
  };
}
