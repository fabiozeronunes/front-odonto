import { Link } from "react-router-dom";
import { useSiteLogo } from "../lib/useSiteLogo";
import { useHomeLock } from "../lib/homeLock";
import { cn } from "../lib/utils";

export function Footer() {
  const logoUrl = useSiteLogo();
  const { contentHidden } = useHomeLock();
  const linkClass = cn("hover:text-teal-400", contentHidden && "pointer-events-none select-none opacity-50");

  return (
    <footer className={cn("border-t border-slate-800 bg-slate-950 text-slate-400 lg:pb-0", contentHidden ? "pb-0" : "pb-20")}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="OdontoStudy"
                className="h-auto w-[70vw] max-w-full object-contain"
              />
            ) : (
              <span aria-hidden className="block h-[16vw] w-[70vw] max-w-full" />
            )}
            <p className="mt-3 max-w-md text-sm">
              Plataforma de estudos odontológicos com vídeos, especialidades e estudos de caso
              para estudantes e profissionais.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Navegação</p>
            <ul className="space-y-2 text-sm">
              <li><Link className={linkClass} to="/catalogo">Catálogo</Link></li>
              <li><Link className={linkClass} to="/especialidades">Especialidades</Link></li>
              <li><Link className={linkClass} to="/casos">Estudos de caso</Link></li>
              <li><Link className={linkClass} to="/planos">Planos</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Institucional</p>
            <ul className="space-y-2 text-sm">
              <li><Link className={linkClass} to="/privacidade">Política de Privacidade</Link></li>
              <li><Link className={linkClass} to="/termos">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-800 pt-6 text-xs leading-relaxed text-slate-500">
          Disclaimer: melhoras de desempenho estão relacionadas a estudos diários e
          comprometimento com as matérias do seu curso. O Front Odonto não realiza mágica. Os
          recursos aqui apresentados não dão a garantia de melhorar sem estudar, foram criados
          para te auxiliar a melhorar seu desempenho e métricas em seu curso.
        </p>
        <p className="mt-4 border-t border-slate-800 pt-4 text-xs">
          © {new Date().getFullYear()} FrontOdontus. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
