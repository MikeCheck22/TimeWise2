import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2, ChevronRight, X } from "lucide-react";
import { format } from "date-fns";

interface TimesheetHistoryProps {
  timesheets: any[];
  isLoading: boolean;
  deleteTimesheetMutation: any;
}

export function TimesheetHistory({ timesheets, isLoading, deleteTimesheetMutation }: TimesheetHistoryProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  
  const recentTimesheets = timesheets.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5); // Last 5 entries
  const allTimesheets = timesheets.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // All entries

  if (isLoading) {
    return (
      <Card className="bg-glass border-glass">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Main Recent Entries Card */}
      <Card className="bg-glass border-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Entradas Recentes</CardTitle>
            {timesheets.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                Ver mais <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {timesheets.length > 0 ? (
            <div className="space-y-3">
              {recentTimesheets.map((timesheet, index) => (
                <div key={timesheet.id || index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {timesheet.work_type === 'ferias' ? 'Férias' : 
                         timesheet.work_type === 'baixa' ? 'Baixa Médica' :
                         timesheet.work_type === 'falta' ? 'Falta' :
                         `${timesheet.total_hours || timesheet.hours || 0}h trabalho`}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {timesheet.date ? format(new Date(timesheet.date), 'dd/MM/yyyy') : 'Data não disponível'}
                        {timesheet.project_name && ` • ${timesheet.project_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      timesheet.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      timesheet.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {timesheet.status === 'approved' ? 'Aprovado' :
                       timesheet.status === 'rejected' ? 'Rejeitado' : 
                       'Pendente'}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-white px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTimesheetMutation.mutate(timesheet.id)}
                        className="text-red-400 hover:text-white px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {timesheets.length > 5 && (
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-blue-300 text-sm">
                    Mostrando {recentTimesheets.length} de {timesheets.length} entradas
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-50" />
              <p className="text-blue-300">Nenhuma entrada de tempo registada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sidebar for All Entries */}
      {showSidebar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-lg border-l border-white/20 z-50 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">Todas as Entradas</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="overflow-y-auto h-full pb-20 px-6">
              <div className="space-y-3 py-4">
                {allTimesheets.map((timesheet, index) => (
                  <div key={timesheet.id || index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {timesheet.work_type === 'ferias' ? 'Férias' : 
                           timesheet.work_type === 'baixa' ? 'Baixa Médica' :
                           timesheet.work_type === 'falta' ? 'Falta' :
                           `${timesheet.total_hours || timesheet.hours || 0}h`}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {timesheet.date ? format(new Date(timesheet.date), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-white px-1"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTimesheetMutation.mutate(timesheet.id)}
                        className="text-red-400 hover:text-white px-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}