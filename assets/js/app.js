"use strict";
if (window.top !== window.self) { document.documentElement.hidden = true; throw new Error('framed'); }
// ===== إعدادات الدفع =====
// صفحة المنتج في Payhip: تتحقق من الدفع وتعطي المشتري رابط تحميل خاصاً به
const BUY_URL = "https://payhip.com/b/gfGci";

const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ar = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

// payment: Payhip handles checkout, verification and the download
(function(){
  const link = $('buyLink');
  if (!/^https:\/\/payhip\.com\/b\/[A-Za-z0-9]+$/.test(BUY_URL)) { link.removeAttribute('href'); link.setAttribute('aria-disabled','true'); link.textContent = 'الدفع يُفتح قريباً'; return; }
  link.href = BUY_URL;
})();

// offer card: gentle 3D tilt (mouse only)
(function(){
  const el = $('offer'); if (reduce) return;
  el.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
    el.classList.add('hovering'); el.style.setProperty('--ty', (x*8)+'deg'); el.style.setProperty('--tx', (-y*6)+'deg'); });
  el.addEventListener('pointerleave', () => { el.classList.remove('hovering'); el.style.removeProperty('--ty'); el.style.removeProperty('--tx'); });
})();

// a drop of water in every button
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn'); if (!btn || reduce) return;
  const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement('span');
  d.className = 'drop'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;
  btn.appendChild(d); setTimeout(() => d.remove(), 950);
});

// scroll: nav, active link, the lit path, reading bar
const navShell = $('navShell'), links = [...document.querySelectorAll('.nav ul a[href^="#"]:not(.btn)')];
const pathList = $('pathList'), walked = $('walked'), stones = [...document.querySelectorAll('.stone')];
const paper = $('paper'), readBar = $('readBar');
function onScroll(){
  navShell.classList.toggle('scrolled', scrollY > 10);
  let cur = null;
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < innerHeight*.45) cur = a; });
  links.forEach(a => a.classList.toggle('active', a === cur));
  const pr = pathList.getBoundingClientRect(), mid = innerHeight * .6;
  const walk = Math.min(1, Math.max(0, (mid - pr.top) / pr.height));
  walked.style.setProperty('--walk', walk);
  stones.forEach(s => { const r = s.getBoundingClientRect(); s.classList.toggle('lit', r.top + r.height/2 < mid); });
  const rr = paper.getBoundingClientRect();
  readBar.style.transform = `scaleX(${Math.min(1, Math.max(0, (innerHeight*.5 - rr.top) / rr.height))})`;
}
addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll); onScroll();

// tabs with a sliding moon pill
const tabs = [...document.querySelectorAll('.tab')], ind = $('tabInd');
function placeInd(t){ const p = t.parentElement.getBoundingClientRect(), r = t.getBoundingClientRect(); ind.style.right = (p.right - r.right) + 'px'; ind.style.width = r.width + 'px'; }
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(o => { const on = o === t, panel = $(o.getAttribute('aria-controls'));
    o.setAttribute('aria-selected', on); panel.hidden = !on;
    if (on){ panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter'); } });
  placeInd(t); if (paper.getBoundingClientRect().top < 0) paper.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
  onScroll();
}));
const placeCurrent = () => placeInd(tabs.find(t => t.getAttribute('aria-selected') === 'true'));
placeCurrent(); document.fonts && document.fonts.ready.then(placeCurrent); addEventListener('resize', placeCurrent);

// breathing moon: 4s in, 6s out, three breaths
(function(){
  const btn = $('breatheBtn'), moon = $('moon'), word = $('moonWord'), count = $('moonCount'), cyc = $('cycles');
  let timer = null, running = false;
  function stop(done){ clearInterval(timer); running = false; moon.style.transitionDuration = '1.5s'; moon.style.setProperty('--s', 1); moon.classList.remove('full');
    word.textContent = done ? 'أحسنت' : 'مستعد؟'; count.textContent = ''; btn.textContent = done ? 'مرة أخرى' : 'ابدأ التنفّس'; cyc.textContent = done ? 'لاحظ كيف تشعر الآن.' : ''; }
  btn.addEventListener('click', () => {
    if (running) return stop(false);
    running = true; btn.textContent = 'توقّف'; let sec = 0;
    const tick = () => {
      if (sec >= 30) return stop(true);
      const k = sec % 10, inhale = k < 4;
      if (k === 0){ moon.style.transitionDuration = '4s'; moon.style.setProperty('--s', 1.7); moon.classList.add('full'); }
      if (k === 4){ moon.style.transitionDuration = '6s'; moon.style.setProperty('--s', 1); moon.classList.remove('full'); }
      word.textContent = inhale ? 'شهيق' : 'زفير'; count.textContent = ar(inhale ? 4 - k : 10 - k);
      cyc.textContent = 'النفَس ' + ar(Math.floor(sec/10) + 1) + ' من ٣'; sec++;
    };
    tick(); timer = setInterval(tick, 1000);
  });
})();

