/* ======================================================================
   WORKFORCE GRAPH — the liquid core splits into the four agents
   ====================================================================== */
const WF = {
  analyst: { x: 230, y: 150, stat: 150, cap: 'investigations handled' },
  engineer: { x: 690, y: 150, stat: 20, cap: 'new detections & automations' },
  hunter: { x: 460, y: 420, stat: 50, cap: 'hunts performed' },
  intel: { x: 130, y: 360, stat: 4, cap: 'new threat groups researched' }
};
const WF_EDGES = [
  { a: 'analyst', b: 'engineer', d: 'M230,116 C330,8 590,8 690,116', lx: 460, ly: 38, n: 16, t: 'rules to tune', who: 'Josh asked Maya' },
  { a: 'hunter', b: 'engineer', d: 'M494,420 C790,432 805,190 724,150', lx: 772, ly: 336, n: 10, t: 'hunts became rules', who: 'Tom → Maya' },
  { a: 'hunter', b: 'analyst', d: 'M432,402 C380,330 322,176 264,150', lx: 352, ly: 296, n: 2, t: 'escalated to cases', who: 'Tom → Josh' },
  { a: 'intel', b: 'analyst', d: 'M116,328 C88,250 128,170 196,150', lx: 88, ly: 270, n: 15, t: 're-investigations', who: 'Avi → Josh' }
];
function workforceGraphHTML() {
  const C = { x: 460, y: 255 };
  const blob = blobPath(7, 5, 0, 52), vals = [7, 19, 33, 47].map(sd => blobPath(sd, 5, 0, 52)); vals.push(vals[0]);
  const anim = `<animate attributeName="d" dur="9s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" values="${vals.join(';')}"/>`;
  const spokes = PILLAR_KEYS.map(k => `<line x1="${C.x}" y1="${C.y}" x2="${WF[k].x}" y2="${WF[k].y}" class="spoke" stroke="${PILLARS[k].col}" stroke-width="1" stroke-dasharray="3 6"/>`).join('');
  const edges = WF_EDGES.map((e, i) => {
    const col = PILLARS[e.a].col;
    return `<path id="wfe${i}" d="${e.d}" class="edge" style="--d:${1.25 + i * .3}s" pathLength="1" fill="none" stroke="url(#wfg-${e.a}-${e.b})" stroke-width="2.4" stroke-linecap="round"/>
      <g class="flow" style="--d:${1.9 + i * .3}s">${[0, .33, .66].map(o => `<circle r="3.2" fill="${col}"><animateMotion dur="2.6s" begin="${o * 2.6}s" repeatCount="indefinite" rotate="auto"><mpath href="#wfe${i}"/></animateMotion></circle>`).join('')}</g>
      <g class="elabel" style="--d:${1.7 + i * .3}s" transform="translate(${e.lx},${e.ly})">
        <rect x="-78" y="-17" width="156" height="34" rx="17" fill="rgb(var(--panel))" stroke="${col}" stroke-opacity=".55"/>
        <text x="-62" y="5.5" font-size="15" font-weight="900" fill="${col}" font-family="Lato, sans-serif" data-count="${e.n}" data-delay="${1900 + i * 300}">${e.n}</text>
        <text x="${e.n >= 10 ? -38 : -46}" y="5" font-size="12" class="fill-ink2" font-family="Lato, sans-serif">${e.t}</text>
      </g>`;
  }).join('');
  const defs = WF_EDGES.map(e => `<linearGradient id="wfg-${e.a}-${e.b}" gradientUnits="userSpaceOnUse" x1="${WF[e.a].x}" y1="${WF[e.a].y}" x2="${WF[e.b].x}" y2="${WF[e.b].y}"><stop offset="0" stop-color="${PILLARS[e.a].col}"/><stop offset="1" stop-color="${PILLARS[e.b].col}"/></linearGradient>`).join('');
  const goo = PILLAR_KEYS.map((k, i) => `<circle class="ag" r="30" fill="${PILLARS[k].col}" style="--tx:${WF[k].x - C.x}px;--ty:${WF[k].y - C.y}px;--d:${.15 + i * .12}s"/>`).join('');
  const agents = PILLAR_KEYS.map((k, i) => {
    const P = PILLARS[k], w = WF[k], below = true;
    return `<g class="agn" style="--tx:${w.x - C.x}px;--ty:${w.y - C.y}px;--d:${.15 + i * .12}s" onclick="homeSend('Tell me about ${P.name}')">
      <circle r="34" fill="url(#wfa-${k})"/>
      <circle r="34" fill="none" stroke="${P.col}" stroke-opacity=".6" stroke-width="1.5"/>
      <circle class="halo" r="34" fill="none" stroke="${P.col}" stroke-width="1.5"/>
      <text y="9" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" font-family="Lato, sans-serif">${P.name[0]}</text>
      <circle cx="25" cy="25" r="6.5" fill="#4DFFA6" stroke="rgb(var(--panel))" stroke-width="2.5"/>
      <g class="ainfo" transform="translate(0,${below ? 56 : -86})">
        <text text-anchor="middle" font-size="15" font-weight="900" class="fill-ink" font-family="Lato, sans-serif">${P.name} <tspan font-weight="400" class="fill-ink3" font-size="12.5">· ${P.title}</tspan></text>
        <text y="27" text-anchor="middle" font-size="22" font-weight="900" fill="${P.col}" font-family="Lato, sans-serif" data-count="${w.stat}" data-delay="${1100 + i * 120}">${w.stat}</text>
        <text y="44" text-anchor="middle" font-size="11.5" class="fill-ink3" font-family="Lato, sans-serif">${w.cap}</text>
      </g>
    </g>`;
  }).join('');
  const avDefs = PILLAR_KEYS.map(k => `<radialGradient id="wfa-${k}" cx="32%" cy="26%" r="80%"><stop offset="0" stop-color="${PILLARS[k].c2}"/><stop offset=".5" stop-color="${PILLARS[k].col}"/><stop offset="1" stop-color="${PILLARS[k].dark}"/></radialGradient>`).join('');
  return `<div class="wfg-wrap relative rounded-3xl border border-line overflow-hidden" style="background:radial-gradient(520px 300px at 50% 52%, rgb(99 102 241 / .16), transparent 70%), rgb(var(--panel))" onmousemove="wfTilt(event,this)" onmouseleave="wfTilt(null,this)">
    <svg viewBox="0 0 920 540" class="wfg w-full h-auto block" role="img" aria-label="How Josh, Maya, Tom and Avi worked together">
      <defs>${defs}${avDefs}
        <radialGradient id="wfcore" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#bfdbfe"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></radialGradient>
        <filter id="wfgoo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"/></filter>
      </defs>
      <g class="spokes">${spokes}</g>
      ${edges}
      <g transform="translate(${C.x},${C.y})">
        <g filter="url(#wfgoo)" class="goo"><path fill="url(#wfcore)">${anim}</path>${goo}</g>
        <path fill="url(#wfcore)" class="core">${anim}</path>
        <ellipse cx="-16" cy="-19" rx="14" ry="8" transform="rotate(-32 -16 -19)" fill="#fff" opacity=".5"/>
        <circle class="pulse" r="62" fill="none" stroke="#3b82f6" stroke-width="1.2"/>
        <text y="84" text-anchor="middle" font-size="12" class="fill-ink3 coretx" font-family="Lato, sans-serif" letter-spacing="1.5">AGENTIX CORE</text>
        ${agents}
      </g>
    </svg>
  </div>`;
}
function wfTilt(e, el) {
  const svg = el.querySelector('svg'); if (!svg) return;
  if (!e) { svg.style.transform = ''; return; }
  const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  svg.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
}
