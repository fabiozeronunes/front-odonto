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

export function Plans() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: MembershipPlan[] }>("/api/plans")
      .then((data) => setPlans(data.data.filter((p) => p.status === "ACTIVE")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="bg-primary-100 text-primary-800">
          <Sparkles className="h-3 w-3" /> Planos de assinatura
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          Escolha o plano ideal para seus estudos
        </h1>
        <p className="mt-3 text-slate-500">
          Comece grátis e evolua para o acesso completo quando quiser.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isPremium = plan.slug === "premium";
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isPremium ? "border-primary-600 ring-2 ring-primary-600/20" : ""}`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="premium">MAIS POPULAR</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.slug === "free" ? "Gratuito" : plan.slug === "premium" ? "Premium" : "Pro"}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-slate-500">
                      / {plan.billing === "MONTHLY" ? "mês" : "ano"}
                    </span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {Array.isArray(plan.benefits) &&
                      plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                          {benefit}
                        </li>
                      ))}
                  </ul>

                  <div className="mt-8">
                    {isPremium ? (
                      <Link to={isAuthenticated ? "/dashboard" : "/cadastro"}>
                        <Button variant="premium" size="lg" className="w-full">
                          Assinar Premium
                        </Button>
                      </Link>
                    ) : (
                      <Link to={isAuthenticated ? "/dashboard" : "/cadastro"}>
                        <Button variant="outline" size="lg" className="w-full">
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

      <p className="mt-10 text-center text-sm text-slate-500">
        Pagamentos e assinaturas serão habilitados em breve.
      </p>
    </div>
  );
}
