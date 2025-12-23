import { useRef } from 'react';
import { Printer, X, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order } from '@/types/order';
import { toast } from '@/hooks/use-toast';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';

interface ReceiptPreviewModalProps {
  order: Order;
  clientName?: string;
  open: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function ReceiptPreviewModal({ order, clientName, open, onClose, onOpenSettings }: ReceiptPreviewModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings } = usePrinterSettings();

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

  const handlePrint = () => {
    if (!receiptRef.current) return;

    // Create a new window for printing with thermal printer styling
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
          .receipt-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .receipt-info {
            font-size: 11px;
          }
          .receipt-section {
            margin-bottom: 8px;
          }
          .receipt-section-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .receipt-items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin: 8px 0;
          }
          .receipt-item {
            margin-bottom: 6px;
            font-size: 10px;
          }
          .receipt-item-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .receipt-item-detail {
            display: flex;
            justify-content: space-between;
            padding-left: 8px;
            color: #333;
          }
          .receipt-total {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            padding-top: 8px;
            border-top: 2px solid #000;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 12px;
            font-size: 10px;
            color: #666;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
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

        {/* Receipt Preview Container */}
        <div className="bg-white text-black p-4 rounded-lg border-2 border-dashed border-gray-300 font-mono text-sm">
          <div ref={receiptRef}>
            {/* Company Header */}
            {(settings.company_name || settings.show_logo) && (
              <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                {settings.show_logo && settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="h-12 mx-auto mb-1"
                    style={{ maxWidth: '60%' }}
                  />
                )}
                {settings.company_name && (
                  <div className="text-sm font-bold">{settings.company_name}</div>
                )}
                {settings.company_address && (
                  <div className="text-[10px] text-gray-600">{settings.company_address}</div>
                )}
                {settings.company_phone && (
                  <div className="text-[10px] text-gray-600">{settings.company_phone}</div>
                )}
              </div>
            )}

            {/* Order Header */}
            <div className="receipt-header text-center border-b border-dashed border-gray-400 pb-2 mb-2">
              <div className="receipt-title text-lg font-bold">CUPOM DE VENDA</div>
              <div className="receipt-info text-xs text-gray-600">
                Pedido #{order.number.toString().padStart(6, '0')}
              </div>
            </div>

            {/* Date/Time */}
            <div className="receipt-section mb-3">
              <div className="receipt-row flex justify-between text-xs">
                <span>Data: {date}</span>
                <span>Hora: {time}</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="receipt-section mb-3">
              <div className="receipt-section-title text-xs font-bold uppercase mb-1">Vendedor</div>
              <div className="text-xs">{order.vendorName}</div>
            </div>

            {/* Client Info */}
            {clientName && (
              <div className="receipt-section mb-3">
                <div className="receipt-section-title text-xs font-bold uppercase mb-1">Cliente</div>
                <div className="text-xs">{clientName}</div>
              </div>
            )}

            <div className="divider border-t border-dashed border-gray-400 my-2" />

            {/* Items Header */}
            <div className="receipt-items">
              <div className="grid grid-cols-12 gap-1 text-xs font-bold mb-2 border-b border-gray-300 pb-1">
                <div className="col-span-2">CÓD</div>
                <div className="col-span-4">DESC</div>
                <div className="col-span-2 text-center">QTD</div>
                <div className="col-span-2 text-right">UNIT</div>
                <div className="col-span-2 text-right">TOTAL</div>
              </div>

              {/* Items */}
              {order.items.map((item, index) => (
                <div key={item.id || index} className="receipt-item mb-2">
                  <div className="grid grid-cols-12 gap-1 text-xs">
                    <div className="col-span-2 truncate font-medium">{item.code}</div>
                    <div className="col-span-4 truncate" title={item.description}>
                      {item.description.length > 15 
                        ? item.description.substring(0, 15) + '...' 
                        : item.description}
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-2 text-right">{formatCurrency(item.unitPrice).replace('R$', '')}</div>
                    <div className="col-span-2 text-right font-medium">{formatCurrency(item.total).replace('R$', '')}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider border-t-2 border-black my-2" />

            {/* Total */}
            <div className="receipt-total text-right">
              <div className="text-xs text-gray-600">TOTAL DO PEDIDO</div>
              <div className="text-xl font-bold">{formatCurrency(order.total)}</div>
            </div>

            {/* Footer */}
            <div className="receipt-footer text-center mt-4 text-xs text-gray-500">
              <div className="divider border-t border-dashed border-gray-400 my-2" />
              <div>{settings.footer_message}</div>
              <div className="text-[10px] mt-1">
                Qtd. Itens: {order.items.length} | 
                Qtd. Produtos: {order.items.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
            </div>
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
