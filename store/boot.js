/* Runs in <head> before first paint: inner pages (#/…) skip painting the home hero, so nothing jumps. */
(function () {
  var h = location.hash;
  if (h.indexOf('#/') === 0 && h.length > 2) document.documentElement.classList.add('route-page');
})();
