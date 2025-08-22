import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, ClockIcon, MapPin, UserCheck, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTimeRecordSchema, type SiteManager, type WorkLocation } from "@shared/schema";
import { z } from "zod";

// Schema para trabalho reduzido - COM períodos de horas extras
const overtimePeriodSchema = z.object({
  start: z.string().min(1, "Hora inicial obrigatória"),
  end: z.string().min(1, "Hora final obrigatória"),
});

const formSchema = insertTimeRecordSchema.extend({
  date: z.string().min(1, "Data é obrigatória"),
  siteManagerId: z.string().min(1, "Encarregado de obra é obrigatório"),
  workLocationId: z.string().min(1, "Local de trabalho é obrigatório"),
  // Múltiplos períodos de horas extras: ex: 18h-20h, 22h-00h
  overtimePeriods: z.array(overtimePeriodSchema).min(1, "Pelo menos um período é obrigatório"),
});

export default function TrabalhoReduzidoForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [overtimePeriods, setOvertimePeriods] = useState([{ start: "", end: "" }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateType: "trabalho-reduzido",
      overtimePeriods: [{ start: "", end: "" }],
    },
  });

  // Adicionar novo período de horas extras
  const addOvertimePeriod = () => {
    const newPeriods = [...overtimePeriods, { start: "", end: "" }];
    setOvertimePeriods(newPeriods);
    form.setValue("overtimePeriods", newPeriods);
  };

  // Remover período de horas extras
  const removeOvertimePeriod = (index: number) => {
    if (overtimePeriods.length > 1) {
      const newPeriods = overtimePeriods.filter((_, i) => i !== index);
      setOvertimePeriods(newPeriods);
      form.setValue("overtimePeriods", newPeriods);
    }
  };

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
        overtimePeriods: JSON.stringify(data.overtimePeriods), // Converte para JSON
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <ClockIcon className="w-6 h-6 mr-2 text-green-400" />
              Trabalho – Horário Reduzido
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

                {/* Períodos de Horas Extras */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-white flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Períodos de Horas Extras
                    </FormLabel>
                    <Button
                      type="button"
                      onClick={addOvertimePeriod}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      data-testid="button-add-period"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Período
                    </Button>
                  </div>
                  
                  {overtimePeriods.map((period, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium">Período {index + 1}</h4>
                        {overtimePeriods.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeOvertimePeriod(index)}
                            data-testid={`button-remove-period-${index}`}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`overtimePeriods.${index}.start`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Início</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="bg-white/10 border-white/20 text-white"
                                  placeholder="18:00"
                                  {...field}
                                  onChange={(e) => {
                                    const newPeriods = [...overtimePeriods];
                                    newPeriods[index].start = e.target.value;
                                    setOvertimePeriods(newPeriods);
                                    form.setValue(`overtimePeriods.${index}.start`, e.target.value);
                                  }}
                                  data-testid={`input-period-start-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`overtimePeriods.${index}.end`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Fim</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="bg-white/10 border-white/20 text-white"
                                  placeholder="20:00"
                                  {...field}
                                  onChange={(e) => {
                                    const newPeriods = [...overtimePeriods];
                                    newPeriods[index].end = e.target.value;
                                    setOvertimePeriods(newPeriods);
                                    form.setValue(`overtimePeriods.${index}.end`, e.target.value);
                                  }}
                                  data-testid={`input-period-end-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
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
                    className="flex-1 bg-gradient-success hover:shadow-glow"
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