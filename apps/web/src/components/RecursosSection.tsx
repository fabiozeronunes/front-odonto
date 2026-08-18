import {
  Sparkles,
  Bot,
  Video,
  Headphones,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Zap,
  Layers,
  Network,
  BarChart3,
} from "lucide-react";
import { cn } from "../lib/utils";

interface GridBenefit {
  icon: typeof Video;
  title: string;
  text: string;
  tile: string;
}

interface FeaturedBenefit {
  icon: typeof Video;
  title: string;
  text: string;
  tag: string;
}

const BLOCK_1_FEATURED: FeaturedBenefit = {
  icon: Video,
  title: "Gravação de aulas em vídeo",
  text: "Assista aulas gravadas por especialistas quando e onde quiser. Pause, reveja e estude no seu ritmo até fixar o conteúdo — aprenda assistindo, sem limite de tempo e sem perder nada.",
  tag: "Aprender assistindo",
};

const BLOCK_1_GRID: GridBenefit[] = [
  {
    icon: Headphones,
    title: "Aulas em áudio",
    text: "Leve as aulas para qualquer lugar: ônibus, academia, filas. Transforme tempo ocioso em estudo produtivo.",
    tile: "from-amber-400 to-amber-600",
  },
  {
    icon: BookOpen,
    title: "Estudos de caso",
    text: "Treine com casos clínicos reais e desenvolva seu raciocínio clínico, da teoria à prática.",
    tile: "from-teal-400 to-teal-600",
  },
  {
    icon: GraduationCap,
    title: "Estudos para teste / prova",
    text: "Planos focados no que mais cai em provas e concursos, para você chegar preparado no dia.",
    tile: "from-primary-600 to-primary-800",
  },
  {
    icon: ClipboardList,
    title: "Testes (P & R)",
    text: "Simulados com perguntas e respostas comentadas, para você ver exatamente onde errou e evoluir.",
    tile: "from-teal-500 to-accent-500",
  },
];

const BLOCK_2_FEATURED: FeaturedBenefit = {
  icon: Layers,
  title: "Flashcards",
  text: "Transforme conteúdo em cartões de pergunta e resposta. Repita e fixe com repetição espaçada — a técnica de memorização de longo prazo mais eficiente que existe.",
  tag: "Memorização de longo prazo",
};

const BLOCK_2_GRID: GridBenefit[] = [
  {
    icon: Zap,
    title: "Quizz",
    text: "Reveja rápido com quizzes dinâmicos e gamificados que fixam conteúdo e medem seu progresso.",
    tile: "from-accent-400 to-accent-600",
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
    text: "Resuma conteúdos complexos em imagens claras e fáceis de memorizar, perfeitas para revisão rápida.",
    tile: "from-accent-500 to-accent-600",
  },
];

function AiTag({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        dark ? "bg-white/10 text-teal-300" : "bg-teal-50 text-teal-600 dark:bg-primary-900/40 dark:text-teal-300"
      )}
    >
      <Bot className="h-3 w-3" /> IA
    </span>
  );
}

function FeaturedCard({ t, delay }: { t: FeaturedBenefit; delay: number }) {
  const Icon = t.icon;
  return (
    <div
      className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-primary-800 to-primary-950 p-6 text-white shadow-lift transition-all duration-300 hover:-translate-y-1 sm:p-8 lg:col-span-2 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-teal-300 backdrop-blur">
            <Icon className="h-7 w-7" />
          </span>
          <AiTag dark />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold">{t.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/75">{t.text}</p>
      </div>
      <span className="mt-5 inline-block w-fit rounded-full bg-teal-400/20 px-3 py-1 text-xs font-bold text-teal-300">
        {t.tag}
      </span>
    </div>
  );
}

function SmallCard({ t, delay }: { t: GridBenefit; delay: number }) {
  const Icon = t.icon;
  return (
    <div
      className="flex flex-col rounded-2xl border border-teal-200 bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up dark:border-primary-800/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white", t.tile)}>
          <Icon className="h-5 w-5" />
        </span>
        <AiTag />
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-foreground">{t.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t.text}</p>
    </div>
  );
}

function ComingSoonCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-teal-300 bg-surface/70 p-6 text-center animate-fade-in-up dark:border-primary-700">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-primary-900/60 dark:text-teal-300">
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-base font-bold text-foreground">Em breve, mais recursos</p>
      <p className="mt-1 text-xs text-muted-foreground">Novas ferramentas de estudo com IA chegam em breve.</p>
    </div>
  );
}

export function RecursosSection() {
  return (
    <section
      id="recursos"
      className="scroll-mt-16 border-y border-teal-200/60 bg-teal-50/80 py-14 lg:py-20 dark:border-primary-800/40 dark:bg-primary-950/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/60 bg-white px-4 py-1.5 text-sm font-semibold text-teal-700 dark:border-primary-700 dark:bg-primary-900/40 dark:text-teal-300">
            <Sparkles className="h-3.5 w-3.5" /> Recursos com inteligência artificial
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
              aprender de verdade
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Nove ferramentas de estudo criadas para transformar conteúdo em conhecimento duradouro
            — todas potencializadas por inteligência artificial para personalizar, revisar e
            acelerar o seu aprendizado.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <FeaturedCard t={BLOCK_1_FEATURED} delay={0} />
            {BLOCK_1_GRID.map((b, i) => (
              <SmallCard key={b.title} t={b} delay={(i + 1) * 100} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <FeaturedCard t={BLOCK_2_FEATURED} delay={0} />
            {BLOCK_2_GRID.map((b, i) => (
              <SmallCard key={b.title} t={b} delay={(i + 1) * 100} />
            ))}
            <ComingSoonCard />
          </div>
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
      </div>
    </section>
  );
}