import {
  Sparkles,
  Video,
  Headphones,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Zap,
  Layers,
  Network,
  BarChart3,
  Bot,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const BENEFITS = [
  {
    icon: Video,
    title: "Gravação de aulas em vídeo",
    text: "Assista aulas gravadas por especialistas quando e onde quiser. Pause, reveja e estude no seu ritmo até fixar o conteúdo — aprenda assistindo, sem limite de tempo e sem perder nada.",
    className: "sm:col-span-2",
    tile: "from-teal-500 to-primary-700",
  },
  {
    icon: Headphones,
    title: "Gravação de aulas em áudio",
    text: "Leve as aulas para qualquer lugar: ônibus, academia, filas. Transforme tempo ocioso em estudo produtivo.",
    tile: "from-amber-400 to-amber-600",
  },
  {
    icon: BookOpen,
    title: "Estudos de caso",
    text: "Treine com casos clínicos reais, do diagnóstico à conduta, e desenvolva seu raciocínio clínico.",
    tile: "from-teal-400 to-teal-600",
  },
  {
    icon: GraduationCap,
    title: "Estudos para teste / prova",
    text: "Monte planos de estudo focados nas matérias que mais caem em provas e concursos. Estude por tópicos estratégicos e chegue ao dia da avaliação preparado e confiante, sem estudar o que não precisa.",
    className: "border-amber-200 bg-gradient-to-br from-amber-50 to-white lg:col-span-2",
    tile: "from-primary-600 to-primary-800",
  },
  {
    icon: ClipboardList,
    title: "Testes (perguntas e respostas)",
    text: "Crie simulados com perguntas e respostas comentadas, corrija e veja exatamente onde errou para evoluir.",
    tile: "from-teal-500 to-accent-500",
  },
  {
    icon: Zap,
    title: "Quizz",
    text: "Reveja rápido com quizzes dinâmicos e gamificados que fixam conteúdo e medem seu progresso em minutos.",
    tile: "from-accent-400 to-accent-600",
  },
  {
    icon: Layers,
    title: "Flashcards",
    text: "Transforme conteúdo em cartões de pergunta e resposta. Repita e fixe com repetição espaçada — a técnica de memorização de longo prazo mais eficiente que existe.",
    className: "border-primary-700/40 bg-gradient-to-br from-primary-800 to-primary-950 text-white lg:col-span-2",
    tile: "bg-white/10 text-teal-300",
    dark: true,
  },
  {
    icon: Network,
    title: "Mapas mentais",
    text: "Organize a matéria em mapas visuais que conectam conceitos e revisam rápido antes da prova.",
    tile: "from-primary-500 to-teal-600",
  },
  {
    icon: BarChart3,
    title: "Infográficos",
    text: "Resuma conteúdos complexos em imagens claras e fáceis de memorizar — perfeito para revisão rápida.",
    tile: "from-accent-500 to-accent-600",
  },
];

export function RecursosSection() {
  return (
    <section
      id="recursos"
      className="scroll-mt-16 border-y border-teal-200/60 bg-teal-50/80 py-14 lg:py-20 dark:border-primary-800/40 dark:bg-primary-950/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <Badge className="rounded-full border border-teal-300/60 bg-teal-50 px-4 py-1.5 text-teal-700">
            <Sparkles className="h-3 w-3" /> Recursos com inteligência artificial
          </Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
              aprender de verdade
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-foreground/70">
            Nove ferramentas de estudo criadas para transformar conteúdo em conhecimento
            duradouro — todas potencializadas por inteligência artificial para personalizar,
            revisar e acelerar o seu aprendizado.
          </p>
        </div>

        <div className="mt-10 grid auto-rows-[minmax(150px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className={cn(
                  "group relative flex flex-col rounded-3xl border border-teal-200 bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up",
                  b.className,
                  b.dark && "border-primary-700/40 bg-gradient-to-br from-primary-800 to-primary-950"
                )}
                style={{ animationDelay: `${(i % 5) * 100}ms` }}
              >
                <span
                  className={cn(
                    "absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    b.dark
                      ? "bg-white/10 text-teal-300"
                      : "bg-teal-50 text-teal-600"
                  )}
                >
                  <Bot className="h-3 w-3" /> IA
                </span>

                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white",
                    b.tile,
                    b.dark && "bg-white/10 text-teal-300 backdrop-blur"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3
                  className={cn(
                    "mt-4 font-display text-lg font-bold",
                    b.dark ? "text-white" : "text-foreground"
                  )}
                >
                  {b.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    b.dark ? "text-white/80" : "text-foreground/70"
                  )}
                >
                  {b.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-primary-800 via-primary-900 to-teal-700 px-6 py-8 text-center text-white shadow-lift animate-fade-in-up anim-delay-200 sm:px-10">
          <p className="mx-auto flex items-center justify-center gap-2 font-display text-xl font-bold sm:text-2xl">
            <Bot className="h-6 w-6 text-teal-300" />
            Todos os recursos usam inteligência artificial a seu favor
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
            A IA organiza o conteúdo, gera materiais de revisão e acompanha seu desempenho,
            deixando você livre para focar no que realmente importa: estudar.
          </p>
        </div>

        <div className="mt-10 text-center animate-fade-in-up anim-delay-300">
          <p className="inline-flex items-center gap-2 rounded-full border border-dashed border-teal-300 bg-teal-50/60 px-5 py-2 text-sm font-semibold text-teal-800">
            <Sparkles className="h-4 w-4" /> Em breve, mais recursos chegam para turbinar ainda
            mais seus estudos
          </p>
        </div>
      </div>
    </section>
  );
}
