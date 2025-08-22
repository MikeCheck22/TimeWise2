import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/LoginForm";
import Index from "@/pages/index";
import VacationsPage from "@/pages/vacations";
import VehiclesPage from "@/pages/vehicles";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={login} />;
  }

  return (
    <Switch>
      <Route path="/" component={Index} />
      <Route path="/ferias" component={VacationsPage} />
      <Route path="/vehicles" component={VehiclesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
