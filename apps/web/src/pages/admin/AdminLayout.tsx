import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Video,
  Stethoscope,
  Tags as TagsIcon,
  ClipboardList,
  CreditCard,
  Link2,
} from "lucide-react";
import { cn } from "../../lib/utils";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/videos", label: "Vídeos", icon: Video },
  { to: "/admin/especialidades", label: "Especialidades", icon: Stethoscope },
  { to: "/admin/tags", label: "Tags", icon: TagsIcon },
  { to: "/admin/casos", label: "Estudos de caso", icon: ClipboardList },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
  { to: "/admin/afiliados", label: "Afiliados", icon: Link2 },
];

export function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
      <aside className="lg:w-60 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card lg:flex-col">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-800"
                    : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
