import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { MembershipPlan } from "../types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatPrice, cn } from "../lib/utils";

const PLAN_ORDER: Record<string, number> = {
  "odontus-premium": 0,
  "odontus-vip": 1,
  gratuito: 2,
};

const PLAN_TITLE: Record<string, string> = {
  "odontus-premium": "Odontus PREMIUM",
  "odontus-vip": "Odontus VIP",
  gratuito: "Gratuito",
};

function Price({ plan, variant = "default" }: { plan: MembershipPlan; variant?: "default" | "featured" }) {
  const subtle = variant === "featured" ? "text-teal-300" : "text-muted-foreground";
  const accent = variant === "featured" ? "text-white" : "text-foreground";
  if (plan.billing === "YEARLY") {
    return (
      <div>
        <p className={cn("text-sm font-medium uppercase tracking-wide", subtle)}>Anual</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold">{formatPrice(plan.price)}</span>
          <span className={cn("text-sm", subtle)}>/ ano</span>
        </div>
        <p className={cn("mt-1 text-xs", subtle)}>
          sai a <span className={cn("font-semibold", accent)}>{formatPrice(Number(plan.price) / 12)}</span>{" "}
          mensal
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-display text-3xl font-bold">{formatPrice(plan.price)}</span>
      <span className={cn("text-sm", subtle)}>/ mês</span>
    </div>
  );
}

function FeaturedPlan({ plan, isAuthenticated }: { plan: MembershipPlan; isAuthenticated: boolean }) {
  const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
  return (
    <div className="relative flex flex-col justify-between rounded-3xl bg-gradient-to-br from-primary-800 to-primary-950 p-6 text-white shadow-lift transition-all duration-300 hover:-translate-y-1 sm:p-8 lg:col-span-2 animate-fade-in-up">
      <span className="absolute -top-3 left-8 inline-block rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-bold text-white shadow-glow">
        MAIS POPULAR
      </span>
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-bold">{PLAN_TITLE[plan.slug] ?? plan.name}</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-300">
            <Sparkles className="h-3 w-3" /> Todo conteúdo liberado
          </span>
        </div>
        {plan.description && <p className="mt-2 text-sm text-white/70">{plan.description}</p>}
        <div className="mt-5">
          <Price plan={plan} variant="featured" />
        </div>
        <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 break-words text-white/85">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <Link
        to={isAuthenticated ? `/checkout?plan=${plan.slug}` : `/cadastro?plan=${plan.slug}`}
        className="mt-7 inline-block"
      >
        <Button variant="premium" size="lg" className="w-full rounded-full px-10">
          Assinar Premium
        </Button>
      </Link>
    </div>
  );
}

function GridPlan({ plan, isAuthenticated }: { plan: MembershipPlan; isAuthenticated: boolean }) {
  const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
  const isVip = plan.slug === "odontus-vip";
  const isFree = !isVip && plan.slug !== "odontus-premium";
  const cta = isFree
    ? isAuthenticated
      ? "/dashboard"
      : "/cadastro"
    : isAuthenticated
    ? `/checkout?plan=${plan.slug}`
    : `/cadastro?plan=${plan.slug}`;
  const ctaLabel = isFree ? "Criar conta gratuita" : isVip ? "Assinar VIP" : "Assinar";
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-teal-200 bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-fade-in-up",
        "dark:border-primary-800/50"
      )}
    >
      <span
        className={cn(
          "absolute -top-3 left-6 inline-block rounded-2xl px-3 py-1 text-xs font-bold text-white",
          isVip ? "bg-gradient-to-r from-teal-400 to-teal-600" : "bg-gradient-to-r from-teal-500 to-primary-600"
        )}
      >
        {isVip ? "MELHOR CUSTO-BENEFÍCIO" : "COMECE GRÁTIS"}
      </span>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{PLAN_TITLE[plan.slug] ?? plan.name}</h3>
        {plan.description && <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>}
        <div className="mt-4">
          <Price plan={plan} />
        </div>
        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          {benefits.slice(0, 4).map((b, i) => (
            <li key={i} className="flex items-start gap-2 break-words">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <Link to={cta} className="mt-6 inline-block">
        <Button variant="premium" size="lg" className="w-full rounded-full">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
  delay,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <div
      className="flex flex-col justify-center rounded-2xl border border-dashed border-teal-400/40 bg-gradient-to-br from-primary-800 to-primary-950 p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-teal-300 backdrop-blur">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-base font-bold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/70">{text}</p>
    </div>
  );
}

export function Plans() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: MembershipPlan[] }>("/api/plans")
      .then((data) =>
        setPlans(
          data.data
            .filter((p) => p.status === "ACTIVE")
            .sort((a, b) => (PLAN_ORDER[a.slug] ?? 99) - (PLAN_ORDER[b.slug] ?? 99))
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const featured = plans.find((p) => p.slug === "odontus-premium") ?? plans[0];
  const grid = plans.filter((p) => p.id !== featured?.id);

  return (
    <div className="border-y border-teal-200/60 bg-teal-50/80 dark:border-primary-800/40 dark:bg-primary-950/40">
      <div className="mx-auto max-w-[99%] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
        <Badge className="rounded-full border border-teal-300/60 bg-white px-4 py-1.5 text-teal-700 dark:border-primary-700 dark:bg-primary-900/40 dark:text-teal-300">
          <Sparkles className="h-3 w-3" /> Planos de assinatura
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Escolha o plano ideal para{" "}
          <span className="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
            seus estudos
          </span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Comece grátis e evolua para o acesso completo quando quiser. O acesso é liberado
          imediatamente após a confirmação do pagamento.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-3xl bg-muted lg:col-span-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {featured && <FeaturedPlan plan={featured} isAuthenticated={isAuthenticated} />}
          {grid.map((plan) => (
            <GridPlan key={plan.id} plan={plan} isAuthenticated={isAuthenticated} />
          ))}
          <InfoCard
            icon={ShieldCheck}
            title="Garantia e suporte"
            text="Acesso liberado imediatamente após a confirmação do pagamento, com suporte para sua jornada."
            delay={300}
          />
          <InfoCard
            icon={CreditCard}
            title="Pagamento seguro"
            text="Pague com Pix, cartão de crédito ou boleto e desbloqueie seu plano na hora."
            delay={400}
          />
        </div>
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        O acesso ao plano é liberado imediatamente após a confirmação do pagamento.
      </p>
      </div>
    </div>
  );
}