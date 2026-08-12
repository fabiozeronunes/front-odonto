import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Specialty, Tag } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";

export function MyTaxonomy() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [specForm, setSpecForm] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [tagForm, setTagForm] = useState<{ id?: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        api<{ data: Specialty[] }>("/api/specialties/me"),
        api<{ data: Tag[] }>("/api/tags/me"),
      ]);
      setSpecialties(s.data);
      setTags(t.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSpecialty() {
    if (!specForm || !specForm.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (specForm.id) {
        await api(`/api/specialties/${specForm.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: specForm.name, description: specForm.description || undefined }),
        });
      } else {
        await api("/api/specialties", {
          method: "POST",
          body: JSON.stringify({ name: specForm.name, description: specForm.description || undefined }),
        });
      }
      setSpecForm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar especialidade");
    } finally {
      setSaving(false);
    }
  }

  async function saveTag() {
    if (!tagForm || !tagForm.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (tagForm.id) {
        await api(`/api/tags/${tagForm.id}`, { method: "PUT", body: JSON.stringify({ name: tagForm.name }) });
      } else {
        await api("/api/tags", { method: "POST", body: JSON.stringify({ name: tagForm.name }) });
      }
      setTagForm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar tag");
    } finally {
      setSaving(false);
    }
  }

  async function removeSpecialty(id: string) {
    if (!confirm("Excluir esta especialidade?")) return;
    await api(`/api/specialties/${id}`, { method: "DELETE" });
    load();
  }

  async function removeTag(id: string) {
    if (!confirm("Excluir esta tag?")) return;
    await api(`/api/tags/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Minhas especialidades</h2>
            <Button onClick={() => setSpecForm({ name: "", description: "" })}>
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>

          {specForm && (
            <Card className="mt-4 border-primary-200">
              <CardContent className="space-y-3 pt-6">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={specForm.name} onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={specForm.description} onChange={(e) => setSpecForm({ ...specForm, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setSpecForm(null)}>Cancelar</Button>
                  <Button onClick={saveSpecialty} disabled={saving || !specForm.name.trim()}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {loading ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400">Carregando...</li>
            ) : specialties.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma especialidade criada por você.</li>
            ) : (
              specialties.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{s.name}</p>
                    <p className="truncate text-xs text-slate-400">{s.description ?? "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSpecForm({ id: s.id, name: s.name, description: s.description ?? "" })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => removeSpecialty(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Minhas tags</h2>
            <Button onClick={() => setTagForm({ name: "" })}>
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>

          {tagForm && (
            <Card className="mt-4 border-primary-200">
              <CardContent className="space-y-3 pt-6">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setTagForm(null)}>Cancelar</Button>
                  <Button onClick={saveTag} disabled={saving || !tagForm.name.trim()}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {loading ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400">Carregando...</li>
            ) : tags.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma tag criada por você.</li>
            ) : (
              tags.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <p className="font-medium text-slate-800">#{t.name}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setTagForm({ id: t.id, name: t.name })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => removeTag(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}