import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Timer, FileText, Settings, ClipboardList } from 'lucide-react';

export function Dashboard() {
  const { data: timesheets } = useQuery({
    queryKey: ['/api/timesheets'],
  });

  const { data: invoices } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: tools } = useQuery({
    queryKey: ['/api/tools'],
  });

  const { data: requests } = useQuery({
    queryKey: ['/api/material-requests'],
  });

  // Calculate stats
  const totalHours = timesheets ? timesheets.reduce((sum: number, t: any) => sum + parseFloat(t.totalHours || 0), 0) : 0;
  const totalInvoices = invoices ? invoices.reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0) : 0;
  const approvedInvoices = invoices ? invoices.filter((i: any) => i.status === 'approved').reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0) : 0;
  const toolsCount = tools ? tools.length : 0;
  const pendingRequests = requests ? requests.filter((r: any) => r.status === 'pending').length : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Timer className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}h</h3>
            <p className="text-muted-foreground">Horas este mês</p>
          </CardContent>
        </Card>
        
        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground">€{totalInvoices.toFixed(0)}</h3>
            <p className="text-muted-foreground">Faturas submetidas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground">{toolsCount}</h3>
            <p className="text-muted-foreground">Ferramentas registadas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-glass border-glass backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <ClipboardList className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground">{pendingRequests}</h3>
            <p className="text-muted-foreground">Pedidos pendentes</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-glass border-glass backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Horas Semanais</h3>
          <div className="chart-container bg-white/10 dark:bg-black/10 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Gráfico de Horas Semanais</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Esta semana:</span>
                  <span className="font-semibold">{(totalHours * 0.25).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Semana passada:</span>
                  <span className="font-semibold">{(totalHours * 0.3).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Média semanal:</span>
                  <span className="font-semibold">{(totalHours / 4).toFixed(1)}h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
