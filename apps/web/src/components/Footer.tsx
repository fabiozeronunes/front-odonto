import { Link } from "react-router-dom";
import { useSiteLogo } from "../lib/useSiteLogo";

export function Footer() {
  const logoUrl = useSiteLogo();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="OdontoStudy"
                className="h-auto w-48 object-contain sm:w-60 md:w-72"
              />
            ) : (
              <span aria-hidden className="block h-12 w-48 sm:h-14 sm:w-60 md:h-16 md:w-72" />
            )}
            <p className="mt-3 max-w-md text-sm">
              Plataforma de estudos odontológicos com vídeos, especialidades e estudos de caso
              para estudantes e profissionais.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Navegação</p>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-teal-400" to="/catalogo">Catálogo</Link></li>
              <li><Link className="hover:text-teal-400" to="/especialidades">Especialidades</Link></li>
              <li><Link className="hover:text-teal-400" to="/casos">Estudos de caso</Link></li>
              <li><Link className="hover:text-teal-400" to="/planos">Planos</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Institucional</p>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-teal-400" to="/privacidade">Política de Privacidade</Link></li>
              <li><Link className="hover:text-teal-400" to="/termos">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-800 pt-6 text-xs">
          © {new Date().getFullYear()} FrontOdontus. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
