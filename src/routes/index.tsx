import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Dumbbell, GraduationCap, Sparkles, Trophy, Users, Zap, ArrowLeft } from "lucide-react";
import { handleLogin, handleSignUp } from "../lib/supabase";

// 1. Ensinamos o roteador a ler o parâmetro ?invite=... da URL com tipagem segura
export const Route = createFileRoute("/")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    invite: search.invite as string | undefined,
  }),
});

type UserRole = 'trainer' | 'student';

function LoginPage() {
  const navigate = useNavigate();
  
  // Extrai o ID do convite da URL (se existir)
  const { invite } = Route.useSearch();

  // Controle de Estado da Tela e do Motor de Auth
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); 

  // Campos do Formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // 2. Salva o convite na memória do navegador assim que a página carrega
  useEffect(() => {
    if (invite) {
      localStorage.setItem('squad21_invite_id', invite);
      // Já seleciona "Sou Aluno" automaticamente para remover atrito na conversão
      setSelectedRole('student');
    }
  }, [invite]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    setErrorMsg(null); // Limpa o erro anterior ao tentar de novo

    try {
      if (isLoginMode) {
        const realRole = await handleLogin(email, password);
        navigate({ to: realRole === 'trainer' ? '/coach' : '/student' });
      } else {
        // Resgata o ID que salvamos na memória
        const inviteId = localStorage.getItem('squad21_invite_id'); 
        // Envia o inviteId como o 5º parâmetro da função
        await handleSignUp(email, password, name, selectedRole, inviteId || undefined);
        navigate({ to: selectedRole === 'trainer' ? '/coach' : '/student' });
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      
      // Tradutor rápido de erros para o MVP
      const msg = error.message || "";
      if (msg.includes("Invalid login credentials")) {
        setErrorMsg("E-mail ou senha incorretos.");
      } else if (msg.includes("already registered")) {
        setErrorMsg("Este e-mail já está cadastrado. Faça login.");
      } else if (msg.includes("Password should be")) {
        setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErrorMsg("Ocorreu um erro de conexão. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedRole(null);
    setIsLoginMode(true);
    setEmail("");
    setPassword("");
    setName("");
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-10">
          <Logo size="lg" />
        </div>

        <div className="mb-8 max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Transforme hábitos em <span className="text-gradient">21 dias</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            A plataforma gamificada para treinadores e comunidades que querem resultados reais.
          </p>
        </div>

        <Card className="w-full max-w-md border-border bg-card/60 p-8 backdrop-blur shadow-elegant transition-all duration-300">
          
          {!selectedRole ? (
            // VISÃO 1: ESCOLHA DE PERFIL
            <>
              <h2 className="mb-6 text-center text-lg font-semibold">Entrar como</h2>
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="h-14 w-full bg-gradient-primary text-base font-semibold shadow-glow hover:opacity-95"
                  onClick={() => setSelectedRole('trainer')}
                >
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Sou Treinador
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full border-accent/40 text-base font-semibold text-accent hover:bg-accent/10 hover:text-accent"
                  onClick={() => setSelectedRole('student')}
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Sou Aluno
                </Button>
              </div>
            </>
          ) : (
            // VISÃO 2: FORMULÁRIO DE LOGIN/CADASTRO
            <form onSubmit={onSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground" 
                  onClick={resetSelection}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {isLoginMode ? 'Acessar' : 'Criar conta'} como {selectedRole === 'trainer' ? 'Treinador' : 'Aluno'}
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* CAIXA DE ERRO VISUAL */}
                {errorMsg && (
                  <div className="animate-in fade-in rounded-md border border-red-500/30 bg-red-500/15 p-3 text-sm text-red-500 font-medium">
                    {errorMsg}
                  </div>
                )}

                {!isLoginMode && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome completo</label>
                    <Input 
                      required 
                      placeholder="Seu nome" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="bg-background/50"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <Input 
                    required 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <Input 
                    required 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-2 h-11 font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : (isLoginMode ? 'Entrar' : 'Criar Conta')}
                </Button>
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {isLoginMode ? "Não tem uma conta?" : "Já possui uma conta?"}{" "}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setErrorMsg(null); // Limpa o erro ao trocar de tela
                  }} 
                  className="text-primary font-semibold hover:underline"
                >
                  {isLoginMode ? "Cadastre-se" : "Faça login"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com os Termos de Uso.
          </p>
        </Card>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, label: "Engajamento diário" },
            { icon: Trophy, label: "Ranking e recompensas" },
            { icon: Users, label: "Comunidade ativa" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-4">
              <f.icon className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>

        <Link 
          to="/" 
          search={{ invite: undefined }} 
          className="mt-10 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="h-3 w-3" /> Squad 21 © 2026
        </Link>
      </div>
    </div>
  );
}