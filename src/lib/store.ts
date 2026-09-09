import { supabase } from "@/integrations/supabase/client";

export type StockRow = { size: string; stock: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  fit: string;
  price: number;
  mrp: number;
  colours: string[];
  sizes: string[];
  images: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  position: number;
  product_stock?: StockRow[];
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_discount: number | null;
  expires_at: string | null;
  is_active: boolean;
  description: string;
};

export type Homepage = {
  announcement: string;
  hero_title: string;
  hero_subtitle: string;
  hero_eyebrow: string;
  hero_image: string;
  cta_text: string;
  cta_link: string;
  offer_title: string;
  offer_percent: number;
  offer_description: string;
  offer_code: string;
  offer_active: boolean;
};

export const DEFAULT_HOMEPAGE: Homepage = {
  announcement: "NEW DROP IS LIVE  •  FREE SHIPPING ABOVE ₹999",
  hero_title: "WEAR YOUR\nMOMENT.",
  hero_subtitle: "Modern men's fashion. Made for your everyday.",
  hero_eyebrow: "11:11 STORE",
  hero_image: "",
  cta_text: "SHOP NOW",
  cta_link: "/shop",
  offer_title: "GET 10% OFF YOUR FIRST ORDER",
  offer_percent: 10,
  offer_description: "Join the 11:11 list and unlock your first-order offer.",
  offer_code: "WELCOME10",
  offer_active: true,
};

export const FITS = ["OVERSIZED", "STRAIGHT FIT", "BAGGY", "RELAXED"] as const;
export const CATEGORIES = ["Tees", "Jerseys", "Vests", "Denim", "Accessories"] as const;
export const ALL_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const FREE_SHIPPING = 999;
export const SHIPPING_FEE = 79;

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const discount = (p: { price: number; mrp: number }) =>
  p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

export const stockFor = (p: Product, size: string) =>
  p.product_stock?.find((s) => s.size === size)?.stock ?? 0;
export const totalStock = (p: Product) =>
  (p.product_stock ?? []).reduce((s, r) => s + r.stock, 0);

const SELECT = "*, product_stock(size, stock)";

export async function fetchProducts(includeInactive = false): Promise<Product[]> {
  let q = supabase.from("products").select(SELECT).order("position");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Product) ?? null;
}

export async function fetchHomepage(): Promise<Homepage> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "homepage")
    .maybeSingle();
  return { ...DEFAULT_HOMEPAGE, ...((data?.value as Partial<Homepage>) ?? {}) };
}

export const productsQuery = (includeInactive = false) => ({
  queryKey: ["products", includeInactive],
  queryFn: () => fetchProducts(includeInactive),
});

export const homepageQuery = () => ({ queryKey: ["homepage"], queryFn: fetchHomepage });

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (!coupon.is_active) return 0;
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 0;
  if (subtotal < coupon.min_order) return 0;
  let off =
    coupon.discount_type === "flat" ? coupon.value : Math.round((subtotal * coupon.value) / 100);
  if (coupon.max_discount) off = Math.min(off, coupon.max_discount);
  return Math.min(off, subtotal);
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", code.trim())
    .eq("is_active", true)
    .maybeSingle();
  return (data as unknown as Coupon) ?? null;
}
