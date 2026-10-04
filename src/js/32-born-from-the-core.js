/* ======================================================================
   BORN FROM THE CORE: reusable overlay (agents pinch off the core)
   ====================================================================== */
function bornOverlay(W, H, cx, cy, coreR, pos, botPx, labels, only, part) {
  const goo = `<filter id="bg${W}${H}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"/></filter>`;
  let drops = '', bots = '';
  (only ? [only] : PILLAR_KEYS).forEach((k, i) => {
    const [x, y, side] = pos[k], dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const sx = cx + ux * (coreR - 22), sy = cy + uy * (coreR - 22), d = .9 + i * .55;
    drops += `<circle class="bulge" cx="${sx}" cy="${sy}" r="${botPx * .42}" fill="#1fcf86" style="--d:${d}s"/>
      <circle class="drop" cx="${sx}" cy="${sy}" r="${botPx * .34}" fill="#1fcf86" style="--d:${d}s;--dx:${(x - sx).toFixed(1)}px;--dy:${(y - sy).toFixed(1)}px"/>
      <circle class="work" cx="${sx}" cy="${sy}" r="${Math.max(3, botPx * .08)}" fill="${ROBOT_COL[k][1]}" style="--d:${5 + i * 1.3}s;--dx:${(x - ux * botPx * .6 - sx).toFixed(1)}px;--dy:${(y - uy * botPx * .6 - sy).toFixed(1)}px"/>`;
    const P = PILLARS[k], tx = side === 'left' ? -botPx * .62 : side === 'right' ? botPx * .62 : 0, ty = side === 'below' ? botPx * .78 : side === 'above' ? -botPx * .62 : 4, anchor = side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle';
    bots += `<g transform="translate(${x},${y})"><g class="bag" style="--d:${d + 1.55}s">
      <svg x="${-botPx / 2}" y="${-botPx / 2}" width="${botPx}" height="${botPx}" viewBox="${ROBOT_VB}" overflow="visible">${robotInner(ROBOT_COL[k][0], ROBOT_COL[k][1], botPx >= 40, ROBOT_COL[k][2], true, botPx >= 30)}</svg>
      ${labels ? `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-family="Lato, sans-serif"><tspan font-size="${labels}" font-weight="800" class="fill-ink" fill="#fff">${P.name}</tspan><tspan x="${tx}" dy="${labels + 2}" font-size="${labels - 3}" fill="rgb(255 255 255 / .55)" class="fill-ink3">${P.title}</tspan></text>` : ''}
    </g></g>`;
  });
  const coreC = `<circle cx="${cx}" cy="${cy}" r="${coreR}" fill="#1fcf86"><animate attributeName="r" values="${coreR};${coreR + 5};${coreR}" dur="5s" repeatCount="indefinite"/></circle>`;
  if (part === 'goo') return `<svg viewBox="0 0 ${W} ${H}" class="born absolute inset-0 w-full h-full pointer-events-none" overflow="visible"><defs>${goo}</defs><g filter="url(#bg${W}${H})">${coreC}${drops}</g></svg>`;
  if (part === 'bots') return `<svg viewBox="0 0 ${W} ${H}" class="born absolute inset-0 w-full h-full pointer-events-none" overflow="visible">${bots}</svg>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="born absolute inset-0 w-full h-full pointer-events-none" overflow="visible"><defs>${goo}</defs><g filter="url(#bg${W}${H})" opacity=".9">${drops}</g>${bots}</svg>`;
}
function playBorn(host) { const sv = host && host.querySelector('svg.born'); if (!sv) return; sv.classList.remove('go', 'now'); void sv.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => sv.classList.add('go'))); }
