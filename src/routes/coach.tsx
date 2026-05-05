import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Trash2, Trophy, Users, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; 

export const Route = createFileRoute("/coach")({
  component: CoachDashboard,
});

interface Challenge {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  daily_tasks: { id: number; task: string }[];
}

function CoachDashboard() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [tasks, setTasks] = useState<string[]>([""]);

  useEffect(() => {
    async function loadChallenges() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/", search: { invite: undefined } });
        return;
      }

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Erro ao carregar desafios.");
        console.error(error);
      } else {
        setChallenges(data || []);
      }
      setIsLoading(false);
    }
    loadChallenges();
  }, [navigate]);

  const addTask = () => setTasks([...tasks, ""]);
  const removeTask = (i: number) => setTasks(tasks.filter((_, idx) => idx !== i));
  const updateTask = (i: number, v: string) => setTasks(tasks.map((t, idx) => (idx === i ? v : t)));

  const handleCreate = async () => {
    const filteredTasks = tasks.filter((t) => t.trim());
    if (!name || !startDate || filteredTasks.length === 0) {
      toast.error("Preencha o nome, data e ao menos uma tarefa.");
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 21);
      const endDate = end.toISOString().split('T')[0];

      const jsonTasks = filteredTasks.map((t, i) => ({ id: i + 1, task: t }));

      const { data, error } = await supabase
        .from('challenges')
        .insert([{
          trainer_id: user.id,
          name: name,
          start_date: startDate,
          end_date: endDate,
          daily_tasks: jsonTasks
        }])
        .select()
        .single();

      if (error) throw error;

      setChallenges([data, ...challenges]);
      setName(""); setStartDate(""); setTasks([""]); setOpen(false);
      toast.success("Desafio criado com sucesso!");

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao criar o desafio no banco de dados.");
    } finally {
      setIsCreating(false);
    }
  };

  const calculateCurrentDay = (startDateStr: string) => {
    // Força o fuso horário para evitar problemas de cálculo
    const start = new Date(startDateStr + 'T00:00:00').getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays < 1) return 0; 
    if (diffDays > 21) return 21; 
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader nav={[{ to: "/coach", label: "Desafios" }]} />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Olá, Treinador 👋</h1>
            <p className="mt-1 text-muted-foreground">Gerencie seus desafios e acompanhe sua comunidade.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-primary shadow-glow">
                <Plus className="mr-2 h-5 w-5" /> Criar Novo Desafio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Desafio de 21 Dias</DialogTitle>
                <DialogDescription>Defina as tarefas diárias da sua comunidade.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Desafio</Label>
                  <Input id="name" placeholder="Ex: Verão em Forma 21" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data de Início</Label>
                  <Input id="date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tarefas Diárias</Label>
                  {tasks.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`Tarefa ${i + 1} (ex: Beber 3L de água)`}
                        value={t}
                        onChange={(e) => updateTask(i, e.target.value)}
                      />
                      {tasks.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeTask(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTask} className="w-full border-dashed">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Tarefa
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={isCreating}>Cancelar</Button>
                <Button className="bg-gradient-primary" onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? "Salvando..." : "Criar Desafio"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Trophy} label="Desafios ativos" value={challenges.length.toString()} accent />
          <StatCard icon={Users} label="Alunos engajados" value="0" /> 
          <StatCard icon={Zap} label="Taxa de conclusão" value="-" />
        </div>

        <h2 className="mb-4 text-xl font-semibold">Desafios Ativos</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            Você ainda não possui desafios criados. Crie o primeiro acima!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c) => {
              const currentDay = calculateCurrentDay(c.start_date);
              
              return (
                <Card
                  key={c.id}
                  className="group cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-glow"
                  onClick={() => navigate({ to: "/coach/challenge/$id", params: { id: c.id } })}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{c.name}</CardTitle>
                      <Badge className={currentDay > 0 ? "bg-accent/15 text-accent hover:bg-accent/20" : "bg-muted text-muted-foreground"}>
                        {currentDay > 0 ? `Dia ${currentDay}/21` : "Não iniciado"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <CalendarDays className="h-3.5 w-3.5" /> 
                      Início: {new Date(c.start_date + 'T00:00:00').toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Alunos (Em breve)</span>
                      <span className="text-muted-foreground">{c.daily_tasks.length} tarefas/dia</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-gradient-primary transition-all"
                        style={{ width: `${(currentDay / 21) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent ? "bg-gradient-primary shadow-glow" : "bg-secondary"}`}>
          <Icon className={`h-6 w-6 ${accent ? "text-primary-foreground" : "text-accent"}`} />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}