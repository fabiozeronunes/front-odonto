import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Crown,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { api } from "../lib/api";
import { formatDate, formatPrice } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface FinanceData {
  subscriptions: {
    id: string;
    status: "ACTIVE" | "PENDING" | "CANCELED" | "EXPIRED";
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
    plan: { id: string; name: string; slug: string; price: number; billing: "MONTHLY" | "YEARLY" };
  }[];
  orders: {
    id: string;
    status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";
    subtotal: number;
    discount: number;
    total: number;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      product: { id: string; name: string; slug: string };
    }[];
  }[];
}

function planStatusBadge(status: FinanceData["subscriptions"][0]["status"]) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="free">
          <CheckCircle2 className="h-3 w-3" /> ATIVO
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="info">
          <Clock className="h-3 w-3" /> AGUARDANDO PAGAMENTO
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="danger">
          <AlertCircle className="h-3 w-3" /> VENCIDO
        </Badge>
      );
    default:
      return <Badge variant="outline">CANCELADO</Badge>;
  }
}

function orderStatusBadge(status: FinanceData["orders"][0]["status"]) {
  switch (status) {
    case "PAID":
    case "DELIVERED":
      return (
        <Badge variant="free">
          <CheckCircle2 className="h-3 w-3" /> PAGO
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="info">
          <Clock className="h-3 w-3" /> AGUARDANDO PAGAMENTO
        </Badge>
      );
    default:
      return <Badge variant="danger">CANCELADO</Badge>;
  }
}

export function Financeiro() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: FinanceData }>("/api/checkout/me")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-72 rounded-lg bg-muted" />
          <div className="h-44 rounded-2xl bg-muted" />
          <div className="h-44 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const activeSub = data?.subscriptions.find((s) => s.status === "ACTIVE");
  const planOrders = (data?.orders ?? []).filter((o) => o.items.length === 0);
  const shopOrders = (data?.orders ?? []).filter((o) => o.items.length > 0);

  const pendingTotal = (data?.orders ?? [])
    .filter((o) => o.status === "PENDING")
    .reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
        <Wallet className="h-7 w-7 text-primary-700" /> Dados financeiros
      </h1>
      <p className="mt-1 text-muted-foreground">
        Acompanhe seus pagamentos de assinatura e o extrato de compras na Shop Odontus.
      </p>

      {pendingTotal > 0 && (
        <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-amber-900">Você tem pagamentos em aberto</p>
            <p className="text-sm text-amber-700">
              Total pendente: {formatPrice(pendingTotal)}. Finalize para liberar seu acesso.
            </p>
          </div>
          <Link to="/planos">
            <Button variant="outline" className="shrink-0">
              Quitar pendências <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-primary-700" /> Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSub ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{activeSub.plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {activeSub.plan.billing === "YEARLY" ? "Cobrança anual" : "Cobrança mensal"}
                    </p>
                  </div>
                  {planStatusBadge(activeSub.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {activeSub.startsAt ? `Início: ${formatDate(activeSub.startsAt)}` : "Início pendente"}
                  {activeSub.endsAt && <> · Expira: {formatDate(activeSub.endsAt)}</>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  Você ainda não possui uma assinatura ativa.
                </p>
                <Link to="/planos">
                  <Button variant="premium" size="sm">
                    Escolher um plano
                  </Button>
                </Link>
              </div>
            )}

            {(data?.subscriptions ?? []).length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Histórico de assinaturas
                </p>
                <div className="mt-2 space-y-2">
                  {(data?.subscriptions ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">{s.plan.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {s.createdAt ? formatDate(s.createdAt) : ""}
                        </span>
                        {planStatusBadge(s.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4 text-primary-700" /> Extrato Shop Odontus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shopOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não fez compras na Shop Odontus.
              </p>
            ) : (
              <div className="space-y-3">
                {shopOrders.map((o) => (
                  <div key={o.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Pedido #{o.id.slice(0, 8).toUpperCase()}
                      </p>
                      {orderStatusBadge(o.status)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </p>
                    <div className="mt-2 space-y-1">
                      {o.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>
                            {item.product.name} <span className="text-xs">× {item.quantity}</span>
                          </span>
                          <span className="font-medium text-foreground">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold text-foreground">{formatPrice(o.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {planOrders.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary-700" /> Pagamentos da assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    Mensalidade #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                  <span className="font-semibold text-foreground">{formatPrice(o.total)}</span>
                  {orderStatusBadge(o.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}