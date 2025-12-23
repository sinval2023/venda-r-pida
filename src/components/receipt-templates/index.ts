export { ReceiptTemplateClassic } from './ReceiptTemplateClassic';
export { ReceiptTemplateModern } from './ReceiptTemplateModern';
export { ReceiptTemplateMinimal } from './ReceiptTemplateMinimal';
export { ReceiptTemplateDetailed } from './ReceiptTemplateDetailed';

export type ReceiptTemplateType = 'classic' | 'modern' | 'minimal' | 'detailed';

export const receiptTemplates: { id: ReceiptTemplateType; name: string; description: string }[] = [
  { id: 'classic', name: 'Clássico', description: 'Layout tradicional com cabeçalho e tabela de itens' },
  { id: 'modern', name: 'Moderno', description: 'Design contemporâneo com cores e cards' },
  { id: 'minimal', name: 'Minimalista', description: 'Layout limpo e simples, apenas o essencial' },
  { id: 'detailed', name: 'Detalhado', description: 'Informações completas com tabela estruturada' },
];
