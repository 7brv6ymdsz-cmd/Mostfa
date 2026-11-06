// Sakina 3D book (public preview). Three.js r160 (MIT) and GSAP 3.12.5 are served from ./vendor.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const gsap = window.gsap;
const LESSONS = JSON.parse(document.getElementById('lessons').textContent);
const N = LESSONS.length;
const $ = s => document.querySelector(s);
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;

// ---------- saved progress (per viewer, optional) ----------
const KEY = 'sakina-book-preview';
let saved = { answers: {}, stamps: {}, last: 0 };
try { saved = Object.assign(saved, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {} };

// ---------- preferences ----------
const mq = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = mq.matches, highContrast = false;
const D = s => reduced ? 0 : s;   // durations collapse to zero when motion is reduced

// ---------- renderer, scene, camera ----------
const canvas = $('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const MAXANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#241a14');
const camera = new THREE.PerspectiveCamera(38, 1, 0.03, 40);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 0.4, maxDistance: 9, minPolarAngle: 0.1, maxPolarAngle: 1.22, screenSpacePanning: false, rotateSpeed: 0.6, zoomSpeed: 0.9, panSpeed: 0.8 });
controls.addEventListener('change', () => {
  const t = controls.target;
  t.x = clamp(t.x, -1.35, 1.35); t.y = clamp(t.y, 0, 0.5); t.z = clamp(t.z, -1, 1);
  if (camera.position.y < 0.2) camera.position.y = 0.2;
});

// ---------- light: warm sun through window blinds, soft sky fill ----------
scene.add(new THREE.HemisphereLight('#fff3e2', '#3b2c21', 1.25));
const SUN = new THREE.Vector3(2.6, 4.4, 1.8);
const sun = new THREE.DirectionalLight('#ffe0b5', 1.7);
sun.position.copy(SUN); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 0.5, far: 12 });
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
scene.add(sun);
const fill = new THREE.DirectionalLight('#c9dcff', 0.35); fill.position.set(-2, 3, -1.5); scene.add(fill);
// invisible slats between the sun and the desk: they only cast the striped shadow (kept off the printed pages so the text stays clear)
const blinds = new THREE.Group(); scene.add(blinds);
{
  const d = SUN.clone().normalize(), a = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize(), b = new THREE.Vector3().crossVectors(a, d).normalize();
  const m = new THREE.Matrix4().makeBasis(a, d, b), q = new THREE.Quaternion().setFromRotationMatrix(m);
  const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.01, 0.075), mat);
    s.quaternion.copy(q); s.position.copy(d).multiplyScalar(2.1).addScaledVector(b, (i - 1) * 0.13).addScaledVector(a, -0.45);
    s.castShadow = true; blinds.add(s);
  }
}

// ---------- procedural textures ----------
function canvasTex(c, repeat) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANISO;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function deskTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'), r = rnd(7);
  const g = x.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, '#5c4332'); g.addColorStop(.5, '#664a37'); g.addColorStop(1, '#5a4030');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 520; i++) { const y0 = r() * 1024; x.strokeStyle = `rgba(${r() < .5 ? '40,26,18' : '120,90,66'},${.05 + r() * .09})`; x.lineWidth = .6 + r() * 1.6; x.beginPath(); for (let px = 0; px <= 1024; px += 32) x.lineTo(px, y0 + Math.sin(px / 140 + i) * 6 + Math.sin(px / 41 + i * 3) * 1.5); x.stroke(); }
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,240,220'},${r() * .05})`; x.fillRect(r() * 1024, r() * 1024, 1.4, 1.4); }
  return canvasTex(c, 3);
}
function clothTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), r = rnd(3);
  x.fillStyle = '#c99442'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) { x.fillStyle = `rgba(90,55,15,${.05 + r() * .05})`; x.fillRect(0, i, 256, 1); x.fillStyle = `rgba(255,235,190,${.04 + r() * .04})`; x.fillRect(i, 0, 1, 256); }
  return canvasTex(c, 5);
}
function edgeTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'), r = rnd(11);
  x.fillStyle = '#efe5d2'; x.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 256; i += 2) { x.fillStyle = `rgba(110,90,60,${.08 + r() * .14})`; x.fillRect(0, i, 64, 1); }
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 4); return t;
}
const PW = 1400, PH = 1960;
function paperCanvas(spineOnRight) {
  const c = document.createElement('canvas'); c.width = PW; c.height = PH; const x = c.getContext('2d'), r = rnd(spineOnRight ? 21 : 33);
  x.fillStyle = '#f6efe1'; x.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 14000; i++) { x.fillStyle = `rgba(${r() < .6 ? '120,100,70' : '255,255,255'},${r() * .045})`; const w = 1 + r() * 3; x.fillRect(r() * PW, r() * PH, w, 1); }
  const g = spineOnRight ? x.createLinearGradient(PW, 0, PW * .8, 0) : x.createLinearGradient(0, 0, PW * .2, 0);
  g.addColorStop(0, 'rgba(110,80,45,.28)'); g.addColorStop(1, 'rgba(110,80,45,0)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  return c;
}
const PAPER_L = paperCanvas(true), PAPER_R = paperCanvas(false);

// CSS grain overlay
{
  const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d'), r = rnd(5), img = x.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - .5) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

// ---------- desk and book ----------
const desk = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: deskTexture(), roughness: .93, metalness: 0 }));
desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

const PAGE_Y = 0.0855;
function pageY(u) { const k = Math.min(u / 0.22, 1), s = k * k * (3 - 2 * k); return 0.05 + (PAGE_Y - 0.05) * s; }
function pageGeometry(side) {
  const g = new THREE.PlaneGeometry(1, 1.4, 56, 1); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const wx = p.getX(i) + (side > 0 ? 0.5 : -0.5); p.setX(i, wx); p.setY(i, pageY(Math.abs(wx))); }
  g.computeVertexNormals(); return g;
}
const book = new THREE.Group(); scene.add(book);
{
  const cloth = new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: .85, color: '#ffffff' });
  for (const s of [-1, 1]) {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.024, 1.52), cloth); cover.position.set(s * 0.555, 0.012, 0); cover.castShadow = cover.receiveShadow = true; book.add(cover);
    const edge = new THREE.MeshStandardMaterial({ map: edgeTexture(), roughness: .9 }), top = new THREE.MeshStandardMaterial({ color: '#efe4d0', roughness: .9 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.054, 1.42), [edge, edge, top, top, edge, edge]); block.position.set(s * 0.6, 0.051, 0); block.castShadow = block.receiveShadow = true; book.add(block);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.52, 16), cloth); spine.rotation.x = Math.PI / 2; spine.position.set(0, 0.004, 0); book.add(spine);
  // blue ribbon from the gutter over the bottom edge onto the desk
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.004, 0.053, -0.25), new THREE.Vector3(0.008, 0.052, 0.4), new THREE.Vector3(0.012, 0.05, 0.69), new THREE.Vector3(0.02, 0.028, 0.75), new THREE.Vector3(0.034, 0.004, 0.8), new THREE.Vector3(0.06, 0.002, 0.95), new THREE.Vector3(0.1, 0.002, 1.04)]);
  const pts = curve.getPoints(60), pos = [], idx = [];
  pts.forEach((p, i) => { const tw = Math.sin(i / 60 * Math.PI) * 0.15; pos.push(p.x - 0.016, p.y + tw * 0.01, p.z, p.x + 0.016, p.y - tw * 0.01, p.z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  const ribbon = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#2d5b8c', roughness: .75, side: THREE.DoubleSide })); ribbon.castShadow = true; book.add(ribbon);
}
const textCanvas = document.createElement('canvas'); textCanvas.width = PW; textCanvas.height = PH;
const diagCanvas = document.createElement('canvas'); diagCanvas.width = PW; diagCanvas.height = PH;
const textTex = canvasTex(textCanvas), diagTex = canvasTex(diagCanvas);
const rightPage = new THREE.Mesh(pageGeometry(1), new THREE.MeshStandardMaterial({ map: textTex, roughness: .92 }));
const leftPage = new THREE.Mesh(pageGeometry(-1), new THREE.MeshStandardMaterial({ map: diagTex, roughness: .92 }));
rightPage.receiveShadow = leftPage.receiveShadow = true;
rightPage.userData.page = 'text'; leftPage.userData.page = 'diag';
book.add(rightPage, leftPage);

// ---------- ink materials: paper fill, cross-hatching from light, black outlines ----------
const U_INK = { value: new THREE.Color('#231b14') }, U_LIGHT = { value: SUN.clone().normalize() };
const VS = `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const FS = `uniform vec3 uPaper, uFill, uInk, uLight; uniform float uFillAmt, uGlow, uOpacity; varying vec3 vN;
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float l = max(dot(n, normalize(uLight)), 0.0), tone = 0.3 + 0.7 * l;
  vec3 base = mix(uPaper, uFill, uFillAmt);
  float a = fract((gl_FragCoord.x + gl_FragCoord.y) * 0.17), b = fract((gl_FragCoord.x - gl_FragCoord.y) * 0.17);
  float h = 0.0; if (tone < 0.62) h = max(h, step(0.8, a)); if (tone < 0.42) h = max(h, step(0.8, b));
  h *= 1.0 - uFillAmt * 0.8;
  vec3 c = base * (0.82 + 0.18 * tone);
  c = mix(c, uInk, h * 0.7) + uFill * uGlow * 0.55;
  gl_FragColor = vec4(c, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function inkMat({ paper = '#f4ecdd', fill = '#e2a24c', opacity = 1, fillAmt = 0 } = {}) {
  return new THREE.ShaderMaterial({ uniforms: { uPaper: { value: new THREE.Color(paper) }, uFill: { value: new THREE.Color(fill) }, uFillAmt: { value: fillAmt }, uGlow: { value: 0 }, uOpacity: { value: opacity }, uInk: U_INK, uLight: U_LIGHT },
    vertexShader: VS, fragmentShader: FS, transparent: opacity < 1, depthWrite: opacity >= 1, side: THREE.DoubleSide });
}
const OUT_MAT = new THREE.ShaderMaterial({ uniforms: { uInk: U_INK, uW: { value: 0.0042 } }, side: THREE.BackSide,
  vertexShader: `uniform float uW; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uW, 1.0); }`,
  fragmentShader: `uniform vec3 uInk;
void main(){ gl_FragColor = vec4(uInk, 1.0);
#include <colorspace_fragment>
}` });
const LINE_MAT = new THREE.LineBasicMaterial({ color: '#231b14' });
function ink(geo, o = {}) {
  const m = new THREE.Mesh(geo, inkMat(o)), glass = (o.opacity ?? 1) < 1;
  m.castShadow = !glass && o.shadow !== false;
  if (!glass && o.hull !== false) { const h = new THREE.Mesh(geo, OUT_MAT); h.raycast = () => {}; m.add(h); }
  if (o.edges !== false) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, o.edgeAngle ?? 28), LINE_MAT); e.raycast = () => {}; m.add(e); }
  return m;
}
const U = m => m.material.uniforms;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
const cyl = (rt, rb, h, seg = 24, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open).translate(0, h / 2, 0);
const at = (px, pz, y = 0) => new THREE.Vector3(-1 + px, y, -0.7 + pz * 1.4);
function hit(obj, id) { obj.traverse(c => { if (c.isMesh && c.material !== OUT_MAT) c.userData.hit = id; }); }
function glowSprite(color = '#ffcf80', size = .2) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(c), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); s.raycast = () => {}; return s;
}
function textSprite(text, { h = 0.045, color = '#231b14', bg = 'rgba(251,246,236,.94)', font = '700 64px "Amiri"' } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), tex = canvasTex(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.raycast = () => {};
  s.setText = t => { x.font = font; const w = Math.ceil(x.measureText(t).width) + 56; c.width = w; c.height = 100; x.font = font; x.direction = 'rtl';
    if (bg) { x.fillStyle = bg; x.beginPath(); x.roundRect(2, 2, w - 4, 96, 48); x.fill(); x.strokeStyle = color; x.lineWidth = 3; x.stroke(); }
    x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, w / 2, 54); tex.needsUpdate = true; s.scale.set(h * w / 100, h, 1); };
  s.setText(text); return s;
}

// short-lived sparks for feedback
const sparks = [];
function burst(world, color = '#f0b45a', n = 26) {
  n = reduced ? 8 : n;
  const g = new THREE.BufferGeometry(), arr = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { arr.set([world.x, world.y, world.z], i * 3); vel.push(new THREE.Vector3((Math.random() - .5) * .3, .12 + Math.random() * .3, (Math.random() - .5) * .3)); }
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size: .018, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.raycast = () => {}; scene.add(p); sparks.push({ p, vel, life: 0 });
}

