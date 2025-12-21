import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/hooks/useClients';
import { User, X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientSearchInputProps {
  onClientSelect: (client: Client | null) => void;
  selectedClient: Client | null;
  clientName?: string;
  onClientNameChange?: (name: string) => void;
}

export function ClientSearchInput({ onClientSelect, selectedClient, clientName = '', onClientNameChange }: ClientSearchInputProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedClient) {
      setSearch('');
      setShowResults(false);
      onClientNameChange?.(selectedClient.name);
    }
  }, [selectedClient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) return;

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, cpf, phone, email, active')
        .eq('active', true)
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(10);

      if (cancelled) return;

      if (error) {
        setResults([]);
        setSearchLoading(false);
        return;
      }

      setResults((data ?? []) as Client[]);
      setSearchLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search]);

  const handleSearch = (value: string) => {
    setSearch(value);

    const hasQuery = value.trim().length >= 2;
    setShowResults(hasQuery);

    if (!hasQuery) {
      setResults([]);
      setSearchLoading(false);
    }
  };

  const handleSelect = (client: Client) => {
    setSearch('');
    onClientSelect(client);
    onClientNameChange?.(client.name);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearch('');
    setShowResults(false);
    onClientSelect(null);
    onClientNameChange?.('');
    setResults([]);
  };

  return (
    <div className="flex gap-2 items-end">
      {/* Nome do Cliente Field */}
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" /> Nome do Cliente
        </Label>
        <div className="relative">
          <Input
            placeholder="NOME DO CLIENTE..."
            value={clientName.toUpperCase()}
            onChange={(e) => onClientNameChange?.(e.target.value.toUpperCase())}
            className="h-11 text-base font-bold uppercase pr-8"
          />
          {clientName && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-11 w-8 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Client Search Field */}
      <div ref={wrapperRef} className="relative w-48 sm:w-56">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <Search className="h-3 w-3" /> Buscar Cliente
        </Label>
        <div className="relative">
          <Input
            placeholder="BUSCAR..."
            value={search.toUpperCase()}
            onChange={(e) => handleSearch(e.target.value.toUpperCase())}
            className="h-11 text-sm font-bold uppercase"
          />
        </div>
        
        {showResults && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
            {searchLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
              </div>
            )}

            {!searchLoading && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado</div>
            )}

            {!searchLoading && results.length > 0 &&
              results.map((client) => (
                <button
                  key={client.id}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  onClick={() => handleSelect(client)}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.cpf}</div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
