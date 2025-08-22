import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Eye, Download, Edit, Search } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

const invoiceSchema = z.object({
  category: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  supplier: z.string().min(1, "Fornecedor é obrigatório"),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que 0"),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      category: "",
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      supplier: "",
    },
  });

  // Fetch data
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceForm & { file?: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'file' && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      if (data.file) {
        formData.append('file', data.file);
      }
      
      const response = await apiRequest('POST', '/api/invoices', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      form.reset();
      setSelectedFiles([]);
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Fatura registada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registar fatura",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/invoices/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Sucesso",
        description: "Status da fatura atualizado",
      });
    },
  });

  const handleSubmit = (data: InvoiceForm) => {
    const file = selectedFiles[0];
    createInvoiceMutation.mutate({ ...data, file });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400">Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">Rejeitada</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
    }
  };

  const filteredInvoices = (invoices as any[]).filter((invoice: any) => {
    const matchesStatus = statusFilter === 'all' || !statusFilter || invoice.status === statusFilter;
    const matchesSearch = !searchTerm || 
      invoice.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            💰 Fundo de Maneio
          </h1>
          <p className="text-blue-200 mt-2 text-sm sm:text-base font-medium">
            ✨ Gestão inteligente das suas despesas empresariais
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-success hover:shadow-glow flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Nova Fatura</span>
        </Button>
      </div>
      {/* Upload Section */}
      {showForm && (
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              📄 Registar Nova Despesa
            </CardTitle>
            <p className="text-blue-300 text-sm mt-1">Carregue a fatura e preencha os dados</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* File Upload */}
              <div>
                <Label className="text-blue-200 mb-3 sm:mb-4 block text-sm sm:text-base">Ficheiro da Fatura</Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10}
                  onFilesSelected={setSelectedFiles}
                  className="min-h-[150px] sm:min-h-[200px]"
                />
              </div>

              {/* Form */}
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="category" className="text-blue-200 text-sm sm:text-base">Descrição</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger className="bg-glass border-glass text-sm sm:text-base">
                      <SelectValue placeholder="Selecione a descrição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="ferramenta">Ferramenta</SelectItem>
                      <SelectItem value="gasóleo">Gasóleo</SelectItem>
                      <SelectItem value="portagem">Portagem</SelectItem>
                      <SelectItem value="estacionamento">Estacionamento</SelectItem>
                      <SelectItem value="conserv. viatura">Conserv. Viatura</SelectItem>
                      <SelectItem value="refeições">Refeições</SelectItem>
                      <SelectItem value="estadia">Estadia</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="correios">Correios</SelectItem>
                      <SelectItem value="diversos">Diversos</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="date" className="text-blue-200 text-sm sm:text-base">Data da Fatura</Label>
                    <Input
                      type="date"
                      {...form.register("date")}
                      className="bg-glass border-glass text-sm sm:text-base"
                    />
                    {form.formState.errors.date && (
                      <p className="text-destructive text-xs sm:text-sm mt-1">
                        {form.formState.errors.date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-blue-200 text-sm sm:text-base">Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("amount")}
                      className="bg-glass border-glass text-sm sm:text-base"
                    />
                    {form.formState.errors.amount && (
                      <p className="text-destructive text-xs sm:text-sm mt-1">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier" className="text-blue-200 text-sm sm:text-base">Fornecedor</Label>
                  <Input
                    {...form.register("supplier")}
                    placeholder="Escreva o nome do fornecedor"
                    className="bg-glass border-glass text-sm sm:text-base"
                  />
                  {form.formState.errors.supplier && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">
                      {form.formState.errors.supplier.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-success hover:shadow-glow text-sm sm:text-base py-2 sm:py-3"
                  disabled={createInvoiceMutation.isPending}
                >
                  {createInvoiceMutation.isPending ? "Registando..." : "Registar Fatura"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Invoices List */}
      <Card className="bg-glass border-glass">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-white text-lg sm:text-xl">💰 Despesas Registadas</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 w-full sm:w-48 text-sm">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="pending">⏳ Pendente</SelectItem>
                  <SelectItem value="approved">✅ Aprovada</SelectItem>
                  <SelectItem value="rejected">❌ Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                <Input
                  placeholder="Procurar faturas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 pl-10 w-full sm:w-64 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredInvoices.length > 0 ? (
            <>
              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-blue-200 font-medium text-sm">Descrição</th>
                      <th className="text-left py-3 px-4 text-blue-200 font-medium text-sm">Data</th>
                      <th className="text-left py-3 px-4 text-blue-200 font-medium text-sm">Fornecedor</th>
                      <th className="text-left py-3 px-4 text-blue-200 font-medium text-sm">Valor</th>
                      <th className="text-left py-3 px-4 text-blue-200 font-medium text-sm">Estado</th>
                      <th className="text-center py-3 px-4 text-blue-200 font-medium text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice: any) => (
                      <tr key={invoice.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-4 px-4 font-medium text-white text-sm">{invoice.category}</td>
                        <td className="py-4 px-4 text-white text-sm">
                          {format(new Date(invoice.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-4 px-4 text-white text-sm">{invoice.supplier || '-'}</td>
                        <td className="py-4 px-4 text-white text-sm font-bold">€{parseFloat(invoice.amount).toFixed(2)}</td>
                        <td className="py-4 px-4">{getStatusBadge(invoice.status)}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {invoice.filePath && (
                              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {user?.role === 'admin' && (
                              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards - Shown only on Mobile */}
              <div className="sm:hidden grid grid-cols-1 gap-4">
                {filteredInvoices.map((invoice: any) => (
                  <Card key={invoice.id} className="bg-white/5 hover:bg-white/10 hover-glow transition-all">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-base truncate">{invoice.category}</h3>
                          <p className="text-blue-300 text-sm mt-1">{format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Fornecedor:</span>
                          <span className="text-white font-medium truncate ml-2">{invoice.supplier || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Valor:</span>
                          <span className="text-white font-bold">€{parseFloat(invoice.amount).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 text-blue-400 hover:text-white text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="hidden xs:inline">Ver</span>
                          <span className="xs:hidden">👁️</span>
                        </Button>
                        {invoice.filePath && (
                          <Button variant="ghost" size="sm" className="flex-1 text-blue-400 hover:text-white text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            <span className="hidden xs:inline">Download</span>
                            <span className="xs:hidden">📥</span>
                          </Button>
                        )}
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="sm" className="flex-1 text-blue-400 hover:text-white text-xs">
                            <Edit className="w-3 h-3 mr-1" />
                            <span className="hidden xs:inline">Editar</span>
                            <span className="xs:hidden">✏️</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-50">💳</div>
              <p className="text-blue-300">Nenhuma fatura encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
