import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients, Client } from '@/hooks/useClients';
import { User, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientSearchInputProps {
  onClientSelect: (client: Client | null) => void;
  selectedClient: Client | null;
  clientName?: string;
  onClientNameChange?: (name: string) => void;
}

export function ClientSearchInput({ onClientSelect, selectedClient, clientName = '', onClientNameChange }: ClientSearchInputProps) {
  const { searchClients } = useClients();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedClient) {
      setSearch('');
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

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      const found = searchClients(value);
      setResults(found);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
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
        
        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
            {results.map((client) => (
              <button
                key={client.id}
                className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                onClick={() => handleSelect(client)}
              >
                <div className="font-medium">{client.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
