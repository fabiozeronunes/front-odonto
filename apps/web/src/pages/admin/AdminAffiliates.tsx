import { useEffect, useState } from "react";
import {
  Search,
  Link2,
  DollarSign,
  Users as UsersIcon,
  UserPlus,
  HandCoins,
  Copy,
  Check,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Select } from "../../components/ui/select";
import { InfoPopover } from "../../components/ui/info-popover";
import { formatDate, formatPrice, cn } from "../../lib/utils";
import { confirmAction } from "../../components/Confirm";
import { toast } from "../../components/Toast";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  affiliateCode: string | null;
  commissionRate: number;
  productCommissionRate: number;
  createdAt: string;
  referredCount: number;
  paidCommissions: number;
  pendingCommissions: number;
}

interface AffiliateDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  affiliateCode: string | null;
  commissionRate: number;
  productCommissionRate: number;
  createdAt: string;
  referrals: { id: string; name: string; email: string; createdAt: string; plan?: { name: string } | null }[];
  commissions: {
    id: string;
    amount: number;
    percent: number;
    source: string;
    planName: string | null;
    productName: string | null;
    status: "PENDING" | "PAID" | "CANCELED";
    createdAt: string;
    paidAt: string | null;
    referred: { id: string; name: string; email: string };
  }[];
  totals: { paid: number; pending: number };
}

const WEB_URL = import.meta.env.VITE_APP_URL ?? "https://front-odonto-web.vercel.app";

function statusBadge(status: "PENDING" | "PAID" | "CANCELED") {
  if (status === "PAID") return <Badge variant="free">PAGO</Badge>;
  if (status === "CANCELED") return <Badge variant="outline">CANCELADO</Badge>;
  return <Badge variant="info">PENDENTE</Badge>;
}

