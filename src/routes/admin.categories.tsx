import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, btnGhost, card, h1, input, label } from "@/lib/admin-ui";
import { categoriesQuery, productsQuery, type Category } from "@/lib/store";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

type Draft = { id?: string; name: string; slug: string; position: number; is_active: boolean };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const empty = (): Draft => ({ name: "", slug: "", position: 0, is_active: true });

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery(true));
  const { data: products = [] } = useQuery(productsQuery(true));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        name: d.name.trim(),
        slug: d.slug || slugify(d.name),
        position: Number(d.position),
        is_active: d.is_active,
      };
      const { error } = d.id
        ? await supabase.from("categories").update(payload).eq("id", d.id)
        : await supabase.from("categories").insert(payload);
      if (error) throw error;
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
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => setMsg(e.message),
  });

  const count = (c: Category) => products.filter((p) => p.category === c.name).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>CATEGORIES</h1>
        <button className={btn} onClick={() => setDraft(empty())}>
          + NEW CATEGORY
        </button>
      </div>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}

      {draft && (
        <div className={card}>
          <div className="grid gap-4 md:grid-cols-3">
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
            <div>
              <p className={label}>ORDER</p>
              <input
                type="number"
                className={input}
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              />
              Show on the website
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button className={btn} disabled={!draft.name} onClick={() => save.mutate(draft)}>
              SAVE CATEGORY
            </button>
            <button className={btnGhost} onClick={() => setDraft(null)}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className={`${card} flex flex-wrap items-center gap-4`}>
            <span className="text-[13px] font-semibold">{c.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {count(c)} products{c.is_active ? "" : " · HIDDEN"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                className={btnGhost}
                onClick={() =>
                  setDraft({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    position: c.position,
                    is_active: c.is_active,
                  })
                }
              >
                EDIT
              </button>
              <button
                className="text-[10px] font-bold tracking-[0.2em] text-accent"
                onClick={() => {
                  if (confirm(`Delete ${c.name}?`)) del.mutate(c.id);
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