// ---------- the twelve pop-up scenes (page coords: px 0 outer edge → 1 spine, pz 0 top → 1 bottom) ----------
const SCENES = {
  jar: {
    name: 'جرّة الانتباه',
    labels: [['أفكار تدور', .12, .2, .3, .36], ['جرّة الانتباه', .1, .82, .3, .62], ['مقبض الضجيج', .72, .9, .7, .7]],
    markers: [[1, .5, .74], [2, .84, .58]], shadows: [[.36, .56, .12, .09], [.7, .66, .08, .06]], focus: { A: [.36, .56, .18], B: [.7, .66, .05] },
    build(g) {
      const P = at(.36, .56), jar = ink(cyl(.11, .1, .24, 36, true), { opacity: .45, fill: '#e9b25c' });
      jar.position.copy(P); g.add(jar);
      const base = ink(cyl(.1, .1, .012, 36)); base.position.copy(P); g.add(base);
      const rim = ink(new THREE.TorusGeometry(.11, .006, 8, 48).rotateX(Math.PI / 2)); rim.position.copy(P).setY(.24); g.add(rim);
      [jar, base, rim].forEach(m => hit(m, 'A'));
      const cubes = [];
      for (let i = 0; i < 16; i++) { const c = ink(box(.032, .032, .032), { fill: '#e2a24c' }); c.userData = { ph: Math.random() * 6.28, r: .13 + Math.random() * .14, sp: .6 + Math.random() * 1.2, h: .3 + Math.random() * .16, tilt: Math.random() * 6.28 }; g.add(c); cubes.push(c); hit(c, 'A'); }
      const K = at(.7, .66), knobG = new THREE.Group(); knobG.position.copy(K); g.add(knobG);
      knobG.add(ink(cyl(.075, .075, .012, 36)));
      const rot = new THREE.Group(); rot.position.y = .012; knobG.add(rot);
      rot.add(ink(cyl(.048, .054, .045, 28))); const ptr = ink(box(.012, .01, .045), { fillAmt: 1 }); ptr.position.set(0, .045, -.025); rot.add(ptr);
      hit(knobG, 'B');
      const st = { settle: 0, chaos: 1 }, o = new THREE.Vector3(), s = new THREE.Vector3();
      return {
        update(t) {
          cubes.forEach((c, i) => { const d = c.userData, a = d.ph + t * d.sp * st.chaos;
            o.set(P.x + Math.cos(a) * d.r, d.h + Math.sin(t * 1.7 + d.ph) * .04 * st.chaos, P.z + Math.sin(a) * d.r * .8);
            s.set(P.x + (i % 4 - 1.5) * .04, .03 + Math.floor(i / 4) * .034, P.z + ((i * 7) % 3 - 1) * .022);
            c.position.lerpVectors(o, s, st.settle); const k = st.chaos * (1 - st.settle); c.rotation.set(d.tilt + t * k, d.tilt * 2 + t * .7 * k, 0); U(c).uFillAmt.value = st.settle; });
          rot.rotation.y = -(1 - st.chaos) * 2.4;
        },
        on(id) { if (id === 'A') { gsap.to(st, { settle: 1, duration: D(1.8), ease: 'power2.inOut' }); spark(P, .26); } else { gsap.to(st, { chaos: .2, duration: D(1.2) }); U(ptr).uGlow.value = 1; } return true; }
      };
    }
  },
  lighthouse: {
    name: 'منارة الشاهد',
    labels: [['منارة الشاهد', .07, .14, .27, .3], ['أفكار عابرة', .62, .87, .5, .74], ['نهر الوعي', .85, .55, .72, .7]],
    markers: [[1, .42, .28], [2, .3, .9]], shadows: [[.27, .36, .14, .1]], focus: { A: [.27, .36, .3], B: [.45, .7, .04] },
    print(x) { x.strokeStyle = 'rgba(70,110,150,.6)'; x.lineWidth = 3; for (let k = 0; k < 7; k++) { x.beginPath(); for (let px = .04; px <= .82; px += .01) { const y = (.63 + k * .022 + Math.sin(px * 30 + k) * .006) * PH; px === .04 ? x.moveTo(px * PW, y) : x.lineTo(px * PW, y); } x.stroke(); } },
    build(g) {
      const T = at(.27, .36), tg = new THREE.Group(); tg.position.copy(T); g.add(tg);
      tg.add(ink(cyl(.1, .15, .05, 24)));
      const tower = ink(cyl(.032, .048, .24, 20)); tower.position.y = .05; tg.add(tower);
      const gal = ink(cyl(.062, .062, .012, 20)); gal.position.y = .29; tg.add(gal);
      const lamp = ink(cyl(.04, .04, .06, 14), { fill: '#f3c46a' }); lamp.position.y = .302; tg.add(lamp);
      const roof = ink(new THREE.ConeGeometry(.052, .06, 18).translate(0, .03, 0)); roof.position.y = .362; tg.add(roof);
      hit(tg, 'A');
      const beamG = new THREE.Group(); beamG.position.set(T.x, .332, T.z); g.add(beamG);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(.13, .85, 28, 1, true).translate(0, -.425, 0).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.raycast = () => {}; beam.rotation.z = -.32; beamG.add(beam);
      const glow = glowSprite('#ffcf80', .22); glow.position.set(T.x, .332, T.z); g.add(glow);
      const hull = new THREE.Shape(); hull.moveTo(-.046, .024); hull.lineTo(.046, .024); hull.lineTo(.03, 0); hull.lineTo(-.03, 0); hull.closePath();
      const hullGeo = new THREE.ExtrudeGeometry(hull, { depth: .034, bevelEnabled: false }).translate(0, 0, -.017);
      const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(0, .065); sail.lineTo(.038, 0); sail.closePath();
      const sailGeo = new THREE.ExtrudeGeometry(sail, { depth: .003, bevelEnabled: false });
      const words = ['قلق', 'ذكرى', 'خوف'], boats = [];
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Group(); b.add(ink(hullGeo, { fill: '#e9b25c' }));
        const s = ink(sailGeo, { fill: '#e9b25c' }); s.position.set(-.012, .024, 0); b.add(s);
        const tag = textSprite(words[i], { h: .04 }); tag.position.set(0, .13, 0); tag.visible = false; b.add(tag);
        b.userData = { ph: i / 3, tag, lit: 0, named: 0 }; g.add(b); boats.push(b); hit(b, 'B');
      }
      const st = { on: 0 };
      return {
        update(t) {
          const ang = -Math.PI / 2 + Math.sin(t * .7) * .85; beamG.rotation.y = ang; beam.material.opacity = .32 * st.on; glow.material.opacity = st.on; U(lamp).uFillAmt.value = st.on; U(lamp).uGlow.value = st.on;
          boats.forEach(b => { const k = (t * .045 + b.userData.ph) % 1, px = .06 + k * .74; b.position.copy(at(px, .7 + Math.sin(k * 9 + b.userData.ph * 6) * .02, .006 + Math.sin(t * 2 + px * 20) * .004)); b.rotation.y = Math.PI; b.rotation.z = Math.sin(t * 2 + px * 9) * .06;
            const s = Math.min(1, k * 10, (1 - k) * 10); b.scale.setScalar(.2 + .8 * s);
            const ba = Math.atan2(-(b.position.z - T.z), b.position.x - T.x), dif = Math.abs(Math.atan2(Math.sin(ba - ang), Math.cos(ba - ang)));
            const lit = st.on * (dif < .3 ? 1 : 0); b.userData.lit += (lit - b.userData.lit) * .15; b.children.forEach(c => { if (c.material?.uniforms) { U(c).uFillAmt.value = Math.max(b.userData.lit, b.userData.named * .7); U(c).uGlow.value = b.userData.lit * .6; } }); });
        },
        on(id, obj) {
          if (id === 'A') { gsap.to(st, { on: 1, duration: D(1) }); spark(at(.27, .36), .36); return true; }
          const b = boats.find(x => obj && (x === obj || x.getObjectById(obj.id))) || boats[0];
          b.userData.tag.visible = true; gsap.to(b.userData, { named: 1, duration: D(.6) }); return true;
        }
      };
    }
  },
  breath: {
    name: 'مقياس النَّفَس',
    labels: [['مقياس النفَس', .08, .18, .3, .44], ['شمعة الزفير', .84, .3, .66, .5], ['٤ شهيق · ٦ زفير', .1, .9, .3, .62]],
    markers: [[1, .47, .66], [2, .78, .66]], shadows: [[.32, .5, .1, .08], [.66, .56, .06, .05]], focus: { A: [.32, .5, .18], B: [.66, .56, .14] },
    build(g) {
      const P = at(.32, .5), jarG = new THREE.Group(); jarG.position.copy(P); g.add(jarG);
      jarG.add(ink(cyl(.1, .1, .014, 36)));
      jarG.add(ink(cyl(.09, .09, .32, 36, true), { opacity: .42, fill: '#e9b25c' }));
      const lvl = ink(cyl(.076, .076, 1, 36), { fill: '#e2a24c', fillAmt: 1, edges: false }); lvl.position.y = .014; jarG.add(lvl);
      for (let k = 1; k <= 4; k++) { const tick = ink(new THREE.TorusGeometry(.092, .002, 4, 40).rotateX(Math.PI / 2), { hull: false }); tick.position.y = .014 + k * .072; jarG.add(tick); }
      hit(jarG, 'A');
      const count = textSprite(' ', { h: .05 }); count.position.set(P.x, .42, P.z); count.visible = false; g.add(count);
      const C = at(.66, .56), cg = new THREE.Group(); cg.position.copy(C); g.add(cg);
      cg.add(ink(cyl(.05, .06, .012, 28)));
      const candle = ink(cyl(.022, .022, .13, 24), { paper: '#f8f1e2' }); candle.position.y = .012; cg.add(candle);
      const flameG = new THREE.Group(); flameG.position.y = .148; cg.add(flameG);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(.013, 14, 10).scale(1, 2.3, 1).translate(0, .03, 0), new THREE.MeshBasicMaterial({ color: '#ffb340' })); flame.raycast = () => {}; flameG.add(flame);
      const fglow = glowSprite('#ffb84d', .16); fglow.material.opacity = .9; fglow.position.y = .03; flameG.add(fglow);
      hit(cg, 'B');
      const st = { level: .12, exhale: 0, phase: '', p0: 0, running: false };
      function cycle(onDone) {
        st.running = true; count.visible = true;
        const tl = gsap.timeline({ onComplete: () => { st.running = false; count.visible = false; onDone?.(); } });
        for (let r = 0; r < 2; r++) {
          tl.call(() => { st.phase = 'شهيق'; st.p0 = performance.now(); });
          tl.to(st, { level: 1, duration: 4, ease: 'sine.inOut' });
          tl.call(() => { st.phase = 'زفير'; st.p0 = performance.now(); });
          tl.to(st, { level: .12, exhale: 1, duration: 6, ease: 'sine.inOut' });
          tl.to(st, { exhale: 0, duration: .4 });
        }
      }
      let last = '';
      return {
        update(t) {
          lvl.scale.y = .02 + st.level * .29; U(lvl).uGlow.value = st.level * .5;
          flameG.rotation.z = st.exhale * .55 + Math.sin(t * 9) * .04 * (1 + st.exhale * 2); flame.scale.set(1, 1 - st.exhale * .25 + Math.sin(t * 13) * .05, 1);
          if (st.running) { const n = Math.min(st.phase === 'شهيق' ? 4 : 6, 1 + Math.floor((performance.now() - st.p0) / 1000)), s = `${st.phase} ${ar(n)}`; if (s !== last) { count.setText(s); last = s; } }
        },
        on(id) {
          if (id === 'A') { if (!st.running) cycle(); spark(P, .34); return true; }
          gsap.timeline().to(st, { exhale: 1, duration: D(2.5), ease: 'sine.out' }).to(st, { exhale: 0, duration: D(3.5), ease: 'sine.inOut' }); return true;
        }
      };
    }
  },
  sea: {
    name: 'الموج والقارب',
    labels: [['الموج', .07, .22, .24, .42], ['الشراع', .84, .16, .5, .45], ['المجداف', .07, .95, .14, .82]],
    markers: [[1, .22, .92], [2, .62, .34]], shadows: [], focus: { A: [.15, .84, .04], B: [.46, .55, .12] },
    build(g) {
      const C = at(.46, .55), geo = new THREE.PlaneGeometry(.74, .5, 36, 24); geo.rotateX(-Math.PI / 2);
      const base = geo.attributes.position.array.slice();
      const water = ink(geo, { fill: '#7aa6c9', fillAmt: .35, hull: false, edges: false, shadow: false }); water.position.copy(C); g.add(water);
      const crests = []; for (let r = 0; r < 7; r++) { const lg = new THREE.BufferGeometry(), arr = new Float32Array(37 * 3); lg.setAttribute('position', new THREE.BufferAttribute(arr, 3)); const l = new THREE.Line(lg, LINE_MAT); l.position.copy(C); l.raycast = () => {}; g.add(l); crests.push({ l, z: -.22 + r * .073 }); }
      const st = { jit: 0, accept: 0, sail: .55, amp: 1 };
      const H = (x, z, t) => .03 + st.amp * .018 * (Math.sin(x * 15 + t * 1.8) * .6 + Math.sin(z * 12 + t * 1.3 + x * 5) * .4);
      const boat = new THREE.Group(); g.add(boat);
      const hull = new THREE.Shape(); hull.moveTo(-.07, .03); hull.lineTo(.07, .03); hull.lineTo(.045, 0); hull.lineTo(-.045, 0); hull.closePath();
      const hm = ink(new THREE.ExtrudeGeometry(hull, { depth: .05, bevelEnabled: false }).translate(0, 0, -.025), { fill: '#c8553d' }); boat.add(hm);
      const mast = ink(cyl(.004, .004, .14, 8)); mast.position.y = .03; boat.add(mast);
      const sailS = new THREE.Shape(); sailS.moveTo(0, 0); sailS.lineTo(0, .11); sailS.lineTo(.06, 0); sailS.closePath();
      const sailG = new THREE.Group(); sailG.position.set(.004, .045, 0); boat.add(sailG);
      const sail = ink(new THREE.ExtrudeGeometry(sailS, { depth: .003, bevelEnabled: false }), { fill: '#e9b25c' }); sailG.add(sail);
      hit(sailG, 'B'); hit(hm, 'B');
      const oar = new THREE.Group(); oar.position.copy(at(.15, .84)); oar.rotation.y = .6; g.add(oar);
      const shaft = ink(cyl(.006, .006, .26, 8)); shaft.rotation.z = Math.PI / 2; shaft.position.set(.13, .01, 0); oar.add(shaft);
      const blade = ink(box(.06, .006, .03)); blade.position.set(-.13, .004, 0); oar.add(blade); hit(oar, 'A');
      return {
        update(t) {
          const p = geo.attributes.position;
          for (let i = 0; i < p.count; i++) p.setY(i, H(base[i * 3] + C.x, base[i * 3 + 2] + C.z, t));
          p.needsUpdate = true; geo.computeVertexNormals();
          crests.forEach(c => { const a = c.l.geometry.attributes.position; for (let k = 0; k < 37; k++) { const x = -.37 + k * .74 / 36; a.setXYZ(k, x, H(x + C.x, c.z + C.z, t) + .002, c.z); } a.needsUpdate = true; });
          const bx = C.x, bz = C.z, y = H(bx, bz, t), dx = (H(bx + .02, bz, t) - H(bx - .02, bz, t)) / .04, dz = (H(bx, bz + .02, t) - H(bx, bz - .02, t)) / .04;
          boat.position.set(bx + st.jit * Math.sin(t * 23) * .01, y + .004, bz);
          boat.rotation.set(-Math.atan(dz) + st.jit * Math.sin(t * 31) * .3, 0, Math.atan(dx) + st.jit * Math.sin(t * 27) * .35);
          sailG.scale.y = st.sail; U(sail).uFillAmt.value = st.accept; U(sail).uGlow.value = st.accept * .5; U(hm).uFillAmt.value = st.jit;
        },
        on(id) {
          if (id === 'A') { gsap.to(st, { jit: 1, amp: 1.7, accept: 0, sail: .55, duration: D(.6) }); return true; }
          gsap.to(st, { jit: 0, amp: 1, accept: 1, sail: 1, duration: D(1.2), ease: 'power2.out' }); spark(at(.46, .55), .2); return true;
        }
      };
    }
  },
  kintsugi: {
    name: 'الوعاء المذهّب',
    labels: [['قطع الوعاء', .08, .16, .3, .42], ['خيوط الذهب', .1, .86, .36, .58], ['وعاء الذهب', .84, .9, .74, .72]],
    markers: [[1, .54, .3], [2, .84, .6]], shadows: [[.38, .5, .14, .1], [.74, .68, .05, .04]], focus: { A: [.38, .5, .06], B: [.74, .68, .05] },
    build(g) {
      const P = at(.38, .5), prof = [[0, 0], [.06, 0], [.078, .006], [.102, .03], [.118, .066], [.124, .1]].map(([r, y]) => new THREE.Vector2(r, y));
      const shards = [];
      for (let k = 0; k < 4; k++) {
        const s = ink(new THREE.LatheGeometry(prof, 14, k * Math.PI / 2, Math.PI / 2), { paper: '#f2e9d8', fill: '#d9a35e', hull: false });
        const mid = k * Math.PI / 2 + Math.PI / 4; s.userData = { dir: new THREE.Vector3(Math.sin(mid), 0, Math.cos(mid)), tilt: (k % 2 ? 1 : -1) * .35 };
        g.add(s); shards.push(s); hit(s, 'A');
      }
      const seams = [];
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, pts = prof.map(v => new THREE.Vector3(Math.sin(a) * v.x * 1.01, v.y, Math.cos(a) * v.x * 1.01));
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, .005, 6), new THREE.MeshBasicMaterial({ color: '#e8b04a', transparent: true, opacity: 0, toneMapped: false })); m.position.copy(P); m.raycast = () => {}; g.add(m); seams.push(m); }
      const G = at(.74, .68), pot = new THREE.Group(); pot.position.copy(G); g.add(pot);
      pot.add(ink(cyl(.04, .045, .055, 24), { fill: '#e8b04a', fillAmt: .6 }));
      const brush = ink(cyl(.004, .004, .14, 8)); brush.rotation.z = .35; brush.position.set(-.02, .04, 0); pot.add(brush);
      hit(pot, 'B');
      const st = { tog: 0, gild: 0 };
      return {
        update(t) {
          shards.forEach(s => { const k = 1 - st.tog; s.position.copy(P).addScaledVector(s.userData.dir, k * .075); s.position.y = k * .015; s.rotation.set(s.userData.tilt * k, 0, s.userData.tilt * k * .5); U(s).uFillAmt.value = st.gild * .22; U(s).uGlow.value = st.gild * .15; });
          seams.forEach(m => { m.material.opacity = st.gild; m.scale.y = .2 + .8 * st.gild; });
        },
        on(id) {
          if (id === 'A') { gsap.to(st, { tog: 1, duration: D(1.6), ease: 'power3.inOut' }); return true; }
          const tl = gsap.timeline(); if (st.tog < 1) tl.to(st, { tog: 1, duration: D(1.2), ease: 'power3.inOut' });
          tl.to(st, { gild: 1, duration: D(1.6), ease: 'power2.out', onStart: () => spark(P, .12, '#ffd36b') }); return true;
        }
      };
    }
  },
  cell: {
    name: 'باب السجن',
    labels: [['زنزانة الغضب', .08, .14, .26, .36], ['المفتاح', .86, .9, .76, .74], ['ضوء الخروج', .1, .9, .36, .7]],
    markers: [[1, .86, .66], [2, .2, .52]], shadows: [[.4, .46, .19, .15]], focus: { A: [.76, .72, .03], B: [.33, .55, .12] },
    build(g) {
      const C = at(.4, .46), cell = new THREE.Group(); cell.position.copy(C); g.add(cell);
      cell.add(ink(box(.36, .016, .28)));
      const bar = (x, z, h = .23) => { const b = ink(cyl(.0055, .0055, h, 8), { hull: false }); b.position.set(x, .016, z); cell.add(b); };
      for (let i = 0; i < 8; i++) bar(-.17 + i * .34 / 7, -.13);
      for (let i = 1; i < 6; i++) { bar(-.17, -.13 + i * .26 / 6); bar(.17, -.13 + i * .26 / 6); }
      for (let i = 0; i < 4; i++) bar(.03 + i * .14 / 3, .13);
      [[0, -.13, .36, .012], [0, .13, .36, .012]].forEach(([x, z, w, d]) => { const r = ink(box(w, .012, d)); r.position.set(x, .24, z); cell.add(r); });
      [[-.17, 0], [.17, 0]].forEach(([x]) => { const r = ink(box(.012, .012, .27)); r.position.set(x, .24, 0); cell.add(r); });
      const lantern = new THREE.Group(); lantern.position.set(0, .016, 0); cell.add(lantern);
      lantern.add(ink(cyl(.025, .03, .012, 16)));
      const lg = ink(cyl(.022, .022, .05, 12), { opacity: .5, fill: '#ffcf80' }); lg.position.y = .012; lantern.add(lg);
      const lglow = glowSprite('#ffc76b', .16); lglow.position.y = .04; lglow.material.opacity = .5; lantern.add(lglow);
      const doorPivot = new THREE.Group(); doorPivot.position.set(-.17, .016, .13); cell.add(doorPivot);
      const door = new THREE.Group(); doorPivot.add(door);
      [[.1, .005, .2, .012], [.1, .215, .2, .012]].forEach(([x, y, w, h]) => { const r = ink(box(w, h, .012)); r.position.set(x, y, 0); door.add(r); });
      for (let i = 0; i < 4; i++) { const b = ink(cyl(.0055, .0055, .21, 8), { hull: false }); b.position.set(.03 + i * .045, .008, 0); door.add(b); }
      const lock = ink(box(.03, .04, .02), { fill: '#e2a24c' }); lock.position.set(.185, .09, .012); door.add(lock);
      hit(door, 'B');
      const pool = new THREE.Mesh(new THREE.CircleGeometry(.2, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); pool.position.copy(at(.36, .7, .002)); pool.raycast = () => {}; g.add(pool);
      const key = new THREE.Group(); key.position.copy(at(.76, .72)); g.add(key);
      const bow = ink(new THREE.TorusGeometry(.022, .006, 8, 24).rotateX(Math.PI / 2)); bow.position.set(-.05, .006, 0); key.add(bow);
      const shaft = ink(box(.07, .008, .008)); shaft.position.set(0, .002, 0); key.add(shaft);
      const bit = ink(box(.012, .008, .022)); bit.position.set(.03, .002, .01); key.add(bit);
      hit(key, 'A');
      const st = { unlocked: 0, open: 0, rattle: 0 };
      return {
        update(t) { doorPivot.rotation.y = -st.open * 1.9 + Math.sin(t * 40) * st.rattle * .05; U(lock).uFillAmt.value = st.unlocked; U(lock).uGlow.value = st.unlocked * .6; pool.material.opacity = st.open * .55; lglow.material.opacity = .5 + st.open * .5; lglow.scale.setScalar(.16 + st.open * .14); },
        on(id) {
          if (id === 'A') {
            if (st.unlocked) return true;
            const from = key.position.clone(), to = new THREE.Vector3(C.x - .17 + .185, .12, C.z + .13 + .04);
            const s = { k: 0 };
            gsap.to(s, { k: 1, duration: D(1.2), ease: 'power2.inOut', onUpdate: () => { key.position.lerpVectors(from, to, s.k); key.position.y += Math.sin(s.k * Math.PI) * .12; key.rotation.y = s.k * -Math.PI / 2; },
              onComplete: () => gsap.to(key.rotation, { x: Math.PI / 2, duration: D(.5), onComplete: () => { st.unlocked = 1; } }) });
            return true;
          }
          if (!st.unlocked) { toast('أدر المفتاح أولاً'); gsap.fromTo(st, { rattle: 1 }, { rattle: 0, duration: .6 }); return false; }
          gsap.to(st, { open: 1, duration: D(1.6), ease: 'power2.out' }); spark(at(.36, .62), .1, '#ffd27a'); return true;
        }
      };
    }
  },
  vise: {
    name: 'الملزمة والكفّ',
    labels: [['قبضة التعلّق', .07, .16, .26, .42], ['ما نحبّه', .1, .86, .36, .5], ['الكفّ المفتوحة', .86, .92, .74, .74]],
    markers: [[1, .62, .36], [2, .88, .62]], shadows: [[.36, .46, .17, .08], [.74, .72, .09, .07]], focus: { A: [.52, .46, .08], B: [.74, .72, .03] },
    build(g) {
      const V = at(.36, .46), v = new THREE.Group(); v.position.copy(V); g.add(v);
      v.add(ink(box(.32, .02, .12)));
      const fixed = ink(box(.03, .09, .1)); fixed.position.set(-.1, .02, 0); v.add(fixed);
      const jaw = ink(box(.03, .09, .1)); v.add(jaw);
      const screw = ink(cyl(.008, .008, .16, 10)); screw.rotation.z = Math.PI / 2; screw.position.set(.18, .065, 0); v.add(screw);
      const handle = new THREE.Group(); handle.position.set(.2, .065, 0); v.add(handle);
      const hbar = ink(cyl(.006, .006, .14, 8)); hbar.rotation.x = Math.PI / 2; hbar.position.z = -.07; handle.add(hbar);
      hit(handle, 'A'); hit(screw, 'A'); hit(jaw, 'A');
      const orb = ink(new THREE.SphereGeometry(.045, 32, 20), { opacity: .7, fill: '#e8b04a', paper: '#cfe0ea' }); g.add(orb);
      const cg = new THREE.BufferGeometry(), cp = [], r = rnd(9);
      for (let i = 0; i < 26; i++) { const a = new THREE.Vector3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(.0462), b = a.clone().add(new THREE.Vector3(r() - .5, r() - .5, r() - .5).multiplyScalar(.03)).normalize().multiplyScalar(.0462); cp.push(a.x, a.y, a.z, b.x, b.y, b.z); }
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
      const cracks = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: '#231b14', transparent: true, opacity: 0 })); cracks.raycast = () => {}; orb.add(cracks);
      const Dp = at(.74, .72), dish = ink(new THREE.LatheGeometry([[0, 0], [.05, 0], [.08, .014], [.096, .032]].map(([a, b]) => new THREE.Vector2(a, b)), 32), { paper: '#f2e9d8', hull: false });
      dish.position.copy(Dp); g.add(dish); hit(dish, 'B');
      const oglow = glowSprite('#ffcf80', .2); g.add(oglow);
      const st = { close: 0, crack: 0, free: 0 }, inV = new THREE.Vector3(V.x, .065, V.z), inD = new THREE.Vector3(Dp.x, .05, Dp.z);
      return {
        update(t) {
          jaw.position.set(.1 - st.close * .045 * (1 - st.free), .02, 0); handle.rotation.x = st.close * Math.PI * 3;
          orb.position.lerpVectors(inV, inD, st.free); orb.position.y += Math.sin(st.free * Math.PI) * .12;
          orb.scale.set(1 - st.crack * .12 * (1 - st.free), 1 + st.crack * .05 * (1 - st.free), 1);
          cracks.material.opacity = st.crack; U(orb).uFillAmt.value = st.free; U(orb).uGlow.value = st.free * .6;
          oglow.position.copy(orb.position); oglow.material.opacity = st.free * .8;
        },
        on(id) {
          if (id === 'A') { if (st.free) gsap.to(st, { free: 0, duration: D(1) }); gsap.to(st, { close: 1, duration: D(1.4), ease: 'power2.in' }); gsap.to(st, { crack: 1, duration: D(.5), delay: D(1) }); return true; }
          gsap.timeline().to(st, { close: 0, duration: D(.8) }).to(st, { free: 1, duration: D(1.4), ease: 'power2.inOut' }).to(st, { crack: 0, duration: D(1.2) }, '<.6').call(() => spark(inD, .06));
          return true;
        }
      };
    }
  },
  room: {
    name: 'غرفة الموعد',
    labels: [['كرسي واحد', .07, .2, .34, .5], ['المصباح', .84, .14, .52, .36], ['باب على الضجيج', .8, .94, .6, .62]],
    markers: [[1, .66, .28], [2, .74, .74]], shadows: [[.42, .46, .2, .16]], focus: { A: [.52, .38, .16], B: [.6, .6, .1] },
    build(g) {
      const R = at(.42, .46), room = new THREE.Group(); room.position.copy(R); g.add(room);
      const floor = ink(box(.38, .012, .3)); room.add(floor);
      const back = ink(box(.38, .25, .014)); back.position.set(0, .012, -.15); room.add(back);
      const left = ink(box(.014, .25, .3)); left.position.set(-.19, .012, 0); room.add(left);
      const pane = ink(box(.12, .1, .004), { paper: '#d6e4ee', fill: '#ffd38a' }); pane.position.set(-.04, .1, -.141); room.add(pane);
      [[-.04, .095, .124, .006], [-.04, .2, .124, .006], [-.04, .15, .006, .1], [-.1, .15, .006, .1], [.02, .15, .006, .1]].forEach(([x, y, w, h], i) => { const f = ink(box(w, h, .008)); f.position.set(x, i < 2 ? y : .1, -.14); room.add(f); });
      const chair = new THREE.Group(); chair.position.set(-.05, .012, .03); room.add(chair);
      const seat = ink(box(.08, .01, .08)); seat.position.y = .055; chair.add(seat);
      const cback = ink(box(.08, .09, .01)); cback.position.set(0, .065, -.035); chair.add(cback);
      [[-.033, -.033], [.033, -.033], [-.033, .033], [.033, .033]].forEach(([x, z]) => { const l = ink(cyl(.004, .004, .055, 6), { hull: false }); l.position.set(x, 0, z); chair.add(l); });
      const lamp = new THREE.Group(); lamp.position.set(.11, .012, -.07); room.add(lamp);
      lamp.add(ink(cyl(.025, .03, .01, 18)));
      const stem = ink(cyl(.004, .004, .16, 8), { hull: false }); stem.position.y = .01; lamp.add(stem);
      const shade = ink(cyl(.02, .045, .05, 24, true), { fill: '#ffd38a', hull: false }); shade.position.y = .15; lamp.add(shade);
      const lglow = glowSprite('#ffcf80', .34); lglow.position.y = .15; lamp.add(lglow);
      hit(lamp, 'A');
      const dPivot = new THREE.Group(); dPivot.position.set(.19, .012, .14); room.add(dPivot);
      const door = ink(box(.012, .2, .12)); door.position.set(0, 0, -.06); dPivot.add(door);
      const knob = ink(new THREE.SphereGeometry(.007, 10, 8)); knob.position.set(-.01, .1, -.105); dPivot.add(knob);
      const sign = textSprite('موعد مع نفسي', { h: .028 }); sign.position.set(-.02, .16, -.06); dPivot.add(sign);
      hit(dPivot, 'B');
      const st = { lamp: 0, door: 1 };
      return {
        update() { lglow.material.opacity = st.lamp; U(shade).uFillAmt.value = st.lamp; U(shade).uGlow.value = st.lamp; [floor, back, left].forEach(m => { U(m).uFillAmt.value = st.lamp * .28; }); U(pane).uFillAmt.value = st.lamp * .5; dPivot.rotation.y = st.door * 1.25; },
        on(id) { if (id === 'A') { gsap.to(st, { lamp: 1, duration: D(1.4), ease: 'power2.out' }); return true; } gsap.to(st, { door: 0, duration: D(1.6), ease: 'power2.inOut' }); return true; }
      };
    }
  },
  hourglass: {
    name: 'الساعة والحواس',
    labels: [['رمل الماضي والغد', .07, .14, .26, .3], ['الآن', .66, .2, .32, .38], ['٥ ٤ ٣ ٢ ١', .86, .96, .6, .8]],
    markers: [[1, .5, .26], [2, .1, .7]], shadows: [[.32, .44, .08, .07]], focus: { A: [.32, .44, .13], B: [.42, .8, .05] },
    build(g) {
      const H = at(.32, .44), outer = new THREE.Group(); outer.position.copy(H); g.add(outer);
      const hg = new THREE.Group(); hg.position.y = .135; outer.add(hg);
      [-.125, .113].forEach(y => { const d = ink(cyl(.07, .07, .012, 28)); d.position.y = y; hg.add(d); });
      for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, p = ink(cyl(.005, .005, .238, 8), { hull: false }); p.position.set(Math.cos(a) * .06, -.113, Math.sin(a) * .06); hg.add(p); }
      const up = ink(new THREE.ConeGeometry(.055, .11, 28, 1, true).rotateX(Math.PI).translate(0, .055, 0), { opacity: .4 }); hg.add(up);
      const dn = ink(new THREE.ConeGeometry(.055, .11, 28, 1, true).translate(0, -.055, 0), { opacity: .4 }); hg.add(dn);
      const sTop = ink(new THREE.ConeGeometry(.046, .085, 24).rotateX(Math.PI).translate(0, .0425, 0), { fill: '#e2a24c', fillAmt: 1, edges: false, hull: false }); sTop.position.y = .02; hg.add(sTop);
      const sBot = ink(new THREE.ConeGeometry(.05, .06, 24).translate(0, .03, 0), { fill: '#e2a24c', fillAmt: 1, edges: false, hull: false }); sBot.position.y = -.112; hg.add(sBot);
      const grain = new THREE.Mesh(new THREE.SphereGeometry(.007, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd36b', toneMapped: false })); grain.raycast = () => {}; hg.add(grain);
      const ng = glowSprite('#ffd36b', .1); hg.add(ng);
      hit(hg, 'A');
      const words = ['٥ أرى', '٤ ألمس', '٣ أسمع', '٢ أشمّ', '١ أتذوّق'], stacks = [];
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Group(); s.position.copy(at(.14 + i * .14, .8)); g.add(s);
        for (let k = 0; k < 5 - i; k++) { const d = ink(cyl(.03, .03, .011, 22), { fill: '#e2a24c' }); d.position.y = k * .013; s.add(d); }
        const lab = textSprite(words[i], { h: .034 }); lab.position.y = (5 - i) * .013 + .05; lab.visible = false; s.add(lab);
        s.userData = { lab, on: 0 }; stacks.push(s); hit(s, 'B');
      }
      const st = { flip: 0, a: 0, b: 1, now: 0 };
      return {
        update(t) {
          hg.rotation.z = st.flip * Math.PI;
          sTop.scale.setScalar(Math.max(.001, st.a)); sBot.scale.setScalar(Math.max(.001, st.b));
          const pulse = .6 + .4 * Math.sin(t * 4); grain.scale.setScalar(st.now ? 1 + pulse * .3 : .001); ng.material.opacity = st.now * pulse;
          stacks.forEach(s => s.children.forEach(c => { if (c.material?.uniforms) { U(c).uFillAmt.value = s.userData.on; U(c).uGlow.value = s.userData.on * .4; } }));
        },
        on(id) {
          if (id === 'A') { if (st.flipped) return true; st.flipped = true;
            gsap.timeline().to(st, { flip: 1, duration: D(1), ease: 'power2.inOut' }).to(st, { b: .35, a: .65, duration: D(2.4) }).set(st, { now: 1 }); return true; }
          stacks.forEach((s, i) => { gsap.to(s.userData, { on: 1, duration: D(.4), delay: D(i * .8), onStart: () => { s.userData.lab.visible = true; } }); });
          return true;
        }
      };
    }
  },
  gratitude: {
    name: 'جرّة النِّعم',
    labels: [['جرّة النِّعم', .07, .16, .26, .4], ['أوراق اليوم', .86, .9, .72, .7], ['الغطاء', .08, .86, .34, .3]],
    markers: [[1, .86, .56], [2, .5, .24]], shadows: [[.34, .48, .12, .1], [.72, .66, .05, .04]], focus: { A: [.72, .66, .03], B: [.34, .48, .27] },
    build(g) {
      const J = at(.34, .48), jar = new THREE.Group(); jar.position.copy(J); g.add(jar);
      jar.add(ink(cyl(.1, .1, .012, 36)));
      jar.add(ink(cyl(.1, .1, .25, 36, true), { opacity: .4 }));
      const lvl = ink(cyl(.088, .088, 1, 36), { fill: '#e2a24c', fillAmt: 1, edges: false }); lvl.position.y = .012; jar.add(lvl);
      const lid = new THREE.Group(); lid.position.set(0, .262, 0); jar.add(lid);
      const lidM = ink(cyl(.108, .108, .024, 36), { fill: '#c99442', fillAmt: .7 }); lid.add(lidM);
      const lknob = ink(cyl(.02, .025, .02, 16)); lknob.position.y = .024; lid.add(lknob);
      hit(lid, 'B');
      const jg = glowSprite('#ffcf80', .4); jg.position.set(J.x, .2, J.z); g.add(jg);
      const pad = new THREE.Group(); pad.position.copy(at(.72, .66)); g.add(pad);
      const notes = ['#f3d26b', '#f2b98a', '#e9da7a'].map((c, i) => { const n = ink(box(.07, .006, .05), { fill: c, fillAmt: 1 }); n.position.y = i * .007; pad.add(n); return n; }).reverse();
      hit(pad, 'A');
      const st = { level: 0, count: 0, lid: 0, busy: false };
      return {
        update() { lvl.scale.y = .002 + st.level * .22; U(lvl).uGlow.value = st.level * .4 + st.lid * .6; lid.position.y = .262 + st.lid * .09; lid.rotation.z = st.lid * .6; lid.position.x = st.lid * .06; jg.material.opacity = st.lid * .9; },
        on(id, obj) {
          if (id === 'A') {
            if (st.count >= 3) return true;
            if (st.busy) return false;
            const n = notes[st.count]; st.busy = true;
            const from = pad.localToWorld(n.position.clone()), to = new THREE.Vector3(J.x, .3, J.z), s = { k: 0 };
            g.attach(n);
            gsap.to(s, { k: 1, duration: D(1), ease: 'power1.inOut', onUpdate: () => { n.position.lerpVectors(g.worldToLocal(from.clone()), to, s.k); n.position.y += Math.sin(s.k * Math.PI) * .12; n.rotation.y = s.k * 2.5; },
              onComplete: () => { gsap.to(n.position, { y: .05, duration: D(.4), onComplete: () => { n.visible = false; } }); st.count++; gsap.to(st, { level: st.count / 3, duration: D(.8) }); st.busy = false; toast(`نعمة ${ar(st.count)} من ٣`); if (st.count >= 3) markDone('A'); } });
            return false;
          }
          gsap.to(st, { lid: 1, duration: D(1.2), ease: 'back.out(1.6)' }); spark(new THREE.Vector3(J.x, .3, J.z), .06, '#ffd36b'); return true;
        }
      };
    }
  },
  candle: {
    name: 'الشمعة والتقويم',
    labels: [['شمعة الوقت', .07, .18, .28, .42], ['كل صباح هدية', .86, .14, .68, .36], ['اقلب يوماً', .86, .92, .7, .62]],
    markers: [[1, .44, .66], [2, .86, .54]], shadows: [[.32, .5, .07, .06], [.68, .5, .1, .07]], focus: { A: [.32, .5, .14], B: [.68, .5, .12] },
    build(g) {
      const C = at(.32, .5), cg = new THREE.Group(); cg.position.copy(C); g.add(cg);
      cg.add(ink(new THREE.LatheGeometry([[0, 0], [.06, 0], [.075, .012], [.08, .022]].map(([a, b]) => new THREE.Vector2(a, b)), 32), { hull: false }));
      const body = ink(cyl(.03, .03, .16, 28), { paper: '#f8f1e2' }); body.position.y = .012; cg.add(body);
      const flameG = new THREE.Group(); cg.add(flameG);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(.014, 14, 10).scale(1, 2.3, 1).translate(0, .03, 0), new THREE.MeshBasicMaterial({ color: '#ffb340', transparent: true, opacity: 0 })); flame.raycast = () => {}; flameG.add(flame);
      const fglow = glowSprite('#ffb84d', .26); fglow.position.y = .03; flameG.add(fglow);
      hit(cg, 'A');
      const K = at(.68, .5), cal = new THREE.Group(); cal.position.copy(K); g.add(cal);
      const stand = ink(box(.18, .2, .012)); stand.rotation.x = -.35; stand.position.z = -.03; cal.add(stand);
      const pageCanvas = n => { const c = document.createElement('canvas'); c.width = 256; c.height = 280; const x = c.getContext('2d');
        x.fillStyle = '#fbf6ec'; x.fillRect(0, 0, 256, 280); x.fillStyle = '#b3472a'; x.fillRect(0, 0, 256, 54); x.fillStyle = '#fff'; x.font = '600 30px "IBM Plex Sans Arabic"'; x.textAlign = 'center'; x.direction = 'rtl'; x.fillText('يوم جديد', 128, 38);
        x.fillStyle = '#231b14'; x.font = '700 120px "Amiri"'; x.fillText(ar(n), 128, 190); x.font = '400 28px "Amiri"'; x.fillStyle = '#6d5c4a'; x.fillText('هدية لم يحصل عليها كثيرون', 128, 250); return canvasTex(c); };
      const pg = (n, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.15, .165).translate(0, -.0825, 0), new THREE.MeshStandardMaterial({ map: pageCanvas(n), roughness: .9, transparent: true, side: THREE.DoubleSide })); const piv = new THREE.Group(); piv.position.set(0, .2 * Math.cos(.35) - .005, -.03 - .2 * Math.sin(.35) + z); piv.rotation.x = -.35; piv.add(m); cal.add(piv); return { piv, m }; };
      let day = 1; const under = pg(2, .011), top = pg(1, .016);
      hit(cal, 'B');
      const st = { lit: 0, len: 1, flip: 0 };
      return {
        update(t) { body.scale.y = st.len; flameG.position.y = .012 + .16 * st.len; flame.material.opacity = st.lit; flame.scale.set(1, 1 + Math.sin(t * 11) * .06, 1); fglow.material.opacity = st.lit * (.8 + Math.sin(t * 7) * .1); U(body).uGlow.value = st.lit * .25; U(body).uFill.value.set('#ffcf80'); top.piv.rotation.x = -.35 - st.flip * 2.6; top.m.material.opacity = 1 - st.flip * .9; },
        on(id) {
          if (id === 'A') { if (!st.lit) { gsap.to(st, { lit: 1, duration: D(.8) }); gsap.to(st, { len: .82, duration: reduced ? 0 : 12, ease: 'none' }); } return true; }
          if (st.flip > 0) return true;
          gsap.to(st, { flip: 1, duration: D(.9), ease: 'power2.in', onComplete: () => { day++; top.m.material.map = under.m.material.map; under.m.material.map = pageCanvas(day + 1); top.m.material.needsUpdate = under.m.material.needsUpdate = true; st.flip = 0; } });
          return true;
        }
      };
    }
  },
  home: {
    name: 'الطريق إلى البيت',
    labels: [['البيت', .07, .14, .24, .28], ['اثنا عشر حجراً', .86, .62, .62, .72], ['البداية', .9, .96, .82, .9]],
    markers: [[1, .88, .8], [2, .48, .2]], shadows: [[.3, .32, .12, .1]], focus: { A: [.6, .74, .02], B: [.3, .32, .1] },
    build(g) {
      const Hp = at(.3, .32), house = new THREE.Group(); house.position.copy(Hp); g.add(house);
      const bodyM = ink(box(.16, .12, .14)); house.add(bodyM);
      const tri = new THREE.Shape(); tri.moveTo(-.095, 0); tri.lineTo(.095, 0); tri.lineTo(0, .08); tri.closePath();
      const roof = ink(new THREE.ExtrudeGeometry(tri, { depth: .16, bevelEnabled: false }).translate(0, 0, -.08), { fill: '#b3472a', fillAmt: .55 }); roof.position.y = .12; house.add(roof);
      const chim = ink(box(.022, .05, .022)); chim.position.set(.045, .15, -.02); house.add(chim);
      const dPiv = new THREE.Group(); dPiv.position.set(-.018, 0, .071); house.add(dPiv);
      const door = ink(box(.036, .065, .005), { fill: '#ffcf80' }); door.position.x = .018; dPiv.add(door);
      const wins = [[-.05, .07], [.05, .07]].map(([x, y]) => { const w = ink(box(.03, .03, .004), { paper: '#d6e4ee', fill: '#ffcf80' }); w.position.set(x, y, .071); house.add(w); return w; });
      const hg = glowSprite('#ffcf80', .32); hg.position.set(Hp.x, .07, Hp.z + .1); g.add(hg);
      hit(house, 'B');
      const curve = new THREE.CatmullRomCurve3([at(.84, .9), at(.7, .78), at(.55, .82), at(.45, .66), at(.33, .43)]);
      const stones = [];
      for (let i = 0; i < 12; i++) { const s = ink(cyl(.022, .026, .01, 18), { fill: '#e2a24c' }); s.position.copy(curve.getPoint(i / 11)); s.rotation.y = i; g.add(s); stones.push(s); hit(s, 'A'); }
      const st = { lit: 0, home: 0 };
      return {
        update() { stones.forEach((s, i) => { const k = clamp(st.lit - i, 0, 1); U(s).uFillAmt.value = k; U(s).uGlow.value = k * .5; }); wins.forEach(w => { U(w).uFillAmt.value = st.home; U(w).uGlow.value = st.home; }); U(door).uFillAmt.value = st.home; dPiv.rotation.y = -st.home * 1.2; hg.material.opacity = st.home; },
        on(id) { if (id === 'A') { gsap.to(st, { lit: 12, duration: D(3.6), ease: 'none' }); return true; } gsap.to(st, { home: 1, duration: D(1.4) }); spark(Hp, .12); return true; }
      };
    }
  }
};
function spark(local, h = .1, color) { const w = popGroup.localToWorld(local.clone().setY((local.y || 0) + h)); burst(w, color); }

