import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, btnGhost, card, h1, input, label } from "@/lib/admin-ui";
import { imageUrl, onImageError } from "@/lib/img";
import {
  ALL_SIZES,
  CATEGORIES,
  FITS,
  discount,
  inr,
  productsQuery,
  totalStock,
  type Product,
} from "@/lib/store";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  fit: string;
  price: number;
  mrp: number;
  colours: string;
  sizes: string[];
  images: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  stock: Record<string, number>;
};

const empty = (): Draft => ({
  name: "",
  slug: "",
  description: "",
  category: "Tees",
  fit: "OVERSIZED",
  price: 0,
  mrp: 0,
  colours: "",
  sizes: ["S", "M", "L", "XL"],
  images: [],
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: true,
  is_active: true,
  stock: {},
});

const toDraft = (p: Product): Draft => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  category: p.category,
  fit: p.fit,
  price: p.price,
  mrp: p.mrp,
  colours: p.colours.join(", "),
  sizes: p.sizes,
  images: p.images,
  is_featured: p.is_featured,
  is_best_seller: p.is_best_seller,
  is_new_arrival: p.is_new_arrival,
  is_active: p.is_active,
  stock: Object.fromEntries((p.product_stock ?? []).map((s) => [s.size, s.stock])),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery(productsQuery(true));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name,
        slug: d.slug || slugify(d.name),
        description: d.description,
        category: d.category,
        fit: d.fit,
        price: Number(d.price),
        mrp: Number(d.mrp),
        colours: d.colours
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        sizes: d.sizes,
        images: d.images,
        is_featured: d.is_featured,
        is_best_seller: d.is_best_seller,
        is_new_arrival: d.is_new_arrival,
        is_active: d.is_active,
      };

      let id = d.id;
      if (id) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        id = data.id as string;
      }

      await supabase.from("product_stock").delete().eq("product_id", id);
      if (d.sizes.length) {
        const { error } = await supabase.from("product_stock").insert(
          d.sizes.map((size) => ({
            product_id: id,
            size,
            stock: Number(d.stock[size] ?? 0),
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setMsg("Saved.");
      setDraft(null);
      void refresh();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => setMsg(e.message),
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length || !draft) return;
    setUploading(true);
    setMsg(null);
    const paths: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        setUploading(false);
        setMsg(`Upload failed: ${error.message}`);
        return;
      }
      paths.push(await storageUrl(supabase, path));
    }
    setDraft({ ...draft, images: [...draft.images, ...paths] });
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>PRODUCTS</h1>
        <button onClick={() => setDraft(empty())} className={btn}>
          + NEW PRODUCT
        </button>
      </div>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {draft && (
        <div className={card}>
          <p className="text-[11px] font-bold tracking-[0.2em]">
            {draft.id ? "EDIT PRODUCT" : "NEW PRODUCT"}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className={label}>NAME</p>
              <input
                className={input}
                value={draft.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value,
                    slug: draft.id ? draft.slug : slugify(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <p className={label}>URL SLUG</p>
              <input
                className={input}
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <p className={label}>DESCRIPTION</p>
              <textarea
                rows={3}
                className={input}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div>
              <p className={label}>CATEGORY</p>
              <select
                className={input}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <p className={label}>FIT</p>
              <select
                className={input}
                value={draft.fit}
                onChange={(e) => setDraft({ ...draft, fit: e.target.value })}
              >
                {FITS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <p className={label}>PRICE (₹)</p>
              <input
                type="number"
                className={input}
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <p className={label}>ORIGINAL PRICE (₹)</p>
              <input
                type="number"
                className={input}
                value={draft.mrp}
                onChange={(e) => setDraft({ ...draft, mrp: Number(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Discount shown: {discount({ price: draft.price, mrp: draft.mrp })}%
              </p>
            </div>
            <div className="md:col-span-2">
              <p className={label}>COLOURS (comma separated)</p>
              <input
                className={input}
                value={draft.colours}
                onChange={(e) => setDraft({ ...draft, colours: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <p className={label}>SIZES & STOCK</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {ALL_SIZES.map((s) => {
                  const on = draft.sizes.includes(s);
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            sizes: on ? draft.sizes.filter((x) => x !== s) : [...draft.sizes, s],
                          })
                        }
                        className={`h-10 w-10 border text-[12px] font-bold ${
                          on ? "border-foreground bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {s}
                      </button>
                      {on && (
                        <input
                          type="number"
                          className="w-16 border border-input bg-transparent px-2 py-2 text-sm outline-none focus:border-foreground"
                          value={draft.stock[s] ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              stock: { ...draft.stock, [s]: Number(e.target.value) },
                            })
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <p className={label}>IMAGES</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {draft.images.map((img) => (
                  <div key={img} className="relative">
                    <img
                      src={imageUrl(img)}
                      onError={onImageError}
                      alt="Product"
                      className="h-24 w-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, images: draft.images.filter((i) => i !== img) })
                      }
                      className="absolute right-0 top-0 bg-ink px-1.5 text-[10px] text-primary-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void upload(e.target.files)}
                className="mt-3 text-xs"
              />
              {uploading && <p className="mt-2 text-[11px] text-accent">Uploading…</p>}
            </div>

            <div className="flex flex-wrap gap-5 md:col-span-2">
              {(
                [
                  ["is_featured", "Featured"],
                  ["is_best_seller", "Best seller"],
                  ["is_new_arrival", "New arrival"],
                  ["is_active", "Visible in store"],
                ] as const
              ).map(([k, t]) => (
                <label key={k} className="flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={draft[k]}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.checked })}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              className={btn}
              disabled={save.isPending || !draft.name}
              onClick={() => save.mutate(draft)}
            >
              {save.isPending ? "SAVING…" : "SAVE PRODUCT"}
            </button>
            <button className={btnGhost} onClick={() => setDraft(null)}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className={`${card} flex flex-wrap items-center gap-4`}>
            <img
              src={imageUrl(p.images[0])}
              onError={onImageError}
              alt={p.name}
              className="h-16 w-14 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{p.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {p.category} · {p.fit} · {totalStock(p)} in stock
                {p.is_active ? "" : " · HIDDEN"}
              </p>
            </div>
            <span className="text-[13px] font-bold">{inr(p.price)}</span>
            <button className={btnGhost} onClick={() => setDraft(toDraft(p))}>
              EDIT
            </button>
            <button
              className="text-[10px] font-bold tracking-[0.2em] text-accent"
              onClick={() => {
                if (confirm(`Delete ${p.name}?`)) del.mutate(p.id);
              }}
            >
              DELETE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
