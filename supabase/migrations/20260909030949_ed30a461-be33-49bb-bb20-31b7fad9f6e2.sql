
INSERT INTO public.products (slug, name, description, category, fit, price, mrp, colours, sizes, images, is_featured, is_best_seller, is_new_arrival, position) VALUES
('brasil-retro-jersey','BRASIL RETRO MESH JERSEY','Breathable retro mesh jersey with ribbed V-neck and contrast panels. Cut oversized for an easy everyday drape.','Jerseys','OVERSIZED',899,1499,ARRAY['Yellow','Green'],ARRAY['S','M','L','XL'],ARRAY['seed/1000203835.jpg'],false,true,true,1),
('hoops-1978-oversized-tee','HOOPS 1978 OVERSIZED TEE','240 GSM cotton with a full back print, drop shoulders and a heavy ribbed collar that holds its shape wash after wash.','Tees','OVERSIZED',799,1199,ARRAY['Red','Black'],ARRAY['S','M','L','XL'],ARRAY['seed/1000203823.jpg'],true,true,true,2),
('gunner-long-sleeve-jersey','GUNNER LONG SLEEVE JERSEY','Long sleeve club jersey with tipped collar and striped cuffs. Relaxed body, sport-soft handfeel.','Jerseys','RELAXED',1099,1699,ARRAY['Red','White'],ARRAY['M','L','XL'],ARRAY['seed/1000203833.jpg'],false,false,true,3),
('scuderia-race-jersey','SCUDERIA RACE JERSEY','Motorsport-inspired V-neck in quick-dry mesh. Straight fit, short raglan sleeves, race-day graphics.','Jerseys','STRAIGHT FIT',949,1499,ARRAY['Red'],ARRAY['S','M','L','XL'],ARRAY['seed/1000203837.jpg'],false,false,true,4),
('tusker-acid-wash-vest','TUSKER ACID WASH VEST','Acid washed cotton vest with a raised puff-print back graphic. Baggy armholes, raw finish.','Vests','BAGGY',749,1299,ARRAY['Washed Brown'],ARRAY['S','M','L','XL'],ARRAY['seed/1000203831.jpg'],false,false,false,5),
('athletics-crest-oversized-tee','ATHLETICS CREST OVERSIZED TEE','Butter-toned heavyweight cotton tee with a vintage crest print. Boxy shoulders, everyday staple.','Tees','OVERSIZED',699,1099,ARRAY['Butter','Green'],ARRAY['S','M','L','XL'],ARRAY['seed/1000203825.jpg'],false,true,false,6);

INSERT INTO public.product_stock (product_id, size, stock)
SELECT p.id, s, 12 FROM public.products p, unnest(p.sizes) AS s;

UPDATE public.site_settings
SET value = jsonb_set(value, '{hero_image}', '"seed/1000203835.jpg"')
WHERE key = 'homepage';
