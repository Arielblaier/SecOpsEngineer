
/* The case view is a full-screen overlay: keep it at body level so it shows from every screen */
(function () { const d = document.getElementById('case-drawer'); if (d && d.parentElement !== document.body) document.body.appendChild(d); })();