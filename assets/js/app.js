"use strict";
// ===== إعدادات الدفع =====
// بريد حساب PayPal الذي يستلم المال (مثال: "you@gmail.com")
const PAYPAL_EMAIL = "";
// أو رابط صفحة Payhip/Gumroad إن وُجد (يُستعمل بدل PayPal ويرسل الكتاب تلقائياً)
const BUY_URL = "";
const PRICE = 5, CURRENCY = "USD", ITEM = "Sakina - eBook (PDF)";

const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ar = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

// payment
(function(){
  const form = $('payForm'), email = $('buyerEmail'), err = $('payErr'), steps = [...$('steps').children];
  const ready = !!(BUY_URL || PAYPAL_EMAIL);
  if (BUY_URL) $('buyNote').textContent = 'دفع آمن · يصلك الكتاب فوراً بعد الدفع';
  if (!ready){ form.hidden = true; $('buyNote').hidden = true; $('soonBox').hidden = false; $('steps').hidden = true; return; }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){ err.textContent = 'اكتب بريداً صحيحاً حتى يصلك الكتاب عليه، مثل name@gmail.com'; err.hidden = false; email.focus(); return; }
    if (!ready){ err.textContent = 'الدفع لم يُفتح بعد. ارجع قريباً، الكتاب على وشك الصدور.'; err.hidden = false; return; }
    const url = BUY_URL || ('https://www.paypal.com/cgi-bin/webscr?' + new URLSearchParams({
      cmd:'_xclick', business:PAYPAL_EMAIL, item_name:ITEM, amount:PRICE, currency_code:CURRENCY, custom:v, no_shipping:'1', charset:'utf-8'
    }));
    const pay = $('payLink'); pay.href = url; pay.hidden = false; $('buyBtn').hidden = true; pay.focus();
    $('thanksEmail').textContent = v;
  });
  $('payLink').addEventListener('click', () => { steps[1].classList.add('done'); $('thanks').hidden = false; });
  email.addEventListener('input', () => { err.hidden = true; $('payLink').hidden = true; $('buyBtn').hidden = false; });
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

