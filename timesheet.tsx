import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Edit, Trash2, ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { TimesheetHistory } from "@/components/TimesheetHistory";

const timesheetSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  templateType: z.enum(["trabalho-normal", "trabalho-reduzido", "trabalho-fim-semana", "ferias", "falta", "baixa"]),
  hours: z.coerce.number().min(0.25, "Mínimo 0.25 horas").max(24, "Máximo 24 horas").optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  
  // Campos específicos para trabalho
  siteManager: z.string().optional(), // Encarregado de Obra
  workLocation: z.string().optional(), // Obra
  displacement: z.boolean().optional(), // Deslocação
  extraHours: z.coerce.number().optional(), // Horas Extras
  
  // Campos para períodos (férias/baixa)
  startDate: z.string().optional(), // Período Inicial
  endDate: z.string().optional(), // Período Final
});

type TimesheetForm = z.infer<typeof timesheetSchema>;

interface TimesheetProps {
  selectedTemplate?: any;
}

export function Timesheet({ selectedTemplate: initialTemplate }: TimesheetProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<any>(null);

  const form = useForm<TimesheetForm>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      templateType: "trabalho-normal",
      hours: 8,
      description: "",
      displacement: false,
      extraHours: 0,
    },
  });

  // Define templates first
  const templates = [
    {
      id: "trabalho-normal",
      name: "Trabalho - Horário Normal",
      description: "8h trabalho com intervalo",
      templateType: "trabalho-normal" as const,
      fields: ["date", "siteManager", "workLocation", "displacement", "extraHours"],
      defaultValues: {
        hours: 8,
        description: "Trabalho em horário normal",
        displacement: false,
        extraHours: 0
      }
    },
    {
      id: "trabalho-reduzido",
      name: "Trabalho - Horário Reduzido", 
      description: "4h trabalho período reduzido",
      templateType: "trabalho-reduzido" as const,
      fields: ["date", "siteManager", "workLocation"],
      defaultValues: {
        hours: 4,
        description: "Trabalho em horário reduzido"
      }
    },
    {
      id: "trabalho-fim-semana",
      name: "Trabalho - Fim de Semana",
      description: "Trabalho em fim de semana",
      templateType: "trabalho-fim-semana" as const,
      fields: ["date", "siteManager", "workLocation", "displacement", "extraHours"],
      defaultValues: {
        hours: 8,
        description: "Trabalho em fim de semana",
        displacement: true,
        extraHours: 2
      }
    },
    {
      id: "ferias",
      name: "Férias",
      description: "Período de férias",
      templateType: "ferias" as const,
      fields: ["startDate", "endDate"],
      defaultValues: {
        description: "Período de férias"
      }
    },
    {
      id: "falta",
      name: "Falta",
      description: "Falta justificada",
      templateType: "falta" as const,
      fields: ["date"],
      defaultValues: {
        description: "Falta justificada"
      }
    },
    {
      id: "baixa",
      name: "Baixa",
      description: "Período de baixa médica",
      templateType: "baixa" as const,
      fields: ["startDate", "endDate"],
      defaultValues: {
        description: "Período de baixa médica"
      }
    }
  ];

  // Apply template function
  const applyTemplate = (template: typeof templates[0]) => {
    setSelectedTemplate(template.id);
    form.setValue("templateType", template.templateType);
    
    // Apply default values
    Object.entries(template.defaultValues).forEach(([key, value]) => {
      form.setValue(key as keyof TimesheetForm, value);
    });
    
    // Reset form fields based on template
    form.reset({
      date: form.getValues("date"),
      templateType: template.templateType,
      ...template.defaultValues
    });

    toast({
      title: "Template Aplicado",
      description: `Template "${template.name}" foi aplicado ao formulário`,
    });
  };

  // Apply initial template if provided
  useEffect(() => {
    if (initialTemplate) {
      const matchingTemplate = templates.find(t => t.templateType === initialTemplate.templateType);
      if (matchingTemplate) {
        applyTemplate(matchingTemplate);
      }
    }
  }, [initialTemplate]);

  // Fetch data
  const { data: timesheets = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/timesheets'],
  });

  // Mutations
  const createTimesheetMutation = useMutation({
    mutationFn: async (data: TimesheetForm) => {
      // Prepare data for submission
      const submitData = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        // Ensure hours is provided for work templates
        hours: ["trabalho-normal", "trabalho-reduzido", "trabalho-fim-semana"].includes(data.templateType) 
          ? (data.hours || 8) 
          : undefined,
      };
      
      console.log('Submitting timesheet data:', submitData);
      
      const response = await apiRequest('POST', '/api/timesheets', submitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheets'] });
      form.reset();
      toast({
        title: "Sucesso",
        description: "Folha de horas registada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registar folha de horas",
        variant: "destructive",
      });
    },
  });

  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheets'] });
      toast({
        title: "Sucesso",
        description: "Entrada removida com sucesso",
      });
    },
  });

  const handleSubmit = (data: TimesheetForm) => {
    createTimesheetMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Folha de Horas</h1>
          <p className="text-blue-200 mt-1">Registe e acompanhe o seu tempo</p>
        </div>
      </div>

      {/* Time Entry Form */}
      <div className="max-w-2xl">
        <Card className="bg-glass border-glass">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg sm:text-xl">Registar Tempo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Template Selection */}
              <div>
                <Label htmlFor="templateType" className="text-blue-200">Tipo de Registo</Label>
                <Select 
                  value={form.watch("templateType")} 
                  onValueChange={(value) => {
                    form.setValue("templateType", value as any);
                    const template = templates.find(t => t.templateType === value);
                    if (template) applyTemplate(template);
                  }}
                >
                  <SelectTrigger className="bg-glass border-glass">
                    <SelectValue placeholder="Selecionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.templateType}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Fields Based on Template */}
              {selectedTemplate && (
                <div className="space-y-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-medium text-white">
                    {templates.find(t => t.id === selectedTemplate)?.name}
                  </h4>
                  
                  {/* Date Field for single day templates */}
                  {templates.find(t => t.id === selectedTemplate)?.fields.includes("date") && (
                    <div>
                      <Label htmlFor="date" className="text-blue-200">Data</Label>
                      <Input
                        type="date"
                        {...form.register("date")}
                        className="bg-glass border-glass"
                      />
                      {form.formState.errors.date && (
                        <p className="text-destructive text-sm mt-1">
                          {form.formState.errors.date.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Period Fields for multi-day templates */}
                  {templates.find(t => t.id === selectedTemplate)?.fields.includes("startDate") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate" className="text-blue-200">Período Inicial</Label>
                        <Input
                          type="date"
                          {...form.register("startDate")}
                          className="bg-glass border-glass"
                        />
                        {form.formState.errors.startDate && (
                          <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.startDate.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-blue-200">Período Final</Label>
                        <Input
                          type="date"
                          {...form.register("endDate")}
                          className="bg-glass border-glass"
                        />
                        {form.formState.errors.endDate && (
                          <p className="text-destructive text-sm mt-1">
                            {form.formState.errors.endDate.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Work-specific Fields */}
                  {templates.find(t => t.id === selectedTemplate)?.fields.includes("siteManager") && (
                    <div>
                      <Label htmlFor="siteManager" className="text-blue-200">Encarregado de Obra</Label>
                      <Input
                        {...form.register("siteManager")}
                        placeholder="Nome do encarregado..."
                        className="bg-glass border-glass"
                      />
                    </div>
                  )}

                  {templates.find(t => t.id === selectedTemplate)?.fields.includes("workLocation") && (
                    <div>
                      <Label htmlFor="workLocation" className="text-blue-200">Obra</Label>
                      <Input
                        {...form.register("workLocation")}
                        placeholder="Local da obra..."
                        className="bg-glass border-glass"
                      />
                    </div>
                  )}

                  {templates.find(t => t.id === selectedTemplate)?.fields.includes("displacement") && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register("displacement")}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="displacement" className="text-blue-200">Deslocação</Label>
                    </div>
                  )}

                  {templates.find(t => t.id === selectedTemplate)?.fields.includes("extraHours") && (
                    <div>
                      <Label htmlFor="extraHours" className="text-blue-200">Horas Extras</Label>
                      <Input
                        type="number"
                        step="0.25"
                        {...form.register("extraHours")}
                        className="bg-glass border-glass"
                      />
                    </div>
                  )}

                  {/* Hours field for work templates */}
                  {["trabalho-normal", "trabalho-reduzido", "trabalho-fim-semana"].includes(selectedTemplate) && (
                    <div>
                      <Label htmlFor="hours" className="text-blue-200">Horas</Label>
                      <Input
                        type="number"
                        step="0.25"
                        {...form.register("hours")}
                        className="bg-glass border-glass"
                      />
                      {form.formState.errors.hours && (
                        <p className="text-destructive text-sm mt-1">
                          {form.formState.errors.hours.message}
                        </p>
                      )}
                    </div>
                  )}


                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm sm:text-base py-2 sm:py-3"
                disabled={createTimesheetMutation.isPending}
              >
                {createTimesheetMutation.isPending ? "Registando..." : "Registar Entrada"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View - Always Open */}
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-200 text-lg sm:text-xl">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            Calendário de Registo
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-4">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="text-blue-300 hover:text-white p-2 sm:px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-base sm:text-lg font-semibold text-white text-center">
                {format(currentDate, 'MMMM yyyy')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="text-blue-300 hover:text-white p-2 sm:px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <CalendarGrid 
              currentDate={currentDate}
              timesheets={timesheets}
              onDayClick={setSelectedDayData}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries with Sidebar */}
      <TimesheetHistory timesheets={timesheets} isLoading={isLoading} deleteTimesheetMutation={deleteTimesheetMutation} />

      {/* Day Details Dialog */}
      {selectedDayData && (
        <Dialog open={!!selectedDayData} onOpenChange={() => setSelectedDayData(null)}>
          <DialogContent className="bg-glass border-glass backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-blue-200">
                Registo de {format(new Date(selectedDayData.date), 'dd/MM/yyyy')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-white">
              <div>
                <Label className="text-blue-200">Tipo de Trabalho:</Label>
                <p>{selectedDayData.work_type || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-blue-200">Horas Totais:</Label>
                <p>{selectedDayData.total_hours || 0} horas</p>
              </div>
              <div>
                <Label className="text-blue-200">Localização:</Label>
                <p>{selectedDayData.location || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-blue-200">Supervisor:</Label>
                <p>{selectedDayData.supervisor || 'N/A'}</p>
              </div>
              {selectedDayData.overtime_hours && (
                <div>
                  <Label className="text-blue-200">Horas Extras:</Label>
                  <p>{selectedDayData.overtime_hours} horas</p>
                </div>
              )}
              <div>
                <Label className="text-blue-200">Estado:</Label>
                <p className={`inline-block px-2 py-1 rounded text-sm ${
                  selectedDayData.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                  selectedDayData.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {selectedDayData.status === 'approved' ? 'Aprovado' :
                   selectedDayData.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Calendar Grid Component
interface CalendarGridProps {
  currentDate: Date;
  timesheets: any[];
  onDayClick: (data: any) => void;
}

function CalendarGrid({ currentDate, timesheets = [], onDayClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create a map of timesheets by date
  const timesheetsByDate = timesheets.reduce((acc, timesheet) => {
    // For vacation periods (ferias/baixa) with start_date and end_date
    if ((timesheet.work_type === 'ferias' || timesheet.work_type === 'baixa') && timesheet.start_date && timesheet.end_date) {
      const startDate = new Date(timesheet.start_date);
      const endDate = new Date(timesheet.end_date);
      
      // Add entry for each day in the period
      const periodDays = eachDayOfInterval({ start: startDate, end: endDate });
      periodDays.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        acc[dateKey] = timesheet;
      });
    } else {
      // For regular single-day entries
      const date = format(new Date(timesheet.date), 'yyyy-MM-dd');
      acc[date] = timesheet;
    }
    return acc;
  }, {} as Record<string, any>);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Color Legend - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 justify-center text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
          <span className="text-green-300">Trabalho</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-400 rounded-full"></div>
          <span className="text-purple-300">Férias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
          <span className="text-red-300">Baixa Médica</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-400 rounded-full"></div>
          <span className="text-orange-300">Faltas</span>
        </div>
      </div>
    
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="text-xs sm:text-sm font-medium text-blue-300 py-1 sm:py-2 px-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasTimesheet = timesheetsByDate[dateKey];
          const isToday = isSameDay(day, new Date());
          
          // Get color based on work type
          const getColorClasses = (workType: string) => {
            switch (workType) {
              case 'ferias':
                return {
                  bg: 'bg-purple-500/30 hover:bg-purple-500/40',
                  border: 'border-purple-500/50',
                  dot: 'bg-purple-400'
                };
              case 'baixa':
                return {
                  bg: 'bg-red-500/30 hover:bg-red-500/40',
                  border: 'border-red-500/50',
                  dot: 'bg-red-400'
                };
              case 'falta':
                return {
                  bg: 'bg-orange-500/30 hover:bg-orange-500/40',
                  border: 'border-orange-500/50',
                  dot: 'bg-orange-400'
                };
              default: // trabalho-normal, trabalho-reduzido, trabalho-fim-semana
                return {
                  bg: 'bg-green-500/30 hover:bg-green-500/40',
                  border: 'border-green-500/50',
                  dot: 'bg-green-400'
                };
            }
          };
          
          const colors = hasTimesheet ? getColorClasses(hasTimesheet.work_type) : null;
          
          return (
            <button
              key={dateKey}
              onClick={() => hasTimesheet && onDayClick(hasTimesheet)}
              className={`
                aspect-square p-1.5 sm:p-2 rounded-md sm:rounded-lg text-xs sm:text-sm transition-colors relative min-h-[36px] sm:min-h-[44px] flex items-center justify-center
                ${!isSameMonth(day, currentDate) ? 'text-gray-500' : 'text-white'}
                ${hasTimesheet 
                  ? `${colors.bg} cursor-pointer ${colors.border} border` 
                  : 'hover:bg-white/10'
                }
                ${isToday ? 'ring-1 sm:ring-2 ring-blue-400' : ''}
              `}
              disabled={!hasTimesheet}
            >
              <span className="font-medium">{format(day, 'd')}</span>
              {hasTimesheet && (
                <div className={`absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 ${colors.dot} rounded-full`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
