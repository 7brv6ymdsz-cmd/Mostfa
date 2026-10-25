"use strict";
if (window.top !== window.self) { document.documentElement.hidden = true; throw new Error('framed'); }
// Sales page. Checkout, payment checks and the download all happen on Payhip.
const BUY_URL = "https://payhip.com/b/gfGci";

const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ar = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// every buy button points at the one verified product page
document.querySelectorAll('.buy-link').forEach(a => {
  if (/^https:\/\/payhip\.com\/b\/[A-Za-z0-9]+$/.test(BUY_URL)) a.href = BUY_URL;
  else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
});

// a drop of water in every button
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn'); if (!btn || reduce) return;
  const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement('span');
  d.className = 'drop'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
  btn.appendChild(d); setTimeout(() => d.remove(), 950);
});

// night sky
(function(){
  const c = $('sky'), x = c.getContext('2d'); let w, h, stars = [], flies = [];
  function size(){ const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w*dpr; c.height = h*dpr; x.setTransform(dpr,0,0,dpr,0,0);
    stars = Array.from({length: Math.round(w*h/9000)}, () => ({x:Math.random()*w, y:Math.random()*h*.85, r:Math.random()*1.1 + .2, p:Math.random()*6.28, s:.3 + Math.random()*.7}));
    flies = Array.from({length: w < 700 ? 10 : 18}, () => ({x:Math.random()*w, y:h*.3 + Math.random()*h*.7, vx:(Math.random()-.5)*.15, vy:-.05 - Math.random()*.12, p:Math.random()*6.28})); }
  function draw(t){
    x.clearRect(0,0,w,h);
    const drift = (scrollY * .04) % h;
    stars.forEach(s => { let y = s.y - drift; if (y < 0) y += h;
      x.globalAlpha = .25 + .55 * (.5 + .5*Math.sin(t/1000*s.s + s.p)); x.fillStyle = '#EDE6D6'; x.beginPath(); x.arc(s.x, y, s.r, 0, 6.283); x.fill(); });
    flies.forEach(f => { f.x += f.vx; f.y += f.vy; if (f.y < -10){ f.y = h + 10; f.x = Math.random()*w; }
      const a = .15 + .35 * (.5 + .5*Math.sin(t/700 + f.p)), g = x.createRadialGradient(f.x, f.y, 0, f.x, f.y, 10);
      g.addColorStop(0, `rgba(224,174,106,${a})`); g.addColorStop(1, 'rgba(224,174,106,0)');
      x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(f.x, f.y, 10, 0, 6.283); x.fill(); });
    x.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); reduce ? draw(0) : requestAnimationFrame(draw);
})();

// 3D book that turns a full circle as you scroll through the first screen
window.mountSakinaBook($('book3d'), $('bookHint'), {scrollSpin: !reduce});

// feature cards: tilt toward the mouse, numbers count up once
document.querySelectorAll('.feat').forEach(el => {
  if (reduce) return;
  el.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
    el.classList.add('hovering'); el.style.setProperty('--ty', (x*10)+'deg'); el.style.setProperty('--tx', (-y*8)+'deg'); });
  el.addEventListener('pointerleave', () => { el.classList.remove('hovering'); el.style.removeProperty('--ty'); el.style.removeProperty('--tx'); });
});
if (!reduce && 'IntersectionObserver' in window){
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const to = +en.target.dataset.count, t0 = performance.now();
    (function step(t){ const k = clamp((t - t0) / 1300); en.target.textContent = ar(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); })(t0);
  }), {threshold: .6});
  document.querySelectorAll('[data-count]').forEach(e => io.observe(e));
}

// page-flip preview: tap the arrows or swipe the page
(function(){
  const leaves = [...document.querySelectorAll('#flip .leaf')].reverse(); // top page first
  const names = ['الإهداء', 'الفهرس', 'المقدمة'];
  let i = 0;
  leaves.forEach((l, k) => l.style.zIndex = leaves.length - k);
  function show(){
    leaves.forEach((l, k) => { l.classList.toggle('turned', k < i); });
    $('flipLabel').textContent = names[i] + ' · ' + ar(i + 1) + ' من ' + ar(leaves.length);
    $('flipPrev').disabled = i === 0; $('flipNext').disabled = i === leaves.length - 1;
  }
  const go = d => { i = clamp(i + d, 0, leaves.length - 1); show(); };
  $('flipNext').addEventListener('click', () => go(1));
  $('flipPrev').addEventListener('click', () => go(-1));
  let sx = null;
  $('flip').addEventListener('pointerdown', e => { sx = e.clientX; });
  $('flip').addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); else go(i === leaves.length - 1 ? -i : 1); });
  show();
})();

// chapters rail progress (RTL scrollLeft runs from 0 to negative)
(function(){
  const rail = $('rail'), bar = $('railBar');
  const upd = () => { const max = rail.scrollWidth - rail.clientWidth; bar.style.setProperty('--rp', max > 0 ? clamp(.08 + .92 * Math.abs(rail.scrollLeft) / max) : 1); };
  rail.addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
})();

// scroll: nav state, the "how" line drawing itself, sticky buy bar
const navShell = $('navShell'), how = $('how'), howLine = $('howLine'), steps = [...how.querySelectorAll('.step')];
const buybar = $('buybar');
let heroIn = true, finalIn = false;
function onScroll(){
  navShell.classList.toggle('scrolled', scrollY > 10);
  const r = how.getBoundingClientRect();
  const d = reduce ? 1 : clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .25));
  howLine.style.setProperty('--draw', d);
  steps.forEach((s, k) => s.classList.toggle('on', d >= k / 2.6));
  const show = !heroIn && !finalIn;
  buybar.classList.toggle('show', show); document.body.classList.toggle('has-buybar', show);
}
if ('IntersectionObserver' in window){
  new IntersectionObserver(es => es.forEach(en => { if (en.target.id === 'heroBuy') heroIn = en.isIntersecting; else finalIn = en.isIntersecting; onScroll(); }), {threshold: 0})
    .observe($('heroBuy'));
  new IntersectionObserver(es => es.forEach(en => { finalIn = en.isIntersecting; onScroll(); }), {threshold: 0}).observe($('finalBuy'));
}
addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll); onScroll();
