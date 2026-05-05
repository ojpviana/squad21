import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, Link2, Loader2, CalendarDays, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/coach_/challenge/$id")({
  component: ChallengeDetail,
});

interface Challenge {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  daily_tasks: { id: number; task: string }[];
}

function ChallengeDetail() {
  const { id } = Route.useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // BUSCA OS DADOS REAIS DO DESAFIO
  // ==========================================
  useEffect(() => {
    async function fetchChallenge() {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Erro ao carregar o desafio.");
      } else {
        setChallenge(data);
      }
      setIsLoading(false);
    }
    fetchChallenge();
  }, [id]);

  // ==========================================
  // MOTOR DE AQUISIÇÃO (LINK MÁGICO)
  // ==========================================
  const copyInviteLink = () => {
    // Esse é o link que o aluno vai clicar para se cadastrar amarrado a este desafio
    const link = `${window.location.origin}/?invite=${challenge?.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de convite copiado! Mande no WhatsApp da sua turma.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background p-8 text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Desafio não encontrado</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/coach">Voltar ao painel</Link>
        </Button>
      </div>
    );
  }

  // Lógica de cálculo dos dias
  const start = new Date(challenge.start_date + 'T00:00:00').getTime();
  const now = new Date().getTime();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = diffDays < 1 ? 0 : diffDays > 21 ? 21 : diffDays;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={[{ to: "/coach", label: "Desafios" }]} />
      
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3 text-muted-foreground">
          <Link to="/coach">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Desafios
          </Link>
        </Button>

        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{challenge.name}</h1>
              <Badge className={currentDay > 0 ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}>
                {currentDay > 0 ? `Dia ${currentDay}/21` : "Não iniciado"}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Início: {new Date(challenge.start_date + 'T00:00:00').toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <Button className="bg-gradient-primary shadow-glow font-bold" onClick={copyInviteLink}>
              <Link2 className="mr-2 h-4 w-4" /> Copiar Link de Convite
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* COLUNA 1: DETALHES DAS TAREFAS */}
          <div className="space-y-6 md:col-span-1">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tarefas Diárias</CardTitle>
                <CardDescription>O que sua turma precisa cumprir</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {challenge.daily_tasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                      <span className="text-sm">{t.task}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA 2: LISTA DE ALUNOS (Em construção para o MVP) */}
          <div className="md:col-span-2">
            <Card className="border-border bg-card h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Dashboard Semáforo</CardTitle>
                  <CardDescription>Acompanhamento de check-ins</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> 0 alunos inscritos
                </div>
              </CardHeader>
              <CardContent>
                {/* Aqui entrará a tabela real de alunos conectados a este desafio */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                    <Link2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum aluno ainda</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Copie o link de convite acima e mande para a sua turma. Assim que eles se cadastrarem, o ranking aparecerá aqui.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={copyInviteLink}>
                    Copiar Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}