(() => {
  'use strict';
  const S = window.RaffShared;
  const { art, esc, num, compact, norm, ls } = S;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let CFG, CATS, P, byId, money;
  const heartSVG = '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.3 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>';
  const plusSVG = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  const chev = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';

  const saved = new Set(ls.get('raff.saved', []));
  let cart = ls.get('raff.cart', {});

  /* ---------- Components ---------- */
  const inStock = (p) => !(p.stock <= 0);
  const priceHTML = (p) => `<span class="price">${money(p.price)}${p.compare > p.price ? ` <s>${money(p.compare)}</s>` : ''}</span>`;
  const card = (p, mini = false) => `
    <article class="pcard${mini ? ' mini' : ''}${inStock(p) ? '' : ' soldout'}">
      <button class="pcard-img" type="button" data-open="${p.id}" style="--bg:${S.hex(p.bg, '#efe8dc')}" aria-label="عرض ${esc(p.name)}">${art(p)}${inStock(p) ? '' : '<span class="tag">نفد</span>'}${p.compare > p.price && inStock(p) ? `<span class="tag sale">−${num(Math.round((1 - p.price / p.compare) * 100))}٪</span>` : ''}</button>
      ${mini ? '' : `<button class="heart" type="button" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="احفظ ${esc(p.name)}">${heartSVG}</button>
      <button class="add" type="button" data-add="${p.id}" ${inStock(p) ? '' : 'disabled'} aria-label="أضف ${esc(p.name)} إلى السلة">${plusSVG}</button>`}
      <div class="pcard-meta">
        <h3>${esc(p.name)}</h3>
        <p class="store">${esc(p.store)}</p>
        <div class="row">${priceHTML(p)}
          ${p.reviews ? `<span class="rate"><span class="stars">★</span> ${num(p.rating)} (${compact(p.reviews)})</span>` : ''}
        </div>
      </div>
    </article>`;
  const tile = (p) => `
    <button class="tile" type="button" data-open="${p.id}" style="--bg:${S.hex(p.bg, '#efe8dc')}" aria-label="عرض ${esc(p.name)}">
      ${art(p)}
      <span class="tile-label"><b>${esc(p.name)}</b><small>${esc(p.store)} · ${money(p.price)}</small></span>
    </button>`;
  const head = (id, title) => `<div class="band-head"><h2><a href="#${id}">${esc(title)} ${chev}</a></h2></div>`;

  /* ---------- Render ---------- */
  const renderAll = () => {
    document.title = `${CFG.name} · ${CFG.tagline}`;
    $$('[data-brand]').forEach((el) => { el.firstChild.nodeValue = CFG.name; });
    $('#tagline').textContent = CFG.tagline;
    $('#bannerTitle').textContent = CFG.banner;
    $('#bannerSub').textContent = CFG.bannerSub;
    $('.banner').hidden = !CFG.banner;

    // Hero constellation (flat fallback for the 3D stage)
    const heroList = P.filter((p) => p.featured).concat(P.filter((p) => !p.featured)).slice(0, 5);
    const SLOTS = [
      { x: '2%', y: '78px', w: '150px', d: '0s', mx: '0', my: '0', mw: '0' },
      { x: '19%', y: '8px', w: '168px', d: '-2s', mx: '4%', my: '28px', mw: '34%' },
      { x: '40.5%', y: '36px', w: '190px', d: '-4s', mx: '33%', my: '0px', mw: '36%' },
      { x: '63%', y: '0px', w: '164px', d: '-1s', mx: '62%', my: '34px', mw: '34%' },
      { x: '82%', y: '70px', w: '148px', d: '-3s', mx: '0', my: '0', mw: '0' },
    ];
    const m = matchMedia('(max-width: 720px)').matches;
    $('#constellation').querySelectorAll('.float').forEach((n) => n.remove());
    $('#constellation').insertAdjacentHTML('afterbegin', heroList.map((p, i) => {
      const s = SLOTS[i];
      return `<div class="float" data-slot="${i + 1}" style="--x:${m ? s.mx : s.x};--y:${m ? s.my : s.y};--w:${m ? s.mw : s.w};--d:${s.d}">${card(p, true)}</div>`;
    }).join(''));

    // Pills
    $('#pills').innerHTML = CATS.filter((c) => P.some((p) => p.cat === c.id)).map((c) =>
      `<button class="pill" type="button" data-cat="${esc(c.id)}" aria-pressed="false"><i style="--c:${S.hex(c.c, '#cccccc')}"></i>${esc(c.name)}</button>`).join('');

    // Picks
    const picks = (P.some((p) => p.featured) ? P.filter((p) => p.featured) : [...P].sort((a, b) => b.rating - a.rating)).slice(0, 12);
    $('#picksRow').innerHTML = picks.map((p) => card(p)).join('');
    $('#picks').hidden = picks.length === 0;

    // Category bands
    const out = [];
    const storesHTML = renderStores();
    CATS.forEach((c, ci) => {
      const list = P.filter((p) => p.cat === c.id);
      if (!list.length) return;
      const id = `cat-${c.id}`;
      if (list.length >= 5 && !out.some((x) => x.includes('class="mosaic"'))) {
        const [f, ...rest] = [...list].sort((a, b) => (b.featured - a.featured) || (b.reviews - a.reviews));
        out.push(`<section class="band" id="${esc(id)}">${head(id, c.name)}<div class="mosaic">
          <button class="feature" type="button" data-open="${f.id}" style="--bg:${S.hex(f.bg, '#332f2d')}" aria-label="عرض ${esc(f.name)}">
            <span class="feature-copy"><strong>${esc(f.store)}</strong><span>${f.reviews ? `★ ${num(f.rating)} · ${compact(f.reviews)} تقييم` : esc(f.name)}</span><em>${esc(f.name)} · ${money(f.price)}</em></span>
            ${art(f)}
          </button>${rest.slice(0, 4).map(tile).join('')}</div></section>`);
      } else if (list.length >= 4 && ci % 2 === 0) {
        out.push(`<section class="band" id="${esc(id)}">${head(id, c.name)}<div class="tiles">${list.slice(0, 4).map(tile).join('')}</div>
          ${list.length > 4 ? `<div class="grid more">${list.slice(4).map((p) => card(p)).join('')}</div>` : ''}</section>`);
      } else {
        out.push(`<section class="band" id="${esc(id)}">${head(id, c.name)}<div class="grid">${list.map((p) => card(p)).join('')}</div></section>`);
      }
      if (out.length === 1 && storesHTML) out.push(storesHTML);
    });
    if (out.length === 0 && storesHTML) out.push(storesHTML);
    $('#sections').innerHTML = out.join('');

    $('#footShop').innerHTML = '<h3>تسوّق</h3>' + CATS.filter((c) => P.some((p) => p.cat === c.id)).slice(0, 5)
      .map((c) => `<a href="#cat-${esc(c.id)}">${esc(c.name)}</a>`).join('');
    $('#footYear').textContent = `© ${num(new Date().getFullYear()).replace(/٬/g, '')} ${CFG.name}`;
    observeBands();
  };

  function renderStores() {
    const groups = new Map();
    P.forEach((p) => { if (p.store) groups.set(p.store, [...(groups.get(p.store) || []), p]); });
    const top = [...groups.entries()].filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 4);
    if (top.length < 2) return '';
    const followed = new Set(ls.get('raff.follow', []));
    return `<section class="band" id="stores">${head('stores', 'متاجر تستحق المتابعة')}<div class="stores">${top.map(([name, list]) => {
      const h = list[0];
      const avg = list.reduce((s, p) => s + (p.rating || 0), 0) / list.length;
      const letter = name.replace(/^ال/, '').trim()[0] || name[0];
      return `<article class="spot">
        <button class="spot-hero" type="button" data-open="${h.id}" style="--bg:${S.hex(h.bg, '#efe8dc')}" aria-label="عرض ${esc(h.name)}">${art(h)}</button>
        <div class="spot-info">
          <span class="spot-logo" aria-hidden="true">${esc(letter)}</span>
          <div><h3>${esc(name)}</h3><p>${avg ? `★ ${num(Math.round(avg * 10) / 10)} · ` : ''}${num(list.length)} منتجات</p></div>
          <button class="follow" type="button" data-follow="${esc(name)}" aria-pressed="${followed.has(name)}">${followed.has(name) ? 'متابَع' : 'تابِع'}</button>
        </div>
        <div class="thumbs">${list.slice(0, 3).map((p) => `<button type="button" data-open="${p.id}" style="--bg:${S.hex(p.bg, '#efe8dc')}" aria-label="عرض ${esc(p.name)}">${art(p)}</button>`).join('')}</div>
      </article>`;
    }).join('')}</div></section>`;
  }

  /* ---------- Search & filter ---------- */
  const results = $('#results');
  let activeCat = null;
  const EMPTY_SEARCH = 'ما لقينا شي بهالاسم. جرّب كلمة ثانية.';
  const runSearch = (scroll) => {
    const q = norm($('#q').value);
    if (!q && !activeCat) { results.hidden = true; return; }
    const words = q.split(/\s+/).filter(Boolean);
    const list = P.filter((p) => {
      if (activeCat && p.cat !== activeCat) return false;
      const cat = CATS.find((c) => c.id === p.cat);
      return words.every((w) => norm(`${p.name} ${p.store} ${cat ? cat.name : ''} ${p.desc || ''}`).includes(w));
    });
    const catName = activeCat ? (CATS.find((c) => c.id === activeCat) || {}).name : '';
    const raw = $('#q').value.trim();
    $('#resultsTitle').textContent = raw && catName ? `«${raw}» في ${catName}` : raw ? `نتائج «${raw}»` : catName;
    $('#resultsGrid').innerHTML = list.map((p) => card(p)).join('');
    $('#resultsEmpty').textContent = EMPTY_SEARCH;
    $('#resultsEmpty').hidden = list.length > 0;
    results.hidden = false;
    if (scroll) results.scrollIntoView({ block: 'start' });
  };
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); runSearch(true); $('#q').blur(); });
  let t;
  $('#q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runSearch(false), 160); });
  const syncPills = () => $$('.pill').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === activeCat));

  /* ---------- Cart ---------- */
  const persistCart = () => ls.set('raff.cart', cart);
  const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
  const setBadge = (el, n) => { el.hidden = n === 0; el.textContent = num(n); };
  const cartLines = () => Object.keys(cart).map(Number).filter((id) => byId.has(id)).map((id) => ({ p: byId.get(id), qty: cart[id] }));
  const totals = () => {
    const sub = cartLines().reduce((s, l) => s + l.p.price * l.qty, 0);
    const sh = CFG.shipping || {};
    const ship = sub === 0 ? 0 : (sh.freeOver > 0 && sub >= sh.freeOver ? 0 : +sh.fee || 0);
    return { sub, ship, total: Math.round((sub + ship) * 100) / 100 };
  };

  const renderCart = () => {
    const lines = cartLines();
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const { sub, ship, total } = totals();
    setBadge($('#cartBadge'), count);
    $('#cartList').innerHTML = lines.map(({ p, qty }) => `<li class="cart-item">
        <span class="cart-thumb" style="--bg:${S.hex(p.bg, '#efe8dc')}">${art(p)}</span>
        <div class="cart-info"><b>${esc(p.name)}</b><small>${esc(p.store)}</small>
          <div class="qty"><button type="button" data-dec="${p.id}" aria-label="إنقاص">−</button><span>${num(qty)}</span><button type="button" data-inc="${p.id}" aria-label="زيادة">+</button></div>
        </div>
        <span class="cart-price">${money(p.price * qty)}</span>
      </li>`).join('');
    $('#cartEmpty').hidden = count > 0;
    $('#cartFoot').hidden = count === 0;
    $('#cartSub').textContent = money(sub);
    $('#cartShip').textContent = ship ? money(ship) : 'مجاني';
    $('#cartTotal').textContent = money(total);
    const fo = (CFG.shipping || {}).freeOver;
    $('#freeHint').hidden = !(fo > 0 && sub > 0 && sub < fo);
    $('#freeHint').textContent = `أضف ${money(Math.round((fo - sub) * 100) / 100)} وبيصير التوصيل مجاني`;
  };
  const addToCart = (id) => {
    const p = byId.get(id);
    if (!p || !inStock(p)) return;
    if (p.stock > 0 && (cart[id] || 0) >= p.stock) { toast('هاي كل الكمية المتوفرة'); return; }
    cart[id] = (cart[id] || 0) + 1;
    persistCart(); renderCart(); bump($('#cartBadge'));
    toast(`انضاف «${p.name}» إلى السلة`);
  };

  /* ---------- Drawer & checkout ---------- */
  const cartEl = $('#cart'), scrim = $('#scrim');
  let lastFocus = null;
  const view = (name) => {
    $$('[data-view]', cartEl).forEach((v) => { v.hidden = v.dataset.view !== name; });
    $('#drawerTitle').textContent = { cart: 'السلة', checkout: 'إتمام الطلب', done: 'تم استلام طلبك' }[name];
    $('#drawerBack').hidden = name !== 'checkout';
    cartEl.scrollTop = 0;
  };
  const openCart = () => {
    lastFocus = document.activeElement;
    view('cart');
    scrim.hidden = false; cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden', 'false');
    cartEl.querySelector('[data-action="close-cart"]').focus();
  };
  const closeCart = () => {
    scrim.hidden = true; cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden', 'true');
    lastFocus?.focus?.();
  };

  const enabledMethods = () => Object.keys(S.METHODS).filter((k) => {
    const m = (CFG.payments || {})[k];
    if (!m || !m.on) return false;
    if (k === 'paypal') return !!m.user;
    if (k === 'bank') return !!m.iban;
    return true;
  });

  const startCheckout = () => {
    const methods = enabledMethods();
    const methodsWithFallback = methods.length ? methods : ['cod'];
    const desc = {
      cod: 'بتدفع نقداً لما يوصلك الطلب.',
      paypal: 'ادفع بحساب PayPal أو بالبطاقة كضيف، على صفحة PayPal الآمنة.',
      bank: 'منبعتلك بيانات الحساب بعد الطلب، وبنشحن بعد وصول التحويل.',
    };
    $('#payMethods').innerHTML = methodsWithFallback.map((k, i) => `
      <label class="pay-opt"><input type="radio" name="method" value="${k}" ${i === 0 ? 'checked' : ''}>
        <span class="pay-ico pay-${k}" aria-hidden="true"></span>
        <span><b>${S.METHODS[k]}</b><small>${desc[k]}</small></span></label>`).join('');
    const saved = ls.get('raff.customer', {});
    const f = $('#checkoutForm');
    ['name', 'phone', 'city', 'address'].forEach((k) => { if (saved[k] && !f[k].value) f[k].value = saved[k]; });
    const { sub, ship, total } = totals();
    $('#coSummary').innerHTML = `<div><span>المنتجات</span><b>${money(sub)}</b></div><div><span>التوصيل</span><b>${ship ? money(ship) : 'مجاني'}</b></div><div class="grand"><span>المجموع</span><b>${money(total)}</b></div>`;
    view('checkout');
    f.name.focus();
  };

  $('#checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const val = (k) => f[k].value.trim();
    const phone = S.toLatinDigits(val('phone')).replace(/[^\d+]/g, '');
    let bad = null;
    if (val('name').length < 2) bad = 'name';
    else if (phone.replace(/\D/g, '').length < 7) bad = 'phone';
    else if (!val('city')) bad = 'city';
    else if (val('address').length < 4) bad = 'address';
    $$('.field', f).forEach((el) => el.classList.toggle('invalid', el.dataset.f === bad));
    if (bad) { f[bad].focus(); return; }
    const lines = cartLines();
    if (!lines.length) { view('cart'); return; }
    const { sub, ship, total } = totals();
    const order = {
      id: S.newOrderId(), createdAt: Date.now(),
      customer: { name: val('name'), phone, city: val('city'), address: val('address'), notes: val('notes') },
      method: f.method.value,
      items: lines.map(({ p, qty }) => ({ id: p.id, qty, price: p.price, name: p.name })),
      subtotal: sub, shipping: ship, total, status: 'new', paid: false,
    };
    ls.set('raff.customer', { name: order.customer.name, phone, city: order.customer.city, address: order.customer.address });
    const mine = ls.get('raff.myorders', []); mine.unshift(order); ls.set('raff.myorders', mine.slice(0, 50));
    cart = {}; persistCart(); renderCart();
    showDone(order);
  });

  const waText = (o) => [
    `طلب جديد من ${CFG.name}`,
    `رقم الطلب: ${o.id}`,
    ...o.items.map((x) => `• ${x.name} × ${x.qty} = ${money(x.price * x.qty)}`),
    `التوصيل: ${o.shipping ? money(o.shipping) : 'مجاني'}`,
    `المجموع: ${money(o.total)}`,
    `الدفع: ${S.METHODS[o.method]}`,
    `الاسم: ${o.customer.name}`, `الهاتف: ${o.customer.phone}`, `العنوان: ${o.customer.city}، ${o.customer.address}`,
    o.customer.notes ? `ملاحظات: ${o.customer.notes}` : '',
    '', `رمز الطلب (لا تعدّله): ${S.encodeOrder(o)}`,
  ].filter((l) => l !== '').join('\n');

  const showDone = (o) => {
    const pay = CFG.payments || {};
    const wa = String(CFG.whatsapp || '').replace(/\D/g, '');
    const steps = [];
    if (wa) steps.push(`<a class="btn-violet wide" href="https://wa.me/${wa}?text=${encodeURIComponent(waText(o))}" target="_blank" rel="noopener noreferrer">أرسل الطلب على واتساب لنأكده</a>`);
    if (o.method === 'paypal' && pay.paypal && pay.paypal.user) {
      const user = encodeURIComponent(String(pay.paypal.user).replace(/^@/, ''));
      const code = /^[A-Z]{3}$/.test(CFG.currencyCode || '') ? CFG.currencyCode : 'USD';
      steps.push(`<a class="btn-dark wide" href="https://www.paypal.com/paypalme/${user}/${o.total}${code}" target="_blank" rel="noopener noreferrer">ادفع ${money(o.total)} عبر PayPal</a>
        <p class="note">اكتب رقم الطلب <b>${esc(o.id)}</b> بخانة الملاحظة على PayPal.</p>`);
    }
    if (o.method === 'bank' && pay.bank) {
      steps.push(`<div class="bank">
        <div><span>البنك</span><b>${esc(pay.bank.bank)}</b></div>
        <div><span>اسم الحساب</span><b>${esc(pay.bank.holder)}</b></div>
        <div><span>IBAN</span><b class="mono">${esc(pay.bank.iban)}</b><button type="button" class="copy" data-copy="${esc(pay.bank.iban)}">نسخ</button></div>
        <div><span>المبلغ</span><b>${money(o.total)}</b></div>
        <p class="note">اكتب رقم الطلب <b>${esc(o.id)}</b> بوصف التحويل.</p></div>`);
    }
    if (o.method === 'cod') steps.push('<p class="note">بتدفع نقداً عند الاستلام. منتواصل معك لنأكد العنوان والموعد.</p>');
    if (!wa) steps.push(`<div class="code-box"><p class="note">ابعت هالرمز للمتجر ليأكد طلبك:</p><textarea readonly rows="3">${esc(S.encodeOrder(o))}</textarea><button type="button" class="copy" data-copy="${esc(waText(o))}">نسخ الطلب كاملاً</button></div>`);
    $('#doneBody').innerHTML = `
      <div class="done-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <p class="done-id">رقم الطلب <b>${esc(o.id)}</b></p>
      <p class="done-total">${money(o.total)} · ${esc(S.METHODS[o.method])}</p>
      <div class="done-steps">${steps.join('')}</div>`;
    view('done');
  };

  /* ---------- Saved ---------- */
  const renderSaved = () => setBadge($('#savedBadge'), [...saved].filter((id) => byId.has(id)).length);
  const toggleSave = (id) => {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    ls.set('raff.saved', [...saved]);
    $$(`[data-save="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', saved.has(id)));
    renderSaved();
    if (saved.has(id)) { bump($('#savedBadge')); toast('انحفظ بالمحفوظات'); }
  };
  const showSaved = () => {
    $('#q').value = ''; activeCat = null; syncPills();
    const list = P.filter((p) => saved.has(p.id));
    $('#resultsTitle').textContent = 'المحفوظات';
    $('#resultsGrid').innerHTML = list.map((p) => card(p)).join('');
    $('#resultsEmpty').textContent = 'ما حفظت شي لسا. اضغط على القلب بأي منتج.';
    $('#resultsEmpty').hidden = list.length > 0;
    results.hidden = false;
    results.scrollIntoView({ block: 'start' });
  };

  /* ---------- Quick view ---------- */
  const qv = $('#qv');
  let qvId = null;
  const openQV = (id) => {
    const p = byId.get(id); if (!p) return; qvId = id;
    $('#qvImg').style.setProperty('--bg', S.hex(p.bg, '#efe8dc'));
    $('#qvImg').innerHTML = art(p);
    $('#qvStore').textContent = p.store;
    $('#qvName').textContent = p.name;
    $('#qvRate').textContent = p.reviews ? `★ ${num(p.rating)} · ${compact(p.reviews)} تقييم` : '';
    $('#qvDesc').textContent = p.desc || '';
    $('#qvPrice').innerHTML = priceHTML(p);
    $('#qvStock').textContent = !inStock(p) ? 'نفدت الكمية' : p.stock > 0 && p.stock <= 5 ? `باقي ${num(p.stock)} بس` : '';
    $('#qvAdd').disabled = !inStock(p);
    $('#qvAdd').textContent = inStock(p) ? 'أضف إلى السلة' : 'نفد من المخزون';
    if (typeof qv.showModal === 'function') qv.showModal(); else qv.setAttribute('open', '');
  };
  const closeQV = () => (qv.close ? qv.close() : qv.removeAttribute('open'));
  qv.addEventListener('click', (e) => { if (e.target === qv) closeQV(); });
  $('#qvAdd').addEventListener('click', () => { addToCart(qvId); closeQV(); });

  /* ---------- Toast ---------- */
  let tt;
  const toast = (msg) => {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2400);
  };

  /* ---------- Scroller arrows (RTL aware) ---------- */
  const updateArrows = (sc) => {
    const max = sc.scrollWidth - sc.clientWidth;
    const pos = Math.abs(sc.scrollLeft);
    $$(`[data-scroll="${sc.id}"]`).forEach((b) => { b.disabled = b.dataset.dir === '1' ? pos >= max - 2 : pos <= 2; });
  };
  $$('.scroller').forEach((sc) => sc.addEventListener('scroll', () => updateArrows(sc), { passive: true }));
  addEventListener('resize', () => $$('.scroller').forEach(updateArrows));

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, [data-action]');
    if (!el) return;
    const d = el.dataset;
    if (d.open) { openQV(+d.open); return; }
    if (d.add) { addToCart(+d.add); return; }
    if (d.save) { toggleSave(+d.save); return; }
    if (d.inc) { const p = byId.get(+d.inc); if (p.stock > 0 && cart[d.inc] >= p.stock) { toast('هاي كل الكمية المتوفرة'); return; } cart[d.inc]++; persistCart(); renderCart(); return; }
    if (d.dec) { if (--cart[d.dec] <= 0) delete cart[d.dec]; persistCart(); renderCart(); return; }
    if (d.copy) { navigator.clipboard?.writeText(d.copy).then(() => toast('انسخ'), () => toast('ما قدرنا ننسخ، حدده وانسخه يدوي')); return; }
    if (d.cat) { activeCat = activeCat === d.cat ? null : d.cat; syncPills(); runSearch(true); return; }
    if (d.follow) {
      const f = new Set(ls.get('raff.follow', []));
      f.has(d.follow) ? f.delete(d.follow) : f.add(d.follow);
      ls.set('raff.follow', [...f]);
      $$(`[data-follow="${CSS.escape(d.follow)}"]`).forEach((b) => { b.setAttribute('aria-pressed', f.has(d.follow)); b.textContent = f.has(d.follow) ? 'متابَع' : 'تابِع'; });
      if (f.has(d.follow)) toast(`صرت تتابع «${d.follow}»`);
      return;
    }
    if (d.scroll) {
      const sc = document.getElementById(d.scroll);
      const rtl = getComputedStyle(sc).direction === 'rtl';
      sc.scrollBy({ left: (rtl ? -1 : 1) * +d.dir * sc.clientWidth * 0.8, behavior: 'smooth' });
      return;
    }
    switch (d.action) {
      case 'focus-search': $('#q').focus({ preventScroll: true }); $('#searchForm').scrollIntoView({ block: 'center' }); break;
      case 'show-saved': showSaved(); break;
      case 'open-cart': openCart(); break;
      case 'close-cart': closeCart(); break;
      case 'close-qv': closeQV(); break;
      case 'checkout': startCheckout(); break;
      case 'back-to-cart': view('cart'); break;
      case 'clear': $('#q').value = ''; activeCat = null; syncPills(); results.hidden = true; break;
    }
  });
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartEl.classList.contains('open')) closeCart();
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !qv.open) { e.preventDefault(); $('#q').focus(); }
  });

  /* ---------- 3D: card tilt ---------- */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (matchMedia('(pointer: fine)').matches && !reduceMotion) {
    let tilted = null;
    const reset = (el) => { el.style.transform = ''; el.classList.remove('tilting'); };
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest('.pcard:not(.mini), .spot, .tile, .feature');
      if (tilted && tilted !== el) reset(tilted);
      tilted = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const k = el.classList.contains('feature') ? 5 : 9;
      el.classList.add('tilting');
      el.style.transform = `perspective(900px) rotateX(${(-py * k).toFixed(2)}deg) rotateY(${(px * k).toFixed(2)}deg) translateZ(0) translateY(-4px)`;
      el.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
    }, { passive: true });
    document.addEventListener('pointerleave', () => tilted && reset(tilted));
  }

  /* ---------- 3D: sections rise into place ---------- */
  let io = null;
  function observeBands() {
    if (!('IntersectionObserver' in window) || reduceMotion) return;
    io = io || new IntersectionObserver((ens) => ens.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    $$('.band:not(#results):not(.in)').forEach((b) => { b.classList.add('rise'); io.observe(b); });
  }

  /* ---------- Boot ---------- */
  const load = (src) => new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.body.append(s);
  });

  S.loadCatalog('').then((data) => {
    CFG = data.settings || {};
    money = (n) => S.money(n, CFG.currency || '$');
    CATS = Array.isArray(data.categories) ? data.categories : [];
    P = (data.products || []).filter((p) => p && !p.hidden && Number.isFinite(+p.id)).map((p) => ({ ...p, id: +p.id, price: +p.price || 0 }));
    byId = new Map(P.map((p) => [p.id, p]));
    Object.keys(cart).forEach((k) => { if (!byId.has(+k) || !(cart[k] > 0)) delete cart[k]; });
    if (data.isPreview) document.body.insertAdjacentHTML('afterbegin', '<div class="preview-bar">وضع المعاينة: هيدا شكل المتجر بعد ما تنشر التغييرات. <a href="./">عرض النسخة المنشورة</a></div>');
    renderAll();
    renderCart();
    renderSaved();
    $$('.scroller').forEach(updateArrows);
    document.body.classList.add('ready');

    window.raff = { open: openQV, products: byId, money };
    const boot = () => load('../assets/js/three.min.js').then(() => load('store3d.js?v=4')).catch(() => { /* keep flat hero */ });
    if (document.readyState === 'complete') boot(); else addEventListener('load', boot, { once: true });
  }).catch(() => {
    $('#sections').innerHTML = '<p class="empty" style="text-align:center">ما قدرنا نحمّل المنتجات. حدّث الصفحة بعد شوي.</p>';
  });
})();
