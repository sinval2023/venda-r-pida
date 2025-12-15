import { useState, useMemo, useEffect } from 'react';
import { Download, Upload, FileText, FileCode, AlertCircle, Plug, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Order, ExportConfig, FTPConfig } from '@/types/order';
import { exportOrder } from '@/utils/exportOrder';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface ExportModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FTPValidation {
  isValid: boolean;
  errors: {
    host?: string;
    user?: string;
    password?: string;
    port?: string;
    folder?: string;
  };
}

const validateFTPConfig = (config: FTPConfig): FTPValidation => {
  const errors: FTPValidation['errors'] = {};

  // Host validation
  if (!config.host.trim()) {
    errors.host = 'Host é obrigatório';
  } else if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)*[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(config.host.trim()) &&
             !/^(\d{1,3}\.){3}\d{1,3}$/.test(config.host.trim())) {
    errors.host = 'Host inválido (ex: ftp.exemplo.com.br ou IP)';
  }

  // User validation
  if (!config.user.trim()) {
    errors.user = 'Usuário é obrigatório';
  } else if (config.user.trim().length < 2) {
    errors.user = 'Usuário deve ter pelo menos 2 caracteres';
  }

  // Password validation
  if (!config.password) {
    errors.password = 'Senha é obrigatória';
  }

  // Port validation
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.port = 'Porta deve ser entre 1 e 65535';
  }

  // Folder validation
  if (!config.folder.trim()) {
    errors.folder = 'Pasta destino é obrigatória';
  } else if (!config.folder.startsWith('/')) {
    errors.folder = 'Pasta deve começar com /';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const FTP_CONFIG_KEY = 'pdv_ftp_config';

const getDefaultFTPConfig = (): FTPConfig => {
  const saved = localStorage.getItem(FTP_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore parse errors
    }
  }
  // Configuração padrão inicial
  return {
    host: '192.168.99.108',
    user: 'ftp_local',
    password: '212431',
    port: 21,
    folder: '/pdv',
  };
};

export function ExportModal({ order, open, onClose, onSuccess }: ExportModalProps) {
  const [format, setFormat] = useState<'xml' | 'txt'>('xml');
  const [destination, setDestination] = useState<'download' | 'ftp'>('download');
  const [ftpConfig, setFtpConfig] = useState<FTPConfig>(getDefaultFTPConfig);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [useFixedFilename, setUseFixedFilename] = useState(true);

  const ftpValidation = useMemo(() => validateFTPConfig(ftpConfig), [ftpConfig]);

  const handleTestConnection = async () => {
    setShowValidation(true);
    if (!ftpValidation.isValid) {
      toast({
        title: 'Configuração FTP inválida',
        description: 'Por favor, corrija os campos destacados.',
        variant: 'destructive',
      });
      return;
    }

    setTestingConnection(true);
    setConnectionTested(false);

    try {
      const { data, error } = await supabase.functions.invoke('upload-ftp', {
        body: {
          ftpConfig,
          testOnly: true,
        },
      });

      if (error || !data?.success) {
        toast({
          title: 'Falha na conexão',
          description: data?.error || error?.message || 'Não foi possível conectar ao servidor FTP',
          variant: 'destructive',
        });
      } else {
        setConnectionTested(true);
        // Salvar configuração no localStorage após sucesso
        localStorage.setItem(FTP_CONFIG_KEY, JSON.stringify(ftpConfig));
        toast({
          title: 'Conexão bem-sucedida!',
          description: data.message + ' (configurações salvas)',
        });
      }
    } catch (err) {
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor FTP',
        variant: 'destructive',
      });
    }

    setTestingConnection(false);
  };

  const handleExport = async () => {
    if (destination === 'ftp') {
      setShowValidation(true);
      if (!ftpValidation.isValid) {
        toast({
          title: 'Configuração FTP inválida',
          description: 'Por favor, corrija os campos destacados.',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    
    const config: ExportConfig = {
      format,
      destination,
      ftpConfig: destination === 'ftp' ? ftpConfig : undefined,
      useFixedFilename: destination === 'download' ? useFixedFilename : false,
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

            <TabsContent value="download" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                O arquivo será baixado diretamente no seu dispositivo.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useFixedFilename" 
                  checked={useFixedFilename}
                  onCheckedChange={(checked) => setUseFixedFilename(checked === true)}
                />
                <Label htmlFor="useFixedFilename" className="text-sm cursor-pointer">
                  Usar nome fixo para integração com PDV (pedido_pdv.xml)
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="ftp" className="mt-4 space-y-3">
              <div>
                <Label htmlFor="ftpHost">Host</Label>
                <Input
                  id="ftpHost"
                  placeholder="ftp.exemplo.com.br"
                  value={ftpConfig.host}
                  onChange={(e) => setFtpConfig({ ...ftpConfig, host: e.target.value })}
                  className={showValidation && ftpValidation.errors.host ? 'border-destructive' : ''}
                />
                {showValidation && ftpValidation.errors.host && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {ftpValidation.errors.host}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ftpUser">Usuário</Label>
                  <Input
                    id="ftpUser"
                    placeholder="usuario"
                    value={ftpConfig.user}
                    onChange={(e) => setFtpConfig({ ...ftpConfig, user: e.target.value })}
                    className={showValidation && ftpValidation.errors.user ? 'border-destructive' : ''}
                  />
                  {showValidation && ftpValidation.errors.user && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {ftpValidation.errors.user}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="ftpPort">Porta</Label>
                  <Input
                    id="ftpPort"
                    type="number"
                    value={ftpConfig.port}
                    onChange={(e) => setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) || 21 })}
                    className={showValidation && ftpValidation.errors.port ? 'border-destructive' : ''}
                  />
                  {showValidation && ftpValidation.errors.port && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {ftpValidation.errors.port}
                    </p>
                  )}
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
                  className={showValidation && ftpValidation.errors.password ? 'border-destructive' : ''}
                />
                {showValidation && ftpValidation.errors.password && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {ftpValidation.errors.password}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="ftpFolder">Pasta destino</Label>
                <Input
                  id="ftpFolder"
                  placeholder="/pedidos"
                  value={ftpConfig.folder}
                  onChange={(e) => setFtpConfig({ ...ftpConfig, folder: e.target.value })}
                  className={showValidation && ftpValidation.errors.folder ? 'border-destructive' : ''}
                />
                {showValidation && ftpValidation.errors.folder && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {ftpValidation.errors.folder}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="w-full flex items-center gap-2"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : connectionTested ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Conexão OK - Testar novamente
                  </>
                ) : (
                  <>
                    <Plug className="h-4 w-4" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {loading ? 'Exportando...' : 'Exportar Pedido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
