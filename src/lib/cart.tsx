import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { products, type Product } from "./products";

export type CartLine = { slug: string; size: string; qty: number };

type CartCtx = {
  lines: CartLine[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (slug: string, size: string) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  count: number;
  subtotal: number;
  items: { line: CartLine; product: Product }[];
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  const value = useMemo<CartCtx>(() => {
    const items = lines
      .map((line) => ({ line, product: products.find((p) => p.slug === line.slug)! }))
      .filter((i) => i.product);
    return {
      lines,
      open,
      setOpen,
      items,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: items.reduce((s, i) => s + i.product.price * i.line.qty, 0),
      add: (slug, size) => {
        setLines((prev) => {
          const found = prev.find((l) => l.slug === slug && l.size === size);
          if (found)
            return prev.map((l) => (l === found ? { ...l, qty: l.qty + 1 } : l));
          return [...prev, { slug, size, qty: 1 }];
        });
        setOpen(true);
      },
      remove: (slug, size) =>
        setLines((prev) => prev.filter((l) => !(l.slug === slug && l.size === size))),
      setQty: (slug, size, qty) =>
        setLines((prev) =>
          prev
            .map((l) => (l.slug === slug && l.size === size ? { ...l, qty } : l))
            .filter((l) => l.qty > 0),
        ),
    };
  }, [lines, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const FREE_SHIPPING = 999;
