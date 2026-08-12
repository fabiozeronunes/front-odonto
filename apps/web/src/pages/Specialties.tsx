import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Specialty } from "../types";
import { SpecialtyCard } from "../components/SpecialtyCard";

export function Specialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: Specialty[] }>("/api/specialties")
      .then((data) => setSpecialties(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Especialidades odontológicas</h1>
        <p className="mt-1 text-slate-500">
          Explore conteúdos organizados por área de atuação.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {specialties.map((specialty) => (
            <SpecialtyCard key={specialty.id} specialty={specialty} />
          ))}
        </div>
      )}
    </div>
  );
}
