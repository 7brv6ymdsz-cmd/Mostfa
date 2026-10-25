"use strict";
// 3D book shared by the home and sales pages: drag to turn it, touch the cover to drop a ripple on the lake.
window.mountSakinaBook = function(host, hint, opts){
  opts = opts || {};
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fallback = () => document.documentElement.classList.add('no3d');
  if (!window.THREE || !host) return fallback();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:true}); } catch(e){ return fallback(); }
  if (!renderer.getContext()) return fallback();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 0, opts.camZ || 7.6);
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
  const end = e => { if (!dragging) return; dragging = false; host.classList.remove('dragging'); if (moved < 6 && hitCover(e)) hint && (hint.style.opacity = .35); };
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
    if (opts.scrollSpin && !dragging) tY = idleY + Math.min(1, scrollY / (innerHeight * 1.2)) * Math.PI * 2;
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
};
