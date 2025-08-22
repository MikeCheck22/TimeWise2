import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, Briefcase, FileText, Car, Zap, Activity, 
  Plus, Upload, ShoppingCart, CalendarPlus, FileStack,
  X, Calendar, TrendingUp, Wrench, BarChart3, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import type { Timesheet, Invoice, MaterialRequest, Vehicle } from "@shared/schema";

export function Dashboard() {
  const { user } = useAuth();
  const [selectedModal, setSelectedModal] = useState<string | null>(null);

  // Fetch dashboard metrics
  const { data: timesheets = [] } = useQuery<Timesheet[]>({
    queryKey: ['/api/timesheets'],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const { data: materialRequests = [] } = useQuery<MaterialRequest[]>({
    queryKey: ['/api/material-requests'],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Calculate metrics
  const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours || '0'), 0);
  const activeProjects = new Set(timesheets.map(ts => ts.projectId).filter(Boolean)).size;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const pendingInvoicesValue = invoices.filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

  // Calculate monthly overview
  const today = new Date();
  const startOfPeriod = new Date(today.getFullYear(), today.getMonth() - 1, 21);
  const endOfPeriod = new Date(today.getFullYear(), today.getMonth(), 20);
  
  // Working days in period (excluding weekends)
  const getWorkingDaysInPeriod = (start: Date, end: Date) => {
    let count = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) { // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const totalWorkingDays = getWorkingDaysInPeriod(startOfPeriod, endOfPeriod);
  const registeredDays = timesheets.filter(ts => {
    const tsDate = new Date(ts.date);
    return tsDate >= startOfPeriod && tsDate <= endOfPeriod;
  }).length;

  const weekendWorkDays = timesheets.filter(ts => {
    const tsDate = new Date(ts.date);
    const isWeekend = tsDate.getDay() === 0 || tsDate.getDay() === 6;
    return isWeekend && tsDate >= startOfPeriod && tsDate <= endOfPeriod;
  }).length;

  const extraHours = timesheets
    .filter(ts => {
      const tsDate = new Date(ts.date);
      return tsDate >= startOfPeriod && tsDate <= endOfPeriod;
    })
    .reduce((sum, ts) => sum + parseFloat(ts.extraHours || '0'), 0);

  // Budget calculations
  const budgetLimit = 5000; // €5,000 budget limit
  const budgetUsed = pendingInvoicesValue;
  const budgetPercentage = (budgetUsed / budgetLimit) * 100;

  // Material efficiency calculations
  const deliveredRequests = materialRequests.filter(r => r.status === 'delivered').length;
  const totalRequests = materialRequests.length;
  const pendingRequests = materialRequests.filter(r => r.status === 'pending').length;
  
  // Fleet performance calculations
  const totalVehicles = activeVehicles + maintenanceVehicles;
  const fleetAvailability = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Engitagus</h1>
          <p className="text-blue-200 mt-1">Visão geral do sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-glass rounded-lg px-4 py-2 border border-glass">
            <span className="text-sm text-blue-200">Última atualização:</span>
            <span className="text-sm font-medium ml-2 text-white">Agora</span>
          </div>
        </div>
      </div>
      {/* Quick Actions with Predictive Intelligence */}
      <Card className="bg-glass border-glass">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="bg-gradient-primary hover:shadow-glow p-4 h-auto flex-col text-left transition-all w-full"
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'templates' });
                document.dispatchEvent(event);
              }}
            >
              <FileStack className="w-6 h-6 mb-2" />
              <p className="font-medium">Registo Hoje</p>
              <p className="text-xs text-blue-200">⚡ Pendente para hoje</p>
            </Button>
            <Button 
              className="bg-gradient-success hover:shadow-glow p-4 h-auto flex-col text-left transition-all"
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'invoices' });
                document.dispatchEvent(event);
              }}
            >
              <Upload className="w-6 h-6 mb-2" />
              <p className="font-medium">Fundo de Maneio</p>
              <p className="text-xs text-blue-200">Controla o fundo de maneio</p>
            </Button>
            <Button 
              className="bg-gradient-warning hover:shadow-glow p-4 h-auto flex-col text-left transition-all"
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'materials' });
                document.dispatchEvent(event);
              }}
            >
              <ShoppingCart className="w-6 h-6 mb-2" />
              <p className="font-medium">Pedir Material</p>
              <p className="text-xs text-blue-200">Nova requisição</p>
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-glow p-4 h-auto flex-col text-left transition-all"
              onClick={() => {
                const event = new CustomEvent('navigate-section', { detail: 'vacations' });
                document.dispatchEvent(event);
              }}
            >
              <CalendarPlus className="w-6 h-6 mb-2" />
              <p className="font-medium">Marcar Férias</p>
              <p className="text-xs text-blue-200">Novo pedido</p>
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Overview - Modal Trigger */}
        <Card 
          className="bg-glass border-glass hover-glow cursor-pointer transition-all hover:scale-105" 
          onClick={() => setSelectedModal('monthly')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Visão Geral do Mês</p>
                <p className="text-3xl font-bold mt-1 text-white">
                  {registeredDays}/{totalWorkingDays}
                </p>
                <p className="text-green-400 text-sm mt-2">dias registados/úteis</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Efficiency - Modal Trigger */}
        <Card 
          className="bg-glass border-glass hover-glow cursor-pointer transition-all hover:scale-105" 
          onClick={() => setSelectedModal('materials')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Eficiência Material</p>
                <p className="text-3xl font-bold mt-1 text-white">
                  {totalRequests > 0 ? Math.round((deliveredRequests / totalRequests) * 100) : 0}%
                </p>
                <p className="text-purple-400 text-sm mt-2">{deliveredRequests}/{totalRequests} entregues</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview - Modal Trigger */}
        <Card 
          className="bg-glass border-glass hover-glow cursor-pointer transition-all hover:scale-105" 
          onClick={() => setSelectedModal('budget')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Fundo de Maneio</p>
                <p className={`text-3xl font-bold mt-1 ${budgetPercentage > 80 ? 'text-red-400' : budgetPercentage > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {Math.round(budgetPercentage)}%
                </p>
                <p className={`text-sm mt-2 ${budgetPercentage > 80 ? 'text-red-400' : budgetPercentage > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                  €{budgetUsed.toFixed(0)} / €{budgetLimit}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${budgetPercentage > 80 ? 'bg-red-500/20' : budgetPercentage > 60 ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
                <TrendingUp className={`w-6 h-6 ${budgetPercentage > 80 ? 'text-red-400' : budgetPercentage > 60 ? 'text-yellow-400' : 'text-green-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Performance - Modal Trigger */}
        <Card 
          className="bg-glass border-glass hover-glow cursor-pointer transition-all hover:scale-105" 
          onClick={() => setSelectedModal('fleet')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Performance da Frota</p>
                <p className="text-3xl font-bold mt-1 text-white">{Math.round(fleetAvailability)}%</p>
                <p className="text-orange-400 text-sm mt-2">{activeVehicles}/{totalVehicles} operacionais</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Recent Activity - All Changes */}
      <Card className="bg-glass border-glass">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            📋 Atividade Recente - Todas as Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              // Combine all activities
              const allActivities = [
                ...timesheets.map((item: any) => ({
                  ...item,
                  type: 'timesheet',
                  icon: Clock,
                  color: 'blue',
                  title: `${new Date(item.date).toLocaleDateString('pt-PT')} - ${item.templateType?.replace('-', ' ') || 'Trabalho'}`,
                  subtitle: `${item.templateType === 'trabalho-normal' ? 'Trabalho Normal' : 
                           item.templateType === 'trabalho-reduzido' ? 'Trabalho Reduzido' : 
                           item.templateType === 'trabalho-fim-semana' ? 'Trabalho Fim de Semana' :
                           item.templateType === 'ferias' ? 'Férias' :
                           item.templateType === 'baixa' ? 'Baixa Médica' :
                           item.templateType === 'falta' ? 'Falta' : 'Registo'}`,
                  timestamp: item.createdAt || item.date
                })),
                ...invoices.map((item: any) => ({
                  ...item,
                  type: 'invoice',
                  icon: FileText,
                  color: 'green',
                  title: `Fatura ${item.invoiceNumber || 'N/A'} - €${item.amount || 0}`,
                  subtitle: `${item.supplier || 'Fornecedor'} • ${item.status === 'pending' ? 'Pendente' : 'Paga'}`,
                  timestamp: item.createdAt || item.date
                })),
                ...materialRequests.map((item: any) => ({
                  ...item,
                  type: 'material',
                  icon: ShoppingCart,
                  color: 'orange',
                  title: `${item.quantity || 0}x ${item.itemName || 'Material'}`,
                  subtitle: `${item.status === 'pending' ? 'Aguarda Entrega' : 
                           item.status === 'delivered' ? 'Entregue' : 
                           item.status === 'cancelled' ? 'Cancelado' : 'Pedido Material'}`,
                  timestamp: item.createdAt || item.dateNeeded
                })),
                ...vehicles.slice(0, 2).map((item: any) => ({
                  ...item,
                  type: 'vehicle',
                  icon: Car,
                  color: 'purple',
                  title: `${item.make} ${item.model} • ${item.licensePlate || 'N/A'}`,
                  subtitle: `${item.status === 'active' ? 'Ativo' : 
                           item.status === 'maintenance' ? 'Em Manutenção' : 
                           item.status === 'inactive' ? 'Inativo' : 'Veículo'}`,
                  timestamp: item.createdAt || new Date()
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

                  return (
                    <div 
                      key={`${activity.type}-${activity.id || index}`}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => {
                        const sectionMap = {
                          timesheet: 'timesheet',
                          invoice: 'invoices',
                          material: 'materials',
                          vehicle: 'vehicles'
                        };
                        const event = new CustomEvent('navigate-section', { 
                          detail: sectionMap[activity.type as keyof typeof sectionMap] 
                        });
                        document.dispatchEvent(event);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{activity.title}</p>
                          <p className="text-blue-200 text-sm">{activity.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-300 text-xs">
                          {new Date(activity.timestamp).toLocaleDateString('pt-PT')}
                        </span>
                        {activity.type === 'timesheet' && activity.extraHours && (
                          <p className="text-yellow-300 text-xs mt-1">+{activity.extraHours}h extras</p>
                        )}
                        {activity.type === 'invoice' && (
                          <p className={`text-xs mt-1 ${activity.status === 'pending' ? 'text-yellow-300' : 'text-green-300'}`}>
                            {activity.status === 'pending' ? 'Pendente' : 'Paga'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ainda não há atividade registada</p>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Modais Informativos - Mobile Optimized */}
      {selectedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="bg-slate-900/95 border-slate-700 max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl">
                  {selectedModal === 'monthly' && '📊 Visão Geral do Mês'}
                  {selectedModal === 'budget' && '💰 Análise do Fundo de Maneio'}
                  {selectedModal === 'materials' && '📦 Eficiência Material'}
                  {selectedModal === 'fleet' && '🚗 Performance da Frota'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedModal(null)}
                  className="text-white hover:bg-white/20 shrink-0 bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Monthly Overview Modal */}
              {selectedModal === 'monthly' && (
                <>
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-blue-200 text-sm">Dias Registados</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{registeredDays}</p>
                      <p className="text-blue-300 text-sm">de {totalWorkingDays} dias úteis</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="flex items-center mb-2">
                        <Clock className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-green-200 text-sm">Horas Extras</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{extraHours.toFixed(1)}h</p>
                      <p className="text-green-300 text-sm">trabalho adicional</p>
                    </div>
                  </div>

                  {/* Weekend Work */}
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center mb-3">
                      <CalendarPlus className="w-5 h-5 text-purple-400 mr-2" />
                      <span className="text-purple-200 font-medium">Trabalho Fim de Semana</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-2">{weekendWorkDays} dias</p>
                    <p className="text-purple-300 text-sm">trabalho em sábados/domingos</p>
                  </div>

                  {/* Vacation/Sick Days Placeholder */}
                  <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-yellow-200 font-medium">Férias/Baixas/Faltas</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-white">0</p>
                        <p className="text-yellow-300 text-xs">Férias</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">0</p>
                        <p className="text-yellow-300 text-xs">Baixas</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">0</p>
                        <p className="text-yellow-300 text-xs">Faltas</p>
                      </div>
                    </div>
                  </div>

                  {/* Period Info */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Período de Análise</h4>
                    <p className="text-blue-200 text-sm">
                      {startOfPeriod.toLocaleDateString('pt-PT')} até {endOfPeriod.toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </>
              )}

              {/* Budget Overview Modal */}
              {selectedModal === 'budget' && (
                <>
                  <div className="space-y-4">
                    {/* Budget Progress */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Utilização do Orçamento</span>
                        <span className={`font-bold ${budgetPercentage > 80 ? 'text-red-400' : budgetPercentage > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {budgetPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all ${budgetPercentage > 80 ? 'bg-red-500' : budgetPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                        <p className="text-green-200 text-sm">Orçamento Total</p>
                        <p className="text-2xl font-bold text-white">€{budgetLimit}</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                        <p className="text-red-200 text-sm">Gasto Atual</p>
                        <p className="text-2xl font-bold text-white">€{budgetUsed.toFixed(0)}</p>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <p className="text-blue-200 text-sm">Restante Disponível</p>
                      <p className="text-2xl font-bold text-white">€{(budgetLimit - budgetUsed).toFixed(0)}</p>
                    </div>

                    {/* Invoice Status */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">Estado das Faturas</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-yellow-200">Pendentes</span>
                          <span className="text-white">{pendingInvoices}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-200">Pagas</span>
                          <span className="text-white">{invoices.length - pendingInvoices}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Materials Efficiency Modal */}
              {selectedModal === 'materials' && (
                <>
                  <div className="space-y-4">
                    {/* Main Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                        <p className="text-2xl font-bold text-white">{deliveredRequests}</p>
                        <p className="text-green-200 text-sm">Entregues</p>
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
                        <p className="text-2xl font-bold text-white">{pendingRequests}</p>
                        <p className="text-yellow-200 text-sm">Pendentes</p>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                        <p className="text-2xl font-bold text-white">{totalRequests}</p>
                        <p className="text-blue-200 text-sm">Total</p>
                      </div>
                    </div>

                    {/* Efficiency Rate */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Taxa de Eficiência</span>
                        <span className="text-purple-400 font-bold">
                          {totalRequests > 0 ? ((deliveredRequests / totalRequests) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full bg-purple-500 transition-all"
                          style={{ width: `${totalRequests > 0 ? (deliveredRequests / totalRequests) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Recent Requests */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">Pedidos Recentes</h4>
                      <div className="space-y-2">
                        {materialRequests.slice(0, 3).map((req, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-blue-200">{req.itemName}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              req.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                              req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Fleet Performance Modal */}
              {selectedModal === 'fleet' && (
                <>
                  <div className="space-y-4">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                        <div className="flex items-center mb-2">
                          <Car className="w-5 h-5 text-green-400 mr-2" />
                          <span className="text-green-200 text-sm">Operacionais</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{activeVehicles}</p>
                        <p className="text-green-300 text-sm">veículos ativos</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                        <div className="flex items-center mb-2">
                          <Wrench className="w-5 h-5 text-red-400 mr-2" />
                          <span className="text-red-200 text-sm">Manutenção</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{maintenanceVehicles}</p>
                        <p className="text-red-300 text-sm">em reparação</p>
                      </div>
                    </div>

                    {/* Availability Rate */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Disponibilidade da Frota</span>
                        <span className="text-orange-400 font-bold">{fleetAvailability.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full bg-orange-500 transition-all"
                          style={{ width: `${fleetAvailability}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Fleet Status */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">Estado dos Veículos</h4>
                      <div className="space-y-2">
                        {vehicles.slice(0, 4).map((vehicle, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-blue-200">{vehicle.make} {vehicle.model}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              vehicle.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              vehicle.status === 'maintenance' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {vehicle.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
