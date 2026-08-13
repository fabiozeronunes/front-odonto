import { Link, NavLink } from "react-router-dom";
import { GraduationCap, Search, User as UserIcon, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/especialidades", label: "Especialidades" },
  { to: "/casos", label: "Estudos de Caso" },
  { to: "/planos", label: "Planos" },
];

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-slate-900">
            Front<span className="text-primary-700">Odontus</span>
          </span>
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
                    ? "bg-primary-50 text-primary-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/catalogo">
            <Button variant="ghost" size="icon" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          {user ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="outline" size="sm">
                  <UserIcon className="h-4 w-4" />
                  {user.name.split(" ")[0]}
                </Button>
              </Link>
              <Link to="/meus-conteudos">
                <Button variant="ghost" size="sm">
                  Meu espaço
                </Button>
              </Link>
              <Link to="/perfil">
                <Button variant="ghost" size="sm">
                  Perfil
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
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
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "bg-primary-50 text-primary-800" : "text-slate-600"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {isAdmin ? "Painel Admin" : "Minha Área"}
                    </Button>
                  </Link>
                  <Link to="/meus-conteudos" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Meu espaço
                    </Button>
                  </Link>
                  <Link to="/perfil" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Meu perfil
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
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
