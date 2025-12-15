import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/order';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('code');

    if (!error && data) {
      setProducts(data.map(p => ({
        id: p.id,
        code: p.code,
        description: p.description,
        default_price: Number(p.default_price),
        active: p.active,
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

  const addProduct = async (product: Omit<Product, 'id' | 'active'>) => {
    const { error } = await supabase
      .from('products')
      .insert({
        code: product.code,
        description: product.description,
        default_price: product.default_price,
      });
    
    if (!error) {
      await fetchProducts();
    }
    return { error };
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
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

  return {
    products,
    loading,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
