"use strict";
if (window.top !== window.self) { document.documentElement.hidden = true; throw new Error('framed'); }
// Free chapters reading room: one chapter at a time, tunable type, saved progress, and a gentle path to the full book.
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(_) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(_) {} }
};
const KEYS = ['intro', 'ch1', 'ch2'];
const chapters = Object.fromEntries(KEYS.map(k => [k, $('c-' + k)]));
let current = null, prog = store.get('sakina-free-progress', {}), checks = store.get('sakina-free-checks', {});

// ---------- ambience shared with the rest of the site ----------
(function sky(){
  const c = $('sky'), x = c.getContext('2d'); let w, h, stars = [];
  function size(){ const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w*dpr; c.height = h*dpr; x.setTransform(dpr,0,0,dpr,0,0);
    stars = Array.from({length: Math.round(w*h/11000)}, () => ({x:Math.random()*w, y:Math.random()*h, r:Math.random()*1.1 + .2, p:Math.random()*6.28, s:.3 + Math.random()*.7})); }
  function draw(t){ x.clearRect(0,0,w,h); const drift = (scrollY * .03) % h;
    stars.forEach(s => { let y = s.y - drift; if (y < 0) y += h; x.globalAlpha = .2 + .5 * (.5 + .5*Math.sin(t/1000*s.s + s.p)); x.fillStyle = '#EDE6D6'; x.beginPath(); x.arc(s.x, y, s.r, 0, 6.283); x.fill(); });
    x.globalAlpha = 1; if (!reduce) requestAnimationFrame(draw); }
  size(); addEventListener('resize', size); reduce ? draw(0) : requestAnimationFrame(draw);
})();
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn'); if (!btn || reduce) return;
  const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement('span');
  d.className = 'drop'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
  btn.appendChild(d); setTimeout(() => d.remove(), 950);
});
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

// ---------- reading preferences ----------
let fs = store.get('sakina-free-fs', 1.25), night = store.get('sakina-free-night', false);
function applyPrefs(){
  document.documentElement.style.setProperty('--fs', fs + 'rem');
  document.body.classList.toggle('ink-night', night);
  $('inkBtn').setAttribute('aria-pressed', night);
  $('fsDown').disabled = fs <= 1.05; $('fsUp').disabled = fs >= 1.65;
}
$('fsDown').addEventListener('click', () => { fs = Math.round((fs - .1) * 100) / 100; store.set('sakina-free-fs', fs); applyPrefs(); });
$('fsUp').addEventListener('click', () => { fs = Math.round((fs + .1) * 100) / 100; store.set('sakina-free-fs', fs); applyPrefs(); });
$('inkBtn').addEventListener('click', () => { night = !night; store.set('sakina-free-night', night); applyPrefs(); });
applyPrefs();

// ---------- chapters ----------
function navHeight(){ document.documentElement.style.setProperty('--navh', $('navShell').offsetHeight + 'px'); }
navHeight(); addEventListener('resize', navHeight);

function open(key, scroll){
  if (!chapters[key]) key = 'intro';
  current = key;
  KEYS.forEach(k => { chapters[k].hidden = k !== key; });
  const el = chapters[key]; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.go === key));
  document.querySelectorAll('.ch-card').forEach(c => c.classList.toggle('cur', c.dataset.go === key));
  $('teaser').hidden = key !== 'ch2';
  if (history.replaceState) history.replaceState(null, '', '#' + key);
  store.set('sakina-free-last', key);
  if (scroll){ const top = $('room').getBoundingClientRect().top + scrollY - $('rbar').offsetHeight - $('navShell').offsetHeight + 4;
    window.scrollTo({top, behavior: reduce ? 'auto' : 'smooth'}); }
  onScroll();
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]'); if (!a) return;
  e.preventDefault(); open(a.dataset.go, true);
});

// ---------- progress ----------
function renderCards(){
  document.querySelectorAll('.ch-card').forEach(c => {
    const p = prog[c.dataset.go] || 0;
    c.style.setProperty('--p', p);
    c.querySelector('.cc-state').textContent = p >= .97 ? 'أنهيته ✓' : p > .03 ? 'قرأت ' + ar(Math.round(p * 100)) + '٪' : 'لم تبدأ';
  });
  const last = store.get('sakina-free-last', null), lp = last ? (prog[last] || 0) : 0;
  const r = $('resume');
  if (last && lp > .05 && lp < .97){ r.hidden = false; r.dataset.go = last; r.textContent = 'تابع من حيث توقفت · ' + ar(Math.round(lp * 100)) + '٪ ←'; }
  else r.hidden = true;
}
let saveT = 0;
function onScroll(){
  $('navShell').classList.toggle('scrolled', scrollY > 10);
  if (!current) return;
  const el = chapters[current], r = el.getBoundingClientRect();
  const p = clamp((innerHeight * .75 - r.top) / r.height);
  $('rprog').style.setProperty('--rp', p);
  if (p > (prog[current] || 0)){ prog[current] = Math.round(p * 100) / 100; clearTimeout(saveT); saveT = setTimeout(() => { store.set('sakina-free-progress', prog); renderCards(); }, 400); }
  const end = el.querySelector('.ch-end'); if (end) end.classList.toggle('reached', end.getBoundingClientRect().top < innerHeight * .85);
  // the offer bar appears once the reader is deep into the second chapter
  const show = current === 'ch2' && p > .55;
  $('buybar').classList.toggle('show', show); document.body.classList.toggle('has-buybar', show);
}
addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll);

// resume jumps back to the saved point in the chapter
$('resume').addEventListener('click', e => {
  e.preventDefault(); e.stopPropagation();
  const key = $('resume').dataset.go; open(key, false);
  const el = chapters[key], p = prog[key] || 0;
  requestAnimationFrame(() => window.scrollTo({top: el.getBoundingClientRect().top + scrollY + el.offsetHeight * p - innerHeight * .75, behavior: reduce ? 'auto' : 'smooth'}));
}, true);

// ---------- quotes and practices ----------
if ('IntersectionObserver' in window && !reduce){
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }), {threshold: .6});
  document.querySelectorAll('.pull').forEach(q => io.observe(q));
}
document.querySelectorAll('.copy-q').forEach(b => b.addEventListener('click', async () => {
  const q = b.previousElementSibling.innerText.replace(/\s*\n\s*/g, ' ').trim();
  const text = '«' + q + '»\n— من كتاب سَكينة\n' + location.origin + location.pathname;
  try { await navigator.clipboard.writeText(text); toast('نُسخ الاقتباس. شاركه مع من يحتاجه 🤍'); }
  catch(_) { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('حدّد النص وانسخه'); }
}));
document.querySelectorAll('.practice input[type=checkbox]').forEach(cb => {
  cb.checked = !!checks[cb.dataset.k];
  cb.addEventListener('change', () => {
    checks[cb.dataset.k] = cb.checked; store.set('sakina-free-checks', checks);
    const box = cb.closest('.practice'), all = [...box.querySelectorAll('input')];
    if (cb.checked && all.every(x => x.checked)) toast('أحسنت. أنجزت التمرين كاملاً ✦');
  });
});

// ---------- start ----------
renderCards();
const fromHash = location.hash.slice(1);
open(KEYS.includes(fromHash) ? fromHash : 'intro', KEYS.includes(fromHash));
addEventListener('hashchange', () => { const k = location.hash.slice(1); if (KEYS.includes(k) && k !== current) open(k, true); });
