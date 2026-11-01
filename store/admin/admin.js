/* رَفّ — admin. Everything is kept encrypted (AES-GCM, key derived from the PIN with PBKDF2)
   in this browser's localStorage. The public catalog is published as store/data/store.json. */
(() => {
  'use strict';
  if (window.top !== window.self) { document.documentElement.hidden = true; return; }

  const S = window.RaffShared;
  const { esc, num, art, ls } = S;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'raff-admin-v1', ITER = 310000, IDLE_MS = 15 * 60 * 1000;
  const REPO_UPLOAD = 'https://github.com/7brv6ymdsz-cmd/Mostfa/upload/main/store/data';
  const PAYPAL_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const SWATCHES = ['#efe8dc', '#e6d5bd', '#d9c3a5', '#e8c9bb', '#dfe3dc', '#cfd6c8', '#a9b59a', '#cfcac2', '#b5806a', '#332f2d'];

  const STATUS = {
    new: { t: 'جديد', c: 'st-new' },
    confirmed: { t: 'مؤكد', c: 'st-conf' },
    shipped: { t: 'تم الشحن', c: 'st-ship' },
    delivered: { t: 'تم التسليم', c: 'st-done' },
    cancelled: { t: 'ملغى', c: 'st-cancel' },
  };

  /* ---------- Icons ---------- */
  const I = {
    dashboard: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 4v3h6V4z"/>',
    orders: '<path d="M6 3h12l1 4H5zM5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M9 11h6"/>',
    products: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    customers: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    payments: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    publish: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    import: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    print: '<path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    upload: '<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3M12 4v12M7 9l5-5 5 5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    arrow: '<path d="M15 6l-6 6 6 6"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

  /* ---------- State ---------- */
  let key = null, salt = null, state = null, idleTimer = null, fails = 0, lockedUntil = 0;
  const cur = () => (state.settings.currency || '$');
  const money = (n) => S.money(Math.round((+n || 0) * 100) / 100, cur());
  const b64 = (buf) => { let s = ''; new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  const deriveKey = async (pin, saltBytes) => {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltBytes, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };
  let saving = Promise.resolve();
  const save = () => {
    saving = saving.then(async () => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(state)));
      try { localStorage.setItem(KEY, JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) })); }
      catch { toast('ما قدرنا نحفظ. ممكن المساحة خلصت بسبب الصور، صغّر الصور أو احذف بعضها.'); }
    });
    updatePublishDot();
    return saving;
  };
  const readStored = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };

  const publicCatalog = () => ({
    v: 1,
    updated: new Date().toISOString(),
    settings: state.settings,
    categories: state.categories,
    products: state.products.map(({ sold, ...p }) => p),
  });
  const catalogHash = () => {
    const s = JSON.stringify({ a: state.settings, b: state.categories, c: state.products.map(({ sold, ...p }) => p) });
    let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };
  const dirty = () => state && state.publishedHash !== catalogHash();
  const updatePublishDot = () => { if (state) { $('#publishDot').hidden = !dirty(); $('#publishBtn').classList.toggle('has-changes', dirty()); } };

  /* ---------- Lock ---------- */
  const stored = readStored();
  const setup = !stored;
  if (setup) {
    $('#lockMsg').textContent = 'أهلاً! اختار رمز سري من ٦ أرقام أو أكثر. ما في طريقة لاسترجاعه إذا نسيته.';
    $('#pin2').hidden = false; $('#lockSubmit').textContent = 'إنشاء الرمز والبدء';
    $('#pin').setAttribute('autocomplete', 'new-password');
    $('#forgotBtn').hidden = true;
  }
  if (!window.crypto || !crypto.subtle) {
    $('#lockErr').textContent = 'هالمتصفح ما بيدعم التشفير. افتح الصفحة بمتصفح حديث وعلى رابط https.';
    $('#lockErr').hidden = false; $('#lockSubmit').disabled = true;
  }
  $('#forgotBtn').addEventListener('click', () => { $('#forgotBox').hidden = false; $('#forgotBtn').hidden = true; });
  $('#forgotNo').addEventListener('click', () => { $('#forgotBox').hidden = true; $('#forgotBtn').hidden = false; });
  $('#forgotYes').addEventListener('click', () => { ls.del(KEY); location.reload(); });

  $('#lockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#lockErr'), pin = S.toLatinDigits($('#pin').value);
    err.hidden = true;
    if (Date.now() < lockedUntil) { err.textContent = `محاولات كتير. استنى ${num(Math.ceil((lockedUntil - Date.now()) / 1000))} ثانية.`; err.hidden = false; return; }
    $('#lockSubmit').disabled = true; $('#lockSubmit').classList.add('busy');
    try {
      if (setup) {
        if (pin.length < 6) throw new Error('الرمز قصير. استعمل ٦ أرقام أو أكثر.');
        if (pin !== S.toLatinDigits($('#pin2').value)) throw new Error('الرمزين مش متطابقين.');
        salt = crypto.getRandomValues(new Uint8Array(16));
        key = await deriveKey(pin, salt);
        state = await freshState();
        await save();
      } else {
        salt = unb64(stored.salt);
        const k = await deriveKey(pin, salt);
        try {
          const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(stored.iv) }, k, unb64(stored.ct));
          state = JSON.parse(new TextDecoder().decode(pt)); key = k; fails = 0;
        } catch {
          fails++;
          if (fails >= 5) { lockedUntil = Date.now() + 30000 * (fails - 4); }
          throw new Error('الرمز غلط.');
        }
      }
      migrate();
      enterApp();
    } catch (ex) {
      err.textContent = ex.message || 'صار خطأ.'; err.hidden = false;
      $('#pin').select();
    } finally { $('#lockSubmit').disabled = false; $('#lockSubmit').classList.remove('busy'); }
  });

  async function freshState() {
    let cat = null;
    try { cat = await S.loadCatalog('../'); } catch { /* start empty */ }
    const base = {
      settings: {
        name: 'متجري', tagline: '', banner: '', bannerSub: '', currency: '$', currencyCode: 'USD',
        shipping: { fee: 0, freeOver: 0 }, whatsapp: '',
        payments: { cod: { on: true }, paypal: { on: false, user: '' }, bank: { on: false, bank: '', holder: '', iban: '' } },
      },
      categories: [], products: [],
    };
    const s = { ...base, ...(cat || {}), orders: [], publishedHash: null, created: Date.now() };
    delete s.isPreview; delete s.v; delete s.updated;
    return s;
  }
  function migrate() {
    state.orders = state.orders || [];
    state.products = state.products || [];
    state.categories = state.categories || [];
    state.settings = state.settings || {};
    state.settings.payments = { cod: { on: true }, paypal: { on: false, user: '' }, bank: { on: false, bank: '', holder: '', iban: '' }, ...(state.settings.payments || {}) };
    state.settings.shipping = { fee: 0, freeOver: 0, ...(state.settings.shipping || {}) };
    if (state.publishedHash === undefined) state.publishedHash = null;
    if (state.publishedHash === null && !state.products.some((p) => p._edited)) state.publishedHash = catalogHash();
  }

  const lock = () => { state = null; key = null; location.hash = ''; location.reload(); };
  const bumpIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(lock, IDLE_MS); };

  function enterApp() {
    $('#lock').hidden = true; $('#app').hidden = false;
    ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, bumpIdle, { passive: true }));
    bumpIdle();
    const n = syncLocalOrders(true);
    if (n) toast(`انضاف ${num(n)} طلب من هالجهاز`);
    route();
  }

  /* ---------- Router ---------- */
  const NAV = [
    { id: 'dashboard', t: 'الرئيسية', k: 'نظرة عامة' },
    { id: 'orders', t: 'الطلبات', k: 'المبيعات' },
    { id: 'products', t: 'المنتجات', k: 'الكتالوج' },
    { id: 'customers', t: 'العملاء', k: 'المبيعات' },
    { id: 'payments', t: 'الدفع والشحن', k: 'الإعدادات' },
    { id: 'settings', t: 'الإعدادات', k: 'المتجر' },
    { id: 'publish', t: 'النشر', k: 'المتجر' },
  ];
  const VIEWS = {};
  let current = null;
  function route() {
    if (!state) return;
    const [id, arg] = (location.hash.slice(1) || 'dashboard').split('/');
    const nav = NAV.find((n) => n.id === id) || NAV[0];
    current = nav.id;
    const newCount = state.orders.filter((o) => o.status === 'new').length;
    $('#sideNav').innerHTML = NAV.filter((n) => n.id !== 'publish').map((n) => `<a href="#${n.id}" class="${n.id === current ? 'on' : ''}" ${n.id === current ? 'aria-current="page"' : ''}>${ic(n.id)}<span>${n.t}</span>${n.id === 'orders' && newCount ? `<em>${num(newCount)}</em>` : ''}</a>`).join('');
    $('#topTitle').textContent = nav.t;
    $('#topKicker').textContent = nav.k;
    $('#topActions').innerHTML = '';
    $('#publishBtn').classList.toggle('on', current === 'publish');
    closeSheet();
    VIEWS[current](arg ? decodeURIComponent(arg) : undefined);
    updatePublishDot();
    $('#view').focus({ preventScroll: true });
    scrollTo(0, 0);
  }
  addEventListener('hashchange', route);

  /* ---------- Shared helpers ---------- */
  let tt;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2600); }
  const fmtDate = (t, withTime = false) => new Intl.DateTimeFormat('ar-EG', withTime ? { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(t));
  const ago = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'هلّق';
    if (m < 60) return `من ${num(m)} دقيقة`;
    const h = Math.round(m / 60); if (h < 24) return `من ${num(h)} ساعة`;
    const d = Math.round(h / 24); return d < 30 ? `من ${num(d)} يوم` : fmtDate(t);
  };
  const badge = (o) => `<span class="badge ${STATUS[o.status].c}">${STATUS[o.status].t}</span>`;
  const payBadge = (o) => (o.status === 'cancelled' ? '' : o.paid ? '<span class="badge st-paid">مدفوع</span>' : '<span class="badge st-unpaid">غير مدفوع</span>');
  const live = (o) => o.status !== 'cancelled';
  const byPid = () => new Map(state.products.map((p) => [p.id, p]));
  const thumb = (p, cls = 'thumb') => `<span class="${cls}" style="--bg:${S.hex(p && p.bg, '#efe8dc')}">${p ? art(p) : ''}</span>`;
  const empty = (title, text, actions = '') => `<div class="empty-state"><div class="empty-ill" aria-hidden="true">${ic('orders')}</div><h3>${title}</h3><p>${text}</p><div class="row-btns center">${actions}</div></div>`;
  const setActions = (html) => { $('#topActions').innerHTML = html; };
  const field = (label, inner, hint = '') => `<label class="f"><span>${label}</span>${inner}${hint ? `<small>${hint}</small>` : ''}</label>`;
  const toggle = (name, on, label) => `<label class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i><span>${label}</span></label>`;

  /* ---------- Order sync / import ---------- */
  function applyStock(o, dir) {
    const m = byPid();
    o.items.forEach((x) => { const p = m.get(x.id); if (p && Number.isFinite(+p.stock)) p.stock = Math.max(0, (+p.stock) - dir * x.qty); });
  }
  function addOrder(o) {
    if (state.orders.some((x) => x.id === o.id)) return false;
    o.history = o.history || [{ t: o.createdAt, s: 'new' }];
    state.orders.unshift(o);
    state.orders.sort((a, b) => b.createdAt - a.createdAt);
    return true;
  }
  function syncLocalOrders(silent) {
    const mine = ls.get('raff.myorders', []);
    let n = 0;
    mine.forEach((o) => { if (o && o.id && Array.isArray(o.items) && addOrder({ ...o, status: 'new', paid: false })) n++; });
    if (n) save();
    if (!silent && !n) toast('ما في طلبات جديدة على هالجهاز');
    return n;
  }
  function importDialog() {
    openModal(`
      <div class="modal-head"><h2>استيراد طلب</h2><button class="icon-btn" type="button" data-act="close-modal" aria-label="إغلاق">${ic('close')}</button></div>
      <p class="muted">لما الزبون يكمّل طلبه، بيبعتلك رسالة واتساب فيها «رمز الطلب». الصق الرسالة كاملة هون (أو الرمز لحاله). فيك تلصق كذا رسالة مع بعض.</p>
      <textarea class="ta" id="importText" rows="7" placeholder="RAFF1.eyJ..." dir="ltr"></textarea>
      <p class="err" id="importErr" hidden></p>
      <div class="row-btns end"><button class="btn" type="button" data-act="close-modal">إلغاء</button><button class="btn violet" type="button" id="importGo">${ic('import')}استيراد</button></div>`);
    $('#importText').focus();
    $('#importGo').addEventListener('click', () => {
      const text = $('#importText').value;
      const parts = text.split(/(?=RAFF1\.)/).filter((x) => x.includes('RAFF1.'));
      let added = 0, dup = 0;
      parts.forEach((part) => { const o = S.decodeOrder(part); if (o) { if (addOrder(o)) added++; else dup++; } });
      if (!added && !dup) { $('#importErr').textContent = 'ما لقينا رمز طلب صحيح بالنص. تأكد إنك نسخت الرسالة كاملة.'; $('#importErr').hidden = false; return; }
      save(); closeModal();
      toast(added ? `انضاف ${num(added)} طلب${dup ? `، و${num(dup)} كان موجود` : ''}` : 'الطلب موجود من قبل');
      if (current === 'orders' || current === 'dashboard') route();
    });
  }

  /* ---------- Demo data ---------- */
  function seedDemo() {
    const names = ['سارة أحمد', 'محمد الخطيب', 'ليلى حداد', 'عمر يوسف', 'نور الهدى', 'كريم سليمان', 'ريم العلي', 'يوسف منصور', 'هبة ناصر', 'علي حسن', 'جنى خليل', 'طارق زيدان'];
    const cities = ['بيروت', 'عمّان', 'دمشق', 'الرياض', 'دبي', 'القاهرة', 'طرابلس'];
    const live = state.products.filter((p) => !p.hidden);
    if (!live.length) { toast('أضف منتجات أولاً'); return; }
    const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'confirmed', 'new', 'new', 'cancelled'];
    for (let i = 0; i < 26; i++) {
      const t = Date.now() - Math.floor(Math.random() * 29 * 864e5) - Math.floor(Math.random() * 864e5);
      const ci = Math.floor(Math.random() * names.length);
      const items = [];
      const k = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < k; j++) {
        const p = live[Math.floor(Math.random() * live.length)];
        const ex = items.find((x) => x.id === p.id);
        if (ex) ex.qty++; else items.push({ id: p.id, qty: 1 + (Math.random() < 0.2 ? 1 : 0), price: p.price, name: p.name });
      }
      const sub = items.reduce((s, x) => s + x.qty * x.price, 0);
      const sh = state.settings.shipping;
      const ship = sh.freeOver > 0 && sub >= sh.freeOver ? 0 : +sh.fee || 0;
      const st = statuses[Math.floor(Math.random() * statuses.length)];
      const methods = ['cod', 'cod', 'paypal', 'bank'];
      const method = methods[Math.floor(Math.random() * methods.length)];
      addOrder({
        id: S.newOrderId().slice(0, 6) + i.toString(36).toUpperCase() + 'D', createdAt: t, demo: true,
        customer: { name: names[ci], phone: `+9617${String(1000000 + ci * 7919).slice(0, 7)}`, city: cities[ci % cities.length], address: 'الشارع الرئيسي، بناية ' + num(3 + ci), notes: '' },
        method, items, subtotal: sub, shipping: ship, total: sub + ship,
        status: st, paid: st === 'delivered' || (st !== 'new' && st !== 'cancelled' && method !== 'cod'),
        history: [{ t, s: 'new' }],
      });
    }
    save(); toast('انضافت طلبات تجريبية. فيك تمسحها من الإعدادات.'); route();
  }

  /* ================= Views ================= */

  /* ---------- Dashboard ---------- */
  let period = 30;
  VIEWS.dashboard = () => {
    setActions(`<button class="btn" type="button" data-act="import">${ic('import')}<span>استيراد طلب</span></button>`);
    const now = Date.now(), day = 864e5;
    const from = period ? now - period * day : 0;
    const prevFrom = period ? from - period * day : 0;
    const inP = state.orders.filter((o) => o.createdAt >= from && live(o));
    const inPrev = period ? state.orders.filter((o) => o.createdAt >= prevFrom && o.createdAt < from && live(o)) : [];
    const sum = (l) => l.reduce((s, o) => s + o.total, 0);
    const sales = sum(inP), prevSales = sum(inPrev);
    const avg = inP.length ? sales / inP.length : 0;
    const unpaid = state.orders.filter((o) => live(o) && !o.paid);
    const delta = (a, b) => {
      if (!period || !b) return '';
      const d = Math.round(((a - b) / b) * 100);
      return `<span class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${num(Math.abs(d))}٪</span>`;
    };
    const low = state.products.filter((p) => !p.hidden && Number.isFinite(+p.stock) && p.stock <= 3).sort((a, b) => a.stock - b.stock);

    // top products
    const tally = new Map();
    inP.forEach((o) => o.items.forEach((x) => { const t = tally.get(x.id) || { qty: 0, rev: 0, name: x.name }; t.qty += x.qty; t.rev += x.qty * x.price; tally.set(x.id, t); }));
    const top = [...tally.entries()].sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
    const pm = byPid();

    const hasOrders = state.orders.length > 0;
    $('#view').innerHTML = `
      ${dirty() ? `<a class="notice" href="#publish">${ic('publish')}<span><b>عندك تعديلات ما انتشرت لسا.</b> الزبائن بيشوفوا النسخة القديمة لحتى تنشر.</span><em>انشر هلّق</em></a>` : ''}
      ${!state.settings.whatsapp ? `<a class="notice soft" href="#payments">${ic('whatsapp')}<span><b>ما حطيت رقم واتساب.</b> بدونه الزبون ما فيه يبعتلك الطلب بكبسة وحدة.</span><em>أضف الرقم</em></a>` : ''}
      <div class="seg" role="group" aria-label="الفترة">
        ${[[7, '٧ أيام'], [30, '٣٠ يوم'], [90, '٣ أشهر'], [0, 'الكل']].map(([v, t]) => `<button type="button" data-period="${v}" aria-pressed="${period === v}">${t}</button>`).join('')}
      </div>
      <div class="kpis">
        <div class="kpi hero"><span>المبيعات</span><b>${money(sales)}</b>${delta(sales, prevSales)}<small>${period ? `مقارنة بالـ${num(period)} يوم يلي قبل` : 'من أول طلب'}</small></div>
        <div class="kpi"><span>الطلبات</span><b>${num(inP.length)}</b>${delta(inP.length, inPrev.length)}</div>
        <div class="kpi"><span>متوسط الطلب</span><b>${money(avg)}</b></div>
        <a class="kpi" href="#orders/unpaid"><span>بانتظار الدفع</span><b>${num(unpaid.length)}</b><small>${money(sum(unpaid))}</small></a>
      </div>
      <div class="dash-grid">
        <section class="card chart-card">
          <div class="card-head"><h2>المبيعات اليومية</h2><span class="muted" id="chartRange"></span></div>
          ${hasOrders ? '<div class="chart" id="chart"></div>' : empty('ما في طلبات لسا', 'أول ما توصلك طلبات من المتجر، رح تشوف المبيعات هون.', `<button class="btn violet" type="button" data-act="demo">${ic('plus')}جرّب ببيانات تجريبية</button><button class="btn" type="button" data-act="import">${ic('import')}استيراد طلب</button>`)}
        </section>
        <section class="card">
          <div class="card-head"><h2>الأكثر مبيعاً</h2></div>
          ${top.length ? `<ol class="rank">${top.map(([id, t], i) => `<li><span class="rank-n">${num(i + 1)}</span>${thumb(pm.get(id))}<div><b>${esc(t.name)}</b><small>${num(t.qty)} قطعة</small></div><strong>${money(t.rev)}</strong></li>`).join('')}</ol>` : '<p class="muted pad">ما في مبيعات بهالفترة.</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>آخر الطلبات</h2><a class="link" href="#orders">الكل</a></div>
          ${state.orders.length ? `<ul class="mini-orders">${state.orders.slice(0, 6).map((o) => `<li><button type="button" data-order="${esc(o.id)}"><div><b>${esc(o.customer.name)}</b><small>${esc(o.id)} · ${ago(o.createdAt)}</small></div><span>${money(o.total)}</span>${badge(o)}</button></li>`).join('')}</ul>` : '<p class="muted pad">لسا ما في طلبات.</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>تنبيهات المخزون</h2><a class="link" href="#products">المنتجات</a></div>
          ${low.length ? `<ul class="stock-list">${low.slice(0, 6).map((p) => `<li><button type="button" data-product="${p.id}">${thumb(p)}<b>${esc(p.name)}</b><span class="badge ${p.stock <= 0 ? 'st-cancel' : 'st-new'}">${p.stock <= 0 ? 'نفد' : `باقي ${num(p.stock)}`}</span></button></li>`).join('')}</ul>` : `<p class="muted pad ok">${ic('check')} كل المنتجات متوفرة.</p>`}
        </section>
      </div>`;
    if (hasOrders) drawChart(period || 30);
  };

  function drawChart(days) {
    const el = $('#chart'); if (!el) return;
    const day = 864e5;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: days }, (_, i) => ({ t: start.getTime() - (days - 1 - i) * day, v: 0, n: 0 }));
    state.orders.filter(live).forEach((o) => {
      const i = Math.floor((o.createdAt - buckets[0].t) / day);
      if (i >= 0 && i < days) { buckets[i].v += o.total; buckets[i].n++; }
    });
    const max = Math.max(...buckets.map((b) => b.v), 1);
    const nice = (m) => { const p = 10 ** Math.floor(Math.log10(m)); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
    const top = nice(max);
    const W = Math.max(300, Math.round(el.clientWidth) || 640), H = W < 500 ? 200 : 230, padT = 12, padB = 26, padS = 48;
    const iw = W - padS - 8, ih = H - padT - padB;
    const bw = iw / days, gap = Math.min(2 + bw * 0.25, 8);
    const ticks = [0, top / 2, top];
    const x = (i) => W - padS - (i + 1) * bw + gap / 2; // RTL: newest on the left
    const fmtD = (t) => new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(new Date(t));
    const every = days <= 7 ? 1 : Math.ceil(days / Math.max(3, Math.floor(W / 90)));
    $('#chartRange').textContent = `${fmtD(buckets[0].t)} – ${fmtD(buckets[days - 1].t)}`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني للمبيعات اليومية">
      ${ticks.map((v) => { const y = padT + ih - (v / top) * ih; return `<line class="grid" x1="8" x2="${W - padS}" y1="${y}" y2="${y}"/><text class="axis" x="${W - padS + 8}" y="${y + 4}" text-anchor="start">${esc(S.money(v, cur()))}</text>`; }).join('')}
      ${buckets.map((b, i) => {
        const h = b.v ? Math.max(3, (b.v / top) * ih) : 0;
        const y = padT + ih - h, w = Math.max(2, bw - gap), r = Math.min(4, w / 2, h);
        const path = h ? `M${x(i)},${padT + ih} V${y + r} q0,-${r} ${r},-${r} H${x(i) + w - r} q${r},0 ${r},${r} V${padT + ih} Z` : '';
        return `<g class="bar${i === days - 1 ? ' today' : ''}" data-i="${i}"><rect class="hit" x="${x(i) - gap / 2}" y="${padT}" width="${bw}" height="${ih}"/>${path ? `<path d="${path}"/>` : ''}</g>`;
      }).join('')}
      ${buckets.map((b, i) => ((days - 1 - i) % every === 0 ? `<text class="axis" x="${x(i) + (bw - gap) / 2}" y="${H - 6}" text-anchor="middle">${fmtD(b.t)}</text>` : '')).join('')}
    </svg><div class="tip" id="chartTip" hidden></div>
    <table class="sr"><caption>المبيعات اليومية</caption><tbody>${buckets.map((b) => `<tr><th>${fmtD(b.t)}</th><td>${money(b.v)}</td><td>${num(b.n)} طلب</td></tr>`).join('')}</tbody></table>`;
    const tip = $('#chartTip');
    el.addEventListener('pointermove', (e) => {
      const g = e.target.closest('.bar');
      $$('.bar.hover', el).forEach((n) => n.classList.remove('hover'));
      if (!g) { tip.hidden = true; return; }
      g.classList.add('hover');
      const b = buckets[+g.dataset.i];
      tip.innerHTML = `<b>${money(b.v)}</b><span>${fmtD(b.t)} · ${num(b.n)} طلب</span>`;
      const r = el.getBoundingClientRect(), gr = g.getBoundingClientRect();
      tip.hidden = false;
      const left = Math.min(Math.max(gr.left - r.left + gr.width / 2, 60), r.width - 60);
      tip.style.left = `${left}px`;
    });
    el.addEventListener('pointerleave', () => { tip.hidden = true; $$('.bar.hover', el).forEach((n) => n.classList.remove('hover')); });
  }

  /* ---------- Orders ---------- */
  let oFilter = 'all', oQuery = '';
  VIEWS.orders = (arg) => {
    if (arg === 'unpaid') oFilter = 'unpaid';
    else if (arg && arg.startsWith('phone:')) { oQuery = arg.slice(6); oFilter = 'all'; }
    setActions(`<button class="btn" type="button" data-act="sync">${ic('download')}<span>من هالجهاز</span></button><button class="btn violet" type="button" data-act="import">${ic('import')}<span>استيراد طلب</span></button>`);
    const counts = { all: state.orders.length, unpaid: state.orders.filter((o) => live(o) && !o.paid).length };
    Object.keys(STATUS).forEach((k) => { counts[k] = state.orders.filter((o) => o.status === k).length; });
    $('#view').innerHTML = `
      <div class="toolbar">
        <label class="search">${ic('search')}<input type="search" id="oq" placeholder="ابحث بالاسم، الرقم، الهاتف…" value="${esc(oQuery)}"></label>
      </div>
      <div class="chips" role="group" aria-label="فلترة الطلبات">
        ${[['all', 'الكل'], ['new', 'جديد'], ['confirmed', 'مؤكد'], ['shipped', 'تم الشحن'], ['delivered', 'تم التسليم'], ['unpaid', 'غير مدفوع'], ['cancelled', 'ملغى']]
          .map(([k, t]) => `<button type="button" data-ofilter="${k}" aria-pressed="${oFilter === k}">${t}<em>${num(counts[k])}</em></button>`).join('')}
      </div>
      <div id="orderList"></div>`;
    $('#oq').addEventListener('input', (e) => { oQuery = e.target.value; renderOrderList(); });
    renderOrderList();
    if (arg && !['unpaid'].includes(arg) && !arg.startsWith('phone:')) openOrder(arg);
  };
  function renderOrderList() {
    const q = S.norm(oQuery), qd = S.toLatinDigits(oQuery).replace(/\D/g, '');
    const list = state.orders.filter((o) => {
      if (oFilter === 'unpaid' ? !(live(o) && !o.paid) : oFilter !== 'all' && o.status !== oFilter) return false;
      if (!q) return true;
      return S.norm(`${o.id} ${o.customer.name} ${o.customer.city}`).includes(q) || (qd.length >= 3 && o.customer.phone.replace(/\D/g, '').includes(qd));
    });
    const el = $('#orderList');
    if (!state.orders.length) {
      el.innerHTML = empty('ما في طلبات لسا', 'الطلبات بتوصلك على واتساب مع «رمز طلب». الصقه هون بكبسة «استيراد طلب»، أو جرّب اللوحة ببيانات تجريبية.',
        `<button class="btn violet" type="button" data-act="import">${ic('import')}استيراد طلب</button><button class="btn" type="button" data-act="demo">${ic('plus')}بيانات تجريبية</button>`);
      return;
    }
    if (!list.length) { el.innerHTML = '<p class="muted pad center">ما في طلبات بهالفلتر.</p>'; return; }
    el.innerHTML = `<div class="table-card"><table class="table">
      <thead><tr><th>الطلب</th><th>العميل</th><th class="hide-sm">التاريخ</th><th class="hide-sm">الدفع</th><th>الحالة</th><th class="num">المبلغ</th></tr></thead>
      <tbody>${list.map((o) => `<tr data-order="${esc(o.id)}" tabindex="0">
        <td><b class="oid">${esc(o.id)}</b>${o.demo ? ' <span class="badge st-demo">تجريبي</span>' : ''}</td>
        <td><b>${esc(o.customer.name)}</b><small>${esc(o.customer.city)}</small></td>
        <td class="hide-sm"><span>${fmtDate(o.createdAt)}</span><small>${ago(o.createdAt)}</small></td>
        <td class="hide-sm">${payBadge(o)}<small>${esc(S.METHODS[o.method] || '')}</small></td>
        <td>${badge(o)}</td>
        <td class="num"><b>${money(o.total)}</b><small>${num(o.items.reduce((s, x) => s + x.qty, 0))} قطعة</small></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function openOrder(id) {
    const o = state.orders.find((x) => x.id === id);
    if (!o) return;
    const pm = byPid();
    const wa = o.customer.phone.replace(/\D/g, '');
    const msg = {
      new: `مرحبا ${o.customer.name}، استلمنا طلبك ${o.id} بقيمة ${money(o.total)}. منأكد معك التفاصيل؟`,
      confirmed: `مرحبا ${o.customer.name}، طلبك ${o.id} تأكد وعم نجهّزه.`,
      shipped: `مرحبا ${o.customer.name}، طلبك ${o.id} انشحن وبيوصلك قريباً.`,
      delivered: `مرحبا ${o.customer.name}، شكراً لثقتك! نتمنى يكون عجبك طلبك ${o.id}.`,
      cancelled: `مرحبا ${o.customer.name}، بخصوص طلبك ${o.id}…`,
    }[o.status];
    openSheet(`
      <div class="sheet-head">
        <div><p class="muted">${fmtDate(o.createdAt, true)}</p><h2 class="oid">${esc(o.id)}</h2></div>
        <button class="icon-btn" type="button" data-act="close-sheet" aria-label="إغلاق">${ic('close')}</button>
      </div>
      <div class="sheet-body">
        <div class="status-steps" role="group" aria-label="حالة الطلب">
          ${['new', 'confirmed', 'shipped', 'delivered'].map((k) => `<button type="button" data-status="${k}" aria-pressed="${o.status === k}" class="${['new', 'confirmed', 'shipped', 'delivered'].indexOf(k) <= ['new', 'confirmed', 'shipped', 'delivered'].indexOf(o.status) && o.status !== 'cancelled' ? 'past' : ''}"><i></i>${STATUS[k].t}</button>`).join('')}
        </div>
        <div class="paid-row">
          ${toggle('paid', o.paid, o.paid ? 'مدفوع' : 'غير مدفوع')}
          <span class="muted">${esc(S.METHODS[o.method] || '')}</span>
        </div>

        <section class="block">
          <h3>المنتجات</h3>
          <ul class="line-items">${o.items.map((x) => `<li>${thumb(pm.get(x.id))}<div><b>${esc(x.name)}</b><small>${money(x.price)} × ${num(x.qty)}</small></div><span>${money(x.price * x.qty)}</span></li>`).join('')}</ul>
          <div class="sums"><div><span>المنتجات</span><b>${money(o.subtotal)}</b></div><div><span>التوصيل</span><b>${o.shipping ? money(o.shipping) : 'مجاني'}</b></div><div class="grand"><span>المجموع</span><b>${money(o.total)}</b></div></div>
        </section>

        <section class="block">
          <h3>العميل</h3>
          <p class="cust-name">${esc(o.customer.name)}</p>
          <p class="muted" dir="ltr" style="text-align:right">${esc(o.customer.phone)}</p>
          <p>${esc(o.customer.city)}، ${esc(o.customer.address)}</p>
          ${o.customer.notes ? `<p class="quote">${esc(o.customer.notes)}</p>` : ''}
          <div class="row-btns">
            ${wa ? `<a class="btn" href="https://wa.me/${wa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener noreferrer">${ic('whatsapp')}واتساب</a>` : ''}
            ${wa ? `<a class="btn" href="tel:+${wa}">${ic('phone')}اتصال</a>` : ''}
          </div>
        </section>

        <section class="block">
          <h3>ملاحظة داخلية</h3>
          <textarea class="ta" id="oNote" rows="2" placeholder="بتنشاف عندك بس">${esc(o.note || '')}</textarea>
        </section>

        ${o.history && o.history.length > 1 ? `<section class="block"><h3>السجل</h3><ul class="history">${o.history.slice().reverse().map((h) => `<li><i></i><span>${STATUS[h.s] ? STATUS[h.s].t : esc(h.s)}</span><small>${fmtDate(h.t, true)}</small></li>`).join('')}</ul></section>` : ''}

        <div class="row-btns sheet-actions">
          <button class="btn" type="button" data-act="print" data-id="${esc(o.id)}">${ic('print')}فاتورة</button>
          ${o.status !== 'cancelled' ? `<button class="btn" type="button" data-status="cancelled">إلغاء الطلب</button>` : `<button class="btn" type="button" data-status="new">إعادة فتح</button>`}
          <button class="btn danger-ghost" type="button" data-act="delete-order" data-id="${esc(o.id)}">${ic('trash')}حذف</button>
        </div>
      </div>`);
    const sheet = $('#sheetInner');
    sheet.dataset.order = o.id;
    $('[name=paid]', sheet).addEventListener('change', (e) => { o.paid = e.target.checked; e.target.nextElementSibling.nextElementSibling.textContent = o.paid ? 'مدفوع' : 'غير مدفوع'; save(); refreshBehind(); });
    $('#oNote').addEventListener('change', (e) => { o.note = e.target.value.slice(0, 1000); save(); });
  }
  function setStatus(id, s) {
    const o = state.orders.find((x) => x.id === id); if (!o || o.status === s) return;
    const before = o.status;
    // keep stock honest: reserve when an order is confirmed, give it back when cancelled
    if (!o.stockApplied && ['confirmed', 'shipped', 'delivered'].includes(s)) { applyStock(o, 1); o.stockApplied = true; }
    if (o.stockApplied && (s === 'cancelled' || s === 'new')) { applyStock(o, -1); o.stockApplied = false; }
    o.status = s;
    if (s === 'delivered' && o.method === 'cod') o.paid = true;
    (o.history = o.history || []).push({ t: Date.now(), s });
    save();
    toast(`${STATUS[before].t} ← ${STATUS[s].t}`);
    openOrder(id); refreshBehind();
  }
  const refreshBehind = () => {
    if (current === 'orders') renderOrderList();
    else if (current === 'dashboard' || current === 'customers') { const keep = $('#sheetInner').dataset.order; VIEWS[current](); if (keep) openOrder(keep); }
    const newCount = state.orders.filter((o) => o.status === 'new').length;
    const em = $('#sideNav a[href="#orders"] em');
    if (em) { if (newCount) em.textContent = num(newCount); else em.remove(); }
  };

  function printInvoice(id) {
    const o = state.orders.find((x) => x.id === id); if (!o) return;
    $('#invoice').innerHTML = `
      <div class="inv-head"><div class="inv-mark">${esc(state.settings.name)}</div><div><h1>فاتورة</h1><p class="oid">${esc(o.id)}</p><p>${fmtDate(o.createdAt)}</p></div></div>
      <div class="inv-to"><h3>إلى</h3><p><b>${esc(o.customer.name)}</b></p><p dir="ltr" style="text-align:right">${esc(o.customer.phone)}</p><p>${esc(o.customer.city)}، ${esc(o.customer.address)}</p></div>
      <table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
      <tbody>${o.items.map((x) => `<tr><td>${esc(x.name)}</td><td>${num(x.qty)}</td><td>${money(x.price)}</td><td>${money(x.price * x.qty)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="3">المنتجات</td><td>${money(o.subtotal)}</td></tr><tr><td colspan="3">التوصيل</td><td>${money(o.shipping)}</td></tr><tr class="g"><td colspan="3">المجموع</td><td>${money(o.total)}</td></tr></tfoot></table>
      <p class="inv-foot">طريقة الدفع: ${esc(S.METHODS[o.method] || '')} · ${o.paid ? 'مدفوع' : 'غير مدفوع'}</p>`;
    window.print();
  }

  /* ---------- Products ---------- */
  let pQuery = '', pCat = 'all';
  VIEWS.products = (arg) => {
    setActions(`<button class="btn violet" type="button" data-act="new-product">${ic('plus')}<span>منتج جديد</span></button>`);
    $('#view').innerHTML = `
      <div class="toolbar">
        <label class="search">${ic('search')}<input type="search" id="pq" placeholder="ابحث عن منتج…" value="${esc(pQuery)}"></label>
        <select class="select" id="pc" aria-label="التصنيف"><option value="all">كل التصنيفات</option>${state.categories.map((c) => `<option value="${esc(c.id)}" ${pCat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}<option value="hidden" ${pCat === 'hidden' ? 'selected' : ''}>المخفية</option><option value="low" ${pCat === 'low' ? 'selected' : ''}>مخزون قليل</option></select>
      </div>
      <div class="pgrid" id="pgrid"></div>`;
    $('#pq').addEventListener('input', (e) => { pQuery = e.target.value; renderProducts(); });
    $('#pc').addEventListener('change', (e) => { pCat = e.target.value; renderProducts(); });
    renderProducts();
    if (arg) editProduct(+arg);
  };
  function renderProducts() {
    const q = S.norm(pQuery);
    const list = state.products.filter((p) => {
      if (pCat === 'hidden' ? !p.hidden : pCat === 'low' ? !(p.stock <= 3) : pCat !== 'all' && p.cat !== pCat) return false;
      return !q || S.norm(`${p.name} ${p.store}`).includes(q);
    });
    const cats = new Map(state.categories.map((c) => [c.id, c.name]));
    $('#pgrid').innerHTML = (list.length ? list.map((p) => `
      <button class="pc${p.hidden ? ' is-hidden' : ''}" type="button" data-product="${p.id}">
        <span class="pc-img" style="--bg:${S.hex(p.bg, '#efe8dc')}">${art(p)}
          ${p.featured ? `<span class="pc-flag" title="مميز">${ic('star')}</span>` : ''}
          ${p.hidden ? '<span class="badge st-cancel pc-hidden">مخفي</span>' : ''}
        </span>
        <span class="pc-meta"><b>${esc(p.name)}</b><small>${esc(cats.get(p.cat) || 'بلا تصنيف')} · ${esc(p.store || '')}</small>
          <span class="pc-row"><strong>${money(p.price)}</strong>${p.stock <= 0 ? '<span class="badge st-cancel">نفد</span>' : p.stock <= 3 ? `<span class="badge st-new">باقي ${num(p.stock)}</span>` : `<span class="muted">${num(p.stock)} بالمخزون</span>`}</span>
        </span>
      </button>`).join('') : '') + `<button class="pc add-card" type="button" data-act="new-product">${ic('plus')}<b>منتج جديد</b></button>`;
  }

  function editProduct(id) {
    const isNew = !id;
    const p0 = isNew ? { id: Math.max(0, ...state.products.map((x) => +x.id || 0)) + 1, name: '', store: state.settings.name, price: 0, compare: 0, stock: 10, cat: (state.categories[0] || {}).id || '', kind: 'tote', bg: '#efe8dc', fg: '#f4efe6', ac: '#8a6a4a', desc: '', featured: false, hidden: false, rating: 0, reviews: 0 }
      : state.products.find((x) => x.id === id);
    if (!p0) return;
    const p = { ...p0 };
    const kinds = S.KINDS.map((k) => `<button type="button" class="kind${p.kind === k && !p.img ? ' on' : ''}" data-kind="${k}" title="${S.KIND_NAMES[k]}" aria-label="${S.KIND_NAMES[k]}">${art({ kind: k, fg: '#665a54', ac: '#332f2d' })}</button>`).join('');
    openModal(`
      <form class="editor" id="editor" novalidate>
        <div class="modal-head"><h2>${isNew ? 'منتج جديد' : 'تعديل المنتج'}</h2><button class="icon-btn" type="button" data-act="close-modal" aria-label="إغلاق">${ic('close')}</button></div>
        <div class="editor-grid">
          <div class="editor-preview">
            <div class="prev-card"><span class="prev-img" id="prevImg"></span><b id="prevName"></b><small id="prevStore"></small><strong id="prevPrice"></strong></div>
            <div class="img-tools">
              <label class="btn wide">${ic('upload')}<span>${p.img ? 'غيّر الصورة' : 'ارفع صورة'}</span><input type="file" accept="image/*" id="imgIn" hidden></label>
              <button class="btn wide" type="button" id="imgRm" ${p.img ? '' : 'hidden'}>${ic('trash')}شيل الصورة</button>
            </div>
            <div class="art-tools" id="artTools" ${p.img ? 'hidden' : ''}>
              <p class="muted">أو اختار رسمة ولون خلفية:</p>
              <div class="kinds">${kinds}</div>
              <div class="swatches">${SWATCHES.map((c) => `<button type="button" class="sw${p.bg === c ? ' on' : ''}" data-bg="${c}" style="--c:${c}" aria-label="لون ${c}"></button>`).join('')}<label class="sw custom" title="لون آخر"><input type="color" id="bgIn" value="${S.hex(p.bg, '#efe8dc')}"></label></div>
            </div>
          </div>
          <div class="editor-fields">
            ${field('اسم المنتج', `<input name="name" value="${esc(p.name)}" required maxlength="80">`)}
            <div class="two">
              ${field('المتجر / الماركة', `<input name="store" value="${esc(p.store)}" maxlength="60">`)}
              ${field('التصنيف', `<select name="cat">${state.categories.map((c) => `<option value="${esc(c.id)}" ${p.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`, state.categories.length ? '' : 'أضف تصنيفات من الإعدادات')}
            </div>
            <div class="three">
              ${field(`السعر (${esc(cur())})`, `<input name="price" type="number" min="0" step="0.01" inputmode="decimal" value="${p.price}" required dir="ltr">`)}
              ${field('قبل الخصم', `<input name="compare" type="number" min="0" step="0.01" inputmode="decimal" value="${p.compare || ''}" dir="ltr" placeholder="اختياري">`)}
              ${field('المخزون', `<input name="stock" type="number" min="0" step="1" inputmode="numeric" value="${Number.isFinite(+p.stock) ? p.stock : ''}" dir="ltr">`)}
            </div>
            ${field('الوصف', `<textarea name="desc" rows="4" maxlength="600">${esc(p.desc)}</textarea>`)}
            <div class="toggles">
              ${toggle('featured', p.featured, 'منتج مميز (بيطلع بـ«مختارات لك» وبالواجهة الـ3D)')}
              ${toggle('visible', !p.hidden, 'ظاهر بالمتجر')}
            </div>
            <p class="err" id="edErr" hidden></p>
          </div>
        </div>
        <div class="row-btns modal-foot">
          ${isNew ? '' : `<button class="btn danger-ghost" type="button" id="edDel">${ic('trash')}حذف</button><button class="btn" type="button" id="edDup">${ic('copy')}نسخة</button>`}
          <span class="grow"></span>
          <button class="btn" type="button" data-act="close-modal">إلغاء</button>
          <button class="btn violet" type="submit">${isNew ? 'إضافة المنتج' : 'حفظ'}</button>
        </div>
      </form>`, 'wide');

    const f = $('#editor');
    const preview = () => {
      $('#prevImg').style.setProperty('--bg', S.hex(p.bg, '#efe8dc'));
      $('#prevImg').innerHTML = art(p);
      $('#prevName').textContent = f.name.value || 'اسم المنتج';
      $('#prevStore').textContent = f.store.value;
      const pr = +f.price.value || 0, cmp = +f.compare.value || 0;
      $('#prevPrice').innerHTML = `${money(pr)}${cmp > pr ? ` <s>${money(cmp)}</s>` : ''}`;
    };
    preview();
    f.addEventListener('input', preview);
    f.addEventListener('click', (e) => {
      const k = e.target.closest('[data-kind]');
      if (k) { p.kind = k.dataset.kind; $$('.kind', f).forEach((b) => b.classList.toggle('on', b === k)); preview(); }
      const sw = e.target.closest('[data-bg]');
      if (sw) { p.bg = sw.dataset.bg; $$('.sw', f).forEach((b) => b.classList.toggle('on', b === sw)); setFg(); preview(); }
    });
    const setFg = () => {
      // pick a drawing color that reads on the chosen background
      const c = parseInt(p.bg.slice(1), 16), lum = (0.299 * (c >> 16) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255;
      p.fg = lum < 0.45 ? '#efe8dc' : '#665a54'; p.ac = lum < 0.45 ? '#b5806a' : '#332f2d';
    };
    $('#bgIn').addEventListener('input', (e) => { p.bg = e.target.value; $$('.sw', f).forEach((b) => b.classList.remove('on')); setFg(); preview(); });
    $('#imgIn').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        p.img = await shrinkImage(file);
        $('#imgRm').hidden = false; $('#artTools').hidden = true;
        preview();
      } catch { toast('ما قدرنا نقرأ الصورة. جرّب صورة JPG أو PNG.'); }
    });
    $('#imgRm').addEventListener('click', () => { delete p.img; $('#imgRm').hidden = true; $('#artTools').hidden = false; preview(); });
    if (!isNew) {
      $('#edDel').addEventListener('click', () => {
        confirmBox(`تحذف «${p0.name}»؟`, 'المنتج رح يختفي من المتجر بعد النشر. الطلبات القديمة ما بتتأثر.', 'حذف', () => {
          state.products = state.products.filter((x) => x.id !== p0.id); save(); closeModal(); toast('انحذف المنتج'); renderProducts();
        });
      });
      $('#edDup').addEventListener('click', () => {
        const copy = { ...p0, id: Math.max(...state.products.map((x) => +x.id || 0)) + 1, name: `${p0.name} (نسخة)`, featured: false, reviews: 0, rating: 0 };
        state.products.push(copy); save(); closeModal(); toast('انعملت نسخة'); renderProducts(); editProduct(copy.id);
      });
    }
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = f.name.value.trim(), price = +f.price.value;
      const err = $('#edErr');
      if (!name) { err.textContent = 'اكتب اسم المنتج.'; err.hidden = false; f.name.focus(); return; }
      if (!(price >= 0) || f.price.value === '') { err.textContent = 'اكتب سعر صحيح.'; err.hidden = false; f.price.focus(); return; }
      Object.assign(p, {
        name, store: f.store.value.trim(), cat: f.cat ? f.cat.value : '', price: Math.round(price * 100) / 100,
        compare: +f.compare.value > price ? Math.round(+f.compare.value * 100) / 100 : 0,
        stock: f.stock.value === '' ? 999 : Math.max(0, Math.floor(+f.stock.value)),
        desc: f.desc.value.trim(), featured: f.featured.checked, hidden: !f.visible.checked,
      });
      if (!p.compare) delete p.compare;
      if (isNew) state.products.unshift(p); else Object.assign(p0, p), (!p.img && delete p0.img), (!p.compare && delete p0.compare);
      save(); closeModal(); toast(isNew ? 'انضاف المنتج' : 'انحفظت التعديلات'); renderProducts();
    });
    setTimeout(() => f.name.focus(), 50);
  }

  function shrinkImage(file) {
    return new Promise((ok, no) => {
      if (!/^image\//.test(file.type)) { no(); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 900, sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); no(); };
      img.src = url;
    });
  }

  /* ---------- Customers ---------- */
  VIEWS.customers = () => {
    setActions(`<button class="btn" type="button" data-act="csv">${ic('download')}<span>تصدير CSV</span></button>`);
    const map = new Map();
    state.orders.forEach((o) => {
      const k = o.customer.phone.replace(/\D/g, '') || o.customer.name;
      const c = map.get(k) || { name: o.customer.name, phone: o.customer.phone, city: o.customer.city, n: 0, spent: 0, last: 0 };
      c.n++; if (live(o)) c.spent += o.total; c.last = Math.max(c.last, o.createdAt);
      map.set(k, c);
    });
    const list = [...map.values()].sort((a, b) => b.spent - a.spent);
    $('#view').innerHTML = list.length ? `
      <div class="kpis three">
        <div class="kpi"><span>العملاء</span><b>${num(list.length)}</b></div>
        <div class="kpi"><span>رجعوا اشتروا</span><b>${num(list.filter((c) => c.n > 1).length)}</b><small>${num(Math.round(list.filter((c) => c.n > 1).length / list.length * 100))}٪ من العملاء</small></div>
        <div class="kpi"><span>متوسط الإنفاق</span><b>${money(list.reduce((s, c) => s + c.spent, 0) / list.length)}</b></div>
      </div>
      <div class="table-card"><table class="table">
        <thead><tr><th>العميل</th><th class="hide-sm">الهاتف</th><th>الطلبات</th><th class="hide-sm">آخر طلب</th><th class="num">الإنفاق</th></tr></thead>
        <tbody>${list.map((c) => `<tr data-customer="${esc(c.phone)}" tabindex="0">
          <td><span class="avatar-sm">${esc((c.name || '?').trim()[0])}</span><b>${esc(c.name)}</b><small>${esc(c.city)}</small></td>
          <td class="hide-sm" dir="ltr" style="text-align:right">${esc(c.phone)}</td>
          <td>${num(c.n)}</td>
          <td class="hide-sm">${ago(c.last)}</td>
          <td class="num"><b>${money(c.spent)}</b></td></tr>`).join('')}</tbody></table></div>`
      : empty('ما في عملاء لسا', 'العملاء بيطلعوا هون تلقائياً من الطلبات.', '');
    VIEWS.customers.list = list;
  };

  /* ---------- Payments ---------- */
  VIEWS.payments = () => {
    const s = state.settings, pay = s.payments;
    $('#view').innerHTML = `
      <form class="settings" id="payForm" novalidate>
        <section class="card set-card">
          <div class="set-head"><span class="set-ic">${ic('whatsapp')}</span><div><h2>استلام الطلبات</h2><p class="muted">لما الزبون يكمّل طلبه، بيبعتلك رسالة واتساب جاهزة فيها كل التفاصيل ورمز بتلصقه باللوحة.</p></div></div>
          ${field('رقم واتساب المتجر', `<input name="whatsapp" type="tel" dir="ltr" placeholder="+961 70 000 000" value="${esc(s.whatsapp)}">`, 'مع رمز البلد. مثال: ‎+962791234567')}
        </section>

        <section class="card set-card">
          <div class="set-head"><span class="set-ic">${ic('payments')}</span><div><h2>طرق الدفع</h2><p class="muted">الموقع ما بيطلب ولا بيخزّن أرقام بطاقات. الدفع الإلكتروني بيصير على صفحة PayPal نفسها.</p></div></div>
          <div class="method">
            ${toggle('cod', pay.cod.on, '<b>الدفع عند الاستلام</b>')}
          </div>
          <div class="method">
            ${toggle('paypal', pay.paypal.on, '<b>PayPal</b> <small class="muted">الزبون بيدفع بحسابه أو ببطاقته كضيف</small>')}
            <div class="method-fields" ${pay.paypal.on ? '' : 'hidden'}>
              <div class="two">
                ${field('اسم PayPal.Me', `<div class="prefix" dir="ltr"><span>paypal.me/</span><input name="paypalUser" value="${esc(pay.paypal.user)}" placeholder="yourname"></div>`, 'بتعمله من paypal.me إذا ما عندك')}
                ${field('عملة الدفع على PayPal', `<select name="currencyCode">${PAYPAL_CODES.map((c) => `<option ${s.currencyCode === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`, 'لازم تكون نفس عملة أسعارك')}
              </div>
              <button class="link" type="button" id="ppTest">${ic('eye')}جرّب الرابط</button>
            </div>
          </div>
          <div class="method">
            ${toggle('bank', pay.bank.on, '<b>تحويل بنكي</b>')}
            <div class="method-fields" ${pay.bank.on ? '' : 'hidden'}>
              <div class="two">
                ${field('اسم البنك', `<input name="bankName" value="${esc(pay.bank.bank)}">`)}
                ${field('اسم صاحب الحساب', `<input name="bankHolder" value="${esc(pay.bank.holder)}">`)}
              </div>
              ${field('IBAN / رقم الحساب', `<input name="bankIban" dir="ltr" value="${esc(pay.bank.iban)}">`)}
            </div>
          </div>
        </section>

        <section class="card set-card">
          <div class="set-head"><span class="set-ic">${ic('orders')}</span><div><h2>الشحن والعملة</h2></div></div>
          <div class="three">
            ${field(`رسوم التوصيل (${esc(cur())})`, `<input name="fee" type="number" min="0" step="0.01" dir="ltr" value="${s.shipping.fee}">`)}
            ${field('مجاني فوق', `<input name="freeOver" type="number" min="0" step="0.01" dir="ltr" value="${s.shipping.freeOver || ''}" placeholder="بلا">`, 'اتركه فاضي إذا ما في توصيل مجاني')}
            ${field('رمز العملة', `<input name="currency" maxlength="5" value="${esc(s.currency)}">`, 'بيبيّن جنب الأسعار: $ أو د.أ أو ر.س')}
          </div>
        </section>
        <div class="save-bar"><span class="muted" id="paySaved"></span><button class="btn violet" type="submit">حفظ</button></div>
      </form>`;
    const f = $('#payForm');
    ['paypal', 'bank'].forEach((k) => f[k].addEventListener('change', (e) => { e.target.closest('.method').querySelector('.method-fields').hidden = !e.target.checked; }));
    $('#ppTest').addEventListener('click', () => {
      const u = f.paypalUser.value.trim().replace(/^@/, '');
      if (!u) { toast('اكتب اسم PayPal.Me أولاً'); return; }
      window.open(`https://www.paypal.com/paypalme/${encodeURIComponent(u)}/1${f.currencyCode.value}`, '_blank', 'noopener');
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const wa = S.toLatinDigits(f.whatsapp.value).replace(/[^\d+]/g, '');
      if (f.paypal.checked && !f.paypalUser.value.trim()) { toast('اكتب اسم PayPal.Me أو طفّي PayPal'); f.paypalUser.focus(); return; }
      if (f.bank.checked && !f.bankIban.value.trim()) { toast('اكتب رقم الحساب أو طفّي التحويل البنكي'); f.bankIban.focus(); return; }
      if (!f.cod.checked && !f.paypal.checked && !f.bank.checked) { toast('لازم تشغّل طريقة دفع وحدة على الأقل'); return; }
      Object.assign(s, {
        whatsapp: wa, currency: f.currency.value.trim() || '$', currencyCode: f.currencyCode.value,
        shipping: { fee: Math.max(0, +f.fee.value || 0), freeOver: Math.max(0, +f.freeOver.value || 0) },
        payments: {
          cod: { on: f.cod.checked },
          paypal: { on: f.paypal.checked, user: f.paypalUser.value.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?paypal\.me\//i, '') },
          bank: { on: f.bank.checked, bank: f.bankName.value.trim(), holder: f.bankHolder.value.trim(), iban: f.bankIban.value.trim() },
        },
      });
      save(); toast('انحفظ. لا تنسى تنشر ليوصل للمتجر.'); $('#paySaved').textContent = 'محفوظ ✓';
    });
  };

  /* ---------- Settings ---------- */
  VIEWS.settings = () => {
    const s = state.settings;
    const demoN = state.orders.filter((o) => o.demo).length;
    $('#view').innerHTML = `
      <form class="settings" id="setForm" novalidate>
        <section class="card set-card">
          <div class="set-head"><span class="set-ic">${ic('settings')}</span><div><h2>معلومات المتجر</h2></div></div>
          <div class="two">
            ${field('اسم المتجر', `<input name="name" maxlength="40" value="${esc(s.name)}" required>`)}
            ${field('الشعار القصير', `<input name="tagline" maxlength="80" value="${esc(s.tagline)}">`)}
          </div>
          <div class="two">
            ${field('شريط الإعلان', `<input name="banner" maxlength="60" value="${esc(s.banner)}" placeholder="مثلاً: توصيل مجاني فوق ٥٠$">`, 'اتركه فاضي لتخفي الشريط')}
            ${field('سطر تحت الإعلان', `<input name="bannerSub" maxlength="60" value="${esc(s.bannerSub)}">`)}
          </div>
        </section>
        <section class="card set-card">
          <div class="set-head"><span class="set-ic">${ic('products')}</span><div><h2>التصنيفات</h2><p class="muted">بالترتيب يلي بتطلع فيه بالمتجر.</p></div></div>
          <ul class="cats" id="cats">${state.categories.map((c, i) => catRow(c, i)).join('')}</ul>
          <button class="btn" type="button" id="catAdd">${ic('plus')}تصنيف جديد</button>
        </section>
        <div class="save-bar"><span class="muted" id="setSaved"></span><button class="btn violet" type="submit">حفظ</button></div>
      </form>

      <section class="card set-card">
        <div class="set-head"><span class="set-ic">${ic('import')}</span><div><h2>نسخة احتياطية</h2><p class="muted">بيانات اللوحة محفوظة على هالجهاز بس. خود نسخة كل فترة، وفيك ترجعها على أي جهاز.</p></div></div>
        <div class="row-btns">
          <button class="btn" type="button" data-act="backup">${ic('download')}تنزيل نسخة احتياطية</button>
          <label class="btn">${ic('upload')}استرجاع نسخة<input type="file" accept="application/json,.json" id="restoreIn" hidden></label>
        </div>
      </section>

      <section class="card set-card">
        <div class="set-head"><span class="set-ic">${ic('eyeoff')}</span><div><h2>الأمان</h2><p class="muted">اللوحة بتقفل لحالها بعد ١٥ دقيقة بلا حركة.</p></div></div>
        <form class="pin-form" id="pinForm" novalidate>
          <div class="three">
            ${field('الرمز الحالي', '<input name="old" type="password" inputmode="numeric" autocomplete="current-password">')}
            ${field('رمز جديد', '<input name="n1" type="password" inputmode="numeric" autocomplete="new-password">')}
            ${field('أعد الرمز الجديد', '<input name="n2" type="password" inputmode="numeric" autocomplete="new-password">')}
          </div>
          <button class="btn" type="submit">تغيير الرمز</button>
        </form>
      </section>

      <section class="card set-card danger-zone">
        <div class="set-head"><span class="set-ic">${ic('alert')}</span><div><h2>منطقة الخطر</h2></div></div>
        <div class="row-btns">
          <button class="btn" type="button" data-act="demo">${ic('plus')}أضف طلبات تجريبية</button>
          ${demoN ? `<button class="btn" type="button" data-act="clear-demo">${ic('trash')}امسح الطلبات التجريبية (${num(demoN)})</button>` : ''}
          <button class="btn danger-ghost" type="button" data-act="wipe">${ic('trash')}امسح كل بيانات اللوحة من هالجهاز</button>
        </div>
      </section>`;

    const f = $('#setForm');
    $('#catAdd').addEventListener('click', () => {
      const c = { id: `c${Date.now().toString(36)}`, name: '', c: SWATCHES[state.categories.length % SWATCHES.length] };
      state.categories.push(c);
      $('#cats').insertAdjacentHTML('beforeend', catRow(c, state.categories.length - 1));
      $('#cats li:last-child input[type=text]').focus();
    });
    $('#cats').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat-act]'); if (!b) return;
      const li = b.closest('li'), i = +li.dataset.i, c = state.categories[i];
      if (b.dataset.catAct === 'del') {
        const used = state.products.filter((p) => p.cat === c.id).length;
        if (used) { toast(`فيه ${num(used)} منتج بهالتصنيف. انقلهم لتصنيف تاني أولاً.`); return; }
        state.categories.splice(i, 1); VIEWS.settings();
      } else {
        const j = b.dataset.catAct === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= state.categories.length) return;
        collectCats();
        [state.categories[i], state.categories[j]] = [state.categories[j], state.categories[i]];
        $('#cats').innerHTML = state.categories.map(catRow).join('');
      }
    });
    function collectCats() {
      $$('#cats li').forEach((li) => {
        const c = state.categories[+li.dataset.i];
        c.name = $('input[type=text]', li).value.trim(); c.c = $('input[type=color]', li).value;
      });
    }
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      collectCats();
      if (state.categories.some((c) => !c.name)) { toast('في تصنيف بلا اسم'); return; }
      if (!f.name.value.trim()) { toast('اكتب اسم المتجر'); f.name.focus(); return; }
      Object.assign(s, { name: f.name.value.trim(), tagline: f.tagline.value.trim(), banner: f.banner.value.trim(), bannerSub: f.bannerSub.value.trim() });
      save(); toast('انحفظ. لا تنسى تنشر ليوصل للمتجر.'); $('#setSaved').textContent = 'محفوظ ✓';
    });
    $('#restoreIn').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const d = JSON.parse(await file.text());
        if (!d || d.kind !== 'raff-backup' || !Array.isArray(d.state.products)) throw new Error();
        confirmBox('تسترجع النسخة؟', `رح تستبدل كل بيانات اللوحة الحالية بنسخة ${fmtDate(d.at, true)}.`, 'استرجاع', () => {
          state = d.state; migrate(); save(); toast('رجعت النسخة'); route();
        });
      } catch { toast('الملف مش نسخة احتياطية صحيحة'); }
    });
    $('#pinForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pf = e.target, oldPin = S.toLatinDigits(pf.old.value), n1 = S.toLatinDigits(pf.n1.value);
      if (n1.length < 6) { toast('الرمز الجديد لازم يكون ٦ أرقام أو أكثر'); return; }
      if (n1 !== S.toLatinDigits(pf.n2.value)) { toast('الرمزين الجداد مش متطابقين'); return; }
      const st = readStored();
      try { const k = await deriveKey(oldPin, unb64(st.salt)); await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(st.iv) }, k, unb64(st.ct)); }
      catch { toast('الرمز الحالي غلط'); return; }
      salt = crypto.getRandomValues(new Uint8Array(16)); key = await deriveKey(n1, salt); await save();
      pf.reset(); toast('تغيّر الرمز');
    });
  };
  const catRow = (c, i) => `<li data-i="${i}"><input type="color" value="${S.hex(c.c, '#cccccc')}" aria-label="لون التصنيف"><input type="text" value="${esc(c.name)}" placeholder="اسم التصنيف" maxlength="30"><span class="muted">${num(state.products.filter((p) => p.cat === c.id).length)} منتج</span>
    <button type="button" class="icon-btn sm" data-cat-act="up" aria-label="لفوق"><svg class="ic" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button>
    <button type="button" class="icon-btn sm" data-cat-act="down" aria-label="لتحت"><svg class="ic" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
    <button type="button" class="icon-btn sm" data-cat-act="del" aria-label="حذف">${ic('trash')}</button></li>`;

  /* ---------- Publish ---------- */
  VIEWS.publish = () => {
    const json = JSON.stringify(publicCatalog());
    const kb = Math.round(new Blob([json]).size / 1024);
    const changed = dirty();
    $('#view').innerHTML = `
      <div class="publish">
        <section class="card pub-status ${changed ? 'pending' : 'clean'}">
          <span class="pub-ic">${changed ? ic('publish') : ic('check')}</span>
          <div><h2>${changed ? 'عندك تعديلات جاهزة للنشر' : 'المتجر محدّث'}</h2>
          <p class="muted">${changed ? 'الزبائن لسا بيشوفوا النسخة القديمة. اتبع الخطوات تحت ليوصلهم التحديث.' : state.publishedAt ? `آخر نشر ${ago(state.publishedAt)}.` : 'ما في تعديلات جديدة.'}</p></div>
        </section>
        <ol class="steps">
          <li class="card"><span class="step-n">١</span><div><h3>شوف المعاينة</h3><p class="muted">بتفتح المتجر بتعديلاتك على هالجهاز بس، قبل ما حدا تاني يشوفها.</p></div><button class="btn" type="button" data-act="preview">${ic('eye')}معاينة</button></li>
          <li class="card"><span class="step-n">٢</span><div><h3>نزّل ملف المتجر</h3><p class="muted">ملف <b dir="ltr">store.json</b> فيه كل المنتجات والإعدادات (${num(kb)} كيلوبايت). ما فيه أي طلبات أو بيانات عملاء.</p>${kb > 4000 ? '<p class="err">الملف كبير بسبب الصور. صغّر عدد الصور ليفتح المتجر أسرع.</p>' : ''}</div><button class="btn violet" type="button" data-act="download">${ic('download')}تنزيل store.json</button></li>
          <li class="card"><span class="step-n">٣</span><div><h3>ارفعه على GitHub</h3><p class="muted">بتنفتح صفحة الرفع بمجلد <b dir="ltr">store/data</b>. اسحب الملف لجوّا، وبعدين اكبس <b>Commit changes</b>. بعد دقيقة أو دقيقتين بيتحدّث المتجر للكل.</p></div><a class="btn" href="${REPO_UPLOAD}" target="_blank" rel="noopener noreferrer">${ic('upload')}فتح GitHub</a></li>
        </ol>
        <details class="card faq"><summary>ليش النشر بخطوات؟</summary><p class="muted">المتجر موقع ثابت على GitHub Pages، يعني مجاني وسريع وما في سيرفر ممكن ينخرق. التعديلات بتنحفظ عندك، ولما تنشر بتحطها بملف واحد على GitHub.</p></details>
      </div>`;
  };

  /* ---------- Modal / sheet / confirm ---------- */
  const modal = $('#modal');
  function openModal(html, size = '') {
    $('#modalInner').innerHTML = html;
    modal.className = `modal ${size}`;
    if (!modal.open) modal.showModal();
  }
  function closeModal() { if (modal.open) modal.close(); }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  function confirmBox(title, text, okText, onOk) {
    openModal(`<div class="confirm"><span class="confirm-ic">${ic('alert')}</span><h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>
      <div class="row-btns center"><button class="btn" type="button" data-act="close-modal">إلغاء</button><button class="btn danger" type="button" id="confirmOk">${esc(okText)}</button></div></div>`, 'narrow');
    $('#confirmOk').addEventListener('click', () => { closeModal(); onOk(); });
  }
  const sheet = $('#sheet'), scrim = $('#scrim');
  function openSheet(html) {
    $('#sheetInner').innerHTML = html;
    scrim.hidden = false; sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false');
  }
  function closeSheet() {
    scrim.hidden = true; sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true');
    $('#sheetInner').dataset.order = '';
  }
  scrim.addEventListener('click', closeSheet);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('open') && !modal.open) closeSheet(); });

  const download = (name, text, type = 'application/json') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- Global clicks ---------- */
  document.addEventListener('click', (e) => {
    if (!state) return;
    const t = e.target.closest('[data-act],[data-order],[data-product],[data-period],[data-ofilter],[data-status],[data-customer]');
    if (!t) return;
    const d = t.dataset;
    if (d.period !== undefined) { period = +d.period; VIEWS.dashboard(); return; }
    if (d.ofilter) { oFilter = d.ofilter; $$('[data-ofilter]').forEach((b) => b.setAttribute('aria-pressed', b === t)); renderOrderList(); return; }
    if (d.status) { setStatus($('#sheetInner').dataset.order, d.status); return; }
    if (d.order) { openOrder(d.order); return; }
    if (d.product) { if (current !== 'products') location.hash = `#products/${d.product}`; else editProduct(+d.product); return; }
    if (d.customer) { location.hash = `#orders/phone:${encodeURIComponent(d.customer)}`; return; }
    switch (d.act) {
      case 'lock': lock(); break;
      case 'import': importDialog(); break;
      case 'sync': if (syncLocalOrders(false)) route(); break;
      case 'demo': seedDemo(); break;
      case 'close-modal': closeModal(); break;
      case 'close-sheet': closeSheet(); break;
      case 'new-product': editProduct(0); break;
      case 'print': printInvoice(d.id); break;
      case 'delete-order':
        confirmBox(`تحذف الطلب ${d.id}؟`, 'ما في تراجع. إذا بدك تخبّيه بس، غيّر حالته لـ«ملغى».', 'حذف', () => {
          const o = state.orders.find((x) => x.id === d.id);
          if (o && o.stockApplied) applyStock(o, -1);
          state.orders = state.orders.filter((x) => x.id !== d.id); save(); closeSheet(); toast('انحذف الطلب'); route();
        });
        break;
      case 'csv': {
        const rows = [['name', 'phone', 'city', 'orders', 'spent', 'last_order']].concat((VIEWS.customers.list || []).map((c) => [c.name, c.phone, c.city, c.n, c.spent.toFixed(2), new Date(c.last).toISOString().slice(0, 10)]));
        const cell = (v) => { const s = String(v); return /^[=+\-@]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };
        download('customers.csv', '﻿' + rows.map((r) => r.map(cell).join(',')).join('\n'), 'text/csv');
        break;
      }
      case 'backup': download(`raff-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ kind: 'raff-backup', at: Date.now(), state })); toast('انتبه: النسخة الاحتياطية مش مشفّرة، خبّيها بمكان آمن.'); break;
      case 'clear-demo': state.orders = state.orders.filter((o) => !o.demo); save(); toast('انمسحت الطلبات التجريبية'); route(); break;
      case 'wipe': confirmBox('تمسح كل شي؟', 'رح تنمسح الطلبات والتعديلات غير المنشورة من هالجهاز. المتجر المنشور ما بيتأثر. خود نسخة احتياطية قبل.', 'امسح كل شي', () => { ls.del(KEY); location.reload(); }); break;
      case 'preview': ls.set('raff.preview', publicCatalog()) ? window.open('../?preview=1', '_blank', 'noopener') : toast('ما في مساحة كافية للمعاينة'); break;
      case 'download':
        download('store.json', JSON.stringify(publicCatalog(), null, 1));
        state.publishedHash = catalogHash(); state.publishedAt = Date.now(); save();
        toast('نزل الملف. هلّق ارفعه على GitHub.');
        VIEWS.publish();
        break;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const row = e.target.closest('tr[data-order], tr[data-customer]');
    if (row) row.click();
  });
})();
