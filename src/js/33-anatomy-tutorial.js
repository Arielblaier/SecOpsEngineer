/* ======================================================================
   ANATOMY OF AN AUTONOMOUS INVESTIGATION (tutorial page)
   ====================================================================== */
const AN_EVENTS = [
  { x: 90, t: '09:00', n: 'Browser exploit', why: 'opened the case', sev: 'high', st: 'Initial access' },
  { x: 230, t: '09:07', n: 'Unusual child process', why: 'same host', sev: 'high', st: 'Execution' },
  { x: 400, t: '09:20', n: 'C2 beaconing', why: 'same process', sev: 'crit', st: 'Command & control' },
  { x: 560, t: '09:42', n: 'Same page on WS-14', why: 'same URL', sev: 'med', st: 'Initial access' },
  { x: 720, t: '10:15', n: 'Credential access attempt', why: 'same user', sev: 'high', st: 'Credential access' },
  { x: 880, t: '11:30', n: 'Beacon from Lab-Runner-04', why: 'same C2 IP', sev: 'crit', st: 'Command & control' }
];
const AN_INFO = [{ x: 160, t: '09:03', n: 'Rare user agent' }, { x: 470, t: '09:31', n: 'New DNS domain' }, { x: 640, t: '10:02', n: 'Login from new device' }];
const AN_PB = [['Endpoint Enrichment', 70, '14s'], ['Process Lineage', 110, '38s'], ['IP Reputation', 40, '6s'], ['URL Detonation', 150, '2m 10s'], ['Identity Enrichment', 60, '11s'], ['Block C2 IP', 30, '3s']];
const anSevCol = s0 => s0 === 'crit' ? '#e11d48' : s0 === 'high' ? '#f97316' : '#f59e0b';
function anAxis(y) {
  return `<line x1="50" x2="950" y1="${y}" y2="${y}" stroke="rgb(129 140 248 / .35)" stroke-width="1.5"/>
    ${AN_EVENTS.map((e, i) => `<g class="a" style="--d:${.2 + i * .5}s"><polygon points="${e.x},${y - 13} ${e.x + 11},${y + 6} ${e.x - 11},${y + 6}" fill="${anSevCol(e.sev)}"/><text x="${e.x}" y="${y + 3}" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">!</text>
      <text x="${e.x}" y="${y + 24}" text-anchor="middle" font-size="11" fill="rgb(255 255 255 / .55)" font-family="JetBrains Mono, monospace">${e.t}</text></g>`).join('')}`;
}
function anCh1() {
  const y = 300, bx = 330, by = 20;
  const sevT = { crit: 'Critical', high: 'High', med: 'Medium' };
  const rows = AN_EVENTS.map((e, i) => {
    const ry = by + 50 + i * 22;
    return `<g class="fly" style="--d:${.5 + i * .6}s;--fx:${e.x - (bx + 20)}px;--fy:${y - ry}px"><polygon points="${bx + 20},${ry - 6} ${bx + 26},${ry + 4} ${bx + 14},${ry + 4}" fill="${anSevCol(e.sev)}"/>
      <text x="${bx + 34}" y="${ry + 3}" font-size="12.5" fill="#e7ecff" font-family="Lato, sans-serif">${e.n}</text>
      <text x="${bx + 330}" y="${ry + 3}" text-anchor="end" font-size="11" fill="${i ? '#5eead4' : '#fbbf24'}" font-family="Lato, sans-serif">${e.why}</text></g>`; }).join('');
  // attack stages over the timeline
  const stages = [['Initial access', 60, 200], ['Execution', 200, 320], ['Command & control', 320, 640], ['Credential access', 640, 800], ['Spread', 800, 950]];
  const stg = stages.map(([n, a, b], i) => `<g class="a" style="--d:${.3 + i * .5}s"><rect x="${a + 4}" y="${y + 40}" width="${b - a - 8}" height="22" rx="6" fill="rgb(244 63 94 / ${.06 + i * .03})" stroke="rgb(244 63 94 / .35)"/><text x="${(a + b) / 2}" y="${y + 55}" text-anchor="middle" font-size="10.5" fill="#fecdd3" font-family="Lato, sans-serif">${n}</text></g>`).join('');
  const info = AN_INFO.map((e, i) => `<g class="a" style="--d:${.6 + i * .9}s"><circle cx="${e.x}" cy="${y}" r="7" fill="#0b1030" stroke="#94a3b8" stroke-width="1.5"/><text x="${e.x}" y="${y + 3.5}" text-anchor="middle" font-size="9" font-weight="900" fill="#cbd5e1" font-family="Lato, sans-serif">i</text>
      <text x="${e.x}" y="${y - 16}" text-anchor="middle" font-size="9.5" fill="#94a3b8" font-family="Lato, sans-serif">${e.n}</text></g>`).join('');
  const leg = `<g font-family="Lato, sans-serif" font-size="10.5" fill="rgb(255 255 255 / .55)">${[['crit', 'Critical'], ['high', 'High'], ['med', 'Medium']].map(([k, l], i) => `<polygon points="${720 + i * 76},${by + 4} ${727 + i * 76},${by + 16} ${713 + i * 76},${by + 16}" fill="${anSevCol(k)}"/><text x="${732 + i * 76}" y="${by + 15}">${l}</text>`).join('')}<circle cx="${955}" cy="${by + 10}" r="6" fill="#0b1030" stroke="#94a3b8"/><text x="${952}" y="${by + 13.5}" font-size="8.5" font-weight="900" fill="#cbd5e1">i</text><text x="${965}" y="${by + 15}" text-anchor="start">Info</text></g>`;
  return `<svg viewBox="0 0 1000 380" class="w-full h-auto">
    ${anAxis(y)}${info}${stg}${leg}
    <g class="a" style="--d:.35s"><rect x="${bx}" y="${by}" width="340" height="${50 + AN_EVENTS.length * 22 + 10}" rx="16" fill="rgb(28 36 78 / .55)" stroke="rgb(129 140 248 / .45)"/>
      <text x="${bx + 20}" y="${by + 28}" font-size="15" font-weight="800" fill="#fff" font-family="Lato, sans-serif">Case #555548</text>
      <text x="${bx + 320}" y="${by + 28}" text-anchor="end" font-size="11.5" fill="rgb(255 255 255 / .5)" font-family="Lato, sans-serif">grouped by shared logic</text></g>
    ${rows}
    <text x="50" y="${y - 30}" font-size="11" fill="rgb(255 255 255 / .4)" font-family="Lato, sans-serif" letter-spacing="1.5">ATTACK TIMELINE</text>
  </svg>`;
}
function anLanes(withAgent) {
  const yI = 50, yA = 126, yJ = 196, yH = withAgent ? 266 : 196, end = 950, H = withAgent ? 300 : 230;
  const lab = (y, t) => `<text x="50" y="${y - 22}" font-size="11" fill="rgb(255 255 255 / .45)" letter-spacing="1.5" font-family="Lato, sans-serif">${t}</text><line x1="50" x2="${end}" y1="${y}" y2="${y}" stroke="rgb(129 140 248 / .14)"/>`;
  let o = lab(yI, 'ISSUES') + lab(yA, 'AUTOMATION · PLAYBOOKS') + (withAgent ? lab(yJ, 'JOSH') : '') + lab(yH, 'HUMAN ANALYST')
    + AN_EVENTS.map((e, i) => `<g class="pop" style="--d:${.2 + i * .45}s"><polygon points="${e.x},${yI - 11} ${e.x + 9},${yI + 5} ${e.x - 9},${yI + 5}" fill="${anSevCol(e.sev)}"/></g>`).join('');
  const seg = (x1, x2, y, col, label, d, dash, fs) => `<rect class="gx" style="--d:${d}s" x="${x1}" y="${y - 11}" width="${x2 - x1}" height="22" rx="6" fill="${col}" ${dash ? 'stroke="rgb(255 255 255 / .3)" stroke-dasharray="4 4" fill-opacity=".12"' : ''}/>${label ? `<text class="a" style="--d:${d + .3}s" x="${x1 + 7}" y="${y + 4}" font-size="${fs || 11}" fill="#fff" font-family="Lato, sans-serif">${label}</text>` : ''}`;
  const pill = (x, y, txt, bg, fg, d) => `<g class="pop" style="--d:${d}s"><rect x="${x - txt.length * 3.4 - 12}" y="${y - 12}" width="${txt.length * 6.8 + 24}" height="24" rx="12" fill="${bg}"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${fg}" font-family="Lato, sans-serif">${txt}</text></g>`;
  // every issue triggers its own playbook; each one takes a different time
  o += AN_EVENTS.map((e, i) => { const [n, w, dur] = AN_PB[i], y = yA + (i % 2 ? 13 : -13), tw = Math.round(n.length * 5.4 + 12), bw = Math.max(w, tw);
    return `<rect class="gx" style="--d:${.3 + i * .45}s" x="${e.x}" y="${y - 9}" width="${bw}" height="18" rx="5" fill="#334155" stroke="#64748b"/><text class="a" style="--d:${.5 + i * .45}s" x="${e.x + 6}" y="${y + 3.5}" font-size="9.5" fill="#e2e8f0" font-family="Lato, sans-serif">${n}</text><text class="a" style="--d:${.6 + i * .45}s" x="${e.x + bw + 5}" y="${y + 3.5}" font-size="9.5" fill="#94a3b8" font-family="Lato, sans-serif">${dur}</text>`; }).join('');
  if (!withAgent) {
    const x = (x0, d) => `<g class="pop" style="--d:${d}s"><circle cx="${x0}" cy="${yH}" r="11" fill="#e11d48"/><path d="M${x0 - 4},${yH - 4} l8,8 M${x0 + 4},${yH - 4} l-8,8" stroke="#fff" stroke-width="2"/></g>`;
    o += seg(90, 300, yH, '#64748b', 'In queue', .4, true) + seg(300, 392, yH, '#3b82f6', 'Investigates', 1.4) + x(400, 1.5)
      + seg(410, 552, yH, '#3b82f6', 'Starts over', 1.9) + x(560, 2.0) + seg(570, 700, yH, '#f59e0b', 'Skims', 2.4)
      + pill(745, yH, 'Verdict', '#e11d48', '#fff', 2.9)
      + `<g class="a" style="--d:3.2s"><circle cx="880" cy="${yH}" r="10" fill="none" stroke="rgb(255 255 255 / .35)" stroke-dasharray="3 3"/></g>`;
  } else {
    o += `<rect class="gx" style="--d:.35s" x="90" y="${yJ - 11}" width="${end - 90}" height="22" rx="11" fill="url(#anJosh)"/>
      <text class="a" style="--d:.7s" x="100" y="${yJ + 4}" font-size="11" font-weight="700" fill="#04261a" font-family="Lato, sans-serif">Investigates</text>
      ${AN_EVENTS.slice(1).map((e, i) => `<g class="pop" style="--d:${.65 + (i + 1) * .45}s"><circle cx="${e.x}" cy="${yJ}" r="10" fill="#04261a" stroke="#4DFFA6" stroke-width="2"/><path d="M${e.x - 4},${yJ} l3,3 l6,-6" stroke="#4DFFA6" stroke-width="2" fill="none"/></g>`).join('')}
      ${pill(330, yJ - 30, 'Verdict · 3 min', '#e11d48', '#fff', 1.1)}
      <line x1="90" x2="${end}" y1="${yH}" y2="${yH}" stroke="rgb(255 255 255 / .12)" stroke-width="10" stroke-linecap="round" class="a" style="--d:.5s"/>
      <line class="a" style="--d:1.5s" x1="300" x2="300" y1="${yJ + 14}" y2="${yH - 14}" stroke="#4DFFA6" stroke-opacity=".5" stroke-dasharray="3 4"/>
      ${pill(345, yH, 'You approve', '#4DFFA6', '#04261a', 1.6)}`;
  }
  return `<svg viewBox="0 0 1000 ${H}" class="w-full h-auto"><defs><linearGradient id="anJosh" x1="0" x2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#4DFFA6"/></linearGradient></defs>${o}</svg>`;
}
const AN_H = [['H1', 'It’s a real attack', '#f43f5e', .92], ['H2', 'It’s an approved security test', '#f59e0b', .12], ['H3', 'It’s benign software behavior', '#22d3ee', .08]];
const AN_Q = [
  ['Did Edge actually run the exploit?', 'Yes', [[0, 1], [2, -1]]],
  ['Did Edge start a process it never should?', 'Yes', [[0, 1], [2, -1]]],
  ['Is the process talking to attacker infrastructure?', 'Yes', [[0, 1], [1, -1], [2, -1]]],
  ['Could this be approved security testing?', 'No', [[1, -1], [0, 1]]],
  ['Did the attacker move further?', 'Not yet', [[0, 0]]]
];
function anCh4(extra) {
  const hx = i => 85 + i * 300, qx = i => 100 + i * 200, hy = 40, qy = 300;
  let edges = '', qs = '', hs = '';
  const Q = extra ? AN_Q.concat([['New issue: beacon from Lab-Runner-04. Same C2?', 'Yes', [[0, 1]]]]) : AN_Q;
  const qxs = i => extra ? 80 + i * 168 : qx(i);
  Q.forEach(([q, a, links], i) => {
    const d = (extra && i === Q.length - 1) ? 1.2 : 1.1 + i * .85;
    links.forEach(([h, w]) => { const col = w > 0 ? '#4ade80' : w < 0 ? '#fb7185' : 'rgb(255 255 255 / .35)';
      edges += `<path class="dr" pathLength="1" style="--d:${d + .35}s" d="M${qxs(i)},${qy - 6} C${qxs(i)},${qy - 80} ${hx(h) + 115},${hy + 150} ${hx(h) + 115},${hy + 84}" fill="none" stroke="${col}" stroke-width="${w ? 2.2 : 1.4}" ${w < 0 ? 'stroke-dasharray="1"' : ''} opacity=".85"/>`; });
    const new_ = extra && i === Q.length - 1;
    qs += `<g class="a" style="--d:${d}s"><rect x="${qxs(i) - 78}" y="${qy}" width="156" height="78" rx="12" fill="${new_ ? 'rgb(77 255 166 / .08)' : 'rgb(28 36 78 / .6)'}" stroke="${new_ ? '#4DFFA6' : 'rgb(129 140 248 / .4)'}"/>
      <foreignObject x="${qxs(i) - 70}" y="${qy + 6}" width="140" height="70"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 11.5px/1.3 Lato, sans-serif;color:#e7ecff">${q}<div style="margin-top:4px;font-weight:800;color:${a === 'Yes' ? '#fda4af' : a === 'No' ? '#86efac' : '#94a3b8'}">${a}</div></div></foreignObject></g>`;
  });
  const endD = extra ? 1.8 : 1.1 + Q.length * .85 + .4;
  AN_H.forEach(([id, t, col, w], i) => {
    const ww = extra && i === 0 ? .97 : w;
    hs += `<g class="a" style="--d:${.2 + i * .2}s"><rect x="${hx(i)}" y="${hy}" width="230" height="84" rx="14" fill="rgb(28 36 78 / .7)" stroke="${col}" stroke-opacity=".6"/>
      <text x="${hx(i) + 16}" y="${hy + 24}" font-size="11" font-weight="900" fill="${col}" letter-spacing="1" font-family="Lato, sans-serif">${id}</text>
      <text x="${hx(i) + 16}" y="${hy + 44}" font-size="13.5" font-weight="700" fill="#fff" font-family="Lato, sans-serif">${t}</text>
      <rect x="${hx(i) + 16}" y="${hy + 58}" width="198" height="8" rx="4" fill="rgb(255 255 255 / .08)"/></g>
      <rect class="gx" style="--d:${endD}s" x="${hx(i) + 16}" y="${hy + 58}" width="${198 * ww}" height="8" rx="4" fill="${col}"/>`;
  });
  hs += `<g class="pop" style="--d:${endD + .9}s"><rect x="${hx(0) - 4}" y="${hy - 4}" width="238" height="92" rx="17" fill="none" stroke="#f43f5e" stroke-width="2.5"/><rect x="${hx(0) + 60}" y="${hy - 16}" width="110" height="22" rx="11" fill="#f43f5e"/><text x="${hx(0) + 115}" y="${hy - 1}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Lato, sans-serif">Top hypothesis</text></g>`;
  return `<svg viewBox="0 0 1000 400" class="w-full min-w-[720px] h-auto">${edges}${hs}${qs}
    <g class="a" style="--d:.9s" font-family="Lato, sans-serif" font-size="11"><line x1="850" x2="872" y1="12" y2="12" stroke="#4ade80" stroke-width="2.2"/><text x="878" y="16" fill="rgb(255 255 255 / .6)">supports</text>
      <line x1="850" x2="872" y1="28" y2="28" stroke="#fb7185" stroke-width="2.2"/><text x="878" y="32" fill="rgb(255 255 255 / .6)">argues against</text></g></svg>`;
}

