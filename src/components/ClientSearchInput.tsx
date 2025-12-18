import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients, Client } from '@/hooks/useClients';
import { User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientSearchInputProps {
  onClientSelect: (client: Client | null) => void;
  selectedClient: Client | null;
}

export function ClientSearchInput({ onClientSelect, selectedClient }: ClientSearchInputProps) {
  const { searchClients } = useClients();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedClient) {
      setSearch(selectedClient.name);
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
    setSearch(client.name);
    onClientSelect(client);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearch('');
    onClientSelect(null);
    setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        <User className="h-3 w-3" /> Cliente
      </Label>
      <div className="relative">
        <Input
          placeholder="BUSCAR CLIENTE POR NOME..."
          value={search.toUpperCase()}
          onChange={(e) => handleSearch(e.target.value.toUpperCase())}
          className="h-11 text-base font-bold uppercase pr-8"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-9 w-8 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
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
  );
}
