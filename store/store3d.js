/* رَفّ — interactive 3D hero: products float on the white canvas, hover to lift, click to open. */
(() => {
  'use strict';
  const host = document.getElementById('constellation');
  if (!host || !window.THREE) return;
  const T = window.THREE;

  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* ---------- Renderer / scene ---------- */
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.className = 'stage';
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.2, 16);
  camera.lookAt(0, 0, 0);

  scene.add(new T.HemisphereLight(0xffffff, 0xd9d2c8, 0.7));
  const sun = new T.DirectionalLight(0xffffff, 0.75);
  sun.position.set(-4, 9, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 8;
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(sun);
  const rim = new T.DirectionalLight(0xfff4e8, 0.35);
  rim.position.set(6, 2, -4);
  scene.add(rim);

  const floor = new T.Mesh(new T.PlaneGeometry(60, 30), new T.ShadowMaterial({ opacity: 0.09 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.1;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- Materials & builders ---------- */
  const lin = (c) => new T.Color(c).convertSRGBToLinear();
  const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: lin(c), roughness: 0.62, metalness: 0, ...o });
  const mesh = (g, m) => { const x = new T.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
  const lathe = (pts, m, seg = 64) => mesh(new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), seg), m);

  const build = {
    mug() {
      const g = new T.Group();
      const body = mat('#c96f4a', { roughness: 0.35 });
      g.add(lathe([[0, -0.6], [0.5, -0.6], [0.56, -0.5], [0.58, 0.55], [0.52, 0.6], [0.5, -0.45], [0, -0.45]], body));
      const h = mesh(new T.TorusGeometry(0.3, 0.075, 18, 48, Math.PI * 1.1), body);
      h.position.set(0.58, 0.02, 0); h.rotation.z = -Math.PI * 0.55;
      g.add(h);
      const coffee = mesh(new T.CircleGeometry(0.5, 48), mat('#4a2a1c', { roughness: 0.2 }));
      coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.42;
      g.add(coffee);
      return g;
    },
    vase() {
      return lathe([[0, -1], [0.42, -1], [0.62, -0.6], [0.66, -0.2], [0.5, 0.25], [0.24, 0.6], [0.22, 0.95], [0.3, 1.02], [0.26, 1.04], [0.18, 0.7], [0, 0.7]], mat('#b5806a', { roughness: 0.9 }));
    },
    candle() {
      const g = new T.Group();
      g.add(lathe([[0, -0.65], [0.55, -0.65], [0.6, -0.55], [0.6, 0.55], [0.55, 0.6], [0.53, -0.5], [0, -0.5]], mat('#efe8dc', { roughness: 0.15, transparent: true, opacity: 0.55 })));
      const wax = mesh(new T.CylinderGeometry(0.52, 0.52, 0.8, 48), mat('#d9c3a5', { roughness: 0.8 }));
      wax.position.y = -0.1; g.add(wax);
      const wick = mesh(new T.CylinderGeometry(0.015, 0.015, 0.14, 8), mat('#332f2d'));
      wick.position.y = 0.37; g.add(wick);
      const flame = new T.Mesh(new T.SphereGeometry(0.07, 16, 16), new T.MeshBasicMaterial({ color: lin('#f2b45c') }));
      flame.scale.set(1, 1.9, 1); flame.position.y = 0.52; g.add(flame);
      const glow = new T.PointLight('#ffb766', 0.6, 2.5);
      glow.position.y = 0.6; g.add(glow);
      g.userData.flame = flame;
      return g;
    },
    serum() {
      const g = new T.Group();
      g.add(lathe([[0, -0.75], [0.38, -0.75], [0.44, -0.66], [0.44, 0.3], [0.36, 0.42], [0.16, 0.48], [0.16, 0.56], [0, 0.56]], mat('#f4efe6', { roughness: 0.2 })));
      const cap = mesh(new T.CylinderGeometry(0.17, 0.17, 0.24, 32), mat('#b5806a', { roughness: 0.4 }));
      cap.position.y = 0.66; g.add(cap);
      const bulb = mesh(new T.SphereGeometry(0.14, 24, 24), mat('#b5806a', { roughness: 0.5 }));
      bulb.scale.y = 1.5; bulb.position.y = 0.94; g.add(bulb);
      const label = mesh(new T.CylinderGeometry(0.445, 0.445, 0.36, 48, 1, true), mat('#e8c9bb', { side: T.DoubleSide }));
      label.position.y = -0.18; g.add(label);
      return g;
    },
    plant() {
      const g = new T.Group();
      g.add(lathe([[0, -0.9], [0.38, -0.9], [0.5, -0.1], [0.56, -0.08], [0.56, 0], [0, 0]], mat('#c96f4a', { roughness: 0.85 })));
      const leaf = mat('#7d8466', { roughness: 0.7 });
      const leaves = [[0, 0.62, 0, 0], [-0.26, 0.46, 0.05, 0.5], [0.28, 0.44, -0.04, -0.55], [0.06, 0.4, 0.26, -0.15], [-0.08, 0.42, -0.25, 0.2]];
      leaves.forEach(([x, y, z, r]) => {
        const l = mesh(new T.SphereGeometry(0.2, 24, 24), leaf);
        l.scale.set(0.55, 1.6, 0.55); l.position.set(x, y, z); l.rotation.z = r;
        g.add(l);
      });
      return g;
    },
    headphones() {
      const g = new T.Group();
      const dark = mat('#1d1b1a', { roughness: 0.45 });
      const band = mesh(new T.TorusGeometry(0.72, 0.07, 18, 64, Math.PI), dark);
      band.position.y = -0.05; g.add(band);
      [-0.72, 0.72].forEach((x) => {
        const cup = mesh(new T.CylinderGeometry(0.3, 0.3, 0.22, 40), dark);
        cup.rotation.z = Math.PI / 2; cup.position.set(x, -0.3, 0); g.add(cup);
        const pad = mesh(new T.TorusGeometry(0.22, 0.08, 16, 40), mat('#665a54', { roughness: 0.9 }));
        pad.rotation.y = Math.PI / 2; pad.position.set(x * 0.86, -0.3, 0); g.add(pad);
      });
      return g;
    },
    speaker() {
      const g = new T.Group();
      const body = mesh(new T.CylinderGeometry(0.48, 0.48, 1.3, 48), mat('#332f2d', { roughness: 0.75 }));
      g.add(body);
      const grill = mesh(new T.CylinderGeometry(0.485, 0.485, 0.9, 48, 1, true), mat('#665a54', { roughness: 1, side: T.DoubleSide }));
      grill.position.y = -0.1; g.add(grill);
      const top = mesh(new T.CylinderGeometry(0.3, 0.3, 0.02, 40), mat('#d9c3a5'));
      top.position.y = 0.66; g.add(top);
      return g;
    },
  };

  // product id ↔ 3D model, placed as fractions of the visible width
  const ITEMS = [
    { id: 7, kind: 'serum', fx: -0.86, y: 0.35, s: 1.05, phone: false },
    { id: 1, kind: 'mug', fx: -0.56, y: -0.55, s: 1.15, phone: true },
    { id: 6, kind: 'headphones', fx: -0.24, y: 0.85, s: 1.1, phone: true },
    { id: 11, kind: 'vase', fx: 0.06, y: -0.3, s: 1.1, phone: true },
    { id: 10, kind: 'candle', fx: 0.36, y: 0.75, s: 1.05, phone: false },
    { id: 5, kind: 'plant', fx: 0.6, y: -0.45, s: 1.15, phone: true },
    { id: 17, kind: 'speaker', fx: 0.88, y: 0.4, s: 0.95, phone: false },
  ];

  const world = new T.Group();
  scene.add(world);
  const pickables = [];
  ITEMS.forEach((it, i) => {
    const holder = new T.Group();
    const model = build[it.kind]();
    model.traverse((o) => { if (o.isMesh) { o.userData.item = it; pickables.push(o); } });
    model.rotation.y = i * 0.9;
    holder.add(model);
    holder.userData = { it, model, phase: i * 1.37, lift: 0, base: it.s };
    world.add(holder);
    it.holder = holder;
  });

  /* ---------- Layout ---------- */
  let W = 1, H = 1, phone = false, visibleW = 10;
  const layout = () => {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    phone = W < 560;
    visibleW = 2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    const shown = ITEMS.filter((it) => !phone || it.phone);
    const scale = T.MathUtils.clamp(visibleW / 17, 0.8, 1.5);
    ITEMS.forEach((it) => {
      const on = !phone || it.phone;
      it.holder.visible = on;
      if (!on) return;
      const fx = phone ? [-0.72, -0.24, 0.24, 0.72][shown.indexOf(it)] : it.fx;
      it.holder.position.set(fx * visibleW * 0.46, it.y * (phone ? 0.7 : 1), 0);
      it.holder.userData.base = it.s * scale * (phone ? 1.35 : 1);
    });
    if (reduce) render();
  };

  /* ---------- Interaction ---------- */
  const tip = document.createElement('div');
  tip.className = 'stage-tip';
  tip.setAttribute('aria-hidden', 'true');
  const ray = new T.Raycaster();
  const ndc = new T.Vector2(9, 9);
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  let hovered = null;
  const products = window.raff?.products;

  const pick = () => {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables.filter((m) => m.userData.item.holder.visible), false)[0];
    return hit ? hit.object.userData.item : null;
  };
  const setHover = (it, cx, cy) => {
    hovered = it;
    host.classList.toggle('is-hover', !!it);
    if (it && products) {
      const p = products.get(it.id);
      tip.innerHTML = `<b>${p.name}</b><span>${p.store} · ${window.raff.money(p.price)}</span>`;
      tip.style.transform = `translate(${cx}px, ${cy}px)`;
      tip.classList.add('show');
    } else tip.classList.remove('show');
  };
  const toLocal = (e) => {
    const r = host.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  host.addEventListener('pointermove', (e) => {
    const [x, y] = toLocal(e);
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    look.tx = ndc.x; look.ty = ndc.y;
    if (e.pointerType === 'mouse') setHover(pick(), x, y);
    if (reduce) render();
  });
  host.addEventListener('pointerleave', () => { ndc.set(9, 9); look.tx = look.ty = 0; setHover(null); if (reduce) render(); });
  host.addEventListener('click', (e) => {
    const [x, y] = toLocal(e);
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    const it = pick();
    if (it && window.raff) window.raff.open(it.id);
  });
  // parallax from page scroll on touch devices
  if (!fine) addEventListener('scroll', () => { look.ty = -Math.min(1, scrollY / 400); }, { passive: true });

  /* ---------- Loop ---------- */
  const clock = new T.Clock();
  let running = false, raf = 0;
  const render = () => renderer.render(scene, camera);
  const tick = () => {
    const t = clock.getElapsedTime();
    look.x += (look.tx - look.x) * 0.06;
    look.y += (look.ty - look.y) * 0.06;
    world.rotation.y = look.x * 0.18;
    world.rotation.x = -look.y * 0.08;
    world.children.forEach((h) => {
      const u = h.userData;
      const target = hovered === u.it ? 1 : 0;
      u.lift += (target - u.lift) * 0.12;
      h.position.y = u.it.y * (phone ? 0.7 : 1) + Math.sin(t * 0.9 + u.phase) * 0.12 + u.lift * 0.25;
      const s = u.base * (1 + u.lift * 0.12);
      h.scale.setScalar(s);
      u.model.rotation.y += 0.004 + u.lift * 0.02;
      u.model.rotation.z = Math.sin(t * 0.7 + u.phase) * 0.06;
      const fl = u.model.userData.flame;
      if (fl) fl.scale.y = 1.9 + Math.sin(t * 11 + u.phase) * 0.18;
    });
    render();
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!running && !reduce) { running = true; clock.getDelta(); raf = requestAnimationFrame(tick); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  /* ---------- Mount ---------- */
  host.classList.add('is-3d');
  host.append(renderer.domElement, tip);
  const hint = document.createElement('p');
  hint.className = 'stage-hint';
  hint.textContent = fine ? 'حرّك الماوس · اضغط على أي منتج' : 'اضغط على أي منتج';
  host.append(hint);

  new ResizeObserver(layout).observe(host);
  layout();
  if (reduce) { world.children.forEach((h) => h.scale.setScalar(h.userData.base)); render(); }
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
})();
