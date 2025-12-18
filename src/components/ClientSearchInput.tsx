import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients, Client } from '@/hooks/useClients';
import { User, Search } from 'lucide-react';

interface ClientSearchInputProps {
  onClientSelect: (client: Client | null) => void;
  selectedClient: Client | null;
}

export function ClientSearchInput({ onClientSelect, selectedClient }: ClientSearchInputProps) {
  const { searchClients, getClientByCpf } = useClients();
  const [nameQuery, setNameQuery] = useState('');
  const [cpfQuery, setCpfQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedClient) {
      setNameQuery(selectedClient.name);
      setCpfQuery(formatCpf(selectedClient.cpf));
    }
  }, [selectedClient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCpf = (cpf: string) => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    if (value.length >= 2) {
      const results = searchClients(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    if (!value) {
      onClientSelect(null);
      setCpfQuery('');
    }
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpfQuery(formatted);
    
    const clean = value.replace(/\D/g, '');
    if (clean.length >= 3) {
      const results = searchClients(clean);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    if (clean.length === 11) {
      const client = getClientByCpf(clean);
      if (client) {
        selectClient(client);
      }
    }
    
    if (!value) {
      onClientSelect(null);
      setNameQuery('');
    }
  };

  const selectClient = (client: Client) => {
    setNameQuery(client.name);
    setCpfQuery(formatCpf(client.cpf));
    onClientSelect(client);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> Cliente
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Nome do cliente"
              value={nameQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-7 h-9 text-sm"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">CPF</Label>
          <Input
            placeholder="000.000.000-00"
            value={cpfQuery}
            onChange={(e) => handleCpfChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="h-9 text-sm"
            maxLength={14}
          />
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((client) => (
            <button
              key={client.id}
              className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors text-sm"
              onClick={() => selectClient(client)}
            >
              <div className="font-medium text-foreground">{client.name}</div>
              <div className="text-xs text-muted-foreground">{formatCpf(client.cpf)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
