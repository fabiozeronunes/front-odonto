import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Film, Layers, Lock } from "lucide-react";
import { MyVideos } from "./MyVideos";
import { MyCases } from "./MyCases";
import { MyTaxonomy } from "./MyTaxonomy";
import { useAuth } from "../../lib/auth";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

type Tab = "videos" | "cases" | "taxonomy";

const tabs: { id: Tab; label: string; icon: typeof Film }[] = [
  { id: "videos", label: "Vídeos", icon: Film },
  { id: "cases", label: "Estudos de caso", icon: BookOpen },
  { id: "taxonomy", label: "Especialidades & Tags", icon: Layers },
];

export function MyContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("videos");

  const hasAccess =
    user?.role === "ADMIN" || (user?.plan?.slug !== undefined && user?.plan?.slug !== "gratuito");

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-16 text-center">
          <Badge variant="premium" className="mb-4">
            <Lock className="h-3 w-3" /> RECURSO PAGO
          </Badge>
          <h1 className="font-display text-3xl font-bold text-foreground">Meu espaço</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            O Meu espaço é um recurso exclusivo dos planos pagos. Assine o plano Pro para cadastrar,
            organizar e publicar seus próprios vídeos, estudos de caso, especialidades e tags.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/planos">
              <Button variant="premium">Assinar Plano Pro</Button>
            </Link>
            <Link to="/catalogo">
              <Button variant="outline">Voltar ao catálogo</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Meu espaço</h1>
        <p className="mt-1 text-muted-foreground">
          Cadastre, organize e publique seus próprios conteúdos de estudo.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
                tab === id
                  ? "bg-primary-700 text-primary-foreground shadow-sm"
                  : "border border-border bg-surface text-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${tab === id ? "bg-surface" : "bg-primary-600"}`}
              />
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {tab === "videos" && <MyVideos />}
        {tab === "cases" && <MyCases />}
        {tab === "taxonomy" && <MyTaxonomy />}
      </div>
    </div>
  );
}
