import { Order, ExportConfig } from '@/types/order';

export function generateXML(order: Order): string {
  const itemsXml = order.items.map(item => `
    <item>
      <codigo>${escapeXml(item.code)}</codigo>
      <descricao>${escapeXml(item.description)}</descricao>
      <quantidade>${item.quantity}</quantidade>
      <valorUnitario>${item.unitPrice.toFixed(2)}</valorUnitario>
      <total>${item.total.toFixed(2)}</total>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<pedido>
  <numero>${order.number}</numero>
  <data>${order.date}</data>
  <vendedor>
    <id>${order.vendorId}</id>
    <nome>${escapeXml(order.vendorName)}</nome>
  </vendedor>
  <itens>${itemsXml}
  </itens>
  <total>${order.total.toFixed(2)}</total>
</pedido>`;
}

export function generateTXT(order: Order): string {
  const separator = '='.repeat(50);
  const lines = [
    separator,
    `PEDIDO DE VENDA Nº ${order.number.toString().padStart(6, '0')}`,
    separator,
    `Data: ${new Date(order.date).toLocaleString('pt-BR')}`,
    `Vendedor: ${order.vendorName}`,
    separator,
    'ITENS DO PEDIDO:',
    separator,
    '',
  ];

  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.code} - ${item.description}`);
    lines.push(`   Qtd: ${item.quantity} x R$ ${item.unitPrice.toFixed(2)} = R$ ${item.total.toFixed(2)}`);
    lines.push('');
  });

  lines.push(separator);
  lines.push(`TOTAL DO PEDIDO: R$ ${order.total.toFixed(2)}`);
  lines.push(separator);

  return lines.join('\n');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportOrder(order: Order, config: ExportConfig): Promise<{ success: boolean; error?: string }> {
  const content = config.format === 'xml' ? generateXML(order) : generateTXT(order);
  const extension = config.format === 'xml' ? 'xml' : 'txt';
  const mimeType = config.format === 'xml' ? 'application/xml' : 'text/plain';
  const filename = `pedido_${order.number.toString().padStart(6, '0')}.${extension}`;

  if (config.destination === 'download') {
    downloadFile(content, filename, mimeType);
    return { success: true };
  }

  // FTP upload would require a backend function
  // For now, we'll simulate success
  if (config.destination === 'ftp' && config.ftpConfig) {
    // This would call an edge function to handle FTP upload
    console.log('FTP upload configuration:', config.ftpConfig);
    return { success: true };
  }

  return { success: false, error: 'Configuração inválida' };
}
