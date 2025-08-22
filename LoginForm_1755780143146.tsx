import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, LogIn, User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const loginSchema = z.object({
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginResponse {
  user: {
    id: string;
    username: string;
    role: 'admin' | 'tech';
    fullName?: string | null;
  };
  token: string;
}

interface LoginFormProps {
  onLoginSuccess: (user: LoginResponse['user'], token: string) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const [showDemo, setShowDemo] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponse> => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user.fullName || data.user.username}!`,
      });
      onLoginSuccess(data.user, data.token);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const fillDemoCredentials = (username: string, password: string) => {
    form.setValue('username', username);
    form.setValue('password', password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            Sistema de Gestão
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Entre com suas credenciais
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Nome de Usuário
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          {...field}
                          placeholder="Digite seu usuário"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Digite sua senha"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Entrar
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full mb-3"
            >
              {showDemo ? 'Ocultar' : 'Mostrar'} Credenciais de Teste
            </Button>

            {showDemo && (
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Administrador:
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fillDemoCredentials('admin', 'admin123')}
                    className="text-blue-600 dark:text-blue-400 h-auto p-1"
                  >
                    admin / admin123
                  </Button>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Técnicos:
                  </p>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fillDemoCredentials('joao', 'joao123')}
                      className="text-green-600 dark:text-green-400 h-auto p-1 block"
                    >
                      joao / joao123
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fillDemoCredentials('maria', 'maria123')}
                      className="text-green-600 dark:text-green-400 h-auto p-1 block"
                    >
                      maria / maria123
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Admin vê todos os dados. Técnicos veem apenas seus próprios dados.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}