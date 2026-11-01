update public.settings set data = '{"shipping":{"fee":5,"freeOver":50},"payments":{"cod":{"on":true}}}' where id=1;
insert into public.categories values ('home','البيت','#d9c3a5',0);
insert into public.products (id,name,brand,category_id,price,stock,low_stock_threshold) values (1,'كوب','فخار','home',18,8,5);
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','owner@x','{"full_name":"المالك"}'),('00000000-0000-0000-0000-0000000000a1','manager@x','{}'),
 ('00000000-0000-0000-0000-0000000000a2','stock@x','{}'),('00000000-0000-0000-0000-0000000000a3','help@x','{}'),('00000000-0000-0000-0000-00000000000b','cust@x','{}');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a'; select 'owner claim: ' || public.claim_admin() || ', role: ' || public.my_role();
select public.add_staff('MANAGER@x', 'manager'); select public.add_staff('stock@x', 'inventory'); select public.add_staff('help@x', 'support');
do $$ begin perform public.add_staff('nobody@x', 'manager'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'unknown email: %', sqlerrm; end $$;
select 'staff: ' || string_agg(email || '=' || role, ', ' order by created_at) from public.list_staff();
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin perform public.add_staff('cust@x', 'owner'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'customer self-promotion blocked: %', sqlerrm; end $$;
select 'customer sees staff list rows: ' || count(*) from public.list_staff();
-- anonymous order → stock movement with order ref, no audit noise
set role anon; set request.jwt.claim.sub = ''; set request.jwt.claim.role = 'anon';
do $$ declare o jsonb; begin o := public.place_order('{"customer":{"name":"زائر","phone":"+96170999888","city":"بيروت","address":"الحمرا ١"},"method":"cod","items":[{"id":1,"qty":4}]}'); perform set_config('t.oid', o->>'id', false); end $$;
reset role; set request.jwt.claim.role = '';
select 'movement after order: ' || delta || ' → ' || stock_after || ' reason=' || reason || ' ref ok=' || (ref = current_setting('t.oid')) from public.stock_movements where reason = 'order';
select 'low stock alert: ' || title || ' | ' || body from public.admin_notifications;
select 'audit rows from the anonymous order itself: ' || count(*) from public.audit_log where entity = 'orders';
set role authenticated;
-- inventory role
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
update public.products set price = 20 where id = 1;
select 'inventory changed price: ' || price from public.products where id = 1;
select 'inventory restock → ' || public.adjust_stock(1, 10, 'restock', 'شحنة جديدة');
do $$ begin update public.settings set data = '{}' where id = 1; raise notice 'inventory settings rows: %', (select count(*) from public.settings where data = '{}'); end $$;
do $$ begin insert into public.coupons (code, kind, value) values ('X1', 'fixed', 5); raise exception 'SHOULD FAIL'; exception when others then raise notice 'inventory coupon blocked: %', left(sqlerrm, 60); end $$;
do $$ begin perform public.admin_set_status(current_setting('t.oid'), 'shipped'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'inventory order status blocked: %', sqlerrm; end $$;
select 'inventory sees audit rows: ' || count(*) from public.audit_log;
-- support role
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
select 'support ships order → ' || (public.admin_set_status(current_setting('t.oid'), 'shipped')->>'status');
do $$ begin update public.products set price = 1 where id = 1; raise notice 'support price change rows: %', (select count(*) from public.products where price = 1); end $$;
do $$ begin perform public.adjust_stock(1, 5, 'restock'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'support stock blocked: %', sqlerrm; end $$;
-- manager
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select 'manager cancels → ' || (public.admin_set_status(current_setting('t.oid'), 'cancelled')->>'status');
do $$ begin delete from public.orders; raise notice 'manager delete orders → remaining %', (select count(*) from public.orders); end $$;
select 'manager reads audit: ' || count(*) || ' rows' from public.audit_log;
select 'audit sample: ' || actor_email || ' ' || action || ' ' || entity || ' ' || details::text from public.audit_log where entity = 'products' and actor_email = 'stock@x' and details ? 'price';
select 'movements: ' || string_agg(reason || '(' || delta || ')', ' → ' order by id) || ' | final stock ' || (select stock from public.products where id = 1) from public.stock_movements;
-- owner protection
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin perform public.remove_staff('00000000-0000-0000-0000-00000000000a'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'last owner protected: %', sqlerrm; end $$;
select public.remove_staff('00000000-0000-0000-0000-0000000000a3');
select 'after removing support: ' || count(*) || ' staff' from public.list_staff();
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
select 'removed support is_admin: ' || public.is_admin();
reset role;
