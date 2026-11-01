(() => {
  'use strict';

  /* ---------- Product art: flat shapes on warm earth tones ---------- */
  const ART = {
    mug: (f, a) => `<rect x="30" y="36" width="34" height="38" rx="7" fill="${f}"/><path d="M64 46h5a8 8 0 0 1 0 16h-5" fill="none" stroke="${f}" stroke-width="5"/><rect x="30" y="36" width="34" height="7" rx="3.5" fill="${a}"/>`,
    sneaker: (f, a) => `<path d="M16 64c0-9 6-16 14-16 4 0 7-3 10-6 3-3 8-3 11 1l7 9c9 2 20 4 25 9 2 2 2 5 1 7H16z" fill="${f}"/><rect x="15" y="66" width="70" height="7" rx="3.5" fill="${a}"/><path d="M42 50l5 5M47 46l5 5M52 43l4 5" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`,
    tote: (f, a) => `<path d="M38 42v-6a12 12 0 0 1 24 0v6" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round"/><path d="M27 42h46l-3 38H30z" fill="${f}"/><rect x="40" y="56" width="20" height="12" rx="2" fill="${a}" opacity=".35"/>`,
    lamp: (f, a) => `<path d="M36 26h28l9 24H27z" fill="${f}"/><rect x="48" y="50" width="4" height="24" fill="${a}"/><ellipse cx="50" cy="76" rx="15" ry="4" fill="${a}"/>`,
    plant: (f, a) => `<ellipse cx="42" cy="40" rx="7" ry="16" transform="rotate(-28 42 40)" fill="${f}"/><ellipse cx="58" cy="38" rx="7" ry="17" transform="rotate(26 58 38)" fill="${f}"/><ellipse cx="50" cy="34" rx="6" ry="18" fill="${f}" opacity=".85"/><path d="M36 56h28l-4 24H40z" fill="${a}"/>`,
    headphones: (f, a) => `<path d="M29 60V50a21 21 0 0 1 42 0v10" fill="none" stroke="${f}" stroke-width="6" stroke-linecap="round"/><rect x="22" y="54" width="15" height="24" rx="7" fill="${f}"/><rect x="63" y="54" width="15" height="24" rx="7" fill="${f}"/><rect x="26" y="58" width="7" height="16" rx="3.5" fill="${a}"/><rect x="67" y="58" width="7" height="16" rx="3.5" fill="${a}"/>`,
    serum: (f, a) => `<rect x="46" y="16" width="8" height="16" rx="4" fill="${a}"/><rect x="43" y="30" width="14" height="9" rx="2" fill="${a}"/><rect x="37" y="38" width="26" height="42" rx="6" fill="${f}"/><rect x="42" y="52" width="16" height="14" rx="2" fill="${a}" opacity=".4"/>`,
    chair: (f, a) => `<rect x="34" y="20" width="32" height="30" rx="6" fill="${f}"/><rect x="30" y="50" width="40" height="8" rx="3" fill="${f}"/><path d="M34 58l-3 22M66 58l3 22" stroke="${a}" stroke-width="4" stroke-linecap="round"/>`,
    watch: (f, a) => `<rect x="42" y="14" width="16" height="72" rx="6" fill="${a}"/><circle cx="50" cy="50" r="17" fill="${a}"/><circle cx="50" cy="50" r="13" fill="${f}"/><path d="M50 50V41M50 50l6 4" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`,
    candle: (f, a) => `<path d="M50 24c4 5 5 9 0 13-5-4-4-8 0-13z" fill="#e2a85a"/><rect x="48.8" y="36" width="2.4" height="6" fill="${a}"/><rect x="33" y="42" width="34" height="38" rx="7" fill="${f}"/><rect x="33" y="56" width="34" height="12" fill="${a}" opacity=".35"/>`,
    vase: (f, a) => `<path d="M44 20h12v8c0 4 12 10 12 26 0 14-8 26-18 26S32 68 32 54c0-16 12-22 12-26z" fill="${f}"/><path d="M34 50h32" stroke="${a}" stroke-width="3"/>`,
    glasses: (f, a) => `<circle cx="35" cy="52" r="13" fill="${f}"/><circle cx="65" cy="52" r="13" fill="${f}"/><path d="M47 50q3-4 6 0" fill="none" stroke="${f}" stroke-width="3"/><path d="M22 48l-6-6M78 48l6-6" stroke="${f}" stroke-width="3" stroke-linecap="round"/><circle cx="31" cy="48" r="3" fill="${a}" opacity=".6"/><circle cx="61" cy="48" r="3" fill="${a}" opacity=".6"/>`,
    cap: (f, a) => `<path d="M24 62a26 26 0 0 1 52 0z" fill="${f}"/><path d="M58 62h24a4 4 0 0 1 0 7H50z" fill="${a}"/><circle cx="50" cy="36" r="3" fill="${a}"/><path d="M50 36v26" stroke="${a}" stroke-width="1.5" opacity=".5"/>`,
    tee: (f, a) => `<path d="M38 22l-18 10 6 14 8-4v38h32V42l8 4 6-14-18-10c-2 5-6 8-12 8s-10-3-12-8z" fill="${f}"/><path d="M38 22c2 5 6 8 12 8s10-3 12-8" fill="none" stroke="${a}" stroke-width="2"/>`,
    tube: (f, a) => `<path d="M36 20h28l-4 52H40z" fill="${f}"/><rect x="42" y="72" width="16" height="9" rx="2" fill="${a}"/><rect x="41" y="38" width="18" height="12" rx="2" fill="${a}" opacity=".35"/>`,
    cactus: (f, a) => `<rect x="43" y="22" width="14" height="40" rx="7" fill="${f}"/><path d="M43 46h-6a5 5 0 0 1-5-5v-8" fill="none" stroke="${f}" stroke-width="7" stroke-linecap="round"/><path d="M57 40h6a5 5 0 0 0 5-5v-6" fill="none" stroke="${f}" stroke-width="7" stroke-linecap="round"/><path d="M36 58h28l-4 22H40z" fill="${a}"/>`,
    speaker: (f, a) => `<rect x="32" y="22" width="36" height="58" rx="10" fill="${f}"/><circle cx="50" cy="60" r="11" fill="${a}"/><circle cx="50" cy="60" r="4" fill="${f}"/><circle cx="50" cy="36" r="5" fill="${a}"/>`,
  };
  const art = (p) =>
    `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><ellipse cx="50" cy="83" rx="28" ry="3" fill="#000" opacity=".08"/>${ART[p.kind](p.fg, p.ac)}</svg>`;

  /* ---------- Data ---------- */
  const CATS = [
    { id: 'fashion', name: 'الأزياء', c: '#c96f4a' },
    { id: 'home', name: 'البيت', c: '#d9c3a5' },
    { id: 'beauty', name: 'الجمال', c: '#e8c9bb' },
    { id: 'tech', name: 'الإلكترونيات', c: '#332f2d' },
    { id: 'plants', name: 'النباتات', c: '#a9b59a' },
    { id: 'accessories', name: 'الإكسسوارات', c: '#b5806a' },
  ];

  const P = [
    { id: 1, name: 'كوب فخار مزجّج', store: 'فخّار الواحة', price: 18, rating: 4.9, reviews: 1240, cat: 'home', kind: 'mug', bg: '#e6d5bd', fg: '#c96f4a', ac: '#a65638', desc: 'مشغول باليد على الدولاب، بطبقة زجاج تحفظ حرارة قهوتك الصباحية. كل قطعة تختلف قليلاً عن أختها.' },
    { id: 2, name: 'حذاء جري خفيف', store: 'خطوة', price: 89, rating: 4.8, reviews: 3120, cat: 'fashion', kind: 'sneaker', bg: '#dfe3dc', fg: '#efe8dc', ac: '#332f2d', desc: 'نعل مرن وقماش يتنفّس، للمشي الطويل والجري الخفيف. وزن أقل من ٢٥٠ غراماً.' },
    { id: 3, name: 'حقيبة قماش يومية', store: 'نول', price: 34, rating: 4.7, reviews: 860, cat: 'fashion', kind: 'tote', bg: '#d9c3a5', fg: '#f4efe6', ac: '#8a6a4a', desc: 'قطن سميك منسوج على النول، بجيب داخلي وحزام يتحمّل مشتريات الأسبوع.' },
    { id: 4, name: 'مصباح طاولة كتّاني', store: 'ضوء خافت', price: 72, rating: 4.9, reviews: 540, cat: 'home', kind: 'lamp', bg: '#332f2d', fg: '#efe8dc', ac: '#b5806a', desc: 'غطاء من الكتّان الطبيعي وقاعدة نحاسية، يعطي ضوءاً دافئاً للقراءة قبل النوم.' },
    { id: 5, name: 'نبتة زيتون صغيرة', store: 'أخضر', price: 26, rating: 4.6, reviews: 410, cat: 'plants', kind: 'plant', bg: '#efe8dc', fg: '#7d8466', ac: '#c96f4a', desc: 'شجرة زيتون قزمة في أصيص طين، تحب الشمس وتحتمل نسيان الري أحياناً.' },
    { id: 6, name: 'سماعات لاسلكية', store: 'صدى', price: 129, rating: 4.8, reviews: 2210, cat: 'tech', kind: 'headphones', bg: '#cfcac2', fg: '#1d1b1a', ac: '#665a54', desc: 'عزل للضوضاء وبطارية تدوم ٣٠ ساعة، بوسائد ناعمة تريح الأذن في الرحلات الطويلة.' },
    { id: 7, name: 'سيروم فيتامين ج', store: 'بشرة', price: 32, rating: 4.7, reviews: 1980, cat: 'beauty', kind: 'serum', bg: '#e8c9bb', fg: '#f4efe6', ac: '#b5806a', desc: 'تركيبة خفيفة تمنح البشرة إشراقة، بدون عطور ومناسبة للبشرة الحساسة.' },
    { id: 8, name: 'كرسي خشب جوز', store: 'ورشة النجّار', price: 240, rating: 4.9, reviews: 190, cat: 'home', kind: 'chair', bg: '#e6d5bd', fg: '#8a5a3c', ac: '#5e3d28', desc: 'خشب جوز صلب بتشطيب زيتي، مصنوع ليعيش معك عشرين سنة على الأقل.' },
    { id: 9, name: 'ساعة جلد بني', store: 'توقيت', price: 145, rating: 4.8, reviews: 720, cat: 'accessories', kind: 'watch', bg: '#a9b59a', fg: '#f4efe6', ac: '#6b4a33', desc: 'ميناء بسيط بلا أرقام وحزام جلد طبيعي يكتسب لوناً أجمل مع الأيام.' },
    { id: 10, name: 'شمعة عود وعنبر', store: 'دخون', price: 22, rating: 4.9, reviews: 3300, cat: 'home', kind: 'candle', bg: '#332f2d', fg: '#d9c3a5', ac: '#efe8dc', desc: 'شمع صويا وعطر عود دافئ، تحترق نحو ٤٠ ساعة في جرّة زجاجية تعيد استخدامها.' },
    { id: 11, name: 'مزهرية طين', store: 'فخّار الواحة', price: 48, rating: 4.7, reviews: 300, cat: 'home', kind: 'vase', bg: '#efe8dc', fg: '#b5806a', ac: '#8f5f4c', desc: 'طين محلي غير مزجّج بملمس خشن، جميلة فارغة وأجمل مع غصن زيتون.' },
    { id: 12, name: 'نظارة شمسية', store: 'ظلّ', price: 65, rating: 4.6, reviews: 940, cat: 'accessories', kind: 'glasses', bg: '#e6d5bd', fg: '#1d1b1a', ac: '#665a54', desc: 'إطار دائري خفيف وعدسات تحمي من الأشعة فوق البنفسجية بالكامل.' },
    { id: 13, name: 'قبعة قطن', store: 'نول', price: 24, rating: 4.5, reviews: 610, cat: 'fashion', kind: 'cap', bg: '#cfd6c8', fg: '#7d8466', ac: '#5c6249', desc: 'قطن مغسول بلون زيتي هادئ، بحزام خلفي قابل للتعديل.' },
    { id: 14, name: 'قميص كتّان', store: 'نول', price: 42, rating: 4.8, reviews: 1500, cat: 'fashion', kind: 'tee', bg: '#efe8dc', fg: '#c9b79c', ac: '#a6937a', desc: 'كتّان خفيف للصيف، قصّة واسعة مريحة تزداد نعومة مع كل غسلة.' },
    { id: 15, name: 'مرطّب يدين', store: 'بشرة', price: 16, rating: 4.8, reviews: 2600, cat: 'beauty', kind: 'tube', bg: '#dfe3dc', fg: '#f4efe6', ac: '#7d8466', desc: 'زبدة الشيا وزيت الزيتون، يمتصّ بسرعة ولا يترك أثراً دهنياً.' },
    { id: 16, name: 'صبّار مكتبي', store: 'أخضر', price: 14, rating: 4.7, reviews: 880, cat: 'plants', kind: 'cactus', bg: '#e8c9bb', fg: '#7d8466', ac: '#c96f4a', desc: 'رفيق المكتب الذي لا يشتكي. ريّة واحدة كل أسبوعين تكفيه.' },
    { id: 17, name: 'مكبّر صوت صغير', store: 'صدى', price: 79, rating: 4.7, reviews: 1100, cat: 'tech', kind: 'speaker', bg: '#d9c3a5', fg: '#332f2d', ac: '#665a54', desc: 'صوت دافئ بحجم الكف، مقاوم للماء ويعمل ١٢ ساعة بشحنة واحدة.' },
    { id: 18, name: 'زيت شعر بالأرغان', store: 'بشرة', price: 28, rating: 4.8, reviews: 1430, cat: 'beauty', kind: 'serum', bg: '#d9c3a5', fg: '#c96f4a', ac: '#8f5f4c', desc: 'أرغان مغربي معصور على البارد، بضع قطرات تكفي لشعر لامع وناعم.' },
    { id: 19, name: 'حذاء جلد كلاسيكي', store: 'خطوة', price: 120, rating: 4.7, reviews: 640, cat: 'fashion', kind: 'sneaker', bg: '#332f2d', fg: '#8a5a3c', ac: '#efe8dc', desc: 'جلد طبيعي مدبوغ نباتياً ونعل مخيط باليد، أنيق في العمل ومريح في المساء.' },
    { id: 20, name: 'مسكة شفاه بالعسل', store: 'بشرة', price: 9, rating: 4.9, reviews: 4100, cat: 'beauty', kind: 'tube', bg: '#efe8dc', fg: '#e8c9bb', ac: '#b5806a', desc: 'شمع العسل وزيت اللوز، ترطيب يدوم طوال اليوم بلمسة لون خفيفة.' },
  ];
  const byId = new Map(P.map((p) => [p.id, p]));

  const STORES = [
    { name: 'فخّار الواحة', about: 'فخار يدوي من الطين المحلي', hero: 11, items: [1, 11, 10] },
    { name: 'نول', about: 'قطن وكتّان منسوج بهدوء', hero: 14, items: [3, 13, 14] },
    { name: 'بشرة', about: 'عناية نظيفة بمكونات بسيطة', hero: 7, items: [15, 18, 20] },
    { name: 'صدى', about: 'صوت جميل بتصميم هادئ', hero: 6, items: [17, 6] },
  ];

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const ar = new Intl.NumberFormat('ar-EG');
  const money = (n) => `${ar.format(n)}$`;
  const compact = (n) => (n >= 1000 ? `${ar.format(Math.round(n / 100) / 10)} ألف` : ar.format(n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const saved = new Set(store.get('raff.saved', []));
  let cart = store.get('raff.cart', {}); // { id: qty }
  Object.keys(cart).forEach((k) => { if (!byId.has(+k) || !(cart[k] > 0)) delete cart[k]; });

  const heartSVG = '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.3 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>';
  const plusSVG = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';

  const card = (p, mini = false) => `
    <article class="pcard${mini ? ' mini' : ''}">
      <button class="pcard-img" type="button" data-open="${p.id}" style="--bg:${p.bg}" aria-label="عرض ${esc(p.name)}">${art(p)}</button>
      ${mini ? '' : `<button class="heart" type="button" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="احفظ ${esc(p.name)}">${heartSVG}</button>
      <button class="add" type="button" data-add="${p.id}" aria-label="أضف ${esc(p.name)} إلى السلة">${plusSVG}</button>`}
      <div class="pcard-meta">
        <h3>${esc(p.name)}</h3>
        <p class="store">${esc(p.store)}</p>
        <div class="row">
          <span class="price">${money(p.price)}</span>
          <span class="rate"><span class="stars">★</span> ${ar.format(p.rating)} (${compact(p.reviews)})</span>
        </div>
      </div>
    </article>`;

  const tile = (p) => `
    <button class="tile" type="button" data-open="${p.id}" style="--bg:${p.bg}" aria-label="عرض ${esc(p.name)}">
      ${art(p)}
      <span class="tile-label"><b>${esc(p.name)}</b><small>${esc(p.store)} · ${money(p.price)}</small></span>
    </button>`;

  /* ---------- Render ---------- */
  // Hero constellation
  const SLOTS = [
    { id: 2, x: '2%', y: '78px', w: '150px', d: '0s' },
    { id: 7, x: '19%', y: '8px', w: '168px', d: '-2s' },
    { id: 1, x: '40.5%', y: '36px', w: '190px', d: '-4s' },
    { id: 9, x: '63%', y: '0px', w: '164px', d: '-1s' },
    { id: 5, x: '82%', y: '70px', w: '148px', d: '-3s' },
  ];
  const narrow = matchMedia('(max-width: 720px)');
  const placeHero = () => {
    const m = narrow.matches;
    $('#constellation').innerHTML = SLOTS.map((s, i) => {
      // On phones show the middle three, spread across the width.
      const mx = ['0', '4%', '33%', '62%', '0'][i];
      const my = ['0', '28px', '0px', '34px', '0'][i];
      const mw = ['0', '34%', '36%', '34%', '0'][i];
      return `<div class="float" data-slot="${i + 1}" style="--x:${m ? mx : s.x};--y:${m ? my : s.y};--w:${m ? mw : s.w};--d:${s.d}">${card(byId.get(s.id), true)}</div>`;
    }).join('');
  };
  placeHero();
  narrow.addEventListener?.('change', placeHero);

  // Pills
  $('#pills').innerHTML = CATS.map((c) =>
    `<button class="pill" type="button" data-cat="${c.id}" aria-pressed="false"><i style="--c:${c.c}"></i>${c.name}</button>`).join('');

  // Picks rail
  $('#picksRow').innerHTML = [1, 6, 3, 10, 12, 7, 17, 5, 14, 9].map((id) => card(byId.get(id))).join('');

  // Home mosaic
  const lamp = byId.get(4);
  $('#homeMosaic').innerHTML = `
    <button class="feature" type="button" data-open="${lamp.id}" style="--bg:${lamp.bg}" aria-label="عرض ${esc(lamp.name)}">
      <span class="feature-copy"><strong>ضوء خافت</strong><span>★ ${ar.format(lamp.rating)} · ${compact(lamp.reviews)} تقييم</span><em>تسوّق الإضاءة</em></span>
      ${art(lamp)}
    </button>` + [1, 8, 11, 10].map((id) => tile(byId.get(id))).join('');

  // Stores
  const renderStores = () => {
    const followed = new Set(store.get('raff.follow', []));
    $('#storesGrid').innerHTML = STORES.map((s) => {
      const h = byId.get(s.hero);
      const count = P.filter((p) => p.store === s.name).length;
      return `
      <article class="spot">
        <button class="spot-hero" type="button" data-open="${h.id}" style="--bg:${h.bg}" aria-label="عرض ${esc(h.name)}">${art(h)}</button>
        <div class="spot-info">
          <span class="spot-logo" aria-hidden="true">${esc(s.name.replace('ال', '').trim()[0])}</span>
          <div><h3>${esc(s.name)}</h3><p>★ ${ar.format(4.8)} · ${ar.format(count)} منتجات</p></div>
          <button class="follow" type="button" data-follow="${esc(s.name)}" aria-pressed="${followed.has(s.name)}">${followed.has(s.name) ? 'متابَع' : 'تابِع'}</button>
        </div>
        <div class="thumbs">${s.items.map((id) => { const p = byId.get(id); return `<button type="button" data-open="${id}" style="--bg:${p.bg}" aria-label="عرض ${esc(p.name)}">${art(p)}</button>`; }).join('')}</div>
      </article>`;
    }).join('');
  };
  renderStores();

  // Care tiles & style grid
  $('#careTiles').innerHTML = [18, 7, 15, 20].map((id) => tile(byId.get(id))).join('');
  $('#styleGrid').innerHTML = [2, 3, 12, 13, 14, 9, 19, 6].map((id) => card(byId.get(id))).join('');

  /* ---------- Search & filter ---------- */
  const results = $('#results');
  let activeCat = null;
  const norm = (s) => s.toLowerCase()
    .replace(/[ً-ْـ]/g, '')   // tashkeel + tatweel
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

  const runSearch = (scroll) => {
    const q = norm($('#q').value);
    if (!q && !activeCat) { results.hidden = true; return; }
    const words = q.split(/\s+/).filter(Boolean);
    const list = P.filter((p) => {
      if (activeCat && p.cat !== activeCat) return false;
      const hay = norm(`${p.name} ${p.store} ${CATS.find((c) => c.id === p.cat).name}`);
      return words.every((w) => hay.includes(w));
    });
    const catName = activeCat ? CATS.find((c) => c.id === activeCat).name : '';
    const raw = $('#q').value.trim();
    $('#resultsTitle').textContent = raw && catName ? `«${raw}» في ${catName}` : raw ? `نتائج «${raw}»` : catName;
    $('#resultsGrid').innerHTML = list.map((p) => card(p)).join('');
    $('#resultsEmpty').hidden = list.length > 0;
    results.hidden = false;
    if (scroll) results.scrollIntoView({ block: 'start' });
  };

  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); runSearch(true); $('#q').blur(); });
  let t;
  $('#q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runSearch(false), 160); });

  /* ---------- Cart ---------- */
  const persistCart = () => store.set('raff.cart', cart);
  const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
  const setBadge = (el, n) => { el.hidden = n === 0; el.textContent = ar.format(n); };

  const renderCart = () => {
    const ids = Object.keys(cart).map(Number);
    const count = ids.reduce((s, id) => s + cart[id], 0);
    const total = ids.reduce((s, id) => s + cart[id] * byId.get(id).price, 0);
    setBadge($('#cartBadge'), count);
    $('#cartList').innerHTML = ids.map((id) => {
      const p = byId.get(id);
      return `<li class="cart-item">
        <span class="cart-thumb" style="--bg:${p.bg}">${art(p)}</span>
        <div class="cart-info"><b>${esc(p.name)}</b><small>${esc(p.store)}</small>
          <div class="qty"><button type="button" data-dec="${id}" aria-label="إنقاص">−</button><span>${ar.format(cart[id])}</span><button type="button" data-inc="${id}" aria-label="زيادة">+</button></div>
        </div>
        <span class="cart-price">${money(p.price * cart[id])}</span>
      </li>`;
    }).join('');
    $('#cartEmpty').hidden = count > 0;
    $('#cartFoot').hidden = count === 0;
    $('#cartTotal').textContent = money(total);
  };

  const addToCart = (id) => {
    cart[id] = (cart[id] || 0) + 1;
    persistCart(); renderCart(); bump($('#cartBadge'));
    toast(`انضاف «${byId.get(id).name}» إلى السلة`);
  };

  const cartEl = $('#cart'), scrim = $('#scrim');
  let lastFocus = null;
  const openCart = () => {
    lastFocus = document.activeElement;
    scrim.hidden = false; cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden', 'false');
    cartEl.querySelector('.icon-btn').focus();
  };
  const closeCart = () => {
    scrim.hidden = true; cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden', 'true');
    lastFocus?.focus?.();
  };

  /* ---------- Saved ---------- */
  const renderSaved = () => setBadge($('#savedBadge'), saved.size);
  const toggleSave = (id) => {
    saved.has(id) ? saved.delete(id) : saved.add(id);
    store.set('raff.saved', [...saved]);
    document.querySelectorAll(`[data-save="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', saved.has(id)));
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
    const p = byId.get(id); qvId = id;
    $('#qvImg').style.setProperty('--bg', p.bg);
    $('#qvImg').innerHTML = art(p);
    $('#qvStore').textContent = p.store;
    $('#qvName').textContent = p.name;
    $('#qvRate').textContent = `★ ${ar.format(p.rating)} · ${compact(p.reviews)} تقييم`;
    $('#qvDesc').textContent = p.desc;
    $('#qvPrice').textContent = money(p.price);
    if (typeof qv.showModal === 'function') qv.showModal(); else qv.setAttribute('open', '');
  };
  const closeQV = () => (qv.close ? qv.close() : qv.removeAttribute('open'));
  qv.addEventListener('click', (e) => { if (e.target === qv) closeQV(); });
  $('#qvAdd').addEventListener('click', () => { addToCart(qvId); closeQV(); });

  /* ---------- Toast ---------- */
  let tt;
  const toast = (msg) => {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2200);
  };

  /* ---------- Pills ---------- */
  const syncPills = () => document.querySelectorAll('.pill').forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === activeCat));

  /* ---------- Scroller arrows (RTL aware) ---------- */
  const updateArrows = (sc) => {
    const max = sc.scrollWidth - sc.clientWidth;
    const pos = Math.abs(sc.scrollLeft);
    document.querySelectorAll(`[data-scroll="${sc.id}"]`).forEach((b) => {
      b.disabled = b.dataset.dir === '1' ? pos >= max - 2 : pos <= 2;
    });
  };
  document.querySelectorAll('.scroller').forEach((sc) => {
    sc.addEventListener('scroll', () => updateArrows(sc), { passive: true });
    updateArrows(sc);
  });
  addEventListener('resize', () => document.querySelectorAll('.scroller').forEach(updateArrows));

  /* ---------- Event delegation ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, [data-action]');
    if (!el) return;
    const d = el.dataset;
    if (d.open) { openQV(+d.open); return; }
    if (d.add) { addToCart(+d.add); return; }
    if (d.save) { toggleSave(+d.save); return; }
    if (d.inc) { cart[d.inc]++; persistCart(); renderCart(); return; }
    if (d.dec) { if (--cart[d.dec] <= 0) delete cart[d.dec]; persistCart(); renderCart(); return; }
    if (d.cat) {
      $('#resultsEmpty').textContent = 'ما لقينا شي بهالاسم. جرّب كلمة ثانية.';
      activeCat = activeCat === d.cat ? null : d.cat; syncPills(); runSearch(true); return;
    }
    if (d.follow) {
      const f = new Set(store.get('raff.follow', []));
      f.has(d.follow) ? f.delete(d.follow) : f.add(d.follow);
      store.set('raff.follow', [...f]); renderStores();
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
      case 'clear':
        $('#q').value = ''; activeCat = null; syncPills(); results.hidden = true;
        $('#resultsEmpty').textContent = 'ما لقينا شي بهالاسم. جرّب كلمة ثانية.';
        break;
      case 'checkout': toast('هذا متجر تجريبي، ما في دفع حقيقي'); break;
    }
  });
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartEl.classList.contains('open')) closeCart();
    if (e.key === '/' && document.activeElement !== $('#q') && !qv.open) { e.preventDefault(); $('#q').focus(); }
  });

  renderCart();
  renderSaved();
})();
