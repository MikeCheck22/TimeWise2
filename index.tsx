import React, { useRef, useState } from "react";
import { TimesheetForm } from "@/components/TimesheetForm";
import { TimesheetHistory } from "@/components/TimesheetHistory";
import { LiveTimer } from "@/components/LiveTimer";
import { Dashboard } from "@/components/Dashboard";
import { QuickTemplates } from "@/components/QuickTemplates";
import { InvoiceManagement } from "@/components/InvoiceManagement";
import { ToolsRegistry } from "@/components/ToolsRegistry";
import { MaterialRequests } from "@/components/MaterialRequests";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, TrendingUp, Shield, Timer, BarChart3, Zap, Moon, Sun, FileText, Settings, ClipboardList, Plus, Calendar, Wrench, Truck, LogOut } from "lucide-react";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { user, logout, isAdmin } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const invoicesRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const requestsRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, message: string) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast({
      title: "Navegação",
      description: message
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    toast({
      title: isDarkMode ? "☀️ Modo Claro" : "🌙 Modo Escuro",
      description: `Tema alterado para ${isDarkMode ? "claro" : "escuro"}`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background mobile-safe">
      {/* Header with User Info and Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <div className="bg-glass border-glass backdrop-blur-sm shadow-elegant rounded-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            {isAdmin ? <Shield className="w-4 h-4 text-orange-500" /> : <Clock className="w-4 h-4 text-blue-500" />}
            <span className="font-medium">{user?.fullName || user?.username}</span>
            <span className="text-xs opacity-70">({isAdmin ? 'Admin' : 'Técnico'})</span>
          </div>
        </div>
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="bg-glass border-glass backdrop-blur-sm shadow-elegant"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="bg-glass border-glass backdrop-blur-sm shadow-elegant text-red-600 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="relative px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Sistema de Folha de Horas
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Gestão completa de tempo, faturas, ferramentas e pedidos de material
            </p>
            
            {/* Enhanced Feature Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 mt-8 sm:mt-12">
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(timerRef, "Timer em tempo real!")}
              >
                <CardContent className="p-4 text-center">
                  <Timer className="w-6 sm:w-8 h-6 sm:h-8 text-primary mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Timer Live</h3>
                  <p className="text-xs text-muted-foreground">Cronómetro automático</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(dashboardRef, "Analytics completas!")}
              >
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-6 sm:w-8 h-6 sm:h-8 text-accent mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Dashboard</h3>
                  <p className="text-xs text-muted-foreground">Gráficos e métricas</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(invoicesRef, "Gestão de faturas!")}
              >
                <CardContent className="p-4 text-center">
                  <FileText className="w-6 sm:w-8 h-6 sm:h-8 text-green-500 mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Faturas</h3>
                  <p className="text-xs text-muted-foreground">Gestão financeira</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(toolsRef, "Inventário de ferramentas!")}
              >
                <CardContent className="p-4 text-center">
                  <Settings className="w-6 sm:w-8 h-6 sm:h-8 text-orange-500 mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Ferramentas</h3>
                  <p className="text-xs text-muted-foreground">Inventário atual</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(requestsRef, "Pedidos de material!")}
              >
                <CardContent className="p-4 text-center">
                  <ClipboardList className="w-6 sm:w-8 h-6 sm:h-8 text-red-500 mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Pedidos</h3>
                  <p className="text-xs text-muted-foreground">Material necessário</p>
                </CardContent>
              </Card>
              
              <Link href="/ferias">
                <Card 
                  className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                >
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-purple-500 mx-auto mb-2 sm:mb-3" />
                    <h3 className="font-semibold mb-1 text-sm">Férias</h3>
                    <p className="text-xs text-muted-foreground">Calendário e gestão</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/vehicles">
                <Card 
                  className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                >
                  <CardContent className="p-4 text-center">
                    <Truck className="w-6 sm:w-8 h-6 sm:h-8 text-orange-500 mx-auto mb-2 sm:mb-3" />
                    <h3 className="font-semibold mb-1 text-sm">Veículos</h3>
                    <p className="text-xs text-muted-foreground">Gestão de frota</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(formRef, "Novo registo!")}
              >
                <CardContent className="p-4 text-center">
                  <Plus className="w-6 sm:w-8 h-6 sm:h-8 text-primary mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Registo</h3>
                  <p className="text-xs text-muted-foreground">Novo dia</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-glass border-glass backdrop-blur-sm hover:shadow-glow transition-smooth cursor-pointer hover:scale-105 transform"
                onClick={() => scrollToSection(historyRef, "Histórico completo!")}
              >
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-indigo-500 mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold mb-1 text-sm">Histórico</h3>
                  <p className="text-xs text-muted-foreground">Registos anteriores</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Live Timer */}
          <section ref={timerRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Timer em Tempo Real
              </h2>
              <p className="text-muted-foreground px-4">
                Cronometragem automática com registo inteligente de localização
              </p>
            </div>
            <LiveTimer />
          </section>

          {/* Dashboard */}
          <section ref={dashboardRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Dashboard & Analytics
              </h2>
              <p className="text-muted-foreground px-4">
                Acompanhe o seu progresso com gráficos e métricas detalhadas
              </p>
            </div>
            <Dashboard />
          </section>

          {/* Invoice Management */}
          <section ref={invoicesRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Gestão de Faturas e Fundo de Maneio
              </h2>
              <p className="text-muted-foreground px-4">
                Registo de faturas com upload e categorização automática de despesas
              </p>
            </div>
            <InvoiceManagement />
          </section>

          {/* Tools Registry */}
          <section ref={toolsRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Registo de Ferramentas Atuais
              </h2>
              <p className="text-muted-foreground px-4">
                Inventário pessoal com fotos, estados e histórico de manutenção
              </p>
            </div>
            <ToolsRegistry />
          </section>

          {/* Material Requests */}
          <section ref={requestsRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Sistema de Pedidos de Material
              </h2>
              <p className="text-muted-foreground px-4">
                Formulários de pedidos ao gestor com estados e notificações automáticas
              </p>
            </div>
            <MaterialRequests />
          </section>

          {/* Quick Templates */}
          <section ref={templatesRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Templates Rápidos
              </h2>
              <p className="text-muted-foreground px-4">
                Registos predefinidos para situações comuns de trabalho
              </p>
            </div>
            <QuickTemplates />
          </section>

          {/* Timesheet Form */}
          <section ref={formRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Novo Registo
              </h2>
              <p className="text-muted-foreground px-4">
                Preencha o formulário abaixo para registar o seu dia de trabalho
              </p>
            </div>
            <TimesheetForm />
          </section>

          {/* Timesheet History */}
          <section ref={historyRef}>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Histórico de Registos
              </h2>
              <p className="text-muted-foreground px-4">
                Consulte os seus registos anteriores e detalhes específicos
              </p>
            </div>
            <TimesheetHistory />
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-glass bg-glass/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              © 2024 Sistema de Folha de Horas. Desenvolvido para otimizar a gestão completa do trabalho.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
