import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Car, Plus, Edit, AlertTriangle, Clock, FileText, TrendingUp, 
  Calendar, MapPin, Wrench, FileX, DollarSign, Fuel 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, insertVehicleExpenseSchema } from "@shared/schema";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  type: string;
  year: number;
  licensePlate: string;
  fuelType: string;
  status?: string;
  currentKm?: number;
  insuranceExpiry?: Date | null;
  inspectionExpiry?: Date | null;
  nextServiceDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
};

type VehicleExpense = {
  id: string;
  date: Date;
  type: string;
  description: string;
  amount: number;
  vehicleId: string;
  userId: string;
  km?: number | null;
  createdAt: Date;
};

const vehicleFormSchema = insertVehicleSchema.extend({
  insuranceExpiry: z.string().optional(),
  inspectionExpiry: z.string().optional(),
  nextServiceDate: z.string().optional(),
});

const expenseFormSchema = insertVehicleExpenseSchema.extend({
  date: z.string(),
});

export function VehicleManagement() {
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const queryClient = useQueryClient();

  // Vehicle form
  const vehicleForm = useForm<z.infer<typeof vehicleFormSchema>>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      type: "furgão",
      year: new Date().getFullYear(),
      licensePlate: "",
      fuelType: "diesel",
      status: "ativo",
      currentKm: 0,
      notes: "",
    },
  });

  // Expense form
  const expenseForm = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: "combustível",
      description: "",
      amount: "0",
      vehicleId: "",
      km: 0,
    },
  });

  // Queries
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<VehicleExpense[]>({
    queryKey: ['/api/vehicle-expenses'],
  });

  // Mutations
  const createVehicleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vehicleFormSchema>) => {
      const processedData = {
        ...data,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        inspectionExpiry: data.inspectionExpiry ? new Date(data.inspectionExpiry) : null,
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
      };
      return apiRequest('/api/vehicles', 'POST', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsVehicleDialogOpen(false);
      vehicleForm.reset();
      toast({
        title: "Sucesso",
        description: "Veículo registado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registar veículo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseFormSchema>) => {
      const processedData = {
        ...data,
        date: new Date(data.date),
        amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      };
      return apiRequest('/api/vehicle-expenses', 'POST', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-expenses'] });
      setIsExpenseDialogOpen(false);
      expenseForm.reset();
      toast({
        title: "Sucesso",
        description: "Despesa registada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registar despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmitVehicle = (data: z.infer<typeof vehicleFormSchema>) => {
    createVehicleMutation.mutate(data);
  };

  const onSubmitExpense = (data: z.infer<typeof expenseFormSchema>) => {
    createExpenseMutation.mutate(data);
  };

  // Status color helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "manutenção": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "inativo": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getAlertLevel = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { level: "expired", color: "text-red-600", text: "Expirado" };
    if (diffDays <= 30) return { level: "warning", color: "text-orange-600", text: `${diffDays} dias` };
    return { level: "ok", color: "text-green-600", text: `${diffDays} dias` };
  };

  if (vehiclesLoading) {
    return <div className="flex justify-center py-8">A carregar veículos...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Lista de Veículos</h3>
            <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Registar Veículo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registar Novo Veículo</DialogTitle>
                </DialogHeader>
                <Form {...vehicleForm}>
                  <form onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={vehicleForm.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Mercedes, Renault..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Sprinter, Master..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={vehicleForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="furgão">Furgão</SelectItem>
                                <SelectItem value="carrinha">Carrinha</SelectItem>
                                <SelectItem value="camião">Camião</SelectItem>
                                <SelectItem value="ligeiro">Ligeiro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1990" max="2030" 
                                     onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="licensePlate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Matrícula</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="XX-XX-XX" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={vehicleForm.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Combustível</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="gasolina">Gasolina</SelectItem>
                                <SelectItem value="híbrido">Híbrido</SelectItem>
                                <SelectItem value="elétrico">Elétrico</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="manutenção">Manutenção</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="currentKm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quilómetros</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" 
                                     onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={vehicleForm.control}
                        name="insuranceExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seguro (validade)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="inspectionExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inspeção (validade)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vehicleForm.control}
                        name="nextServiceDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Próxima Revisão</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={vehicleForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Observações sobre o veículo..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" 
                              onClick={() => setIsVehicleDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createVehicleMutation.isPending}>
                        {createVehicleMutation.isPending ? "A registar..." : "Registar Veículo"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {vehicles.length === 0 ? (
              <Card className="bg-glass border-glass backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Car className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum veículo registado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comece por registar o primeiro veículo da sua frota
                  </p>
                </CardContent>
              </Card>
            ) : (
              vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="bg-glass border-glass backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {vehicle.brand} {vehicle.model}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.licensePlate} • {vehicle.year} • {vehicle.fuelType}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(vehicle.status || "ativo")}>
                          {vehicle.status || "ativo"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quilómetros</p>
                        <p className="font-medium">{vehicle.currentKm?.toLocaleString() || "N/A"} km</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Seguro</p>
                        {vehicle.insuranceExpiry ? (
                          <p className={`font-medium ${getAlertLevel(new Date(vehicle.insuranceExpiry))?.color}`}>
                            {getAlertLevel(new Date(vehicle.insuranceExpiry))?.text}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">N/A</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Inspeção</p>
                        {vehicle.inspectionExpiry ? (
                          <p className={`font-medium ${getAlertLevel(new Date(vehicle.inspectionExpiry))?.color}`}>
                            {getAlertLevel(new Date(vehicle.inspectionExpiry))?.text}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">N/A</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Próxima Revisão</p>
                        {vehicle.nextServiceDate ? (
                          <p className={`font-medium ${getAlertLevel(new Date(vehicle.nextServiceDate))?.color}`}>
                            {getAlertLevel(new Date(vehicle.nextServiceDate))?.text}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">N/A</p>
                        )}
                      </div>
                    </div>
                    {vehicle.notes && (
                      <div className="mt-3 pt-3 border-t border-glass">
                        <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Despesas dos Veículos</h3>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registar Nova Despesa</DialogTitle>
                </DialogHeader>
                <Form {...expenseForm}>
                  <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={expenseForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={expenseForm.control}
                        name="vehicleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Veículo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar veículo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vehicles.map((vehicle) => (
                                  <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={expenseForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="combustível">Combustível</SelectItem>
                                <SelectItem value="manutenção">Manutenção</SelectItem>
                                <SelectItem value="reparação">Reparação</SelectItem>
                                <SelectItem value="seguro">Seguro</SelectItem>
                                <SelectItem value="inspeção">Inspeção</SelectItem>
                                <SelectItem value="portagens">Portagens</SelectItem>
                                <SelectItem value="multas">Multas</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={expenseForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor (€)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={expenseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descrição da despesa..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={expenseForm.control}
                      name="km"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quilómetros (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} type="number" min="0" 
                                   onChange={(e) => field.onChange(parseInt(e.target.value) || null)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" 
                              onClick={() => setIsExpenseDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createExpenseMutation.isPending}>
                        {createExpenseMutation.isPending ? "A registar..." : "Registar Despesa"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {expensesLoading ? (
              <div className="flex justify-center py-8">A carregar despesas...</div>
            ) : expenses.length === 0 ? (
              <Card className="bg-glass border-glass backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma despesa registada</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comece por registar as primeiras despesas dos veículos
                  </p>
                </CardContent>
              </Card>
            ) : (
              expenses.map((expense) => {
                const vehicle = vehicles.find(v => v.id === expense.vehicleId);
                return (
                  <Card key={expense.id} className="bg-glass border-glass backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{expense.type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(expense.date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          <h4 className="font-medium">{expense.description}</h4>
                          {vehicle && (
                            <p className="text-sm text-muted-foreground">
                              {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                            </p>
                          )}
                          {expense.km && (
                            <p className="text-sm text-muted-foreground">
                              Quilómetros: {expense.km.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">€{expense.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <h3 className="text-lg font-medium">Alertas e Notificações</h3>
          <div className="space-y-4">
            {vehicles.filter(v => {
              const insurance = v.insuranceExpiry ? getAlertLevel(new Date(v.insuranceExpiry)) : null;
              const inspection = v.inspectionExpiry ? getAlertLevel(new Date(v.inspectionExpiry)) : null;
              const service = v.nextServiceDate ? getAlertLevel(new Date(v.nextServiceDate)) : null;
              
              return (insurance && insurance.level !== "ok") || 
                     (inspection && inspection.level !== "ok") || 
                     (service && service.level !== "ok");
            }).length === 0 ? (
              <Card className="bg-glass border-glass backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Todos os alertas em ordem</h3>
                  <p className="text-muted-foreground text-center">
                    Não há alertas críticos nos seus veículos no momento
                  </p>
                </CardContent>
              </Card>
            ) : (
              vehicles.map((vehicle) => {
                const alerts = [];
                
                if (vehicle.insuranceExpiry) {
                  const alert = getAlertLevel(new Date(vehicle.insuranceExpiry));
                  if (alert && alert.level !== "ok") {
                    alerts.push({ type: "Seguro", ...alert });
                  }
                }
                
                if (vehicle.inspectionExpiry) {
                  const alert = getAlertLevel(new Date(vehicle.inspectionExpiry));
                  if (alert && alert.level !== "ok") {
                    alerts.push({ type: "Inspeção", ...alert });
                  }
                }
                
                if (vehicle.nextServiceDate) {
                  const alert = getAlertLevel(new Date(vehicle.nextServiceDate));
                  if (alert && alert.level !== "ok") {
                    alerts.push({ type: "Revisão", ...alert });
                  }
                }

                if (alerts.length === 0) return null;

                return (
                  <Card key={vehicle.id} className="bg-glass border-glass backdrop-blur-sm border-orange-200 dark:border-orange-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <CardTitle className="text-lg">
                          {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {alerts.map((alert, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{alert.type}</span>
                              {alert.level === "expired" && (
                                <Badge variant="destructive">Expirado</Badge>
                              )}
                              {alert.level === "warning" && (
                                <Badge variant="outline" className="border-orange-600 text-orange-600">
                                  Expira em breve
                                </Badge>
                              )}
                            </div>
                            <span className={`font-medium ${alert.color}`}>
                              {alert.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}