import { Link, NavLink } from "react-router-dom";
import { Search, User as UserIcon, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useSiteLogo } from "../lib/useSiteLogo";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/especialidades", label: "Especialidades" },
  { to: "/casos", label: "Estudos de Caso" },
  { to: "/planos", label: "Planos" },
];

const darkOutline = "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white";
const darkGhost = "text-slate-300 hover:bg-slate-800 hover:text-white";

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const logoUrl = useSiteLogo();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20">
        <Link to="/" className="flex items-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="OdontoStudy"
              className="h-auto w-44 object-contain sm:w-52 md:w-60 lg:w-72"
            />
          ) : (
            <span
              aria-hidden
              className="block h-11 w-44 sm:h-12 sm:w-52 md:h-14 md:w-60 lg:h-16 lg:w-72"
            />
          )}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-teal-300"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/catalogo">
            <Button variant="ghost" size="icon" aria-label="Buscar" className={darkGhost}>
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          {user ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="outline" size="sm" className={darkOutline}>
                  <UserIcon className="h-4 w-4" />
                  {user.name.split(" ")[0]}
                </Button>
              </Link>
              <Link to="/meus-conteudos">
                <Button variant="ghost" size="sm" className={darkGhost}>
                  Meu espaço
                </Button>
              </Link>
              <Link to="/perfil">
                <Button variant="ghost" size="sm" className={darkGhost}>
                  Perfil
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className={darkGhost}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className={darkGhost}>
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="sm">Criar conta</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "bg-slate-800 text-teal-300" : "text-slate-300"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-800 pt-3">
              {user ? (
                <>
                  <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}>
                    <Button variant="outline" className={`w-full ${darkOutline}`}>
                      {isAdmin ? "Painel Admin" : "Minha Área"}
                    </Button>
                  </Link>
                  <Link to="/meus-conteudos" onClick={() => setOpen(false)}>
                    <Button variant="outline" className={`w-full ${darkOutline}`}>
                      Meu espaço
                    </Button>
                  </Link>
                  <Link to="/perfil" onClick={() => setOpen(false)}>
                    <Button variant="outline" className={`w-full ${darkOutline}`}>
                      Meu perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className={darkGhost}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className={`w-full ${darkOutline}`}>
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" onClick={() => setOpen(false)}>
                    <Button className="w-full">Criar conta</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}