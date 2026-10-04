/* ======================================================================
   JARVIS ENTITY MARKUP
   ====================================================================== */
function blobPath(seed, amp, cx = 120, R = 44) {
  const r = mulberry32(seed), n = 8, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rad = R + (r() * 2 - 1) * amp; pts.push([cx + rad * Math.cos(a), cx + rad * Math.sin(a)]); }
  const P = i => pts[(i + n) % n], f = v => v.toFixed(2);
  let d = `M${f(P(0)[0])},${f(P(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}
function entityHTML(id) {
  const C = 120, pol = (r, a) => [C + r * Math.cos((a - 90) * Math.PI / 180), C + r * Math.sin((a - 90) * Math.PI / 180)];
  const f = v => v.toFixed(2);
  const arc = (r, a0, a1) => { const [x0, y0] = pol(r, a0), [x1, y1] = pol(r, a1); return `M${f(x0)},${f(y0)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)},${f(y1)}`; };
  // outer precision scale
  let ticks = '';
  for (let i = 0; i < 180; i++) { const a = i * 2, major = i % 15 === 0, mid = i % 5 === 0; const [x0, y0] = pol(major ? 106 : mid ? 109 : 111, a), [x1, y1] = pol(114, a);
    ticks += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke-width="${major ? 1.2 : .5}" opacity="${major ? .9 : mid ? .55 : .3}"/>`; }
  const deg = [0, 90, 180, 270].map(a => { const [x, y] = pol(100, a); return `<text class="ht hd" x="${f(x)}" y="${f(y + 2)}" text-anchor="middle" font-size="5.2" transform="rotate(${a} ${f(x)} ${f(y)})">${String(a).padStart(3, '0')}</text>`; }).join('');
  // segmented ring
  let seg = '';
  for (let i = 0; i < 36; i++) { const a0 = i * 10 + 1, a1 = a0 + (i % 3 === 0 ? 7 : 4); seg += `<path d="${arc(88, a0, a1)}" stroke-width="${i % 3 === 0 ? 2.4 : 1.2}" opacity="${i % 3 === 0 ? .85 : .45}"/>`; }
  // inner core scale
  let core = '';
  for (let i = 0; i < 48; i++) { const a = i * 7.5, [x0, y0] = pol(i % 4 === 0 ? 55 : 57, a), [x1, y1] = pol(59, a); core += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke-width="${i % 4 === 0 ? 1 : .5}" opacity=".6"/>`; }
  const tpR = 78;
  const label = 'AGENTIX AUTONOMOUS SOC · BANK US · WORKFORCE ONLINE · TELEMETRY LINKED · ';
  const shapes = [11, 23, 37, 51].map(sd => blobPath(sd, 5));
  const vals = [...shapes, shapes[0]].join(';');
  const anim = `<animate attributeName="d" dur="10s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" values="${vals}"/>`;
  const Cst = 2 * Math.PI * 99;
  const corner = (x, y, dx, dy) => `<path class="hs brk" stroke-width="1.3" d="M${x},${y + dy * 18} V${y} H${x + dx * 18}"/>`;
  const readout = (x, y, anchor, lbl, role, col) => `<g class="hd"><text class="ht" x="${x}" y="${y}" text-anchor="${anchor}" font-size="5.6" letter-spacing=".6">${lbl}</text>
    <text x="${x}" y="${y + 12}" text-anchor="${anchor}" font-size="11" font-weight="700" font-family="JetBrains Mono, monospace" fill="${col}" data-hud="${role}">--</text></g>`;
  return `<svg viewBox="0 0 240 240" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" aria-hidden="true">
    <defs>
      <radialGradient id="body-${id}" cx="38%" cy="32%" r="75%"><stop offset="0" style="stop-color:var(--e2)"/><stop offset=".5" style="stop-color:var(--e1)"/><stop offset="1" style="stop-color:var(--e3)"/></radialGradient>
      <linearGradient id="rim-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="sweep-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--e1)" stop-opacity="0"/><stop offset="1" style="stop-color:var(--e1)" stop-opacity=".28"/></linearGradient>
      <path id="tp-${id}" d="M${C},${C} m-${tpR},0 a${tpR},${tpR} 0 1,1 ${tpR * 2},0 a${tpR},${tpR} 0 1,1 -${tpR * 2},0"/>
    </defs>
    <g class="rot r-ticks hs">${ticks}${deg}</g>
    <circle class="hs" cx="${C}" cy="${C}" r="99" stroke-width=".4" opacity=".35"/>
    <g transform="rotate(-90 ${C} ${C})">
      <circle class="st-arc" data-hud="arc-p" cx="${C}" cy="${C}" r="99" stroke="#f59e0b" stroke-dasharray="0 ${Cst}"/>
      <circle class="st-arc" data-hud="arc-i" cx="${C}" cy="${C}" r="99" stroke="#3b82f6" stroke-dasharray="0 ${Cst}"/>
      <circle class="st-arc" data-hud="arc-r" cx="${C}" cy="${C}" r="99" stroke="#00c389" stroke-dasharray="0 ${Cst}"/>
    </g>
    <g class="rot r-seg hs">${seg}</g>
    <g class="rot r-sweep"><path d="M${C},${C} L${f(pol(92, -28)[0])},${f(pol(92, -28)[1])} A92,92 0 0 1 ${C},${C - 92} Z" fill="url(#sweep-${id})"/><line class="hs" x1="${C}" y1="${C}" x2="${C}" y2="${C - 92}" stroke-width=".8" opacity=".7"/></g>
    <g class="rot r-text hd"><text class="ht" font-size="5.4" letter-spacing="1.1"><textPath href="#tp-${id}">${label}${label}</textPath></text></g>
    <g class="rot r-orb1"><rect class="hf" x="${C - 2.5}" y="${C - 94.5}" width="5" height="5" transform="rotate(45 ${C} ${C - 92})"/></g>
    <g class="rot r-orb2"><circle class="hf" cx="${C}" cy="${C + 82}" r="2"/><circle class="hf" cx="${C - 82}" cy="${C}" r="1.4" opacity=".6"/></g>
    <g class="hs" stroke-width=".8" opacity=".6">${[0, 90, 180, 270].map(a => { const [x0, y0] = pol(62, a), [x1, y1] = pol(70, a); return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`; }).join('')}</g>
    <g class="rot r-core hs">${core}<path d="${arc(64, 20, 70)}" stroke-width="1.6"/><path d="${arc(64, 200, 250)}" stroke-width="1.6"/></g>
    <ellipse cx="${C}" cy="${C + 58}" rx="30" ry="3" fill="rgb(15 23 42)" opacity=".08"/>
    <path fill="url(#body-${id})">${anim}</path>
    <path fill="none" stroke="url(#rim-${id})" stroke-width="1">${anim}</path>
    <ellipse cx="${C - 15}" cy="${C - 17}" rx="13" ry="7" transform="rotate(-32 ${C - 15} ${C - 17})" fill="#fff" opacity=".55"/>
    <circle cx="${C - 21}" cy="${C - 9}" r="2" fill="#fff" opacity=".8"/>
  </svg>`;
}
function updateHUD() {
  if (!S) return;
  const n = { pending: 0, in_progress: 0, resolved: 0 }; S.cases.forEach(c => n[lifecycle(c)]++);
  ORBS.forEach(o => o.setStatus(n.pending, n.in_progress, n.resolved));
  const tot = S.cases.length || 1, Cst = 2 * Math.PI * 99, gap = 4;
  const done = (S.done || []).filter(d => d.t > Date.now() - 3600000).length;
  document.querySelectorAll('.jv').forEach(root => {
    const set = (k, v) => { const el = root.querySelector(`[data-hud="${k}"]`); if (el) el.textContent = String(v).padStart(2, '0'); };
    set('p', n.pending); set('i', n.in_progress); set('r', n.resolved); set('d', done);
    let off = 0;
    [['p', n.pending], ['i', n.in_progress], ['r', n.resolved]].forEach(([k, v]) => {
      const el = root.querySelector(`[data-hud="arc-${k}"]`); if (!el) return;
      const len = Math.max(0, v / tot * Cst - gap);
      el.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${Cst.toFixed(1)}`);
      el.setAttribute('stroke-dashoffset', (-off).toFixed(1));
      off += v / tot * Cst;
    });
  });
}
