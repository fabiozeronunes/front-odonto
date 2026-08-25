import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Clock, BookOpen, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";

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

function nextColor(used: string[]): string {
  for (const c of COLORS) {
    if (!used.includes(c)) return c;
  }
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function MySchedule() {
  const [items, setItems] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Discipline | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      const res = await api<{ data: Discipline[] }>("/api/grade");
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

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

  async function saveDiscipline() {
    if (!editing || !editing.name.trim()) return;
    const usedColors = items.filter((i) => i.id !== editing.id).map((i) => i.color);
    const color = editing.color || nextColor(usedColors);

    try {
      if (editing.id) {
        const res = await api<{ data: Discipline }>(`/api/grade/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...editing, color }),
        });
        setItems((prev) => prev.map((i) => (i.id === editing.id ? res.data : i)));
      } else {
        const res = await api<{ data: Discipline }>("/api/grade", {
          method: "POST",
          body: JSON.stringify({ ...editing, color }),
        });
        setItems((prev) => [...prev, res.data]);
      }
      closeForm();
    } catch {
      // erro silencioso
    }
  }

  async function deleteDiscipline(id: string) {
    try {
      await api(`/api/grade/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // erro silencioso
    }
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

  function getDisciplinesForDay(periodItems: Discipline[], day: string) {
    return periodItems.filter((i) => i.day === day);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" /> Carregando grade...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Grade de Disciplinas
          </h2>
          <p className="text-sm text-muted-foreground">
            Organize suas disciplinas por período, dia e horário.
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
              <div className="p-4 space-y-4">
                {DAYS.map((day) => {
                  const dayItems = getDisciplinesForDay(periodItems, day);
                  if (dayItems.length === 0) return null;
                  return (
                    <div key={day} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{day}</h4>
                        <Badge variant="outline" className="text-xs">{dayItems.length} disciplina(s)</Badge>
                      </div>
                      <div className="space-y-2">
                        {dayItems.map((d) => (
                          <Card key={d.id} className="border border-border bg-white hover:border-primary/30 transition-colors">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`${d.color} text-xs font-medium`}>{d.name}</Badge>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                                      <Clock className="h-3 w-3" />
                                      <span className="font-mono text-sm">{formatPeriod(d.period1Start, d.period1End)}</span>
                                      <span className="text-muted-foreground">1º</span>
                                      <span className="mx-1">|</span>
                                      <Clock className="h-3 w-3" />
                                      <span className="font-mono text-sm">{formatPeriod(d.period2Start, d.period2End)}</span>
                                      <span className="text-muted-foreground">2º</span>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {d.turma && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-border">
                                        <span className="font-medium">Turma {d.turma}</span>
                                      </span>
                                    )}
                                    {d.bloco && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-border">
                                        <span className="font-medium">Bloco {d.bloco}</span>
                                      </span>
                                    )}
                                    {d.sala && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-border">
                                        <span className="font-medium">Sala {d.sala}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {d.curso && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-border">
                                        <span className="font-medium">Curso {d.curso}</span>
                                      </span>
                                    )}
                                    {d.turno && (
                                      <Badge variant="outline" className="text-[9px]">{d.turno}</Badge>
                                    )}
                                  </div>
                                  {d.professor && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="font-medium">Professor {d.professor}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end gap-1 pt-1 border-t border-border">
                                <button
                                  type="button"
                                  onClick={() => openEdit(d)}
                                  className="rounded p-1 hover:bg-muted text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteDiscipline(d.id)}
                                  className="rounded p-1 hover:bg-red-100 text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
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