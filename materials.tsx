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
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

const materialRequestSchema = z.object({
  itemName: z.string().min(1, "Nome do item é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  priority: z.enum(["baixa", "normal", "alta", "urgente"]).default("normal"),
  dateNeeded: z.string().optional(),
  projectSite: z.string().min(1, "Obra é obrigatória"),
});

type MaterialRequestForm = z.infer<typeof materialRequestSchema>;

export function Materials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<MaterialRequestForm>({
    resolver: zodResolver(materialRequestSchema),
    defaultValues: {
      itemName: "",
      quantity: 1,
      unit: "unidade",
      priority: "normal",
      projectSite: "",
    },
  });

  // Fetch data
  const { data: materialRequests = [], isLoading } = useQuery({
    queryKey: ['/api/material-requests'],
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: async (data: MaterialRequestForm & { file?: File }) => {
      // Se não há ficheiro, enviar como JSON
      if (!data.file) {
        const { file, ...requestData } = data;
        const response = await apiRequest('POST', '/api/material-requests', requestData);
        return response.json();
      }
      
      // Se há ficheiro, enviar como FormData
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'file' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      formData.append('file', data.file);
      
      const response = await apiRequest('POST', '/api/material-requests', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests'] });
      form.reset();
      setSelectedFile(null);
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Pedido de material submetido com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao submeter pedido de material",
        variant: "destructive",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/material-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests'] });
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado",
      });
    },
  });

  const handleSubmit = (data: MaterialRequestForm) => {
    createRequestMutation.mutate({
      ...data,
      file: selectedFile || undefined
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">Rejeitado</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-500/20 text-blue-400">Entregue</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return <Badge className="bg-red-500/20 text-red-400">Urgente</Badge>;
      case 'alta':
        return <Badge className="bg-orange-500/20 text-orange-400">Alta</Badge>;
      case 'normal':
        return <Badge className="bg-green-500/20 text-green-400">Normal</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">Baixa</Badge>;
    }
  };

  const filteredRequests = (materialRequests as any[]).filter((request: any) => {
    return statusFilter === 'all' || !statusFilter || request.status === statusFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pedidos de Material</h1>
          <p className="text-blue-200 mt-1">Gira pedidos e aprovações de materiais</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-warning hover:shadow-glow flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Pedido</span>
        </Button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="text-white">Novo Pedido de Material</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="projectSite" className="text-blue-200">Obra</Label>
                  <Input
                    {...form.register("projectSite")}
                    placeholder="Nome da obra..."
                    className="bg-glass border-glass"
                  />
                  {form.formState.errors.projectSite && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.projectSite.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="itemName" className="text-blue-200">Item</Label>
                  <Input
                    {...form.register("itemName")}
                    placeholder="Nome do item ou material..."
                    className="bg-glass border-glass"
                  />
                  {form.formState.errors.itemName && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.itemName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity" className="text-blue-200">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      {...form.register("quantity")}
                      placeholder="1"
                      className="bg-glass border-glass"
                    />
                    {form.formState.errors.quantity && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.quantity.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="unit" className="text-blue-200">Unidade</Label>
                    <Select onValueChange={(value) => form.setValue("unit", value)}>
                      <SelectTrigger className="bg-glass border-glass">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidade">Unidade</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="m">Metro</SelectItem>
                        <SelectItem value="m2">Metro²</SelectItem>
                        <SelectItem value="m3">Metro³</SelectItem>
                        <SelectItem value="litro">Litro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="priority" className="text-blue-200">Prioridade</Label>
                  <Select onValueChange={(value) => form.setValue("priority", value as any)}>
                    <SelectTrigger className="bg-glass border-glass">
                      <SelectValue placeholder="Normal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateNeeded" className="text-blue-200">Data Necessária</Label>
                  <Input
                    type="date"
                    {...form.register("dateNeeded")}
                    className="bg-glass border-glass"
                  />
                </div>

                <div>
                  <Label className="text-blue-200">Anexo (Opcional)</Label>
                  <FileUpload
                    accept="image/*,application/pdf"
                    maxSize={10}
                    onFilesSelected={(files) => setSelectedFile(files[0] || null)}
                    className="bg-glass border-glass"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <Button
                  type="submit"
                  className="bg-gradient-warning hover:shadow-glow px-8 py-3"
                  disabled={createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending ? "Submetendo..." : "Submeter Pedido"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <Card className="bg-glass border-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Pedidos Submetidos</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 w-48">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request: any) => (
                <Card key={request.id} className="bg-white/5 hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-white">{request.itemName}</h3>
                        <p className="text-sm text-blue-300">Obra: {request.projectSite}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Quantidade:</span>
                        <span className="text-white">{request.quantity} {request.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Prioridade:</span>
                        {getPriorityBadge(request.priority)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Data Pedido:</span>
                        <span className="text-white">
                          {format(new Date(request.createdAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      {request.dateNeeded && (
                        <div className="flex justify-between">
                          <span className="text-blue-200">Necessário até:</span>
                          <span className="text-white">
                            {request.dateNeeded && new Date(request.dateNeeded).getTime() 
                              ? format(new Date(request.dateNeeded), 'dd/MM/yyyy') 
                              : 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>

                    {user?.role === 'admin' && request.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-white/20 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'approved' })}
                          className="bg-green-500 hover:bg-green-600 flex-1"
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'rejected' })}
                          className="flex-1"
                        >
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-blue-300">Nenhum pedido de material encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
