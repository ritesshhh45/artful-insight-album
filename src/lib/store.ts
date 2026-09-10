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
  starts_at: string | null;
  is_automatic: boolean;
  is_active: boolean;
  description: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_active: boolean;
};

export type Collection = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  image: string;
  position: number;
  is_active: boolean;
  show_on_home: boolean;
  collection_products?: { product_id: string; position: number }[];
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
  story_title: string;
  story_text: string;
  story_image: string;
  final_cta_title: string;
  final_cta_text: string;
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
  story_title: "THE 11:11 MOMENT",
  story_text: "“11:11 is a moment to make a wish, make a choice, and make it yours.”",
  story_image: "",
  final_cta_title: "MAKE YOUR\n11:11 MOMENT.",
  final_cta_text: "SHOP THE COLLECTION",
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

export function couponLive(coupon: Coupon, when = new Date()): boolean {
  if (!coupon.is_active) return false;
  if (coupon.starts_at && new Date(coupon.starts_at) > when) return false;
  if (coupon.expires_at && new Date(coupon.expires_at) < when) return false;
  return true;
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (!couponLive(coupon)) return 0;
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
    .eq("is_automatic", false)
    .maybeSingle();
  return (data as unknown as Coupon) ?? null;
}

/** Festival-style offers that apply without the customer typing a code. */
export async function fetchAutoCoupons(): Promise<Coupon[]> {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .eq("is_automatic", true);
  return ((data ?? []) as unknown as Coupon[]).filter((c) => couponLive(c));
}

export const autoCouponsQuery = () => ({
  queryKey: ["auto-coupons"],
  queryFn: fetchAutoCoupons,
});

/** Picks the automatic offer that saves the customer the most. */
export function bestAutoDiscount(
  coupons: Coupon[],
  subtotal: number,
): { coupon: Coupon; off: number } | null {
  let best: { coupon: Coupon; off: number } | null = null;
  for (const c of coupons) {
    const off = couponDiscount(c, subtotal);
    if (off > 0 && (!best || off > best.off)) best = { coupon: c, off };
  }
  return best;
}

export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  let q = supabase.from("categories").select("*").order("position").order("name");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Category[];
}

export const categoriesQuery = (includeInactive = false) => ({
  queryKey: ["categories", includeInactive],
  queryFn: () => fetchCategories(includeInactive),
});

export async function fetchCollections(includeInactive = false): Promise<Collection[]> {
  let q = supabase
    .from("collections")
    .select("*, collection_products(product_id, position)")
    .order("position");
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Collection[];
}

export const collectionsQuery = (includeInactive = false) => ({
  queryKey: ["collections", includeInactive],
  queryFn: () => fetchCollections(includeInactive),
});

/** Products chosen for a section, in the order the owner arranged them. */
export function collectionProducts(collection: Collection, products: Product[]): Product[] {
  const links = [...(collection.collection_products ?? [])].sort((a, b) => a.position - b.position);
  return links
    .map((l) => products.find((p) => p.id === l.product_id))
    .filter((p): p is Product => !!p && p.is_active);
}
