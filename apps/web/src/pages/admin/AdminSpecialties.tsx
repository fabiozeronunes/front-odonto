import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Specialty } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function AdminSpecialties() {
  const [items, setItems] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await api<{ data: Specialty[] }>("/api/specialties?all=true");
    setItems(data.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api(`/api/specialties/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(editing),
        });
      } else {
        await api("/api/specialties", { method: "POST", body: JSON.stringify(editing) });
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta especialidade?")) return;
    await api(`/api/specialties/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Especialidades</h1>
          <p className="mt-1 text-sm text-slate-500">Categorias de conteúdo</p>
        </div>
        <Button onClick={() => setEditing({ name: "", description: "" })}>
          <Plus className="h-4 w-4" /> Nova especialidade
        </Button>
      </div>

      {editing && (
        <Card className="mt-6 border-primary-200">
          <CardHeader><CardTitle>{editing.id ? "Editar" : "Nova especialidade"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Descrição</label>
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !editing.name}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Lista</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-8 text-center text-slate-400">Carregando...</p>
            ) : (
              items.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s._count?.videos ?? 0} vídeos</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing({ id: s.id, name: s.name, description: s.description ?? "" })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
