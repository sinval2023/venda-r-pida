import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  cpf: string;
  phone?: string | null;
  email?: string | null;
  active: boolean;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('name');

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const searchClients = (query: string): Client[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    // Remove formatting from CPF for search
    const cleanQuery = query.replace(/[.\-]/g, '');
    
    return clients.filter(
      c => c.name.toLowerCase().includes(lowerQuery) || 
           c.cpf.replace(/[.\-]/g, '').includes(cleanQuery)
    );
  };

  const getClientByCpf = (cpf: string): Client | undefined => {
    const cleanCpf = cpf.replace(/[.\-]/g, '');
    return clients.find(c => c.cpf.replace(/[.\-]/g, '') === cleanCpf);
  };

  return {
    clients,
    loading,
    searchClients,
    getClientByCpf,
    refetch: fetchClients,
  };
}
