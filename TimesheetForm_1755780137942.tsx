import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { insertTimesheetSchema, type InsertTimesheet } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export function TimesheetForm() {
  const createTimesheetMutation = useMutation({
    mutationFn: async (data: InsertTimesheet) => {
      return await apiRequest('POST', '/api/timesheets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheets'] });
      toast({
        title: "Registo Criado",
        description: "Dia de trabalho registado com sucesso"
      });
      reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar registo",
        variant: "destructive"
      });
    }
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<InsertTimesheet>({
    resolver: zodResolver(insertTimesheetSchema),
    defaultValues: {
      date: new Date(),
      breakMinutes: 60,
      workType: 'Instalação Elétrica'
    }
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const breakMinutes = watch('breakMinutes');

  // Calculate total hours
  React.useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const totalHours = Math.max(0, diffHours - (breakMinutes || 0) / 60);
      setValue('totalHours', totalHours.toFixed(2));
    }
  }, [startTime, endTime, breakMinutes, setValue]);

  const onSubmit = (data: InsertTimesheet) => {
    createTimesheetMutation.mutate(data);
  };

  return (
    <Card className="bg-glass border-glass backdrop-blur-sm shadow-elegant">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="projectName">Projeto</Label>
              <Input
                id="projectName"
                placeholder="Nome do projeto"
                {...register('projectName')}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startTime">Início</Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
            <div>
              <Label htmlFor="endTime">Fim</Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
            <div>
              <Label htmlFor="breakMinutes">Pausa (min)</Label>
              <Input
                id="breakMinutes"
                type="number"
                {...register('breakMinutes', { valueAsNumber: true })}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
            <div>
              <Label htmlFor="totalHours">Total (h)</Label>
              <Input
                id="totalHours"
                {...register('totalHours')}
                readOnly
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição das Atividades</Label>
            <Textarea
              id="description"
              placeholder="Descreva as atividades realizadas..."
              rows={4}
              {...register('description')}
              className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Endereço do trabalho"
                {...register('location')}
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
              />
            </div>
            <div>
              <Label htmlFor="workType">Tipo de Trabalho</Label>
              <Select onValueChange={(value) => setValue('workType', value)}>
                <SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instalação Elétrica">Instalação Elétrica</SelectItem>
                  <SelectItem value="Canalização">Canalização</SelectItem>
                  <SelectItem value="Reparação">Reparação</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Consultoria">Consultoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            disabled={createTimesheetMutation.isPending}
          >
            {createTimesheetMutation.isPending ? 'A registar...' : 'Registar Dia de Trabalho'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
