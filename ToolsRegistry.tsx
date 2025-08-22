import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertToolSchema, type InsertTool } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Edit, History, Camera } from 'lucide-react';

export function ToolsRegistry() {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const { data: tools, isLoading } = useQuery({
    queryKey: ['/api/tools'],
  });

  const createToolMutation = useMutation({
    mutationFn: async (data: InsertTool & { photo?: File }) => {
      // Se não há foto, enviar como JSON
      if (!data.photo) {
        const { photo, ...toolData } = data;
        return await apiRequest('POST', '/api/tools', toolData);
      }
      
      // Se há foto, enviar como FormData
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photo' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      formData.append('photo', data.photo);
      
      return await apiRequest('POST', '/api/tools', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      toast({
        title: "Ferramenta Registada",
        description: "Ferramenta registada com sucesso"
      });
      reset();
      setSelectedPhoto(null);
    },
    onError: (error: any) => {
      console.error('Erro no registo de ferramenta:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao registar ferramenta",
        variant: "destructive"
      });
    }
  });

  const { register, handleSubmit, reset, setValue } = useForm<InsertTool>({
    resolver: zodResolver(insertToolSchema),
    defaultValues: {
      state: 'excelente'
    }
  });

  const onSubmit = (data: InsertTool) => {
    console.log('Dados do formulário de ferramenta:', data);
    // Garantir que a data de manutenção está no formato correto
    const formattedData = {
      ...data,
      lastMaintenance: data.lastMaintenance 
        ? (typeof data.lastMaintenance === 'string' 
          ? new Date(data.lastMaintenance) 
          : data.lastMaintenance)
        : undefined
    };
    console.log('Dados formatados para envio:', formattedData);
    createToolMutation.mutate({ ...formattedData, photo: selectedPhoto || undefined });
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      'excelente': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'bom': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'funcional': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'manutencao': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'avariado': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return variants[condition as keyof typeof variants] || variants.funcional;
  };

  const getConditionText = (condition: string) => {
    const texts = {
      'excelente': 'Excelente',
      'bom': 'Bom',
      'funcional': 'Funcional',
      'manutencao': 'Precisa manutenção',
      'avariado': 'Avariado'
    };
    return texts[condition as keyof typeof texts] || condition;
  };

  return (
    <div className="space-y-8">
      {/* Add New Tool */}
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Registar Nova Ferramenta</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Ferramenta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Berbequim Bosch Professional"
                  {...register('name')}
                  className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furadoras">Furadoras</SelectItem>
                    <SelectItem value="chaves-fendas">Chaves de fendas</SelectItem>
                    <SelectItem value="martelos">Martelos</SelectItem>
                    <SelectItem value="medicao">Instrumentos de medição</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state">Estado</Label>
                <Select onValueChange={(value) => setValue('state', value as "excelente" | "bom" | "funcional" | "manutencao" | "avariado")}>
                  <SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm">
                    <SelectValue placeholder="Selecionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="funcional">Funcional</SelectItem>
                    <SelectItem value="manutencao">Precisa manutenção</SelectItem>
                    <SelectItem value="avariado">Avariado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Foto</Label>
                <FileUpload
                  onFilesSelected={(files) => setSelectedPhoto(files[0] || null)}
                  accept=".jpg,.jpeg,.png"
                >
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground">Tirar foto ou selecionar</p>
                </FileUpload>
                {selectedPhoto && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Foto selecionada: {selectedPhoto.name}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais..."
                  rows={3}
                  {...register('notes')}
                  className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                disabled={createToolMutation.isPending}
              >
                {createToolMutation.isPending ? 'A registar...' : 'Registar Ferramenta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Tools Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-glass border-glass backdrop-blur-sm animate-pulse">
              <div className="h-48 bg-white/10 dark:bg-black/10"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.isArray(tools) ? tools.map((tool: any) => (
            <Card key={tool.id} className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                {tool.photoPath ? (
                  <img 
                    src={`/uploads/${tool.photoPath}`} 
                    alt={tool.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-2">{tool.name}</h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground capitalize">{tool.category}</span>
                  <Badge className={getConditionBadge(tool.condition)}>
                    {getConditionText(tool.condition)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {tool.lastMaintenance 
                    ? `Última manutenção: ${new Date(tool.lastMaintenance).toLocaleDateString('pt-PT')}`
                    : 'Sem manutenção registada'
                  }
                </p>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-xs px-2"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 text-xs px-2"
                  >
                    <History className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : null}
        </div>
      )}
    </div>
  );
}
