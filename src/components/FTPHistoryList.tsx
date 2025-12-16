import { History, FileCode, FileText, Server } from 'lucide-react';
import { FTPHistoryEntry } from '@/hooks/useFTPHistory';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FTPHistoryListProps {
  history: FTPHistoryEntry[];
  loading: boolean;
}

export function FTPHistoryList({ history, loading }: FTPHistoryListProps) {
  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Carregando histórico...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm flex flex-col items-center gap-2">
        <History className="h-5 w-5 opacity-50" />
        Nenhum envio FTP registrado
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="h-4 w-4" />
        Últimos envios FTP
      </div>
      <ScrollArea className="h-[140px]">
        <div className="space-y-2 pr-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="p-2 rounded-lg bg-accent/30 border border-border/50 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1">
                  {entry.file_format === 'xml' ? (
                    <FileCode className="h-3 w-3 text-blue-500" />
                  ) : (
                    <FileText className="h-3 w-3 text-green-500" />
                  )}
                  Pedido #{entry.order_number.toString().padStart(6, '0')}
                </span>
                <span className="text-muted-foreground">{formatDate(entry.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1 truncate max-w-[60%]">
                  <Server className="h-3 w-3" />
                  {entry.ftp_host}{entry.ftp_folder}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(entry.order_total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
