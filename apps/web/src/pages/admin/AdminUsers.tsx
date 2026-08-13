import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, MembershipPlan, User } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { formatDate } from "../../lib/utils";

type StatusFilter = "" | "pagos" | "atraso" | "gratuito";

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: MembershipPlan[] }>("/api/plans")
      .then((d) => setPlans(d.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "15" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    api<Paginated<User>>(`/api/admin/users?${params.toString()}`)
      .then((d) => {
        setUsers(d.data);
        setTotal(d.pagination.total);
      })
      .finally(() => setLoading(false));
  }, [page, search, status]);

  async function toggleActive(id: string, isActive: boolean) {
    await api(`/api/admin/users/${id}/${isActive ? "deactivate" : "activate"}`, { method: "POST" });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)));
  }

  async function changePlan(id: string, planId: string) {
    if (!planId) return;
    setBusy(id);
    try {
      await api(`/api/admin/users/${id}/plan`, {
        method: "PUT",
        body: JSON.stringify({ planId }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, plan: plans.find((p) => p.id === planId) as MembershipPlan } : u
        )
      );
    } finally {
      setBusy(null);
    }
  }

  async function savePhone(id: string, phone: string) {
    setBusy(id);
    try {
      await api(`/api/admin/users/${id}/contact`, {
        method: "PUT",
        body: JSON.stringify({ phone }),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, phone } : u)));
      setNotice("Telefone atualizado.");
      setTimeout(() => setNotice(null), 2500);
    } finally {
      setBusy(null);
    }
  }

  async function notifyWhatsApp(user: User) {
    if (!confirm(`Enviar aviso de atraso por WhatsApp para ${user.name}?`)) return;
    setBusy(user.id);
    try {
      const res = await api<{ data: { sent: boolean; fallbackLink?: string | null; message?: string; error?: string } }>(
        `/api/admin/users/${user.id}/whatsapp`,
        { method: "POST" }
      );
      if (res.data.sent) {
        setNotice("Mensagem enviada com sucesso pelo WhatsApp.");
      } else if (res.data.fallbackLink) {
        setNotice("API não configurada. Abrindo link do WhatsApp...");
        window.open(res.data.fallbackLink, "_blank");
      } else {
        setNotice(res.data.error ?? "Não foi possível enviar o aviso.");
      }
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setBusy(null);
    }
  }

  function paymentBadge(status?: User["paymentStatus"]) {
    switch (status) {
      case "PAGO":
        return <Badge variant="free">PAGO</Badge>;
      case "EM_ATRASO":
        return <Badge variant="danger">EM ATRASO</Badge>;
      default:
        return <Badge variant="outline">GRATUITO</Badge>;
    }
  }

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "", label: "Todos" },
    { value: "pagos", label: "Pagos" },
    { value: "atraso", label: "Em atraso" },
    { value: "gratuito", label: "Gratuitos" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
      <p className="mt-1 text-sm text-slate-500">{total} no extrato atual</p>

      {notice && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === t.value ? "bg-primary-700 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista de usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Telefone</th>
                  <th className="px-5 py-3">Plano / Acesso</th>
                  <th className="px-5 py-3">Status pagamento</th>
                  <th className="px-5 py-3">Perfil</th>
                  <th className="px-5 py-3">Criado em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">Carregando...</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-5 py-3 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <Input
                            defaultValue={u.phone ?? ""}
                            placeholder="(11) 99999-9999"
                            className="h-8 w-40"
                            onBlur={(e) => {
                              if (e.target.value !== (u.phone ?? "")) savePhone(u.id, e.target.value);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Select
                          className="h-8 w-36"
                          value={u.plan?.id ?? ""}
                          disabled={busy === u.id}
                          onChange={(e) => changePlan(u.id, e.target.value)}
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          {paymentBadge(u.paymentStatus)}
                          {u.lastPaymentAt && (
                            <span className="text-[11px] text-slate-400">
                              pago em {formatDate(u.lastPaymentAt)}
                            </span>
                          )}
                          {u.expiresAt && (
                            <span className="text-[11px] text-red-500">
                              expira em {formatDate(u.expiresAt)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>{u.role}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy === u.id}
                            onClick={() => notifyWhatsApp(u)}
                            title="Aviso de atraso por WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant={u.isActive ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => toggleActive(u.id, u.isActive ?? true)}
                          >
                            {u.isActive === false ? "Ativar" : "Desativar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
