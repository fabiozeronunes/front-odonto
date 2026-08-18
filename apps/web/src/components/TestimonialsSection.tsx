import { Quote, Star } from "lucide-react";
import { cn } from "../lib/utils";

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  avatarClass: string;
}

interface SmallTestimonial extends Testimonial {
  text: string;
}

interface FeaturedTestimonial extends Testimonial {
  quote: string;
  detail: string;
}

const BLOCK_1_FEATURED: FeaturedTestimonial = {
  initials: "RA",
  name: "Rafael Almeida",
  role: "Aprovado em 1º lugar · Concurso público",
  avatarClass: "from-amber-400 to-amber-600",
  quote:
    "Estudei 3 meses com os planos de estudo de teste/prova e a IA que revisa por mim. Fui aprovado em 1º lugar no concurso!",
  detail:
    "O combo de vídeos, áudio, quizzes e mapas mentais criados automaticamente fez toda a diferença. Eu só estudava — a plataforma cuidava da revisão.",
};

const BLOCK_1_GRID: SmallTestimonial[] = [
  {
    initials: "CE",
    name: "Carlos Eduardo",
    role: "Dentista · Pós-graduação",
    avatarClass: "from-amber-400 to-amber-600",
    text: "As gravações em áudio viraram parte da minha rotina. Escuto no trânsito e os quizzes me mostram o que revisar.",
  },
  {
    initials: "FL",
    name: "Fernanda Lima",
    role: "Aluna · 8º período",
    avatarClass: "from-teal-400 to-teal-600",
    text: "Estudos de caso + simulados comentados me deixaram muito mais confiante para as provas.",
  },
  {
    initials: "MS",
    name: "Mariana Souza",
    role: "Aprovada em residência",
    avatarClass: "from-teal-500 to-primary-700",
    text: "Flashcards e mapas mentais gerados pela IA: revisão rápida e eficiente antes de qualquer prova.",
  },
  {
    initials: "JC",
    name: "Juliana Castro",
    role: "Dentista · Recém-formada",
    avatarClass: "from-teal-500 to-accent-500",
    text: "Quizzes diários: leve, rápido e meu desempenho subiu muito.",
  },
];

const BLOCK_2_FEATURED: FeaturedTestimonial = {
  initials: "PH",
  name: "Pedro Henrique",
  role: "Estudante de Odontologia",
  avatarClass: "from-primary-500 to-teal-600",
  quote:
    "Assistir as aulas em vídeo no meu ritmo e fixar com flashcards mudou meu desempenho. Minhas notas subiram de verdade!",
  detail:
    "A IA organiza o conteúdo, gera os flashcards e acompanha meu progresso. Eu foco no estudo e o resto a plataforma faz por mim.",
};

const BLOCK_2_GRID: SmallTestimonial[] = [
  {
    initials: "LR",
    name: "Letícia Ramos",
    role: "Aluna · 6º período",
    avatarClass: "from-primary-600 to-primary-800",
    text: "Infográficos e resumos prontos me pouparam semanas de preparação.",
  },
  {
    initials: "GN",
    name: "Gustavo Nunes",
    role: "Estudante · Concurso",
    avatarClass: "from-teal-400 to-teal-600",
    text: "Escuto as aulas em áudio no trajeto para a faculdade. Tempo que eu perdia virou estudo.",
  },
  {
    initials: "AF",
    name: "Amanda Freitas",
    role: "Aprovada em residência",
    avatarClass: "from-amber-400 to-amber-600",
    text: "Mapas mentais para revisar rápido antes da prova. Enxergo a matéria inteira em uma imagem.",
  },
  {
    initials: "TM",
    name: "Thiago Martins",
    role: "Estudante · Prova da pós",
    avatarClass: "from-teal-500 to-primary-700",
    text: "Simulados com perguntas comentadas: sei exatamente onde errei e o que revisar.",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function Avatar({ initials, className }: { initials: string; className: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br font-display font-bold text-white",
        className
      )}
    >
      {initials}
    </span>
  );
}

function FeaturedCard({ t, size }: { t: FeaturedTestimonial; size: "lg" | "sm" }) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-primary-800 to-primary-950 p-6 text-white shadow-lift transition-all duration-300 hover:-translate-y-1 sm:p-8 lg:col-span-2 animate-fade-in-up">
      <div>
        <Stars />
        <Quote className="mt-4 h-9 w-9 text-teal-300" />
        <p
          className={cn(
            "mt-3 font-display font-bold leading-snug",
            size === "lg" ? "text-xl sm:text-2xl" : "text-lg"
          )}
        >
          “{t.quote}”
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/75">{t.detail}</p>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Avatar initials={t.initials} className={cn("h-11 w-11 text-sm", t.avatarClass)} />
        <div>
          <p className="font-bold">{t.name}</p>
          <p className="text-xs text-teal-200">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ t }: { t: SmallTestimonial }) {
  return (
    <div className="flex flex-col rounded-2xl border border-teal-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up">
      <Stars />
      <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/75">{t.text}</p>
      <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <Avatar initials={t.initials} className={cn("h-9 w-9 text-xs", t.avatarClass)} />
        <div>
          <p className="text-sm font-bold text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section
      id="depoimentos"
      className="scroll-mt-16 border-y border-teal-200/60 bg-teal-50/80 py-14 lg:py-20 dark:border-primary-800/40 dark:bg-primary-950/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/60 bg-white px-4 py-1.5 text-sm font-semibold text-teal-700 dark:border-primary-700 dark:bg-primary-900/40 dark:text-teal-300">
            <Quote className="h-3.5 w-3.5" /> Depoimentos
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Histórias reais de{" "}
            <span className="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
              quem evoluiu
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Depoimentos de quem usa os recursos de estudo, inteligência artificial e revisão
            inteligente no dia a dia.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <FeaturedCard t={BLOCK_1_FEATURED} size="lg" />
            {BLOCK_1_GRID.map((t) => (
              <SmallCard key={t.name} t={t} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <FeaturedCard t={BLOCK_2_FEATURED} size="lg" />
            {BLOCK_2_GRID.map((t) => (
              <SmallCard key={t.name} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}