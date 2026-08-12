import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, User } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { formatDate } from "../../lib/utils";

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: "15" });
    if (search) params.set("search", search);
    api<Paginated<User>>(`/api/admin/users?${params.toString()}`)
      .then((d) => {
        setUsers(d.data);
        setTotal(d.pagination.total);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  async function toggleActive(id: string, isActive: boolean) {
    await api(`/api/admin/users/${id}/${isActive ? "deactivate" : "activate"}`, { method: "POST" });
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
      <p className="mt-1 text-sm text-slate-500">{total} cadastrados</p>

      <div className="mt-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista de usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Perfil</th>
                  <th className="px-5 py-3">Criado em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Carregando...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-5 py-3 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <Badge variant={u.plan?.slug === "premium" ? "premium" : "free"}>
                          {u.plan?.name ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>{u.role}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant={u.isActive ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => toggleActive(u.id, u.isActive ?? true)}
                        >
                          {u.isActive === false ? "Ativar" : "Desativar"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