// 3D book: drag to turn it, touch the cover to drop a ripple on the lake
(function(){
  const host = $('book3d');
  const fallback = () => document.documentElement.classList.add('no3d');
  if (!window.THREE || !host) return fallback();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:true}); } catch(e){ return fallback(); }
  if (!renderer.getContext()) return fallback();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 0, 7.6);
  scene.add(new THREE.AmbientLight(0xffffff, .45));
  const key = new THREE.DirectionalLight(0xfff4e4, .9); key.position.set(-2, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe0ae6a, .55); rim.position.set(4, -2, -4); scene.add(rim);

  const W = 2, H = 3, D = .38, TW = 768, TH = 1152;
  const coverC = document.createElement('canvas'); coverC.width = TW; coverC.height = TH; const cx2 = coverC.getContext('2d');
  let drops = [];
  function drawCover(t){
    const g = cx2.createRadialGradient(TW/2, TH*.62, 20, TW/2, TH*.62, TH*.75); g.addColorStop(0, '#244640'); g.addColorStop(1, '#0B1614');
    cx2.fillStyle = g; cx2.fillRect(0, 0, TW, TH);
    const cx = TW/2, cy = TH*.64, max = TW*.95;
    for (let i = 0; i < 7; i++){ const p = ((t/9000) + i/7) % 1, r = 10 + p*max;
      cx2.beginPath(); cx2.ellipse(cx, cy, r, r*.32, 0, 0, Math.PI*2); cx2.strokeStyle = `rgba(241,230,210,${(1-p)*.5})`; cx2.lineWidth = 2.2; cx2.stroke(); }
    drops = drops.filter(d => t - d.t < 2600);
    drops.forEach(d => { for (let j = 0; j < 3; j++){ const p = (t - d.t)/2600 - j*.12; if (p <= 0) continue;
      const r = p*TW*.8; cx2.beginPath(); cx2.ellipse(d.x, d.y, r, r*.34, 0, 0, Math.PI*2); cx2.strokeStyle = `rgba(217,163,94,${(1-p)*.9})`; cx2.lineWidth = 3; cx2.stroke(); } });
    cx2.beginPath(); cx2.arc(cx, cy, 6, 0, Math.PI*2); cx2.fillStyle = '#D9A35E'; cx2.fill();
    cx2.direction = 'rtl'; cx2.textAlign = 'center'; cx2.fillStyle = '#F1E6D2';
    cx2.font = '700 190px "Aref Ruqaa", "Amiri", serif'; cx2.fillText('سَكينة', TW/2, 300);
    cx2.globalAlpha = .85; cx2.font = '500 46px "Noto Naskh Arabic", serif'; cx2.fillText('رحلة العودة إلى الداخل', TW/2, 400);
    cx2.globalAlpha = .7; cx2.font = '500 30px "IBM Plex Sans Arabic", sans-serif'; cx2.fillText('اثنا عشر باباً إلى السلام الداخلي', TW/2, TH - 80);
    cx2.globalAlpha = 1;
    const s = cx2.createLinearGradient(TW, 0, TW - 60, 0); s.addColorStop(0, 'rgba(0,0,0,.45)'); s.addColorStop(1, 'rgba(0,0,0,0)'); cx2.fillStyle = s; cx2.fillRect(TW - 60, 0, 60, TH);
  }
  function makeTex(w, h, paint){ const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
  const paintBack = (x, w, h) => { x.fillStyle = '#0E1C19'; x.fillRect(0, 0, w, h); x.direction = 'rtl'; x.textAlign = 'center';
    x.fillStyle = '#D9A35E'; x.font = '700 50px "Aref Ruqaa", serif'; x.fillText('البحيرة لا تحتاج أن تفعل', w/2, 330); x.fillText('شيئاً كي تصفو.', w/2, 410);
    x.fillStyle = '#F1E6D2'; x.fillText('يكفي أن تكفّ عن تحريكها.', w/2, 520);
    x.globalAlpha = .75; x.font = '500 30px "Noto Naskh Arabic", serif';
    ['كتاب لمن تعب من الركض، ويريد أن يعرف أخيراً','أين يسكن الهدوء الذي يبحث عنه.'].forEach((l,i) => x.fillText(l, w/2, 680 + i*56));
    x.globalAlpha = 1; x.font = '700 90px "Aref Ruqaa", serif'; x.fillText('سَكينة', w/2, h - 140); };
  const paintSpine = (x, w, h) => { x.fillStyle = '#122421'; x.fillRect(0, 0, w, h); x.save(); x.translate(w/2, h/2); x.rotate(Math.PI/2);
    x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#F1E6D2'; x.font = '700 70px "Aref Ruqaa", serif'; x.fillText('سَكينة', 0, 24); x.restore();
    x.fillStyle = '#D9A35E'; x.beginPath(); x.arc(w/2, h - 70, 7, 0, Math.PI*2); x.fill(); };
  const paintPages = (x, w, h) => { x.fillStyle = '#EFE7D6'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 3){ x.fillStyle = `rgba(120,100,70,${.08 + Math.random()*.08})`; x.fillRect(i, 0, 1, h); } };
  const paintPagesH = (x, w, h) => { x.fillStyle = '#EFE7D6'; x.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 3){ x.fillStyle = `rgba(120,100,70,${.08 + Math.random()*.08})`; x.fillRect(0, i, w, 1); } };
  const coverTex = new THREE.CanvasTexture(coverC); coverTex.encoding = THREE.sRGBEncoding; coverTex.anisotropy = 8;
  let backTex = makeTex(TW, TH, paintBack), spineTex = makeTex(128, TH, paintSpine);
  const pagesTex = makeTex(64, TH, paintPages), pagesTexH = makeTex(TW, 64, paintPagesH);

  const dark = new THREE.MeshStandardMaterial({color:0x10201d, roughness:.7});
  const glow = (map, k) => new THREE.MeshStandardMaterial({map, emissive:0xffffff, emissiveMap:map, emissiveIntensity:k, roughness:.55});
  const coverMat = glow(coverTex, .55), backMat = glow(backTex, .5), spineMat = glow(spineTex, .5);
  const pageMat = new THREE.MeshStandardMaterial({map:pagesTex, roughness:.9}), pageMatH = new THREE.MeshStandardMaterial({map:pagesTexH, roughness:.9});

  const book = new THREE.Group(), t = .035;
  const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, t), [dark, dark, dark, dark, coverMat, dark]); front.position.z = D/2 - t/2;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, t), [dark, dark, dark, dark, dark, backMat]); back.position.z = -D/2 + t/2;
  const spine = new THREE.Mesh(new THREE.BoxGeometry(t, H, D), [spineMat, dark, dark, dark, dark, dark]); spine.position.x = W/2 - t/2;
  const pages = new THREE.Mesh(new THREE.BoxGeometry(W - .08, H - .08, D - 2*t), [pageMat, pageMat, pageMatH, pageMatH, pageMat, pageMat]); pages.position.x = -.02;
  book.add(front, back, spine, pages); scene.add(book);

  const idleY = -.42, idleX = .08;
  let rotY = -1.6, rotX = .2, tY = idleY, tX = idleX, dragging = false, lastX = 0, lastY = 0, moved = 0, spinV = 0;
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function hitCover(e){
    const r = host.getBoundingClientRect(); ptr.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1);
    ray.setFromCamera(ptr, camera); const h = ray.intersectObject(front)[0];
    if (h && h.face && h.face.materialIndex === 4 && h.uv){ drops.push({x:h.uv.x*TW, y:(1 - h.uv.y)*TH, t:performance.now()}); return true; } return false;
  }
  host.addEventListener('pointerdown', e => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; host.classList.add('dragging'); host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', e => {
    if (dragging){ const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      tY += dx*.012; tX = Math.max(-.5, Math.min(.5, tX + dy*.006)); spinV = dx*.012; }
    else if (e.pointerType === 'mouse' && !reduce){ const r = host.getBoundingClientRect();
      tY = idleY + ((e.clientX - r.left)/r.width - .5)*.5; tX = idleX + ((e.clientY - r.top)/r.height - .5)*.3; }
  });
  const end = e => { if (!dragging) return; dragging = false; host.classList.remove('dragging'); if (moved < 6 && hitCover(e)) $('bookHint').style.opacity = .35; };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
  host.addEventListener('pointerleave', () => { if (!dragging){ tY = idleY; tX = idleX; } });

  function size(){ const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); }
  size(); addEventListener('resize', size);
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was && !reduce) requestAnimationFrame(loop); }).observe(host);

  function frame(now){
    drawCover(now); coverTex.needsUpdate = true;
    if (!dragging){ if (Math.abs(spinV) > .001){ tY += spinV; spinV *= .92; }
      else { const k = Math.round((tY - idleY) / (Math.PI*2)); tY += ((idleY + k*Math.PI*2) - tY) * .02; } }
    rotY += (tY - rotY)*.08; rotX += (tX - rotX)*.08;
    book.rotation.set(rotX, rotY, reduce ? 0 : Math.sin(now/2600)*.025);
    book.position.y = reduce ? 0 : Math.sin(now/1100)*.07;
    renderer.render(scene, camera);
  }
  function loop(now){ if (!visible) return; frame(now); requestAnimationFrame(loop); }
  if (reduce){ rotY = idleY; rotX = idleX; frame(2500); host.addEventListener('pointermove', () => frame(performance.now())); }
  else requestAnimationFrame(loop);

  if (document.fonts) document.fonts.ready.then(() => {
    backTex = makeTex(TW, TH, paintBack); spineTex = makeTex(128, TH, paintSpine);
    backMat.map = backMat.emissiveMap = backTex; spineMat.map = spineMat.emissiveMap = spineTex;
    backMat.needsUpdate = spineMat.needsUpdate = true; if (reduce) frame(2500);
  });
})();
