"use strict";
// Private sales ledger. Everything lives encrypted (AES-GCM, key from the PIN via PBKDF2)
// in this browser's localStorage; nothing is sent anywhere.
const STORE = 'sakina-admin-v1', ITER = 310000, IDLE_MS = 10 * 60 * 1000;
const $ = id => document.getElementById(id);
const ar = s => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const money = n => ar((Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0)) + '$';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

let key = null, salt = null, state = {sales: [], fees: {pct: 5.4, fix: 0.30}};
let filter = 'all', confirmId = null, idleTimer = null, fails = 0, lockedUntil = 0;

function readStore(){ try { return JSON.parse(localStorage.getItem(STORE)); } catch(_) { return null; } }
async function deriveKey(pin, saltBytes){
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt: saltBytes, iterations: ITER, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function save(){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify(state)));
  try { localStorage.setItem(STORE, JSON.stringify({v:1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct)})); }
  catch(_) { toast('تعذّر الحفظ على هذا الجهاز. تأكد أن Safari ليس في وضع التصفح الخاص.'); }
}
function toast(msg){ const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2600); }

// ----- lock screen -----
const stored = readStore(), setup = !stored;
if (setup){
  $('lockMsg').textContent = 'أول مرة؟ اختر رمزاً سرياً من ٦ أرقام أو أكثر. لا يمكن استرجاعه إن نسيته.';
  $('pin2').hidden = false; $('lockBtnSubmit').textContent = 'إنشاء الرمز';
  $('pin').setAttribute('autocomplete', 'new-password');
}
if (!window.crypto?.subtle){ $('lockErr').textContent = 'هذا المتصفح لا يدعم التشفير. افتح الصفحة في Safari حديث.'; $('lockErr').hidden = false; $('lockBtnSubmit').disabled = true; }

$('lockForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('lockErr'), pin = $('pin').value;
  if (Date.now() < lockedUntil){ err.textContent = 'محاولات كثيرة. انتظر ' + ar(Math.ceil((lockedUntil - Date.now())/1000)) + ' ثانية.'; err.hidden = false; return; }
  $('lockBtnSubmit').disabled = true;
  try {
    if (setup){
      if (pin.length < 6){ throw new Error('الرمز قصير. استعمل ٦ أرقام أو أكثر.'); }
      if (pin !== $('pin2').value){ throw new Error('الرمزان غير متطابقين.'); }
      salt = crypto.getRandomValues(new Uint8Array(16));
      key = await deriveKey(pin, salt); await save();
    } else {
      salt = unb64(stored.salt);
      const k = await deriveKey(pin, salt);
      try {
        const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv: unb64(stored.iv)}, k, unb64(stored.ct));
        state = JSON.parse(new TextDecoder().decode(pt)); key = k;
      } catch(_) {
        fails++; if (fails >= 5){ lockedUntil = Date.now() + 30000 * Math.pow(2, fails - 5); }
        throw new Error('الرمز غير صحيح.');
      }
    }
    $('pin').value = $('pin2').value = ''; err.hidden = true; fails = 0;
    $('lock').hidden = true; $('topbar').hidden = false; $('app').hidden = false;
    $('feePct').value = state.fees.pct; $('feeFix').value = state.fees.fix;
    render(); bumpIdle();
  } catch(ex){ err.textContent = ex.message; err.hidden = false; }
  $('lockBtnSubmit').disabled = false;
});

function lock(){ key = null; state = {sales: [], fees: {pct: 5.4, fix: 0.30}}; location.reload(); }
function bumpIdle(){ clearTimeout(idleTimer); idleTimer = setTimeout(lock, IDLE_MS); }
['pointerdown','keydown','scroll'].forEach(ev => addEventListener(ev, () => { if (key) bumpIdle(); }, {passive:true}));
document.addEventListener('visibilitychange', () => { if (document.hidden && key){ clearTimeout(idleTimer); idleTimer = setTimeout(lock, 60000); } });
$('lockBtn').addEventListener('click', lock);

