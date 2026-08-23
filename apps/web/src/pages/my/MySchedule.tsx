import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Clock, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface Discipline {
  id: string;
  name: string;
  period: number;
  day: string;
  time: string;
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
    setEditing({ id: "", name: "", period, day: "Segunda", time: "", color: "" });
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border bg-muted/30">
                      {DAYS.map((day) => (
                        <th key={day} className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      {DAYS.map((day) => {
                        const dayItems = periodItems.filter((i) => i.day === day);
                        return (
                          <td key={day} className="border-r border-border last:border-r-0 p-2 align-top min-w-[120px]">
                            <div className="space-y-1.5">
                              {dayItems.map((d) => (
                                <div
                                  key={d.id}
                                  className={`rounded-lg border p-2 ${d.color} group relative`}
                                >
                                  <p className="font-medium text-xs leading-tight">{d.name}</p>
                                  {d.time && (
                                    <p className="mt-0.5 flex items-center gap-1 text-[10px] opacity-75">
                                      <Clock className="h-2.5 w-2.5" /> {d.time}
                                    </p>
                                  )}
                                  <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => openEdit(d)}
                                      className="rounded bg-white/80 p-0.5 hover:bg-white"
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteDiscipline(d.id)}
                                      className="rounded bg-white/80 p-0.5 hover:bg-red-100"
                                    >
                                      <Trash2 className="h-2.5 w-2.5 text-red-600" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => openNew(period)}
                                className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border p-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-foreground">
              {editing.id ? "Editar disciplina" : "Nova disciplina"}
            </h3>
            <div className="space-y-3">
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
                <Label>Nome da disciplina</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex.: Anatomia"
                  autoFocus
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
                <Label>Horário</Label>
                <Input
                  value={editing.time}
                  onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                  placeholder="Ex.: 08:00 - 10:00"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={closeForm}>Cancelar</Button>
              <Button size="sm" onClick={saveDiscipline} disabled={!editing.name.trim()}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
