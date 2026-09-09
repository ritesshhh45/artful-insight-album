import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, card, h1 } from "@/lib/admin-ui";
import { productsQuery, stockFor, totalStock } from "@/lib/store";

export const Route = createFileRoute("/admin/inventory")({ component: Inventory });

function Inventory() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery(true));
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      for (const [key, stock] of Object.entries(edits)) {
        const [product_id, size] = key.split("|") as [string, string];
        const { error } = await supabase
          .from("product_stock")
          .upsert({ product_id, size, stock }, { onConflict: "product_id,size" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEdits({});
      setMsg("Stock updated.");
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>INVENTORY</h1>
        <button
          className={btn}
          disabled={!Object.keys(edits).length || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "SAVING…" : "SAVE CHANGES"}
        </button>
      </div>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] font-semibold">{p.name}</p>
              <span
                className={`text-[11px] font-bold tracking-[0.15em] ${
                  totalStock(p) === 0
                    ? "text-accent"
                    : totalStock(p) <= 5
                      ? "text-accent"
                      : "text-muted-foreground"
                }`}
              >
                {totalStock(p) === 0 ? "OUT OF STOCK" : `${totalStock(p)} TOTAL`}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              {p.sizes.map((s) => {
                const key = `${p.id}|${s}`;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-[0.15em]">{s}</span>
                    <input
                      type="number"
                      value={edits[key] ?? stockFor(p, s)}
                      onChange={(e) => setEdits({ ...edits, [key]: Number(e.target.value) })}
                      className="w-20 border border-input bg-transparent px-2 py-2 text-sm outline-none focus:border-foreground"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
