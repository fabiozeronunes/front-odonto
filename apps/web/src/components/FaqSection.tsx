import { useEffect, useState } from "react";
import {
  HelpCircle,
  CreditCard,
  Bot,
  Crown,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { api } from "../lib/api";
import { cn } from "../lib/utils";

interface FaqItem {
  id: string;
  groupId: string;
  question: string;
  answer: string;
}

interface FaqGroup {
  id: string;
  title: string;
  tag: string;
  featured: boolean;
}

interface Faq {
  dicaTitle: string;
  dicaText: string;
  dicaCta: string;
  dicaLink: string;
  groups: FaqGroup[];
  items: FaqItem[];
}

const SUPPORT_URL = "#faq";

const GROUP_ICON: Record<string, { icon: typeof CreditCard; tile: string }> = {
  "planos-acesso": { icon: CreditCard, tile: "from-teal-400 to-teal-600" },
  "recursos-ia": { icon: Bot, tile: "from-amber-400 to-amber-600" },
  "planos-extra": { icon: Crown, tile: "from-teal-400 to-teal-600" },
  pagamento: { icon: CreditCard, tile: "from-teal-500 to-primary-700" },
};

function Accordion({ item, dark, open }: { item: FaqItem; dark?: boolean; open?: boolean }) {
  return (
    <details
      open={open}
      className={cn(
        "group rounded-xl p-4 transition",
        dark
          ? "bg-white/10 backdrop-blur hover:bg-white/15"
          : "border border-teal-100 bg-teal-50 hover:bg-teal-100/70 dark:border-primary-800 dark:bg-primary-900/40 dark:hover:bg-primary-900/60"
      )}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-foreground">
        <span className={dark ? "text-white" : "text-foreground"}>{item.question}</span>
        <ChevronIcon dark={dark} />
      </summary>
      <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-white/75" : "text-muted-foreground")}>
        {item.answer}
      </p>
    </details>
  );
}

function ChevronIcon({ dark }: { dark?: boolean }) {
  return (
    <svg
      className={cn(
        "h-4 w-4 shrink-0 transition-transform group-open:rotate-180",
        dark ? "text-teal-300" : "text-teal-600 dark:text-teal-300"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Tag({ children, dark }: { children: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        dark ? "bg-white/10 text-teal-300" : "bg-teal-50 text-teal-600 dark:bg-primary-900/40 dark:text-teal-300"
      )}
    >
      <Sparkles className="h-3 w-3" /> {children}
    </span>
  );
}

function FeaturedCard({ group, items }: { group: FaqGroup; items: FaqItem[] }) {
  const meta = GROUP_ICON[group.id] ?? { icon: HelpCircle, tile: "from-teal-400 to-teal-600" };
  const Icon = meta.icon;
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-primary-800 to-primary-950 p-6 text-white shadow-lift transition-all duration-300 hover:-translate-y-1 sm:p-8 lg:col-span-2 animate-fade-in-up">
      <div>
        <div className="flex items-center justify-between">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-teal-300 backdrop-blur">
            <Icon className="h-7 w-7" />
          </span>
          <Tag dark>{group.tag}</Tag>
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold">{group.title}</h3>
        <div className="mt-4 space-y-2.5">
          {items.map((item, i) => (
            <Accordion key={item.id} item={item} dark open={i === 0} />
          ))}
        </div>
      </div>
      <span className="mt-5 inline-block w-fit rounded-full bg-teal-400/20 px-3 py-1 text-xs font-bold text-teal-300">
        Comece grátis e evolua quando quiser
      </span>
    </div>
  );
}

function GroupCard({ group, items, delay }: { group: FaqGroup; items: FaqItem[]; delay: number }) {
  const meta = GROUP_ICON[group.id] ?? { icon: HelpCircle, tile: "from-teal-400 to-teal-600" };
  const Icon = meta.icon;
  return (
    <div
      className="flex flex-col rounded-2xl border border-teal-200 bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up dark:border-primary-800/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white", meta.tile)}>
          <Icon className="h-5 w-5" />
        </span>
        <Tag>{group.tag}</Tag>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-foreground">{group.title}</h3>
      <div className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <Accordion key={item.id} item={item} open={i === 0} />
        ))}
      </div>
    </div>
  );
}

function SupportCard() {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-teal-200 bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up dark:border-primary-800/50">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white">
        <MessageCircle className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-display text-lg font-bold text-foreground">Ainda com dúvidas?</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        Fale com nossa equipe de suporte. Estamos prontos para ajudar na sua jornada de estudos.
      </p>
      <a
        href={SUPPORT_URL}
        className="mt-4 inline-block w-fit rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-sm font-bold text-white hover:from-amber-600 hover:to-amber-700"
      >
        Falar com suporte
      </a>
    </div>
  );
}

function DicaCard({ faq }: { faq: Faq }) {
  return (
    <div className="mt-6 flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-glow transition-all duration-300 hover:-translate-y-1 animate-fade-in-up sm:flex-row sm:items-center sm:p-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
          <HelpCircle className="h-7 w-7" />
        </span>
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3 w-3" /> Dica
          </span>
          <h3 className="mt-2 font-display text-2xl font-bold">{faq.dicaTitle}</h3>
        </div>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">{faq.dicaText}</p>
      {faq.dicaCta && (
        <a
          href={faq.dicaLink || "#planos"}
          className="inline-block w-fit shrink-0 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50"
        >
          {faq.dicaCta}
        </a>
      )}
    </div>
  );
}

export function FaqSection() {
  const [faq, setFaq] = useState<Faq | null>(null);

  useEffect(() => {
    api<{ data: Faq }>("/api/settings/faq", { skipAuth: true })
      .then((res) => setFaq(res.data))
      .catch(() => setFaq(null));
  }, []);

  const featured = faq?.groups.find((g) => g.featured);
  const others = faq?.groups.filter((g) => !g.featured) ?? [];

  return (
    <section
      id="faq"
      className="scroll-mt-16 border-y border-teal-200/60 bg-teal-50/80 py-14 lg:py-20 dark:border-primary-800/40 dark:bg-primary-950/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/60 bg-white px-4 py-1.5 text-sm font-semibold text-teal-700 dark:border-primary-700 dark:bg-primary-900/40 dark:text-teal-300">
            <HelpCircle className="h-3.5 w-3.5" /> Perguntas frequentes
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Dúvidas?{" "}
            <span className="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
              Respondemos aqui
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Tudo o que você precisa saber sobre os planos de assinatura e os recursos de estudo
            com inteligência artificial.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {featured && faq && (
              <FeaturedCard
                group={featured}
                items={faq.items.filter((it) => it.groupId === featured.id)}
              />
            )}
            <SupportCard />
          </div>

          {others.length > 0 && faq && (
            <div className="grid gap-4 lg:grid-cols-3">
              {others.map((group, i) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  items={faq.items.filter((it) => it.groupId === group.id)}
                  delay={(i + 1) * 100}
                />
              ))}
            </div>
          )}

          {faq && faq.groups.length > 0 && (faq.dicaTitle || faq.dicaText) && <DicaCard faq={faq} />}
        </div>
      </div>
    </section>
  );
}