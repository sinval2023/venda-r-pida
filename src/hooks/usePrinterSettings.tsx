import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ReceiptTemplateType } from '@/components/receipt-templates';

export interface PrinterSettings {
  id?: string;
  user_id?: string;
  printer_name: string;
  paper_width: number;
  font_size: number;
  show_logo: boolean;
  logo_url: string | null;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  footer_message: string;
  auto_print: boolean;
  copies: number;
  receipt_template: ReceiptTemplateType;
}

const defaultSettings: PrinterSettings = {
  printer_name: 'Impressora Térmica',
  paper_width: 80,
  font_size: 12,
  show_logo: false,
  logo_url: null,
  company_name: null,
  company_address: null,
  company_phone: null,
  footer_message: 'Obrigado pela preferência!',
  auto_print: false,
  copies: 1,
  receipt_template: 'classic',
};

export function usePrinterSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrinterSettings>(defaultSettings);
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
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching printer settings:', error);
        return;
      }

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          printer_name: data.printer_name || defaultSettings.printer_name,
          paper_width: data.paper_width || defaultSettings.paper_width,
          font_size: data.font_size || defaultSettings.font_size,
          show_logo: data.show_logo || defaultSettings.show_logo,
          logo_url: data.logo_url,
          company_name: data.company_name,
          company_address: data.company_address,
          company_phone: data.company_phone,
          footer_message: data.footer_message || defaultSettings.footer_message,
          auto_print: data.auto_print || defaultSettings.auto_print,
          copies: data.copies || defaultSettings.copies,
          receipt_template: (data.receipt_template as ReceiptTemplateType) || defaultSettings.receipt_template,
        });
      }
    } catch (err) {
      console.error('Error fetching printer settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<PrinterSettings>) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    setSaving(true);
    try {
      const settingsData = {
        user_id: user.id,
        printer_name: newSettings.printer_name ?? settings.printer_name,
        paper_width: newSettings.paper_width ?? settings.paper_width,
        font_size: newSettings.font_size ?? settings.font_size,
        show_logo: newSettings.show_logo ?? settings.show_logo,
        logo_url: newSettings.logo_url ?? settings.logo_url,
        company_name: newSettings.company_name ?? settings.company_name,
        company_address: newSettings.company_address ?? settings.company_address,
        company_phone: newSettings.company_phone ?? settings.company_phone,
        footer_message: newSettings.footer_message ?? settings.footer_message,
        auto_print: newSettings.auto_print ?? settings.auto_print,
        copies: newSettings.copies ?? settings.copies,
        receipt_template: newSettings.receipt_template ?? settings.receipt_template,
      };

      const { error } = await supabase
        .from('printer_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving printer settings:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações.',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      setSettings({ ...settings, ...newSettings });
      toast({
        title: 'Configurações salvas',
        description: 'As configurações da impressora foram atualizadas.',
      });
      return { success: true };
    } catch (err: any) {
      console.error('Error saving printer settings:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    refetch: fetchSettings,
  };
}
