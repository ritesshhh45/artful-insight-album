import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, btnGhost, card, h1, input, label } from "@/lib/admin-ui";
import { inr, type Coupon } from "@/lib/store";

export const Route = createFileRoute("/admin/coupons")({ component: Coupons });

type Draft = {
  id?: string;
  code: string;
  description: string;
  discount_type: string;
  value: number;
  min_order: number;
  max_discount: number | null;
  starts_at: string;
  expires_at: string;
  is_automatic: boolean;
  is_active: boolean;
};

const empty = (): Draft => ({
  code: "",
  description: "",
  discount_type: "percent",
  value: 10,
  min_order: 0,
  max_discount: null,
  starts_at: "",
  expires_at: "",
  is_automatic: false,
  is_active: true,
});

function Coupons() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Coupon[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = {
        code: d.code.trim().toUpperCase(),
        description: d.description,
        discount_type: d.discount_type,
        value: Number(d.value),
        min_order: Number(d.min_order),
        max_discount: d.max_discount ? Number(d.max_discount) : null,
        expires_at: d.expires_at ? new Date(d.expires_at).toISOString() : null,
        is_active: d.is_active,
      };
      const { error } = d.id
        ? await supabase.from("coupons").update(payload).eq("id", d.id)
        : await supabase.from("coupons").insert(payload);
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
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>COUPONS</h1>
        <button className={btn} onClick={() => setDraft(empty())}>
          + NEW COUPON
        </button>
      </div>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}

      {draft && (
        <div className={card}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className={label}>CODE</p>
              <input
                className={input}
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <p className={label}>DESCRIPTION</p>
              <input
                className={input}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div>
              <p className={label}>TYPE</p>
              <select
                className={input}
                value={draft.discount_type}
                onChange={(e) => setDraft({ ...draft, discount_type: e.target.value })}
              >
                <option value="percent">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </div>
            <div>
              <p className={label}>VALUE</p>
              <input
                type="number"
                className={input}
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
              />
            </div>
            <div>
              <p className={label}>MINIMUM ORDER (₹)</p>
              <input
                type="number"
                className={input}
                value={draft.min_order}
                onChange={(e) => setDraft({ ...draft, min_order: Number(e.target.value) })}
              />
            </div>
            <div>
              <p className={label}>MAXIMUM DISCOUNT (₹, optional)</p>
              <input
                type="number"
                className={input}
                value={draft.max_discount ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    max_discount: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <p className={label}>EXPIRY (optional)</p>
              <input
                type="date"
                className={input}
                value={draft.expires_at}
                onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })}
              />
            </div>
            <label className="mt-6 flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button className={btn} disabled={!draft.code} onClick={() => save.mutate(draft)}>
              SAVE COUPON
            </button>
            <button className={btnGhost} onClick={() => setDraft(null)}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className={`${card} flex flex-wrap items-center gap-4`}>
            <span className="text-sm font-bold tracking-[0.15em]">{c.code}</span>
            <span className="text-[12px] text-muted-foreground">
              {c.discount_type === "flat" ? inr(c.value) : `${c.value}%`} off
              {c.min_order ? ` · min ${inr(c.min_order)}` : ""}
              {c.expires_at
                ? ` · till ${new Date(c.expires_at).toLocaleDateString("en-IN")}`
                : ""}
            </span>
            <span
              className={`text-[10px] font-bold tracking-[0.2em] ${
                c.is_active ? "text-muted-foreground" : "text-accent"
              }`}
            >
              {c.is_active ? "ACTIVE" : "INACTIVE"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                className={btnGhost}
                onClick={() =>
                  setDraft({
                    id: c.id,
                    code: c.code,
                    description: c.description ?? "",
                    discount_type: c.discount_type,
                    value: c.value,
                    min_order: c.min_order,
                    max_discount: c.max_discount,
                    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
                    is_active: c.is_active,
                  })
                }
              >
                EDIT
              </button>
              <button
                className="text-[10px] font-bold tracking-[0.2em] text-accent"
                onClick={() => {
                  if (confirm(`Delete ${c.code}?`)) del.mutate(c.id);
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
