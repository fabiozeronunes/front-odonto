import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Pencil, Plus, Trash2, BookOpen } from "lucide-react";
import { api, ApiRequestError } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface Discipline {
  id: string;
  name: string;
}

export function MyDisciplines() {
  const [curso, setCurso] = useState("");
  const [savingCurso, setSavingCurso] = useState(false);
  const [cursoMsg, setCursoMsg] = useState<string | null>(null);
  const [disciplinas, setDisciplinas] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api<{ data: { curso: string; disciplinas: Discipline[] } }>("/api/my-disciplines")
      .then((d) => {
        setCurso(d.data.curso);
        setDisciplinas(d.data.disciplinas);
      })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }

  async function saveCurso() {
    setSavingCurso(true);
    setCursoMsg(null);
    try {
      await api("/api/my-disciplines/curso", { method: "PUT", body: JSON.stringify({ curso }) });
      setCursoMsg("Curso salvo com sucesso");
    } catch (e) {
      setCursoMsg(e instanceof ApiRequestError ? e.message : "Erro ao salvar curso");
    } finally {
      setSavingCurso(false);
      setTimeout(() => setCursoMsg(null), 3000);
    }
  }

  async function addDiscipline() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api<{ data: Discipline }>("/api/my-disciplines", {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
      setDisciplinas((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao criar disciplina");
    } finally {
      setCreating(false);
    }
  }

  async function renameDiscipline(id: string) {
    if (!editName.trim()) return;
    try {
      await api(`/api/my-disciplines/${id}`, { method: "PUT", body: JSON.stringify({ name: editName }) });
      setDisciplinas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: editName.trim() } : d)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditId(null);
      setEditName("");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao renomear");
    }
  }

  async function removeDiscipline(id: string) {
    if (!confirm("Excluir esta disciplina?")) return;
    try {
      await api(`/api/my-disciplines/${id}`, { method: "DELETE" });
      setDisciplinas((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <GraduationCap className="h-5 w-5 text-primary" /> Disciplinas & Curso
        </h2>
        <p className="text-sm text-muted-foreground">
          Cadastre seu curso/graduação e as disciplinas. Eles ficam disponíveis para marcar vídeos e áudios.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <GraduationCap className="h-4 w-4 text-primary-600" /> Curso / Graduação
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Graduação que está cursando</Label>
            <Input
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              placeholder="Ex.: Odontologia"
            />
          </div>
          <Button size="sm" onClick={saveCurso} disabled={savingCurso}>
            {savingCurso ? "Salvando..." : "Salvar"}
          </Button>
        </div>
        {cursoMsg && (
          <p className="mt-2 text-xs text-emerald-700">{cursoMsg}</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <BookOpen className="h-4 w-4 text-primary-600" /> Disciplinas
        </h3>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDiscipline()}
            placeholder="Ex.: Anatomia Dental"
          />
          <Button size="sm" onClick={addDiscipline} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" /> Carregando...
          </div>
        ) : disciplinas.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma disciplina cadastrada. Adicione a primeira acima.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {disciplinas.map((d) => (
              <li key={d.id} className="flex items-center gap-2 px-3 py-2.5">
                {editId === d.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameDiscipline(d.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      autoFocus
                      className="h-8"
                    />
                    <Button size="sm" variant="outline" onClick={() => renameDiscipline(d.id)}>
                      OK
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{d.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(d.id);
                        setEditName(d.name);
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Editar disciplina"
                      aria-label={`Editar ${d.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDiscipline(d.id)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      title="Excluir disciplina"
                      aria-label={`Excluir ${d.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}