import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, User, Lock, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  role: z.enum(["admin", "tech"]).default("tech"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "tech",
    },
  });

  // Redirect if already authenticated - moved after all hooks
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const fillCredentials = (username: string, password: string) => {
    loginForm.setValue("username", username);
    loginForm.setValue("password", password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex justify-center lg:justify-start">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
              <Building className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Sistema de Gestão Empresarial
            </h1>
            <p className="text-xl text-blue-200 mb-6">
              Controle completo do seu negócio em uma só plataforma
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-blue-200">Gestão de folhas de horas com timer em tempo real</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-blue-200">Sistema completo de faturas e pedidos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-blue-200">Registo de ferramentas com fotos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-blue-200">Calendário de férias e gestão de veículos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-glass border-glass shadow-elegant">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <Building className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Bem-vindo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Registar</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username" className="text-blue-200">
                          Nome de Usuário
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                          <Input
                            {...loginForm.register("username")}
                            className="pl-10"
                            placeholder="Digite seu usuário"
                          />
                        </div>
                        {loginForm.formState.errors.username && (
                          <p className="text-destructive text-sm mt-1">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-blue-200">
                          Senha
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                          <Input
                            {...loginForm.register("password")}
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            placeholder="Digite sua senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-destructive text-sm mt-1">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary hover:shadow-glow transition-all"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName" className="text-blue-200">
                          Nome Completo
                        </Label>
                        <Input
                          {...registerForm.register("fullName")}
                          placeholder="Digite seu nome completo"
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="text-destructive text-sm mt-1">
                            {registerForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="username" className="text-blue-200">
                          Nome de Usuário
                        </Label>
                        <Input
                          {...registerForm.register("username")}
                          placeholder="Escolha um nome de usuário"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-destructive text-sm mt-1">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-blue-200">
                          Senha
                        </Label>
                        <Input
                          {...registerForm.register("password")}
                          type="password"
                          placeholder="Crie uma senha segura"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-destructive text-sm mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="role" className="text-blue-200">
                          Função
                        </Label>
                        <select
                          {...registerForm.register("role")}
                          className="w-full p-3 bg-glass border-glass rounded-lg text-white"
                        >
                          <option value="tech">Técnico</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-success hover:shadow-glow transition-all"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registando..." : "Registar"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Demo Credentials */}
              <div className="mt-8 pt-6 border-t border-glass">
                <Button
                  variant="outline"
                  onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                  className="w-full bg-white/10 border-glass text-blue-200 hover:bg-white/20"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Mostrar Credenciais de Teste
                </Button>

                {showDemoCredentials && (
                  <div className="mt-4 space-y-3 animate-slide-up">
                    <Card className="bg-blue-500/20 border-blue-500/30">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-blue-200 mb-2">Administrador:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fillCredentials('admin', 'admin123')}
                          className="text-blue-300 hover:text-white p-0 h-auto font-mono"
                        >
                          admin / admin123
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-500/20 border-green-500/30">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-green-200 mb-2">Técnicos:</p>
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fillCredentials('joao', 'joao123')}
                            className="text-green-300 hover:text-white p-0 h-auto font-mono block"
                          >
                            joao / joao123
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fillCredentials('maria', 'maria123')}
                            className="text-green-300 hover:text-white p-0 h-auto font-mono block"
                          >
                            maria / maria123
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-xs text-blue-300 text-center">
                      Admin vê todos os dados. Técnicos veem apenas seus próprios dados.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
