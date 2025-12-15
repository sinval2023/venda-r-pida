export interface OrderItem {
  id: string;
  productId: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  number: number;
  date: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  total: number;
}

export interface Product {
  id: string;
  code: string;
  description: string;
  default_price: number;
  active: boolean;
}

export interface ExportConfig {
  format: 'xml' | 'txt';
  destination: 'download' | 'share' | 'ftp';
  ftpConfig?: FTPConfig;
  useFixedFilename?: boolean;
}

export interface FTPConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  folder: string;
}
