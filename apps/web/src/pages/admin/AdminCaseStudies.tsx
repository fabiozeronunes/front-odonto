import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, Tag, CaseStudy } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ImagePicker } from "../../components/ImagePicker";
import { InfoPopover } from "../../components/ui/info-popover";
import { confirmAction } from "../../components/Confirm";

interface CaseForm {
  id?: string;
  title: string;
  description: string;
  diagnosis: string;
  specialtyId: string;
  difficulty: string;
  isFree: boolean;
  status: string;
  videoIds: string[];
  imageUrls: string[];
  tagIds: string[];
}

const emptyForm: CaseForm = {
  title: "",
  description: "",
  diagnosis: "",
  specialtyId: "",
  difficulty: "INTERMEDIARIO",
  isFree: false,
  status: "DRAFT",
  videoIds: [],
  imageUrls: [],
  tagIds: [],
};

export function AdminCaseStudies() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [c, s, t] = await Promise.all([
      api<Paginated<CaseStudy>>(`/api/case-studies?perPage=15&page=${page}&all=true`),
      api<{ data: Specialty[] }>("/api/specialties?all=true"),
      api<{ data: Tag[] }>("/api/tags?all=true"),
    ]);
    setItems(c.data);
    setTotalPages(c.pagination.totalPages);
    setSpecialties(s.data);
    setTags(t.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page]);

  function startEdit(cs: CaseStudy) {
    setEditing({
      id: cs.id,
      title: cs.title,
      description: cs.description ?? "",
      diagnosis: cs.diagnosis ?? "",
      specialtyId: cs.specialty?.id ?? "",
      difficulty: cs.difficulty,
      isFree: cs.isFree,
      status: cs.status,
      videoIds: cs.videoIds ?? [],
      imageUrls: cs.images?.map((i) => i.url) ?? [],
      tagIds: cs.tagIds ?? [],
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const body = {
      title: editing.title,
      description: editing.description || undefined,
      diagnosis: editing.diagnosis || undefined,
      specialtyId: editing.specialtyId || null,
      difficulty: editing.difficulty,
      isFree: editing.isFree,
      status: editing.status,
      videoIds: editing.videoIds,
      imageUrls: editing.imageUrls,
      tagIds: editing.tagIds,
    };
    try {
      if (editing.id) {
        await api(`/api/case-studies/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/case-studies", { method: "POST", body: JSON.stringify(body) });
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirmAction("Excluir este estudo de caso?"))) return;
    await api(`/api/case-studies/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(cs: CaseStudy) {
    await api(`/api/case-studies/${cs.id}/${cs.status === "PUBLISHED" ? "unpublish" : "publish"}`, {
      method: "POST",
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            Estudos de caso
            <InfoPopover
              title="Como usar"
              text="Casos clínicos exibidos na seção 'Casos' do site. Cada caso traz uma especialidade, tags e pode conter imagens do passo a passo clínico. Ajudam o aluno a ver a teoria aplicada na prática."
            />
          </h1>
          <p className="mt-1 text-sm text-slate-500">Casos clínicos da plataforma</p>
        </div>
        <Button onClick={() => setEditing(emptyForm)}>
          <Plus className="h-4 w-4" /> Novo caso
        </Button>
      </div>

      {editing && (
        <Card className="mt-6 border-primary-200">
          <CardHeader><CardTitle>{editing.id ? "Editar caso" : "Novo estudo de caso"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
            </div>
            <div className="space-y-2">
              <Label>Diagnóstico</Label>
              <Textarea value={editing.diagnosis} onChange={(e) => setEditing({ ...editing, diagnosis: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} />
            </div>
            <div className="flex items-center gap-4">
              <Label>Tipo de acesso</Label>
              <Select
                value={editing.isFree ? "gratuito" : "pago"}
                onChange={(e) => setEditing({ ...editing, isFree: e.target.value === "gratuito" })}
              >
                <option value="gratuito">Gratuito</option>
                <option value="pago">Pago</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vídeos</Label>
              <Select
                value={editing.videoIds.length > 0 ? editing.videoIds[0] : ""}
                onChange={(e) => setEditing({ ...editing, videoIds: editing.videoIds.length > 0 ? [e.target.value] : [] })}
              >
                <option value="">Nenhum vídeo</option>
                <option value="1">Vídeo 1</option>
                <option value="2">Vídeo 2</option>
                <option value="3">Vídeo 3</option>
              </Select>
            </div>
            <ImagePicker
              value={editing.imageUrls}
              onChange={(urls) => setEditing({ ...editing, imageUrls: urls })}
              label="Galeria de imagens (upload ou link)"
            />
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`inline-flex items-center gap-1 rounded-full bg-accent-600 px-3 py-1 text-xs font-medium text-white ${editing.tagIds.includes(tag.id) ? "opacity-100" : "opacity-50"}`}
                  >
                    #{tag.name}
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, tagIds: editing.tagIds.includes(tag.id) ? editing.tagIds.filter((t) => t !== tag.id) : [...editing.tagIds, tag.id] })}
                      className="ml-2 text-white/25 hover:bg-white/40 rounded-full h-4 w-4"
                      title="Remover tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2">
                <Input
                  placeholder="Nova tag..."
                  onChange={() => setEditing({ ...editing, tagIds: [...editing.tagIds, Math.random().toString(36).substring(2, 10)] })}
                  className="h-8 max-w-[200px] text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !editing.title}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Casos clínicos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="p-8 text-center text-slate-400">Carregando...</p>
            ) : (
              items.map((cs) => (
                <div key={cs.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{cs.title}</p>
                    <p className="text-xs text-slate-400">{cs.specialty?.name ?? "Geral"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cs.isFree ? "free" : "premium"}>{cs.isFree ? "FREE" : "PREMIUM"}</Badge>
                    <Badge variant={cs.status === "PUBLISHED" ? "default" : "outline"}>{cs.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(cs)}>
                      {cs.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEdit(cs)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(cs.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
        <span className="text-sm text-slate-500">Página {page} de {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
      </div>
    </div>
  );
}
