import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertMaterialRequestSchema, type InsertMaterialRequest } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Upload } from 'lucide-react';

interface RequestItem {
  itemName: string;
  quantity: number;
}

export function MaterialRequests() {
  const [items, setItems] = useState<RequestItem[]>([{ itemName: '', quantity: 1 }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['/api/material-requests'],
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: InsertMaterialRequest & { items: RequestItem[] }) => {
      return await apiRequest('POST', '/api/material-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests'] });
      toast({
        title: "Pedido Enviado",
        description: "Pedido de material enviado com sucesso"
      });
      reset();
      setItems([{ itemName: '', quantity: 1 }]);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar pedido",
        variant: "destructive"
      });
    }
  });

  const { register, handleSubmit, reset, setValue } = useForm<InsertMaterialRequest>({
    resolver: zodResolver(insertMaterialRequestSchema),
    defaultValues: {
      priority: 'normal',
      status: 'pending'
    }
  });

  const onSubmit = (data: InsertMaterialRequest) => {
    const validItems = items.filter(item => item.itemName.trim() && item.quantity > 0);
    createRequestMutation.mutate({ ...data, items: validItems });
  };

  const addItem = () => {
    setItems([...items, { itemName: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'approved': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'delivered': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'baixa': 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
      'normal': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'alta': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'urgente': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return variants[priority as keyof typeof variants] || variants.normal;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* New Request Form */}
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Novo Pedido de Material</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="itemName">Para que obra</Label>
              <Input
                id="itemName"
                placeholder="Nome da obra/projeto"
                {...register('itemName')}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select onValueChange={(value) => setValue('priority', value as 'baixa' | 'normal' | 'alta' | 'urgente')}>
                  <SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm">
                    <SelectValue placeholder="Selecionar prioridade" />
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
                <Label htmlFor="dateNeeded">Data Necessária</Label>
                <Input
                  id="dateNeeded"
                  type="date"
                  {...register('dateNeeded', { 
                    setValueAs: (value) => value ? new Date(value) : new Date() 
                  })}
                  className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                />
              </div>
            </div>
            
            {/* Items List */}
            <div>
              <Label>Itens Solicitados</Label>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      placeholder="Nome do item"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      className="flex-1 bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-20 bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItem}
                className="mt-3 text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar item
              </Button>
            </div>
            
            {/* File Upload */}
            <div>
              <Label>Arquivo (opcional)</Label>
              <div className="border-2 border-dashed border-white/30 dark:border-gray-600 rounded-lg p-4 bg-white/10 dark:bg-black/10">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos aceites: PDF, JPEG, PNG (máx. 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-primary mt-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'A enviar...' : 'Enviar Pedido'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Requests History */}
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-foreground">Pedidos Recentes</h3>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
              Ver todos
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 dark:bg-black/10 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(requests) ? requests.slice(0, 3).map((request: any) => (
                <div key={request.id} className="bg-white/10 dark:bg-black/10 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{request.projectName} - {request.category}</h4>
                      <p className="text-sm text-muted-foreground">
                        Pedido #{request.id.slice(-3)} • {new Date(request.createdAt).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(request.status)}>
                      {request.status === 'delivered' ? 'Entregue' : 
                       request.status === 'approved' ? 'Aprovado' : 'Pendente'}
                    </Badge>
                  </div>
                  {request.items && request.items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {request.items.slice(0, 3).map((item: any, i: number) => (
                        <p key={i}>• {item.itemName} ({item.quantity} unidades)</p>
                      ))}
                      {request.items.length > 3 && (
                        <p>... e mais {request.items.length - 3} itens</p>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20 dark:border-gray-600">
                    <Badge className={getPriorityBadge(request.priority)}>
                      Prioridade: {request.priority}
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              )) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