function anCh6(mode = 'josh') {
  const F = 'font-family="Lato, sans-serif"', M = 'font-family="JetBrains Mono, monospace"', human = mode === 'human';
  const X = m => 90 + m * 16.8;                         // minutes after 09:00 → x
  const Y = { iss: 64, enr: 140, det: 184, world: 252, josh: 326, axis: 392 };
  const lane = (y, t) => `<text x="40" y="${y - 20}" font-size="11" fill="rgb(255 255 255 / .45)" letter-spacing="1.5" ${F}>${t}</text><line x1="40" x2="960" y1="${y}" y2="${y}" stroke="rgb(129 140 248 / .14)"/>`;
  let o = lane(Y.iss, 'ISSUES') + lane(Y.enr, 'PLAYBOOK · ENRICH INDICATORS') + lane(Y.det, 'PLAYBOOK · DETONATE FILE') + lane(Y.world, 'THREAT INTEL') + lane(Y.josh, human ? 'HUMAN ANALYST' : 'JOSH’S VERDICT');
  // time axis, same style as the first chapter
  o += `<line x1="40" x2="960" y1="${Y.axis}" y2="${Y.axis}" stroke="rgb(129 140 248 / .35)" stroke-width="1.5"/>` + [0, 10, 20, 30, 40, 50].map(m => `<line x1="${X(m)}" x2="${X(m)}" y1="${Y.axis - 4}" y2="${Y.axis + 4}" stroke="rgb(129 140 248 / .5)"/><text x="${X(m)}" y="${Y.axis + 20}" text-anchor="middle" font-size="11" fill="rgb(255 255 255 / .5)" ${M}>09:${String(m).padStart(2, '0')}</text>`).join('');
  // issues
  const ISS = [[0, 'Browser exploit'], [7, 'Unusual child process'], [20, 'C2 beaconing'], [42, 'Same page on WS-14']];
  ISS.forEach(([m, n], i) => { const x = X(m), d = .2 + i * .6;
    o += `<g class="pop" style="--d:${d}s"><polygon points="${x},${Y.iss - 12} ${x + 10},${Y.iss + 6} ${x - 10},${Y.iss + 6}" fill="#e11d48"/><text x="${x}" y="${Y.iss + 3}" text-anchor="middle" font-size="9" font-weight="900" fill="#fff">!</text></g>
      <text class="a" style="--d:${d + .1}s" x="${x + 14}" y="${Y.iss + 4}" font-size="11.5" fill="#e7ecff" ${F}>${n}</text>
      <line class="a" style="--d:${d}s" x1="${x}" x2="${x}" y1="${Y.iss + 8}" y2="${Y.axis}" stroke="rgb(255 255 255 / .08)" stroke-dasharray="2 4"/>`; });
  // playbook runs: start with the issue, finish later
  const run = (y, m0, m1, res, col, d) => { const x0 = X(m0), x1 = X(m1);
    return `<rect class="gx" style="--d:${d}s" x="${x0}" y="${y - 5}" width="${Math.max(6, x1 - x0)}" height="10" rx="5" fill="#a78bfa"/>
      <circle class="pop" style="--d:${d + .6}s" cx="${x1}" cy="${y}" r="5" fill="${col}" stroke="#0b1020" stroke-width="2"/>
      <text class="a" style="--d:${d + .7}s" x="${x1 + 10}" y="${y + 4}" font-size="11" fill="${col === '#f43f5e' ? '#fecdd3' : '#cbd5e1'}" ${F}>${res}</text>`; };
  o += run(Y.enr, 0, 1, 'URL · new', '#94a3b8', .4)
     + run(Y.det, 0, 3, 'Edge exploit confirmed (3 min)', '#f43f5e', .5)
     + run(Y.enr, 7, 8, 'rundll32 · signed, misused', '#94a3b8', 1.0)
     + run(Y.enr, 20, 21, 'IP 8.130.54.67 · unknown', '#94a3b8', 1.6)
     + run(Y.enr, 42, 43, 'IP · Cobalt Strike C2', '#f43f5e', 2.6);
  // the world changes between runs
  o += `<g class="pop" style="--d:2.1s"><circle cx="${X(35)}" cy="${Y.world}" r="7" fill="#f43f5e"/></g>
    <text class="a" style="--d:2.2s" x="${X(35) + 14}" y="${Y.world + 4}" font-size="11.5" fill="#ffe4e6" ${F}>09:35 · 8.130.54.67 reclassified as Cobalt Strike C2</text>
    <text class="a" style="--d:2.2s" x="${X(35) - 14}" y="${Y.world + 4}" text-anchor="end" font-size="11" fill="rgb(255 255 255 / .45)" ${F}>09:20 · unknown →</text>`;
  if (human) {
    // the analyst has to pull every result, one issue page at a time
    const pull = (m, y1, d) => `<path class="dr" pathLength="1" style="--d:${d}s" d="M${X(m)},${y1 + 8} L${X(m)},${Y.josh - 14}" stroke="rgb(255 255 255 / .35)" stroke-width="1.4" stroke-dasharray="1" fill="none"/>`;
    const step = (m0, m1, t, col, d) => `<rect class="gx" style="--d:${d}s" x="${X(m0)}" y="${Y.josh - 12}" width="${X(m1) - X(m0) - 2}" height="24" rx="6" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-opacity=".7"/><text class="a" style="--d:${d + .2}s" x="${X(m0) + 8}" y="${Y.josh + 4}" font-size="10.5" fill="#fff" ${F}>${t}</text>`;
    const note = (m, t, col, d, dy = 30) => `<text class="a" style="--d:${d}s" x="${X(m)}" y="${Y.josh + dy}" text-anchor="middle" font-size="10.5" fill="${col}" ${F}>${t}</text>`;
    const loop = (m, d) => `<g class="pop" style="--d:${d}s"><circle cx="${X(m)}" cy="${Y.josh}" r="9" fill="#0b1020" stroke="#f59e0b" stroke-width="1.6"/><path d="M${X(m) - 3},${Y.josh - 3} a4,4 0 1,1 -1,5" fill="none" stroke="#f59e0b" stroke-width="1.5"/></g>`;
    o += step(2, 4, 'Issue 1', '#3b82f6', .9) + loop(5.2, 1.0) + note(4, 'still running, come back later', '#fcd34d', 1.1)
       + step(8, 11, 'Issue 1 again', '#3b82f6', 1.3) + pull(8, Y.det, 1.4) + note(9.5, 'exploit seen', '#93c5fd', 1.5, 46)
       + step(12, 15, 'Issue 2', '#3b82f6', 1.6) + pull(12, Y.enr, 1.7)
       + step(22, 26, 'Issue 3', '#3b82f6', 1.9) + pull(22, Y.enr, 2.0) + note(24, 'IP unknown', '#cbd5e1', 2.1, 46)
       + `<g class="pop" style="--d:2.3s"><circle cx="${X(35)}" cy="${Y.josh}" r="9" fill="none" stroke="rgb(255 255 255 / .45)" stroke-dasharray="3 3"/></g>` + note(35, 'not notified', '#fda4af', 2.4)
       + step(44, 47, 'Issue 4', '#3b82f6', 2.8) + pull(44, Y.enr, 2.9)
       + `<g class="pop" style="--d:3.3s"><rect x="${X(47.3)}" y="${Y.josh - 12}" width="70" height="24" rx="12" fill="#f43f5e"/><text x="${X(47.3) + 35}" y="${Y.josh + 4}" text-anchor="middle" font-size="10.5" fill="#fff" ${F}>Malicious</text></g>` + note(49, 'connects it by hand', '#fda4af', 3.4, 46);
    return `<svg viewBox="0 0 1000 420" class="w-full min-w-[720px] h-auto">${o}</svg>`;
  }
  // what reaches Josh
  const link = (x, y1, d) => `<path class="dr" pathLength="1" style="--d:${d}s" d="M${x},${y1 + 8} L${x},${Y.josh - 14}" stroke="#4DFFA6" stroke-width="1.5" fill="none" opacity=".7"/>`;
  o += link(X(3), Y.det, 1.0) + link(X(35), Y.world, 2.4) + link(X(43), Y.enr, 3.1);
  // verdict as a track, like the case track in the earlier chapters
  const seg = (m0, m1, t, col, d, above) => { const x0 = X(m0), x1 = X(m1);
    return `<rect class="gx" style="--d:${d}s" x="${x0}" y="${Y.josh - 12}" width="${x1 - x0 - 2}" height="24" rx="6" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-opacity=".7"/>
      <text class="a" style="--d:${d + .2}s" x="${above ? x0 : x0 + 10}" y="${above ? Y.josh + 30 : Y.josh + 4}" font-size="11" fill="${above ? '#fcd34d' : '#fff'}" ${F}>${t}</text>`; };
  o += seg(0, 3, 'Inconclusive · Low', '#f59e0b', .3, true)
     + seg(3, 35, 'Malicious · Medium  (sandbox)', '#f43f5e', 1.1)
     + seg(35, 43, 'High', '#f43f5e', 2.5)
     + seg(43, 50, 'High · 2 hosts', '#f43f5e', 3.2);
  return `<svg viewBox="0 0 1000 420" class="w-full min-w-[720px] h-auto">${o}</svg>`;
}
function anMode(m) {
  S.anMode = m; const box = $('an-7-svg'); if (!box) return;
  box.innerHTML = anCh6(m) + anModeStats(m);
  document.querySelectorAll('[data-anmode]').forEach(b => { const on = b.dataset.anmode === m; b.className = `px-3.5 py-1.5 rounded-full text-[13px] ${on ? (m === 'josh' ? 'bg-teal-300 text-slate-950 font-bold' : 'bg-white text-slate-950 font-bold') : 'text-white/60 hover:text-white'}`; });
  anReplay('an-7-v');
}
function anModeStats(m) {
  const st = (v, l, col) => `<div class="rounded-2xl px-4 py-3 border border-white/10 bg-white/[.03]"><div class="text-[20px] font-black" style="color:${col}">${v}</div><div class="text-[12.5px] text-white/55">${l}</div></div>`;
  return `<div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">${m === 'human'
    ? st('5', 'issue pages opened by hand', '#fbbf24') + st('1', 'trip back to wait for a playbook', '#fbbf24') + st('9 min', 'before the C2 change is seen', '#fb7185') + st('09:48', 'verdict, pieced together', '#fb7185')
    : st('0', 'pages opened: results come to Josh', '#4DFFA6') + st('0', 'waiting: each result counts when it lands', '#4DFFA6') + st('0 min', 'to react to the C2 change', '#4DFFA6') + st('09:03', 'first verdict, High at 09:35', '#5eead4')}</div>`;
}


