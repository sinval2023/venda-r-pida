import { useRef } from 'react';
import { Printer, X, Eye, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order } from '@/types/order';
import { toast } from '@/hooks/use-toast';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import {
  ReceiptTemplateClassic,
  ReceiptTemplateModern,
  ReceiptTemplateMinimal,
  ReceiptTemplateDetailed,
  receiptTemplates,
  ReceiptTemplateType,
} from '@/components/receipt-templates';

interface ReceiptPreviewModalProps {
  order: Order;
  clientName?: string;
  open: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function ReceiptPreviewModal({ order, clientName, open, onClose, onOpenSettings }: ReceiptPreviewModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings, saveSettings } = usePrinterSettings();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(order.date);

  const currentTemplateIndex = receiptTemplates.findIndex(t => t.id === settings.receipt_template);
  const currentTemplate = receiptTemplates[currentTemplateIndex] || receiptTemplates[0];

  const handleTemplateChange = async (direction: 'prev' | 'next') => {
    let newIndex = direction === 'next' 
      ? (currentTemplateIndex + 1) % receiptTemplates.length
      : (currentTemplateIndex - 1 + receiptTemplates.length) % receiptTemplates.length;
    
    const newTemplate = receiptTemplates[newIndex].id;
    await saveSettings({ receipt_template: newTemplate });
  };

  const renderTemplate = () => {
    const templateProps = {
      order,
      clientName,
      settings,
      formatCurrency,
      date,
      time,
    };

    switch (settings.receipt_template) {
      case 'modern':
        return <ReceiptTemplateModern {...templateProps} />;
      case 'minimal':
        return <ReceiptTemplateMinimal {...templateProps} />;
      case 'detailed':
        return <ReceiptTemplateDetailed {...templateProps} />;
      case 'classic':
      default:
        return <ReceiptTemplateClassic {...templateProps} />;
    }
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a janela de impressão. Verifique se popups estão permitidos.',
        variant: 'destructive',
      });
      return;
    }

    const receiptContent = receiptRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cupom - Pedido #${order.number.toString().padStart(6, '0')}</title>
        <style>
          @page {
            size: ${settings.paper_width}mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${settings.font_size}px;
            width: ${settings.paper_width}mm;
            padding: 5mm;
            background: white;
            color: black;
          }
          .bg-gray-900, .bg-black { background-color: #111 !important; color: white !important; }
          .bg-gray-100, .bg-gray-50, .bg-gray-200 { background-color: #f5f5f5 !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-green-50 { background-color: #f0fdf4 !important; }
          .text-white { color: white !important; }
          .text-gray-300, .text-gray-400, .text-gray-500, .text-gray-600 { color: #666 !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-green-600 { color: #16a34a !important; }
          .border-gray-200, .border-gray-300, .border-gray-400 { border-color: #ddd !important; }
          .border-black { border-color: #000 !important; }
          .rounded, .rounded-lg { border-radius: 4px; }
          .font-bold { font-weight: bold; }
          .font-medium { font-weight: 500; }
          .font-light, .font-extralight { font-weight: 300; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-xs { font-size: 10px; }
          .text-sm { font-size: 12px; }
          .text-lg { font-size: 16px; }
          .text-xl { font-size: 18px; }
          .text-2xl { font-size: 20px; }
          .text-3xl { font-size: 24px; }
          .uppercase { text-transform: uppercase; }
          .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .flex { display: flex; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
          .col-span-1 { grid-column: span 1; }
          .col-span-2 { grid-column: span 2; }
          .col-span-4 { grid-column: span 4; }
          .gap-1 { gap: 4px; }
          .gap-2 { gap: 8px; }
          .gap-3 { gap: 12px; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .items-baseline { align-items: baseline; }
          .flex-1 { flex: 1; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-3 > * + * { margin-top: 12px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mt-1 { margin-top: 4px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }
          .my-2 { margin-top: 8px; margin-bottom: 8px; }
          .p-1 { padding: 4px; }
          .p-2 { padding: 8px; }
          .p-3 { padding: 12px; }
          .px-4 { padding-left: 16px; padding-right: 16px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .py-4 { padding-top: 16px; padding-bottom: 16px; }
          .pt-3 { padding-top: 12px; }
          .pt-4 { padding-top: 16px; }
          .pb-1 { padding-bottom: 4px; }
          .pb-2 { padding-bottom: 8px; }
          .pb-3 { padding-bottom: 12px; }
          .border { border: 1px solid #ddd; }
          .border-2 { border: 2px solid #ddd; }
          .border-t { border-top: 1px solid #ddd; }
          .border-b { border-bottom: 1px solid #ddd; }
          .border-r { border-right: 1px solid #ddd; }
          .border-t-2 { border-top: 2px solid #000; }
          .border-dashed { border-style: dashed; }
          .h-px { height: 1px; background: #ddd; }
          .tracking-wide { letter-spacing: 0.025em; }
          .tracking-wider { letter-spacing: 0.05em; }
          .tracking-widest { letter-spacing: 0.1em; }
          .invert { filter: invert(1); }
          .-mx-4 { margin-left: -16px; margin-right: -16px; }
          .-mt-4 { margin-top: -16px; }
          .last\\:border-0:last-child { border: 0; }
        </style>
      </head>
      <body>
        ${receiptContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();

    toast({
      title: 'Impressão iniciada',
      description: 'O cupom foi enviado para a impressora.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visualizar Cupom
          </DialogTitle>
        </DialogHeader>

        {/* Template Selector */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTemplateChange('prev')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-xs font-medium">{currentTemplate.name}</div>
            <div className="text-[10px] text-muted-foreground">{currentTemplate.description}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTemplateChange('next')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Receipt Preview Container */}
        <div className="bg-white text-black p-4 rounded-lg border-2 border-dashed border-gray-300 font-mono text-sm overflow-hidden">
          <div ref={receiptRef}>
            {renderTemplate()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="shrink-0"
              title="Configurações da impressora"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handlePrint}
            data-print-receipt
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
