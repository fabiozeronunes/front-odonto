import { useState } from "react";
import { BookOpen, Film, Layers } from "lucide-react";
import { MyVideos } from "./MyVideos";
import { MyCases } from "./MyCases";
import { MyTaxonomy } from "./MyTaxonomy";
import { cn } from "../../lib/utils";

type Tab = "videos" | "cases" | "taxonomy";

const tabs: { id: Tab; label: string; icon: typeof Film }[] = [
  { id: "videos", label: "Vídeos", icon: Film },
  { id: "cases", label: "Estudos de caso", icon: BookOpen },
  { id: "taxonomy", label: "Especialidades & Tags", icon: Layers },
];

export function MyContent() {
  const [tab, setTab] = useState<Tab>("videos");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Layers className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meu espaço</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre, organize e publique seus próprios conteúdos de estudo.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-primary-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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