// ----- dashboard -----
$('fDate').value = new Date().toISOString().slice(0,10);
const feeOf = a => a > 0 ? a * state.fees.pct / 100 + state.fees.fix : 0;

function render(){
  const sales = [...state.sales].sort((a,b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  const gross = sales.reduce((s,x) => s + (+x.amount || 0), 0);
  const fee = sales.reduce((s,x) => s + feeOf(+x.amount || 0), 0);
  const since = Date.now() - 30*864e5;
  const net30 = sales.filter(x => new Date(x.date).getTime() >= since).reduce((s,x) => s + (+x.amount||0) - feeOf(+x.amount||0), 0);
  const pending = sales.filter(x => !x.sent).length;
  $('tBuyers').textContent = ar(sales.length);
  $('tGross').textContent = money(gross);
  $('tFees').textContent = money(fee);
  $('tFeesSub').textContent = ar(state.fees.pct) + '% + ' + money(state.fees.fix) + ' لكل دفعة';
  $('tNet').textContent = money(gross - fee);
  $('tNet30').textContent = 'آخر ٣٠ يوماً: ' + money(net30);
  $('tPending').textContent = ar(pending);
  $('tPendingTile').classList.toggle('alert', pending > 0);

  const days = [...Array(30)].map((_,i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - 29 + i); return d; });
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const counts = days.map(d => sales.filter(x => x.date === iso(d)).length);
  const max = Math.max(4, ...counts), W = 600, H = 180, pad = 22, bw = (W - pad) / 30;
  let g = '';
  for (let k = 0; k <= 4; k++){ const v = Math.round(max * k / 4), y = H - 18 - (H - 30) * v / max;
    g += `<line class="grid" x1="${pad}" x2="${W}" y1="${y}" y2="${y}"/><text x="0" y="${y + 3}">${ar(v)}</text>`; }
  counts.forEach((c,i) => { const h = Math.max(2, (H - 30) * c / max), x = pad + i*bw + 2;
    g += `<rect class="bar${c ? '' : ' zero'}" x="${x}" y="${H - 18 - h}" width="${bw - 4}" height="${h}" rx="2"><title>${ar(iso(days[i]))}: ${ar(c)}</title></rect>`;
    if (i % 5 === 0 || i === 29) g += `<text x="${x}" y="${H - 4}">${ar(days[i].getDate())}/${ar(days[i].getMonth()+1)}</text>`; });
  $('chart').innerHTML = g;

  const q = $('search').value.trim().toLowerCase();
  const list = sales.filter(x => (filter === 'all' || (filter === 'sent') === !!x.sent) &&
    (!q || (x.name||'').toLowerCase().includes(q) || (x.email||'').toLowerCase().includes(q)));
  $('rows').innerHTML = list.map(x => `<tr>
      <td>${ar(esc(x.date))}</td>
      <td>${esc(x.name) || '—'}${x.txn ? `<br><small style="color:var(--faint);direction:ltr;display:inline-block">${esc(x.txn)}</small>` : ''}</td>
      <td class="email">${esc(x.email)}</td>
      <td>${money(+x.amount || 0)}</td>
      <td><span class="status ${x.sent ? 'sent' : 'pending'}">${x.sent ? 'أُرسل الكتاب' : 'لم يُرسَل'}</span></td>
      <td><div class="row-actions">
        <button class="btn sm" data-copy="${esc(x.email)}">نسخ البريد</button>
        <button class="btn sm" data-toggle="${esc(x.id)}">${x.sent ? 'تراجع' : 'تمّ الإرسال'}</button>
        ${confirmId === x.id ? `<span class="confirm">حذف؟ <button class="btn sm" data-del="${esc(x.id)}">نعم</button><button class="btn sm" data-cancel>لا</button></span>`
          : `<button class="btn sm" data-ask="${esc(x.id)}">حذف</button>`}
      </div></td></tr>`).join('');
  const empty = $('empty');
  empty.hidden = list.length > 0;
  empty.innerHTML = sales.length ? '<b>لا نتائج</b>جرّب بحثاً أو تصفية أخرى.' : '<b>لا توجد مبيعات بعد</b>عند أول دفعة تصلك، سجّلها من النموذج وستظهر هنا مع أرباحك.';
}

document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
  filter = b.dataset.f; document.querySelectorAll('.seg button').forEach(o => o.setAttribute('aria-pressed', o === b)); render(); }));
