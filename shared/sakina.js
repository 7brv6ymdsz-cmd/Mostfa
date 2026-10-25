// Sakina reel engine: the shared raymarched sea (world.frag) plus everything every reel draws the same way —
// type helpers, word-timed captions, the book + CTA, the end card, rain, bloom, grain and the render loop.
// A reel page defines a REEL object (timing cues, camera/world per frame, its own overlays) and calls Sakina.start(REEL).
(function(){
const W = 1080, H = 1920, CX = W / 2;
const COL = { night:'#091214', moon:'#EDE6D6', muted:'#9DAEA8', faint:'#6E817B', amber:'#E0AE6A' };
const F = { display:'"Aref Ruqaa"', read:'"Amiri"', ui:'"Plex"' };
const moonA = a => `rgba(237,230,214,${a})`, amberA = a => `rgba(224,174,106,${a})`;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k, seg = (t, a, b) => clamp((t - a) / (b - a));
const eOutExpo = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k), eInExpo = k => k <= 0 ? 0 : Math.pow(2, 10 * k - 10);
const eInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eSine = k => -(Math.cos(Math.PI * k) - 1) / 2, eOutCubic = k => 1 - Math.pow(1 - k, 3);
const eOutBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const TAU = Math.PI * 2;
function hash(a, b = 0){ let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function layer(w = W, h = H){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

const G = document.createElement('canvas'); G.width = W; G.height = H;
const C = document.getElementById('c'); C.width = W; C.height = H; const X = C.getContext('2d');
const [BL, bl] = layer(W / 4, H / 4);
let gl, U;
function initGL(frag){
  gl = G.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0,1);}'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const cache = {}; U = n => cache[n] ?? (cache[n] = gl.getUniformLocation(prog, n));
}
// world state defaults; a reel's world(t) overrides what it needs
function defaults(){ return { wt: 0, storm: 0, sat: 0, warm: 0, light: 0, ro: [0, 2, 0], ta: [0, 2, 10], roll: 0, cover: 1, moon: 1, ripT: -1, ripC: [0, 0], orb: [0, 0, 0, 0], orbC: [1, .72, .38] }; }
function drawGL(t, s){
  gl.viewport(0, 0, W, H);
  gl.uniform2f(U('uRes'), W, H); gl.uniform3f(U('uRo'), ...s.ro); gl.uniform3f(U('uTa'), ...s.ta); gl.uniform3f(U('uOrbC'), ...s.orbC);
  gl.uniform1f(U('uWt'), s.wt); gl.uniform1f(U('uStorm'), s.storm); gl.uniform1f(U('uLight'), s.light); gl.uniform1f(U('uCover'), s.cover);
  gl.uniform1f(U('uMoon'), s.moon); gl.uniform1f(U('uRipT'), s.ripT); gl.uniform2f(U('uRipC'), ...s.ripC); gl.uniform1f(U('uSat'), s.sat);
  gl.uniform1f(U('uTime'), t); gl.uniform1f(U('uRoll'), s.roll); gl.uniform4f(U('uOrb'), ...s.orb); gl.uniform1f(U('uWarm'), s.warm);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const MOON = norm([0, .30, 1]);
function project(s, p, isDir){
  const ro = s.ro, f = norm(sub(s.ta, ro)), r = norm(cross([0, 1, 0], f)), u = cross(f, r);
  const d = isDir ? p : sub(p, ro); const z = dot(d, f); if (z <= 0) return null;
  let x = dot(d, r) / z * 1.25, y = dot(d, u) / z * 1.25;
  const c = Math.cos(-s.roll), sn = Math.sin(-s.roll); [x, y] = [c * x - sn * y, sn * x + c * y];
  return [CX + x * H, H / 2 - y * H, z];
}
// the shader's swell without its fine noise, for things that float on the water
function waveH(x, z, s, w){
  const w1 = 1 - Math.abs(Math.sin((x * .24 + z * .97) * .26 + w * .9)), w2 = 1 - Math.abs(Math.sin((-x * .7 + z * .71) * .43 + w * 1.25));
  return s * (1.7 * Math.pow(w1, 2.6) + .85 * Math.pow(w2, 2.6) + .22 * Math.sin((x * .92 + z * .38) * .95 + w * 1.9) + .1 * Math.sin((-x * .2 + z * .98) * 1.8 + w * 2.6));
}

function txt(c, s, x, y, size, fam, color, o = {}){
  c.save(); c.font = `${o.w || 400} ${size}px ${fam}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.direction = o.dir || 'rtl';
  c.globalAlpha = o.a ?? 1; if (o.glow){ c.shadowColor = o.glowC || color; c.shadowBlur = o.glow; }
  c.fillStyle = color; c.fillText(s, x, y); c.restore();
}
function measure(s, size, fam, w = 400){ X.save(); X.font = `${w} ${size}px ${fam}`; const m = X.measureText(s).width; X.restore(); return m; }
function title(c, s, y, size, p, out, o = {}){
  if (p <= 0 || out <= 0) return;
  const e = eOutCubic(clamp(p)); c.save(); c.filter = `blur(${(1 - e) * 16}px)`;
  txt(c, s, o.x ?? CX, y + (1 - e) * 40, size, o.fam || F.display, o.col || COL.moon, { w: o.w || 700, a: e * out, glow: o.glow ?? 40, glowC: o.glowC || moonA(.35) });
  c.restore();
}

// ── timeline ──
const S = { TM: null, LS: [], LE: [], K: {}, ZT: null, WT: null, T_END: 30 };
const DT = 1 / 240;
function wordAt(line, prefix){ const w = S.TM.words.find(w => w.line === line && w.w.replace(/[^ء-ي]/g, '').startsWith(prefix)); return w ? w.s : S.LS[line]; }
function integrate(vel, wrate){ const n = Math.ceil(S.T_END / DT) + 2; S.ZT = new Float64Array(n); S.WT = new Float64Array(n);
  for (let i = 1; i < n; i++){ const t = (i - .5) * DT; S.ZT[i] = S.ZT[i - 1] + vel(t) * DT; S.WT[i] = S.WT[i - 1] + wrate(t) * DT; } }
const look = (A, t) => { const x = clamp(t, 0, S.T_END) / DT, i = Math.floor(x), f = x - i; return lerp(A[i], A[Math.min(i + 1, A.length - 1)], f); };
const zAt = t => look(S.ZT, t), wtAt = t => look(S.WT, t);

// ── shared pieces ──
const RAIN = Array.from({ length: 320 }, (_, i) => ({ x: hash(i, 1) * W * 1.3 - W * .15, y: hash(i, 2), sp: .8 + hash(i, 3) * .7, l: 40 + hash(i, 4) * 90, a: .12 + hash(i, 5) * .3, d: hash(i, 6) }));
function rain(c, s, amt, up = false){
  if (amt <= .01) return; c.save(); c.lineCap = 'round';
  for (const r of RAIN){ const y = (((r.y + s.wt * 1.6 * r.sp) % 1 + 1) % 1) * (H + 300) - 150, x = r.x - (y / H) * 260 * r.sp;
    c.strokeStyle = moonA(r.a * amt); c.lineWidth = 1.2 + r.d * 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - r.l * .27, y + r.l * (up ? -1 : 1)); c.stroke(); }
  c.restore();
}
const THOUGHTS = ['لماذا قلتُ ذلك', 'ماذا لو', 'متأخر', 'يجب', 'غداً', 'لم يحدث', 'كان عليّ', 'لا وقت', 'الكل ينتظر', 'هل أخطأت؟', 'قلق', 'مرة أخرى', 'ماذا يظنون', 'لم أنم', 'الفاتورة', 'لم يرد', 'ربما'];
function thoughts(c, t, a0, a1, cy = 860, n = 24){
  if (t < a0 || t > a1 + 1.3) return;
  for (let i = 0; i < n; i++){
    const st = a0 + hash(i, 9) * Math.max(.1, a1 - a0 - .2), k = (t - st) / 1.3; if (k < 0 || k > 1) continue;
    const z = lerp(1, .2, k), x = CX + (hash(i, 10) - .5) * W * .9 / z * .5, y = cy + (hash(i, 11) - .5) * H * .55 / z * .5, sz = 40 / z;
    if (sz > 200) continue;
    c.save(); c.filter = `blur(${Math.max(0, (k - .55) * 30)}px)`;
    txt(c, THOUGHTS[i % THOUGHTS.length], x, y, sz, F.ui, i % 5 ? COL.moon : COL.amber, { w: 600, a: Math.sin(Math.PI * k) * .85 }); c.restore();
  }
}
const [COVER, cvc] = layer(560, 820), [COVER2, cv2] = layer(560, 820);
function paintCover(){
  const w = 560, h = 820, g = cvc.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#16302F'); g.addColorStop(1, '#081314');
  cvc.fillStyle = g; cvc.fillRect(0, 0, w, h);
  const r = rng(77); for (let i = 0; i < 140; i++){ cvc.fillStyle = moonA(r() * .5); cvc.beginPath(); cvc.arc(r() * w, r() * h * .55, r() * 1.3 + .2, 0, TAU); cvc.fill(); }
  cvc.strokeStyle = amberA(.55); cvc.lineWidth = 1.5; cvc.strokeRect(28, 28, w - 56, h - 56);
  const mg = cvc.createRadialGradient(w / 2, 230, 0, w / 2, 230, 220); mg.addColorStop(0, moonA(.35)); mg.addColorStop(1, moonA(0)); cvc.fillStyle = mg; cvc.fillRect(0, 0, w, h);
  cvc.fillStyle = '#F2ECDF'; cvc.beginPath(); cvc.arc(w / 2, 230, 58, 0, TAU); cvc.fill();
  txt(cvc, 'سَكينة', w / 2, 440, 150, F.display, COL.moon, { w: 700 });
  txt(cvc, 'رحلة العودة إلى الداخل', w / 2, 528, 32, F.read, COL.muted);
  txt(cvc, 'اثنا عشر باباً', w / 2, 730, 22, F.ui, COL.amber, { w: 500 });
}
function drawBook(c, cx, cy, th, sweep, sc, a){
  const cw = 560, ch = 820, T = 70, D = 1800;
  cv2.clearRect(0, 0, cw, ch); cv2.drawImage(COVER, 0, 0);
  if (sweep > 0 && sweep < 1){ const x = lerp(-300, cw + 300, sweep), g = cv2.createLinearGradient(x - 160, 0, x + 160, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,245,225,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    cv2.save(); cv2.globalCompositeOperation = 'lighter'; cv2.fillStyle = g; cv2.fillRect(0, 0, cw, ch); cv2.restore(); }
  c.save(); c.globalAlpha = a; c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
  const P = (xl, zl, yl) => { const xr = xl * Math.cos(th) + zl * Math.sin(th), zr = -xl * Math.sin(th) + zl * Math.cos(th), f = D / (D + zr); return [cx + xr * f, cy + yl * f, f]; };
  c.save(); c.filter = 'blur(40px)'; c.fillStyle = 'rgba(0,0,0,.7)'; c.beginPath(); c.ellipse(cx + 30, cy + ch / 2 + 40, cw * .6, 50, 0, 0, TAU); c.fill(); c.restore();
  const A = P(cw / 2, 0, -ch / 2), B = P(cw / 2, T, -ch / 2), Dd = P(cw / 2, T, ch / 2), E = P(cw / 2, 0, ch / 2);
  c.fillStyle = '#071314'; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(Dd[0], Dd[1]); c.lineTo(E[0], E[1]); c.closePath(); c.fill();
  const N = 120; for (let k = 0; k < N; k++){ const p0 = P(lerp(-cw / 2, cw / 2, k / N), 0, -ch / 2), p1 = P(lerp(-cw / 2, cw / 2, (k + 1) / N), 0, -ch / 2), hh = ch * p0[2];
    c.drawImage(COVER2, k / N * cw, 0, cw / N + .6, ch, p0[0], cy - hh / 2, p1[0] - p0[0] + .6, hh); }
  c.strokeStyle = moonA(.35); c.lineWidth = 2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(E[0], E[1]); c.stroke();
  c.restore();
}
// book scene: o = { start, cta, end, link, label }
function book(c, t, o){
  const bk = seg(t, o.start - .25, o.start + .6) * (1 - seg(t, o.end - .25, o.end + .25)); if (bk <= 0) return;
  bl.filter = 'blur(3px)'; bl.drawImage(C, 0, 0, W / 4, H / 4); bl.filter = 'none';
  c.save(); c.globalAlpha = eSine(bk); c.imageSmoothingQuality = 'high'; c.drawImage(BL, 0, 0, W, H); c.fillStyle = 'rgba(5,10,12,.45)'; c.fillRect(0, 0, W, H); c.restore();
  const en = eOutExpo(seg(t, o.start - .1, o.start + 1.3)), cta = eInOut(seg(t, o.cta - .2, o.cta + .5));
  drawBook(c, CX, lerp(lerp(860, 740, en), 700, cta), lerp(1.1, .32, en) + Math.sin(t * 1.1) * .05, seg(t, o.start + .6, o.start + 1.8), lerp(.94, .74, cta), bk);
  if (o.label) txt(c, o.label, CX, 1225, 40, F.ui, COL.amber, { w: 600, a: bk * seg(t, o.start + .4, o.start + .9) * (1 - cta) });
  const bp = eOutBack(seg(t, o.cta, o.cta + .4));
  if (bp > 0){ const label = 'اقرأ المقدّمة مجاناً', w = measure(label, 56, F.ui, 600) + 130, hh = 120, y = 1125;
    c.save(); c.globalAlpha = bk; c.translate(CX, y); c.scale(bp, bp);
    c.shadowColor = amberA(.5); c.shadowBlur = 50; c.fillStyle = COL.amber; c.beginPath(); c.roundRect(-w / 2, -hh / 2, w, hh, hh / 2); c.fill(); c.shadowBlur = 0;
    const sw = seg(t, o.cta + .5, o.cta + 1.2); if (sw > 0 && sw < 1){ c.clip(); const sx = lerp(w, -w, sw), g = c.createLinearGradient(sx - 80, 0, sx + 80, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-w / 2, -hh / 2, w, hh); }
    c.restore(); txt(c, label, CX, y + 4, 56 * bp, F.ui, '#1A1208', { w: 600, a: bk }); }
  const lb = eOutCubic(seg(t, o.link - .05, o.link + .35));
  if (lb > 0){ const bob = Math.sin(t * 7) * 10; c.save(); c.globalAlpha = lb * bk; c.strokeStyle = COL.moon; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(CX, 245 + bob); c.lineTo(CX, 150 + bob); c.moveTo(CX - 36, 186 + bob); c.lineTo(CX, 150 + bob); c.lineTo(CX + 36, 186 + bob); c.stroke(); c.restore();
    txt(c, 'الرابط في البايو', CX, 300 + bob * .3, 46, F.ui, COL.moon, { w: 600, a: lb * bk }); }
}
function endCard(c, t, at){
  const ec = eOutCubic(seg(t, at, at + .8)); if (ec <= 0) return;
  c.fillStyle = `rgba(5,10,12,${.55 * ec})`; c.fillRect(0, 0, W, H);
  title(c, 'سَكينة', 780, 240, ec, 1, { glow: 50, glowC: moonA(.5) });
  txt(c, 'رحلة العودة إلى الداخل', CX, 940, 52, F.read, COL.muted, { a: ec });
  txt(c, 'المقدّمة مجانية · الرابط في البايو', CX, 1060, 40, F.ui, COL.amber, { w: 500, a: seg(t, at + .4, at + .9) });
}
// word-timed captions: the line is soft, spoken words brighten, the current word is amber
function captions(c, t, o = {}){
  const line = S.TM.lines.find(l => t >= l.s - .15 && t < l.e + .45 + (o.hold?.[l.i] || 0)); if (!line || (o.hide && o.hide.includes(line.i)) || t > (o.until ?? 1e9)) return;
  const ws = S.TM.words.filter(w => w.line === line.i), size = 72, sp = size * .34;
  const inn = line.i === 0 ? 1 : eOutCubic(seg(t, line.s - .1, line.s + .2)), out = 1 - seg(t, line.e + .25 + (o.hold?.[line.i] || 0), line.e + .45 + (o.hold?.[line.i] || 0));
  const rows = [[]]; let rw = 0; for (const w of ws){ const m = measure(w.w, size, F.ui, 600); if (rw + m > 900 && rows[rows.length - 1].length){ rows.push([]); rw = 0; } rows[rows.length - 1].push({ ...w, m }); rw += m + sp; }
  const y0 = (o.y || 1440) - (rows.length - 1) * size * .65;
  rows.forEach((row, ri) => { const tw = row.reduce((a, w) => a + w.m, 0) + sp * (row.length - 1); let x = CX + tw / 2;
    row.forEach(w => { const said = t >= w.s - .04, on = said && t < w.e + .05, k = eOutCubic(seg(t, w.s - .04, w.s + .16));
      c.save(); c.globalAlpha = inn * out; c.translate(x - w.m / 2, y0 + ri * size * 1.3 + (1 - inn) * 20 - k * 4);
      c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 26;
      txt(c, w.w, 0, 0, size, F.ui, on ? COL.amber : said ? COL.moon : moonA(.38), { w: 600 });
      c.restore(); x -= w.m + sp; }); });
}
const GRAIN = Array.from({ length: 6 }, (_, k) => { const [c, g] = layer(256, 256); const d = g.createImageData(256, 256); const r = rng(100 + k);
  for (let i = 0; i < d.data.length; i += 4){ const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });

let REEL;
function render(t){
  const s = Object.assign(defaults(), REEL.world(t));
  drawGL(t, s);
  X.setTransform(1, 0, 0, 1, 0, 0); X.filter = 'none'; X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
  X.drawImage(G, 0, 0);
  bl.clearRect(0, 0, W / 4, H / 4); bl.filter = 'contrast(2.6) brightness(.85) blur(12px)'; bl.drawImage(G, 0, 0, W / 4, H / 4); bl.filter = 'none';
  X.save(); X.globalCompositeOperation = 'screen'; X.globalAlpha = .55; X.drawImage(BL, 0, 0, W, H); X.restore();
  const mp = project(s, MOON, true), vis = 1 - Math.min(1, s.storm);
  if (mp && vis > .3 && mp[1] > -50 && mp[1] < H){ const g = X.createLinearGradient(mp[0] - 520, 0, mp[0] + 520, 0);
    g.addColorStop(0, 'rgba(180,210,230,0)'); g.addColorStop(.5, `rgba(200,225,240,${.3 * (vis - .3)})`); g.addColorStop(1, 'rgba(180,210,230,0)');
    X.save(); X.globalCompositeOperation = 'screen'; X.fillStyle = g; X.fillRect(mp[0] - 520, mp[1] - 2, 1040, 4); X.restore(); }
  if (s.orb[3] > 0){ const op = project(s, s.orb.slice(0, 3), false); if (op){ const g = X.createLinearGradient(op[0] - 280, 0, op[0] + 280, 0);
    g.addColorStop(0, 'rgba(224,174,106,0)'); g.addColorStop(.5, `rgba(240,190,120,${.28 * Math.min(1.2, s.orb[3])})`); g.addColorStop(1, 'rgba(224,174,106,0)');
    X.save(); X.globalCompositeOperation = 'screen'; X.fillStyle = g; X.fillRect(op[0] - 280, op[1] - 2, 560, 4); X.restore(); } }
  REEL.overlays(X, t, s);
  if (REEL.before) REEL.before(X, t, s);
  captions(X, t, REEL.captions || {});
  if (REEL.after) REEL.after(X, t, s);
  if (s.light > .05){ X.fillStyle = `rgba(210,225,255,${Math.min(.35, s.light * .2)})`; X.fillRect(0, 0, W, H); }
  const v = X.createRadialGradient(CX, H / 2, H * .28, CX, H / 2, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${.55 + (s.vig || 0)})`); X.fillStyle = v; X.fillRect(0, 0, W, H);
  const f = Math.floor(t * 30); X.save(); X.globalCompositeOperation = 'overlay'; X.globalAlpha = .08; X.fillStyle = X.createPattern(GRAIN[f % 6], 'repeat');
  X.translate(-hash(f, 1) * 256, -hash(f, 2) * 256); X.fillRect(0, 0, W + 256, H + 256); X.restore();
  X.fillStyle = moonA(.12); X.fillRect(0, 0, W, 6); X.fillStyle = COL.amber; X.fillRect(W - W * t / S.T_END, 0, W * t / S.T_END, 6);
  const fo = seg(t, S.T_END - .35, S.T_END); if (fo > 0){ X.fillStyle = `rgba(0,0,0,${fo})`; X.fillRect(0, 0, W, H); }
}
function start(reel){
  REEL = reel; S.T_END = reel.T_END;
  window.render = render; window.T_END = reel.T_END;
  window.ready = (async () => {
    const [tm, frag] = await Promise.all([fetch('timing.json').then(r => r.json()), fetch('../shared/world.frag').then(r => r.text())]);
    S.TM = tm; S.LS = tm.lines.map(l => l.s); S.LE = tm.lines.map(l => l.e);
    initGL(frag); reel.cues(S); integrate(reel.vel || (() => 1), reel.wrate || (() => 1));
    await Promise.all(['700 40px "Aref Ruqaa"', '400 40px "Amiri"', '500 40px "Plex"', '600 40px "Plex"'].map(f => document.fonts.load(f, 'سكينة')));
    paintCover(); if (reel.init) reel.init(S); render(0); return true;
  })();
  if (!location.search.includes('render')){ const t0 = performance.now(); window.ready.then(function loop(){ render(((performance.now() - t0) / 1000) % reel.T_END); requestAnimationFrame(loop); }); }
}
window.Sakina = { W, H, CX, COL, F, moonA, amberA, clamp, lerp, seg, eOutExpo, eInExpo, eInOut, eSine, eOutCubic, eOutBack, TAU, hash, rng, layer, AR,
  txt, measure, title, project, waveH, MOON, wordAt, zAt, wtAt, rain, thoughts, book, endCard, captions, drawBook, S, start, X, C };
})();
