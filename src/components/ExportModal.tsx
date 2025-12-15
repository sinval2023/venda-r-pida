import { useState } from 'react';
import { Download, Upload, FileText, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Order, ExportConfig, FTPConfig } from '@/types/order';
import { exportOrder } from '@/utils/exportOrder';
import { toast } from '@/hooks/use-toast';

interface ExportModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExportModal({ order, open, onClose, onSuccess }: ExportModalProps) {
  const [format, setFormat] = useState<'xml' | 'txt'>('xml');
  const [destination, setDestination] = useState<'download' | 'ftp'>('download');
  const [ftpConfig, setFtpConfig] = useState<FTPConfig>({
    host: '',
    user: '',
    password: '',
    port: 21,
    folder: '/',
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    const config: ExportConfig = {
      format,
      destination,
      ftpConfig: destination === 'ftp' ? ftpConfig : undefined,
    };

    const result = await exportOrder(order, config);

    if (result.success) {
      toast({
        title: 'Pedido exportado com sucesso!',
        description: `Pedido #${order.number.toString().padStart(6, '0')} foi ${destination === 'download' ? 'baixado' : 'enviado'}.`,
      });
      onSuccess();
    } else {
      toast({
        title: 'Erro ao exportar',
        description: result.error || 'Tente novamente.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Exportar Pedido #{order.number.toString().padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 bg-accent/50">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-xl">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Itens:</span>
              <span>{order.items.length}</span>
            </div>
          </Card>

          <div>
            <Label className="mb-2 block">Formato do arquivo</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={format === 'xml' ? 'default' : 'outline'}
                onClick={() => setFormat('xml')}
                className="flex items-center gap-2"
              >
                <FileCode className="h-4 w-4" />
                XML
              </Button>
              <Button
                type="button"
                variant={format === 'txt' ? 'default' : 'outline'}
                onClick={() => setFormat('txt')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                TXT
              </Button>
            </div>
          </div>

          <Tabs value={destination} onValueChange={(v) => setDestination(v as 'download' | 'ftp')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="download" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </TabsTrigger>
              <TabsTrigger value="ftp" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                FTP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="mt-4">
              <p className="text-sm text-muted-foreground">
                O arquivo será baixado diretamente no seu dispositivo.
              </p>
            </TabsContent>

            <TabsContent value="ftp" className="mt-4 space-y-3">
              <div>
                <Label htmlFor="ftpHost">Host</Label>
                <Input
                  id="ftpHost"
                  placeholder="ftp.exemplo.com.br"
                  value={ftpConfig.host}
                  onChange={(e) => setFtpConfig({ ...ftpConfig, host: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ftpUser">Usuário</Label>
                  <Input
                    id="ftpUser"
                    placeholder="usuario"
                    value={ftpConfig.user}
                    onChange={(e) => setFtpConfig({ ...ftpConfig, user: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ftpPort">Porta</Label>
                  <Input
                    id="ftpPort"
                    type="number"
                    value={ftpConfig.port}
                    onChange={(e) => setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) || 21 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ftpPassword">Senha</Label>
                <Input
                  id="ftpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={ftpConfig.password}
                  onChange={(e) => setFtpConfig({ ...ftpConfig, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ftpFolder">Pasta destino</Label>
                <Input
                  id="ftpFolder"
                  placeholder="/pedidos"
                  value={ftpConfig.folder}
                  onChange={(e) => setFtpConfig({ ...ftpConfig, folder: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleExport}
            disabled={loading || (destination === 'ftp' && (!ftpConfig.host || !ftpConfig.user))}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {loading ? 'Exportando...' : 'Exportar Pedido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
