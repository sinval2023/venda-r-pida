import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Seller {
  id: string;
  code: string;
  name: string;
  active: boolean;
  image_url?: string | null;
  password?: string | null;
  api_key?: string | null;
  commission?: number | null;
}

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('active', true)
      .order('code');

    if (!error && data) {
      setSellers(data);
    }
    setLoading(false);
  };

  const getSellerByCode = (code: string): Seller | undefined => {
    return sellers.find(s => s.code.toLowerCase() === code.toLowerCase());
  };

  return {
    sellers,
    loading,
    getSellerByCode,
    refetch: fetchSellers,
  };
}
