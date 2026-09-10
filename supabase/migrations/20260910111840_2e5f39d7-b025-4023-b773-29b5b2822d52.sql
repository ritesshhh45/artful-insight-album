-- Product extras
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_sale boolean NOT NULL DEFAULT false;

-- Coupons: automatic/festival discounts
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_automatic boolean NOT NULL DEFAULT false;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read categories" ON public.categories;
CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon USING (is_active);
DROP POLICY IF EXISTS "signed in read categories" ON public.categories;
CREATE POLICY "signed in read categories" ON public.categories FOR SELECT TO authenticated USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "admin manage categories" ON public.categories;
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Collections / sections
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  show_on_home boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read collections" ON public.collections;
CREATE POLICY "public read collections" ON public.collections FOR SELECT TO anon USING (is_active);
DROP POLICY IF EXISTS "signed in read collections" ON public.collections;
CREATE POLICY "signed in read collections" ON public.collections FOR SELECT TO authenticated USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "admin manage collections" ON public.collections;
CREATE POLICY "admin manage collections" ON public.collections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.collection_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  UNIQUE (collection_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_products TO authenticated;
GRANT SELECT ON public.collection_products TO anon;
GRANT ALL ON public.collection_products TO service_role;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read collection products" ON public.collection_products;
CREATE POLICY "public read collection products" ON public.collection_products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage collection products" ON public.collection_products;
CREATE POLICY "admin manage collection products" ON public.collection_products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed categories from existing products
INSERT INTO public.categories (name, slug, position)
SELECT DISTINCT p.category, lower(regexp_replace(p.category, '[^a-zA-Z0-9]+', '-', 'g')), 0
FROM public.products p
WHERE p.category <> ''
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, position) VALUES
  ('Tees','tees',1),('Jerseys','jerseys',2),('Vests','vests',3),('Denim','denim',4),('Accessories','accessories',5)
ON CONFLICT (slug) DO NOTHING;

-- Seed default sections
INSERT INTO public.collections (title, slug, position) VALUES
  ('NEW DROP','new-drop',1),
  ('BEST SELLERS','best-sellers',2),
  ('NEW ARRIVALS','new-arrivals',3),
  ('SALE','sale',4)
ON CONFLICT (slug) DO NOTHING;