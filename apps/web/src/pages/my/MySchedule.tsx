import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Clock, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface Discipline {
  id: string;
  turma: string;
  bloco: string;
  sala: string;
  curso: string;
  turno: string;
  professor: string;
  name: string;
  period: number;
  day: string;
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
  color: string;
}

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-red-100 border-red-300 text-red-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
];

const STORAGE_KEY = "odonto-grade-disciplinas";

function loadSchedule(): Discipline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSchedule(items: Discipline[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nextColor(used: string[]): string {
  for (const c of COLORS) {
    if (!used.includes(c)) return c;
  }
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function MySchedule() {
  const [items, setItems] = useState<Discipline[]>(loadSchedule);
  const [editing, setEditing] = useState<Discipline | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({});

  useEffect(() => {
    saveSchedule(items);
  }, [items]);

  const periods = [...new Set(items.map((i) => i.period))].sort((a, b) => a - b);

  function togglePeriod(p: number) {
    setExpandedPeriods((prev) => ({ ...prev, [p]: !(prev[p] ?? true) }));
  }

  function openNew(period: number) {
    setEditing({
      id: "",
      turma: "",
      bloco: "",
      sala: "",
      curso: "",
      turno: "Noturno",
      professor: "",
      name: "",
      period,
      day: "Segunda",
      period1Start: "",
      period1End: "",
      period2Start: "",
      period2End: "",
      color: "",
    });
    setShowForm(true);
  }

  function openEdit(d: Discipline) {
    setEditing(d);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  function saveDiscipline() {
    if (!editing || !editing.name.trim()) return;
    const usedColors = items.filter((i) => i.id !== editing.id).map((i) => i.color);
    const color = editing.color || nextColor(usedColors);

    if (editing.id) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...editing, color } : i)));
    } else {
      const newDisc: Discipline = { ...editing, id: crypto.randomUUID(), color };
      setItems((prev) => [...prev, newDisc]);
    }
    closeForm();
  }

  function deleteDiscipline(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function addPeriod() {
    const next = periods.length > 0 ? Math.max(...periods) + 1 : 1;
    setExpandedPeriods((prev) => ({ ...prev, [next]: true }));
    openNew(next);
  }

  function formatPeriod(start: string, end: string) {
    if (start && end) return `${start}–${end}`;
    return "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Grade de Disciplinas
          </h2>
          <p className="text-sm text-muted-foreground">
            Organize suas disciplinas por período, professor e horário.
          </p>
        </div>
        <Button size="sm" onClick={addPeriod}>
          <Plus className="h-3.5 w-3.5" /> Nova disciplina
        </Button>
      </div>

      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma disciplina cadastrada. Clique em "Nova disciplina" para começar.
          </p>
        </div>
      )}

      {periods.map((period) => {
        const periodItems = items.filter((i) => i.period === period);
        const expanded = expandedPeriods[period] ?? true;
        return (
          <div key={period} className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => togglePeriod(period)}
              className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-bold text-foreground">{period}º Período</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{periodItems.length} disciplina(s)</span>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {expanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border bg-muted/30">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Dia</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Turma</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Bloco</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Sala</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Curso</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Professor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Disciplina</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">1º Período</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">2º Período</th>
                      <th className="px-3 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => {
                      const dayItems = periodItems.filter((i) => i.day === day);
                      if (dayItems.length === 0) return null;
                      return dayItems.map((d, idx) => (
                        <tr key={d.id} className={`border-t border-border ${idx === 0 && d.day !== periodItems[0]?.day ? "border-t-2 border-t-muted" : ""}`}>
                          <td className="px-3 py-2.5 text-muted-foreground">{d.day}</td>
                          <td className="px-3 py-2.5 font-medium text-foreground">{d.turma || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{d.bloco || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{d.sala || "—"}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{d.curso || "—"}</td>
                          <td className="px-3 py-2.5 text-foreground">{d.professor || "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${d.color}`}>
                              {d.name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatPeriod(d.period1Start, d.period1End)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatPeriod(d.period2Start, d.period2End)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(d)}
                                className="rounded p-1 hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDiscipline(d.id)}
                                className="rounded p-1 hover:bg-red-100"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
                <div className="border-t border-border px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openNew(period)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Adicionar disciplina
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showForm && editing && (
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-2xl border border-border bg-surface shadow-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editing.id ? "Editar disciplina" : "Nova disciplina"}
              </h3>
              <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Período</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.period}
                    onChange={(e) => setEditing({ ...editing, period: Number(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Dia da semana</Label>
                  <select
                    value={editing.day}
                    onChange={(e) => setEditing({ ...editing, day: e.target.value })}
                    className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Nº Turma</Label>
                  <Input
                    value={editing.turma}
                    onChange={(e) => setEditing({ ...editing, turma: e.target.value })}
                    placeholder="Ex.: 001"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bloco</Label>
                  <Input
                    value={editing.bloco}
                    onChange={(e) => setEditing({ ...editing, bloco: e.target.value })}
                    placeholder="Ex.: A"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Sala</Label>
                  <Input
                    value={editing.sala}
                    onChange={(e) => setEditing({ ...editing, sala: e.target.value })}
                    placeholder="Ex.: 101"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Curso</Label>
                  <Input
                    value={editing.curso}
                    onChange={(e) => setEditing({ ...editing, curso: e.target.value })}
                    placeholder="Ex.: Odontologia"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Turno</Label>
                  <select
                    value={editing.turno}
                    onChange={(e) => setEditing({ ...editing, turno: e.target.value })}
                    className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    <option value="Integral">Integral</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Nome do professor</Label>
                  <Input
                    value={editing.professor}
                    onChange={(e) => setEditing({ ...editing, professor: e.target.value })}
                    placeholder="Ex.: Dr. João Silva"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Nome da disciplina</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Ex.: Anatomia"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">1º Período</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="time"
                        value={editing.period1Start}
                        onChange={(e) => setEditing({ ...editing, period1Start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="time"
                        value={editing.period1End}
                        onChange={(e) => setEditing({ ...editing, period1End: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">2º Período</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="time"
                        value={editing.period2Start}
                        onChange={(e) => setEditing({ ...editing, period2Start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="time"
                        value={editing.period2End}
                        onChange={(e) => setEditing({ ...editing, period2End: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" size="sm" onClick={closeForm}>Cancelar</Button>
              <Button size="sm" onClick={saveDiscipline} disabled={!editing.name.trim()}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
