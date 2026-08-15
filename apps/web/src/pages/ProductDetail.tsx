import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Check,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import type { Product } from "../types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CountdownTimer } from "../components/CountdownTimer";
import { cn, formatPrice, resolveImageUrl } from "../lib/utils";

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");
    api<Product>(`/api/products/${slug}`, { skipAuth: true })
      .then((d) => setProduct(d))
      .catch(() => setError("Não foi possível carregar o produto."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Produto não encontrado</h1>
        <p className="mt-2 text-muted-foreground">{error || "O produto que você procura não existe ou não está disponível."}</p>
        <Link to="/loja">
          <Button className="mt-6">
            <ChevronLeft className="h-4 w-4" /> Voltar para o Shop
          </Button>
        </Link>
      </div>
    );
  }

  const price = Number(product.price);
  const promo = Number(product.promoPrice);
  const hasPromo = promo > 0 && promo < price;
  const discount = hasPromo ? Math.round((1 - promo / price) * 100) : 0;
  const images = product.images ?? [];
  const imgUrl = images[selectedImage]?.url ?? images[0]?.url;

  function handleAdd() {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuy() {
    if (!product) return;
    addItem(product, quantity);
    navigate("/checkout-loja");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <span>/</span>
        <Link to="/loja" className="hover:text-foreground">Shop Odontus</Link>
        {product.category && (
          <>
            <span>/</span>
            <span>{product.category.name}</span>
          </>
        )}
        <span>/</span>
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <Link to="/loja" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400">
        <ChevronLeft className="h-4 w-4" /> Voltar ao Shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galeria */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
            {discount > 0 && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                -{discount}%
              </span>
            )}
            {imgUrl ? (
              <img
                src={resolveImageUrl(imgUrl)}
                alt={product.name}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-muted-foreground">
                <Package className="h-16 w-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "h-20 w-20 overflow-hidden rounded-xl border-2 bg-muted transition-colors",
                    i === selectedImage ? "border-primary-600" : "border-transparent hover:border-primary-300"
                  )}
                >
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.alt ?? product.name}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <Badge variant="outline" className="uppercase tracking-wide">{product.brand}</Badge>
            )}
            {product.category && <Badge>{product.category.name}</Badge>}
            {product.stock <= 0 && <Badge variant="danger">Esgotado</Badge>}
            {product.stock > 0 && product.stock <= 10 && (
              <Badge variant="danger">Restam {product.stock} un.</Badge>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            {hasPromo && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
            )}
            <span className="font-display text-4xl font-bold text-foreground">
              {formatPrice(hasPromo ? product.promoPrice : product.price)}
            </span>
          </div>
          {hasPromo && (
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
              Economize {formatPrice(price - promo)} ({discount}% de desconto)
            </p>
          )}
          {product.saleEndsAt && (
            <CountdownTimer startsAt={product.saleStartsAt} endsAt={product.saleEndsAt} className="mt-3" />
          )}

          <div className="mt-6 space-y-4">
            {/* Quantidade + ações */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={product.stock <= 0}
                  className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  disabled={product.stock <= 0}
                  className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button variant="outline" size="lg" className="flex-1 sm:flex-none" disabled={product.stock <= 0} onClick={handleAdd}>
                {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                {added ? "Adicionado" : "Adicionar ao carrinho"}
              </Button>
              <Button size="lg" className="flex-1 sm:flex-none" disabled={product.stock <= 0} onClick={handleBuy}>
                Comprar agora
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {product.stock > 0
                ? `Em estoque — ${product.stock} unidade${product.stock === 1 ? "" : "s"} disponíve${product.stock === 1 ? "l" : "is"}.`
                : "Produto esgotado no momento."}
            </p>

            {/* Benefícios */}
            <div className="grid gap-3 rounded-xl border border-border bg-muted/50 p-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 shrink-0 text-primary-700 dark:text-primary-400" /> Envio em até 7 dias
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary-700 dark:text-primary-400" /> Compra segura
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RotateCcw className="h-4 w-4 shrink-0 text-primary-700 dark:text-primary-400" /> Troca em 30 dias
              </div>
            </div>
          </div>

          {/* Descrição */}
          {product.description && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-foreground">Descrição do produto</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}

          {/* Tags + SKU */}
          {(product.sku || product.tags.length > 0) && (
            <div className="mt-8 border-t border-border pt-5 text-sm">
              {product.sku && (
                <p className="text-muted-foreground">
                  SKU: <span className="font-medium text-foreground">{product.sku}</span>
                </p>
              )}
              {product.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.tags.map(({ tag }) => (
                    <span key={tag.id} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}