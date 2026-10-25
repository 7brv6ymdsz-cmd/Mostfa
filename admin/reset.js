"use strict";
// Clears this device's encrypted admin data so a new PIN can be chosen — only after an explicit tap.
if (window.top !== window.self) { document.documentElement.hidden = true; throw new Error('framed'); }
const msg = document.getElementById('msg'), wipe = document.getElementById('wipe'), go = document.getElementById('go');
wipe.addEventListener('click', () => {
  let ok = true;
  try { localStorage.removeItem('sakina-admin-v1'); ok = localStorage.getItem('sakina-admin-v1') === null; } catch(_) { ok = false; }
  msg.textContent = ok ? 'تم مسح الرمز القديم. اكبس الزر تحت واختر رمزاً جديداً.'
                       : 'تعذّر المسح. تأكد أن Safari ليس في وضع التصفح الخاص، ثم أعد المحاولة.';
  wipe.hidden = ok; go.hidden = !ok;
});
