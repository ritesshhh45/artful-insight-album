import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FREE_SHIPPING, SHIPPING_FEE, type Product } from "./store";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  colour: string;
  qty: number;
};

type CartCtx = {
  items: CartLine[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (product: Product, size: string, colour?: string, qty?: number) => void;
  remove: (productId: string, size: string) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "1111-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
    return {
      items,
      open,
      setOpen,
      count: items.reduce((s, l) => s + l.qty, 0),
      subtotal,
      shipping: subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE,
      add: (product, size, colour, qty = 1) => {
        setItems((prev) => {
          const found = prev.find((l) => l.productId === product.id && l.size === size);
          if (found)
            return prev.map((l) => (l === found ? { ...l, qty: l.qty + qty } : l));
          return [
            ...prev,
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images[0] ?? "",
              size,
              colour: colour ?? product.colours[0] ?? "",
              qty,
            },
          ];
        });
        setOpen(true);
      },
      remove: (productId, size) =>
        setItems((prev) => prev.filter((l) => !(l.productId === productId && l.size === size))),
      setQty: (productId, size, qty) =>
        setItems((prev) =>
          prev
            .map((l) => (l.productId === productId && l.size === size ? { ...l, qty } : l))
            .filter((l) => l.qty > 0),
        ),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export { FREE_SHIPPING };