const AN_CAP_AUTO = { 0: 'Josh starts with the explanations that could be true.', 5: 'He asks the questions that tell them apart. Each answer supports some hypotheses and argues against others.', 6: 'He reconciles the answers. The top hypothesis becomes the verdict: Malicious, high confidence.', 7: 'A new issue joins the case. It becomes one more question, and the verdict gets stronger instead of starting over.' };
let _anT = [];
let _anLoopT = null;
function anLoopParts() {
  clearInterval(_anLoopT);
  _anLoopT = setInterval(() => {
    if ($('landing').classList.contains('hidden')) return;
    document.querySelectorAll('#lp-anatomy .an:not(#lp-an-reason)').forEach(el => { el.classList.remove('play'); void el.getBoundingClientRect(); el.classList.add('play'); });
  }, 11000);
}
function anAutoPlay() {
  _anT.forEach(clearTimeout); _anT = [];
  if (!$('lp-an-reason') || $('landing').classList.contains('hidden')) return;
  const set = (k, from) => { S.anK = k; const v = $('lp-an-reason'); if (v) { v.innerHTML = anReason(k, from); v.classList.remove('play'); void v.getBoundingClientRect(); v.classList.add('play'); } const c = $('lp-an-ctl'); if (c) { c.innerHTML = anCtlAuto(k); icons(); } };
  set(0); _anT.push(setTimeout(() => set(5, 0), 1100), setTimeout(() => set(6), 4600), setTimeout(() => set(7, 5), 6600), setTimeout(anAutoPlay, 10600));
}
function anCtlAuto(k) {
  const order = [0, 5, 6, 7], at = order.indexOf(k);
  return `<div class="flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-1.5">${order.map((_, i) => `<span class="h-1.5 rounded-full transition-all ${i <= at ? 'w-8' : 'w-3'}" style="background:${i <= at ? '#5eead4' : 'rgb(255 255 255 / .18)'}"></span>`).join('')}</div>
      <div class="flex-1 min-w-[240px] text-[14.5px] text-white/80">${AN_CAP_AUTO[k]}</div>
    </div>`;
}
const AN_CAP = [
  'Josh starts with the explanations that could be true.',
  'Question 1 supports a real attack and argues against benign behavior.',
  'Question 2 points the same way.',
  'Question 3 finds live command-and-control traffic.',
  'Question 4 rules out an approved security test.',
  'Question 5 finds no lateral movement yet. It doesn’t move the needle.',
  'Josh reconciles the answers. The top hypothesis becomes the verdict: Malicious, high confidence.',
  'Later, a new issue joins the case. It becomes question 6, and the verdict gets stronger instead of starting over.'
];
function anReason(k, from = 99) {
  const hx = i => 85 + i * 300, hy = 40, qy = 300, qx = i => 80 + i * 168;
  const Q = AN_Q.concat([['New issue: beacon from Lab-Runner-04. Same C2?', 'Yes', [[0, 1]]]]);
  const nq = k <= 0 ? 0 : k <= 5 ? k : k === 6 ? 5 : 6;
  const score = [.2, .2, .2];
  Q.slice(0, nq).forEach(([, , links]) => links.forEach(([h, w]) => { score[h] = Math.max(.03, Math.min(.98, score[h] + (w > 0 ? .14 : w < 0 ? -.06 : 0))); }));
  let edges = '', qs = '', hs = '';
  Q.slice(0, nq).forEach(([q, a, links], i) => {
    const isNew = i >= from, d = isNew ? .15 + (i - Math.min(from, nq)) * .4 : 0, cls = isNew ? 'a' : '';
    links.forEach(([h, w]) => { const col = w > 0 ? '#4ade80' : w < 0 ? '#fb7185' : 'rgb(255 255 255 / .35)';
      edges += `<path class="${isNew ? 'dr' : ''}" pathLength="1" style="--d:${d + .45}s" d="M${qx(i)},${qy - 6} C${qx(i)},${qy - 80} ${hx(h) + 115},${hy + 150} ${hx(h) + 115},${hy + 84}" fill="none" stroke="${col}" stroke-width="${w ? 2.2 : 1.4}" opacity="${isNew ? .95 : .55}"/>`; });
    const nw = i === 5;
    qs += `<g class="${cls}" style="--d:${d}s"><rect x="${qx(i) - 78}" y="${qy}" width="156" height="78" rx="12" fill="${nw ? 'rgb(77 255 166 / .08)' : 'rgb(28 36 78 / .6)'}" stroke="${nw ? '#4DFFA6' : isNew ? '#a5b4fc' : 'rgb(129 140 248 / .35)'}"/>
      <foreignObject x="${qx(i) - 70}" y="${qy + 6}" width="140" height="70"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 11.5px/1.3 Lato, sans-serif;color:#e7ecff">${q}<div style="margin-top:4px;font-weight:800;color:${a === 'Yes' ? '#fda4af' : a === 'No' ? '#86efac' : '#94a3b8'}">${a}</div></div></foreignObject></g>`;
  });
  for (let i = nq; i < 6; i++) qs += `<rect x="${qx(i) - 78}" y="${qy}" width="156" height="78" rx="12" fill="none" stroke="rgb(255 255 255 / .1)" stroke-dasharray="4 5"/>`;
  AN_H.forEach(([id, t, col], i) => {
    const top = k >= 6 && i === 0;
    hs += `<g><rect x="${hx(i)}" y="${hy}" width="230" height="84" rx="14" fill="rgb(28 36 78 / .7)" stroke="${col}" stroke-opacity="${top ? 1 : .55}" stroke-width="${top ? 2.5 : 1}"/>
      <text x="${hx(i) + 16}" y="${hy + 24}" font-size="11" font-weight="900" fill="${col}" letter-spacing="1" font-family="Lato, sans-serif">${id}</text>
      <text x="${hx(i) + 16}" y="${hy + 44}" font-size="13.5" font-weight="700" fill="#fff" font-family="Lato, sans-serif">${t}</text>
      <rect x="${hx(i) + 16}" y="${hy + 58}" width="198" height="8" rx="4" fill="rgb(255 255 255 / .08)"/>
      <rect x="${hx(i) + 16}" y="${hy + 58}" height="8" rx="4" fill="${col}" style="width:${(198 * score[i]).toFixed(1)}px;transition:width .6s cubic-bezier(.2,.8,.2,1)"/></g>`;
  });
  if (k >= 6) hs += `<g class="pop" style="--d:.1s"><rect x="${hx(0) + 52}" y="${hy - 16}" width="126" height="22" rx="11" fill="#f43f5e"/><text x="${hx(0) + 115}" y="${hy - 1}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Lato, sans-serif">Verdict · Malicious</text></g>`;
  return `<svg viewBox="0 0 1000 400" class="w-full h-auto">${edges}${hs}${qs}
    <g font-family="Lato, sans-serif" font-size="11"><line x1="850" x2="872" y1="12" y2="12" stroke="#4ade80" stroke-width="2.2"/><text x="878" y="16" fill="rgb(255 255 255 / .6)">supports</text>
      <line x1="850" x2="872" y1="28" y2="28" stroke="#fb7185" stroke-width="2.2"/><text x="878" y="32" fill="rgb(255 255 255 / .6)">argues against</text></g></svg>`;
}
function anStep(d) {
  S.anK = Math.max(0, Math.min(7, (S.anK || 0) + d));
  const v = $('lp-an-reason'); if (v) { v.innerHTML = anReason(S.anK); v.classList.remove('play'); void v.getBoundingClientRect(); v.classList.add('play'); }
  const c = $('lp-an-ctl'); if (c) c.innerHTML = anCtl();
}
function anCtl() {
  const k = S.anK || 0, next = k === 0 ? 'Ask question 1' : k < 5 ? `Ask question ${k + 1}` : k === 5 ? 'Reconcile' : k === 6 ? 'A new issue arrives' : 'Start again';
  return `<div class="flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-1.5">${Array.from({ length: 8 }, (_, i) => `<span class="h-1.5 rounded-full transition-all ${i <= k ? 'w-6 bg-teal-300' : 'w-1.5 bg-white/20'}"></span>`).join('')}</div>
      <div class="flex-1 min-w-[240px] text-[14.5px] text-white/80">${AN_CAP[k]}</div>
      <button onclick="anStep(-1)" class="px-3 py-2 rounded-full border border-white/15 text-[13px] text-white/70 hover:text-white ${k ? '' : 'opacity-30 pointer-events-none'}">Back</button>
      <button onclick="${k === 7 ? 'S.anK=0;anStep(0)' : 'anStep(1)'}" class="lp-cta px-4 py-2 rounded-full text-slate-950 text-[13px] font-bold">${next} →</button>
    </div>`;
}
function anatomyHTML() {
  S.anK = S.anK || 0;
  const play = S._anSeen ? 'play' : '';
  const link = t => `<div class="lp-rv flex flex-col items-center py-3"><span class="w-px h-6 bg-gradient-to-b from-transparent to-teal-300/60"></span><span class="px-4 py-1.5 rounded-full border border-teal-300/30 text-[13px] text-teal-200 bg-teal-300/[.06]">${t}</span><span class="w-px h-6 bg-gradient-to-b from-teal-300/60 to-transparent"></span></div>`;
  const head = (n, t, sub) => `<div class="flex items-baseline gap-3 flex-wrap"><span class="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black text-slate-950" style="background:#5eead4">${n}</span><span class="text-[19px] font-bold text-white">${t}</span><span class="text-[14px] text-white/55">${sub}</span></div>`;
  return `
    <div class="lp-rv text-[12px] font-black tracking-[.18em]" style="color:#5eead4">HOW AN INVESTIGATION WORKS</div>
    <h2 class="lp-rv mt-3 text-[clamp(32px,4vw,50px)] font-black leading-[1.05] text-white">Anatomy of an autonomous investigation</h2>
    <div class="lp-rv mt-10 rounded-3xl border border-white/10 p-5 sm:p-7" style="background:rgb(255 255 255 / .03)">
      ${head(1, 'The case keeps changing', 'The attack unfolds over hours. Issues keep arriving and grouping into the case, with informational signals in between.')}
      <div class="an ${play} mt-4">${anCh1()}</div></div>
    ${link('So who keeps up with it?')}
    <div class="lp-rv rounded-3xl border border-white/10 p-5 sm:p-7" style="background:rgb(255 255 255 / .03)">
      ${head(2, 'The same case, two ways of working', 'Issues · playbooks · Josh · the human analyst')}
      <div class="mt-6 grid gap-6">
        <div><div class="flex items-center gap-2 text-[14px] font-semibold text-rose-200">${ic('user', 'w-4 h-4')}From the analyst’s seat <span class="font-normal text-white/50">· 2 restarts, ~35% reviewed, one issue never seen</span></div>
          <div class="an ${play} mt-2 rounded-2xl p-3 bg-black/20 border border-white/[.06]">${anLanes(false)}</div></div>
        <div><div class="flex items-center gap-2 text-[14px] font-semibold text-emerald-200">${agentAv(PILLARS.analyst, 20, false)}With Josh <span class="font-normal text-white/50">· starts when the case opens, folds in every issue, you approve</span></div>
          <div class="an ${play} mt-2 rounded-2xl p-3 bg-black/20 border border-white/[.06]">${anLanes(true)}</div></div>
      </div></div>
    ${link('How does Josh reach the verdict?')}
    <div class="lp-rv rounded-3xl border border-white/10 p-5 sm:p-7" style="background:rgb(255 255 255 / .03)">
      ${head(3, 'How Josh reasons', 'Hypotheses, then questions, then the verdict.')}
      <div id="lp-an-reason" class="an play mt-4">${anReason(0)}</div>
      <div id="lp-an-ctl" class="mt-4">${anCtlAuto(0)}</div>
    </div>`;
}
function renderLpAnatomy(which) {
  const el = $('lp-anatomy'); if (!el) return;
  if (!which) { el.innerHTML = anatomyHTML(); icons();
    { const L2 = $('landing'), R = $('lp-an-reason'); if (window.IntersectionObserver && L2 && R) { const o3 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { anAutoPlay(); o3.disconnect(); } }), { root: L2, threshold: .45 }); o3.observe(R); } }
    const L = $('landing'); if (window.IntersectionObserver && L) { const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { S._anSeen = true; el.querySelectorAll('.lp-rv').forEach(x => x.classList.add('in')); setTimeout(() => el.querySelectorAll('.an').forEach(x => x.classList.add('play')), 300); anLoopParts(); ob.disconnect(); } }), { root: L, threshold: .2 }); ob.observe(el); }
    return; }
  el.innerHTML = anatomyHTML(); el.querySelectorAll('.lp-rv').forEach(x => x.classList.add('in'));
  icons();
}
function anReplay(id) { const el = $(id); if (!el) return; el.classList.remove('play'); void el.getBoundingClientRect(); el.classList.add('play'); }
function renderAnatomy() {
  const V = $('view-anatomy');
  const chap = (n, id, label, title, text, visual, after) => `<section id="${id}" class="max-w-[1180px] w-full mx-auto px-6 py-14">
      <div class="flex items-end justify-between gap-4 flex-wrap"><div class="max-w-[760px]"><div class="text-[12px] font-black tracking-[.18em]" style="color:#5eead4">${n} · ${label}</div>
        <h2 class="mt-2 text-[clamp(26px,3vw,38px)] font-black text-white leading-tight">${title}</h2><p class="mt-3 text-[16px] text-white/65 leading-relaxed">${text}</p></div>
        <button onclick="anReplay('${id}-v')" class="px-3 py-1.5 rounded-full border border-white/15 text-[13px] text-white/70 hover:text-white inline-flex items-center gap-1.5">${ic('rotate-ccw', 'w-3.5 h-3.5')}Replay</button></div>
      <div id="${id}-v" class="an mt-8 rounded-3xl border border-white/10 p-3 sm:p-7 overflow-x-auto" style="background:linear-gradient(180deg, rgb(255 255 255 / .04), rgb(255 255 255 / .015))">${visual}</div>${after || ''}</section>`;
  const stat = (v, l, col) => `<div class="rounded-2xl px-4 py-3 border border-white/10 bg-white/[.03]"><div class="text-[22px] font-black" style="color:${col}">${v}</div><div class="text-[12.5px] text-white/55">${l}</div></div>`;
  V.innerHTML = `
    <div class="sticky top-0 z-[5] backdrop-blur-md border-b border-white/10" style="background:rgb(7 11 22 / .75)"><div class="max-w-[1180px] mx-auto px-6 h-14 flex items-center gap-2 overflow-x-auto">
      ${[['an-1', 'The living case'], ['an-2', 'Without an agent'], ['an-3', 'With Josh'], ['an-4', 'How Josh reasons'], ['an-5', 'A case that keeps changing'], ['an-7', 'Inputs from everywhere'], ['an-6', 'Why it’s different']].map(([id, l], i) => `<button onclick="document.getElementById('${id}').scrollIntoView({behavior:'smooth',block:'start'})" class="an-chip shrink-0 px-3 py-1.5 rounded-full text-[13px] text-white/60 hover:text-white hover:bg-white/5"><span class="font-mono text-white/35 mr-1.5">0${i + 1}</span>${l}</button>`).join('')}</div></div>
    <section class="max-w-[1180px] w-full mx-auto px-6 pt-14 pb-4">
      <div class="text-[12px] font-black tracking-[.18em]" style="color:#5eead4">TUTORIAL</div>
      <h1 class="mt-3 text-[clamp(36px,5vw,64px)] font-black leading-[1.02] text-white">Anatomy of an<br><span style="background:linear-gradient(90deg,#5eead4,#4DFFA6);-webkit-background-clip:text;background-clip:text;color:transparent">autonomous investigation</span></h1>
      <p class="mt-5 max-w-[720px] text-[17px] text-white/65 leading-relaxed">A case isn’t a fixed thing. It keeps growing while you work it. This page shows why that breaks the way people investigate today, and how Josh investigates differently.</p>
    </section>
    ${chap('01', 'an-1', 'THE LIVING CASE', 'An issue fires. A case opens. Then it keeps growing.', 'Cortex raises an issue and opens a case. As more issues arrive, the ones that share logic with it (the same host, user, process, file or IP) are grouped into the same case. This happens again and again, often for hours.', anCh1())}
    ${chap('02', 'an-2', 'WITHOUT AN AGENT', 'People investigate a snapshot that keeps moving', 'An analyst picks the case up after it waited in the queue, and starts reading. Every new issue changes the picture, so they start over. To meet the SLA they skim the rest. When a related issue arrives after they resolve it, it opens a brand-new case, and whoever picks it up starts from zero.', anLanes(false),
      `<div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">${stat('40 min', 'before anyone starts', '#fbbf24')}${stat('2', 'restarts as the case changed', '#fb7185')}${stat('~35%', 'of the evidence actually reviewed', '#fb7185')}${stat('0', 'context carried to the next case', '#94a3b8')}</div>`)}
    ${chap('03', 'an-3', 'WITH JOSH', 'Josh starts when the case opens, and never starts over', 'Josh begins the moment the case is created. Each new issue is folded into the same investigation: he knows everything that already happened, adds what changed and keeps going. When a related issue arrives after the case is resolved, it opens a new case, and Josh links it to the old one and starts with everything he already knew.', anLanes(true),
      `<div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">${stat('0 min', 'before the work starts', '#4DFFA6')}${stat('0', 'restarts', '#4DFFA6')}${stat('100%', 'of the evidence reviewed', '#4DFFA6')}${stat('Linked', 'next case starts with full context', '#5eead4')}</div>`)}
    ${chap('04', 'an-4', 'HOW JOSH REASONS', 'Hypotheses, questions, then a verdict', 'Josh first writes down the possible explanations as hypotheses. Then he asks questions designed to tell them apart. Each answer supports one or more hypotheses and argues against others. At the end he reconciles everything, and the top hypothesis becomes the verdict, with every question, answer and piece of evidence attached.', anCh4(false),
      `<div class="mt-5 grid md:grid-cols-3 gap-3">${[['1', 'Define the hypotheses', 'Real attack, approved test, benign behavior. Every case starts with the explanations that could be true.'], ['2', 'Ask questions that separate them', 'Each question is chosen because its answer moves the hypotheses apart, not just to collect data.'], ['3', 'Reconcile into a decision', 'The strongest hypothesis is the verdict. Confidence comes from how far ahead it is, and every answer links to its evidence.']].map(([n, t, d]) => `<div class="rounded-2xl p-5 border border-white/10 bg-white/[.03]"><div class="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black text-slate-950" style="background:#5eead4">${n}</div><div class="mt-3 text-[16px] font-bold text-white">${t}</div><div class="mt-1 text-[14px] text-white/60 leading-relaxed">${d}</div></div>`).join('')}</div>`)}
    ${chap('05', 'an-5', 'A CASE THAT KEEPS CHANGING', 'A new issue is just a new question', 'When an issue joins the case after the verdict, Josh doesn’t start over. He adds a question for it, answers it, and reconciles again. Here, a beacon from a second host strengthens the top hypothesis instead of resetting the work.', anCh4(true))}
    ${chap('06', 'an-7', 'INPUTS FROM EVERYWHERE', 'Not only issues: playbooks and the world change the case too', 'Same case, #555548, first four issues. A case gets new information from three places. New issues are grouped into it. Two automation playbooks start on each issue as it arrives and finish a little later: enrichment takes about a minute, a file detonation about three. And the world changes: the C2 IP was unknown when the beaconing started at 09:20, and threat intel reclassified it as Cobalt Strike at 09:35, so the next enrichment returns a different answer. Every result lands on one of Josh’s questions, and each time an answer changes he reconciles the verdict again. Switch between the two views to compare.', `<div class="flex items-center gap-1 p-1 rounded-full border border-white/15 w-max mb-5"><button data-anmode="human" onclick="anMode('human')" class="px-3.5 py-1.5 rounded-full text-[13px] bg-white text-slate-950 font-bold">Without an agent</button><button data-anmode="josh" onclick="anMode('josh')" class="px-3.5 py-1.5 rounded-full text-[13px] text-white/60 hover:text-white">With Josh</button></div><div id="an-7-svg">${anCh6('human')}${anModeStats('human')}</div>`,
      `<div class="mt-5 grid md:grid-cols-3 gap-3">${[['#e11d48', 'Issues', 'The first four issues of case #555548, the same ones from the earlier chapters. Each one adds a question or answers one.'], ['#a78bfa', 'Playbook results', 'Enrichment runs on every issue and finishes in about a minute; detonation runs when there’s a file and finishes in about three. Each result lands when the run finishes, not when the issue arrives.'], ['#f43f5e', 'World changes', 'At 09:35 threat intel reclassifies 8.130.54.67 as Cobalt Strike C2. Josh’s question “Is it talking to attacker infrastructure?” flips from Unknown to Yes, and confidence goes to High.']].map(([c0, t, d]) => `<div class="rounded-2xl p-5 border border-white/10 bg-white/[.03]"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background:${c0}"></span><span class="text-[16px] font-bold text-white">${t}</span></div><div class="mt-2 text-[14px] text-white/60 leading-relaxed">${d}</div></div>`).join('')}</div>
      <div class="mt-4 rounded-2xl p-5 border border-white/10 bg-white/[.03]">
        <div class="text-[12px] font-black tracking-[.16em] text-white/45">ONE QUESTION, TWO ANSWERS OVER TIME</div>
        <div class="mt-2 text-[16px] font-bold text-white">Is SOC-Tech talking to attacker infrastructure (8.130.54.67)?</div>
        <div class="mt-3 flex items-center gap-3 flex-wrap text-[14px]"><span class="px-3 py-1 rounded-full bg-white/10 text-white/70">09:20 · Unknown</span><span class="text-white/40">→</span><span class="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200">09:35 · Yes, reclassified by threat intel</span><span class="text-white/40">→</span><span class="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200">Verdict: Malicious · Medium → High</span></div>
        <p class="mt-3 text-[14px] text-white/55">Without an agent, this change would only be noticed if someone happened to reopen the case.</p>
      </div>`)}
    <section id="an-6" class="max-w-[1180px] w-full mx-auto px-6 py-14 pb-24">
      <div class="text-[12px] font-black tracking-[.18em]" style="color:#5eead4">07 · WHY IT’S DIFFERENT</div>
      <h2 class="mt-2 text-[clamp(26px,3vw,38px)] font-black text-white leading-tight">Built for cases that don’t stand still</h2>
      <div class="mt-8 rounded-3xl border border-white/10 overflow-hidden">
        <div class="grid grid-cols-[1.1fr,1fr,1fr] text-[13px] font-bold text-white/50 px-6 py-3 border-b border-white/10 bg-white/[.03]"><span></span><span>Without an agent</span><span style="color:#4DFFA6">With Josh</span></div>
        ${[['When the work starts', 'When someone picks it up', 'The moment the case is created'], ['When a new issue arrives', 'Start over with the new picture', 'Becomes a new question in the same investigation'], ['When a playbook or threat intel adds something', 'Noticed only if someone reopens the case', 'Answers a question and the verdict is reconciled again'], ['How much is reviewed', 'What fits in the SLA', 'Every issue, every time'], ['A related issue after resolution', 'Opens a new case that starts from zero', 'Opens a new case that Josh links to the old one, with full context'], ['Why the verdict', 'In the analyst’s head', 'Hypotheses, questions, answers and evidence, written down']].map(([k, a, b]) => `<div class="grid grid-cols-[1.1fr,1fr,1fr] px-6 py-4 border-b border-white/[.06] text-[14.5px]"><span class="text-white font-semibold">${k}</span><span class="text-white/55">${a}</span><span class="text-white/85">${b}</span></div>`).join('')}
      </div>
      <div class="mt-8 flex gap-3 flex-wrap"><button onclick="openCaseDrawer('555548')" class="lp-cta px-5 py-3 rounded-full text-slate-950 text-[14px] font-bold">See it on a real case →</button><button onclick="goWorkforce('analyst')" class="px-5 py-3 rounded-full border border-white/20 text-white text-[14px] font-semibold hover:bg-white/5">Open Josh’s queue</button></div>
    </section>`;
  icons();
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('play'); obs.unobserve(e.target); } }), { root: V, threshold: .3 });
  V.querySelectorAll('.an').forEach(el => obs.observe(el));
}

