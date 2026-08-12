import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, CaseStudy } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

interface CaseForm {
  id?: string;
  title: string;
  description: string;
  diagnosis: string;
  specialtyId: string;
  difficulty: string;
  isFree: boolean;
  status: string;
}

const emptyForm: CaseForm = {
  title: "",
  description: "",
  diagnosis: "",
  specialtyId: "",
  difficulty: "INTERMEDIARIO",
  isFree: false,
  status: "DRAFT",
};

export function AdminCaseStudies() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [c, s] = await Promise.all([
      api<Paginated<CaseStudy>>(`/api/case-studies?perPage=15&page=${page}&all=true`),
      api<{ data: Specialty[] }>("/api/specialties?all=true"),
    ]);
    setItems(c.data);
    setTotalPages(c.pagination.totalPages);
    setSpecialties(s.data);
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
    if (!confirm("Excluir este estudo de caso?")) return;
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
          <h1 className="text-2xl font-bold text-slate-900">Estudos de caso</h1>
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
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isFree} onChange={(e) => setEditing({ ...editing, isFree: e.target.checked })} />
              Conteúdo gratuito
            </label>
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
