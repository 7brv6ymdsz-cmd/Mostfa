\set ON_ERROR_STOP 1
-- seed as owner
update public.settings set data = '{"shipping":{"fee":5,"freeOver":50},"payments":{"cod":{"on":true},"paypal":{"on":false},"bank":{"on":true,"iban":"X"}}}' where id=1;
insert into public.categories values ('home','البيت','#d9c3a5',0);
insert into public.products (id,name,brand,category_id,price,stock,hidden) values (1,'كوب','فخار','home',18,3,false),(2,'مخفي','x','home',10,5,true),(3,'كرسي','x','home',240,1,false);
insert into public.coupons (code,kind,value,min_subtotal) values ('SAVE10','percent',10,20),('SHIP','shipping',0,0),('OLD','fixed',5,0);
update public.coupons set ends_at = now() - interval '1 day' where code='OLD';
insert into auth.users (id,email,raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a','owner@x','{"full_name":"المالك"}'),('00000000-0000-0000-0000-00000000000b','cust@x','{"full_name":"سارة","phone":"+96170123456"}');
select 'profiles created: ' || count(*) from public.profiles;

-- ---------- anon ----------
set role anon; set request.jwt.claim.sub = '';
select 'anon sees products: ' || string_agg(name, ',') from public.products;
select 'coupon SAVE10 on 18: ' || public.check_coupon('save10', 18)::text;
select 'coupon SAVE10 on 36: ' || public.check_coupon('SAVE10', 36)::text;
select 'coupon OLD: ' || public.check_coupon('OLD', 36)::text;
do $$ begin perform 1 from public.coupons; raise notice 'anon coupons rows: %', (select count(*) from public.coupons); end $$;
do $$ declare o jsonb; begin
  o := public.place_order('{"customer":{"name":"زائر","phone":"+961 70 999 888","city":"بيروت","address":"الحمرا شارع ١"},"method":"cod","coupon":"save10","items":[{"id":1,"qty":2,"price":0.01}]}');
  raise notice 'anon order: id=% sub=% disc=% ship=% total=% user=%', o->>'id', o->>'subtotal', o->>'discount', o->>'shipping', o->>'total', o->>'user_id';
  perform set_config('t.oid', o->>'id', false);
end $$;
do $$ begin perform public.place_order('{"customer":{"name":"زائر","phone":"+96170999888","city":"ب","address":"عنوان طويل"},"method":"cod","items":[{"id":1,"qty":5}]}'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'oversell blocked: %', sqlerrm; end $$;
do $$ begin perform public.place_order('{"customer":{"name":"زائر","phone":"+96170999888","city":"ب","address":"عنوان طويل"},"method":"cod","items":[{"id":2,"qty":1}]}'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'hidden blocked: %', sqlerrm; end $$;
do $$ begin perform public.place_order('{"customer":{"name":"زائر","phone":"+96170999888","city":"ب","address":"عنوان طويل"},"method":"paypal","items":[{"id":1,"qty":1}]}'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'disabled method blocked: %', sqlerrm; end $$;
do $$ begin insert into public.orders (id,customer,items,subtotal,total,method) values ('HACK','{}','[]',0,0,'cod'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'direct insert blocked: %', sqlerrm; end $$;
select 'anon sees orders: ' || count(*) from public.orders;
select 'track wrong phone: ' || coalesce(public.track_order(current_setting('t.oid'), '+961 70 000 000')::text, 'null');
select 'track right phone: ' || (public.track_order(lower(current_setting('t.oid')), '70999888')->>'status');
do $$ begin update public.products set price = 0 where id = 1; raise notice 'anon product update rows: %', (select count(*) from public.products where price = 0); end $$;
do $$ begin perform public.claim_admin(); raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'anon claim_admin denied'; end $$;
reset role;
select 'stock of كوب after anon order (3-2): ' || stock from public.products where id=1;
select 'coupon uses: ' || uses from public.coupons where code='SAVE10';

-- ---------- admin claim ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'owner claim: ' || public.claim_admin();
select 'owner is_admin: ' || public.is_admin();
select 'owner sees hidden: ' || count(*) from public.products;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select 'customer claim (should be false): ' || public.claim_admin();
select 'customer is_admin: ' || public.is_admin();

-- ---------- customer ----------
select 'customer sees others orders: ' || count(*) from public.orders;
do $$ declare o jsonb; begin
  o := public.place_order('{"customer":{"name":"سارة","phone":"+96170123456","city":"بيروت","address":"الحمرا شارع ٢"},"method":"bank","items":[{"id":1,"qty":1,"options":{"اللون":"أزرق"}}]}');
  perform set_config('t.oid2', o->>'id', false);
  raise notice 'customer order: % total=% user=% items=%', o->>'id', o->>'total', o->>'user_id', o->'items';
end $$;
select 'customer sees own orders: ' || count(*) from public.orders;
do $$ begin update public.orders set paid = true; raise notice 'customer paid-flip rows visible as paid: %', (select count(*) from public.orders where paid); end $$;
do $$ begin insert into public.reviews (product_id, rating, body) values (1, 5, 'رائع'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'review before delivery blocked: %', sqlerrm; end $$;
insert into public.addresses (label, name, phone, city, address) values ('البيت','سارة','+961','بيروت','الحمرا');
insert into public.wishlist (product_id) values (3);
select 'customer addresses/wishlist: ' || (select count(*) from public.addresses) || '/' || (select count(*) from public.wishlist);
do $$ begin perform public.admin_set_status(current_setting('t.oid2'), 'delivered'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'customer set_status blocked: %', sqlerrm; end $$;

-- ---------- admin ----------
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'admin sees orders: ' || count(*) from public.orders;
select 'admin sees addresses of others: ' || count(*) from public.addresses;
select 'deliver -> ' || (public.admin_set_status(current_setting('t.oid2'), 'delivered')->>'status');
select 'cancel anon order -> ' || (public.admin_set_status(current_setting('t.oid'), 'cancelled')->>'status');
reset role;
select 'stock after cancel (0+2): ' || stock from public.products where id=1;
set role authenticated;
-- ---------- review ----------
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
insert into public.reviews (product_id, rating, body, status, author) values (1, 4, 'حلو كتير', 'approved', 'fake');
select 'review stored as: ' || status || ' by ' || author from public.reviews;
set request.jwt.claim.sub = '';
set role anon;
select 'anon sees pending reviews: ' || count(*) from public.reviews;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.reviews set status = 'approved';
select 'product rating after approve: ' || rating || ' (' || reviews_count || ')' from public.products where id = 1;
update public.products set price = 19 where id = 1;
select 'admin price update: ' || price from public.products where id = 1;
reset role;
-- account deletion
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select 'before: addresses=' || (select count(*) from public.addresses) || ' wishlist=' || (select count(*) from public.wishlist) || ' my orders=' || (select count(*) from public.orders);
select public.delete_my_account();
reset role;
select 'after: user exists=' || exists(select 1 from auth.users where id='00000000-0000-0000-0000-00000000000b')
  || ' profile=' || exists(select 1 from public.profiles where id='00000000-0000-0000-0000-00000000000b')
  || ' addresses=' || (select count(*) from public.addresses) || ' orders kept=' || (select count(*) from public.orders) || ' unlinked=' || (select count(*) from public.orders where user_id is null)
  || ' review kept anon=' || (select count(*) from public.reviews where user_id is null);
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin perform public.delete_my_account(); raise exception 'SHOULD FAIL'; exception when others then raise notice 'last admin protected: %', sqlerrm; end $$;
set role anon; set request.jwt.claim.sub = '';
do $$ begin perform public.delete_my_account(); raise exception 'SHOULD FAIL'; exception when insufficient_privilege then raise notice 'anon delete denied'; end $$;
reset role;
