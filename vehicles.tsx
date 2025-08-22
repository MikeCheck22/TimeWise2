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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Car, CheckCircle, Wrench, Euro, Receipt, Edit, FileText, Trash2, AlertTriangle, AlertCircle, Info, Check, Search } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

const vehicleSchema = z.object({
  licensePlate: z.string().min(1, "Matrícula é obrigatória"),
  brand: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.coerce.number().min(1900, "Ano deve ser válido").max(new Date().getFullYear() + 1),
  type: z.string().min(1, "Tipo é obrigatório"),
  currentKm: z.coerce.number().min(0, "Quilometragem deve ser maior ou igual a 0"),
  fuelType: z.string().min(1, "Tipo de combustível é obrigatório"),
  insuranceExpiry: z.string().optional(),
  inspectionExpiry: z.string().optional(),
  nextServiceKm: z.coerce.number().optional(),
  nextServiceDate: z.string().optional(),
  notes: z.string().optional(),
});

const expenseSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  type: z.enum(["combustivel", "manutencao", "seguro", "inspecao", "outros"]),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que 0"),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
});

type VehicleForm = z.infer<typeof vehicleSchema>;
type ExpenseForm = z.infer<typeof expenseSchema>;

export function Vehicles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("vehicles");
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const vehicleForm = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      licensePlate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      type: "",
      currentKm: 0,
      fuelType: "",
      notes: "",
    },
  });

  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: "",
      type: "combustivel",
      amount: 0,
      description: "",
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Fetch data
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/vehicle-expenses'],
  });

  // Mutations
  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleForm) => {
      const response = await apiRequest('POST', '/api/vehicles', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      vehicleForm.reset();
      setShowVehicleForm(false);
      toast({
        title: "Sucesso",
        description: "Veículo registado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registar veículo",
        variant: "destructive",
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      const response = await apiRequest('POST', '/api/vehicle-expenses', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-expenses'] });
      expenseForm.reset();
      setShowExpenseForm(false);
      toast({
        title: "Sucesso",
        description: "Despesa registada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registar despesa",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/vehicle-expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-expenses'] });
      toast({
        title: "Sucesso",
        description: "Despesa removida com sucesso",
      });
    },
  });

  const handleVehicleSubmit = (data: VehicleForm) => {
    createVehicleMutation.mutate(data);
  };

  const handleExpenseSubmit = (data: ExpenseForm) => {
    createExpenseMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">Ativo</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Manutenção</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/20 text-gray-400">Inativo</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  const getExpenseTypeBadge = (type: string) => {
    const colors = {
      combustivel: 'bg-blue-500/20 text-blue-400',
      manutencao: 'bg-orange-500/20 text-orange-400',
      seguro: 'bg-purple-500/20 text-purple-400',
      inspecao: 'bg-green-500/20 text-green-400',
      outros: 'bg-gray-500/20 text-gray-400',
    };
    const labels = {
      combustivel: 'Combustível',
      manutencao: 'Manutenção',
      seguro: 'Seguro',
      inspecao: 'Inspeção',
      outros: 'Outros',
    };
    return <Badge className={colors[type as keyof typeof colors]}>{labels[type as keyof typeof labels]}</Badge>;
  };

  // Calculate metrics
  const totalVehicles = (vehicles as any[]).length;
  const activeVehicles = (vehicles as any[]).filter((v: any) => v.status === 'active').length;
  const maintenanceVehicles = (vehicles as any[]).filter((v: any) => v.status === 'maintenance').length;
  const monthlyExpenses = (expenses as any[]).filter((e: any) => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

  // Check for alerts
  const getVehicleAlerts = () => {
    const alerts: any[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    (vehicles as any[]).forEach((vehicle: any) => {
      // Check for expired or soon-to-expire documents
      if (vehicle.inspectionExpiry) {
        const inspectionDate = new Date(vehicle.inspectionExpiry);
        if (inspectionDate < now) {
          alerts.push({
            type: 'critical',
            vehicle: vehicle.name,
            message: `Inspeção expirada em ${format(inspectionDate, 'dd/MM/yyyy')}`,
            action: 'Resolver'
          });
        } else if (inspectionDate < thirtyDaysFromNow) {
          alerts.push({
            type: 'warning',
            vehicle: vehicle.name,
            message: `Inspeção expira em ${format(inspectionDate, 'dd/MM/yyyy')}`,
            action: 'Lembrete'
          });
        }
      }

      if (vehicle.insuranceExpiry) {
        const insuranceDate = new Date(vehicle.insuranceExpiry);
        if (insuranceDate < now) {
          alerts.push({
            type: 'critical',
            vehicle: vehicle.name,
            message: `Seguro expirado em ${format(insuranceDate, 'dd/MM/yyyy')}`,
            action: 'Resolver'
          });
        } else if (insuranceDate < thirtyDaysFromNow) {
          alerts.push({
            type: 'warning',
            vehicle: vehicle.name,
            message: `Seguro expira em ${format(insuranceDate, 'dd/MM/yyyy')}`,
            action: 'Lembrete'
          });
        }
      }

      if (vehicle.nextMaintenance) {
        const maintenanceDate = new Date(vehicle.nextMaintenance);
        if (maintenanceDate < now) {
          alerts.push({
            type: 'critical',
            vehicle: vehicle.name,
            message: `Manutenção atrasada desde ${format(maintenanceDate, 'dd/MM/yyyy')}`,
            action: 'Agendar'
          });
        } else if (maintenanceDate < thirtyDaysFromNow) {
          alerts.push({
            type: 'warning',
            vehicle: vehicle.name,
            message: `Manutenção agendada para ${format(maintenanceDate, 'dd/MM/yyyy')}`,
            action: 'Lembrete'
          });
        }
      }

      // Info alerts for vehicles in good standing
      if (vehicle.status === 'active' && !alerts.some(a => a.vehicle === vehicle.name)) {
        alerts.push({
          type: 'info',
          vehicle: vehicle.name,
          message: 'Todos os documentos em ordem',
          action: 'OK'
        });
      }
    });

    return alerts;
  };

  const alerts = getVehicleAlerts();
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');

  const filteredExpenses = (expenses as any[]).filter((expense: any) => {
    const matchesVehicle = vehicleFilter === 'all' || !vehicleFilter || expense.vehicleId === vehicleFilter;
    const matchesSearch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVehicle && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            🚗 Gestão de Veículos
          </h1>
          <p className="text-blue-200 mt-2 text-sm sm:text-base font-medium">
            🔧 Controlo completo da frota, despesas e manutenções
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setShowVehicleForm(!showVehicleForm)}
            className="bg-gradient-success hover:shadow-glow flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Novo Veículo</span>
          </Button>
          <Button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="bg-gradient-warning hover:shadow-glow flex items-center justify-center space-x-2"
          >
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Nova Despesa</span>
          </Button>
        </div>
      </div>

      {/* Vehicle Form */}
      {showVehicleForm && (
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              🚙 Adicionar Novo Veículo
            </CardTitle>
            <p className="text-blue-300 text-sm mt-1">Complete os dados do veículo para registo</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={vehicleForm.handleSubmit(handleVehicleSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="licensePlate" className="text-blue-200 text-sm sm:text-base">Matrícula</Label>
                <Input
                  {...vehicleForm.register("licensePlate")}
                  placeholder="12-AB-34"
                  className="bg-glass border-glass text-sm sm:text-base"
                />
                {vehicleForm.formState.errors.licensePlate && (
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    {vehicleForm.formState.errors.licensePlate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="brand" className="text-blue-200 text-sm sm:text-base">Marca</Label>
                <Input
                  {...vehicleForm.register("brand")}
                  placeholder="Ex: Mercedes"
                  className="bg-glass border-glass text-sm sm:text-base"
                />
                {vehicleForm.formState.errors.brand && (
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    {vehicleForm.formState.errors.brand.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="model" className="text-blue-200 text-sm sm:text-base">Modelo</Label>
                <Input
                  {...vehicleForm.register("model")}
                  placeholder="Ex: Sprinter"
                  className="bg-glass border-glass text-sm sm:text-base"
                />
                {vehicleForm.formState.errors.model && (
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    {vehicleForm.formState.errors.model.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="year" className="text-blue-200 text-sm sm:text-base">Ano</Label>
                <Input
                  type="number"
                  {...vehicleForm.register("year")}
                  placeholder="2024"
                  className="bg-glass border-glass text-sm sm:text-base"
                />
                {vehicleForm.formState.errors.year && (
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    {vehicleForm.formState.errors.year.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="type" className="text-blue-200 text-sm sm:text-base">Tipo</Label>
                <Select onValueChange={(value) => vehicleForm.setValue("type", value)}>
                  <SelectTrigger className="bg-glass border-glass text-sm sm:text-base">
                    <SelectValue placeholder="Selecionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="carrinha">Carrinha</SelectItem>
                    <SelectItem value="camiao">Camião</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fuelType" className="text-blue-200 text-sm sm:text-base">Combustível</Label>
                <Select onValueChange={(value) => vehicleForm.setValue("fuelType", value)}>
                  <SelectTrigger className="bg-glass border-glass text-sm sm:text-base">
                    <SelectValue placeholder="Selecionar combustível..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="eletrico">Elétrico</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currentKm" className="text-blue-200 text-sm sm:text-base">Quilometragem Atual</Label>
                <Input
                  type="number"
                  {...vehicleForm.register("currentKm")}
                  placeholder="0"
                  className="bg-glass border-glass text-sm sm:text-base"
                />
                {vehicleForm.formState.errors.currentKm && (
                  <p className="text-destructive text-xs sm:text-sm mt-1">
                    {vehicleForm.formState.errors.currentKm.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="insuranceExpiry" className="text-blue-200 text-sm sm:text-base">Expiração Seguro</Label>
                <Input
                  type="date"
                  {...vehicleForm.register("insuranceExpiry")}
                  className="bg-glass border-glass text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="inspectionExpiry" className="text-blue-200 text-sm sm:text-base">Expiração Inspeção</Label>
                <Input
                  type="date"
                  {...vehicleForm.register("inspectionExpiry")}
                  className="bg-glass border-glass text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="nextServiceDate" className="text-blue-200 text-sm sm:text-base">Próxima Revisão (Data)</Label>
                <Input
                  type="date"
                  {...vehicleForm.register("nextServiceDate")}
                  className="bg-glass border-glass text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="nextServiceKm" className="text-blue-200 text-sm sm:text-base">Próxima Revisão (Km)</Label>
                <Input
                  type="number"
                  {...vehicleForm.register("nextServiceKm")}
                  placeholder="Ex: 150000"
                  className="bg-glass border-glass text-sm sm:text-base"
                />
              </div>

              <div className="lg:col-span-3">
                <Label htmlFor="notes" className="text-blue-200 text-sm sm:text-base">Observações</Label>
                <Textarea
                  {...vehicleForm.register("notes")}
                  placeholder="Notas adicionais sobre o veículo..."
                  className="bg-glass border-glass text-sm sm:text-base"
                  rows={3}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Button
                  type="submit"
                  className="bg-gradient-success hover:shadow-glow w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                  disabled={createVehicleMutation.isPending}
                >
                  {createVehicleMutation.isPending ? "Registando..." : "Registar Veículo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expense Form */}
      {showExpenseForm && (
        <Card className="bg-glass border-glass">
          <CardHeader>
            <CardTitle className="text-white">Registar Nova Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={expenseForm.handleSubmit(handleExpenseSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="vehicleId" className="text-blue-200">Veículo</Label>
                <Select onValueChange={(value) => expenseForm.setValue("vehicleId", value)}>
                  <SelectTrigger className="bg-glass border-glass">
                    <SelectValue placeholder="Selecionar veículo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((vehicle: any) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type" className="text-blue-200">Tipo</Label>
                <Select onValueChange={(value) => expenseForm.setValue("type", value as any)}>
                  <SelectTrigger className="bg-glass border-glass">
                    <SelectValue placeholder="Selecionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combustivel">Combustível</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="seguro">Seguro</SelectItem>
                    <SelectItem value="inspecao">Inspeção</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-blue-200">Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...expenseForm.register("amount")}
                  placeholder="0.00"
                  className="bg-glass border-glass"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-blue-200">Data</Label>
                <Input
                  type="date"
                  {...expenseForm.register("date")}
                  className="bg-glass border-glass"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <Label htmlFor="description" className="text-blue-200">Descrição</Label>
                <Textarea
                  {...expenseForm.register("description")}
                  rows={2}
                  placeholder="Descrição da despesa..."
                  className="bg-glass border-glass resize-none"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <Button
                  type="submit"
                  className="bg-gradient-warning hover:shadow-glow px-8 py-3"
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? "Registando..." : "Registar Despesa"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card className="bg-glass border-glass">
        <CardContent className="p-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vehicles">Veículos</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>

            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="p-6">
              {/* Vehicle Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-glass border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Total Veículos</p>
                        <p className="text-2xl font-bold text-white">{totalVehicles}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-glass border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Ativos</p>
                        <p className="text-2xl font-bold text-white">{activeVehicles}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-glass border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Em Manutenção</p>
                        <p className="text-2xl font-bold text-white">{maintenanceVehicles}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-glass border-glass">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Euro className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-blue-200 text-sm">Despesas/Mês</p>
                        <p className="text-2xl font-bold text-white">€{monthlyExpenses.toFixed(0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicles Grid */}
              {vehiclesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : vehicles?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map((vehicle: any) => (
                    <Card key={vehicle.id} className="bg-glass border-glass hover-glow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                              <Car className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-white">{vehicle.name}</h3>
                              <p className="text-sm text-blue-300">{vehicle.licensePlate}</p>
                            </div>
                          </div>
                          {getStatusBadge(vehicle.status)}
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-200">Quilometragem:</span>
                            <span className="text-white">{vehicle.mileage?.toLocaleString()} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Combustível:</span>
                            <span className="text-white capitalize">{vehicle.fuelType}</span>
                          </div>
                          {vehicle.insuranceExpiry && (
                            <div className="flex justify-between">
                              <span className="text-blue-200">Seguro:</span>
                              <span className={`${new Date(vehicle.insuranceExpiry) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                                {format(new Date(vehicle.insuranceExpiry), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          )}
                          {vehicle.inspectionExpiry && (
                            <div className="flex justify-between">
                              <span className="text-blue-200">Inspeção:</span>
                              <span className={`${new Date(vehicle.inspectionExpiry) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                                {format(new Date(vehicle.inspectionExpiry), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          )}
                          {vehicle.nextMaintenance && (
                            <div className="flex justify-between">
                              <span className="text-blue-200">Próxima Revisão:</span>
                              <span className={`${new Date(vehicle.nextMaintenance) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                                {format(new Date(vehicle.nextMaintenance), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-6">
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Relatório
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-50" />
                  <p className="text-blue-300">Nenhum veículo registado</p>
                </div>
              )}
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Despesas de Veículos</h3>
                <div className="flex items-center space-x-4">
                  <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 w-48">
                      <SelectValue placeholder="Todos os veículos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os veículos</SelectItem>
                      {vehicles?.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                    <Input
                      placeholder="Procurar despesas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/10 border-white/20 pl-10 w-64"
                    />
                  </div>
                </div>
              </div>

              {expensesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-blue-200 font-medium">Data</th>
                        <th className="text-left py-3 px-4 text-blue-200 font-medium">Veículo</th>
                        <th className="text-left py-3 px-4 text-blue-200 font-medium">Tipo</th>
                        <th className="text-left py-3 px-4 text-blue-200 font-medium">Descrição</th>
                        <th className="text-left py-3 px-4 text-blue-200 font-medium">Valor</th>
                        <th className="text-center py-3 px-4 text-blue-200 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense: any) => (
                        <tr key={expense.id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-4 px-4 text-white">
                            {format(new Date(expense.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="py-4 px-4 text-white">
                            {vehicles?.find((v: any) => v.id === expense.vehicleId)?.name || '-'}
                          </td>
                          <td className="py-4 px-4">
                            {getExpenseTypeBadge(expense.type)}
                          </td>
                          <td className="py-4 px-4 text-white">{expense.description}</td>
                          <td className="py-4 px-4 font-medium text-white">€{parseFloat(expense.amount).toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-white">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                className="text-red-400 hover:text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-blue-400 opacity-50" />
                  <p className="text-blue-300">Nenhuma despesa encontrada</p>
                </div>
              )}
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="p-6 space-y-6">
              {/* Critical Alerts */}
              {criticalAlerts.length > 0 && (
                <Card className="bg-glass border-glass">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Alertas Críticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {criticalAlerts.map((alert, index) => (
                      <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-red-400">{alert.vehicle} - {alert.message}</h3>
                          </div>
                          <Button
                            size="sm"
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                          >
                            {alert.action}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Warning Alerts */}
              {warningAlerts.length > 0 && (
                <Card className="bg-glass border-glass">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Avisos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {warningAlerts.map((alert, index) => (
                      <div key={index} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-yellow-400">{alert.vehicle} - {alert.message}</h3>
                          </div>
                          <Button
                            size="sm"
                            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                          >
                            {alert.action}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Info Alerts */}
              {infoAlerts.length > 0 && (
                <Card className="bg-glass border-glass">
                  <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Informações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {infoAlerts.map((alert, index) => (
                      <div key={index} className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-blue-400">{alert.vehicle} - {alert.message}</h3>
                          </div>
                          <span className="text-blue-400 px-4 py-2 text-sm">
                            <Check className="w-4 h-4 inline mr-1" />
                            {alert.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {alerts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400 opacity-50" />
                  <p className="text-blue-300">Nenhum alerta no momento</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
