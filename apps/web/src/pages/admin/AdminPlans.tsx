import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { MembershipPlan } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { formatPrice } from "../../lib/utils";

interface PlanForm {
  id?: string;
  name: string;
  description: string;
  price: string;
  billing: string;
  benefitsText: string;
  status: string;
}

export function AdminPlans() {
  const [items, setItems] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlanForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await api<{ data: MembershipPlan[] }>("/api/plans");
    setItems(data.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    const body = {
      name: editing.name,
      description: editing.description || undefined,
      price: Number(editing.price) || 0,
      billing: editing.billing,
      status: editing.status,
      benefits: editing.benefitsText
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
    };
    try {
      if (editing.id) {
        await api(`/api/plans/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/plans", { method: "POST", body: JSON.stringify(body) });
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este plano?")) return;
    await api(`/api/plans/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(plan: MembershipPlan) {
    setEditing({
      id: plan.id,
      name: plan.name,
      description: plan.description ?? "",
      price: String(Number(plan.price) || 0),
      billing: plan.billing,
      benefitsText: Array.isArray(plan.benefits) ? plan.benefits.join("\n") : "",
      status: plan.status,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planos</h1>
          <p className="mt-1 text-sm text-slate-500">Planos de assinatura de membros</p>
        </div>
        <Button onClick={() => setEditing({ name: "", description: "", price: "0", billing: "MONTHLY", benefitsText: "", status: "ACTIVE" })}>
          <Plus className="h-4 w-4" /> Novo plano
        </Button>
      </div>

      {editing && (
        <Card className="mt-6 border-primary-200">
          <CardHeader><CardTitle>{editing.id ? "Editar plano" : "Novo plano"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nome *</label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Preço</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Periodicidade</label>
                <Select
                  value={editing.billing}
                  onChange={(e) => setEditing({ ...editing, billing: e.target.value })}
                >
                  <option value="MONTHLY">Mensal</option>
                  <option value="YEARLY">Anual</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Descrição</label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Benefícios (um por linha)</label>
              <Textarea rows={5} value={editing.benefitsText} onChange={(e) => setEditing({ ...editing, benefitsText: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !editing.name}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-slate-400">Carregando...</p>
        ) : (
          items.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant={p.status === "ACTIVE" ? "default" : "outline"}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold text-slate-900">
                  {formatPrice(p.price)}
                  <span className="text-sm font-normal text-slate-400"> / {p.billing === "MONTHLY" ? "mês" : "ano"}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">{p._count?.users ?? 0} usuários</p>
                <div className="mt-3 flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                    <Pencil className="h-3 w-3" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-red-600">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
