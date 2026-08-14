import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Film, Layers, Lock } from "lucide-react";
import { MyVideos } from "./MyVideos";
import { MyCases } from "./MyCases";
import { MyTaxonomy } from "./MyTaxonomy";
import { cn } from "../../lib/utils";
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
          <h1 className="text-2xl font-bold text-foreground">Meu espaço</h1>
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
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Layers className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu espaço</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre, organize e publique seus próprios conteúdos de estudo.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-primary-700 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "videos" && <MyVideos />}
        {tab === "cases" && <MyCases />}
        {tab === "taxonomy" && <MyTaxonomy />}
      </div>
    </div>
  );
}