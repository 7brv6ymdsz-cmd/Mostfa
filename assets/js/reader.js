"use strict";
if (window.top !== window.self) { document.documentElement.hidden = true; throw new Error('framed'); }
// Buyer's reader. The book ships encrypted (AES-256-GCM, key from the reader code via PBKDF2);
// it is decrypted in this browser only after the right code is typed.
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const CODE_KEY = 'sakina-reader-code', POS_KEY = 'sakina-reader-pos', AAD = new TextEncoder().encode('sakina-reader-v1');
const TOC = [['الغلاف',0],['الفهرس',4],['مقدمة: رسالة إلى من أتعبه الطريق',5],['الباب الأول: الضجيج',8],['الباب الثاني: الشاهد',11],['الباب الثالث: النَّفَس',14],
  ['الباب الرابع: القبول',17],['الباب الخامس: الجرح',20],['الباب السادس: الصفح',23],['الباب السابع: التعلّق',26],['الباب الثامن: الخلوة',29],
  ['الباب التاسع: الآن',32],['الباب العاشر: الامتنان',35],['الباب الحادي عشر: الفناء',38],['الباب الثاني عشر: العودة',41],['الغلاف الخلفي',45]];

const store = {
  get(k){ try { return localStorage.getItem(k); } catch(_) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(_) {} },
  del(k){ try { localStorage.removeItem(k); } catch(_) {} }
};

// ---------- unlock ----------
let pages = [], aspect = 0.705, encrypted = null;

async function fetchBook(){
  if (encrypted) return encrypted;
  const res = await fetch('book.enc', {cache: 'force-cache'});
  if (!res.ok) throw new Error('net');
  const total = +res.headers.get('content-length') || 0;
  if (!res.body || !total){ encrypted = new Uint8Array(await res.arrayBuffer()); return encrypted; }
  const reader = res.body.getReader(), chunks = []; let got = 0;
  for (;;){ const {done, value} = await reader.read(); if (done) break; chunks.push(value); got += value.length; $('load').style.setProperty('--p', Math.min(.9, got / total * .9)); }
  encrypted = new Uint8Array(got); let o = 0; chunks.forEach(c => { encrypted.set(c, o); o += c.length; });
  return encrypted;
}

async function unlock(code){
  const norm = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (norm.length < 12) throw new Error('short');
  const buf = await fetchBook();
  if (String.fromCharCode(...buf.slice(0, 4)) !== 'SKNE') throw new Error('format');
  const iter = new DataView(buf.buffer, buf.byteOffset + 4, 4).getUint32(0);
  const salt = buf.slice(8, 24), iv = buf.slice(24, 36), ct = buf.slice(36);
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations: iter, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['decrypt']);
  let plain;
  try { plain = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv, additionalData: AAD}, key, ct)); }
  catch(_) { throw new Error('wrong'); }
  if (String.fromCharCode(...plain.slice(0, 5)) !== 'SKNB1') throw new Error('format');
  const mlen = new DataView(plain.buffer, 5, 4).getUint32(0);
  const man = JSON.parse(new TextDecoder().decode(plain.slice(9, 9 + mlen)));
  const data = plain.subarray(9 + mlen);
  pages = man.pages.map(p => URL.createObjectURL(new Blob([data.slice(p.o, p.o + p.l)], {type:'image/jpeg'})));
  aspect = man.pages[0].w / man.pages[0].h;
  return norm;
}

async function tryOpen(code, remember){
  const err = $('gateErr'), btn = $('openBtn');
  err.hidden = true; btn.disabled = true; btn.textContent = 'جارٍ فتح الكتاب…';
  $('load').hidden = false; $('load').style.setProperty('--p', .05);
  try {
    const norm = await unlock(code);
    $('load').style.setProperty('--p', 1);
    if (remember) store.set(CODE_KEY, norm); else store.del(CODE_KEY);
    startReader();
  } catch(e){
    const msg = {short:'الرمز قصير. اكتبه كما هو في ملف الكتاب، مثل SKN-XXXX-XXXX-XXXX.',
                 wrong:'الرمز غير صحيح. تأكد منه في الصفحة الرابعة من ملف الكتاب.',
                 net:'تعذّر تحميل الكتاب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.'}[e.message] || 'تعذّر فتح الكتاب. حدّث الصفحة وحاول مرة أخرى.';
    err.textContent = msg; err.hidden = false; $('load').hidden = true;
    if (e.message === 'wrong') store.del(CODE_KEY);
  }
  btn.disabled = false; btn.textContent = 'افتح الكتاب';
}

if (!window.crypto?.subtle){ $('gateErr').textContent = 'هذا المتصفح لا يدعم فتح الكتاب المشفّر. استعمل Safari أو Chrome حديثاً.'; $('gateErr').hidden = false; $('openBtn').disabled = true; }
$('gateForm').addEventListener('submit', e => { e.preventDefault(); tryOpen($('code').value, $('remember').checked); });
const saved = store.get(CODE_KEY);
if (saved && window.crypto?.subtle){ $('code').value = saved; tryOpen(saved, true); }

// ---------- reader ----------
const book = $('book'), baseR = $('baseR'), baseL = $('baseL');
let spread = false, pos = 0, busy = false, flips = 0;
const N = () => pages.length;
const setImg = (el, i) => { if (i >= 0 && i < N()){ el.style.backgroundImage = `url("${pages[i]}")`; el.classList.remove('empty'); } else { el.style.backgroundImage = 'none'; el.classList.add('empty'); } };

