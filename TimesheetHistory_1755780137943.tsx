import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Edit, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function TimesheetHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: timesheets, isLoading } = useQuery({
    queryKey: ['/api/timesheets'],
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'approved': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'rejected': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getWorkTypeBadge = (workType: string) => {
    const variants = {
      'Instalação Elétrica': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'Canalização': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'Reparação': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'Manutenção': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'Consultoria': 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
    };
    return variants[workType as keyof typeof variants] || variants['Instalação Elétrica'];
  };

  const filterTimesheets = () => {
    if (!timesheets) return [];

    let filtered = timesheets ? [...timesheets] : [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((timesheet: any) =>
        timesheet.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timesheet.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    const now = new Date();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    if (dateFilter !== 'all') {
      filtered = filtered.filter((timesheet: any) => {
        const timesheetDate = new Date(timesheet.date);
        switch (dateFilter) {
          case 'this-week':
            return timesheetDate >= thisWeekStart;
          case 'this-month':
            return timesheetDate >= thisMonthStart;
          case 'last-month':
            return timesheetDate >= lastMonthStart && timesheetDate <= lastMonthEnd;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const handleExportPDF = () => {
    toast({
      title: "Exportar PDF",
      description: "Funcionalidade de exportação será implementada em breve"
    });
  };

  const handleView = (timesheet: any) => {
    toast({
      title: "Ver Detalhes",
      description: `Visualizando registo de ${timesheet.projectName}`
    });
  };

  const handleEdit = (timesheet: any) => {
    toast({
      title: "Editar Registo",
      description: `Editando registo de ${timesheet.projectName}`
    });
  };

  const filteredTimesheets = filterTimesheets();

  return (
    <Card className="bg-glass border-glass backdrop-blur-sm shadow-elegant overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-white/20 dark:border-gray-600">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm"
          />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48 bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 backdrop-blur-sm">
              <SelectValue placeholder="Filtrar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              <SelectItem value="this-week">Esta semana</SelectItem>
              <SelectItem value="this-month">Este mês</SelectItem>
              <SelectItem value="last-month">Último mês</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportPDF}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/10 dark:bg-black/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projeto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Horas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 dark:divide-gray-700">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24 bg-white/20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-48 bg-white/20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-16 bg-white/20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-32 bg-white/20 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-20 bg-white/20 rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-12 bg-white/20" />
                      <Skeleton className="h-8 w-12 bg-white/20" />
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredTimesheets.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium mb-2">Nenhum registo encontrado</p>
                    <p className="text-sm">
                      {searchTerm || dateFilter !== 'all'
                        ? 'Tente ajustar os filtros de pesquisa'
                        : 'Ainda não tem registos de folha de horas'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              filteredTimesheets.map((timesheet: any) => (
                <tr
                  key={timesheet.id}
                  className="hover:bg-white/5 dark:hover:bg-black/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {new Date(timesheet.date).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-4 text-foreground max-w-xs truncate">
                    {timesheet.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {parseFloat(timesheet.totalHours).toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getWorkTypeBadge(timesheet.workType)}>
                      {timesheet.workType}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadge(timesheet.status)}>
                      {timesheet.status === 'approved' ? 'Aprovado' :
                       timesheet.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(timesheet)}
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(timesheet)}
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && filteredTimesheets.length > 0 && (
        <div className="p-6 border-t border-white/20 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredTimesheets.length} de {timesheets ? timesheets.length : 0} resultados
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 hover:bg-white/30 dark:hover:bg-black/30"
              >
                Anterior
              </Button>
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                1
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled
                className="bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600 hover:bg-white/30 dark:hover:bg-black/30"
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
