import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Sparkles, ShieldCheck, AlertCircle, Lock } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { MembershipPlan } from "../types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatPrice } from "../lib/utils";

interface CheckoutResult {
  orderId: string;
  amount: number;
  status: "PENDING";
  gateway: string | null;
  plan: MembershipPlan;
}

export function Checkout() {
  const { user, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planSlug = searchParams.get("plan") ?? "";
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: MembershipPlan[] }>("/api/plans")
      .then((data) => {
        const p = data.data.find((x) => x.slug === planSlug && x.status === "ACTIVE");
        setPlan(p ?? null);
      })
      .finally(() => setLoadingPlan(false));
  }, [planSlug]);

  async function handleConfirm() {
    if (!plan) return;
    setProcessing(true);
    setError(null);
    try {
      const checkout = await api<{ data: CheckoutResult }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id }),
      });
      await api(`/api/checkout/${checkout.data.orderId}/confirm`, { method: "POST" });
      await loadProfile();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erro ao processar o pagamento");
    } finally {
      setProcessing(false);
    }
  }

  if (loadingPlan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Plano não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O plano selecionado não está disponível.</p>
        <Link to="/planos" className="mt-4 inline-block">
          <Button variant="outline">Ver planos</Button>
        </Link>
      </div>
    );
  }

  const isPremium = plan.slug === "odontus-premium";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 dark:bg-primary-900 dark:text-primary-200">
          <Sparkles className="h-3 w-3" /> Finalizar assinatura
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          Confirme sua assinatura do plano{" "}
          <strong>{plan.slug === "odontus-premium" ? "Premium" : plan.name}</strong>.
        </p>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Resumo do pedido</span>
            {isPremium && (
              <Badge variant="gradientYellow" className="rounded-2xl">
                MAIS POPULAR
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-foreground">
                {plan.slug === "odontus-premium" ? "Plano Premium" : plan.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan.billing === "YEARLY" ? "Cobrança anual" : "Cobrança mensal"}
              </p>
              <ul className="mt-4 space-y-2">
                {Array.isArray(plan.benefits) &&
                  plan.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                      {String(b)}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-foreground">{formatPrice(plan.price)}</p>
              <p className="text-sm text-muted-foreground">
                / {plan.billing === "YEARLY" ? "ano" : "mês"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted p-4">
            <p className="text-sm font-semibold text-foreground">Cliente</p>
            <p className="mt-1 text-sm text-muted-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <Button
            variant={isPremium ? "premium" : "default"}
            size="lg"
            className="mt-6 w-full"
            disabled={processing}
            onClick={handleConfirm}
          >
            {processing ? "Processando..." : `Confirmar assinatura ${formatPrice(plan.price)}`}
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Pagamento seguro · O acesso é liberado imediatamente após a
            confirmação.
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Em breve você poderá pagar com Pix ou cartão de
            crédito.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}