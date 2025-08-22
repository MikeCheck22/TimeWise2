import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, UserCheck, Car, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTimeRecordSchema, type SiteManager, type WorkLocation } from "@shared/schema";
import { z } from "zod";

// Schema for trabalho normal (SEM campo de horas - horário fixo 8h)
const formSchema = insertTimeRecordSchema.extend({
  date: z.string().min(1, "Data é obrigatória"),
  siteManagerId: z.string().min(1, "Encarregado de obra é obrigatório"),
  workLocationId: z.string().min(1, "Local de trabalho é obrigatório"),
  displacement: z.boolean().default(false),
  // REMOVIDO: campo hours - trabalho normal é sempre 8h fixas
});

export default function TrabalhoNormalForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateType: "trabalho-normal",
      displacement: false,
      extraHours: "",
    },
  });

  // Get site managers and work locations
  const { data: siteManagers = [] } = useQuery<SiteManager[]>({
    queryKey: ['/api/site-managers'],
  });

  const { data: workLocations = [] } = useQuery<WorkLocation[]>({
    queryKey: ['/api/work-locations'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/time-records", {
        ...data,
        date: new Date(data.date).toISOString(),
        extraHours: data.extraHours ? parseFloat(data.extraHours) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Registro de trabalho criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-records'] });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Clock className="w-6 h-6 mr-2 text-blue-400" />
              Trabalho – Horário Normal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Data */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Data
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="bg-white/10 border-white/20 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Encarregado de Obra */}
                <FormField
                  control={form.control}
                  name="siteManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Encarregado de Obra
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione o encarregado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteManagers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Local de Trabalho */}
                <FormField
                  control={form.control}
                  name="workLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Local de Trabalho
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione o local" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Deslocação */}
                <FormField
                  control={form.control}
                  name="displacement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/20 p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-white flex items-center">
                          <Car className="w-4 h-4 mr-2" />
                          Deslocação
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Períodos de Horas Extras */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-white flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Períodos de Horas Extras
                    </FormLabel>
                    <Button
                      type="button"
                      onClick={() => {
                        // Adicionar lógica para períodos múltiplos
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      data-testid="button-add-period"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Período
                    </Button>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">Período 1 (opcional)</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormLabel className="text-white">Início</FormLabel>
                        <Input
                          type="time"
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="18:00"
                          data-testid="input-period-start-0"
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-white">Fim</FormLabel>
                        <Input
                          type="time"
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="20:00"
                          data-testid="input-period-end-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/templates')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 bg-gradient-primary hover:shadow-glow"
                  >
                    {createMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}