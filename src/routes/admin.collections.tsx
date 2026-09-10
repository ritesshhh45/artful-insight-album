import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, btnGhost, card, h1, input, label } from "@/lib/admin-ui";
import { imageUrl, onImageError, storageUrl } from "@/lib/img";
import { collectionsQuery, productsQuery, type Collection } from "@/lib/store";

export const Route = createFileRoute("/admin/collections")({ component: AdminCollections });

type Draft = {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  image: string;
  position: number;
  is_active: boolean;
  show_on_home: boolean;
  productIds: string[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const empty = (): Draft => ({
  title: "",
  slug: "",
  subtitle: "",
  image: "",
  position: 0,
  is_active: true,
  show_on_home: true,
  productIds: [],
});

const toDraft = (c: Collection): Draft => ({
  id: c.id,
  title: c.title,
  slug: c.slug,
  subtitle: c.subtitle,
  image: c.image,
  position: c.position,
  is_active: c.is_active,
  show_on_home: c.show_on_home,
  productIds: [...(c.collection_products ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((l) => l.product_id),
});

function AdminCollections() {
  const qc = useQueryClient();
  const { data: collections = [] } = useQuery(collectionsQuery(true));
  const { data: products = [] } = useQuery(productsQuery(true));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["collections"] });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        title: d.title.trim(),
        slug: d.slug || slugify(d.title),
        subtitle: d.subtitle,
        image: d.image,
        position: Number(d.position),
        is_active: d.is_active,
        show_on_home: d.show_on_home,
      };
      let id = d.id;
      if (id) {
        const { error } = await supabase.from("collections").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("collections")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        id = data.id as string;
      }
      await supabase.from("collection_products").delete().eq("collection_id", id);
      if (d.productIds.length) {
        const { error } = await supabase.from("collection_products").insert(
          d.productIds.map((product_id, position) => ({
            collection_id: id as string,
            product_id,
            position,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setDraft(null);
      setMsg("Saved.");
      void refresh();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => setMsg(e.message),
  });

  const upload = async (file?: File) => {
    if (!file || !draft) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `collections/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setMsg(`Upload failed: ${error.message}`);
    setDraft({ ...draft, image: await storageUrl(supabase, path) });
  };

  const move = (index: number, dir: -1 | 1) => {
    if (!draft) return;
    const ids = [...draft.productIds];
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    const a = ids[index] as string;
    const b = ids[target] as string;
    ids[index] = b;
    ids[target] = a;
    setDraft({ ...draft, productIds: ids });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>COLLECTIONS</h1>
        <button className={btn} onClick={() => setDraft(empty())}>
          + NEW SECTION
        </button>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Sections shown here appear on the homepage in the order you set.
      </p>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}

      {draft && (
        <div className={card}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className={label}>TITLE</p>
              <input
                className={input}
                value={draft.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    title: e.target.value,
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
            <div>
              <p className={label}>SUBTITLE</p>
              <input
                className={input}
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              />
            </div>
            <div>
              <p className={label}>ORDER</p>
              <input
                type="number"
                className={input}
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
              />
            </div>
            <div>
              <p className={label}>SECTION IMAGE</p>
              {draft.image && (
                <img
                  src={imageUrl(draft.image)}
                  onError={onImageError}
                  alt="Section"
                  className="mt-2 h-24 w-20 object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="mt-2 text-xs"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
              {uploading && <p className="mt-1 text-[11px] text-accent">Uploading…</p>}
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={draft.show_on_home}
                  onChange={(e) => setDraft({ ...draft, show_on_home: e.target.checked })}
                />
                Show on homepage
              </label>
            </div>

            <div className="md:col-span-2">
              <p className={label}>PRODUCTS IN THIS SECTION</p>
              <div className="mt-2 space-y-2">
                {draft.productIds.map((id, i) => {
                  const p = products.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex items-center gap-3 border border-border px-3 py-2">
                      <span className="text-[12px]">{p?.name ?? "Removed product"}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <button className={btnGhost} onClick={() => move(i, -1)}>
                          ↑
                        </button>
                        <button className={btnGhost} onClick={() => move(i, 1)}>
                          ↓
                        </button>
                        <button
                          className="text-[10px] font-bold tracking-[0.2em] text-accent"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              productIds: draft.productIds.filter((x) => x !== id),
                            })
                          }
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <select
                className={`${input} mt-3`}
                value=""
                onChange={(e) => {
                  const id = e.target.value;
                  if (id && !draft.productIds.includes(id))
                    setDraft({ ...draft, productIds: [...draft.productIds, id] });
                }}
              >
                <option value="">+ Add a product…</option>
                {products
                  .filter((p) => !draft.productIds.includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              className={btn}
              disabled={!draft.title || save.isPending}
              onClick={() => save.mutate(draft)}
            >
              {save.isPending ? "SAVING…" : "SAVE SECTION"}
            </button>
            <button className={btnGhost} onClick={() => setDraft(null)}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {collections.map((c) => (
          <div key={c.id} className={`${card} flex flex-wrap items-center gap-4`}>
            <span className="text-[13px] font-semibold">{c.title}</span>
            <span className="text-[11px] text-muted-foreground">
              {(c.collection_products ?? []).length} products
              {c.is_active ? "" : " · DISABLED"}
              {c.show_on_home ? "" : " · not on homepage"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button className={btnGhost} onClick={() => setDraft(toDraft(c))}>
                EDIT
              </button>
              <button
                className="text-[10px] font-bold tracking-[0.2em] text-accent"
                onClick={() => {
                  if (confirm(`Delete ${c.title}?`)) del.mutate(c.id);
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
