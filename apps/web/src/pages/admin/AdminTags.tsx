import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Tag } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { InfoPopover } from "../../components/ui/info-popover";

export function AdminTags() {
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await api<{ data: Tag[] }>("/api/tags?all=true");
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
        await api(`/api/tags/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) });
      } else {
        await api("/api/tags", { method: "POST", body: JSON.stringify(editing) });
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta tag?")) return;
    await api(`/api/tags/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            Tags
            <InfoPopover
              title="Como usar"
              text="Palavras-chave que tornam os conteúdos encontráveis. Ao cadastrar um vídeo ou caso, você pode marcar várias tags. Os alunos usam as tags na busca e na página de tags para filtrar por assunto."
            />
          </h1>
          <p className="mt-1 text-sm text-slate-500">Etiquetas de conteúdo pesquisáveis</p>
        </div>
        <Button onClick={() => setEditing({ name: "" })}>
          <Plus className="h-4 w-4" /> Nova tag
        </Button>
      </div>

      {editing && (
        <Card className="mt-6 border-primary-200">
          <CardHeader><CardTitle>{editing.id ? "Editar tag" : "Nova tag"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
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
              items.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">#{t.name}</p>
                    <p className="text-xs text-slate-400">
                      {t._count?.videos ?? 0} vídeos · {t._count?.caseStudies ?? 0} casos
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing({ id: t.id, name: t.name })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(t.id)} className="text-red-600">
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
