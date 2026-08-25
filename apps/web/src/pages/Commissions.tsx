import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HandCoins,
  Sparkles,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Lock,
  BadgeCheck,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BackButton } from "../components/BackButton";
import { Button } from "../components/ui/button";
import { formatDate, formatPrice } from "../lib/utils";

interface Commission {
  id: string;
  amount: number;
  percent: number;
  planName: string | null;
  productName: string | null;
  status: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
  paidAt: string | null;
  referred: { id: string; name: string; email: string };
}

interface Summary {
  id: string;
  name: string;
  affiliateCode: string | null;
  commissionRate: number;
  productCommissionRate: number;
  totals: {
    plansPending: number;
    productsPending: number;
    paid: number;
    pending: number;
  };
  plans: Commission[];
  products: Commission[];
}

function statusBadge(status: Commission["status"]) {
  if (status === "PAID") return <Badge variant="free">PAGO</Badge>;
  if (status === "CANCELED") return <Badge variant="outline">CANCELADO</Badge>;
  return <Badge variant="info">PENDENTE</Badge>;
}

function CommissionTable({ title, items, accent }: { title: string; items: Commission[]; accent: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Nenhuma comissão registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2">Aluno</th>
                  <th className="px-4 py-2">Referente a</th>
                  <th className={`px-4 py-2 ${accent}`}>Valor</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Criada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2">
                      <p className="font-medium text-foreground">{c.referred.name}</p>
                      <p className="text-xs text-muted-foreground">{c.referred.email}</p>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {c.productName ?? c.planName ?? "—"}
                    </td>
                    <td className={`px-4 py-2 font-semibold ${accent}`}>
                      {formatPrice(c.amount)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">({c.percent}%)</span>
                    </td>
                    <td className="px-4 py-2">{statusBadge(c.status)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Commissions() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.isAffiliate) {
      setLoading(false);
      return;
    }
    api<{ data: Summary }>("/api/affiliates/me")
      .then((d) => setSummary(d.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user?.isAffiliate]);

  if (!user?.isAffiliate) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Comissões</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Este recurso é exclusivo para afiliados cadastrados. Fale com a equipe para se tornar um afiliado.
          </p>
          <Link to="/dashboard" className="mt-6">
            <Button variant="outline">Voltar ao painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <BackButton to="/dashboard" />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas comissões</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as comissões geradas por indicações de planos e produtos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="premium">
            <BadgeCheck className="h-3 w-3" /> Afiliado
          </Badge>
          <span className="text-sm text-muted-foreground">
            Código: <span className="font-mono text-foreground">{summary?.affiliateCode ?? "—"}</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : error || !summary ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground">Não foi possível carregar suas comissões.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary-700" /> A receber (planos)
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  {formatPrice(summary.totals.plansPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Comissão de indicação: {summary.commissionRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingBag className="h-4 w-4 text-primary-700" /> A receber (produtos)
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  {formatPrice(summary.totals.productsPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Comissão de produtos: {summary.productCommissionRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> Total a receber
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-emerald-700">
                  {formatPrice(summary.totals.pending)}
                </p>
                <p className="text-xs text-muted-foreground">Planos + produtos pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4 text-amber-600" /> Já recebido
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-amber-600">
                  {formatPrice(summary.totals.paid)}
                </p>
                <p className="text-xs text-muted-foreground">Comissões pagas</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <CommissionTable
              title="Comissões de planos"
              items={summary.plans}
              accent="text-primary-700"
            />
            <CommissionTable
              title="Comissões de produtos"
              items={summary.products}
              accent="text-emerald-700"
            />
          </div>

          <div className="mt-8 rounded-2xl border border-primary-200 bg-primary-50 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-800">
              <HandCoins className="h-4 w-4" /> Como funciona
            </p>
            <p className="mt-1 text-sm text-primary-700">
              Você recebe {summary.commissionRate}% sobre planos (mensal/anual) e{" "}
              {summary.productCommissionRate}% sobre compras de produtos no Shop Odontus feitas por alunos
              cadastrados com seu link de indicação. As comissões pendentes são marcadas como pagas pela
              equipe.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
