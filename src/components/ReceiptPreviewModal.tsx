import { useRef, useState } from 'react';
import { Printer, X, Eye, Settings, ChevronLeft, ChevronRight, FileDown, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order } from '@/types/order';
import { toast } from '@/hooks/use-toast';
import { usePrinterSettings } from '@/hooks/usePrinterSettings';
import { jsPDF } from 'jspdf';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const generatePdf = async (): Promise<jsPDF> => {
    const pageWidth = settings.paper_width;
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = 4;
    const smallLineHeight = 3;
    
    // Calculate dynamic height based on content
    let estimatedHeight = 60; // Base height
    estimatedHeight += order.items.length * 6; // Items
    order.items.forEach(item => {
      if (item.observations) estimatedHeight += 4;
    });
    if (settings.company_name) estimatedHeight += 6;
    if (settings.company_address) estimatedHeight += 4;
    if (settings.company_phone) estimatedHeight += 4;
    if (settings.logo_url && settings.show_logo) estimatedHeight += 20;
    if (clientName) estimatedHeight += 8;
    if (settings.footer_message) estimatedHeight += 4;
    estimatedHeight = Math.max(estimatedHeight, 100);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, estimatedHeight],
    });

    let yPosition = margin;

    // Helper functions
    const addText = (text: string, x: number, y: number, options: { align?: 'left' | 'center' | 'right'; fontSize?: number; fontStyle?: 'normal' | 'bold' | 'italic' } = {}) => {
      const { align = 'left', fontSize = 8, fontStyle = 'normal' } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.text(text, x, y, { align });
    };

    const drawDashedLine = (y: number) => {
      doc.setLineDashPattern([1, 1], 0);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setLineDashPattern([], 0);
    };

    const drawSolidLine = (y: number, width = 0.2) => {
      doc.setLineWidth(width);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setLineWidth(0.2);
    };

    // Logo
    if (settings.logo_url && settings.show_logo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const maxWidth = 25;
            const maxHeight = 15;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const imgWidth = img.width * ratio;
            const imgHeight = img.height * ratio;
            const xPos = (pageWidth - imgWidth) / 2;
            doc.addImage(img, 'PNG', xPos, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 2;
            resolve();
          };
          img.onerror = () => {
            console.warn('Failed to load logo for PDF');
            resolve();
          };
          img.src = settings.logo_url || '';
        });
      } catch (e) {
        console.warn('Error loading logo:', e);
      }
    }

    // Company Header
    if (settings.company_name) {
      addText(settings.company_name.toUpperCase(), pageWidth / 2, yPosition + 4, { align: 'center', fontSize: 11, fontStyle: 'bold' });
      yPosition += lineHeight + 3;
    }
    if (settings.company_address) {
      addText(settings.company_address, pageWidth / 2, yPosition + 2, { align: 'center', fontSize: 7 });
      yPosition += smallLineHeight + 1;
    }
    if (settings.company_phone) {
      addText(`Tel: ${settings.company_phone}`, pageWidth / 2, yPosition + 2, { align: 'center', fontSize: 7 });
      yPosition += smallLineHeight + 1;
    }
    
    if (settings.company_name || settings.company_address || settings.company_phone || settings.logo_url) {
      yPosition += 1;
      drawDashedLine(yPosition);
      yPosition += 4;
    }

    // Order Header
    addText('CUPOM DE VENDA', pageWidth / 2, yPosition + 2, { align: 'center', fontSize: 12, fontStyle: 'bold' });
    yPosition += lineHeight + 3;
    
    // Order number with box effect
    doc.setDrawColor(100);
    doc.setFillColor(245, 245, 245);
    const orderNumText = `Pedido #${order.number.toString().padStart(6, '0')}`;
    const orderNumWidth = doc.getTextWidth(orderNumText) + 6;
    doc.roundedRect((pageWidth - orderNumWidth) / 2, yPosition - 2, orderNumWidth, 6, 1, 1, 'FD');
    doc.setDrawColor(0);
    addText(orderNumText, pageWidth / 2, yPosition + 2, { align: 'center', fontSize: 9, fontStyle: 'bold' });
    yPosition += lineHeight + 3;
    
    drawDashedLine(yPosition);
    yPosition += 4;

    // Date/Time in a grid
    addText(`Data: ${date}`, margin, yPosition, { fontSize: 8 });
    addText(`Hora: ${time}`, pageWidth - margin, yPosition, { align: 'right', fontSize: 8 });
    yPosition += lineHeight + 2;

    // Seller
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 1, contentWidth, 7, 'F');
    addText('VENDEDOR:', margin + 1, yPosition + 3, { fontSize: 7, fontStyle: 'bold' });
    addText(order.vendorName, margin + 18, yPosition + 3, { fontSize: 8 });
    yPosition += 8;

    // Client
    if (clientName) {
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 1, contentWidth, 7, 'F');
      addText('CLIENTE:', margin + 1, yPosition + 3, { fontSize: 7, fontStyle: 'bold' });
      addText(clientName, margin + 15, yPosition + 3, { fontSize: 8 });
      yPosition += 8;
    }

    yPosition += 1;
    drawDashedLine(yPosition);
    yPosition += 4;

    // Items Header with background
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPosition - 2, contentWidth, 5, 'F');
    
    addText('ITEM', margin + 1, yPosition + 1, { fontSize: 6, fontStyle: 'bold' });
    addText('DESCRIÇÃO', margin + contentWidth * 0.15, yPosition + 1, { fontSize: 6, fontStyle: 'bold' });
    addText('QTD', pageWidth - margin - contentWidth * 0.35, yPosition + 1, { fontSize: 6, fontStyle: 'bold', align: 'center' });
    addText('UNIT', pageWidth - margin - contentWidth * 0.18, yPosition + 1, { fontSize: 6, fontStyle: 'bold', align: 'right' });
    addText('TOTAL', pageWidth - margin - 1, yPosition + 1, { fontSize: 6, fontStyle: 'bold', align: 'right' });
    yPosition += 5;

    // Items
    order.items.forEach((item, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition - 2, contentWidth, item.observations ? 8 : 5, 'F');
      }
      
      const code = item.code.length > 8 ? item.code.substring(0, 8) + '..' : item.code;
      const desc = item.description.length > 15 ? item.description.substring(0, 15) + '..' : item.description;
      
      addText(code, margin + 1, yPosition + 1, { fontSize: 7 });
      addText(desc, margin + contentWidth * 0.15, yPosition + 1, { fontSize: 7 });
      addText(item.quantity.toString(), pageWidth - margin - contentWidth * 0.35, yPosition + 1, { fontSize: 7, align: 'center' });
      addText(formatCurrency(item.unitPrice).replace('R$', '').trim(), pageWidth - margin - contentWidth * 0.18, yPosition + 1, { fontSize: 7, align: 'right' });
      addText(formatCurrency(item.total).replace('R$', '').trim(), pageWidth - margin - 1, yPosition + 1, { fontSize: 7, align: 'right' });
      yPosition += 4;
      
      // Item observations
      if (item.observations) {
        addText(`↳ ${item.observations}`, margin + 3, yPosition + 1, { fontSize: 6, fontStyle: 'italic' });
        yPosition += 4;
      }
    });

    yPosition += 2;
    drawSolidLine(yPosition, 0.5);
    yPosition += 4;

    // Subtotal info
    const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
    addText(`Itens: ${order.items.length}`, margin, yPosition, { fontSize: 7 });
    addText(`Qtd Total: ${totalQty}`, pageWidth - margin, yPosition, { align: 'right', fontSize: 7 });
    yPosition += 4;

    // Total with emphasis
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, yPosition - 1, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    addText('TOTAL:', margin + 2, yPosition + 5, { fontSize: 10, fontStyle: 'bold' });
    addText(formatCurrency(order.total), pageWidth - margin - 2, yPosition + 5, { align: 'right', fontSize: 12, fontStyle: 'bold' });
    doc.setTextColor(0, 0, 0);
    yPosition += 12;

    // Footer
    drawDashedLine(yPosition);
    yPosition += 4;
    
    if (settings.footer_message) {
      addText(settings.footer_message, pageWidth / 2, yPosition, { align: 'center', fontSize: 7 });
      yPosition += smallLineHeight + 2;
    }
    
    addText(`Emitido em: ${date} às ${time}`, pageWidth / 2, yPosition, { align: 'center', fontSize: 6 });
    yPosition += smallLineHeight;
    addText('Obrigado pela preferência!', pageWidth / 2, yPosition + 2, { align: 'center', fontSize: 7, fontStyle: 'italic' });

    return doc;
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = await generatePdf();
      doc.save(`cupom-pedido-${order.number.toString().padStart(6, '0')}.pdf`);
      
      toast({
        title: 'PDF gerado com sucesso',
        description: 'O arquivo foi baixado para o seu dispositivo.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o arquivo PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = await generatePdf();
      const pdfBlob = doc.output('blob');
      const fileName = `cupom-pedido-${order.number.toString().padStart(6, '0')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Cupom - Pedido #${order.number.toString().padStart(6, '0')}`,
          text: `Cupom do pedido #${order.number.toString().padStart(6, '0')}`,
        });
        
        toast({
          title: 'Compartilhamento iniciado',
          description: 'Escolha como deseja compartilhar o cupom.',
        });
      } else {
        // Fallback: download the file
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'PDF gerado',
          description: 'Compartilhamento não suportado neste dispositivo. O arquivo foi baixado.',
        });
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      toast({
        title: 'Erro ao compartilhar',
        description: 'Não foi possível compartilhar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
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
        <div className="flex flex-wrap gap-2 mt-4">
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
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[120px]"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Baixar PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleSharePdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[120px]"
            title="Compartilhar via WhatsApp ou Email"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Compartilhar
          </Button>
        </div>
        <div className="flex gap-2">
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