function verdictHistory(c) {
  if (c.id === '555548') return [
    ['14:22:04', 'Inconclusive', 'Low', 'Edge crashed in the WebP decoder. Could still be a browser bug.'],
    ['14:22:31', 'Inconclusive', 'Medium', 'Edge started rundll32.exe with no arguments, which a browser never does.'],
    ['14:23:12', 'Malicious', 'Medium', 'Sandbox playbook: the dropped payload is a Cobalt Strike loader.'],
    ['14:24:55', 'Malicious', 'High', 'Threat intel reclassified 8.130.54.67 as Cobalt Strike C2; the beacon is confirmed.']];
  const inv = investigation(c), wl = getWorklog(c).filter(e => e.by === 'agent' && e.time), vd = verdictOf(c);
  if (vd === 'Running' || wl.length < 2) return [];
  const t = k => wl[Math.min(wl.length - 1, k)].time;
  const fin = [t(wl.length - 1), inv.label.replace('Leaning ', ''), confLevel(inv.target) || 'Low', 'All questions answered and reconciled.'];
  if (vd === 'Benign') return [[t(0), 'Inconclusive', 'Low', 'The first signal alone could go either way.'], [t(1), 'Benign', 'Medium', 'The activity matched a known, approved pattern.'], fin];
  return [[t(0), 'Inconclusive', 'Low', 'The first signal alone could go either way.'], [t(Math.floor(wl.length / 2)), vd === 'Malicious' ? 'Inconclusive' : vd, 'Medium', 'Enrichment and the first answers moved the picture.'], fin];
}
function verdictHistoryHTML(c) {
  const h = verdictHistory(c); if (!h.length) return '';
  const col = v => v === 'Malicious' ? '#f43f5e' : v === 'Benign' ? '#00c389' : '#f59e0b';
  return `<div class="mt-4"><div class="text-[11px] font-bold tracking-[.14em] text-ink3 mb-2">HOW THE VERDICT CHANGED</div>
    <div class="flex items-stretch gap-1.5 flex-wrap">${h.map(([t, v, cf, why], i) => `${i ? `<span class="self-center text-ink3">${ic('chevron-right', 'w-4 h-4')}</span>` : ''}<div ${tipAttr(`<div class="text-[12px] text-ink3 font-mono">${t}</div><div class="text-[13px] text-ink mt-1">${esc(why)}</div>`)} class="cursor-help rounded-xl px-3 py-2 border" style="border-color:${col(v)}66;background:${col(v)}14"><div class="text-[11px] font-mono text-ink3">${t}</div><div class="text-[13px] font-semibold" style="color:${col(v)}">${v} · ${cf}</div></div>`).join('')}</div>
    <div class="mt-1.5 text-[12px] text-ink3">Hover a step to see what changed it.</div></div>`;
}