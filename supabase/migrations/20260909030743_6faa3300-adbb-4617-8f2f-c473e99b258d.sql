
-- roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- owner bootstrap: only the authorized email can claim admin
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text;
BEGIN
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  IF em IS NULL OR lower(em) <> 'ritesshhh19@gmail.com' THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Tees',
  fit text NOT NULL DEFAULT 'OVERSIZED',
  price integer NOT NULL DEFAULT 0,
  mrp integer NOT NULL DEFAULT 0,
  colours text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
CREATE POLICY "admin manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.product_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, size)
);
GRANT SELECT ON public.product_stock TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_stock TO authenticated;
GRANT ALL ON public.product_stock TO service_role;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read stock" ON public.product_stock FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage stock" ON public.product_stock FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- coupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  value integer NOT NULL DEFAULT 0,
  min_order integer NOT NULL DEFAULT 0,
  max_discount integer,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
CREATE POLICY "admin manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- site settings
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- orders
CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no integer NOT NULL DEFAULT nextval('public.order_number_seq'),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  city text NOT NULL,
  pincode text NOT NULL,
  payment_method text NOT NULL DEFAULT 'COD',
  coupon_code text,
  subtotal integer NOT NULL DEFAULT 0,
  discount integer NOT NULL DEFAULT 0,
  shipping integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'NEW',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin read orders" ON public.orders FOR SELECT TO authenticated USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin delete orders" ON public.orders FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  image text,
  size text NOT NULL,
  colour text,
  qty integer NOT NULL DEFAULT 1,
  price integer NOT NULL DEFAULT 0
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin read order items" ON public.order_items FOR SELECT TO authenticated USING (public.is_admin());

-- stock decrement on order placement
CREATE OR REPLACE FUNCTION public.decrement_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.product_stock
     SET stock = GREATEST(0, stock - NEW.qty)
   WHERE product_id = NEW.product_id AND size = NEW.size;
  RETURN NEW;
END;
$$;
CREATE TRIGGER order_items_decrement_stock AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- seed settings
INSERT INTO public.site_settings (key, value) VALUES
('homepage', '{"announcement":"NEW DROP IS LIVE  •  FREE SHIPPING ABOVE ₹999","hero_title":"WEAR YOUR\nMOMENT.","hero_subtitle":"Modern men''s fashion. Made for your everyday.","hero_eyebrow":"11:11 STORE","hero_image":"","cta_text":"SHOP NOW","cta_link":"/shop","offer_title":"GET 10% OFF YOUR FIRST ORDER","offer_percent":10,"offer_description":"Join the 11:11 list and unlock your first-order offer.","offer_code":"WELCOME10","offer_active":true}'::jsonb);

INSERT INTO public.coupons (code, discount_type, value, min_order, max_discount, description) VALUES
('WELCOME10', 'percent', 10, 0, 300, 'First order 10% off');
