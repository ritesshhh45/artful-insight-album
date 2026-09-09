import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { card, h1, input } from "@/lib/admin-ui";
import { inr, ORDER_STATUSES } from "@/lib/store";

export const Route = createFileRoute("/admin/orders")({ component: Orders });

type Item = { id: string; name: string; size: string; colour: string; qty: number; price: number };
type Order = {
  id: string;
  order_no: number;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  payment_method: string;
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  created_at: string;
  order_items: Item[];
};

function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-orders-full"] });
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const shown = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <h1 className={h1}>ORDERS</h1>

      <div className="flex flex-wrap gap-2">
        {["ALL", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`border px-3 py-2 text-[10px] font-bold tracking-[0.18em] ${
              filter === s ? "border-foreground bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && shown.length === 0 && (
        <p className="text-sm text-muted-foreground">No orders here yet.</p>
      )}

      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className={card}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                onClick={() => setOpenId(openId === o.id ? null : o.id)}
                className="text-sm font-bold"
              >
                #{o.order_no}
              </button>
              <span className="text-[12px]">{o.customer_name}</span>
              <span className="text-[12px] text-muted-foreground">{o.phone}</span>
              <span className="text-[12px] text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("en-IN")}
              </span>
              <span className="text-[12px] font-bold">{inr(Number(o.total))}</span>
              <span className="text-[11px] tracking-[0.15em] text-muted-foreground">
                {o.payment_method}
              </span>
              <select
                value={o.status}
                onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })}
                className={`${input} ml-auto w-auto`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {openId === o.id && (
              <div className="mt-5 grid gap-6 border-t border-border pt-5 md:grid-cols-2">
                <div className="text-[12px] leading-relaxed">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
                    DELIVERY
                  </p>
                  <p className="mt-2">{o.customer_name}</p>
                  <p>{o.address}</p>
                  <p>
                    {o.city} — {o.pincode}
                  </p>
                  <p>{o.phone}</p>
                  {o.email && <p>{o.email}</p>}
                </div>
                <div className="text-[12px]">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
                    ITEMS
                  </p>
                  <div className="mt-2 space-y-1">
                    {o.order_items?.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>
                          {it.name} · {it.size} × {it.qty}
                        </span>
                        <span>{inr(Number(it.price) * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1 border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{inr(Number(o.subtotal))}</span>
                    </div>
                    {Number(o.discount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Discount {o.coupon_code ? `(${o.coupon_code})` : ""}
                        </span>
                        <span>−{inr(Number(o.discount))}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{Number(o.shipping) === 0 ? "FREE" : inr(Number(o.shipping))}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{inr(Number(o.total))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
