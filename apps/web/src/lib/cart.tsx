import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "../types";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  price: number;
  promoPrice?: number | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "odonto_shop_cart";

function unitPrice(p: { price: string | number; promoPrice?: string | number | null }) {
  const price = Number(p.price);
  const promo = Number(p.promoPrice);
  return promo > 0 && promo < price ? promo : price;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  function addItem(product: Product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i
        );
      }
      const img = product.images?.[0]?.url ?? null;
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          image: img,
          price: Number(product.price),
          promoPrice: product.promoPrice != null ? Number(product.promoPrice) : null,
          quantity,
        },
      ];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(99, quantity)) } : i))
    );
  }

  function clear() {
    setItems([]);
  }

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = items.reduce((sum, i) => {
      const promo = i.promoPrice && i.promoPrice < i.price ? i.promoPrice : i.price;
      return sum + (i.price - promo) * i.quantity;
    }, 0);
    const total = Math.max(0, subtotal - discount);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, count, subtotal, discount, total, addItem, removeItem, setQuantity, clear };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}

export { unitPrice };