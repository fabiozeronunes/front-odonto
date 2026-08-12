import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { CaseStudy, Paginated, Specialty, Tag } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { ImagePicker } from "../../components/ImagePicker";

interface CaseFormState {
  id?: string;
  title: string;
  description: string;
  diagnosis: string;
  specialtyId: string;
  difficulty: string;
  isFree: boolean;
  status: string;
  author: string;
  institution: string;
  observations: string;
  tagIds: string[];
  imageUrls: string[];
}

const emptyForm: CaseFormState = {
  title: "",
  description: "",
  diagnosis: "",
  specialtyId: "",
  difficulty: "BASICO",
  isFree: true,
  status: "DRAFT",
  author: "",
  institution: "",
  observations: "",
  tagIds: [],
  imageUrls: [],
};

export function MyCases() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [c, s, t] = await Promise.all([
        api<Paginated<CaseStudy>>("/api/case-studies/me?perPage=50"),
        api<{ data: Specialty[] }>("/api/specialties"),
        api<{ data: Tag[] }>("/api/tags"),
      ]);
      setCases(c.data);
      setSpecialties(s.data);
      setTags(t.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ ...emptyForm });
    setError(null);
  }

  function startEdit(c: CaseStudy) {
    setEditing({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      diagnosis: c.diagnosis ?? "",
      specialtyId: c.specialty?.id ?? "",
      difficulty: c.difficulty,
      isFree: c.isFree,
      status: c.status,
      author: c.author ?? "",
      institution: c.institution ?? "",
      observations: c.observations ?? "",
      tagIds: c.tags.map((t) => t.tag.id),
      imageUrls: c.images?.map((i) => i.url) ?? [],
    });
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const body = {
      title: editing.title,
      description: editing.description || undefined,
      diagnosis: editing.diagnosis || undefined,
      specialtyId: editing.specialtyId || null,
      difficulty: editing.difficulty,
      isFree: editing.isFree,
      status: editing.status,
      author: editing.author || undefined,
      institution: editing.institution || undefined,
      observations: editing.observations || undefined,
      tagIds: editing.tagIds,
      imageUrls: editing.imageUrls,
    };
    try {
      if (editing.id) {
        await api(`/api/case-studies/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/case-studies", { method: "POST", body: JSON.stringify(body) });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este estudo de caso?")) return;
    await api(`/api/case-studies/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: CaseStudy) {
    await api(`/api/case-studies/${c.id}/${c.status === "PUBLISHED" ? "unpublish" : "publish"}`, {
      method: "POST",
    });
    load();
  }

  function toggleTag(id: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      tagIds: editing.tagIds.includes(id)
        ? editing.tagIds.filter((t) => t !== id)
        : [...editing.tagIds, id],
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Meus estudos de caso</h2>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" /> Novo caso
        </Button>
      </div>

      {editing && (
        <Card className="mt-5 border-primary-200">
          <CardContent className="space-y-4 pt-6">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={editing.specialtyId} onChange={(e) => setEditing({ ...editing, specialtyId: e.target.value })}>
                  <option value="">Sem especialidade</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de dificuldade</Label>
                <Select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}>
                  <option value="BASICO">Básico</option>
                  <option value="INTERMEDIARIO">Intermediário</option>
                  <option value="AVANCADO">Avançado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Arquivado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autor</Label>
                <Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Diagnóstico / Evolução</Label>
              <Textarea value={editing.diagnosis} onChange={(e) => setEditing({ ...editing, diagnosis: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Observações pessoais</Label>
              <Textarea value={editing.observations} onChange={(e) => setEditing({ ...editing, observations: e.target.value })} rows={3} placeholder="Anotações privadas sobre este caso..." />
            </div>

            <ImagePicker value={editing.imageUrls} onChange={(urls) => setEditing({ ...editing, imageUrls: urls })} label="Galeria de imagens (upload ou link)" />

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.isFree} onChange={(e) => setEditing({ ...editing, isFree: e.target.checked })} />
                Conteúdo gratuito
              </label>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      editing.tagIds.includes(tag.id)
                        ? "bg-primary-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !editing.title}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Título</th>
                  <th className="px-5 py-3">Especialidade</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Carregando...</td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Nenhum estudo de caso cadastrado ainda.</td></tr>
                ) : (
                  cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="max-w-[280px] px-5 py-3">
                        <p className="truncate font-medium text-slate-800">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.author ?? "—"} {c.observations ? "• com observações" : ""}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{c.specialty?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge variant={c.status === "PUBLISHED" ? "default" : "outline"}>{c.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => togglePublish(c)} title={c.status === "PUBLISHED" ? "Despublicar" : "Publicar"}>
                            {c.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="text-red-600" title="Excluir">
                            <Trash2 className="h-4 w-4" />
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