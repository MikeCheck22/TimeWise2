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
import { Plus, Edit, History, Search, Wrench } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

const toolSchema = z.object({
  name: z.string().min(1, "Nome da ferramenta é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  state: z.enum(["excelente", "bom", "funcional", "manutencao", "avariado"]).default("bom"),
  notes: z.string().optional(),
  lastMaintenance: z.string().optional(),
});

type ToolForm = z.infer<typeof toolSchema>;

export function Tools() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const form = useForm<ToolForm>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      name: "",
      category: "",
      state: "bom",
      notes: "",
    },
  });

  // Fetch data
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['/api/tools'],
  });

  // Mutations
  const createToolMutation = useMutation({
    mutationFn: async (data: ToolForm & { photo?: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photo' && value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });
      if (data.photo) {
        formData.append('photo', data.photo);
      }
      
      const response = await apiRequest('POST', '/api/tools', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      form.reset();
      setSelectedFiles([]);
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Ferramenta registada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registar ferramenta",
        variant: "destructive",
      });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ToolForm> }) => {
      const response = await apiRequest('PUT', `/api/tools/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      toast({
        title: "Sucesso",
        description: "Ferramenta atualizada com sucesso",
      });
    },
  });

  const handleSubmit = (data: ToolForm) => {
    const photo = selectedFiles[0];
    createToolMutation.mutate({ ...data, photo });
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'excelente':
        return <Badge className="bg-green-500/20 text-green-400">Excelente</Badge>;
      case 'bom':
        return <Badge className="bg-blue-500/20 text-blue-400">Bom</Badge>;
      case 'funcional':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Funcional</Badge>;
      case 'manutencao':
        return <Badge className="bg-orange-500/20 text-orange-400">Precisa manutenção</Badge>;
      case 'avariado':
        return <Badge className="bg-red-500/20 text-red-400">Avariado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{state}</Badge>;
    }
  };

  const filteredTools = (tools as any[]).filter((tool: any) => {
    const matchesCategory = categoryFilter === 'all' || !categoryFilter || tool.category === categoryFilter;
    const matchesSearch = !searchTerm || 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [...new Set(tools?.map((tool: any) => tool.category) || [])];

  return (
    <div className="space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            🔧 Arsenal de Ferramentas
          </h1>
          <p className="text-blue-200 mt-2 text-sm sm:text-base font-medium">
            🛠️ Inventário completo e controlo de manutenções
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-warning hover:shadow-glow flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Nova Ferramenta</span>
        </Button>
      </div>

      {/* New Tool Form */}
      {showForm && (
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              🔨 Adicionar Nova Ferramenta
            </CardTitle>
            <p className="text-blue-300 text-sm mt-1">Complete os dados da ferramenta para inventário</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <Label htmlFor="name" className="text-blue-200 text-sm sm:text-base">Nome da Ferramenta</Label>
                  <Input
                    {...form.register("name")}
                    placeholder="Ex: Berbequim Bosch Professional"
                    className="bg-glass border-glass text-sm sm:text-base"
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category" className="text-blue-200 text-sm sm:text-base">Categoria</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger className="bg-glass border-glass text-sm sm:text-base">
                      <SelectValue placeholder="Selecionar categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furadoras">🔩 Furadoras</SelectItem>
                      <SelectItem value="chaves-fendas">🔧 Chaves de fendas</SelectItem>
                      <SelectItem value="martelos">🔨 Martelos</SelectItem>
                      <SelectItem value="medicao">📏 Instrumentos de medição</SelectItem>
                      <SelectItem value="soldadura">⚡ Soldadura</SelectItem>
                      <SelectItem value="corte">✂️ Ferramentas de corte</SelectItem>
                      <SelectItem value="outros">🛠️ Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-destructive text-xs sm:text-sm mt-1">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state" className="text-blue-200 text-sm sm:text-base">Estado</Label>
                  <Select onValueChange={(value) => form.setValue("state", value as any)}>
                    <SelectTrigger className="bg-glass border-glass text-sm sm:text-base">
                      <SelectValue placeholder="Bom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">🌟 Excelente</SelectItem>
                      <SelectItem value="bom">✅ Bom</SelectItem>
                      <SelectItem value="funcional">⚠️ Funcional</SelectItem>
                      <SelectItem value="manutencao">🔧 Precisa manutenção</SelectItem>
                      <SelectItem value="avariado">❌ Avariado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lastMaintenance" className="text-blue-200 text-sm sm:text-base">📅 Última Manutenção</Label>
                  <Input
                    type="date"
                    {...form.register("lastMaintenance")}
                    className="bg-glass border-glass text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-blue-200 text-sm sm:text-base">📝 Observações</Label>
                  <Textarea
                    {...form.register("notes")}
                    rows={3}
                    placeholder="Detalhes sobre estado, localização, manutenções..."
                    className="bg-glass border-glass resize-none text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-blue-200 mb-3 sm:mb-4 block text-sm sm:text-base">📸 Foto da Ferramenta</Label>
                  <FileUpload
                    accept="image/*"
                    maxSize={5}
                    allowCamera={true}
                    onFilesSelected={setSelectedFiles}
                    className="min-h-[200px] sm:min-h-[300px]"
                  />
                  <p className="text-blue-300/70 text-xs mt-2">Capture ou carregue uma imagem para identificação</p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Button
                  type="submit"
                  className="bg-gradient-warning hover:shadow-glow w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                  disabled={createToolMutation.isPending}
                >
                  {createToolMutation.isPending ? "📝 Registando..." : "✅ Adicionar ao Arsenal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tools Grid */}
      <Card className="bg-glass border-glass">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-white text-lg sm:text-xl">🔧 Arsenal Registado</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 w-full sm:w-48 text-sm">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                <Input
                  placeholder="Procurar ferramentas..."
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
          ) : filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredTools.map((tool: any) => (
                <Card key={tool.id} className="bg-white/5 hover:bg-white/10 hover-glow transition-all overflow-hidden">
                  <div className="h-32 sm:h-48 bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                    {tool.photoPath ? (
                      <img 
                        src={`/uploads/${tool.photoPath.split('/').pop()}`}
                        alt={tool.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Wrench className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                    )}
                  </div>
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-base sm:text-lg mb-2 text-white truncate">{tool.name}</h3>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center sm:mb-2">
                      <span className="text-xs sm:text-sm text-blue-300 capitalize">{tool.category}</span>
                      {getStateBadge(tool.state)}
                    </div>
                    <p className="text-xs sm:text-sm text-blue-200 mb-3 truncate">
                      {tool.lastMaintenance 
                        ? `Última manutenção: ${format(new Date(tool.lastMaintenance), 'dd/MM/yyyy')}`
                        : 'Sem manutenção registada'
                      }
                    </p>
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs sm:text-sm transition-colors px-2 py-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">✏️</span>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs sm:text-sm transition-colors px-2 py-1"
                      >
                        <History className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Histórico</span>
                        <span className="sm:hidden">📜</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-50" />
              <p className="text-blue-300">Nenhuma ferramenta encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
