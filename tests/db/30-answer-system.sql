insert into public.categories values ('home','البيت','#d9c3a5',0);
insert into public.products (id,name,brand,category_id,price,stock) values (1,'كوب','فخار','home',18,3);
insert into auth.users (id,email,raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a','owner@x','{"full_name":"المالك"}'),('00000000-0000-0000-0000-00000000000b','cust@x','{"full_name":"سارة"}'),('00000000-0000-0000-0000-00000000000c','other@x','{"full_name":"غريب"}');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a'; select 'admin claimed: ' || public.claim_admin();
-- guest starts a conversation
set role anon; set request.jwt.claim.sub = '';
do $$ declare r jsonb; begin
  r := public.start_conversation('{"name":"زائر","contact":"+961 70 111 222","subject":"سؤال","body":"وين طلبي؟","order_id":"r-abc","bot":["الجواب الآلي: من صفحة التتبّع"]}');
  perform set_config('t.cid', r->>'id', false); perform set_config('t.tok', r->>'token', false);
  raise notice 'guest started: token length %', length(r->>'token');
end $$;
do $$ begin perform public.start_conversation('{"name":"ز","contact":"","body":"x"}'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'bad guest input blocked: %', sqlerrm; end $$;
select 'guest reads with token: ' || jsonb_array_length(public.get_conversation(current_setting('t.cid')::uuid, current_setting('t.tok'))->'messages') || ' messages';
select 'guest reads with wrong token: ' || coalesce(public.get_conversation(current_setting('t.cid')::uuid, 'nope')::text, 'null');
select 'anon table select: ' || count(*) from public.conversations;
select public.reply_conversation(current_setting('t.cid')::uuid, current_setting('t.tok'), 'رقم الطلب R-ABC');
do $$ begin perform public.reply_conversation(current_setting('t.cid')::uuid, 'wrong', 'hack'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'reply with wrong token blocked: %', sqlerrm; end $$;
do $$ begin perform public.admin_reply(current_setting('t.cid')::uuid, 'fake admin'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'anon admin_reply blocked: %', sqlerrm; end $$;
do $$ begin insert into public.conversation_messages (conversation_id, sender, body) values (current_setting('t.cid')::uuid, 'admin', 'forged'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'forged message insert blocked: %', sqlerrm; end $$;
-- logged-in customer
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ declare r jsonb; begin r := public.start_conversation('{"body":"عندي سؤال عن المقاسات"}'); perform set_config('t.cid2', r->>'id', false); end $$;
select 'customer conv name/contact auto-filled: ' || name || ' / ' || contact from public.conversations where id = current_setting('t.cid2')::uuid;
select 'customer sees own conversations: ' || count(*) from public.conversations;
select 'customer reads own w/o token: ' || (public.get_conversation(current_setting('t.cid2')::uuid, '')->>'status');
select 'customer reads guest conv: ' || coalesce(public.get_conversation(current_setting('t.cid')::uuid, '')::text, 'null');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'other user reads it: ' || coalesce(public.get_conversation(current_setting('t.cid2')::uuid, '')::text, 'null') || ', sees rows: ' || (select count(*) from public.conversations) || ', messages rows: ' || (select count(*) from public.conversation_messages);
-- admin
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'admin sees: ' || count(*) || ' conversations, unread ' || count(*) filter (where unread_admin) from public.conversations;
select public.admin_reply(current_setting('t.cid')::uuid, 'طلبك انشحن اليوم');
select 'after admin reply: status=' || status || ' unread_customer=' || unread_customer || ' unread_admin=' || unread_admin from public.conversations where id = current_setting('t.cid')::uuid;
set role anon; set request.jwt.claim.sub = '';
select 'guest sees reply: ' || (public.get_conversation(current_setting('t.cid')::uuid, current_setting('t.tok'))->'messages'->-1->>'body') || ' / senders: ' || (select string_agg(m->>'sender', ',') from jsonb_array_elements(public.get_conversation(current_setting('t.cid')::uuid, current_setting('t.tok'))->'messages') m);
reset role; select 'unread_customer cleared after guest read: ' || not unread_customer from public.conversations where id = current_setting('t.cid')::uuid;
-- flood guard
set role anon; set request.jwt.claim.sub = '';
do $$ declare i int; begin for i in 1..6 loop perform public.start_conversation('{"name":"سبام","contact":"spam@x.com","body":"hello"}'); end loop; raise exception 'SHOULD FAIL'; exception when others then raise notice 'flood guard: %', sqlerrm; end $$;
-- product questions
select public.ask_question(1, 'هل الكوب بيتحمّل الميكروويف؟', 'ليلى');
do $$ begin perform public.ask_question(1, 'x'); raise exception 'SHOULD FAIL'; exception when others then raise notice 'short question blocked: %', sqlerrm; end $$;
select 'public sees pending question: ' || count(*) from public.product_questions;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin update public.product_questions set answer = 'fake', status = 'published'; raise notice 'customer publish rows affected: %', (select count(*) from public.product_questions where status = 'published'); end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update public.product_questions set answer = 'أكيد، مزجّج وآمن للميكروويف', status = 'published', answered_at = now();
set role anon; set request.jwt.claim.sub = '';
select 'public sees answered: ' || question || ' → ' || answer || ' (by ' || author || ')' from public.product_questions;
reset role;
