import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Pencil, Plus, Trash2, X, AlertTriangle, Video as VideoIcon, Music } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { CaseStudy, Paginated, Specialty, Tag as TagType, Video } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { ImagePicker } from "../../components/ImagePicker";
import { YouTubeImport } from "../../components/YouTubeImport";
import { AudioRecorder } from "../../components/AudioRecorder";
import { AudioPlayer } from "../../components/AudioPlayer";
import { TagCreator } from "../../components/TagCreator";
import { resolveImageUrl } from "../../lib/utils";

interface ImageDraft {
  id: string;
  url: string;
  tagIds: string[];
}

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
  audioUrl: string;
  audioTitle: string;
  audioTagIds: string[];
  tagIds: string[];
  videoIds: string[];
  images: ImageDraft[];
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
  audioUrl: "",
  audioTitle: "",
  audioTagIds: [],
  tagIds: [],
  videoIds: [],
  images: [],
};

export function MyCases() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [deleteConfirmTagId, setDeleteConfirmTagId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const lastSavedRef = useRef<string>("");

  async function load() {
    setLoading(true);
    try {
      const [c, s, tagsPage, v] = await Promise.all([
        api<Paginated<CaseStudy>>("/api/case-studies/me?perPage=50"),
        api<{ data: Specialty[] }>("/api/specialties"),
        api<Paginated<TagType>>("/api/tags?perPage=50"),
        api<Paginated<Video>>("/api/videos/me?perPage=50"),
      ]);
      let allTags = tagsPage.data;
      if (tagsPage.pagination.total > allTags.length) {
        for (let p = 2; p <= tagsPage.pagination.totalPages; p++) {
          const next = await api<Paginated<TagType>>(`/api/tags?perPage=50&page=${p}`);
          allTags = [...allTags, ...next.data];
        }
      }
      setCases(c.data);
      setSpecialties(s.data);
      setTags(allTags);
      setMyVideos(v.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editId && cases.length > 0) {
      const c = cases.find((cs) => cs.id === editId);
      if (c) {
        startEdit(c);
      }
    }
  }, [editId, cases]);

  useEffect(() => {
    if (!editing?.id) return;
    const interval = setInterval(async () => {
      const snapshot = JSON.stringify(editing);
      if (snapshot === lastSavedRef.current) return;
      if (saving) return;
      setSaving(true);
      try {
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
          audioUrl: editing.audioUrl || undefined,
          audioTitle: editing.audioTitle || undefined,
          audioTagIds: editing.audioTagIds,
          tagIds: editing.tagIds,
          videoIds: editing.videoIds,
          images: editing.images.map((img) => ({ url: img.url, tagIds: img.tagIds })),
        };
        await api(`/api/case-studies/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
        lastSavedRef.current = snapshot;
      } catch {
        // silent auto-save failure
      } finally {
        setSaving(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [editing?.id, saving]);

  function startCreate() {
    setEditing({ ...emptyForm });
    setError(null);
    setSearchParams({ tab: "cases", edit: "new" });
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
      audioUrl: c.audioUrl ?? "",
      audioTitle: c.audioTitle ?? "",
      audioTagIds: c.audioTags?.map((t) => t.tag.id) ?? [],
      tagIds: c.tags.map((t) => t.tag.id),
      videoIds: c.videoCases?.map((vc) => vc.video.id) ?? c.videoIds ?? [],
      images: c.images?.slice(0, 5).map((i) => ({
        id: i.id, url: i.url, tagIds: i.tags?.map((t) => t.tag.id) ?? [],
      })) ?? [],
    });
    setError(null);
    setSearchParams({ tab: "cases", edit: c.id });
  }

  function cancelEdit() {
    setEditing(null);
    setError(null);
    setSearchParams({ tab: "cases" });
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
      audioUrl: editing.audioUrl || undefined,
      audioTitle: editing.audioTitle || undefined,
      audioTagIds: editing.audioTagIds,
      tagIds: editing.tagIds,
      videoIds: editing.videoIds,
      images: editing.images.map((img) => ({ url: img.url, tagIds: img.tagIds })),
    };
    try {
      if (editing.id) {
        await api(`/api/case-studies/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        const res = await api<{ data: CaseStudy }>("/api/case-studies", { method: "POST", body: JSON.stringify(body) });
        setEditing((prev) => (prev ? { ...prev, id: res.data.id } : prev));
        setSearchParams({ tab: "cases", edit: res.data.id });
      }
      setError(null);
      lastSavedRef.current = JSON.stringify(editing);
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
    await api(`/api/case-studies/${c.id}/${c.status === "PUBLISHED" ? "unpublish" : "publish"}`, { method: "POST" });
    load();
  }

  async function removeVideo(videoId: string) {
    const newVideoIds = editing?.videoIds.filter((id) => id !== videoId) ?? [];
    setEditing((prev) => prev ? { ...prev, videoIds: newVideoIds } : prev);
    if (editing?.id) {
      try {
        await api(`/api/case-studies/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ videoIds: newVideoIds }),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover vídeo");
      }
    }
  }

  function toggleTag(id: string) {
    if (!editing) return;
    setEditing({ ...editing, tagIds: editing.tagIds.includes(id) ? editing.tagIds.filter((t) => t !== id) : [...editing.tagIds, id] });
  }

  function canEditOrDeleteTag(tag: TagType): boolean {
    return user?.role === "ADMIN" || (tag.createdById != null && tag.createdById === user?.id);
  }

  function startRenameTag(tag: TagType) { setEditingTagId(tag.id); setEditingTagName(tag.name); }
  function cancelRenameTag() { setEditingTagId(null); setEditingTagName(""); }

  async function saveRenameTag(tagId: string) {
    if (!editingTagName.trim()) return;
    try {
      await api(`/api/tags/${tagId}`, { method: "PUT", body: JSON.stringify({ name: editingTagName.trim() }) });
      setTags((prev) => prev.map((t) => (t.id === tagId ? { ...t, name: editingTagName.trim() } : t)));
      setEditingTagId(null);
      setEditingTagName("");
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao renomear tag"); }
  }

  function countImagesWithTag(tagId: string): number {
    if (!editing) return 0;
    return editing.images.filter((img) => img.tagIds.includes(tagId)).length;
  }

  async function deleteTagGlobally(tagId: string) {
    try {
      await api(`/api/tags/${tagId}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setEditing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tagIds: prev.tagIds.filter((t) => t !== tagId),
          audioTagIds: prev.audioTagIds.filter((t) => t !== tagId),
          images: prev.images.map((img) => ({ ...img, tagIds: img.tagIds.filter((t) => t !== tagId) })),
        };
      });
      setDeleteConfirmTagId(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao excluir tag"); }
  }

  async function importYouTubeVideo(info: { title?: string; author?: string; thumbnailUrl?: string; videoUrl: string }) {
    if (!editing) return;
    setError(null);
    try {
      const existing = myVideos.find((v) => v.videoUrl === info.videoUrl);
      if (existing) {
        setEditing((prev) => {
          if (!prev) return prev;
          return { ...prev, videoIds: prev.videoIds.includes(existing.id) ? prev.videoIds : [...prev.videoIds, existing.id] };
        });
        return;
      }
      const res = await api<{ data: Video }>("/api/videos", {
        method: "POST",
        body: JSON.stringify({ title: info.title || "Vídeo importado", videoUrl: info.videoUrl, thumbnailUrl: info.thumbnailUrl || undefined, author: info.author || undefined, isFree: true, status: "PUBLISHED" }),
      });
      setMyVideos((prev) => prev.some((v) => v.id === res.data.id) ? prev : [res.data, ...prev]);
      setEditing((prev) => {
        if (!prev) return prev;
        return { ...prev, videoIds: prev.videoIds.includes(res.data.id) ? prev.videoIds : [...prev.videoIds, res.data.id] };
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao importar vídeo"); }
  }

  async function createTag(name: string) {
    if (!editing || !name.trim()) return null;
    const trimmed = name.trim();
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!editing.tagIds.includes(existing.id)) setEditing({ ...editing, tagIds: [...editing.tagIds, existing.id] });
      return existing.id;
    }
    try {
      const res = await api<{ data: TagType }>("/api/tags", { method: "POST", body: JSON.stringify({ name: trimmed }) });
      setTags((prev) => [...prev.filter((t) => t.id !== res.data.id), res.data]);
      setEditing({ ...editing, tagIds: [...editing.tagIds, res.data.id] });
      return res.data.id;
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao criar tag"); return null; }
  }

  function toggleAudioTag(id: string) {
    if (!editing) return;
    setEditing({ ...editing, audioTagIds: editing.audioTagIds.includes(id) ? editing.audioTagIds.filter((t) => t !== id) : [...editing.audioTagIds, id] });
  }

  async function createAudioTag(name: string) {
    if (!editing || !name.trim()) return null;
    const trimmed = name.trim();
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!editing.audioTagIds.includes(existing.id)) setEditing({ ...editing, audioTagIds: [...editing.audioTagIds, existing.id] });
      return existing.id;
    }
    try {
      const res = await api<{ data: TagType }>("/api/tags", { method: "POST", body: JSON.stringify({ name: trimmed }) });
      setTags((prev) => [...prev.filter((t) => t.id !== res.data.id), res.data]);
      setEditing({ ...editing, audioTagIds: [...editing.audioTagIds, res.data.id] });
      return res.data.id;
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao criar tag"); return null; }
  }

  async function createImageTag(name: string, imageId: string) {
    if (!editing || !name.trim()) return null;
    const trimmed = name.trim();
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    let tagId = existing?.id;
    if (!tagId) {
      try {
        const res = await api<{ data: TagType }>("/api/tags", { method: "POST", body: JSON.stringify({ name: trimmed }) });
        tagId = res.data.id;
        setTags((prev) => [...prev.filter((t) => t.id !== res.data.id), res.data]);
      } catch (e) { setError(e instanceof Error ? e.message : "Falha ao criar tag"); return null; }
    }
    setEditing((prev) => {
      if (!prev) return prev;
      return { ...prev, images: prev.images.map((img) => img.id === imageId && !img.tagIds.includes(tagId!) ? { ...img, tagIds: [...img.tagIds, tagId!] } : img) };
    });
    return tagId;
  }


  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Meus estudos de caso</h2>
        <Button onClick={startCreate}><Plus className="h-4 w-4" /> Novo caso</Button>
      </div>

      {editing && (
        <div className="mb-6 space-y-5">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {/* Block 1: Informações do caso */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">Informações do caso</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Nome do estudo de caso" />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={editing.specialtyId} onChange={(e) => setEditing({ ...editing, specialtyId: e.target.value })}>
                  <option value="">Sem especialidade</option>
                  {specialties.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
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
                <Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} placeholder="Nome do autor" />
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} placeholder="Universidade ou clínica" />
              </div>
            </div>
          </div>

          {/* Block 2: Vídeos do caso */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-primary-600" />
              Vídeos do caso
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Importe do YouTube ou selecione seus vídeos existentes.
            </p>
            <YouTubeImport onInfo={importYouTubeVideo} />
            {(() => {
              const linkedVideos = myVideos.filter((v) => editing.videoIds.includes(v.id));
              if (linkedVideos.length === 0 && editing.videoIds.length === 0) {
                return <p className="mt-3 text-sm text-muted-foreground">Nenhum vídeo vinculado. Importe do YouTube acima.</p>;
              }
              if (linkedVideos.length === 0 && editing.videoIds.length > 0) {
                return <p className="mt-3 text-sm text-muted-foreground">Vídeos vinculados não encontrados nos seus uploads.</p>;
              }
              return (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {linkedVideos.map((v) => (
                    <div key={v.id} className="flex flex-col overflow-hidden">
                      <div className="overflow-hidden rounded-2xl border-2 border-primary-700 shadow-md ring-2 ring-primary-200">
                        <div className="relative w-full max-h-48 overflow-hidden bg-muted">
                          {v.thumbnailUrl ? (
                            <img src={resolveImageUrl(v.thumbnailUrl)} alt={v.title} className="h-full w-full object-cover" style={{ maxHeight: '12rem' }} />
                          ) : (
                            <div className="flex h-full w-full items-center bg-gradient-to-br from-primary-700 to-teal-600">
                              <VideoIcon className="h-10 w-10 text-white/60" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-primary-700/30">
                            <span className="rounded-full bg-primary-700 px-3 py-1 text-xs font-bold text-white shadow-lg">SELECIONADO</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-foreground">{v.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{v.specialty?.name ?? "Sem especialidade"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(v.id)}
                        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Block 3: Áudios */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Music className="h-5 w-5 text-primary-600" />
                Áudios
              </h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <AudioRecorder
                  value={editing.audioUrl}
                  onChange={(audioUrl) => setEditing({ ...editing, audioUrl, ...(audioUrl ? {} : { audioTitle: "", audioTagIds: [] }) })}
                  label="Adicionar novo áudio (gravar ou importar)"
                />
              </div>

              {editing.audioUrl && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <AudioPlayer src={resolveImageUrl(editing.audioUrl) || ""} />
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label>Título do áudio</Label>
                        <Input
                          value={editing.audioTitle}
                          onChange={(e) => setEditing({ ...editing, audioTitle: e.target.value })}
                          placeholder="Ex.: Explicação do caso clínico"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, audioUrl: "", audioTitle: "", audioTagIds: [] })}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0"
                        title="Remover áudio"
                        aria-label="Remover áudio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tags do áudio */}
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <div className="space-y-2">
                      <Label>Tags do áudio</Label>
                      <p className="text-xs text-muted-foreground">Tags específicas para o áudio.</p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const selected = editing.audioTagIds.includes(tag.id);
                          return (
                            <span key={tag.id} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${selected ? "bg-primary-700 text-white" : "bg-muted text-muted-foreground"}`}>
                              <button type="button" onClick={() => toggleAudioTag(tag.id)} className={selected ? "text-white" : "text-muted-foreground hover:text-foreground"}>
                                #{tag.name}
                              </button>
                            </span>
                          );
                        })}
                      </div>
                      <TagCreator onCreate={createAudioTag} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Block 4: Descrição, Diagnóstico, Observações */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">Descrição e observações</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} placeholder="Descreva o caso clínico..." />
              </div>
              <div className="space-y-2">
                <Label>Diagnóstico / Evolução</Label>
                <Textarea value={editing.diagnosis} onChange={(e) => setEditing({ ...editing, diagnosis: e.target.value })} rows={3} placeholder="Diagnóstico e evolução do paciente..." />
              </div>
              <div className="space-y-2">
                <Label>Observações pessoais</Label>
                <Textarea value={editing.observations} onChange={(e) => setEditing({ ...editing, observations: e.target.value })} rows={3} placeholder="Anotações privadas sobre este caso..." />
              </div>
            </div>
          </div>

          {/* Block 5: Galeria de imagens */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">Galeria de imagens</h3>
            <ImagePicker
              value={editing.images.map((img) => img.url)}
              onChange={(urls) => setEditing((prev) => {
                if (!prev) return prev;
                const used = new Set<string>();
                return {
                  ...prev,
                  images: urls.map((url) => {
                    const existing = prev.images.find((img) => img.url === url && !used.has(img.id));
                    if (existing) { used.add(existing.id); return existing; }
                    return { id: crypto.randomUUID(), url, tagIds: [] };
                  }).slice(0, 5),
                };
              })}
              label="Galeria de imagens (upload ou link, máx. 5)"
            />
            {editing.images.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {editing.images.length} {editing.images.length === 1 ? "imagem selecionada" : "imagens selecionadas"} (máx. 5)
              </p>
            )}
          </div>

          {/* Block 6: Tags de cada imagem */}
          {editing.images.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-foreground">Tags de cada imagem</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Tags específicas para cada imagem, independentes das tags do caso.
              </p>
              <div className="space-y-5">
                {editing.images.map((img, index) => {
                  const imageTags = tags.filter((tag) => img.tagIds.includes(tag.id));
                  return (
                    <div key={img.id} className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                          <img src={resolveImageUrl(img.url)} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Imagem {index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {imageTags.length} {imageTags.length === 1 ? "tag" : "tags"}
                          </p>
                        </div>
                      </div>

                      {imageTags.length > 0 && (
                        <div className="space-y-2">
                          {imageTags.map((tag) => (
                            <div key={tag.id} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                {editingTagId === tag.id ? (
                                  <input
                                    type="text"
                                    value={editingTagName}
                                    onChange={(e) => setEditingTagName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveRenameTag(tag.id);
                                      if (e.key === "Escape") cancelRenameTag();
                                    }}
                                    onBlur={() => saveRenameTag(tag.id)}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-600"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-foreground">
                                    #{tag.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {canEditOrDeleteTag(tag) && editingTagId !== tag.id && (
                                  <button
                                    type="button"
                                    onClick={() => startRenameTag(tag)}
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    title="Editar nome da tag"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                )}
                                {canEditOrDeleteTag(tag) && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmTagId(tag.id)}
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    title="Excluir tag permanentemente"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <TagCreator onCreate={(name) => createImageTag(name, img.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Block 7: Acesso, origem e tags */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-foreground">Acesso e tags</h3>

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

            <div className="mt-4 space-y-2">
              <Label>Tags</Label>
              <div className="mb-2">
                <Input
                  placeholder="Buscar tag pelo nome..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {tags
                  .filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()))
                  .map((tag) => {
                    const selected = editing.tagIds.includes(tag.id);
                    return (
                      <span
                        key={tag.id}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? "bg-primary-700 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={selected ? "text-white" : "text-muted-foreground hover:text-foreground"}
                          title={selected ? "Remover tag do caso" : "Adicionar tag ao caso"}
                        >
                          #{tag.name}
                        </button>
                        {selected && (
                          <button
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/40"
                            title="Remover tag do caso"
                            aria-label={`Remover tag ${tag.name} do caso`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
              </div>
              <TagCreator onCreate={createTag} />
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !editing.title}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      )}

      {/* Cases list */}
      <div className="rounded-2xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Especialidade</th>
                <th className="px-5 py-3">Acesso</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : cases.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Nenhum estudo de caso cadastrado ainda.</td></tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="max-w-[280px] px-5 py-3">
                      <p className="truncate font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.author ?? "—"} {c.observations ? "• com observações" : ""}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.specialty?.name ?? "—"}</td>
                    <td className="px-5 py-3"><Badge variant={c.isFree ? "free" : "premium"}>{c.isFree ? "FREE" : "Pago"}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={c.status === "PUBLISHED" ? "default" : "outline"}>{c.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => togglePublish(c)} title={c.status === "PUBLISHED" ? "Despublicar" : "Publicar"}>
                          {c.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="text-red-600" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete tag modal */}
      {deleteConfirmTagId && (() => {
        const tag = tags.find((t) => t.id === deleteConfirmTagId);
        if (!tag) return null;
        const imageCount = countImagesWithTag(tag.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Excluir tag</h3>
                  <p className="text-sm text-muted-foreground">Esta ação é irreversível</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-2">Tem certeza que deseja excluir a tag <strong>#{tag.name}</strong>?</p>
              {imageCount > 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 mb-4">
                  Esta tag está em {imageCount} {imageCount === 1 ? "imagem" : "imagens"} nesta lista.
                </p>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setDeleteConfirmTagId(null)}>Cancelar</Button>
                <Button variant="danger" onClick={() => deleteTagGlobally(tag.id)}>Excluir tag</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
