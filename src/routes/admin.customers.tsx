import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { card, h1 } from "@/lib/admin-ui";
import { inr } from "@/lib/store";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

type Row = {
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  total: number;
  created_at: string;
};

function Customers() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name, phone, email, city, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const map = new Map<
    string,
    { name: string; phone: string; email: string; city: string; orders: number; spend: number; last: string }
  >();
  for (const r of data) {
    const key = r.phone || r.email || r.customer_name;
    const found = map.get(key);
    if (found) {
      found.orders += 1;
      found.spend += Number(r.total);
    } else {
      map.set(key, {
        name: r.customer_name,
        phone: r.phone,
        email: r.email ?? "",
        city: r.city,
        orders: 1,
        spend: Number(r.total),
        last: r.created_at,
      });
    }
  }
  const customers = [...map.values()].sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-6">
      <h1 className={h1}>CUSTOMERS</h1>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && customers.length === 0 && (
        <p className="text-sm text-muted-foreground">No customers yet.</p>
      )}
      <div className={`${card} overflow-x-auto`}>
        {customers.length > 0 && (
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="pb-3">NAME</th>
                <th className="pb-3">PHONE</th>
                <th className="pb-3">CITY</th>
                <th className="pb-3">ORDERS</th>
                <th className="pb-3">SPEND</th>
                <th className="pb-3">LAST ORDER</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone + c.name} className="border-t border-border">
                  <td className="py-3 font-semibold">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td>{c.orders}</td>
                  <td className="font-bold">{inr(c.spend)}</td>
                  <td>{new Date(c.last).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
