import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  image: z.string().default(""),
  size: z.string().min(1),
  colour: z.string().default(""),
  qty: z.number().int().min(1).max(20),
});

const orderSchema = z.object({
  customer_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  email: z.string().email().or(z.literal("")).default(""),
  address: z.string().min(5).max(400),
  city: z.string().min(2).max(80),
  pincode: z.string().min(4).max(10),
  payment_method: z.enum(["UPI", "CARDS", "NET BANKING", "COD"]),
  coupon_code: z.string().max(40).nullable().default(null),
  items: z.array(lineSchema).min(1).max(30),
});

const FREE_SHIPPING = 999;
const SHIPPING_FEE = 79;

/**
 * Places an order. Prices, discounts and shipping are recalculated on the
 * server from the database so the client cannot influence what is charged.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, images, is_active, product_stock(size, stock)")
      .in("id", ids);
    if (productError) throw new Error("Could not load products.");

    type Row = {
      id: string;
      name: string;
      price: number;
      images: string[];
      is_active: boolean;
      product_stock: { size: string; stock: number }[];
    };
    const rows = (products ?? []) as unknown as Row[];

    const items = data.items.map((line) => {
      const p = rows.find((r) => r.id === line.productId);
      if (!p || !p.is_active) throw new Error(`${line.name} is no longer available.`);
      const stock = p.product_stock.find((s) => s.size === line.size)?.stock ?? 0;
      if (stock < line.qty) throw new Error(`${p.name} (${line.size}) is out of stock.`);
      return {
        product_id: p.id,
        name: p.name,
        image: p.images[0] ?? line.image,
        size: line.size,
        colour: line.colour,
        qty: line.qty,
        price: Number(p.price),
      };
    });

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

    let discount = 0;
    let code: string | null = null;
    if (data.coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .ilike("code", data.coupon_code)
        .eq("is_active", true)
        .maybeSingle();
      const c = coupon as
        | {
            code: string;
            discount_type: string;
            value: number;
            min_order: number;
            max_discount: number | null;
            expires_at: string | null;
          }
        | null;
      if (c && subtotal >= c.min_order && (!c.expires_at || new Date(c.expires_at) > new Date())) {
        discount =
          c.discount_type === "flat" ? c.value : Math.round((subtotal * c.value) / 100);
        if (c.max_discount) discount = Math.min(discount, c.max_discount);
        discount = Math.min(discount, subtotal);
        code = c.code;
      }
    }

    const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
    const total = subtotal - discount + shipping;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        payment_method: data.payment_method,
        coupon_code: code,
        subtotal,
        discount,
        shipping,
        total,
        status: "NEW",
      })
      .select("id, order_no")
      .single();
    if (orderError || !order) throw new Error("Could not place the order.");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Could not save the order items.");
    }

    return { order_no: order.order_no as number, total };
  });
