import { Order } from '@/types/order';
import { PrinterSettings } from '@/hooks/usePrinterSettings';

interface ReceiptTemplateProps {
  order: Order;
  clientName?: string;
  settings: PrinterSettings;
  formatCurrency: (value: number) => string;
  date: string;
  time: string;
}

export function ReceiptTemplateDetailed({ order, clientName, settings, formatCurrency, date, time }: ReceiptTemplateProps) {
  const subtotal = order.items.reduce((acc, item) => acc + item.total, 0);
  const totalItems = order.items.length;
  const totalProducts = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Detailed Header */}
      <div className="border-2 border-black p-3 mb-4">
        <div className="text-center">
          {settings.show_logo && settings.logo_url && (
            <img 
              src={settings.logo_url} 
              alt="Logo" 
              className="h-14 mx-auto mb-2"
              style={{ maxWidth: '70%' }}
            />
          )}
          {settings.company_name && (
            <div className="text-lg font-bold border-b border-gray-300 pb-1 mb-1">{settings.company_name}</div>
          )}
          {settings.company_address && (
            <div className="text-[10px]">{settings.company_address}</div>
          )}
          {settings.company_phone && (
            <div className="text-[10px]">Tel: {settings.company_phone}</div>
          )}
        </div>
      </div>

      {/* Document Title */}
      <div className="bg-black text-white text-center py-1 mb-3">
        <div className="text-sm font-bold tracking-wider">CUPOM DE VENDA</div>
      </div>

      {/* Order Details Grid */}
      <div className="border border-gray-300 mb-3">
        <div className="grid grid-cols-2 text-xs">
          <div className="border-r border-b border-gray-300 p-2">
            <div className="text-[9px] text-gray-500 uppercase">Nº Pedido</div>
            <div className="font-bold">{order.number.toString().padStart(6, '0')}</div>
          </div>
          <div className="border-b border-gray-300 p-2">
            <div className="text-[9px] text-gray-500 uppercase">Data/Hora</div>
            <div className="font-bold">{date} {time}</div>
          </div>
          <div className="border-r border-gray-300 p-2">
            <div className="text-[9px] text-gray-500 uppercase">Vendedor</div>
            <div className="font-bold truncate">{order.vendorName}</div>
          </div>
          <div className="p-2">
            <div className="text-[9px] text-gray-500 uppercase">Cliente</div>
            <div className="font-bold truncate">{clientName || 'Consumidor Final'}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-300 mb-3">
        <div className="bg-gray-200 text-[9px] font-bold uppercase grid grid-cols-12 gap-1 p-1">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Cód</div>
          <div className="col-span-4">Descrição</div>
          <div className="col-span-1 text-center">Qtd</div>
          <div className="col-span-2 text-right">Unit</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
        {order.items.map((item, index) => (
          <div 
            key={item.id || index} 
            className={`grid grid-cols-12 gap-1 p-1 text-[10px] ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-t border-gray-200`}
          >
            <div className="col-span-1 text-gray-500">{(index + 1).toString().padStart(2, '0')}</div>
            <div className="col-span-2 font-mono">{item.code}</div>
            <div className="col-span-4 truncate" title={item.description}>{item.description}</div>
            <div className="col-span-1 text-center">{item.quantity}</div>
            <div className="col-span-2 text-right">{formatCurrency(item.unitPrice).replace('R$', '')}</div>
            <div className="col-span-2 text-right font-medium">{formatCurrency(item.total).replace('R$', '')}</div>
          </div>
        ))}
      </div>

      {/* Totals Box */}
      <div className="border-2 border-black mb-3">
        <div className="grid grid-cols-2 text-xs">
          <div className="border-r border-b border-gray-300 p-2 bg-gray-50">
            <div className="text-[9px] text-gray-500">Qtd. Itens</div>
            <div className="font-bold">{totalItems}</div>
          </div>
          <div className="border-b border-gray-300 p-2 bg-gray-50">
            <div className="text-[9px] text-gray-500">Qtd. Produtos</div>
            <div className="font-bold">{totalProducts}</div>
          </div>
          <div className="border-r border-gray-300 p-2">
            <div className="text-[9px] text-gray-500">Subtotal</div>
            <div className="font-bold">{formatCurrency(subtotal)}</div>
          </div>
          <div className="p-2 bg-black text-white">
            <div className="text-[9px] text-gray-300">TOTAL</div>
            <div className="text-lg font-bold">{formatCurrency(order.total)}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] border-t border-dashed border-gray-400 pt-3">
        <div className="font-medium mb-1">{settings.footer_message}</div>
        <div className="text-gray-400">
          Documento sem valor fiscal
        </div>
      </div>
    </>
  );
}
