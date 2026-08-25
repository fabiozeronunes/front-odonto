import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package, ShoppingCart } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Product, ProductCategory, ShopOrder, Tag } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ImagePicker } from "../../components/ImagePicker";
import { cn, formatDate, formatPrice } from "../../lib/utils";
import { InfoPopover } from "../../components/ui/info-popover";
import { confirmAction } from "../../components/Confirm";

interface ProductFormState {
  id?: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  promoPrice: string;
  saleStartsAt: string;
  saleEndsAt: string;
  sku: string;
  stock: string;
  status: string;
  isFeatured: boolean;
  categoryId: string;
  accessLevel: string;
  tagIds: string[];
  imageUrls: string[];
}

const emptyForm: ProductFormState = {
  name: "",
  brand: "",
  description: "",
  price: "",
  promoPrice: "",
  saleStartsAt: "",
  saleEndsAt: "",
  sku: "",
  stock: "0",
  status: "DRAFT",
  isFeatured: false,
  categoryId: "",
  accessLevel: "PUBLIC",
  tagIds: [],
  imageUrls: [],
};

export function AdminShop() {
  const [tab, setTab] = useState<"produtos" | "categorias" | "pedidos">("produtos");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [p, c, t] = await Promise.all([
        api<Paginated<Product>>(`/api/products/admin?perPage=15&page=${page}`),
        api<{ data: ProductCategory[] }>("/api/products/categories"),
        api<{ data: Tag[] }>("/api/tags?all=true"),
      ]);
      setProducts(p.data);
      setTotalPages(p.pagination.totalPages);
      setCategories(c.data);
      setTags(t.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    if (tab !== "pedidos") return;
    api<{ data: ShopOrder[] }>("/api/products/orders")
      .then((d) => setOrders(d.data))
      .catch(() => setOrders([]));
  }, [tab]);

  async function handleDeleteOrder(orderId: string) {
    if (!(await confirmAction("Excluir este pedido? Esta ação não pode ser desfeita."))) return;
    try {
      await api(`/api/products/orders/${orderId}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error(err);
      alert("Não foi possível excluir o pedido.");
    }
  }

  function startCreate() {
    setEditing({ ...emptyForm });
    setError(null);
  }

  function startEdit(p: Product) {
    setEditing({
      id: p.id,
      name: p.name,
      brand: p.brand ?? "",
      description: p.description ?? "",
      price: String(Number(p.price) || 0),
      promoPrice: p.promoPrice != null ? String(Number(p.promoPrice)) : "",
      saleStartsAt: p.saleStartsAt ? new Date(p.saleStartsAt).toISOString().slice(0, 16) : "",
      saleEndsAt: p.saleEndsAt ? new Date(p.saleEndsAt).toISOString().slice(0, 16) : "",
      sku: p.sku ?? "",
      stock: String(p.stock),
      status: p.status,
      isFeatured: p.isFeatured,
      categoryId: p.category?.id ?? "",
      accessLevel: p.accessLevel,
      tagIds: p.tags.map((t) => t.tag.id),
      imageUrls: p.images?.map((i) => i.url) ?? [],
    });
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const body = {
      name: editing.name,
      brand: editing.brand || undefined,
      description: editing.description || undefined,
      price: Number(editing.price) || 0,
      promoPrice: editing.promoPrice ? Number(editing.promoPrice) : null,
      saleStartsAt: editing.saleStartsAt ? new Date(editing.saleStartsAt).toISOString() : null,
      saleEndsAt: editing.saleEndsAt ? new Date(editing.saleEndsAt).toISOString() : null,
      sku: editing.sku || undefined,
      stock: Number(editing.stock) || 0,
      status: editing.status,
      isFeatured: editing.isFeatured,
      categoryId: editing.categoryId || null,
      accessLevel: editing.accessLevel,
      tagIds: editing.tagIds,
      imageUrls: editing.imageUrls,
    };
    try {
      if (editing.id) {
        await api(`/api/products/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/products", { method: "POST", body: JSON.stringify(body) });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!(await confirmAction("Excluir este produto?"))) return;
    await api(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  function toggleTag(id: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      tagIds: editing.tagIds.includes(id)
        ? editing.tagIds.filter((t) => t !== id)
        : [...editing.tagIds, id],
    });
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await api("/api/products/categories", { method: "POST", body: JSON.stringify({ name }) });
      setNewCategory("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar categoria");
    }
  }

  async function removeCategory(id: string) {
    if (!(await confirmAction("Excluir esta categoria?"))) return;
    try {
      await api(`/api/products/categories/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir categoria");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Package className="h-6 w-6 text-primary-700" /> Shop Odontus
            <InfoPopover
              title="Como funciona"
              text="A loja exibida em /loja. Em 'Produtos' você cadastra os itens vendidos. Em 'Categorias' organiza os produtos. Em 'Pedidos' acompanha as compras dos alunos; você pode excluir pedidos e ver o total faturado. Compras geram comissão automática para o afiliado que indicou o aluno."
            />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre produtos de odontologia, kits, uniformes e materiais.
          </p>
        </div>
        {tab === "produtos" && (
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        {(
          [
            ["produtos", "Produtos"],
            ["categorias", "Categorias"],
            ["pedidos", "Pedidos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key
                ? "bg-primary-700 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            )}
          >
            {key === "pedidos" && <ShoppingCart className="mr-1.5 inline h-4 w-4" />}
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {tab === "produtos" && (
        <>
      {editing && (
        <Card className="mt-6 border-primary-200">
          <CardHeader>
            <CardTitle>{editing.id ? "Editar produto" : "Novo produto"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço promocional (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editing.promoPrice}
                  onChange={(e) => setEditing({ ...editing, promoPrice: e.target.value })}
                  placeholder="Deixe vazio se não houver desconto"
                />
              </div>
              <div className="space-y-2">
                <Label>Início da promoção</Label>
                <Input
                  type="datetime-local"
                  value={editing.saleStartsAt}
                  onChange={(e) => setEditing({ ...editing, saleStartsAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground/80">
                  Quando a promoção começa. Deixe vazio para começar imediatamente.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Fim da promoção (temporizador)</Label>
                <Input
                  type="datetime-local"
                  value={editing.saleEndsAt}
                  onChange={(e) => setEditing({ ...editing, saleEndsAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground/80">
                  Data/hora em que a contagem regressiva termina. Deixe vazio para não exibir.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Arquivado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <Select value={editing.accessLevel} onChange={(e) => setEditing({ ...editing, accessLevel: e.target.value })}>
                  <option value="PUBLIC">Público</option>
                  <option value="MEMBER">Membro</option>
                  <option value="PREMIUM">Premium</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="featured"
                type="checkbox"
                checked={editing.isFeatured}
                onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary-700 focus:ring-primary-500"
              />
              <Label htmlFor="featured">Produto em destaque</Label>
            </div>

            <ImagePicker
              value={editing.imageUrls}
              onChange={(urls) => setEditing({ ...editing, imageUrls: urls })}
              label="Imagens do produto (upload ou link)"
            />

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      editing.tagIds.includes(tag.id)
                        ? "bg-primary-700 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !editing.name}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Produtos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Preço</th>
                  <th className="px-5 py-3">Estoque</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground/80">Carregando...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground/80">
                      Nenhum produto cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/50">
                      <td className="max-w-[260px] px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.images && p.images.length > 0 ? (
                            <img
                              src={p.images[0].url}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/80">
                              <Package className="h-5 w-5" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground/80">{p.brand ?? "—"}{p.isFeatured ? " • Destaque" : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        {p.promoPrice != null && Number(p.promoPrice) < Number(p.price) ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-emerald-700">{formatPrice(p.promoPrice)}</span>
                            <span className="text-xs text-muted-foreground/80 line-through">{formatPrice(p.price)}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">{formatPrice(p.price)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={p.stock > 0 ? "free" : "outline"}>{p.stock > 0 ? `${p.stock} em estoque` : "Sem estoque"}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={p.status === "PUBLISHED" ? "default" : "outline"}>{p.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="text-red-600" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page} de {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Próxima
        </Button>
      </div>
        </>
      )}

      {tab === "categorias" && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex.: Kits, Uniformes, Instrumentais"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              />
              <Button onClick={addCategory} disabled={!newCategory.trim()}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground"
                >
                  {c.name}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                    {c._count?.products ?? 0} produtos
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCategory(c.id)}
                    className="text-muted-foreground/80 transition-colors hover:text-red-600"
                    title="Excluir categoria"
                    aria-label={`Excluir categoria ${c.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground/80">Nenhuma categoria criada ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "pedidos" && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Pedido</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Itens</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground/80">
                        Nenhum pedido realizado ainda.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/50">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs text-foreground">#{o.id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground/80">{formatDate(o.createdAt)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">{o.user?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground/80">{o.user?.email ?? ""}</p>
                        </td>
                        <td className="max-w-[280px] px-5 py-3">
                          <ul className="space-y-0.5 text-xs text-muted-foreground">
                            {o.items.map((it) => (
                              <li key={it.id}>
                                {it.quantity}× {it.product.name}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground">
                          {formatPrice(o.total)}
                          {Number(o.discount) > 0 && (
                            <span className="block text-xs font-normal text-emerald-700">
                              -{formatPrice(o.discount)} desconto
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={o.status === "PAID" ? "default" : o.status === "CANCELED" ? "outline" : "free"}>
                            {o.status === "PAID" ? "Pago" : o.status === "CANCELED" ? "Cancelado" : o.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(o.id)}
                            className="rounded-lg p-2 text-muted-foreground/80 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label={`Excluir pedido ${o.id.slice(-8).toUpperCase()}`}
                            title="Excluir pedido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
