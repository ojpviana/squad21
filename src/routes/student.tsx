import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Flame, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/student")({
  component: StudentView,
});

interface Challenge {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  daily_tasks: { id: number; task: string }[];
}

function StudentView() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [popId, setPopId] = useState<number | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudentData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setStudentId(user.id);

      let targetChallengeId = localStorage.getItem('squad21_invite_id');

      if (!targetChallengeId) {
        const { data: lastCheckin } = await supabase
          .from('checkins')
          .select('challenge_id')
          .eq('student_id', user.id)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastCheckin) {
          targetChallengeId = lastCheckin.challenge_id;
        }
      }

      if (!targetChallengeId) {
        setIsLoading(false);
        return;
      }

      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', targetChallengeId)
        .single();

      if (challengeError || !challengeData) {
        console.error("Desafio não encontrado", challengeError);
        setIsLoading(false);
        return;
      }

      setChallenge(challengeData);

      const today = new Date().toISOString().split('T')[0];
      const { data: checkinData } = await supabase
        .from('checkins')
        .select('completed_tasks')
        .eq('challenge_id', challengeData.id)
        .eq('student_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (checkinData && checkinData.completed_tasks) {
        setCompletedTaskIds(checkinData.completed_tasks);
      }

      setIsLoading(false);
    }
    loadStudentData();
  }, []);

  const toggleTask = async (taskId: number) => {
    if (!challenge || !studentId) return;

    const isCompleted = completedTaskIds.includes(taskId);
    let newCompletedTasks: number[] = [];
    
    if (isCompleted) {
      newCompletedTasks = completedTaskIds.filter(id => id !== taskId);
    } else {
      newCompletedTasks = [...completedTaskIds, taskId];
      setPopId(taskId);
      setTimeout(() => setPopId(null), 400);
    }

    setCompletedTaskIds(newCompletedTasks);

    const today = new Date().toISOString().split('T')[0];
    const dailyScore = newCompletedTasks.length * 20;

    const { error } = await supabase
      .from('checkins')
      .upsert({
        challenge_id: challenge.id,
        student_id: studentId,
        date: today,
        completed_tasks: newCompletedTasks,
        daily_score: dailyScore
      }, { onConflict: 'challenge_id,student_id,date' });

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar progresso.");
    } else if (newCompletedTasks.length === challenge.daily_tasks.length) {
      toast.success("Dia completo! Pontuação máxima garantida.");
    }
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
        <h2 className="text-2xl font-bold">Nenhum desafio ativo</h2>
        <p className="mt-2 text-muted-foreground">Peça o link do Grupo ao seu Treinador.</p>
      </div>
    );
  }

  const totalTasksCount = challenge.daily_tasks.length;
  const completedCount = completedTaskIds.length;
  const dailyProgress = totalTasksCount === 0 ? 0 : (completedCount / totalTasksCount) * 100;
  
  const start = new Date(challenge.start_date + 'T00:00:00').getTime();
  const now = new Date().getTime();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = diffDays < 1 ? 0 : diffDays > 21 ? 21 : diffDays;
  const totalProgress = (currentDay / 21) * 100;

  const totalPoints = completedCount * 20; 

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader nav={[{ to: "/student", label: "Meu Desafio" }]} />
      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-accent">Em andamento</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{challenge.name}</h1>
          <p className="text-sm text-muted-foreground">
            Dia <span className="font-semibold text-foreground">{currentDay > 0 ? currentDay : 0}</span> de 21
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-gradient-primary transition-all" style={{ width: `${totalProgress}%` }} />
          </div>
        </div>

        <Card className="mb-6 overflow-hidden border-border bg-card shadow-elegant">
          <div className="bg-gradient-primary p-5 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Sua pontuação hoje</p>
                <p className="mt-1 text-4xl font-black">{totalPoints}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-primary-foreground hover:bg-white/20">
                  <Crown className="mr-1 h-3 w-3" /> Em busca do Top 10
                </Badge>
                <p className="mt-2 flex items-center justify-end gap-1 text-xs opacity-90">
                  <Flame className="h-3.5 w-3.5" /> Mantenha a consistência
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Checklist do dia</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {completedCount}/{totalTasksCount}
                  </span>
                </CardTitle>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-accent transition-all" style={{ width: `${dailyProgress}%` }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {challenge.daily_tasks.map((t) => {
                  const isDone = completedTaskIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTask(t.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                        isDone
                          ? "border-accent/40 bg-accent/5"
                          : "border-border bg-secondary/40 hover:border-primary/40"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                          isDone ? "border-accent bg-accent" : "border-muted-foreground/40"
                        } ${popId === t.id ? "animate-check-pop" : ""}`}
                      >
                        {isDone && <Check className="h-4 w-4 text-accent-foreground" strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 text-sm font-medium ${isDone ? "text-muted-foreground line-through" : ""}`}>
                        {t.task}
                      </span>
                      {isDone && <span className="text-xs font-bold text-accent">+20pts</span>}
                    </button>
                  );
                })}
                {completedCount === totalTasksCount && totalTasksCount > 0 && (
                  <div className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-center mt-4">
                    <p className="text-sm font-semibold text-accent">🎉 Dia completo! Você foi incrível hoje!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranking" className="mt-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-accent" /> Em Breve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Crown className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">O Ranking está aquecendo!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Continue fazendo seus check-ins diários. O ranking completo da sua turma estará disponível na próxima atualização.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}