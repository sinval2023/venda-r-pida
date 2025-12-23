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

export function ReceiptTemplateModern({ order, clientName, settings, formatCurrency, date, time }: ReceiptTemplateProps) {
  return (
    <>
      {/* Modern Header with accent bar */}
      <div className="bg-gray-900 text-white -mx-4 -mt-4 px-4 pt-4 pb-3 mb-4">
        {settings.show_logo && settings.logo_url && (
          <img 
            src={settings.logo_url} 
            alt="Logo" 
            className="h-10 mx-auto mb-2 invert"
            style={{ maxWidth: '50%' }}
          />
        )}
        {settings.company_name && (
          <div className="text-center text-lg font-bold tracking-wide">{settings.company_name}</div>
        )}
        {settings.company_phone && (
          <div className="text-center text-[10px] text-gray-300">{settings.company_phone}</div>
        )}
      </div>

      {/* Order Info Card */}
      <div className="bg-gray-100 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Pedido</div>
            <div className="text-lg font-bold">#{order.number.toString().padStart(6, '0')}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500">{date}</div>
            <div className="text-xs font-medium">{time}</div>
          </div>
        </div>
      </div>

      {/* Seller & Client */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="bg-blue-50 rounded p-2">
          <div className="text-[10px] text-blue-600 uppercase font-medium">Vendedor</div>
          <div className="font-medium truncate">{order.vendorName}</div>
        </div>
        {clientName && (
          <div className="bg-green-50 rounded p-2">
            <div className="text-[10px] text-green-600 uppercase font-medium">Cliente</div>
            <div className="font-medium truncate">{clientName}</div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4">
        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Itens do Pedido</div>
        {order.items.map((item, index) => (
          <div key={item.id || index} className="flex justify-between items-start py-2 border-b border-gray-200 last:border-0">
            <div className="flex-1">
              <div className="text-xs font-medium">{item.description}</div>
              <div className="text-[10px] text-gray-500">
                Cód: {item.code} • {item.quantity}x {formatCurrency(item.unitPrice)}
              </div>
            </div>
            <div className="text-xs font-bold text-right">{formatCurrency(item.total)}</div>
          </div>
        ))}
      </div>

      {/* Total Section */}
      <div className="bg-gray-900 text-white -mx-4 px-4 py-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Total</div>
            <div className="text-[10px] text-gray-400">
              {order.items.length} itens • {order.items.reduce((acc, item) => acc + item.quantity, 0)} produtos
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(order.total)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 text-[10px] text-gray-400">
        {settings.footer_message}
      </div>
    </>
  );
}
