import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  User as UserIcon,
  Search,
  Sparkles,
  ShoppingCart,
  Shield,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useHomeLock } from "../lib/homeLock";
import { cn } from "../lib/utils";

const CAROUSEL_ITEMS = [
  { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/dashboard", label: "Minha Área", icon: UserIcon },
  { to: "/catalogo", label: "Catálogo", icon: Search },
  { to: "/planos", label: "Planos", icon: Sparkles },
  { to: "/loja", label: "Shop", icon: ShoppingCart },
];

export function BottomNav() {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const { contentHidden } = useHomeLock();

  if (contentHidden) return null;

  const items = CAROUSEL_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl lg:hidden"
      aria-label="Menu inferior"
    >
      <div className="flex overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isActive = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[4.5rem] flex-1 basis-16 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold transition-colors",
                isActive ? "text-primary-700 dark:text-primary-400" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
