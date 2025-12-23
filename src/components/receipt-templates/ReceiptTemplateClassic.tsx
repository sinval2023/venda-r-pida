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

export function ReceiptTemplateClassic({ order, clientName, settings, formatCurrency, date, time }: ReceiptTemplateProps) {
  return (
    <>
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
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <div className="text-lg font-bold">CUPOM DE VENDA</div>
        <div className="text-xs text-gray-600">
          Pedido #{order.number.toString().padStart(6, '0')}
        </div>
      </div>

      {/* Date/Time */}
      <div className="mb-3">
        <div className="flex justify-between text-xs">
          <span>Data: {date}</span>
          <span>Hora: {time}</span>
        </div>
      </div>

      {/* Seller Info */}
      <div className="mb-3">
        <div className="text-xs font-bold uppercase mb-1">Vendedor</div>
        <div className="text-xs">{order.vendorName}</div>
      </div>

      {/* Client Info */}
      {clientName && (
        <div className="mb-3">
          <div className="text-xs font-bold uppercase mb-1">Cliente</div>
          <div className="text-xs">{clientName}</div>
        </div>
      )}

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Items Header */}
      <div>
        <div className="grid grid-cols-12 gap-1 text-xs font-bold mb-2 border-b border-gray-300 pb-1">
          <div className="col-span-2">CÓD</div>
          <div className="col-span-4">DESC</div>
          <div className="col-span-2 text-center">QTD</div>
          <div className="col-span-2 text-right">UNIT</div>
          <div className="col-span-2 text-right">TOTAL</div>
        </div>

        {/* Items */}
        {order.items.map((item, index) => (
          <div key={item.id || index} className="mb-2">
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

      <div className="border-t-2 border-black my-2" />

      {/* Total */}
      <div className="text-right">
        <div className="text-xs text-gray-600">TOTAL DO PEDIDO</div>
        <div className="text-xl font-bold">{formatCurrency(order.total)}</div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-500">
        <div className="border-t border-dashed border-gray-400 my-2" />
        <div>{settings.footer_message}</div>
        <div className="text-[10px] mt-1">
          Qtd. Itens: {order.items.length} | 
          Qtd. Produtos: {order.items.reduce((acc, item) => acc + item.quantity, 0)}
        </div>
      </div>
    </>
  );
}
