"use strict";
// Clears this device's encrypted admin data so a new PIN can be chosen.
let ok = true;
try { localStorage.removeItem('sakina-admin-v1'); ok = localStorage.getItem('sakina-admin-v1') === null; } catch(_) { ok = false; }
document.getElementById('msg').textContent = ok
  ? 'تم مسح الرمز القديم. اكبس الزر تحت واختر رمزاً جديداً.'
  : 'تعذّر المسح. تأكد أن Safari ليس في وضع التصفح الخاص، ثم أعد فتح هذه الصفحة.';
document.getElementById('go').hidden = !ok;
