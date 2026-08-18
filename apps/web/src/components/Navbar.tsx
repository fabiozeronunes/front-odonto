import { Link, NavLink } from "react-router-dom";
import { Search, User as UserIcon, Menu, X, ShoppingCart, Moon, Sun, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useSiteLogo } from "../lib/useSiteLogo";
import { useTheme } from "../lib/useTheme";
import { useHomeLock } from "../lib/homeLock";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/especialidades", label: "Especialidades" },
  { to: "/casos", label: "Estudos de Caso" },
  { to: "/loja", label: "Shop Odontus" },
  { to: "/planos", label: "Planos" },
];

const outlineClass =
  "border-border bg-surface text-foreground hover:bg-muted hover:border-primary-500";
const ghostClass = "text-muted-foreground hover:bg-muted hover:text-foreground";

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const logoUrl = useSiteLogo();
  const [open, setOpen] = useState(false);
  const { contentHidden } = useHomeLock();

  if (contentHidden) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        <Link to="/" className="flex items-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="OdontoStudy"
              className="h-auto w-[70vw] max-w-full object-contain md:max-w-[240px] lg:max-w-[220px]"
            />
          ) : (
            <span className="font-display text-2xl font-bold text-primary-700 dark:text-primary-400">
              Odontus
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Alternar tema"
            className={ghostClass}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link to="/carrinho" aria-label="Carrinho de compras">
            <Button variant="ghost" size="icon" className={`relative ${ghostClass}`}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/catalogo">
            <Button variant="ghost" size="icon" aria-label="Buscar" className={ghostClass}>
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className={outlineClass}>
                    Painel Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className={outlineClass}>
                  <UserIcon className="h-4 w-4" />
                  {user.name.split(" ")[0]}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className={ghostClass}>
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="sm">Criar conta</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Alternar tema"
            className={ghostClass}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                      : "text-muted-foreground hover:bg-muted"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Link to="/carrinho" onClick={() => setOpen(false)}>
                <Button variant="outline" className={`w-full ${outlineClass}`}>
                  <ShoppingCart className="h-4 w-4" /> Meu carrinho
                  {count > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </Button>
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="outline" className={`w-full ${outlineClass}`}>
                      Minha Área
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setOpen(false)}>
                      <Button variant="outline" className={`w-full ${outlineClass}`}>
                        Painel Admin
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className={`w-full ${outlineClass}`}>
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" onClick={() => setOpen(false)}>
                    <Button className="w-full">Criar conta</Button>
                  </Link>
                </>
              )}
              {user && (
                <Button variant="ghost" className={`w-full ${ghostClass}`} onClick={logout}>
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}