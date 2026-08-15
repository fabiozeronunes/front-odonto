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
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { InfoPopover } from "../../components/ui/info-popover";
import { useAuth } from "../../lib/auth";

const items = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
    help: "Visão geral do admin: total de usuários, vídeos, planos ativos e vendas do site.",
  },
  {
    to: "/admin/usuarios",
    label: "Usuários",
    icon: Users,
    help: "Todos os usuários cadastrados. Permite buscar, ver o plano de cada um e alternar entre ativo/inativo.",
  },
  {
    to: "/admin/videos",
    label: "Vídeos",
    icon: Video,
    help: "Cadastro e gerenciamento dos vídeos do catálogo, com upload de arquivo ou link, categoria e tags.",
  },
  {
    to: "/admin/especialidades",
    label: "Especialidades",
    icon: Stethoscope,
    help: "As especialidades da odontologia usadas para organizar os vídeos e casos do site.",
  },
  {
    to: "/admin/tags",
    label: "Tags",
    icon: TagsIcon,
    help: "Palavras-chave que ajudam a encontrar vídeos e casos por assunto.",
  },
  {
    to: "/admin/casos",
    label: "Estudos de caso",
    icon: ClipboardList,
    help: "Cadastro de estudos de caso clínicos, com imagens e textos, exibidos na área pública do site.",
  },
  {
    to: "/admin/planos",
    label: "Planos",
    icon: CreditCard,
    help: "Planos de assinatura (mensal/anual) que liberam o acesso aos conteúdos pagos do site.",
  },
  {
    to: "/admin/loja",
    label: "Shop Odontus",
    icon: ShoppingBag,
    help: "Loja do site: cadastro de produtos, categorias e acompanhamento dos pedidos recebidos.",
  },
  {
    to: "/admin/afiliados",
    label: "Afiliados",
    icon: Link2,
    help: "Parceiros que indicam alunos. Aqui você cadastra o afiliado, define as comissões (aluno e produtos) e acompanha/repassa os valores.",
  },
];

export function AdminLayout() {
  const { logout } = useAuth();
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
              <span className="ml-auto">
                <InfoPopover text={item.help} />
              </span>
            </NavLink>
          ))}
          <div className="mt-1 border-t border-slate-200 pt-2">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
