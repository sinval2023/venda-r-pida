import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FTPHistoryEntry {
  id: string;
  order_number: number;
  filename: string;
  ftp_host: string;
  ftp_folder: string;
  file_format: string;
  order_total: number;
  items_count: number;
  created_at: string;
}

export function useFTPHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<FTPHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ftp_upload_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching FTP history:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: Omit<FTPHistoryEntry, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ftp_upload_history')
        .insert({
          user_id: user.id,
          ...entry,
        });

      if (error) throw error;
      
      // Refresh history
      await fetchHistory();
    } catch (err) {
      console.error('Error saving FTP history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return { history, loading, addEntry, refetch: fetchHistory };
}
