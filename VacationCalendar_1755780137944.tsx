import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertVacationSchema, type InsertVacation, type Vacation, type VacationAllowance } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, Plus, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

const VacationCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();

  // Fetch vacation data
  const { data: vacations, isLoading: vacationsLoading } = useQuery({
    queryKey: ['/api/vacations'],
    queryFn: () => apiRequest('/api/vacations'),
  });

  const { data: allowance, isLoading: allowanceLoading } = useQuery({
    queryKey: ['/api/vacation-allowance', currentYear],
    queryFn: () => apiRequest(`/api/vacation-allowance/${currentYear}`),
  });

  // Form setup
  const form = useForm<InsertVacation>({
    resolver: zodResolver(insertVacationSchema.extend({
      startDate: insertVacationSchema.shape.startDate,
      endDate: insertVacationSchema.shape.endDate,
    })),
    defaultValues: {
      type: 'ferias',
      days: 1,
      description: '',
    }
  });

  const { register, handleSubmit, setValue, watch, reset } = form;

  // Calculate days between dates
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
      const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
      const days = differenceInDays(end, start) + 1;
      setValue('days', Math.max(1, days));
      return Math.max(1, days);
    }
    return 1;
  };

  // Create vacation mutation
  const createVacationMutation = useMutation({
    mutationFn: (data: InsertVacation) => apiRequest('/api/vacations', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vacations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vacation-allowance', currentYear] });
      reset();
      setShowForm(false);
      setSelectedDate(null);
    },
  });

  const onSubmit = (data: InsertVacation) => {
    const calculatedDays = calculateDays();
    createVacationMutation.mutate({ ...data, days: calculatedDays });
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getVacationForDate = (date: Date) => {
    if (!vacations) return null;
    return vacations.find((vacation: Vacation) => {
      const vacationStart = new Date(vacation.startDate);
      const vacationEnd = new Date(vacation.endDate);
      return date >= vacationStart && date <= vacationEnd;
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'approved': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'rejected': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'ferias': 'bg-blue-500',
      'doenca': 'bg-red-500',
      'pessoal': 'bg-purple-500',
      'formacao': 'bg-green-500'
    };
    return colors[type as keyof typeof colors] || colors.ferias;
  };

  const getTypeName = (type: string) => {
    const names = {
      'ferias': 'Férias',
      'doenca': 'Doença',
      'pessoal': 'Pessoal',
      'formacao': 'Formação'
    };
    return names[type as keyof typeof names] || type;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dias Totais</p>
                <p className="text-2xl font-bold text-foreground">
                  {allowance?.totalDays || 22}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dias Usados</p>
                <p className="text-2xl font-bold text-foreground">
                  {allowance?.usedDays || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dias Restantes</p>
                <p className="text-2xl font-bold text-foreground">
                  {allowance?.remainingDays || 22}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-glass border-glass backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground">
                Calendário de Férias
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  ←
                </Button>
                <span className="text-sm font-medium px-3">
                  {format(currentMonth, 'MMMM yyyy', { locale: pt })}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const vacation = getVacationForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      p-2 min-h-[3rem] border border-white/20 dark:border-gray-600 rounded cursor-pointer
                      transition-colors relative
                      ${isCurrentMonth ? 'bg-white/10 dark:bg-black/10' : 'bg-white/5 dark:bg-black/5 opacity-50'}
                      ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                      ${isSelected ? 'bg-blue-500/20' : ''}
                      ${vacation ? 'border-l-4' : ''}
                      hover:bg-white/20 dark:hover:bg-black/20
                    `}
                    style={{
                      borderLeftColor: vacation ? getTypeColor(vacation.type) : undefined,
                    }}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium text-foreground">
                      {format(day, 'd')}
                    </div>
                    {vacation && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {getTypeName(vacation.type)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Férias</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Doença</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Pessoal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Formação</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacation Form & List */}
        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Marcar Férias
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {showForm && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                      onChange={(e) => {
                        setValue('startDate', e.target.value);
                        calculateDays();
                      }}
                      className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data Fim</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                      onChange={(e) => {
                        setValue('endDate', e.target.value);
                        calculateDays();
                      }}
                      className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select onValueChange={(value) => setValue('type', value)}>
                      <SelectTrigger className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600">
                        <SelectValue placeholder="Selecionar tipo" />
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
                    <Label htmlFor="days">Dias</Label>
                    <Input
                      id="days"
                      type="number"
                      readOnly
                      value={calculateDays()}
                      className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Observações</Label>
                  <Textarea
                    id="description"
                    placeholder="Observações opcionais..."
                    rows={3}
                    {...register('description')}
                    className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    disabled={createVacationMutation.isPending}
                  >
                    {createVacationMutation.isPending ? 'A guardar...' : 'Marcar Férias'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {/* Recent vacations list */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Férias Recentes</h4>
              {vacationsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : vacations && vacations.length > 0 ? (
                vacations.slice(0, 5).map((vacation: Vacation) => (
                  <div key={vacation.id} className="bg-white/10 dark:bg-black/10 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-foreground">
                          {getTypeName(vacation.type)}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(vacation.startDate), 'dd/MM')} - {format(new Date(vacation.endDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Badge className={getStatusBadge(vacation.status)}>
                        {vacation.status === 'pending' ? 'Pendente' : vacation.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vacation.days} dia{vacation.days > 1 ? 's' : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Ainda não marcou férias
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VacationCalendar;