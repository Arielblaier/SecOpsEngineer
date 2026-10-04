/* ======================================================================
   HERO: the Agentic Workforce, four sides of one liquid core
   ====================================================================== */
const HERO_POS = { analyst: [500, 180], engineer: [850, 400], hunter: [500, 620], intel: [150, 400] };   // N, E, S, W
if (window.ResizeObserver) setTimeout(() => { const sc = document.getElementById('home-scroll'); if (sc) new ResizeObserver(() => setHomeHeight()).observe(sc); }, 0);
const HERO_STATS = { analyst: [147, 'investigations'], engineer: [23, 'new detections'], hunter: [38, 'hunts'], intel: [6, 'threat groups'] };
const HERO_LBL = { analyst: 'right', engineer: 'below', hunter: 'right', intel: 'below' };
const HERO_REL_ALL = [
  { a: 'analyst', b: 'engineer', d: 'M500,180 L790,180 Q850,180 850,240 L850,400', lx: 850, ly: 292, n: 17, t: 'rules to tune', s: 'Josh asked Maya to tune 16 noisy rules',
    items: ['Suspicious PowerShell download · 38% false positives', 'Impossible travel · VPN egress noise', 'Rare service creation · SCCM installers', '+13 more rules'], out: 'Maya tuned all 16. Issue volume is down 18% this week.' },
  { a: 'hunter', b: 'engineer', d: 'M500,620 L790,620 Q850,620 850,560 L850,400', lx: 850, ly: 540, n: 9, t: 'hunts → rules', s: '10 of Tom’s hunts became detection rules',
    items: ['Office apps launching LOLBins', 'Dormant admin accounts waking up', 'Risky OAuth grants in Microsoft 365', '+7 more hunts'], out: 'Maya deployed 8 of them; 2 are in review.' },
  { a: 'intel', b: 'analyst', d: 'M150,400 L150,240 Q150,180 210,180 L500,180', lx: 150, ly: 292, n: 13, t: 're-investigations', s: 'Avi’s research sent 15 old cases back to Josh',
    items: ['FIN7 help-desk campaign · 9 cases', 'BlackSuit ESXi tooling · 4 cases', 'Citrix CVE-2026-1234 · 2 cases'], out: '3 of them turned out malicious and were contained.' },
  { a: 'intel', b: 'hunter', d: 'M150,400 L150,560 Q150,620 210,620 L500,620', lx: 150, ly: 520, n: 11, t: 'IOC sweeps', s: 'Avi asks Tom to sweep for new indicators, every night',
    items: ['FIN7 help-desk indicators · 14 IOCs · nightly', 'BlackSuit ESXi tooling · 9 IOCs · nightly', 'Citrix exploit traffic · 5 IOCs · twice a day'], out: '11 sweeps this week across 4,812 endpoints. One hit became a case for Josh.' },
  { a: 'hunter', b: 'analyst', d: 'M500,620 C235,590 235,210 500,180', lx: 330, ly: 283, n: 3, t: 'escalated', s: 'Tom escalated 2 hunts to Josh as cases',
    items: ['Word launching mshta.exe on FIN-WS-12', 'svc_legacy signing in at 03:12 from an unmanaged laptop'], out: 'Josh confirmed both as malicious.' }
];
const HERO_REL = SINGLE ? [] : HERO_REL_ALL;
function heroRelTip(i) { const r = HERO_REL[i], A = PILLARS[r.a], B = PILLARS[r.b]; return `<div class="flex items-center gap-2">${agentAv(A, 22, false)}${ic('arrow-right', 'w-3.5 h-3.5 text-ink3')}${agentAv(B, 22, false)}</div><div class="text-[15px] font-bold text-ink mt-2 leading-snug">${esc(r.s)}</div><ul class="mt-2 space-y-1">${r.items.map(x => `<li class="flex gap-2 text-[13px] text-ink2"><span style="color:${A.col}">•</span>${esc(x)}</li>`).join('')}</ul>`; }
function renderHero(animate, o = {}) {
  const lite = !!o.lite;
  const done = PILLAR_KEYS.reduce((a, k) => a + pillarStats(k).done, 0), need = S.tasks.length;
  if (!lite) $('home-sub').innerHTML = `While you were away, ${SINGLE ? '<b class="text-ink">Josh</b>' : 'your <b class="text-ink">Agentic Workforce</b>'} completed <b class="text-ink">${done} tasks</b>. <b class="c-amber">${need} decision${need === 1 ? '' : 's'}</b> need you.`;
  const C = [500, 400], R = 150;
  const defs = PILLAR_KEYS.map(k => { const P = PILLARS[k]; return `
    <radialGradient id="hb-${k}" cx="36%" cy="28%" r="80%"><stop offset="0" stop-color="${P.c2}"/><stop offset=".45" stop-color="${P.col}"/><stop offset="1" stop-color="${P.dark}"/></radialGradient>
    <radialGradient id="hg-${k}"><stop offset="0" stop-color="${P.col}" stop-opacity=".55"/><stop offset="1" stop-color="${P.col}" stop-opacity="0"/></radialGradient>
    <linearGradient id="hr-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.c2}"/><stop offset=".6" stop-color="${P.col}" stop-opacity=".8"/><stop offset="1" stop-color="${P.col}" stop-opacity="0"/></linearGradient>`; }).join('')
    + HERO_REL.map((r, i) => `<linearGradient id="hrel${i}" gradientUnits="userSpaceOnUse" x1="${HERO_POS[r.a][0]}" y1="${HERO_POS[r.a][1]}" x2="${HERO_POS[r.b][0]}" y2="${HERO_POS[r.b][1]}"><stop offset="0" stop-color="${PILLARS[r.a].col}"/><stop offset="1" stop-color="${PILLARS[r.b].col}"/></linearGradient>`).join('')
    + `<filter id="hglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  // 1 · the frame (the four sides), faint
  const frame = `<rect x="150" y="180" width="700" height="440" rx="60" class="frame" pathLength="1" fill="none" stroke="rgb(129 140 248 / .14)" stroke-width="1.2" style="--d:.3s"/>`;
  const frameOut = SINGLE ? '' : frame;
  // 2 · each agent arrives along a tendril from the core
  const tend = PILLAR_KEYS.map((k, i) => {
    const [x, y] = HERO_POS[k], dx = x - C[0], dy = y - C[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    return `<line x1="${C[0] + ux * R}" y1="${C[1] + uy * R}" x2="${x - ux * 44}" y2="${y - uy * 44}" class="tend" pathLength="1" stroke="${PILLARS[k].col}" stroke-width="1.6" stroke-dasharray="1" stroke-linecap="round" opacity=".55" style="--d:${1.4 + i * .7}s"/>`;
  }).join('');
  const agents = PILLAR_KEYS.map((k, i) => {
    const P = PILLARS[k], [x, y] = HERO_POS[k], [n, cap] = HERO_STATS[k], side = HERO_LBL[k];
    const lx = side === 'right' ? 40 : 0, ly = side === 'right' ? -12 : 44, anchor = side === 'right' ? 'start' : 'middle', pw = 150;
    if (lite) return `<g transform="translate(${x},${y})"><g class="hag" style="--d:${3.05 + i * .7}s">
      <svg x="-29" y="-29" width="58" height="58" viewBox="${ROBOT_VB}" overflow="visible">${robotInner(ROBOT_COL[k][0], ROBOT_COL[k][1], true, ROBOT_COL[k][2], true, true)}</svg>
      <g transform="translate(${lx},${side === 'right' ? -4 : 44})"><rect x="${side === 'right' ? -8 : -pw / 2}" y="-16" width="${pw}" height="${side === 'right' ? 40 : 40}" rx="12" fill="#0b1030" fill-opacity=".86"/>
        <text text-anchor="${anchor}" font-family="Lato, sans-serif"><tspan font-size="15" font-weight="800" fill="#fff">${P.name}</tspan></text>
        <text y="16" text-anchor="${anchor}" font-family="Lato, sans-serif" font-size="11.5" fill="rgb(255 255 255 / .55)">${P.title}</text></g></g></g>`;
    return `<g transform="translate(${x},${y})"><g class="hag" style="--d:${3.05 + i * .7}s" onclick="homeSend('Tell me about ${P.name}')">
      <svg x="-29" y="-29" width="58" height="58" viewBox="${ROBOT_VB}" overflow="visible">${robotInner(ROBOT_COL[k][0], ROBOT_COL[k][1], true, ROBOT_COL[k][2], true, true)}</svg>
      <g transform="translate(${lx},${ly})">
        <rect x="${side === 'right' ? -8 : -pw / 2}" y="-16" width="${pw}" height="${side === 'right' ? 52 : 54}" rx="12" fill="#0b1030" fill-opacity=".86"/>
        <text text-anchor="${anchor}" font-family="Lato, sans-serif"><tspan font-size="15" font-weight="800" class="fill-ink">${P.name}</tspan><tspan dx="6" font-size="11.5" class="fill-ink3">${P.title}</tspan></text>
        <text y="21" text-anchor="${anchor}" font-family="Lato, sans-serif"><tspan font-size="15" font-weight="900" fill="${P.col}" data-count="${n}" data-delay="${2300 + i * 700}">${animate ? 0 : n}</tspan><tspan dx="5" font-size="12" class="fill-ink2">${cap}</tspan></text>
      </g></g></g>`;
  }).join('');
  // 3 · the relations draw in, one at a time, each with its label on the line
  const rels = HERO_REL.map((r, i) => `<path id="hrp${i}" d="${r.d}" class="frame" pathLength="1" fill="none" stroke="url(#hrel${i})" stroke-width="2.2" filter="url(#hglow)" style="--d:${4.8 + i * 1}s"/>
    ${lite ? `<path d="${r.d}" fill="none" stroke="transparent" stroke-width="18" style="cursor:help" ${tipAttr(heroRelTip(i))}/>` : `<path d="${r.d}" fill="none" stroke="transparent" stroke-width="18" style="cursor:help" onmouseenter="heroTip(${i},event)" onmousemove="heroTip(${i},event)" onmouseleave="heroTip(-1)"/>`}`).join('');
  const flows = HERO_REL.map((r, i) => `<g class="flow" style="--d:${6 + i * 1}s">${[0, .33, .66].map(o => `<circle r="2.8" fill="${PILLARS[r.a].c2}" filter="url(#hglow)"><animateMotion dur="3.8s" begin="${o * 3.8}s" repeatCount="indefinite"><mpath href="#hrp${i}"/></animateMotion></circle>`).join('')}</g>`).join('');
  const labels = lite ? HERO_REL.map((r, i) => { const w = 28 + r.t.length * 6.8; return `<g class="lbl" style="--d:${5.6 + i * 1}s;cursor:help" transform="translate(${r.lx},${r.ly})" ${tipAttr(heroRelTip(i))}>
      <rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="#0b1030" stroke="${PILLARS[r.a].col}" stroke-opacity=".75"/>
      <text text-anchor="middle" y="5" font-family="Lato, sans-serif" font-size="12.5" font-weight="700" fill="#e7ecff">${r.t}</text></g>`; }).join('') : (() => { return HERO_REL.map((r, i) => { const w = 34 + r.t.length * 6.6 + (r.n >= 10 ? 10 : 0); return `<g class="lbl" style="--d:${5.6 + i * 1}s;cursor:help" transform="translate(${r.lx},${r.ly})" onmouseenter="heroTip(${i},event)" onmousemove="heroTip(${i},event)" onmouseleave="heroTip(-1)">
      <rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="#0b1030" stroke="${PILLARS[r.a].col}" stroke-opacity=".75"/>
      <text text-anchor="middle" y="5" font-family="Lato, sans-serif"><tspan font-size="14" font-weight="900" fill="${PILLARS[r.a].c2}" data-count="${r.n}" data-delay="${5800 + i * 1000}">${animate ? 0 : r.n}</tspan><tspan dx="5" font-size="12.5" font-weight="700" fill="#e7ecff">${r.t}</tspan></text></g>`; }).join(''); })();
  // droplets pinch off the core, travel out and become each agent; then small drops keep carrying work out
  const births = PILLAR_KEYS.map((k, i) => {
    const [x, y] = HERO_POS[k], dx = x - C[0], dy = y - C[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const sx = C[0] + ux * 50, sy = C[1] + uy * 50, d = 1.5 + i * .7;
    return `<circle class="bulge" cx="${sx}" cy="${sy}" r="34" fill="#1fcf86" style="--d:${d}s"/>
      <circle class="drop" cx="${sx}" cy="${sy}" r="26" fill="#1fcf86" style="--d:${d}s;--dx:${(x - sx).toFixed(1)}px;--dy:${(y - sy).toFixed(1)}px"/>
      <circle class="work" cx="${sx}" cy="${sy}" r="6" fill="${ROBOT_COL[k][1]}" style="--d:${8 + i * 1.6}s;--dx:${(x - ux * 30 - sx).toFixed(1)}px;--dy:${(y - uy * 30 - sy).toFixed(1)}px"/>`;
  }).join('');
  const goo = `<filter id="hgoo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"/></filter>`;
  const svg = $(o.svg || 'hero-svg'), pf = o.pfx || '';
  const px = h => pf ? h.replace(/(id="|url\(#|href="#)(h[a-z]+)/g, `$1${pf}$2`) : h;
  svg.innerHTML = px(`<defs>${defs}</defs>${frameOut}${tend}${rels}${flows}${agents}${labels}`);
  const gl = $(o.goo || 'hero-goo');
  gl.innerHTML = px(`<defs>${goo}</defs><g filter="url(#hgoo)" opacity=".92"><circle cx="${C[0]}" cy="${C[1]}" r="80" fill="#1fcf86"><animate attributeName="r" values="78;83;78" dur="5s" repeatCount="indefinite"/></circle>${births}</g>`);
  if (animate) { [svg, gl].forEach(x => x.classList.remove('go', 'now')); requestAnimationFrame(() => requestAnimationFrame(() => { svg.classList.add('go'); gl.classList.add('go'); countUpIn(svg); })); }
  else [svg, gl].forEach(x => x.classList.add('go', 'now'));
}
function countUpIn(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const to = +el.dataset.count, delay = +(el.dataset.delay || 300);
    setTimeout(() => { const t0 = performance.now(); const stp = now => { const k = Math.min(1, (now - t0) / 1900), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(stp); }; requestAnimationFrame(stp); }, delay);
  });
}
function heroTip(i, e) {
  const tip = $('hero-tip'); if (!tip) return;
  if (i < 0) { tip.classList.add('hidden'); return; }
  const r = HERO_REL[i], A = PILLARS[r.a], B = PILLARS[r.b];
  if (tip.dataset.i !== String(i)) {
    tip.innerHTML = `<div class="flex items-center gap-2">${agentAv(A, 22, false)}${ic('arrow-right', 'w-3.5 h-3.5 text-ink3')}${agentAv(B, 22, false)}<span class="hm-label !text-[11px] ml-1">WHAT HAPPENED</span></div>
      <div class="text-[15px] font-bold text-ink mt-2 leading-snug">${esc(r.s)}</div>
      <ul class="mt-2 space-y-1">${r.items.map(x => `<li class="flex gap-2 text-[13px] text-ink2"><span style="color:${A.col}">•</span>${esc(x)}</li>`).join('')}</ul>
      <div class="mt-2.5 pt-2.5 border-t border-indigo-400/20 text-[13px] text-ink flex gap-2">${ic('check', 'w-4 h-4 c-cx shrink-0 mt-[1px]')}${esc(r.out)}</div>`;
    tip.dataset.i = i; icons();
  }
  const box = $('home-hero').getBoundingClientRect();
  let x = e.clientX - box.left + 16, y = e.clientY - box.top + 16;
  if (x + 330 > box.width) x = e.clientX - box.left - 336; if (y + 220 > box.height) y = e.clientY - box.top - 230;
  tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.remove('hidden');
}
function heroTilt(e) {
  const svg = $('hero-svg'), orb = $('hero-orb-wrap'); if (!svg) return;
  if (!e) { svg.style.transform = ''; orb.style.transform = 'translate(-50%,-50%)'; return; }
  const r = $('home-hero').getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  svg.style.transform = `perspective(1400px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`; const gg = $('hero-goo'); if (gg) gg.style.transform = svg.style.transform;
  orb.style.transform = `translate(calc(-50% + ${x * 18}px), calc(-50% + ${y * 14}px))`;
}
function setHomeHeight() { const sc = $('home-scroll'); if (sc) $('view-home').style.setProperty('--hmH', sc.clientHeight + 'px'); }
window.addEventListener('resize', setHomeHeight);
function homeNextFrom(btn) {
  const sc = $('home-scroll'); let target;
  if (!btn) target = $('home-thread').firstElementChild;
  else { const w = btn.closest('[data-mi]'); target = w && w.nextElementSibling; }
  if (target) sc.scrollTo({ top: sc.scrollTop + target.getBoundingClientRect().top - sc.getBoundingClientRect().top, behavior: 'smooth' });
}

const HOME_CTX = {
  hero: ['Show my team', 'What did Tom find?', 'Why did Avi reopen 15 cases?'],
  top: ['What’s most urgent?', 'Tell me more about svc_legacy', 'Show the benign cases Josh closed'],
  news: ['Tell me more about FIN7', 'Are we exposed to the Citrix CVE?', 'What is BlackSuit after?'],
  observe: ['Why is issue volume down?', 'Which assets are riskiest?', 'Where are we slowest?'],
  needs: ['Why this decision?', 'What happens if I wait?', 'Tell me more']
};
function homeWhere() {
  const sc = $('home-scroll'); if (!sc) return 'hero';
  if (sc.scrollTop < $('home-hero').offsetHeight * .55) return 'hero';
  const mid = sc.getBoundingClientRect().top + sc.clientHeight * .45;
  let at = 'top';
  document.querySelectorAll('#home-thread [data-mi]').forEach(w => { const m = S.home.msgs[+w.dataset.mi]; if (m && m.sec && w.getBoundingClientRect().top < mid) at = m.type; });
  return at;
}
function renderHomeChips() {
  const where = homeWhere(); if (S._chipWhere === where && $('home-chips').children.length) return; S._chipWhere = where;
  const list = (HOME_CTX[where] || HOME_CTX.hero).filter(c => !SINGLE || !/\b(Maya|Tom|Avi)\b|team/i.test(c));
  $('home-chips').innerHTML = (S.tasks.length && where !== 'needs' ? `<button onclick="startHomeCatchup()" class="px-3 py-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 text-[12.5px] c-amber font-semibold">${S.tasks.length} decisions</button>` : '')
    + list.map(c => `<button onclick="homeSend(${JSON.stringify(c).replace(/"/g, '&quot;')})" class="px-3 py-1.5 rounded-full border border-line bg-panel text-[12.5px] text-ink2 hover:text-ink hover:border-cx">${esc(c)}</button>`).join('')
    + (where !== 'hero' ? `<button onclick="homeSend('View my workforce')" class="px-3 py-1.5 rounded-full border border-line bg-panel text-[12.5px] text-ink3 hover:text-ink">View my workforce</button>` : '');
  $('home-chips').classList.remove('hide');
}
setTimeout(() => { const sc = document.getElementById('home-scroll'); if (sc) sc.addEventListener('scroll', () => { clearTimeout(S._chipT); S._chipT = setTimeout(renderHomeChips, 120); }, { passive: true }); }, 0);