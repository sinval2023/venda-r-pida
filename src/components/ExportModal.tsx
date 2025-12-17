import { useState, useMemo } from 'react';
import type { MouseEvent } from 'react';
import { Download, Upload, FileText, FileCode, AlertCircle, Loader2, Share2, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Order, ExportConfig, FTPConfig } from '@/types/order';
import { exportOrder, generateXML, generateTXT } from '@/utils/exportOrder';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFTPHistory } from '@/hooks/useFTPHistory';
import { FTPHistoryList } from '@/components/FTPHistoryList';
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
  // Configuração padrão inicial (sem senha por segurança)
  return {
    host: '177.234.159.174',
    user: 'gsn',
    password: '',
    port: 21,
    folder: '/XML',
  };
};

export function ExportModal({ order, open, onClose, onSuccess }: ExportModalProps) {
  const [format, setFormat] = useState<'xml' | 'txt'>('xml');
  const [destination, setDestination] = useState<'download' | 'share' | 'whatsapp' | 'ftp'>('download');
  const [ftpConfig, setFtpConfig] = useState<FTPConfig>(getDefaultFTPConfig);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [useFixedFilename, setUseFixedFilename] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const { history: ftpHistory, loading: historyLoading, addEntry: addFTPHistoryEntry } = useFTPHistory();
  const ftpValidation = useMemo(() => validateFTPConfig(ftpConfig), [ftpConfig]);
  const canShare = typeof navigator !== 'undefined' && navigator.share && navigator.canShare;

  const handleTestConnection = async (e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('Testing FTP connection...');
    
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
      console.log('Calling upload-ftp with testOnly:', ftpConfig);
      
      const { data, error } = await supabase.functions.invoke('upload-ftp', {
        body: {
          ftpConfig,
          testOnly: true,
        },
      });

      console.log('Test connection response:', { data, error });

      if (error || !data?.success) {
        toast({
          title: 'Falha na conexão',
          description: data?.error || error?.message || 'Não foi possível conectar ao servidor FTP',
          variant: 'destructive',
        });
      } else {
        setConnectionTested(true);
        // Salvar configuração no localStorage após sucesso (sem senha)
        localStorage.setItem(FTP_CONFIG_KEY, JSON.stringify({ ...ftpConfig, password: '' }));
        toast({
          title: 'Conexão bem-sucedida!',
          description: data.message + ' (configurações salvas)',
        });
      }
    } catch (err) {
      console.error('Test connection error:', err);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor FTP',
        variant: 'destructive',
      });
    }

    setTestingConnection(false);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const content = format === 'xml' ? generateXML(order) : generateTXT(order);
      const extension = format === 'xml' ? 'xml' : 'txt';
      const mimeType = format === 'xml' ? 'application/xml' : 'text/plain';
      const filename = `pedido_${order.number.toString().padStart(6, '0')}.${extension}`;
      
      const file = new File([content], filename, { type: mimeType });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Pedido #${order.number.toString().padStart(6, '0')}`,
          text: `Pedido de venda - Total: R$ ${order.total.toFixed(2)}`,
        });
        toast({
          title: 'Arquivo compartilhado!',
          description: 'Selecione o Google Drive ou outro app para salvar.',
        });
        onSuccess();
      } else {
        toast({
          title: 'Compartilhamento não suportado',
          description: 'Seu navegador não suporta compartilhar arquivos. Use o Download.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast({
          title: 'Erro ao compartilhar',
          description: 'Não foi possível compartilhar o arquivo.',
          variant: 'destructive',
        });
      }
    }
    setSharing(false);
  };

  const handleWhatsApp = async () => {
    setSharing(true);
    try {
      const content = format === 'xml' ? generateXML(order) : generateTXT(order);
      const extension = format === 'xml' ? 'xml' : 'txt';
      const mimeType = format === 'xml' ? 'application/xml' : 'text/plain';
      const filename = `pedido_${order.number.toString().padStart(6, '0')}.${extension}`;

      // First, download the file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Build summary message for WhatsApp (no XML, just info)
      const itemsList = order.items
        .map((item) => `• ${item.quantity}x ${item.code} - R$ ${item.total.toFixed(2)}`)
        .join('\n');

      const message =
        `📋 *PEDIDO DE VENDA #${order.number.toString().padStart(6, '0')}*\n\n` +
        `👤 Vendedor: ${order.vendorName}\n` +
        `📅 Data: ${new Date(order.date).toLocaleDateString('pt-BR')}\n\n` +
        `*ITENS:*\n${itemsList}\n\n` +
        `💰 *TOTAL: R$ ${order.total.toFixed(2)}*\n\n` +
        `📎 _Arquivo ${filename} baixado - anexe abaixo_`;

      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = '5511947791957';

      // Small delay to ensure download starts
      setTimeout(() => {
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }, 500);

      toast({
        title: 'Arquivo baixado!',
        description: `Anexe o arquivo "${filename}" no WhatsApp Web.`,
      });
      onSuccess();
    } catch (err: any) {
      console.error('WhatsApp error:', err);
      toast({
        title: 'Erro',
        description: err?.message || 'Não foi possível preparar o envio.',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  const handleExport = async () => {
    console.log('handleExport called, destination:', destination);
    
    if (destination === 'share') {
      await handleShare();
      return;
    }

    if (destination === 'whatsapp') {
      await handleWhatsApp();
      return;
    }

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
    setUploadProgress(0);
    setUploadStatus('');
    
    try {
      // After early return for 'share', destination is only 'download' | 'ftp'
      const actualDestination = destination as 'download' | 'ftp';
      
      if (actualDestination === 'ftp') {
        setUploadProgress(10);
        setUploadStatus('Preparando arquivo...');
      }
      
      const config: ExportConfig = {
        format,
        destination: actualDestination,
        ftpConfig: actualDestination === 'ftp' ? ftpConfig : undefined,
        useFixedFilename: actualDestination === 'download' ? useFixedFilename : false,
      };

      if (actualDestination === 'ftp') {
        setUploadProgress(30);
        setUploadStatus('Conectando ao servidor FTP...');
      }

      console.log('Calling exportOrder with config:', config);
      const result = await exportOrder(order, config);
      console.log('exportOrder result:', result);

      if (result.success) {
        if (actualDestination === 'ftp') {
          setUploadProgress(100);
          setUploadStatus('Enviado com sucesso!');
          
          // Save to history
          const filename = `pedido_${order.number.toString().padStart(6, '0')}.${format}`;
          await addFTPHistoryEntry({
            order_number: order.number,
            filename,
            ftp_host: ftpConfig.host,
            ftp_folder: ftpConfig.folder,
            file_format: format,
            order_total: order.total,
            items_count: order.items.length,
          });
        }
        toast({
          title: 'Pedido exportado com sucesso!',
          description: `Pedido #${order.number.toString().padStart(6, '0')} foi ${destination === 'download' ? 'baixado' : 'enviado via FTP'}.`,
        });
        // Small delay to show 100% before closing
        setTimeout(() => {
          onSuccess();
        }, actualDestination === 'ftp' ? 800 : 0);
      } else {
        setUploadProgress(0);
        setUploadStatus('');
        toast({
          title: 'Erro ao exportar',
          description: result.error || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setUploadProgress(0);
      setUploadStatus('');
      toast({
        title: 'Erro ao exportar',
        description: err?.message || 'Erro inesperado ao exportar.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-xl mx-auto sm:max-h-[90vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Exportar Pedido #{order.number.toString().padStart(6, '0')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Card className="p-3 bg-accent/50">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total:</span>
              <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">Itens:</span>
              <span>{order.items.length}</span>
            </div>
          </Card>

          <div>
            <Label className="mb-1 block text-sm">Formato</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={format === 'xml' ? 'default' : 'outline'}
                onClick={() => setFormat('xml')}
                className="flex items-center gap-2 h-8 text-sm"
              >
                <FileCode className="h-3 w-3" />
                XML
              </Button>
              <Button
                type="button"
                variant={format === 'txt' ? 'default' : 'outline'}
                onClick={() => setFormat('txt')}
                className="flex items-center gap-2 h-8 text-sm"
              >
                <FileText className="h-3 w-3" />
                TXT
              </Button>
            </div>
          </div>

          <Tabs value={destination} onValueChange={(v) => setDestination(v as 'download' | 'share' | 'whatsapp' | 'ftp')}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="download" className="flex items-center gap-1 text-xs">
                <Download className="h-3 w-3" />
                Download
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-1 text-xs">
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="share" className="flex items-center gap-1 text-xs" disabled={!canShare}>
                <Share2 className="h-3 w-3" />
                Outros
              </TabsTrigger>
              <TabsTrigger value="ftp" className="flex items-center gap-1 text-xs">
                <Upload className="h-3 w-3" />
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

            <TabsContent value="whatsapp" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                O arquivo será <strong>baixado</strong> e o <strong>WhatsApp Web</strong> será aberto para o número <strong>(11) 94779-1957</strong>.
              </p>
              <div className="p-3 bg-accent/50 rounded-lg text-sm border border-border">
                <p className="font-medium mb-1">📎 Como anexar o arquivo:</p>
                <p className="text-muted-foreground">Clique no ícone de clipe (📎) no WhatsApp Web e selecione o arquivo baixado.</p>
              </div>
            </TabsContent>

            <TabsContent value="share" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Compartilhe o arquivo para o <strong>Google Drive</strong>, Email ou qualquer outro app instalado no seu dispositivo.
              </p>
              <div className="p-3 bg-accent/50 rounded-lg text-sm">
                <p className="font-medium mb-1">💡 Dica para Google Drive:</p>
                <p className="text-muted-foreground">Ao compartilhar, selecione "Salvar no Drive" para enviar o XML diretamente para sua pasta do Google Drive.</p>
              </div>
            </TabsContent>

            <TabsContent value="ftp" className="mt-3 space-y-3">
              {loading && destination === 'ftp' ? (
                <div className="py-8 space-y-4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    {uploadProgress === 100 ? (
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                    ) : (
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    )}
                    <p className="text-lg font-medium text-center">{uploadStatus}</p>
                  </div>
                  <Progress value={uploadProgress} className="h-2 w-full" />
                  <p className="text-center text-sm text-muted-foreground">{uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="ftpHost" className="text-xs">Host</Label>
                      <Input
                        id="ftpHost"
                        placeholder="ftp.exemplo.com.br"
                        value={ftpConfig.host}
                        onChange={(e) => setFtpConfig({ ...ftpConfig, host: e.target.value })}
                        className={`h-9 text-sm ${showValidation && ftpValidation.errors.host ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ftpPort" className="text-xs">Porta</Label>
                      <Input
                        id="ftpPort"
                        type="number"
                        value={ftpConfig.port}
                        onChange={(e) => setFtpConfig({ ...ftpConfig, port: parseInt(e.target.value) || 21 })}
                        className={`h-9 text-sm ${showValidation && ftpValidation.errors.port ? 'border-destructive' : ''}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="ftpUser" className="text-xs">Usuário</Label>
                      <Input
                        id="ftpUser"
                        placeholder="usuario"
                        value={ftpConfig.user}
                        onChange={(e) => setFtpConfig({ ...ftpConfig, user: e.target.value })}
                        className={`h-9 text-sm ${showValidation && ftpValidation.errors.user ? 'border-destructive' : ''}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ftpPassword" className="text-xs">Senha</Label>
                      <Input
                        id="ftpPassword"
                        type="password"
                        placeholder="••••••••"
                        value={ftpConfig.password}
                        onChange={(e) => setFtpConfig({ ...ftpConfig, password: e.target.value })}
                        className={`h-9 text-sm ${showValidation && ftpValidation.errors.password ? 'border-destructive' : ''}`}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ftpFolder" className="text-xs">Pasta destino</Label>
                    <Input
                      id="ftpFolder"
                      placeholder="/pedidos"
                      value={ftpConfig.folder}
                      onChange={(e) => setFtpConfig({ ...ftpConfig, folder: e.target.value })}
                      className={`h-9 text-sm ${showValidation && ftpValidation.errors.folder ? 'border-destructive' : ''}`}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleExport();
                    }}
                    disabled={loading || sharing}
                    className="w-full h-12 flex items-center justify-center gap-2 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02] transition-all shadow-lg text-white"
                  >
                    <Upload className="h-5 w-5" />
                    ENVIAR
                  </Button>
                  
                  {/* FTP History */}
                  <FTPHistoryList history={ftpHistory} loading={historyLoading} />
                </>
              )}
            </TabsContent>
          </Tabs>

          {destination !== 'ftp' && (
            <Button
              onClick={handleExport}
              disabled={loading || sharing}
              className="w-full h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {loading || sharing ? 'Exportando...' : 
                destination === 'whatsapp' ? 'Enviar via WhatsApp' :
                destination === 'share' ? 'Compartilhar Arquivo' : 
                'Exportar Pedido'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
