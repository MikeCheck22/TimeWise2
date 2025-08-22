import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertInvoiceSchema, type InsertInvoice } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function InvoiceManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice & { file?: File }) => {
      // Se não há ficheiro, enviar como JSON
      if (!data.file) {
        const { file, ...invoiceData } = data;
        return await apiRequest('POST', '/api/invoices', invoiceData);
      }
      
      // Se há ficheiro, enviar como FormData
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'file' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      formData.append('file', data.file);
      
      return await apiRequest('POST', '/api/invoices', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Fatura Registada",
        description: "Fatura registada com sucesso"
      });
      reset();
      setSelectedFile(null);
    },
    onError: (error: any) => {
      console.error('Erro no registo de fatura:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao registar fatura",
        variant: "destructive"
      });
    }
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      date: new Date(),
      category: 'material',
      status: 'pending'
    }
  });

  const onSubmit = (data: InsertInvoice) => {
    console.log('Dados do formulário de fatura:', data);
    // Garantir que a data está no formato correto
    const formattedData = {
      ...data,
      date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
      amount: String(data.amount)
    };
    console.log('Dados formatados para envio:', formattedData);
    createInvoiceMutation.mutate({ ...formattedData, file: selectedFile || undefined });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'approved': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'rejected': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const totalAmount = Array.isArray(invoices) ? invoices.reduce((sum: number, invoice: any) => sum + parseFloat(invoice.amount || 0), 0) : 0;
  const approvedAmount = Array.isArray(invoices) ? invoices.filter((i: any) => i.status === 'approved').reduce((sum: number, invoice: any) => sum + parseFloat(invoice.amount || 0), 0) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Invoice Form */}
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Nova Fatura</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', { 
                    setValueAs: (value) => value ? new Date(value) : new Date() 
                  })}
                  className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                  className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combustivel">Combustível</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição da despesa..."
                rows={3}
                {...register('description')}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
            
            <div>
              <Label>Fatura (PDF/Imagem)</Label>
              <FileUpload
                onFileSelect={setSelectedFile}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? 'A registar...' : 'Registar Fatura'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Recent Invoices */}
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-foreground">Faturas Recentes</h3>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              Ver todas
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
              {Array.isArray(invoices) ? invoices.slice(0, 3).map((invoice: any) => (
                <div key={invoice.id} className="bg-white/10 dark:bg-black/10 rounded-lg p-4 border-l-4 border-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">{invoice.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('pt-PT')}
                      </p>
                      <Badge className={`mt-2 ${getStatusBadge(invoice.status)}`}>
                        {invoice.status === 'approved' ? 'Aprovada' : 
                         invoice.status === 'rejected' ? 'Rejeitada' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="font-bold text-foreground">€{parseFloat(invoice.amount).toFixed(2)}</p>
                  </div>
                </div>
              )) : null}
            </div>
          )}
          
          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-white/20 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">€{totalAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total este mês</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">€{approvedAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Aprovado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
