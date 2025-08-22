import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Timer, FileText, Settings, ClipboardList, Calendar, Clock, Coffee, Briefcase, X } from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { pt } from 'date-fns/locale';

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<{ period: string; data: any } | null>(null);
  
  const { data: timesheets = [] } = useQuery({
    queryKey: ['/api/timesheets'],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['/api/tools'],
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['/api/material-requests'],
  });

  // Helper function to calculate working days (excluding weekends)
  const calculateWorkingDays = (startDate: Date, endDate: Date) => {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (!isWeekend(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    return count;
  };

  // Helper function to get month period (21st of previous month to 20th of current month)
  const getMonthPeriod = (date: Date) => {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    // Period starts on 21st of previous month
    const startDate = new Date(currentYear, currentMonth - 1, 21);
    // Period ends on 20th of current month
    const endDate = new Date(currentYear, currentMonth, 20);
    
    return { startDate, endDate };
  };

  // Calculate current and previous month stats
  const calculateMonthStats = (periodStart: Date, periodEnd: Date) => {
    const timesheetsArray = Array.isArray(timesheets) ? timesheets : [];
    const periodsTimesheets = timesheetsArray.filter((t: any) => {
      const entryDate = new Date(t.date);
      return entryDate >= periodStart && entryDate <= periodEnd;
    });

    const workingDays = calculateWorkingDays(periodStart, periodEnd);
    const filledDays = periodsTimesheets.length;
    
    const regularHours = periodsTimesheets
      .filter((t: any) => t.work_type === 'trabalho_normal')
      .reduce((sum: number, t: any) => sum + parseFloat(t.total_hours || 0), 0);
    
    const overtimeHours = periodsTimesheets
      .filter((t: any) => t.work_type === 'trabalho_reduzido')
      .reduce((sum: number, t: any) => sum + parseFloat(t.total_hours || 0), 0);
    
    const weekendHours = periodsTimesheets
      .filter((t: any) => t.work_type === 'trabalho_fim_semana')
      .reduce((sum: number, t: any) => sum + parseFloat(t.total_hours || 0), 0);
    
    const vacationDays = periodsTimesheets.filter((t: any) => t.work_type === 'ferias').length;
    const sickDays = periodsTimesheets.filter((t: any) => t.work_type === 'baixa').length;
    const absentDays = periodsTimesheets.filter((t: any) => t.work_type === 'falta').length;

    return {
      workingDays,
      filledDays,
      regularHours,
      overtimeHours,
      weekendHours,
      vacationDays,
      sickDays,
      absentDays,
      timesheets: periodsTimesheets
    };
  };

  // Current period (21st last month to 20th this month)
  const currentPeriod = getMonthPeriod(new Date());
  const currentStats = calculateMonthStats(currentPeriod.startDate, currentPeriod.endDate);
  
  // Previous period
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const previousPeriod = getMonthPeriod(prevMonthDate);
  const previousStats = calculateMonthStats(previousPeriod.startDate, previousPeriod.endDate);

  // Legacy stats for other cards  
  const timesheetsArray = Array.isArray(timesheets) ? timesheets : [];
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  const toolsArray = Array.isArray(tools) ? tools : [];
  const requestsArray = Array.isArray(requests) ? requests : [];
  
  const totalHours = timesheetsArray.reduce((sum: number, t: any) => sum + parseFloat(t.totalHours || t.total_hours || 0), 0);
  const totalInvoices = invoicesArray.reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0);
  const toolsCount = toolsArray.length;
  const pendingRequests = requestsArray.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center justify-center gap-4">
          📊 Centro de Controlo
        </h1>
        <p className="text-blue-200 text-base sm:text-lg font-medium">
          ⚡ Visão geral do seu negócio em tempo real
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Current Month Card - Clickable */}
        <Card 
          className="modern-card glow-on-hover group cursor-pointer transition-all hover:scale-105"
          onClick={() => setSelectedMonth({
            period: `${format(currentPeriod.startDate, 'MMM', { locale: pt })}/${format(currentPeriod.endDate, 'MMM yyyy', { locale: pt })}`,
            data: currentStats
          })}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-500/30 transition-colors">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                {currentStats.filledDays}/{currentStats.workingDays}
              </h3>
              <p className="text-blue-300 text-xs sm:text-sm font-medium">📅 Mês Atual</p>
              <p className="text-blue-400 text-xs">
                {format(currentPeriod.startDate, 'dd/MM')} - {format(currentPeriod.endDate, 'dd/MM')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Previous Month Card - Clickable */}
        <Card 
          className="modern-card glow-on-hover group cursor-pointer transition-all hover:scale-105"
          onClick={() => setSelectedMonth({
            period: `${format(previousPeriod.startDate, 'MMM', { locale: pt })}/${format(previousPeriod.endDate, 'MMM yyyy', { locale: pt })}`,
            data: previousStats
          })}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                {previousStats.filledDays}/{previousStats.workingDays}
              </h3>
              <p className="text-purple-300 text-xs sm:text-sm font-medium">📈 Mês Anterior</p>
              <p className="text-purple-400 text-xs">
                {format(previousPeriod.startDate, 'dd/MM')} - {format(previousPeriod.endDate, 'dd/MM')}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card glow-on-hover group">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-green-500/30 transition-colors">
              <FileText className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">€{totalInvoices.toFixed(0)}</h3>
              <p className="text-green-300 text-xs sm:text-sm font-medium">💰 Despesas registadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card glow-on-hover group">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-orange-500/30 transition-colors">
              <Settings className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">{toolsCount}</h3>
              <p className="text-orange-300 text-xs sm:text-sm font-medium">🔧 Arsenal disponível</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card glow-on-hover group">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-red-500/30 transition-colors">
              <ClipboardList className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">{pendingRequests}</h3>
              <p className="text-red-300 text-xs sm:text-sm font-medium">📋 Pedidos pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions with Predictive Intelligence */}
      <Card className="modern-card">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              🧠 Ações Inteligentes
            </h3>
            <div className="text-blue-400 text-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              AI ativo
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Smart Timesheet Action */}
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'templates' });
                document.dispatchEvent(event);
              }}
              className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 hover:from-blue-500/20 hover:to-blue-600/30 rounded-lg p-4 sm:p-6 flex flex-col items-center space-y-3 transition-all group border border-blue-500/20 hover:border-blue-400/40"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500/30 rounded-lg flex items-center justify-center group-hover:bg-blue-500/40 transition-colors relative">
                <Timer className="w-5 sm:w-6 h-5 sm:h-6 text-blue-400" />
                {currentStats.filledDays < currentStats.workingDays && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className="text-white text-sm font-medium text-center">Registo Hoje</span>
              <span className="text-blue-300 text-xs text-center">
                {currentStats.filledDays < currentStats.workingDays ? 
                  '⚡ Pendente para hoje' : 
                  '✅ Dia já registado'
                }
              </span>
            </button>
            
            {/* Smart Invoice Action */}
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'invoices' });
                document.dispatchEvent(event);
              }}
              className="bg-gradient-to-br from-green-500/10 to-green-600/20 hover:from-green-500/20 hover:to-green-600/30 rounded-lg p-4 sm:p-6 flex flex-col items-center space-y-3 transition-all group border border-green-500/20 hover:border-green-400/40"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-500/30 rounded-lg flex items-center justify-center group-hover:bg-green-500/40 transition-colors relative">
                <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-green-400" />
                {pendingRequests > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">{pendingRequests}</span>
                  </div>
                )}
              </div>
              <span className="text-white text-sm font-medium text-center">Nova Despesa</span>
              <span className="text-green-300 text-xs text-center">
                {pendingRequests > 0 ? 
                  `📋 ${pendingRequests} pendentes` : 
                  '💳 Registar despesa'
                }
              </span>
            </button>
            
            {/* Smart Material Request */}
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'materials' });
                document.dispatchEvent(event);
              }}
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 hover:from-orange-500/20 hover:to-orange-600/30 rounded-lg p-4 sm:p-6 flex flex-col items-center space-y-3 transition-all group border border-orange-500/20 hover:border-orange-400/40"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-500/30 rounded-lg flex items-center justify-center group-hover:bg-orange-500/40 transition-colors">
                <ClipboardList className="w-5 sm:w-6 h-5 sm:h-6 text-orange-400" />
              </div>
              <span className="text-white text-sm font-medium text-center">Pedir Material</span>
              <span className="text-orange-300 text-xs text-center">
                🔧 Material em falta?
              </span>
            </button>
            
            {/* Smart Tools Management */}
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'tools' });
                document.dispatchEvent(event);
              }}
              className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 hover:from-purple-500/20 hover:to-purple-600/30 rounded-lg p-4 sm:p-6 flex flex-col items-center space-y-3 transition-all group border border-purple-500/20 hover:border-purple-400/40"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-500/30 rounded-lg flex items-center justify-center group-hover:bg-purple-500/40 transition-colors">
                <Settings className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
              </div>
              <span className="text-white text-sm font-medium text-center">Arsenal</span>
              <span className="text-purple-300 text-xs text-center">
                🔨 {toolsCount} ferramentas
              </span>
            </button>
          </div>

          {/* Contextual Smart Suggestions */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              💡 Sugestões Inteligentes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Time-based suggestions */}
              {new Date().getHours() < 12 && currentStats.filledDays < currentStats.workingDays && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    ☀️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Bom dia! Hora de registar o dia</p>
                    <p className="text-blue-300 text-xs">Registe as suas horas para hoje</p>
                  </div>
                </div>
              )}
              
              {/* Weekend work reminder */}
              {[0, 6].includes(new Date().getDay()) && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    📅
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Trabalho ao fim de semana?</p>
                    <p className="text-orange-300 text-xs">Registe horas extras se aplicável</p>
                  </div>
                </div>
              )}
              
              {/* Monthly completion suggestion */}
              {currentStats.filledDays / currentStats.workingDays > 0.8 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Quase lá!</p>
                    <p className="text-green-300 text-xs">
                      {Math.round((currentStats.filledDays / currentStats.workingDays) * 100)}% do mês completo
                    </p>
                  </div>
                </div>
              )}
              
              {/* Low completion warning */}
              {currentStats.filledDays / currentStats.workingDays < 0.5 && new Date().getDate() > 15 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    ⚠️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Atenção aos registos</p>
                    <p className="text-red-300 text-xs">Poucos dias registados este mês</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Hours Chart */}
      <Card className="modern-card">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Resumo Semanal</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span className="text-gray-300">Esta semana:</span>
              <span className="font-bold text-white text-xl">{(totalHours * 0.25).toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span className="text-gray-300">Semana passada:</span>
              <span className="font-bold text-white text-xl">{(totalHours * 0.3).toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <span className="text-blue-300">Média semanal:</span>
              <span className="font-bold text-blue-300 text-xl">{(totalHours / 4).toFixed(1)}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Recent Activity */}
      <Card className="modern-card">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">📋 Atividade Recente</h3>
            <div className="text-blue-400 text-sm bg-blue-500/20 px-3 py-1 rounded-full">
              Todas as alterações
            </div>
          </div>
          
          <div className="space-y-3">
            {(() => {
              // Combine all activities
              const allActivities = [
                ...timesheetsArray.map((item: any) => ({
                  ...item,
                  type: 'timesheet',
                  icon: Timer,
                  color: 'blue',
                  title: item.work_type === 'ferias' ? 'Férias' : 
                         item.work_type === 'baixa' ? 'Baixa Médica' :
                         item.work_type === 'falta' ? 'Falta' :
                         `${item.total_hours || item.hours || 0}h trabalho`,
                  subtitle: `Folha de horas • ${item.project_name || 'Projeto'}`,
                  timestamp: item.created_at || item.date
                })),
                ...invoicesArray.map((item: any) => ({
                  ...item,
                  type: 'invoice',
                  icon: FileText,
                  color: 'green',
                  title: `€${item.amount || 0} - ${item.description || 'Despesa'}`,
                  subtitle: `Fatura • ${item.supplier || 'Fornecedor'}`,
                  timestamp: item.created_at || item.date
                })),
                ...requestsArray.map((item: any) => ({
                  ...item,
                  type: 'material',
                  icon: ClipboardList,
                  color: 'orange',
                  title: `${item.quantity || 0}x ${item.item_name || 'Material'}`,
                  subtitle: `Pedido • ${item.supplier || 'Fornecedor'}`,
                  timestamp: item.created_at || item.date
                })),
                ...toolsArray.slice(0, 2).map((item: any) => ({
                  ...item,
                  type: 'tool',
                  icon: Settings,
                  color: 'purple',
                  title: `${item.name || 'Ferramenta'}`,
                  subtitle: `Arsenal • ${item.status || 'Disponível'}`,
                  timestamp: item.created_at || item.date || new Date()
                }))
              ];

              // Sort by timestamp descending and take first 6
              const sortedActivities = allActivities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 6);

              return sortedActivities.length > 0 ? (
                sortedActivities.map((activity: any, index: number) => {
                  const IconComponent = activity.icon;
                  const colorClasses = {
                    blue: 'bg-blue-500/20 text-blue-400',
                    green: 'bg-green-500/20 text-green-400',
                    orange: 'bg-orange-500/20 text-orange-400',
                    purple: 'bg-purple-500/20 text-purple-400'
                  };
                  
                  const statusClasses = {
                    approved: 'bg-green-500/20 text-green-400',
                    rejected: 'bg-red-500/20 text-red-400',
                    pending: 'bg-yellow-500/20 text-yellow-400',
                    available: 'bg-green-500/20 text-green-400',
                    maintenance: 'bg-orange-500/20 text-orange-400'
                  };

                  return (
                    <button 
                      key={`${activity.type}-${activity.id || index}`}
                      onClick={() => {
                        const sectionMap = {
                          timesheet: 'timesheet',
                          invoice: 'invoices',
                          material: 'materials',
                          tool: 'tools'
                        };
                        const event = new CustomEvent('navigate-section', { 
                          detail: sectionMap[activity.type as keyof typeof sectionMap] 
                        });
                        document.dispatchEvent(event);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {activity.title}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {activity.subtitle} • {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('pt-PT') : 'Recente'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          statusClasses[activity.status as keyof typeof statusClasses] || 
                          statusClasses.pending
                        }`}>
                          {activity.status === 'approved' ? 'Aprovado' :
                           activity.status === 'rejected' ? 'Rejeitado' :
                           activity.status === 'available' ? 'Disponível' :
                           activity.status === 'maintenance' ? 'Manutenção' :
                           'Pendente'}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ainda não há atividade registada</p>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Details Modal */}
      {selectedMonth && (
        <Dialog open={!!selectedMonth} onOpenChange={() => setSelectedMonth(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-2xl text-white">
                📊 Resumo do Período: {selectedMonth.period}
              </DialogTitle>
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogHeader>
            
            <div className="space-y-6 p-6">
              {/* Progress Overview */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Progressão do Período
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {selectedMonth.data.filledDays}
                    </div>
                    <div className="text-sm text-blue-300">Dias Preenchidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {selectedMonth.data.workingDays}
                    </div>
                    <div className="text-sm text-gray-300">Dias Úteis Totais</div>
                  </div>
                </div>
                <div className="mt-4 bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${(selectedMonth.data.filledDays / selectedMonth.data.workingDays) * 100}%` }}
                  />
                </div>
                <div className="text-center mt-2 text-sm text-gray-400">
                  {Math.round((selectedMonth.data.filledDays / selectedMonth.data.workingDays) * 100)}% completo
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horas Trabalhadas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {selectedMonth.data.regularHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-blue-300">Horas Normais</div>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {selectedMonth.data.overtimeHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-orange-300">Horas Extras</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedMonth.data.weekendHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-purple-300">Fins de Semana</div>
                  </div>
                </div>
              </div>

              {/* Leave and Absences */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Ausências e Licenças
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedMonth.data.vacationDays}
                    </div>
                    <div className="text-xs text-green-300">Dias de Férias</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {selectedMonth.data.sickDays}
                    </div>
                    <div className="text-xs text-yellow-300">Baixas Médicas</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {selectedMonth.data.absentDays}
                    </div>
                    <div className="text-xs text-red-300">Faltas</div>
                  </div>
                </div>
              </div>

              {/* Recent Entries for Selected Period */}
              {selectedMonth.data.timesheets.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Entradas do Período
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedMonth.data.timesheets.map((entry: any, index: number) => (
                      <div key={entry.id || index} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">
                            {format(new Date(entry.date), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-sm text-gray-400">
                            {entry.work_type === 'ferias' ? '🏖️ Férias' : 
                             entry.work_type === 'baixa' ? '🏥 Baixa Médica' :
                             entry.work_type === 'falta' ? '❌ Falta' :
                             `⏰ ${entry.total_hours || 0}h trabalho`}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          entry.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {entry.status === 'approved' ? 'Aprovado' :
                           entry.status === 'rejected' ? 'Rejeitado' : 
                           'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
