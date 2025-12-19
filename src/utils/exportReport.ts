import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { OrderReport, SellerRanking, ProductRanking } from '@/hooks/useSalesReport';

interface ReportData {
  orders: OrderReport[];
  sellerRanking: SellerRanking[];
  productRanking: ProductRanking[];
  startDate: string;
  endDate: string;
  totalSales: number;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const exportToPDF = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(16);
  doc.text('Relatório de Vendas', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Período: ${formatDate(data.startDate)} a ${formatDate(data.endDate)}`, pageWidth / 2, 22, { align: 'center' });
  doc.text(`Total de Vendas: ${formatCurrency(data.totalSales)}`, pageWidth / 2, 28, { align: 'center' });

  let yPos = 35;

  // Seller Ranking
  if (data.sellerRanking.length > 0) {
    doc.setFontSize(12);
    doc.text('Ranking por Vendedor', 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 3,
      head: [['Posição', 'Vendedor', 'Qtd Pedidos', 'Total Vendas']],
      body: data.sellerRanking.map((seller, index) => [
        `${index + 1}º`,
        seller.seller_name,
        seller.order_count.toString(),
        formatCurrency(seller.total_sales)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Product Ranking
  if (data.productRanking.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.text('Ranking por Produto', 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 3,
      head: [['Posição', 'Código', 'Descrição', 'Qtd', 'Total']],
      body: data.productRanking.slice(0, 20).map((product, index) => [
        `${index + 1}º`,
        product.product_code,
        product.product_description.substring(0, 30),
        product.total_quantity.toString(),
        formatCurrency(product.total_value)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Orders List
  if (data.orders.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.text('Lista de Pedidos', 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 3,
      head: [['Nº Pedido', 'Data', 'Vendedor', 'Cliente', 'Total']],
      body: data.orders.map(order => [
        order.order_number.toString(),
        formatDate(order.created_at),
        order.seller_name,
        order.client_name || '-',
        formatCurrency(Number(order.total))
      ]),
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 9 }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `ESPAÇO GARDEN - Gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorio_vendas_${data.startDate}_${data.endDate}.pdf`);
};

export const exportToExcel = (data: ReportData) => {
  const workbook = XLSX.utils.book_new();

  // Seller Ranking Sheet
  if (data.sellerRanking.length > 0) {
    const sellerData = data.sellerRanking.map((seller, index) => ({
      'Posição': index + 1,
      'Vendedor': seller.seller_name,
      'Quantidade de Pedidos': seller.order_count,
      'Total de Vendas': seller.total_sales
    }));
    const sellerSheet = XLSX.utils.json_to_sheet(sellerData);
    XLSX.utils.book_append_sheet(workbook, sellerSheet, 'Ranking Vendedores');
  }

  // Product Ranking Sheet
  if (data.productRanking.length > 0) {
    const productData = data.productRanking.map((product, index) => ({
      'Posição': index + 1,
      'Código': product.product_code,
      'Descrição': product.product_description,
      'Quantidade Vendida': product.total_quantity,
      'Valor Total': product.total_value
    }));
    const productSheet = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Ranking Produtos');
  }

  // Orders List Sheet
  if (data.orders.length > 0) {
    const ordersData = data.orders.map(order => ({
      'Nº Pedido': order.order_number,
      'Data': formatDate(order.created_at),
      'Vendedor': order.seller_name,
      'Cliente': order.client_name || '-',
      'Total': Number(order.total)
    }));
    const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos');
  }

  // Summary Sheet
  const summaryData = [
    { 'Descrição': 'Período', 'Valor': `${formatDate(data.startDate)} a ${formatDate(data.endDate)}` },
    { 'Descrição': 'Total de Pedidos', 'Valor': data.orders.length },
    { 'Descrição': 'Total de Vendas', 'Valor': data.totalSales },
    { 'Descrição': 'Quantidade de Vendedores', 'Valor': data.sellerRanking.length },
    { 'Descrição': 'Quantidade de Produtos', 'Valor': data.productRanking.length }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  XLSX.writeFile(workbook, `relatorio_vendas_${data.startDate}_${data.endDate}.xlsx`);
};
