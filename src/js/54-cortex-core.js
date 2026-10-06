/* ======================================================================
   THE CORTEX CORE (new): green liquid + the geometric lines
   ====================================================================== */
let _ccId = 0;
function coreSVG(lines = true) {
  const i = 'cc' + (++_ccId), R = lines ? 60 : 70;
  const vals = [7, 19, 33, 47, 61, 7].map(sd => blobPath(sd, lines ? 6.5 : 8, 150, R)).join(';');
  const vals2 = [11, 23, 37, 53, 71, 11].map(sd => blobPath(sd, 7, 150, R * .62)).join(';');
  const r = mulberry32(_ccId * 977), parts = Array.from({ length: 26 }, () => { const a = r() * Math.PI * 2, d = 70 + r() * 62; return [150 + Math.cos(a) * d, 150 + Math.sin(a) * d, .6 + r() * 1.4, r() * 4]; });
  return `<svg viewBox="0 0 300 300" class="cc" overflow="visible" style="width:100%;height:100%">
    <defs>
      <radialGradient id="${i}b" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#f4fff9"/><stop offset=".3" stop-color="#a7ffd6"/><stop offset=".68" stop-color="#25d991"/><stop offset="1" stop-color="#035c3f"/></radialGradient>
      <radialGradient id="${i}g"><stop offset="0" stop-color="#4DFFA6" stop-opacity="${lines ? .5 : .55}"/><stop offset=".55" stop-color="#4DFFA6" stop-opacity=".12"/><stop offset="1" stop-color="#4DFFA6" stop-opacity="0"/></radialGradient>
      <radialGradient id="${i}i" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="#ffffff" stop-opacity=".0"/><stop offset=".75" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#d9fff0" stop-opacity=".55"/></radialGradient>
      <filter id="${i}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <circle cx="150" cy="150" r="146" fill="url(#${i}g)"/>
    ${lines ? '' : `<g fill="none">
      <circle cx="150" cy="150" r="${R + 38}" stroke="#4DFFA6" stroke-opacity=".14" stroke-width="1"/>
      <circle cx="150" cy="150" r="${R + 30}" stroke="#4DFFA6" stroke-opacity=".38" stroke-width="5" stroke-dasharray="1 5"/>
      <g class="cc-rot cc-r1"><circle cx="150" cy="150" r="${R + 20}" stroke="#4DFFA6" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${((R + 20) * 1.6).toFixed(1)} ${((R + 20) * 4.68).toFixed(1)}"/></g>
      <g class="cc-rot cc-r2"><circle cx="150" cy="150" r="${R + 20}" stroke="#22d3ee" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${((R + 20) * 1.1).toFixed(1)} ${((R + 20) * 5.18).toFixed(1)}" transform="rotate(160 150 150)"/></g>
    </g>`}
    ${lines ? '' : `<circle cx="150" cy="150" r="142" fill="none" stroke="#4DFFA6" stroke-opacity=".14" stroke-width="1"/>
      <circle cx="150" cy="150" r="128" fill="none" stroke="#4DFFA6" stroke-opacity=".38" stroke-width="5" stroke-dasharray="1.2 6"/>
      <g class="cc-rot cc-r1"><circle cx="150" cy="150" r="112" fill="none" stroke="#4DFFA6" stroke-opacity=".85" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="180 524"/><circle cx="262" cy="150" r="4" fill="#d2ffe9"/></g>
      <g class="cc-rot cc-r2"><circle cx="150" cy="150" r="112" fill="none" stroke="#22d3ee" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="110 594" stroke-dashoffset="-330"/></g>
      <g class="cc-rot cc-r4"><circle cx="150" cy="150" r="96" fill="none" stroke="#4DFFA6" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="4 9"/></g>`}
    ${lines ? `<circle cx="150" cy="150" r="141" fill="none" stroke="#4DFFA6" stroke-opacity=".32" stroke-width="7" stroke-dasharray="1.1 5.2"/>
    <circle cx="150" cy="150" r="148" fill="none" stroke="#4DFFA6" stroke-opacity=".12" stroke-width="1"/>
    <g class="cc-rot cc-r1"><circle cx="150" cy="150" r="128" fill="none" stroke="#4DFFA6" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="210 594"/>
      <circle cx="150" cy="150" r="128" fill="none" stroke="#22d3ee" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="80 724" stroke-dashoffset="-420"/>
      <circle cx="278" cy="150" r="4.5" fill="#d2ffe9"/></g>
    <g class="cc-rot cc-r2"><circle cx="150" cy="150" r="115" fill="none" stroke="#4DFFA6" stroke-opacity=".45" stroke-width="2" stroke-dasharray="5 9"/></g>
    <circle cx="150" cy="150" r="102" fill="none" stroke="#4DFFA6" stroke-opacity=".16" stroke-width="1"/>
    <g class="cc-rot cc-r3" fill="none" stroke="#7dffc4" stroke-opacity=".38" stroke-width="1.2">
      <ellipse cx="150" cy="150" rx="94" ry="30"/><ellipse cx="150" cy="150" rx="94" ry="30" transform="rotate(60 150 150)"/><ellipse cx="150" cy="150" rx="94" ry="30" transform="rotate(120 150 150)"/></g>
    <g class="cc-rot cc-r4" fill="none" stroke="#22d3ee" stroke-opacity=".28" stroke-width="1"><ellipse cx="150" cy="150" rx="84" ry="84" stroke-dasharray="2 7"/></g>
    ${parts.map(([x, y, rr, d]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}" fill="#a7ffd6" class="cc-tw" style="animation-delay:-${d.toFixed(2)}s"/>`).join('')}` : ''}
    <path fill="#4DFFA6" opacity=".45" filter="url(#${i}f)"><animate attributeName="d" dur="9s" repeatCount="indefinite" values="${vals}"/></path>
    <path fill="url(#${i}b)"><animate attributeName="d" dur="9s" repeatCount="indefinite" values="${vals}"/></path>
    <path fill="url(#${i}i)"><animate attributeName="d" dur="9s" repeatCount="indefinite" values="${vals}"/></path>
    ${lines ? '' : `<path fill="#d2ffe9" opacity=".22" filter="url(#${i}f)"><animate attributeName="d" dur="7s" repeatCount="indefinite" values="${vals2}"/></path>`}
    <ellipse cx="${150 - R * .37}" cy="${150 - R * .43}" rx="${R * .34}" ry="${R * .18}" fill="#fff" opacity=".55" transform="rotate(-30 ${150 - R * .37} ${150 - R * .43})"/>
    ${lines ? '' : `<ellipse cx="${150 + R * .3}" cy="${150 + R * .52}" rx="${R * .3}" ry="${R * .08}" fill="#d2ffe9" opacity=".25" transform="rotate(-20 ${150 + R * .3} ${150 + R * .52})"/>`}
  </svg>`;
}
let CORE_STYLE = (() => { try { return localStorage.getItem('cortex-core-style') || 'elegant'; } catch (e) { return 'elegant'; } })();
function mainAgentSVG() { const k = (typeof S !== 'undefined' && S && S.pillar) || 'analyst', [c1, c2, eye] = ROBOT_COL[k]; return `<svg viewBox="${ROBOT_VB}" style="width:100%;height:100%" overflow="visible">${robotInner(c1, c2, true, eye, true, true)}</svg>`; }
function mountCore(el) {
  if (el.dataset.jv === 'main') { el.innerHTML = mainAgentSVG(); return; }
  const st = CORE_STYLE || 'elegant';
  if (st === 'original' && window.THREE && webglOK()) { try { el.innerHTML = ''; new Orb3D(el); return; } catch (e) {} }
  el.innerHTML = coreSVG(st === 'geometric');
}
function setCoreStyle(st) {
  CORE_STYLE = st; try { localStorage.setItem('cortex-core-style', st); } catch (e) {}
  document.querySelectorAll('[data-jv]').forEach(el => { if (el.dataset.jv !== 'main') mountCore(el); });
  renderCoreSwitch(); toast(`Core style: ${{ elegant: 'Elegant', geometric: 'Geometric', original: 'Original 3D' }[st]}`, 'sparkles');
}
function renderModeSwitch() {
  const el = $('mode-switch'); if (!el) return;
  el.innerHTML = [['hunt', 'Hunter'], ['maya', 'SecOps'], ['single', 'Josh'], ['multi', 'All']].map(([k, l]) => `<button onclick="setAgentMode('${k}', true)" class="flex-1 py-1 rounded-md text-[11.5px] ${AGENT_MODE === k ? 'bg-panel text-ink font-semibold shadow-sm' : 'text-ink3 hover:text-ink'}">${l}</button>`).join('');
}
function renderCoreSwitch() {
  renderModeSwitch();
  const el = $('core-switch'); if (!el) return;
  el.innerHTML = [['elegant', 'Elegant'], ['geometric', 'Geometric'], ['original', 'Original 3D']].map(([k, l]) => `<button onclick="setCoreStyle('${k}')" class="flex-1 py-1 rounded-md text-[11.5px] ${CORE_STYLE === k ? 'bg-panel text-ink font-semibold shadow-sm' : 'text-ink3 hover:text-ink'}">${l}</button>`).join('');
}
function mountEntities() {
  const gl = !!window.THREE && webglOK();
  document.querySelectorAll('[data-jv]').forEach(el => {
    mountCore(el);
  });
}
mountEntities();

