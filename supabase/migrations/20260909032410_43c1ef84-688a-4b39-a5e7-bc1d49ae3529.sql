REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

DROP POLICY IF EXISTS "public read active products" ON public.products;
CREATE POLICY "public read active products" ON public.products
  FOR SELECT TO anon USING (is_active);
CREATE POLICY "signed in read products" ON public.products
  FOR SELECT TO authenticated USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "public read active coupons" ON public.coupons;
CREATE POLICY "public read active coupons" ON public.coupons
  FOR SELECT TO anon USING (is_active);
CREATE POLICY "signed in read coupons" ON public.coupons
  FOR SELECT TO authenticated USING (is_active OR public.is_admin());