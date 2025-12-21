import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Pencil, Trash2, FileSpreadsheet, FileText, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Client {
  id: string;
  code: string | null;
  name: string;
  cpf: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  active: boolean;
}

interface ClientManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientsChanged?: () => void;
}

type PersonType = 'PF' | 'PJ';

export function ClientManagementModal({ open, onOpenChange, onClientsChanged }: ClientManagementModalProps) {
  const { toast } = useToast();
  const codeInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [personType, setPersonType] = useState<PersonType>('PF');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    cpf: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    address_number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
  });

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  useEffect(() => {
    if (editingClient) {
      // Detect if it's PJ based on document length
      const docLength = editingClient.cpf.replace(/\D/g, '').length;
      setPersonType(docLength > 11 ? 'PJ' : 'PF');
      setFormData({
        code: editingClient.code || '',
        name: editingClient.name,
        cpf: editingClient.cpf,
        phone: editingClient.phone || '',
        phone2: editingClient.phone2 || '',
        email: editingClient.email || '',
        address: editingClient.address || '',
        address_number: editingClient.address_number || '',
        neighborhood: editingClient.neighborhood || '',
        city: editingClient.city || '',
        state: editingClient.state || '',
        zipcode: editingClient.zipcode || '',
      });
    } else {
      resetForm();
    }
  }, [editingClient]);

  const resetForm = () => {
    setPersonType('PF');
    setFormData({
      code: '',
      name: '',
      cpf: '',
      phone: '',
      phone2: '',
      email: '',
      address: '',
      address_number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipcode: '',
    });
    setEditingClient(null);
    // Focus on code field
    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 100);
  };

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (!error && data) {
      setClients(data as Client[]);
    }
    setLoading(false);
  };

  const handleCEPSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        toast({
          title: "CEP encontrado",
          description: "Dados do endereço preenchidos automaticamente.",
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar os dados do CEP.",
        variant: "destructive",
      });
    }
  };

  const handleCNPJSearch = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return;

    try {
      toast({ title: "Buscando CNPJ...", description: "Aguarde..." });
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      const data = await response.json();
      
      if (!data.message) {
        setFormData(prev => ({
          ...prev,
          name: data.razao_social || data.nome_fantasia || prev.name,
          address: data.logradouro || prev.address,
          address_number: data.numero || prev.address_number,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.municipio || prev.city,
          state: data.uf || prev.state,
          zipcode: data.cep?.replace(/\D/g, '') || prev.zipcode,
          email: data.email || prev.email,
          phone: data.ddd_telefone_1 || prev.phone,
        }));
        toast({
          title: "CNPJ encontrado",
          description: "Dados da empresa preenchidos automaticamente.",
        });
      } else {
        toast({
          title: "CNPJ não encontrado",
          description: "Verifique o CNPJ informado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching CNPJ:', error);
      toast({
        title: "Erro ao buscar CNPJ",
        description: "Não foi possível buscar os dados do CNPJ.",
        variant: "destructive",
      });
    }
  };

  const getNextClientCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('get_next_client_code');
    if (error) {
      console.error('Error getting next client code:', error);
      return '';
    }
    return data || '';
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.cpf.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: `Nome e ${personType === 'PJ' ? 'CNPJ' : 'CPF'} são obrigatórios.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Auto-generate code if empty and new client
    let clientCode = formData.code;
    if (!editingClient && !clientCode) {
      clientCode = await getNextClientCode();
    }

    const clientData = {
      code: clientCode || null,
      name: formData.name.toUpperCase(),
      cpf: formData.cpf,
      phone: formData.phone || null,
      phone2: formData.phone2 || null,
      email: formData.email || null,
      address: formData.address || null,
      address_number: formData.address_number || null,
      neighborhood: formData.neighborhood || null,
      city: formData.city || null,
      state: formData.state || null,
      zipcode: formData.zipcode || null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', editingClient.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Cliente atualizado com sucesso!" });
        setEditingClient(null);
        fetchClients();
        onClientsChanged?.();
      }
    } else {
      const { error } = await supabase
        .from('clients')
        .insert(clientData);

      if (error) {
        toast({
          title: "Erro ao cadastrar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Cliente cadastrado com sucesso!" });
        resetForm();
        fetchClients();
        onClientsChanged?.();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Cliente excluído com sucesso!" });
      fetchClients();
      onClientsChanged?.();
    }
  };

  const exportToExcel = () => {
    const exportData = clients.filter(c => c.active).map(c => ({
      'Código': c.code || '',
      'Nome': c.name,
      'CPF/CNPJ': c.cpf,
      'Telefone 1': c.phone || '',
      'Telefone 2': c.phone2 || '',
      'Email': c.email || '',
      'Endereço': c.address || '',
      'Número': c.address_number || '',
      'Bairro': c.neighborhood || '',
      'Cidade': c.city || '',
      'UF': c.state || '',
      'CEP': c.zipcode || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'clientes.xlsx');
    toast({ title: "Exportado para Excel com sucesso!" });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Lista de Clientes', 14, 20);

    const tableData = clients.filter(c => c.active).map(c => [
      c.code || '',
      c.name,
      c.cpf,
      c.phone || '',
      c.city || '',
      c.state || '',
    ]);

    autoTable(doc, {
      head: [['Código', 'Nome', 'CPF/CNPJ', 'Telefone', 'Cidade', 'UF']],
      body: tableData,
      startY: 30,
    });

    doc.save('clientes.pdf');
    toast({ title: "Exportado para PDF com sucesso!" });
  };

  const filteredClients = clients.filter(c => 
    c.active && (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cpf.includes(searchQuery) ||
      (c.code && c.code.includes(searchQuery))
    )
  );

  const handleBack = () => {
    if (editingClient) {
      setEditingClient(null);
    } else {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDocumentChange = (value: string) => {
    setFormData(prev => ({ ...prev, cpf: value }));
    
    // If PJ and has 14 digits, search CNPJ
    if (personType === 'PJ') {
      const cleanDoc = value.replace(/\D/g, '');
      if (cleanDoc.length === 14) {
        handleCNPJSearch(value);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-xl font-bold text-white">
              Cadastro de Clientes
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4 p-4 max-h-[calc(90vh-80px)] overflow-hidden">
          {/* Form Section */}
          <Card key={editingClient?.id || 'new'} className="flex-1">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Código</Label>
                  <Input
                    ref={codeInputRef}
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="h-9"
                    placeholder="Auto"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className="h-9 uppercase"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={personType} onValueChange={(v: PersonType) => setPersonType(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{personType === 'PJ' ? 'CNPJ *' : 'CPF *'}</Label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    className="h-9"
                    placeholder={personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone WhatsApp 1</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-9"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone WhatsApp 2</Label>
                  <Input
                    value={formData.phone2}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone2: e.target.value }))}
                    className="h-9"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-9"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">CEP</Label>
                  <Input
                    value={formData.zipcode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, zipcode: value }));
                      if (value.replace(/\D/g, '').length === 8) {
                        handleCEPSearch(value);
                      }
                    }}
                    className="h-9"
                    placeholder="00000-000"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="h-9"
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div>
                  <Label className="text-xs">Número</Label>
                  <Input
                    value={formData.address_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                    className="h-9"
                    placeholder="Nº"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Bairro</Label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="h-9"
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="h-9"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label className="text-xs">UF</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    className="h-9 uppercase"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="gap-2 border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="gap-1 hover:bg-green-100 hover:text-green-700 hover:border-green-400"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="gap-1 hover:bg-red-100 hover:text-red-700 hover:border-red-400"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="space-y-2 p-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {client.code && <span className="text-muted-foreground mr-2">[{client.code}]</span>}
                        {client.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {client.cpf} {client.city && `• ${client.city}/${client.state}`}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingClient(client)}
                        className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                        className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {loading ? 'Carregando...' : 'Nenhum cliente encontrado'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
