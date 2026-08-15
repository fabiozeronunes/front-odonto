import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Video,
  Stethoscope,
  ClipboardList,
  Tags as TagsIcon,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import { api } from "../../lib/api";
import type { DashboardMetrics } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { PieChart } from "../../components/ui/pie-chart";
import { formatDate, formatPrice } from "../../lib/utils";
import { InfoPopover } from "../../components/ui/info-popover";

interface PlanSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  count: number;
  paidCount: number;
  overdueCount: number;
  paidTotal: number;
}

const PLAN_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PlanSummary[]>([]);

  useEffect(() => {
    api<{ data: DashboardMetrics }>("/api/admin/dashboard")
      .then((d) => setMetrics(d.data))
      .finally(() => setLoading(false));
    api<{ data: { plans: PlanSummary[] } }>("/api/admin/users/summary")
      .then((d) => setSummary(d.data.plans))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (!metrics) return <p className="text-slate-500">Erro ao carregar métricas.</p>;

  const cards = [
    { label: "Usuários", value: metrics.users.total, sub: `${metrics.users.free} grátis · ${metrics.users.premium} premium`, icon: Users },
    { label: "Assinaturas ativas", value: metrics.subscriptions.active, sub: "status ativo", icon: UserCheck },
    { label: "Vídeos", value: metrics.content.videos, sub: `${metrics.content.publishedVideos} publicados`, icon: Video },
    { label: "Especialidades", value: metrics.content.specialties, sub: "cadastradas", icon: Stethoscope },
    { label: "Estudos de caso", value: metrics.content.caseStudies, sub: "casos clínicos", icon: ClipboardList },
    { label: "Tags", value: metrics.content.tags, sub: "tags ativas", icon: TagsIcon },
    { label: "Produtos", value: metrics.shopping.products, sub: "no Shopping", icon: ShoppingBag },
    { label: "Pedidos", value: metrics.shopping.orders, sub: "registrados", icon: ShoppingBag },
  ];

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        Dashboard
        <InfoPopover
          text="Visão geral do negócio: total de alunos, planos ativos, receita estimada, vendas do Shop Odontus e os vídeos mais acessados."
        />
      </h1>
      <p className="mt-1 text-sm text-slate-500">Visão geral da plataforma</p>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Resumo de receita por plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <div className="shrink-0">
              <PieChart
                size={160}
                slices={summary.map((p, i) => ({
                  label: p.name,
                  value: p.paidTotal,
                  color: PLAN_COLORS[i % PLAN_COLORS.length],
                }))}
              />
            </div>
            <div className="w-full">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.map((p, i) => (
                  <div key={p.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                        />
                        {p.name}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{formatPrice(p.price)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{p.count} usuário(s)</span>
                      <span className="text-emerald-600">{p.paidCount} pago(s)</span>
                      {p.overdueCount > 0 && <span className="text-red-500">{p.overdueCount} em atraso</span>}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-700">
                      Total pago: {formatPrice(p.paidTotal)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-600">
                  Total recebido:{" "}
                  <span className="font-semibold text-emerald-700">
                    {formatPrice(summary.reduce((acc, p) => acc + p.paidTotal, 0))}
                  </span>
                </span>
                <span className="text-slate-600">
                  Pagos:{" "}
                  <span className="font-semibold text-slate-800">
                    {summary.reduce((acc, p) => acc + p.paidCount, 0)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <card.icon className="h-5 w-5 text-primary-600" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-400">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vídeos mais acessados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {metrics.topVideos.map((v, i) => (
                <li key={v.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                    <Link
                      to={`/video/${v.slug}`}
                      className="text-sm font-medium text-slate-700 hover:text-primary-800"
                    >
                      {v.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.isFree ? "free" : "premium"}>
                      {v.isFree ? "FREE" : "PREMIUM"}
                    </Badge>
                    <span className="text-xs text-slate-400">{v.viewCount} views</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novos usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {metrics.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>
                    {u.role}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              Registrados até {formatDate(new Date())}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
