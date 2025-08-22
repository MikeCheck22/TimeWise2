import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CalendarDays, CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

const vacationRequestSchema = z.object({
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  type: z.enum(["ferias", "doenca", "pessoal", "formacao"]).default("ferias"),
  description: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endDate"],
});

type VacationRequestForm = z.infer<typeof vacationRequestSchema>;

export function Vacations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const form = useForm<VacationRequestForm>({
    resolver: zodResolver(vacationRequestSchema),
    defaultValues: {
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      type: "ferias",
      description: "",
    },
  });

  // Fetch data
  const { data: vacationRequests = [], isLoading } = useQuery({
    queryKey: ['/api/vacation-requests'],
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: async (data: VacationRequestForm) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const response = await apiRequest('POST', '/api/vacation-requests', {
        ...data,
        days,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      form.reset();
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Pedido de férias submetido com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao submeter pedido de férias",
        variant: "destructive",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/vacation-requests/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-requests'] });
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado",
      });
    },
  });

  const handleSubmit = (data: VacationRequestForm) => {
    createRequestMutation.mutate(data);
  };

  // Calculate vacation stats
  const currentYear = new Date().getFullYear();
  const thisYearRequests = vacationRequests.filter(req => 
    new Date(req.startDate).getFullYear() === currentYear && req.status === 'approved'
  );
  
  const totalDays = 22; // Standard vacation days
  const usedDays = thisYearRequests.reduce((sum, req) => sum + req.days, 0);
  const remainingDays = totalDays - usedDays;

  const pendingRequests = vacationRequests.filter(req => req.status === 'pending');

  // Calendar functions
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Find vacation for this day
      const dayVacation = vacationRequests.find(req => {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        return req.status === 'approved' && day >= reqStart && day <= reqEnd;
      });

      days.push(
        <div
          key={day.toString()}
          className={`p-2 min-h-12 border border-white/10 rounded text-center cursor-pointer hover:bg-white/10 transition-all
            ${!isSameMonth(day, monthStart) ? 'opacity-50' : ''}
            ${dayVacation ? 'bg-blue-500/20 border-l-4 border-l-blue-500' : ''}
          `}
        >
          <div className="text-sm font-medium text-white">{formattedDate}</div>
          {dayVacation && (
            <div className="text-xs text-blue-300 mt-1">
              {dayVacation.type === 'ferias' ? 'Férias' : 
               dayVacation.type === 'doenca' ? 'Doença' : 
               dayVacation.type === 'pessoal' ? 'Pessoal' : 'Formação'}
            </div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      ferias: 'bg-blue-500/20 text-blue-400',
      doenca: 'bg-red-500/20 text-red-400',
      pessoal: 'bg-purple-500/20 text-purple-400',
      formacao: 'bg-green-500/20 text-green-400',
    };
    const labels = {
      ferias: 'Férias',
      doenca: 'Doença',
      pessoal: 'Pessoal',
      formacao: 'Formação',
    };
    return <Badge className={colors[type as keyof typeof colors]}>{labels[type as keyof typeof labels]}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendário de Férias</h1>
          <p className="text-blue-200 mt-1">Gira pedidos de férias e visualiza calendário</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-primary hover:shadow-glow flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Marcar Férias</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-glass border-glass">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Dias Totais</p>
                <p className="text-2xl font-bold text-white">{totalDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-glass border-glass">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Dias Usados</p>
                <p className="text-2xl font-bold text-white">{usedDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-glass border-glass">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Dias Restantes</p>
                <p className="text-2xl font-bold text-white">{remainingDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="bg-glass border-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {format(currentDate, 'MMMM yyyy', { locale: pt })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="text-blue-300 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="text-blue-300 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-blue-200">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="space-y-1">
                {rows}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-blue-200">Férias</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-blue-200">Doença</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="text-blue-200">Pessoal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-blue-200">Formação</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Form */}
        <div>
          <Card className="bg-glass border-glass">
            <CardHeader>
              <CardTitle className="text-white">Marcar Férias</CardTitle>
            </CardHeader>
            <CardContent>
              {showForm ? (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="startDate" className="text-blue-200">Data Início</Label>
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
                    <Label htmlFor="endDate" className="text-blue-200">Data Fim</Label>
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

                  <div>
                    <Label htmlFor="type" className="text-blue-200">Tipo</Label>
                    <Select onValueChange={(value) => form.setValue("type", value as any)}>
                      <SelectTrigger className="bg-glass border-glass">
                        <SelectValue placeholder="Férias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ferias">Férias</SelectItem>
                        <SelectItem value="doenca">Doença</SelectItem>
                        <SelectItem value="pessoal">Pessoal</SelectItem>
                        <SelectItem value="formacao">Formação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-blue-200">Descrição</Label>
                    <Textarea
                      {...form.register("description")}
                      rows={3}
                      placeholder="Motivo ou observações..."
                      className="bg-glass border-glass resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? "Submetendo..." : "Submeter Pedido"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-gradient-primary hover:shadow-glow"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Pedido de Férias
                  </Button>

                  {/* Quick Stats */}
                  <div className="space-y-3 pt-6 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Pedidos Pendentes:</span>
                      <span className="font-medium text-white">{pendingRequests.length}</span>
                    </div>
                    {pendingRequests.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-200">Próximo Pedido:</span>
                        <span className="font-medium text-white">
                          {format(new Date(pendingRequests[0].startDate), 'dd MMM', { locale: pt })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Requests */}
          {!showForm && (
            <Card className="bg-glass border-glass mt-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vacationRequests.slice(0, 3).map(request => (
                    <div key={request.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {format(new Date(request.startDate), 'dd/MM')} - {format(new Date(request.endDate), 'dd/MM')}
                          </p>
                          <p className="text-xs text-blue-300">{request.days} dias</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex justify-between items-center">
                        {getTypeBadge(request.type)}
                        {user?.role === 'admin' && request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'approved' })}
                              className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1 h-6"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateRequestMutation.mutate({ id: request.id, status: 'rejected' })}
                              className="text-xs px-2 py-1 h-6"
                            >
                              ✗
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-blue-300 text-sm text-center py-4">
                      Nenhum pedido recente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