// the night sky: slow stars and a few drifting fireflies
(function(){
  const c = $('sky'), x = c.getContext('2d'); let w, h, stars = [], flies = [];
  function size(){ const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w*dpr; c.height = h*dpr; x.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.round(w*h/9000); stars = Array.from({length:n}, () => ({x:Math.random()*w, y:Math.random()*h*.85, r:Math.random()*1.1 + .2, p:Math.random()*6.28, s:.3 + Math.random()*.7}));
    flies = Array.from({length: w < 700 ? 10 : 18}, () => ({x:Math.random()*w, y:h*.3 + Math.random()*h*.7, vx:(Math.random()-.5)*.15, vy:-.05 - Math.random()*.12, p:Math.random()*6.28})); }
  function draw(t){
    x.clearRect(0,0,w,h);
    const drift = (scrollY * .04) % h;
    stars.forEach(s => { const a = .25 + .55 * (.5 + .5*Math.sin(t/1000*s.s + s.p)); let y = s.y - drift; if (y < 0) y += h;
      x.globalAlpha = a; x.fillStyle = '#EDE6D6'; x.beginPath(); x.arc(s.x, y, s.r, 0, 6.283); x.fill(); });
    flies.forEach(f => { f.x += f.vx; f.y += f.vy; if (f.y < -10){ f.y = h + 10; f.x = Math.random()*w; }
      const a = .15 + .35 * (.5 + .5*Math.sin(t/700 + f.p)), g = x.createRadialGradient(f.x, f.y, 0, f.x, f.y, 10);
      g.addColorStop(0, `rgba(224,174,106,${a})`); g.addColorStop(1, 'rgba(224,174,106,0)');
      x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(f.x, f.y, 10, 0, 6.283); x.fill(); });
    x.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); reduce ? draw(0) : requestAnimationFrame(draw);
})();

// the lake surface under the hero: moon reflection broken by slow ripples
(function(){
  const c = $('water'), x = c.getContext('2d'); let w, h;
  function size(){ const dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w*dpr; c.height = h*dpr; x.setTransform(dpr,0,0,dpr,0,0); }
  function draw(t){
    x.clearRect(0,0,w,h);
    const g = x.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(237,230,214,.10)'); g.addColorStop(.02,'rgba(237,230,214,.03)'); g.addColorStop(1,'rgba(9,18,20,0)');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.fillStyle = 'rgba(237,230,214,.35)'; x.fillRect(0,0,w,1);
    for (let i = 0; i < 14; i++){
      const y = 8 + i*7.5, len = (w*.18) * (1 - i/16) * (.7 + .3*Math.sin(t/1600 + i)), off = Math.sin(t/2200 + i*1.7) * 14;
      x.globalAlpha = .55 * (1 - i/14); x.fillStyle = '#EDE6D6';
      x.fillRect(w/2 - len/2 + off, y, len, 1.2);
    }
    x.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); reduce ? draw(0) : requestAnimationFrame(draw);
})();

// ambient sound: soft waves made in the browser (no files)
(function(){
  const btn = $('sound'), label = $('soundLabel'); let ctx = null, master = null, on = false;
  function build(){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++){ const d = buf.getChannelData(ch); let last = 0;
      for (let i = 0; i < len; i++){ const white = Math.random()*2 - 1; last = (last + .02*white) / 1.02; d[i] = last * 3.5; } }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650;
    const swell = ctx.createGain(); swell.gain.value = .55;
    const lfo = ctx.createOscillator(); lfo.frequency.value = .09; const depth = ctx.createGain(); depth.gain.value = .4;
    lfo.connect(depth).connect(swell.gain);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = .05; const d2 = ctx.createGain(); d2.gain.value = 250; lfo2.connect(d2).connect(lp.frequency);
    master = ctx.createGain(); master.gain.value = 0;
    src.connect(lp).connect(swell).connect(master).connect(ctx.destination);
    src.start(); lfo.start(); lfo2.start();
  }
  btn.addEventListener('click', async () => {
    try {
      if (!ctx) build();
      if (ctx.state === 'suspended') await ctx.resume();
      on = !on; const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? .35 : 0, now + 2.5);
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); label.textContent = on ? 'إيقاف الموج' : 'صوت الموج';
    } catch(_) { label.textContent = 'الصوت غير متاح هنا'; }
  });
})();

// 3D book (assets/js/book3d.js)
window.mountSakinaBook($('book3d'), $('bookHint'));