function layout(){
  const st = $('stage').getBoundingClientRect();
  spread = innerWidth >= 900 && innerWidth > innerHeight * 1.1;
  book.classList.toggle('single', !spread);
  let bh, bw;
  if (spread){ bh = Math.min(st.height - 24, (st.width - 60) / (2 * aspect)); bw = 2 * aspect * bh; }
  else { bh = Math.min(st.height - 20, (st.width - 32) / aspect); bw = aspect * bh; }
  book.style.setProperty('--bw', bw + 'px'); book.style.setProperty('--bh', bh + 'px');
  if (spread) pos -= pos % 2;
  paint();
}
function paint(){
  setImg(baseR, pos);
  if (spread) setImg(baseL, pos + 1);
  const a = pos + 1, b = spread ? Math.min(pos + 2, N()) : a;
  $('pageLabel').textContent = 'صفحة ' + ar(a) + (b !== a ? '–' + ar(b) : '') + ' من ' + ar(N());
  $('slider').value = a;
  $('prevBtn').disabled = pos === 0;
  $('nextBtn').disabled = pos + (spread ? 2 : 1) >= N();
  document.querySelectorAll('#tocList button').forEach(btn => { const p = +btn.dataset.p; btn.classList.toggle('cur', p <= pos + (spread ? 1 : 0) && (TOC.find(t => t[1] > p)?.[1] ?? 1e9) > pos); });
  store.set(POS_KEY, String(pos));
}

function makeLeaf(front, back){
  const leaf = document.createElement('div'); leaf.className = 'leaf';
  const fa = document.createElement('div'); fa.className = 'face a'; setImg(fa, front); leaf.appendChild(fa);
  if (back !== undefined){ const fb = document.createElement('div'); fb.className = 'face b'; setImg(fb, back); leaf.appendChild(fb); }
  book.appendChild(leaf);
  return leaf;
}
function turn(leaf, from, to){
  const dur = reduce ? 1 : 900, ease = 'cubic-bezier(.45,.05,.25,1)';
  leaf.querySelectorAll('.face').forEach(f => f.animate([{'--sh':'0'},{'--sh':'.9'},{'--sh':'0'}], {duration: dur, easing: ease}));
  return leaf.animate([{transform:`rotateY(${from}deg)`},{transform:`rotateY(${(from + to) / 2}deg) translateZ(30px)`},{transform:`rotateY(${to}deg)`}], {duration: dur, easing: ease}).finished;
}
async function next(){
  const step = spread ? 2 : 1;
  if (busy || pos + step >= N()) return;
  busy = true;
  if (spread){
    const leaf = makeLeaf(pos + 1, pos + 2); setImg(baseL, pos + 3);
    await turn(leaf, 0, -180); pos += 2; paint(); leaf.remove();
  } else {
    const leaf = makeLeaf(pos); setImg(baseR, pos + 1);
    await turn(leaf, 0, -180); pos += 1; paint(); leaf.remove();
  }
  busy = false; hintOnce();
}
async function prev(){
  if (busy || pos === 0) return;
  busy = true;
  if (spread){
    const leaf = makeLeaf(pos - 1, pos); leaf.style.transform = 'rotateY(-180deg)'; setImg(baseR, pos - 2);
    await turn(leaf, -180, 0); pos -= 2; paint(); leaf.remove();
  } else {
    const leaf = makeLeaf(pos - 1); leaf.style.transform = 'rotateY(-180deg)';
    await turn(leaf, -180, 0); pos -= 1; paint(); leaf.remove();
  }
  busy = false;
}
function jump(p){ if (busy) return; pos = Math.max(0, Math.min(N() - 1, p)); if (spread) pos -= pos % 2; paint(); }
function hintOnce(){ if (++flips === 2) $('hint').classList.add('fade'); }

function startReader(){
  $('gate').hidden = true; $('reader').hidden = false;
  $('slider').max = N();
  $('tocList').innerHTML = '';
  TOC.forEach(([name, p]) => { const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.dataset.p = p; b.textContent = name; const s = document.createElement('small'); s.textContent = 'ص ' + ar(p + 1); b.appendChild(s);
    b.addEventListener('click', () => { jump(p); toggleToc(false); }); li.appendChild(b); $('tocList').appendChild(li); });
  pos = Math.max(0, Math.min(N() - 1, +(store.get(POS_KEY) || 0)));
  layout();
}

function toggleToc(open){ $('toc').hidden = !open; $('tocBtn').setAttribute('aria-expanded', open); }
$('tocBtn').addEventListener('click', () => toggleToc($('toc').hidden));
$('nextBtn').addEventListener('click', next); $('prevBtn').addEventListener('click', prev);
$('nextZone').addEventListener('click', next); $('prevZone').addEventListener('click', prev);
$('slider').addEventListener('input', e => jump(+e.target.value - 1));
addEventListener('keydown', e => {
  if ($('reader').hidden || e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' '){ e.preventDefault(); next(); }
  else if (e.key === 'ArrowRight' || e.key === 'PageUp'){ e.preventDefault(); prev(); }
  else if (e.key === 'Escape') toggleToc(false);
});
// swipe: in an Arabic book the page travels from left to right, so a rightward swipe turns forward
let sx = null, sy = null;
$('stage').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
$('stage').addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) (dx > 0 ? next : prev)(); });
addEventListener('resize', () => { if (!$('reader').hidden) layout(); });

if (document.fullscreenEnabled){ $('fsBtn').hidden = false;
  $('fsBtn').addEventListener('click', () => { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); }); }
$('lockBtn').addEventListener('click', () => { store.del(CODE_KEY); pages.forEach(u => URL.revokeObjectURL(u)); location.reload(); });
