import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Pencil, Trash2, BookOpen, X } from "lucide-react";
import { api, ApiRequestError } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TURNOS = ["Manhã", "Integral", "Noite"];

function sortByDay<T extends { diaSemana?: string | null; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ia = DAYS.indexOf(a.diaSemana ?? "");
    const ib = DAYS.indexOf(b.diaSemana ?? "");
    if (ia !== ib) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.name.localeCompare(b.name);
  });
}

interface CourseEntry {
  id: string;
  name: string;
  curso: string | null;
  codigo: string | null;
  diaSemana: string | null;
  periodo: string | null;
  turno: string | null;
  professor: string | null;
  turma: string | null;
  bloco: string | null;
  sala: string | null;
}

const EMPTY = {
  name: "",
  curso: "",
  codigo: "",
  diaSemana: "",
  periodo: "",
  turno: "",
  professor: "",
  turma: "",
  bloco: "",
  sala: "",
};

export function CourseData() {
  const [entries, setEntries] = useState<CourseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api<{ data: { disciplinas: CourseEntry[] } }>("/api/my-disciplines")
      .then((d) => setEntries(sortByDay(d.data.disciplinas)))
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const res = await api<{ data: CourseEntry }>(`/api/my-disciplines/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setEntries((prev) => sortByDay(prev.map((e) => (e.id === editingId ? res.data : e))));
      } else {
        const res = await api<{ data: CourseEntry }>("/api/my-disciplines", {
          method: "POST",
          body: JSON.stringify(form),
        });
        if (!entries.some((e) => e.id === res.data.id)) {
          setEntries((prev) => sortByDay([...prev, res.data]));
        }
      }
      setForm({ ...EMPTY });
      setEditingId(null);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry: CourseEntry) {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      curso: entry.curso ?? "",
      codigo: entry.codigo ?? "",
      diaSemana: entry.diaSemana ?? "",
      periodo: entry.periodo ?? "",
      turno: entry.turno ?? "",
      professor: entry.professor ?? "",
      turma: entry.turma ?? "",
      bloco: entry.bloco ?? "",
      sala: entry.sala ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...EMPTY });
  }

  async function remove(id: string) {
    if (!confirm("Excluir estes dados do curso?")) return;
    try {
      await api(`/api/my-disciplines/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao excluir");
    }
  }

  function selectField(
    label: string,
    key: keyof typeof EMPTY,
    options: { value: string; label: string }[],
    placeholder: string
  ) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <select
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function field(label: string, key: keyof typeof EMPTY, placeholder: string, autoFocus = false) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <Input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <GraduationCap className="h-5 w-5 text-primary" /> Dados do Curso
        </h2>
        <p className="text-sm text-muted-foreground">
          Cadastre as disciplinas do seu curso com período, professor, turma, bloco e sala.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-foreground">
            <BookOpen className="h-4 w-4 text-primary-600" />
            {editingId ? "Editar dados" : "Novos dados"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Cancelar edição"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field("Curso", "curso", "Ex.: Odontologia")}
          {selectField(
            "Dia da semana",
            "diaSemana",
            DAYS.map((d) => ({ value: d, label: d })),
            "Escolher..."
          )}
          {field("Período", "periodo", "Ex.: 3º")}
          {selectField(
            "Turno",
            "turno",
            TURNOS.map((t) => ({ value: t, label: t })),
            "Escolher..."
          )}
          {field("Disciplina *", "name", "Ex.: Anatomia Dental", true)}
          {field("Cod Disciplina", "codigo", "Ex.: ARA4185")}
          {field("Professor", "professor", "Ex.: Dr. João Silva")}
          {field("Turma", "turma", "Ex.: 001")}
          {field("Bloco", "bloco", "Ex.: A")}
          {field("Sala", "sala", "Ex.: 101")}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          {editingId && (
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" /> Carregando...
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum dado cadastrado. Preencha o formulário acima.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
                {entry.codigo && (
                  <p className="truncate text-xs font-medium text-muted-foreground">COD: {entry.codigo}</p>
                )}
                {(entry.diaSemana || entry.turno) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {[entry.diaSemana && `Dia: ${entry.diaSemana}`, entry.turno && `Turno: ${entry.turno}`]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                {(entry.periodo || entry.curso) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {[entry.periodo && `Período: ${entry.periodo}`, entry.curso && `Curso: ${entry.curso}`]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                {entry.professor && (
                  <p className="truncate text-xs text-muted-foreground">Professor: {entry.professor}</p>
                )}
                {(entry.turma || entry.bloco || entry.sala) && (
                  <p className="truncate text-[11px] text-muted-foreground/80">
                    {[
                      entry.turma && `Turma ${entry.turma}`,
                      entry.bloco && `Bloco ${entry.bloco}`,
                      entry.sala && `Sala ${entry.sala}`,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => startEdit(entry)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Editar"
                aria-label={`Editar ${entry.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                title="Excluir"
                aria-label={`Excluir ${entry.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}