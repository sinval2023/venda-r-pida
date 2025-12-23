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

export function ReceiptTemplateMinimal({ order, clientName, settings, formatCurrency, date, time }: ReceiptTemplateProps) {
  return (
    <>
      {/* Minimal Header */}
      <div className="text-center mb-4">
        {settings.company_name && (
          <div className="text-base font-light tracking-widest uppercase">{settings.company_name}</div>
        )}
        <div className="text-[10px] text-gray-400 mt-1">
          {date} às {time}
        </div>
      </div>

      <div className="h-px bg-gray-200 mb-4" />

      {/* Order Number */}
      <div className="text-center mb-4">
        <div className="text-3xl font-extralight">#{order.number.toString().padStart(6, '0')}</div>
      </div>

      {/* Items - Ultra Simple */}
      <div className="space-y-3 mb-6">
        {order.items.map((item, index) => (
          <div key={item.id || index} className="flex justify-between text-xs">
            <span className="text-gray-600">
              {item.quantity}× {item.description}
            </span>
            <span className="font-medium">{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-300 mb-3" />

      {/* Total */}
      <div className="flex justify-between items-baseline mb-4">
        <span className="text-sm text-gray-500">Total</span>
        <span className="text-2xl font-light">{formatCurrency(order.total)}</span>
      </div>

      <div className="h-px bg-gray-200 mb-4" />

      {/* Minimal Info */}
      <div className="text-center text-[10px] text-gray-400 space-y-1">
        <div>Vendedor: {order.vendorName}</div>
        {clientName && <div>Cliente: {clientName}</div>}
        <div className="mt-3">{settings.footer_message}</div>
      </div>
    </>
  );
}
