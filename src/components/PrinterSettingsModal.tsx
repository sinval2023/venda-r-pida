import { useState, useEffect } from 'react';
import { Printer, Save, Loader2, Settings2, Building, Phone, MapPin, FileText, Hash, Type, Image, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrinterSettings, PrinterSettings } from '@/hooks/usePrinterSettings';
import { receiptTemplates, ReceiptTemplateType } from '@/components/receipt-templates';

interface PrinterSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrinterSettingsModal({ open, onClose }: PrinterSettingsModalProps) {
  const { settings, loading, saving, saveSettings } = usePrinterSettings();
  const [formData, setFormData] = useState<PrinterSettings>(settings);

  useEffect(() => {
    if (open) {
      setFormData(settings);
    }
  }, [open, settings]);

  const handleSave = async () => {
    const result = await saveSettings(formData);
    if (result.success) {
      onClose();
    }
  };

  const handleChange = (field: keyof PrinterSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Configurações da Impressora Térmica
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Template do Cupom
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {receiptTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleChange('receipt_template', template.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.receipt_template === template.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Printer Settings */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Configurações de Impressão
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="printer_name" className="text-xs flex items-center gap-1">
                  <Printer className="h-3 w-3" />
                  Nome da Impressora
                </Label>
                <Input
                  id="printer_name"
                  value={formData.printer_name}
                  onChange={(e) => handleChange('printer_name', e.target.value)}
                  placeholder="Impressora Térmica"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paper_width" className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Largura do Papel (mm)
                </Label>
                <Select
                  value={formData.paper_width.toString()}
                  onValueChange={(value) => handleChange('paper_width', parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm</SelectItem>
                    <SelectItem value="80">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="font_size" className="text-xs flex items-center gap-1">
                  <Type className="h-3 w-3" />
                  Tamanho da Fonte
                </Label>
                <Select
                  value={formData.font_size.toString()}
                  onValueChange={(value) => handleChange('font_size', parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10px (Pequeno)</SelectItem>
                    <SelectItem value="12">12px (Normal)</SelectItem>
                    <SelectItem value="14">14px (Grande)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="copies" className="text-xs flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Número de Cópias
                </Label>
                <Select
                  value={formData.copies.toString()}
                  onValueChange={(value) => handleChange('copies', parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 cópia</SelectItem>
                    <SelectItem value="2">2 cópias</SelectItem>
                    <SelectItem value="3">3 cópias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div>
                <Label htmlFor="auto_print" className="text-sm font-medium">Impressão Automática</Label>
                <p className="text-xs text-muted-foreground">Imprimir automaticamente após finalizar pedido</p>
              </div>
              <Switch
                id="auto_print"
                checked={formData.auto_print}
                onCheckedChange={(checked) => handleChange('auto_print', checked)}
              />
            </div>
          </Card>

          {/* Company Info */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Dados da Empresa (Cabeçalho do Cupom)
            </h3>

            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div>
                <Label htmlFor="show_logo" className="text-sm font-medium flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Mostrar Logo
                </Label>
                <p className="text-xs text-muted-foreground">Exibir logo no cabeçalho do cupom</p>
              </div>
              <Switch
                id="show_logo"
                checked={formData.show_logo}
                onCheckedChange={(checked) => handleChange('show_logo', checked)}
              />
            </div>

            {formData.show_logo && (
              <div>
                <Label htmlFor="logo_url" className="text-xs">URL do Logo</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url || ''}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="company_name" className="text-xs flex items-center gap-1">
                <Building className="h-3 w-3" />
                Nome da Empresa
              </Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => handleChange('company_name', e.target.value.toUpperCase())}
                placeholder="NOME DA EMPRESA"
                className="mt-1 uppercase"
              />
            </div>

            <div>
              <Label htmlFor="company_address" className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Endereço
              </Label>
              <Input
                id="company_address"
                value={formData.company_address || ''}
                onChange={(e) => handleChange('company_address', e.target.value.toUpperCase())}
                placeholder="RUA EXEMPLO, 123 - BAIRRO"
                className="mt-1 uppercase"
              />
            </div>

            <div>
              <Label htmlFor="company_phone" className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Telefone
              </Label>
              <Input
                id="company_phone"
                value={formData.company_phone || ''}
                onChange={(e) => handleChange('company_phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1"
              />
            </div>
          </Card>

          {/* Footer Message */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mensagem de Rodapé
            </h3>

            <Textarea
              value={formData.footer_message}
              onChange={(e) => handleChange('footer_message', e.target.value)}
              placeholder="Obrigado pela preferência!"
              className="resize-none"
              rows={2}
            />
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