// ---------- page drawing ----------
const C = () => highContrast
  ? { ink: '#000000', muted: '#1a1a1a', amber: '#7a3d00', rule: '#000000', box: 'rgba(0,0,0,.04)', paperTint: 'rgba(255,255,255,.55)' }
  : { ink: '#231b14', muted: '#6d5c4a', amber: '#a8661f', rule: '#cdbfa8', box: 'rgba(217,163,94,.10)', paperTint: 'rgba(255,255,255,0)' };
function wrap(x, text, maxW) { const out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
const pageState = []; // per lesson: rects for options, flap, stamp
function drawText(i, cv, record = true) {
  const L = LESSONS[i], x = cv.getContext('2d'), c = C();
  const XR = PW - 120, XL = PW * .23, W = XR - XL;
  const layout = (s, draw) => {
    const rec = { options: [], flap: null, stamp: null };
    if (draw) { x.drawImage(PAPER_R, 0, 0); x.fillStyle = c.paperTint; x.fillRect(0, 0, PW, PH); }
    x.direction = 'rtl'; x.textAlign = 'right'; x.textBaseline = 'alphabetic';
    let y = 112 * s;
    x.font = `600 ${27 * s}px "IBM Plex Sans Arabic"`; x.fillStyle = c.amber; if (draw) x.fillText(`${L.kicker} · ${ar(i + 1)} من ${ar(N)}`, XR, y);
    y += 112 * s; x.font = `700 ${100 * s}px "Aref Ruqaa"`; x.fillStyle = c.ink; if (draw) x.fillText(L.title, XR, y);
    rec.stamp = { x: XL + 86 * s, y: 150 * s, r: 72 * s };
    if (draw) { x.save(); x.setLineDash([10 * s, 9 * s]); x.strokeStyle = c.muted; x.lineWidth = 3 * s; x.beginPath(); x.arc(rec.stamp.x, rec.stamp.y, rec.stamp.r, 0, Math.PI * 2); x.stroke(); x.restore(); x.font = `600 ${20 * s}px "IBM Plex Sans Arabic"`; x.fillStyle = c.muted; x.textAlign = 'center'; x.fillText('ختم الباب', rec.stamp.x, rec.stamp.y + 8 * s); x.textAlign = 'right'; }
    y += 34 * s; x.font = `400 ${37 * s}px "Amiri"`; x.fillStyle = c.muted;
    for (const l of wrap(x, L.tagline, W)) { y += 56 * s; if (draw) x.fillText(l, XR, y); }
    y += 30 * s; if (draw) { x.strokeStyle = c.amber; x.lineWidth = 2.5 * s; x.beginPath(); x.moveTo(XR, y); x.lineTo(XR - 160 * s, y); x.stroke(); }
    y += 10 * s; x.font = `400 ${34 * s}px "Amiri"`; x.fillStyle = c.ink;
    for (const l of wrap(x, L.core, W)) { y += 57 * s; if (draw) x.fillText(l, XR, y); }
    y += 34 * s; x.font = `700 ${36 * s}px "Amiri"`; const pl = wrap(x, L.principle, W - 80 * s), bh = (40 + 34 + pl.length * 56 + 26) * s;
    if (draw) { x.fillStyle = c.box; x.fillRect(XL, y, W, bh); x.strokeStyle = c.ink; x.lineWidth = 2.5 * s; x.strokeRect(XL, y, W, bh); x.fillStyle = c.amber; x.fillRect(XR - 10 * s, y, 10 * s, bh);
      x.font = `600 ${23 * s}px "IBM Plex Sans Arabic"`; x.fillText('القاعدة', XR - 34 * s, y + 46 * s); x.font = `700 ${36 * s}px "Amiri"`; x.fillStyle = c.ink; pl.forEach((l, k) => x.fillText(l, XR - 34 * s, y + (98 + k * 56) * s)); }
    y += bh + 52 * s; x.font = `600 ${23 * s}px "IBM Plex Sans Arabic"`; x.fillStyle = c.amber; if (draw) x.fillText('مفردات الباب', XR, y);
    for (const [term, def] of L.vocab) {
      y += 54 * s; x.font = `700 ${32 * s}px "Amiri"`; x.fillStyle = c.ink; const tw = x.measureText(term + ':').width; if (draw) x.fillText(term + ':', XR, y);
      x.font = `400 ${30 * s}px "Amiri"`; x.fillStyle = c.muted; const first = wrap(x, def, W - tw - 14 * s);
      if (first.length === 1) { if (draw) x.fillText(def, XR - tw - 14 * s, y); } else { for (const l of wrap(x, def, W)) { y += 48 * s; if (draw) x.fillText(l, XR, y); } }
    }
    y += 64 * s; x.font = `600 ${23 * s}px "IBM Plex Sans Arabic"`; x.fillStyle = c.amber; if (draw) x.fillText('توقّع قبل أن تجرّب', XR, y);
    x.font = `700 ${33 * s}px "Amiri"`; x.fillStyle = c.ink; for (const l of wrap(x, L.quiz.q, W)) { y += 54 * s; if (draw) x.fillText(l, XR, y); }
    y += 22 * s; const chosen = saved.answers[i];
    L.quiz.options.forEach((o, k) => {
      const r = { x: XL, y, w: W, h: 64 * s, k }; rec.options.push(r);
      if (draw) {
        const isAns = k === L.quiz.answer, picked = chosen === k, show = chosen != null;
        x.save(); x.beginPath(); x.roundRect(r.x, r.y, r.w, r.h, 18 * s);
        x.fillStyle = show && isAns ? (highContrast ? '#000' : '#a8661f') : show && picked ? 'rgba(179,71,42,.12)' : 'rgba(255,255,255,.35)'; x.fill();
        x.lineWidth = (picked ? 3.5 : 2) * s; x.strokeStyle = c.ink; x.stroke(); x.restore();
        x.font = `700 ${26 * s}px "IBM Plex Sans Arabic"`; x.fillStyle = show && isAns ? '#fff' : c.amber; x.textAlign = 'center'; x.fillText(['أ', 'ب', 'ج'][k], XR - 34 * s, y + 42 * s);
        x.textAlign = 'right'; x.font = `400 ${31 * s}px "Amiri"`; x.fillStyle = show && isAns ? '#fff' : c.ink; x.fillText(o, XR - 72 * s, y + 43 * s);
        if (show && (isAns || picked)) { x.font = `700 ${34 * s}px "IBM Plex Sans Arabic"`; x.textAlign = 'left'; x.fillStyle = isAns ? '#fff' : '#b3472a'; x.fillText(isAns ? '✓' : '✗', XL + 26 * s, y + 44 * s); x.textAlign = 'right'; }
      }
      y += 76 * s;
    });
    y += 16 * s; x.font = `400 ${30 * s}px "Amiri"`; const wl = wrap(x, L.why, W - 60 * s), fh = (64 + wl.length * 50 + 34) * s;
    rec.flap = { x: XL, y, w: W, h: fh };
    if (draw) { x.save(); x.strokeStyle = c.rule; x.lineWidth = 2 * s; x.setLineDash([6 * s, 6 * s]); x.strokeRect(XL, y, W, fh); x.restore();
      x.font = `700 ${34 * s}px "Amiri"`; x.fillStyle = c.amber; x.fillText('لماذا؟', XR - 30 * s, y + 52 * s); x.font = `400 ${30 * s}px "Amiri"`; x.fillStyle = c.ink; wl.forEach((l, k) => x.fillText(l, XR - 30 * s, y + (104 + k * 50) * s)); }
    y += fh + 52 * s;
    if (draw) { x.font = `600 ${24 * s}px "IBM Plex Sans Arabic"`; x.fillStyle = c.muted; x.fillText('الدرس التفاعلي', XR, y); x.textAlign = 'left'; x.font = `700 ${30 * s}px "Aref Ruqaa"`; x.fillText('سَكينة', XL, y); x.textAlign = 'right'; }
    return { y, rec };
  };
  const h = layout(1, false).y, s = Math.min(1.3, (PH - 60) / h), out = layout(s, true);
  if (record) pageState[i] = out.rec;
  return out.rec;
}
function drawDiag(i, cv) {
  const L = LESSONS[i], S = SCENES[L.scene], x = cv.getContext('2d'), c = C();
  x.drawImage(PAPER_L, 0, 0); x.fillStyle = c.paperTint; x.fillRect(0, 0, PW, PH);
  x.direction = 'rtl'; x.textAlign = 'right';
  const XR = PW * .78, XL = 110;
  x.font = '600 27px "IBM Plex Sans Arabic"'; x.fillStyle = c.amber; x.fillText(`مخطط تفاعلي · ${L.kicker}`, XR, 112);
  x.font = '700 72px "Aref Ruqaa"'; x.fillStyle = c.ink; x.fillText(S.name, XR, 200);
  // hatched contact shadows printed under the models
  for (const [px, pz, rx, rz] of S.shadows) { x.save(); x.beginPath(); x.ellipse(px * PW + 18, pz * PH + 14, rx * PW, rz * PW, 0, 0, Math.PI * 2); x.clip(); x.strokeStyle = 'rgba(35,27,20,.35)'; x.lineWidth = 2;
    for (let k = -PW; k < PW; k += 11) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + PH, PH); x.stroke(); } x.restore(); }
  S.print?.(x);
  // printed leader lines and labels
  x.font = '700 34px "Amiri"';
  for (const [t, lx, lz, tx, tz] of S.labels) {
    const LX = lx * PW, LZ = lz * PH, TX = tx * PW, TZ = tz * PH, w = x.measureText(t).width;
    const right = LX > TX, ax = right ? LX - w - 14 : LX + w + 14, ay = LZ - 10;
    x.strokeStyle = c.ink; x.lineWidth = 2.2; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + TX) / 2, ay, TX, TZ); x.stroke();
    x.fillStyle = c.ink; x.beginPath(); x.arc(TX, TZ, 6, 0, Math.PI * 2); x.fill();
    x.textAlign = right ? 'right' : 'left'; x.fillText(t, LX, LZ); x.beginPath(); x.moveTo(LX, LZ + 10); x.lineTo(right ? LX - w : LX + w, LZ + 10); x.lineWidth = 1.5; x.stroke();
  }
  for (const [n, px, pz] of S.markers) { const X = px * PW, Y = pz * PH; x.strokeStyle = c.amber; x.lineWidth = 4; x.beginPath(); x.arc(X, Y, 30, 0, Math.PI * 2); x.stroke(); x.fillStyle = c.amber; x.font = '700 36px "IBM Plex Sans Arabic"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ar(n), X, Y + 2); x.textBaseline = 'alphabetic'; x.font = '600 20px "IBM Plex Sans Arabic"'; x.fillText('اضغط', X, Y + 56); }
  x.textAlign = 'center'; x.font = '600 24px "IBM Plex Sans Arabic"'; x.fillStyle = c.muted; x.fillText('اضغط على الأشكال المرقّمة، واسحب لتدوير الكتاب', (XL + XR) / 2, PH - 96);
}
function stampTexture(i) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), r = rnd(40 + i), col = '#b3472a';
  x.translate(256, 256); x.rotate(-.21); x.strokeStyle = col; x.fillStyle = col;
  x.lineWidth = 16; x.beginPath(); x.arc(0, 0, 228, 0, Math.PI * 2); x.stroke(); x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 196, 0, Math.PI * 2); x.stroke();
  x.textAlign = 'center'; x.direction = 'rtl'; x.font = '700 76px "Aref Ruqaa"'; x.fillText('أتممتَ', 0, -24); x.font = '700 64px "Amiri"'; x.fillText(LESSONS[i].kicker, 0, 70);
  x.font = '600 34px "IBM Plex Sans Arabic"'; x.fillText('سَكينة', 0, 150);
  x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(0,0,0,${r() * .6})`; x.fillRect((r() - .5) * 512, (r() - .5) * 512, 2 + r() * 5, 2 + r() * 3); }
  return canvasTex(c);
}

// flap (lift-the-flap answer), the stamp decal, the page-turn leaf
const flapPivot = new THREE.Group(); book.add(flapPivot);
const flapCanvas = document.createElement('canvas'); flapCanvas.width = 1024; flapCanvas.height = 300; const flapTex = canvasTex(flapCanvas);
const flapFront = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: flapTex, roughness: .9 }));
const flapBack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#efe4cf', roughness: .9, side: THREE.BackSide }));
flapFront.userData.hit = flapBack.userData.hit = 'flap'; flapFront.castShadow = true;
flapPivot.add(flapFront, flapBack);
function drawFlap(i) {
  const x = flapCanvas.getContext('2d'), locked = saved.answers[i] == null, c = C(), W = 1024, H = 300;
  x.fillStyle = '#f2e8d5'; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(120,90,50,.18)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = c.ink; x.lineWidth = 4; x.strokeRect(2, 2, W - 4, H - 4);
  x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = c.ink; x.font = '700 92px "Aref Ruqaa"'; x.fillText('لماذا؟', W / 2, H * .5);
  x.font = '600 34px "IBM Plex Sans Arabic"'; x.fillStyle = locked ? c.muted : c.amber; x.fillText(locked ? '🔒 اختر توقّعك أولاً، ثم ارفع الورقة' : '↑ ارفع الورقة لتقرأ الجواب', W / 2, H * .82);
  flapTex.needsUpdate = true;
}
function placeFlap(rec) {
  const w = rec.w / PW, h = rec.h / PW, x0 = rec.x / PW, z0 = rec.y / PW - .7;
  flapPivot.position.set(x0, PAGE_Y + .002, z0); flapPivot.rotation.set(0, 0, 0);
  for (const m of [flapFront, flapBack]) { m.geometry.dispose(); m.geometry = new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2).translate(w / 2, 0, h / 2); }
}
const stampMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
stampMesh.raycast = () => {}; book.add(stampMesh);
function placeStamp(i, rec, animate) {
  const sz = rec.stamp.r * 2.3 / PW; stampMesh.scale.set(sz, 1, sz); stampMesh.position.set(rec.stamp.x / PW, PAGE_Y + .0015, rec.stamp.y / PW - .7);
  if (!saved.stamps[i]) { stampMesh.material.opacity = 0; return; }
  stampMesh.material.map?.dispose(); stampMesh.material.map = stampTexture(i); stampMesh.material.needsUpdate = true;
  if (animate && !reduced) { stampMesh.material.opacity = 0; gsap.fromTo(stampMesh.scale, { x: sz * 1.8, z: sz * 1.8 }, { x: sz, z: sz, duration: .45, ease: 'back.out(2)' }); gsap.to(stampMesh.material, { opacity: .92, duration: .2 }); }
  else stampMesh.material.opacity = .92;
}
const leafPivot = new THREE.Group(); leafPivot.position.y = PAGE_Y + .004; leafPivot.visible = false; book.add(leafPivot);
const leafA = document.createElement('canvas'), leafB = document.createElement('canvas'); [leafA, leafB].forEach(c => { c.width = PW; c.height = PH; });
const leafATex = canvasTex(leafA), leafBTex = canvasTex(leafB); leafBTex.wrapS = THREE.RepeatWrapping; leafBTex.repeat.x = -1; leafBTex.offset.x = 1;
const leafGeo = new THREE.PlaneGeometry(1, 1.4, 24, 1).rotateX(-Math.PI / 2).translate(-.5, 0, 0), leafBase = leafGeo.attributes.position.array.slice();
leafPivot.add(new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ map: leafATex, roughness: .92, side: THREE.FrontSide })), new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ map: leafBTex, roughness: .92, side: THREE.BackSide })));
leafPivot.children.forEach(m => { m.castShadow = true; m.raycast = () => {}; });
function bendLeaf(p) { const a = leafGeo.attributes.position; for (let k = 0; k < a.count; k++) { const xx = leafBase[k * 3]; a.setY(k, Math.sin(p * Math.PI) * .09 * Math.pow(Math.max(0, -xx), 1.4)); } a.needsUpdate = true; leafGeo.computeVertexNormals(); }

// ---------- the whole book: the 46 printed pages in order, with a lesson spread before each chapter ----------
// A spread is what lies open on the desk: r = the right page (read first), l = the left page.
const BOOKTEXT = JSON.parse(document.getElementById('booktext').textContent);
const BUY = '../buy/';
const openBuy = () => { location.href = BUY; };
const pad = n => String(n).padStart(2, '0');
const PDF = n => ({ k: 'pdf', n });
const SECTIONS = [], SPREADS = [];
function section(id, kicker, title, pages, spreads, lesson) {
  const si = SECTIONS.length; SECTIONS.push({ id, kicker, title, pages, lesson, start: SPREADS.length });
  spreads.forEach(s => SPREADS.push({ sec: si, lesson, ...s }));
}
section('front', 'الغلاف', 'سَكينة', [1, 2, 3, 4, 5], [{ r: PDF(1), l: { k: 'endpaper' } }, { r: PDF(2), l: PDF(3) }, { r: PDF(4), l: PDF(5) }]);
section('intro', 'مقدمة', 'رسالة إلى من أتعبه الطريق', [6, 7, 8], [{ r: PDF(6), l: PDF(7) }, { r: PDF(8), l: { k: 'end' } }]);
LESSONS.forEach((L, i) => { const a = 9 + 3 * i; if (L.locked) { section('c' + (i + 1), L.kicker, L.title, [], [{ r: { k: 'locked', i }, l: { k: 'lockart', i } }]); SECTIONS[SECTIONS.length - 1].locked = i; return; } section('c' + (i + 1), L.kicker, L.title, [a, a + 1, a + 2], [{ r: { k: 'lesson', i }, l: { k: 'diag', i } }, { r: PDF(a), l: PDF(a + 1) }, { r: PDF(a + 2), l: { k: 'end' } }], i); });
section('end', 'الخاتمة', 'آخر الطريق', [45, 46], [{ r: PDF(45), l: PDF(46) }]);
const NS = SPREADS.length;
const isLesson = s => s.r.k === 'lesson';

// printed pages load on demand: the open spread first, then its neighbours
const IMG = {};
function pageImg(n) {
  if (!IMG[n]) { const im = new Image(), g = { im, ready: false }; g.p = new Promise(res => { im.onload = () => { g.ready = true; res(); }; im.onerror = () => res(); }); im.src = `pages/p-${pad(n)}.jpg`; IMG[n] = g; }
  return IMG[n];
}
const pdfOf = s => [s.r, s.l].filter(p => p.k === 'pdf').map(p => p.n);
const ensure = i => Promise.race([Promise.all(pdfOf(SPREADS[i]).map(n => pageImg(n).p)), new Promise(r => setTimeout(r, 6000))]);
function preload(i) { for (const k of [i + 1, i - 1, i + 2]) if (k >= 0 && k < NS) pdfOf(SPREADS[k]).forEach(pageImg); }

function endpaper(x) {
  const g = x.createRadialGradient(PW * .5, PH * .5, 40, PW * .5, PH * .5, PH * .85); g.addColorStop(0, '#1f3d35'); g.addColorStop(1, '#0c1d19');
  x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  x.strokeStyle = 'rgba(226,176,106,.16)'; x.lineWidth = 2;
  for (let r = 70; r < 980; r += 48) { x.beginPath(); x.ellipse(PW / 2, PH * .56, r, r * .42, 0, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = '#e2b06a'; x.beginPath(); x.arc(PW / 2, PH * .56, 9, 0, Math.PI * 2); x.fill();
  x.textAlign = 'center'; x.direction = 'rtl'; x.font = '700 96px "Aref Ruqaa"'; x.fillText('سَكينة', PW / 2, PH * .22);
  x.font = '400 40px "Amiri"'; x.fillStyle = 'rgba(243,233,216,.75)'; x.fillText('الكتاب كاملاً، صفحةً صفحة', PW / 2, PH * .22 + 80);
}
function fitFont(x, text, weight, size, family, maxW) { x.font = `${weight} ${size}px ${family}`; const w = x.measureText(text).width; if (w > maxW) { size = Math.floor(size * maxW / w); x.font = `${weight} ${size}px ${family}`; } return size; }
function endPage(x, si, c) {
  const sec = SECTIONS[si], nx = SECTIONS[si + 1], cx = PW / 2;
  x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = c.amber; x.font = '700 70px "Amiri"'; x.fillText('· · ·', cx, PH * .27);
  x.font = '600 32px "IBM Plex Sans Arabic"'; x.fillStyle = c.muted; x.fillText(sec.lesson == null ? 'انتهت المقدمة' : `انتهى ${sec.kicker}`, cx, PH * .36);
  x.fillStyle = c.ink; fitFont(x, sec.title, 700, 130, '"Aref Ruqaa"', PW - 300); x.fillText(sec.title, cx, PH * .45);
  if (sec.lesson != null) {
    const ok = saved.stamps[sec.lesson]; x.font = '400 40px "Amiri"'; x.fillStyle = ok ? '#b3472a' : c.muted;
    x.fillText(ok ? '✓ خُتم هذا الباب' : 'لم يُختم بعد: جرّب الأشكال في صفحة الدرس', cx, PH * .53);
  }
  if (nx) {
    x.strokeStyle = c.rule; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 160, PH * .62); x.lineTo(cx + 160, PH * .62); x.stroke();
    x.font = '600 30px "IBM Plex Sans Arabic"'; x.fillStyle = c.amber; x.fillText('التالي', cx, PH * .68);
    x.fillStyle = c.ink; fitFont(x, `${nx.kicker} · ${nx.title}`, 700, 66, '"Amiri"', PW - 260); x.fillText(`${nx.kicker} · ${nx.title}`, cx, PH * .74);
    x.font = '600 28px "IBM Plex Sans Arabic"'; x.fillStyle = c.muted; x.fillText('اضغط على هذه الصفحة لتقلبها', cx, PH * .8);
  }
}
// a locked chapter: its name, its one-line teaser, and the way to the full book
function lockedPage(x, i, c) {
  const L = LESSONS[i], cx = PW / 2;
  x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = '600 32px "IBM Plex Sans Arabic"'; x.fillStyle = c.amber; x.fillText(L.kicker, cx, PH * .2);
  x.fillStyle = c.ink; fitFont(x, L.title, 700, 150, '"Aref Ruqaa"', PW - 300); x.fillText(L.title, cx, PH * .3);
  x.font = '400 44px "Amiri"'; x.fillStyle = c.muted; wrap(x, L.tagline, PW - 360).forEach((l, k) => x.fillText(l, cx, PH * .37 + k * 64));
  const ly = PH * .52; x.strokeStyle = c.amber; x.lineWidth = 12; x.beginPath(); x.arc(cx, ly - 34, 46, Math.PI, 0); x.stroke();
  x.fillStyle = c.amber; x.beginPath(); x.roundRect(cx - 72, ly - 40, 144, 112, 18); x.fill();
  x.fillStyle = '#fbf3e4'; x.beginPath(); x.arc(cx, ly + 8, 14, 0, Math.PI * 2); x.fill(); x.fillRect(cx - 5, ly + 8, 10, 34);
  x.font = '400 42px "Amiri"'; x.fillStyle = c.ink; x.fillText('هذا الباب في النسخة الكاملة من الكتاب.', cx, PH * .64);
  const bw = 820, bh = 124, by = PH * .69; x.fillStyle = highContrast ? '#000' : '#a8661f'; x.beginPath(); x.roundRect(cx - bw / 2, by, bw, bh, 62); x.fill();
  x.fillStyle = '#fff8ec'; x.font = '700 48px "IBM Plex Sans Arabic"'; x.fillText('اقتنِ الكتاب كاملاً', cx, by + 78);
  x.font = '600 28px "IBM Plex Sans Arabic"'; x.fillStyle = c.muted; x.fillText('اضغط على الصفحة لتنتقل إلى صفحة الشراء', cx, by + bh + 62);
}
function lockArt(x, i, c) {
  const cx = PW / 2, cy = PH * .44;
  for (let k = 0; k < 9; k++) { const r = 60 + k * 62; x.strokeStyle = `rgba(168,102,31,${.5 - k * .05})`; x.lineWidth = 2.5; x.beginPath(); x.ellipse(cx, cy + 150, r, r * .3, 0, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = c.amber; x.beginPath(); x.arc(cx, cy + 150, 12, 0, Math.PI * 2); x.fill();
  x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = c.ink; x.font = '700 64px "Aref Ruqaa"'; x.fillText(LESSONS[i].title, cx, cy - 40);
  x.font = '600 32px "IBM Plex Sans Arabic"'; x.fillStyle = c.amber; x.fillText('في النسخة الكاملة', cx, PH * .7);
  ['الأبواب الاثنا عشر كاملة', 'تمرين عملي في آخر كل باب', 'درس تفاعلي وتجربة منبثقة لكل باب'].forEach((t, k) => { x.font = '400 42px "Amiri"'; x.fillStyle = c.ink; x.fillText(t, cx, PH * .76 + k * 64); });
}
// draws one page of a spread onto a canvas; side 1 = right page, -1 = left page
function drawPage(p, cv, side, si, record = true) {
  if (p.k === 'lesson') return drawText(p.i, cv, record);
  if (p.k === 'diag') { drawDiag(p.i, cv); return null; }
  const x = cv.getContext('2d'), c = C();
  x.save(); x.globalCompositeOperation = 'source-over'; x.drawImage(side > 0 ? PAPER_R : PAPER_L, 0, 0); x.fillStyle = c.paperTint; x.fillRect(0, 0, PW, PH);
  if (p.k === 'pdf') {
    const g = pageImg(p.n);
    if (g.ready) { x.globalCompositeOperation = 'multiply'; const w = PH * g.im.naturalWidth / g.im.naturalHeight; x.drawImage(g.im, (PW - w) / 2, 0, w, PH); }
    else { x.fillStyle = c.muted; x.font = '600 36px "IBM Plex Sans Arabic"'; x.textAlign = 'center'; x.direction = 'rtl'; x.fillText('تُحمَّل الصفحة…', PW / 2, PH / 2); g.p.then(() => { if (!turning && pdfOf(SPREADS[cur]).includes(p.n)) refreshPages(); }); }
  } else if (p.k === 'endpaper') endpaper(x);
  else if (p.k === 'end') endPage(x, si, c);
  else if (p.k === 'locked') lockedPage(x, p.i, c);
  else if (p.k === 'lockart') lockArt(x, p.i, c);
  x.restore();
  return null;
}

// ---------- spreads ----------
let cur = 0, S = null, popGroup = new THREE.Group(), done = new Set(), turning = false;
{ const k = saved.spread; if (Number.isInteger(k)) cur = clamp(k, 0, NS - 1); }
popGroup.position.y = PAGE_Y; book.add(popGroup);
const LI = () => SPREADS[cur].lesson;
function clearScene() {
  popGroup.traverse(o => { if (o.geometry && o.geometry !== leafGeo) o.geometry.dispose?.(); });
  book.remove(popGroup); popGroup = new THREE.Group(); popGroup.position.y = PAGE_Y; book.add(popGroup); S = null; done = new Set();
}
function buildScene(i) { clearScene(); S = SCENES[LESSONS[i].scene].build(popGroup); S.def = SCENES[LESSONS[i].scene]; }
function refreshPages({ right = true, left = true } = {}) {
  const s = SPREADS[cur];
  if (right) { const rec = drawPage(s.r, textCanvas, 1, s.sec); textTex.needsUpdate = true; if (isLesson(s)) { placeFlap(rec.flap); drawFlap(s.lesson); placeStamp(s.lesson, rec, false); } }
  if (left) { drawPage(s.l, diagCanvas, -1, s.sec); diagTex.needsUpdate = true; }
  flapPivot.visible = stampMesh.visible = isLesson(s);
  blinds.visible = !pdfOf(s).length;
}
function popUp() { popGroup.scale.set(1, .01, 1); gsap.to(popGroup.scale, { y: 1, duration: D(1.05), ease: 'back.out(1.5)' }); }
function foldDown() { return new Promise(r => gsap.to(popGroup.scale, { y: .01, duration: D(.35), ease: 'power2.in', onComplete: r })); }
const narrow = () => camera.aspect < .9;
function where(s) {
  if (isLesson(s)) return narrow() ? (focusSide === 'text' ? 'الدرس التفاعلي' : 'التجربة المنبثقة') : 'الدرس التفاعلي';
  if (s.r.k === 'locked') return 'في النسخة الكاملة';
  const ps = narrow() ? pdfOf({ r: focusSide === 'text' ? s.r : s.l, l: {} }) : pdfOf(s);
  return ps.length ? `صفحة ${ps.map(ar).join('–')} من ${ar(46)}` : '';
}
function updateHud() {
  const s = SPREADS[cur], sec = SECTIONS[s.sec], L = isLesson(s) ? LESSONS[s.lesson] : null, w = where(s);
  $('#tTitle').textContent = sec.title; $('#tSub').textContent = [sec.kicker, w].filter(Boolean).join(' · '); $('#chip').textContent = [sec.title, w].filter(Boolean).join(' · ');
  const atStart = cur === 0 && (!narrow() || focusSide === 'text'), atEnd = cur === NS - 1 && (!narrow() || focusSide === 'diag');
  $('#bPrev').disabled = atStart; $('#bNext').disabled = atEnd; $('#bPlay').disabled = !L;
  [...$('#toc').children].forEach((li, k) => { const b = li.firstChild, sc = SECTIONS[k]; b.setAttribute('aria-current', k === s.sec ? 'true' : 'false'); const st = b.querySelector('.s'); if (sc.lesson != null) { st.classList.toggle('done', !!saved.stamps[sc.lesson]); st.textContent = saved.stamps[sc.lesson] ? '✓' : ''; } });
  $('#reader').textContent = L ? `${L.kicker}: ${L.title}. ${L.tagline} ${L.core} القاعدة: ${L.principle}. سؤال: ${L.quiz.q} الخيارات: ${L.quiz.options.join('، ')}.` : `${sec.kicker}: ${sec.title}. ${w}. لقراءة النص بخط كبير اضغط زر «اقرأ».`;
  saved.spread = cur; persist();
}
async function goTo(i, side) {
  if (turning || i < 0 || i >= NS) return;
  if (i === cur) { if (side && side !== focusSide) { focusSide = side; resetView(); updateHud(); } return; }
  turning = true; stopDemo(); controls.enabled = false; closeFlap(true);
  const forward = i > cur, A = SPREADS[cur], B = SPREADS[i], si = B.sec, loaded = ensure(i);
  if (S) await foldDown();
  await loaded;
  if (side) focusSide = side;
  const finish = () => {
    leafPivot.visible = false; cur = i; refreshPages();
    if (isLesson(B)) { buildScene(B.lesson); popUp(); } else clearScene();
    turning = false; controls.enabled = true; updateHud(); preload(cur);
    if (narrow() || zoomed) resetView();
  };
  if (reduced) return finish();
  const lx = leafA.getContext('2d'), bx = leafB.getContext('2d');
  if (forward) { lx.drawImage(diagCanvas, 0, 0); drawPage(B.r, leafB, 1, si, false); drawPage(B.l, diagCanvas, -1, si); diagTex.needsUpdate = true; flapPivot.visible = false; stampMesh.visible = isLesson(A); }
  else { drawPage(B.l, leafA, -1, si); bx.drawImage(textCanvas, 0, 0); const rec = drawPage(B.r, textCanvas, 1, si); textTex.needsUpdate = true; if (isLesson(B)) { placeFlap(rec.flap); drawFlap(B.lesson); placeStamp(B.lesson, rec, false); } flapPivot.visible = false; stampMesh.visible = isLesson(B); }
  leafATex.needsUpdate = leafBTex.needsUpdate = true;
  leafPivot.visible = true; const st = { p: 0 };
  await new Promise(r => gsap.to(st, { p: 1, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { leafPivot.rotation.z = forward ? -Math.PI * st.p : -Math.PI * (1 - st.p); bendLeaf(st.p); }, onComplete: r }));
  finish();
}
// on a phone one page fills the screen, so «next» reads the right page, then the left, then turns the leaf
function nav(d) {
  if (turning) return;
  if (narrow()) {
    if (d > 0 && focusSide === 'text') { focusSide = 'diag'; resetView(); updateHud(); return; }
    if (d < 0 && focusSide === 'diag') { focusSide = 'text'; resetView(); updateHud(); return; }
    return goTo(cur + d, d > 0 ? 'text' : 'diag');
  }
  goTo(cur + d);
}

// ---------- the lesson's own interactions ----------
function markDone(id) {
  if (done.has(id)) return; done.add(id);
  const li = LI(), all = Object.keys(S.def.focus).every(k => done.has(k));
  if (all && !saved.stamps[li]) { saved.stamps[li] = true; persist(); placeStamp(li, pageState[li], true); toast(`خُتم ${LESSONS[li].kicker} ✓`); updateHud(); }
}
function trigger(id, obj) { if (!S || turning) return; const ok = S.on(id, obj); if (ok !== false) markDone(id); }
let flapOpen = false;
function closeFlap(instant) { flapOpen = false; gsap.killTweensOf(flapPivot.rotation); if (instant || reduced) flapPivot.rotation.x = 0; else gsap.to(flapPivot.rotation, { x: 0, duration: .5 }); }
function onFlap() {
  if (saved.answers[LI()] == null) { toast('اختر توقّعك أولاً'); if (!reduced) gsap.fromTo(flapPivot.rotation, { x: -.08 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' }); return; }
  if (flapOpen) return closeFlap();
  flapOpen = true; gsap.to(flapPivot.rotation, { x: -2.55, duration: D(.9), ease: 'power3.out' });
}
function onTextClick(uv, point) {
  const s = SPREADS[cur];
  if (s.r.k === 'locked') return openBuy();
  if (isLesson(s)) {
    const px = uv.x * PW, py = (1 - uv.y) * PH, li = s.lesson, rec = pageState[li];
    const opt = rec.options.find(r => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (opt) { saved.answers[li] = opt.k; persist(); refreshPages({ left: false }); toast(opt.k === LESSONS[li].quiz.answer ? 'توقّع صحيح. ارفع الورقة لتعرف لماذا' : 'ارفع الورقة لتعرف الجواب'); return; }
  }
  zoomTo(point);
}
function onLeftClick(point) { if (SPREADS[cur].l.k === 'lockart') return openBuy(); if (SPREADS[cur].l.k === 'end') { zoomed = false; nav(narrow() ? 1 : 1); } else zoomTo(point); }

// ---------- camera: home framing, reset, focus, guided demo ----------
let focusSide = 'text', zoomed = false, camBusy = false;
const DIR = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(57)), Math.cos(THREE.MathUtils.degToRad(57)));
function homeView() {
  const nr = narrow(), vfov = THREE.MathUtils.degToRad(camera.fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const halfW = nr ? .56 : 1.16, halfH = nr ? .66 : .7;
  const dist = Math.max(halfW / Math.tan(hfov / 2), halfH * .9 / Math.tan(vfov / 2)) * 1.06;
  const target = new THREE.Vector3(nr ? (focusSide === 'text' ? .5 : -.5) : 0, .06, .08);
  return { pos: target.clone().addScaledVector(DIR, dist), target };
}
function flyTo(pos, target, dur = 1.2) {
  camBusy = true; gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target);
  if (reduced || !dur) { camera.position.copy(pos); controls.target.copy(target); camBusy = false; controls.update(); return Promise.resolve(); }
  return new Promise(r => { gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: dur, ease: 'power2.inOut' }); gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration: dur, ease: 'power2.inOut', onComplete: () => { camBusy = false; r(); } }); });
}
function resetView() { zoomed = false; const h = homeView(); return flyTo(h.pos, h.target, 1.1); }
function zoomTo(point) { if (zoomed) return resetView(); zoomed = true; const t = point.clone(); t.y = .07; flyTo(t.clone().addScaledVector(DIR, .95), t, .9); }

let demoTl = null;
function startDemo() {
  if (!S) { toast('العرض متاح في صفحات الدروس التفاعلية'); return; }
  if (reduced) { toast('العرض المتحرك متوقف مع «حركة أقل»'); return; }
  if (turning) return; stopDemo(); controls.enabled = false; camBusy = true; setPlay(true);
  const f = S.def.focus, L = LESSONS[LI()], wp = k => popGroup.localToWorld(at(f[k][0], f[k][1], f[k][2]));
  const shots = [
    { t: new THREE.Vector3(-.5, .1, .02), o: new THREE.Vector3(-.3, 1.1, .95), cap: L.demo[0] },
    { t: wp('A'), o: new THREE.Vector3(.34, .24, .5), cap: L.demo[1], act: 'A' },
    { t: wp('B'), o: new THREE.Vector3(-.32, .22, .48), cap: L.demo[2], act: 'B' },
    { t: new THREE.Vector3(.5, .09, .05), o: new THREE.Vector3(0, 1.05, .75), cap: 'اقرأ الدرس… وتوقّع قبل أن تجرّب.' }
  ];
  demoTl = gsap.timeline({ onComplete: () => { stopDemo(); resetView(); } });
  shots.forEach(s => {
    const p = s.t.clone().add(s.o);
    demoTl.call(() => caption(s.cap));
    demoTl.to(camera.position, { x: p.x, y: p.y, z: p.z, duration: 2.4, ease: 'power2.inOut' });
    demoTl.to(controls.target, { x: s.t.x, y: s.t.y, z: s.t.z, duration: 2.4, ease: 'power2.inOut' }, '<');
    if (s.act) demoTl.call(() => trigger(s.act));
    demoTl.to({}, { duration: 2.6 });
  });
}
function stopDemo() { if (!demoTl) return; demoTl.kill(); demoTl = null; gsap.killTweensOf(camera.position); gsap.killTweensOf(controls.target); camBusy = false; controls.enabled = !turning; caption(null); setPlay(false); }
function setPlay(on) { $('#bPlay').setAttribute('aria-pressed', on); $('#bPlay').setAttribute('aria-label', on ? 'أوقف العرض' : 'شاهد العرض'); $('#playIcon').setAttribute('d', on ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5.5v13l11-6.5z'); }

// ---------- pointer: tell taps from drags ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
function pick(e) {
  const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
  const list = [popGroup, flapFront, flapBack, rightPage, leftPage];
  for (const h of ray.intersectObjects(list, true)) {
    if (h.object.userData.hit) { if (h.object.userData.hit === 'flap' && !flapPivot.visible) continue; return { kind: 'hit', id: h.object.userData.hit, obj: h.object, h }; }
    if (h.object.userData.page) return { kind: h.object.userData.page, h };
  }
  return null;
}
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (demoTl) stopDemo(); });
canvas.addEventListener('pointerup', e => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (moved > 7 || dt > 550 || turning || camBusy) return;
  const p = pick(e); if (!p) return;
  if (p.kind === 'hit') { if (p.id === 'flap') onFlap(); else { let o = p.obj; while (o.parent && o.parent !== popGroup) o = o.parent; trigger(p.id, o); } }
  else if (p.kind === 'text') onTextClick(p.h.uv, p.h.point);
  else if (p.kind === 'diag') onLeftClick(p.h.point);
});
canvas.addEventListener('pointermove', e => { if (e.buttons || e.pointerType !== 'mouse') return; const p = pick(e); canvas.style.cursor = p && (p.kind === 'hit' || (p.kind === 'diag' && ['end', 'lockart'].includes(SPREADS[cur].l.k)) || (p.kind === 'text' && SPREADS[cur].r.k === 'locked')) ? 'pointer' : 'grab'; });
controls.addEventListener('start', () => { if (demoTl) stopDemo(); });

// ---------- the large-print reader: a section's printed pages, full width, for phones ----------
let readSec = -1, readOpener = null;
function openReader(si) {
  readSec = si; const sec = SECTIONS[si], box = $('#readPages'); box.textContent = '';
  $('#readTitle').textContent = sec.title; $('#readSub').textContent = sec.pages.length ? `${sec.kicker} · صفحة ${ar(sec.pages[0])}–${ar(sec.pages[sec.pages.length - 1])} من ${ar(46)}` : `${sec.kicker} · في النسخة الكاملة`;
  sec.pages.forEach(n => { const im = document.createElement('img'); im.src = `pages/p-${pad(n)}.jpg`; im.alt = ''; im.setAttribute('aria-hidden', 'true'); im.loading = 'lazy'; im.width = 1400; im.height = 1984; box.append(im); });
  if (sec.locked != null) { const d = document.createElement('div'); d.className = 'buy'; const p = document.createElement('p'); p.textContent = `${sec.kicker}: ${sec.title}. ${LESSONS[sec.locked].tagline} هذا الباب في النسخة الكاملة من الكتاب.`; const a = document.createElement('a'); a.href = BUY; a.textContent = 'اقتنِ الكتاب كاملاً ←'; d.append(p, a); box.append(d); }
  const txt = document.createElement('div'); txt.className = 'sr-only'; (BOOKTEXT[sec.id] || []).forEach(l => { const p = document.createElement('p'); p.textContent = l; txt.append(p); }); box.append(txt);
  $('#rPrev').disabled = si === 0; $('#rNext').disabled = si === SECTIONS.length - 1;
  const r = $('#read'); if (r.hidden) readOpener = document.activeElement; r.hidden = false; r.scrollTop = 0; $('#rClose').focus();
}
function closeReader() {
  const r = $('#read'); if (r.hidden) return; r.hidden = true; $('#readPages').textContent = '';
  if (readSec !== SPREADS[cur].sec) goTo(SECTIONS[readSec].start + (SECTIONS[readSec].lesson != null ? 1 : 0), 'text');
  readOpener?.focus?.();
}
$('#bRead').onclick = () => openReader(SPREADS[cur].sec);
$('#rClose').onclick = closeReader;
$('#rPrev').onclick = () => openReader(readSec - 1);
$('#rNext').onclick = () => openReader(readSec + 1);

// ---------- HUD, drawer, toasts, captions ----------
let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
function caption(text) { const c = $('#caption'); if (!text) { c.hidden = true; return; } c.innerHTML = ''; c.append(text); const s = document.createElement('small'); s.textContent = 'المس الشاشة لإيقاف العرض'; c.append(s); c.hidden = false; }
$('#bNext').onclick = () => nav(1);
$('#bPrev').onclick = () => nav(-1);
$('#bPlay').onclick = () => demoTl ? stopDemo() : startDemo();
$('#bReset').onclick = () => { stopDemo(); resetView(); };
$('#bFocus').onclick = () => { focusSide = focusSide === 'text' ? 'diag' : 'text'; resetView(); updateHud(); };
const toc = $('#toc');
SECTIONS.forEach((sc, k) => { const li = document.createElement('li'), b = document.createElement('button'); b.innerHTML = `<span class="n"></span><span class="t"></span><span class="s" aria-hidden="true"></span>`; b.querySelector('.n').textContent = sc.kicker; b.querySelector('.t').textContent = sc.title; if (sc.locked != null) { b.querySelector('.s').textContent = '🔒'; b.querySelector('.s').classList.add('lock'); } else if (sc.lesson == null) b.querySelector('.s').style.visibility = 'hidden'; b.onclick = () => { openDrawer(false); goTo(sc.start, 'text'); }; li.append(b); toc.append(li); });
function openDrawer(open) { $('#drawer').classList.toggle('open', open); $('#drawer').setAttribute('aria-hidden', !open); $('#scrim').hidden = !open; if (open) toc.querySelector('[aria-current="true"]')?.focus(); else if ($('#drawer').contains(document.activeElement)) $('#bToc').focus(); }
$('#bToc').onclick = () => openDrawer(true); $('#scrim').onclick = () => openDrawer(false);
function setContrast(on) { highContrast = on; document.documentElement.dataset.contrast = on ? 'high' : ''; U_INK.value.set(on ? '#000000' : '#231b14'); LINE_MAT.color.set(on ? '#000000' : '#231b14'); $('#bContrast').setAttribute('aria-pressed', on); $('#sContrast').checked = on; refreshPages(); }
function setMotion(on) { reduced = on; $('#bMotion').setAttribute('aria-pressed', on); $('#sMotion').checked = on; if (on) { stopDemo(); popGroup.scale.y = 1; } }
$('#bContrast').onclick = () => setContrast(!highContrast); $('#sContrast').onchange = e => setContrast(e.target.checked);
$('#bMotion').onclick = () => setMotion(!reduced); $('#sMotion').onchange = e => setMotion(e.target.checked);
mq.addEventListener?.('change', e => setMotion(e.matches));
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#read').hidden) closeReader(); else if ($('#drawer').classList.contains('open')) openDrawer(false); else stopDemo(); return; }
  if (e.target.closest?.('.drawer') || !$('#read').hidden) return;
  if (e.key === 'ArrowLeft') nav(1); if (e.key === 'ArrowRight') nav(-1);
  if (e.key === ' ' && e.target === canvas) { e.preventDefault(); demoTl ? stopDemo() : startDemo(); }
});

// ---------- resize and loop ----------
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < .9 ? 44 : 38; camera.updateProjectionMatrix();
  if (!camBusy && !zoomed) { const v = homeView(); camera.position.copy(v.pos); controls.target.copy(v.target); }
  if (typeof cur === 'number' && SPREADS[cur]) updateHud();
}
addEventListener('resize', resize);
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime * (reduced ? .35 : 1);
  if (!camBusy && controls.enabled) controls.update();
  S?.update(t, dt);
  for (let k = sparks.length - 1; k >= 0; k--) { const s = sparks[k]; s.life += dt; const a = s.p.geometry.attributes.position; s.vel.forEach((v, j) => { v.y -= .3 * dt; a.setXYZ(j, a.getX(j) + v.x * dt, a.getY(j) + v.y * dt, a.getZ(j) + v.z * dt); }); a.needsUpdate = true; s.p.material.opacity = 1 - s.life / 1.4; if (s.life > 1.4) { scene.remove(s.p); s.p.geometry.dispose(); sparks.splice(k, 1); } }
  renderer.render(scene, camera); requestAnimationFrame(loop);
}

// ---------- start once the page fonts and the first pages are ready ----------
const fonts = ['700 100px "Aref Ruqaa"', '400 34px "Amiri"', '700 34px "Amiri"', '600 27px "IBM Plex Sans Arabic"', '400 27px "IBM Plex Sans Arabic"'];
await Promise.race([Promise.all(fonts.map(f => document.fonts.load(f, 'سكينة'))), new Promise(r => setTimeout(r, 4000))]);
await ensure(cur);
setMotion(reduced);
resize(); refreshPages(); if (isLesson(SPREADS[cur])) buildScene(SPREADS[cur].lesson); updateHud(); loop(); preload(cur);
$('#loader').hidden = true;
const h0 = homeView();
if (!reduced) { camera.position.copy(h0.target.clone().addScaledVector(DIR, 6.5)).add(new THREE.Vector3(0, 0, 1.2)); flyTo(h0.pos, h0.target, 2.2); }
if (S) popUp();
setTimeout(() => toast('نسخة مجانية: المقدمة والبابان الأول والثاني · السهم ← لتقلب الصفحة'), reduced ? 300 : 2300);
