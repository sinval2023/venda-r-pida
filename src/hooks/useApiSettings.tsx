import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const DEFAULT_API_URL = 'https://merrilee-unopted-dangelo.ngrok-free.dev/listadados';

export function useApiSettings() {
  const { user } = useAuth();
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('printer_settings')
        .select('api_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching API settings:', error);
        return;
      }

      if (data?.api_url) {
        setApiUrl(data.api_url);
      }
    } catch (err) {
      console.error('Error fetching API settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveApiUrl = async (newUrl: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return { success: false };
    }

    setSaving(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('printer_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from('printer_settings')
          .update({ api_url: newUrl })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new with minimal required fields
        const result = await supabase
          .from('printer_settings')
          .insert({ 
            user_id: user.id, 
            api_url: newUrl 
          });
        error = result.error;
      }

      if (error) {
        console.error('Error saving API URL:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar a URL da API.',
          variant: 'destructive',
        });
        return { success: false };
      }

      setApiUrl(newUrl);
      toast({
        title: 'URL salva',
        description: 'A URL da API foi salva nas configurações.',
      });
      return { success: true };
    } catch (err) {
      console.error('Error saving API URL:', err);
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  return {
    apiUrl,
    setApiUrl,
    loading,
    saving,
    saveApiUrl,
    refetch: fetchSettings,
  };
}
