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
import { formatDate } from "../../lib/utils";

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: DashboardMetrics }>("/api/admin/dashboard")
      .then((d) => setMetrics(d.data))
      .finally(() => setLoading(false));
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
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Visão geral da plataforma</p>

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
