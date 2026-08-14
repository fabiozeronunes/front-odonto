import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Paginated, CaseStudy } from "../types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export function CaseStudies() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<CaseStudy>>("/api/case-studies?perPage=24")
      .then((data) => setItems(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Estudos de caso</h1>
        <p className="mt-1 text-muted-foreground">
          Casos clínicos comentados para aprofundar seu aprendizado.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Nenhum estudo de caso publicado.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((cs) => (
            <div
              key={cs.id}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <Badge variant={cs.isFree ? "free" : "premium"}>
                  {cs.isFree ? "GRATUITO" : "PREMIUM"}
                </Badge>
                <span className="text-xs capitalize text-muted-foreground">
                  {cs.difficulty.toLowerCase()}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{cs.title}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{cs.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {cs.specialty?.name ?? "Geral"} · {cs.author ?? "Anônimo"}
                </span>
                <Link to={`/casos/${cs.slug}`}>
                  <Button variant="outline" size="sm">
                    Ver caso
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
