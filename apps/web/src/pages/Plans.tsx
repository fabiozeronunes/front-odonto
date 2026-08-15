import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { MembershipPlan } from "../types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatPrice } from "../lib/utils";

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

  return (
    <div className="mx-auto max-w-[90%] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          <Sparkles className="h-3 w-3" /> Planos de assinatura
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          Escolha o plano ideal para seus estudos
        </h1>
        <p className="mt-3 text-muted-foreground">
          Comece grátis e evolua para o acesso completo quando quiser.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPremium = plan.slug === "odontus-premium";
            const isVip = plan.slug === "odontus-vip";
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all hover:-translate-y-1 hover:shadow-lift ${
                  isPremium
                    ? "border-primary-600 ring-2 ring-primary-600/20 dark:border-primary-400"
                    : ""
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gradientYellow" className="rounded-2xl">
                      MAIS POPULAR
                    </Badge>
                  </div>
                )}
                {isVip && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gradientTeal" className="rounded-2xl">
                      MELHOR CUSTO-BENEFÍCIO
                    </Badge>
                  </div>
                )}
                {!isVip && !isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="gradientTeal" className="rounded-2xl">
                      GRATUITO
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{PLAN_TITLE[plan.slug] ?? plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  {plan.billing === "YEARLY" ? (
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Anual
                      </p>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold text-foreground">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-sm text-muted-foreground">/ ano</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        sai a{" "}
                        <span className="font-semibold text-foreground">
                          {formatPrice(Number(plan.price) / 12)}
                        </span>{" "}
                        mensal
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-foreground">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/ mês</span>
                    </div>
                  )}

                  <ul className="mt-6 flex-1 space-y-3">
                    {Array.isArray(plan.benefits) &&
                      plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                          {benefit}
                        </li>
                      ))}
                  </ul>

                  <div className="mt-8">
                    {isPremium ? (
                      <Link to={isAuthenticated ? `/checkout?plan=${plan.slug}` : `/cadastro?plan=${plan.slug}`}>
                        <Button variant="premium" size="lg" className="w-full">
                          Assinar Premium
                        </Button>
                      </Link>
                    ) : plan.slug === "odontus-vip" ? (
                      <Link to={isAuthenticated ? `/checkout?plan=${plan.slug}` : `/cadastro?plan=${plan.slug}`}>
                        <Button variant="premium" size="lg" className="w-full">
                          Assinar VIP
                        </Button>
                      </Link>
                    ) : (
                      <Link to={isAuthenticated ? "/dashboard" : "/cadastro"}>
                        <Button variant="premium" size="lg" className="w-full">
                          Criar conta gratuita
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        O acesso ao plano é liberado imediatamente após a confirmação do pagamento.
      </p>
    </div>
  );
}
