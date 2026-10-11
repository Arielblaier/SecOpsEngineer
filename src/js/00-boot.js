/* A ResizeObserver that changes layout in its own callback makes the browser report a harmless
   "ResizeObserver loop" error. It is not a failure, so it is stopped here before any error overlay sees it. */
window.addEventListener('error', e => { if (/ResizeObserver loop/.test(e.message || '')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

/* The case view is a full-screen overlay: keep it at body level so it shows from every screen */
(function () { const d = document.getElementById('case-drawer'); if (d && d.parentElement !== document.body) document.body.appendChild(d); })();