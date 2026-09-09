import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { card, h1 } from "@/lib/admin-ui";
import { inr, productsQuery, totalStock } from "@/lib/store";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

type OrderRow = {
  id: string;
  order_no: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

function Dashboard() {
  const { data: products = [] } = useQuery(productsQuery(true));
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_no, customer_name, total, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const revenue = orders
    .filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status))
    .reduce((s, o) => s + Number(o.total), 0);
  const pending = orders.filter((o) => ["NEW", "CONFIRMED", "PROCESSING"].includes(o.status)).length;
  const lowStock = products.filter((p) => totalStock(p) <= 5);

  const stats = [
    ["TOTAL ORDERS", String(orders.length)],
    ["REVENUE", inr(revenue)],
    ["PENDING ORDERS", String(pending)],
    ["LIVE PRODUCTS", String(products.filter((p) => p.is_active).length)],
  ];

  return (
    <div className="space-y-8">
      <h1 className={h1}>DASHBOARD</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([t, v]) => (
          <div key={t} className={card}>
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">{t}</p>
            <p className="mt-3 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.2em]">RECENT ORDERS</p>
            <Link to="/admin/orders" className="text-[10px] tracking-[0.18em] text-accent">
              VIEW ALL
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-[12px]">
                <span className="font-semibold">#{o.order_no}</span>
                <span className="truncate px-3 text-muted-foreground">{o.customer_name}</span>
                <span>{inr(Number(o.total))}</span>
                <span className="ml-3 text-[10px] tracking-[0.15em] text-accent">{o.status}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.2em]">LOW STOCK</p>
            <Link to="/admin/inventory" className="text-[10px] tracking-[0.18em] text-accent">
              MANAGE
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-[12px]">
                <span className="truncate pr-3">{p.name}</span>
                <span className="font-bold">{totalStock(p)} left</span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">Everything is well stocked.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