$('search').addEventListener('input', render);

$('rows').addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t || !key) return;
  if (t.dataset.copy !== undefined){
    try { await navigator.clipboard.writeText(t.dataset.copy); toast('نُسخ البريد'); } catch(_) { toast(t.dataset.copy); }
    return;
  }
  if (t.dataset.toggle){ const s = state.sales.find(x => x.id === t.dataset.toggle); if (s){ s.sent = !s.sent; await save(); toast(s.sent ? 'سُجّل أن الكتاب أُرسل' : 'أُعيدت إلى «لم يُرسَل»'); } }
  else if (t.dataset.ask){ confirmId = t.dataset.ask; }
  else if (t.dataset.cancel !== undefined){ confirmId = null; }
  else if (t.dataset.del){ state.sales = state.sales.filter(x => x.id !== t.dataset.del); confirmId = null; await save(); toast('حُذفت البيعة'); }
  render();
});

$('addForm').addEventListener('submit', async e => {
  e.preventDefault(); if (!key) return;
  const name = $('fName').value.trim(), email = $('fEmail').value.trim(), amount = parseFloat($('fAmount').value), date = $('fDate').value;
  const bad = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('بريد صحيح');
  if (!(amount >= 0)) bad.push('مبلغ');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) bad.push('تاريخ');
  if (bad.length){ $('fErr').textContent = 'أكمل: ' + bad.join('، '); $('fErr').hidden = false; return; }
  $('fErr').hidden = true;
  state.sales.push({id: crypto.randomUUID(), name: name.slice(0,120), email: email.slice(0,200), amount, date,
    txn: $('fTxn').value.trim().slice(0,40), sent: $('fSent').value === '1', createdAt: new Date().toISOString()});
  await save();
  ['fName','fEmail','fTxn'].forEach(id => $(id).value = ''); $('fAmount').value = 5; $('fSent').value = '0';
  toast('حُفظت البيعة'); render();
});

['feePct','feeFix'].forEach(id => $(id).addEventListener('change', async () => {
  state.fees = {pct: Math.max(0, +$('feePct').value || 0), fix: Math.max(0, +$('feeFix').value || 0)};
  if (key) await save(); render();
}));

function download(name, text, type){
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const today = () => new Date().toISOString().slice(0,10);

$('exportBtn').addEventListener('click', () => {
  if (!key) return;
  const head = ['date','name','email','amount_usd','paypal_fee_est','net','book_sent','paypal_txn'];
  const cell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g,'""') + '"'; };
  const lines = state.sales.map(x => [x.date, x.name, x.email, (+x.amount).toFixed(2), feeOf(+x.amount).toFixed(2), (+x.amount - feeOf(+x.amount)).toFixed(2), x.sent ? 'yes' : 'no', x.txn].map(cell).join(','));
  download('sakina-sales-' + today() + '.csv', '﻿' + [head.join(','), ...lines].join('\n'), 'text/csv;charset=utf-8');
});

// encrypted backup: the same ciphertext as on this device, safe to keep in Files or iCloud
$('backupBtn').addEventListener('click', () => {
  const s = localStorage.getItem(STORE); if (!s || !key) return;
  download('sakina-admin-backup-' + today() + '.json', s, 'application/json');
  toast('حُفظت نسخة مشفّرة. احتفظ بها في مكان آمن.');
});
$('restoreFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || d.v !== 1 || !d.salt || !d.iv || !d.ct) throw 0;
    localStorage.setItem(STORE, JSON.stringify({v:1, iter: d.iter || ITER, salt: d.salt, iv: d.iv, ct: d.ct}));
    toast('استُعيدت النسخة. أدخل رمزها السري.'); setTimeout(lock, 1200);
  } catch(_) { toast('هذا الملف ليس نسخة احتياطية صالحة.'); }
});