export function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AffiliateDetail | null>(null);
  const [referredUserId, setReferredUserId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [rateDrafts, setRateDrafts] = useState<Record<string, { referral: string; product: string }>>({});
  const [tab, setTab] = useState<"active" | "suspended">("active");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ perPage: "50" });
    if (search) params.set("search", search);
    if (tab === "suspended") params.set("suspended", "true");
    const data = await api<Paginated<Affiliate>>(`/api/affiliates?${params.toString()}`);
    setAffiliates(data.data);
    setTotal(data.pagination.total);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [search, tab]);

  async function loadDetail(id: string) {
    const d = await api<{ data: AffiliateDetail }>(`/api/affiliates/${id}`);
    setSelected(d.data);
  }

  async function openDetail(a: Affiliate) {
    setSelected(null);
    setReferredUserId("");
    setPaymentAmount("");
    await loadDetail(a.id);
  }

  async function toggleAffiliate(a: Affiliate) {
    setBusy(a.id);
    try {
      if (tab === "suspended") {
        await api(`/api/affiliates/${a.id}/enable`, {
          method: "PUT",
          body: JSON.stringify({}),
        });
      } else {
        await api(`/api/affiliates/${a.id}/disable`, { method: "PUT" });
      }
      await load();
      if (selected?.id === a.id) await loadDetail(a.id);
    } finally {
      setBusy(null);
    }
  }

  async function setRate(a: Affiliate, rate: number, productRate?: number) {
    setBusy(a.id);
    try {
      await api(`/api/affiliates/${a.id}/rate`, {
        method: "PUT",
        body: JSON.stringify({
          commissionRate: rate,
          ...(productRate != null ? { productCommissionRate: productRate } : {}),
        }),
      });
      await load();
      if (selected?.id === a.id) await loadDetail(a.id);
    } finally {
      setBusy(null);
    }
  }

  function rateDraftFor(a: Affiliate) {
    return (
      rateDrafts[a.id] ?? {
        referral: String(a.commissionRate),
        product: String(a.productCommissionRate ?? 0),
      }
    );
  }

  function updateRateDraft(a: Affiliate, key: "referral" | "product", value: string) {
    setRateDrafts((prev) => {
      const current = prev[a.id] ?? { referral: String(a.commissionRate), product: String(a.productCommissionRate ?? 0) };
      return { ...prev, [a.id]: { ...current, [key]: value } };
    });
  }

  async function saveRates(a: Affiliate) {
    const draft = rateDraftFor(a);
    await setRate(a, Number(draft.referral) || 0, Number(draft.product) || 0);
  }

  async function registerPayment() {
    if (!selected || !referredUserId) return;
    setBusy("payment");
    try {
      await api(`/api/affiliates/${selected.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          referredUserId,
          amount: Number(paymentAmount) || 0,
        }),
      });
      setNotice("Comissão registrada para o aluno indicado.");
      setPaymentAmount("");
      setReferredUserId("");
      setTimeout(() => setNotice(null), 3000);
      await loadDetail(selected.id);
    } finally {
      setBusy(null);
    }
  }

  async function markPaid(commissionId: string) {
    if (!(await confirmAction("Marcar esta comissão como paga?"))) return;
    setBusy(commissionId);
    try {
      await api(`/api/affiliates/commissions/${commissionId}/pay`, { method: "POST" });
      if (selected) await loadDetail(selected.id);
      await load();
      toast.success("Comissão marcada como paga");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao marcar comissão como paga");
    } finally {
      setBusy(null);
    }
  }

  async function cancelCommission(commissionId: string) {
    if (!(await confirmAction("Cancelar esta comissão?"))) return;
    setBusy(commissionId);
    try {
      await api(`/api/affiliates/commissions/${commissionId}/cancel`, { method: "POST" });
      if (selected) await loadDetail(selected.id);
      await load();
      toast.success("Comissão cancelada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cancelar comissão");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink(code: string) {
    const link = `${WEB_URL}/cadastro?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        Afiliados
        <InfoPopover
          title="Como funciona"
          text="Cadastre um afiliado e ele recebe um link de indicação. Quando um aluno se cadastra pelo link e assina um plano ou compra produto no site, o sistema computa a comissão automaticamente. Aqui você define as taxas (aluno e produtos) e marca os valores como pagos quando repassar ao afiliado."
        />
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Professores e parceiros que indicam alunos e recebem comissão.
      </p>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["active", "Ativos"],
            ["suspended", "Suspensos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key
                ? "bg-primary-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar afiliado por nome, e-mail ou código..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Afiliados ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Afiliado</th>
                  <th className="px-5 py-3">Código / Link</th>
                  <th className="px-5 py-3">Comissão</th>
                  <th className="px-5 py-3">Indicados</th>
                  <th className="px-5 py-3">Total pago</th>
                  <th className="px-5 py-3">Pendente</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Carregando...</td>
                  </tr>
                ) : affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      {tab === "suspended"
                        ? "Nenhum afiliado suspenso. Ao desativar um afiliado, ele fica suspenso e pode ser reativado aqui."
                        : "Nenhum afiliado ainda. Torne um usuário afiliado na aba Usuários."}
                    </td>
                  </tr>
                ) : (
                  affiliates.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{a.name}</p>
                        <p className="text-xs text-slate-400">{a.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        {a.affiliateCode ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs text-slate-600">{a.affiliateCode}</span>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copyLink(a.affiliateCode!)}>
                              {copied === a.affiliateCode ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              {copied === a.affiliateCode ? "Copiado!" : "Copiar link"}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Input
                              className="h-7 w-16"
                              type="number"
                              min="0"
                              max="100"
                              value={rateDraftFor(a).referral}
                              disabled={busy === a.id}
                              title="Comissão de indicação de aluno (%)"
                              onChange={(e) => updateRateDraft(a, "referral", e.target.value)}
                            />
                            <span className="text-[10px] leading-tight text-slate-400">% aluno</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              className="h-7 w-16"
                              type="number"
                              min="0"
                              max="100"
                              value={rateDraftFor(a).product}
                              disabled={busy === a.id}
                              title="Comissão de produtos do site (%)"
                              onChange={(e) => updateRateDraft(a, "product", e.target.value)}
                            />
                            <span className="text-[10px] leading-tight text-slate-400">% produtos</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-fit px-2 text-xs"
                            disabled={busy === a.id}
                            onClick={() => saveRates(a)}
                          >
                            Salvar
                          </Button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-slate-700">{a.referredCount}</span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-emerald-700">
                        {formatPrice(a.paidCommissions)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-amber-600">
                        {formatPrice(a.pendingCommissions)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDetail(a)}>
                            Ver detalhes
                          </Button>
                          <Button
                            variant={tab === "suspended" ? "outline" : "ghost"}
                            size="sm"
                            disabled={busy === a.id}
                            onClick={() => toggleAffiliate(a)}
                          >
                            {tab === "suspended" ? "Reativar" : "Desativar"}
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

      {selected && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selected.name} — link de indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary-600" />
                <a
                  href={`${WEB_URL}/cadastro?ref=${selected.affiliateCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-sm text-primary-700 underline"
                >
                  {WEB_URL}/cadastro?ref={selected.affiliateCode}
                </a>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <UsersIcon className="mr-1 h-3 w-3" /> {selected.referrals.length} indicados
                </Badge>
                <Badge variant="free">
                  <DollarSign className="mr-1 h-3 w-3" /> Pago: {formatPrice(selected.totals.paid)}
                </Badge>
                <Badge variant="info">
                  <DollarSign className="mr-1 h-3 w-3" /> Pendente: {formatPrice(selected.totals.pending)}
                </Badge>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <HandCoins className="h-4 w-4 text-emerald-600" /> Registrar pagamento de um aluno indicado
              </h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1 block text-xs text-slate-500">Aluno indicado</label>
                  <Select value={referredUserId} onChange={(e) => setReferredUserId(e.target.value)}>
                    <option value="">Selecionar aluno</option>
                    {selected.referrals.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.email})
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Valor pago (R$)</label>
                  <Input
                    className="w-32"
                    type="number"
                    min="0"
                    placeholder="49.90"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <Button disabled={busy === "payment" || !referredUserId} onClick={registerPayment}>
                  <UserPlus className="h-4 w-4" /> Registrar pagamento
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                A comissão ({selected.commissionRate}%) é calculada automaticamente sobre o valor informado.
              </p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-700">Comissões</h3>
              {selected.commissions.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma comissão registrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Aluno</th>
                        <th className="px-4 py-2">Origem</th>
                        <th className="px-4 py-2">Comissão</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Criada em</th>
                        <th className="px-4 py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.commissions.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2">
                            <p className="font-medium text-slate-700">{c.referred.name}</p>
                            <p className="text-xs text-slate-400">{c.referred.email}</p>
                          </td>
                          <td className="px-4 py-2">
                            <p className="text-xs font-medium text-slate-700">
                              {c.source === "PRODUCT"
                                ? "Produtos"
                                : c.source === "PLAN"
                                  ? "Plano"
                                  : "Manual"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {c.productName ?? c.planName ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-2 font-semibold text-slate-800">
                            {formatPrice(c.amount)}
                            <span className="ml-1 text-xs font-normal text-slate-400">({c.percent}%)</span>
                          </td>
                          <td className="px-4 py-2">{statusBadge(c.status)}</td>
                          <td className="px-4 py-2 text-slate-500">{formatDate(c.createdAt)}</td>
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-1">
                              {c.status === "PENDING" && (
                                <>
                                  <Button variant="outline" size="sm" disabled={busy === c.id} onClick={() => markPaid(c.id)}>
                                    Marcar paga
                                  </Button>
                                  <Button variant="ghost" size="sm" disabled={busy === c.id} onClick={() => cancelCommission(c.id)}>
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}