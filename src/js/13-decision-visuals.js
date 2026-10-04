/* ======================================================================
   DECISION VISUALS
   ====================================================================== */
function decisionSignals(c) {
  const t = T[c.threat];
  const ben = new Set([t.r1b, t.r2b, t.sb]);
  const sig = [];
  getWorklog(c).filter(e => e.by === 'agent').forEach(e => {
    const txt = e.result || (e.type === 'evidence' ? e.detail : null); if (!txt) return;
    let dir = ben.has(txt) ? -1 : 1;
    if (/Mixed|Baseline/.test(e.status || '')) dir = -1;
    sig.push({ text: txt, dir, w: e.type === 'evidence' ? 3 : 2 });
  });
  if (c.verdict === 'Inconclusive' && !sig.some(x => x.dir < 0)) sig.push({ text: t.r2b, dir: -1, w: 2 });
  if (c.verdict === 'Malicious' && sig.length < 3) sig.push({ text: 'No approved change ticket or admin baseline explains this activity', dir: 1, w: 1 });
  if ((c.verdict === 'Benign' || c.verdict === 'Closed') && !sig.some(x => x.dir < 0)) sig.push({ text: t.sb, dir: -1, w: 3 });
  return sig;
}
const verdictColor = c => c.verdict === 'Malicious' ? '#f43f5e' : c.verdict === 'Inconclusive' ? '#f59e0b' : c.verdict === 'Running' ? '#6366f1' : '#00c389';
function gaugeSVG(pct, color, w = 118) {
  const p = Math.max(0, Math.min(100, pct || 0)), a = Math.PI * (1 - p / 100), x = 55 + 44 * Math.cos(a), y = 52 - 44 * Math.sin(a);
  return `<svg viewBox="0 0 110 64" width="${w}" role="img" aria-label="Confidence ${p}%">
    <path d="M11,52 A44,44 0 0 1 99,52" fill="none" stroke="rgb(var(--line))" stroke-width="9" stroke-linecap="round"/>
    ${p ? `<path d="M11,52 A44,44 0 0 1 ${x.toFixed(1)},${y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>` : ''}
    <text x="55" y="47" text-anchor="middle" font-size="19" font-weight="700" class="fill-ink" font-family="JetBrains Mono, monospace">${pct ? p + '%' : '—'}</text>
    <text x="55" y="61" text-anchor="middle" font-size="8" class="fill-ink4">confidence</text></svg>`;
}
function balanceHTML(sig) {
  const M = sig.filter(x => x.dir > 0).reduce((a, x) => a + x.w, 0), B = sig.filter(x => x.dir < 0).reduce((a, x) => a + x.w, 0);
  const max = Math.max(M, B, 6), lean = (M - B) / Math.max(1, M + B);
  const seg = (arr, col) => arr.map(x => `<div class="h-full rounded-sm" style="width:${x.w / max * 100}%;background:${col}" title="${esc(x.text)}"></div>`).join('');
  return `<div>
    <div class="flex justify-between text-[11px] font-semibold mb-1"><span class="c-cx">◀ Points to benign · ${B}</span><span class="c-rose">${M} · Points to malicious ▶</span></div>
    <div class="relative h-4 flex">
      <div class="w-1/2 h-full flex flex-row-reverse gap-[2px] pr-[2px] rounded-l-md bg-sunk overflow-hidden">${seg(sig.filter(x => x.dir < 0), '#00c389')}</div>
      <div class="w-1/2 h-full flex gap-[2px] pl-[2px] rounded-r-md bg-sunk overflow-hidden">${seg(sig.filter(x => x.dir > 0), '#f43f5e')}</div>
      <div class="absolute top-[-4px] bottom-[-4px] w-[3px] rounded-full bg-ink transition-all duration-700" style="left:calc(${50 + lean * 48}% - 1.5px)" title="Overall lean"></div>
      <div class="absolute top-0 bottom-0 left-1/2 w-px bg-line2"></div>
    </div>
  </div>`;
}
function signalList(sig, n = 4) {
  return `<ul class="space-y-1.5">${sig.slice(-n).map(x => `<li class="flex gap-2 text-[12.5px] leading-snug text-ink2"><span class="mt-[1px] shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold ${x.dir > 0 ? 'bg-rose-500/15 c-rose' : 'bg-cx/15 c-cx'}">${x.dir > 0 ? '+' : '−'}</span><span>${esc(x.text)}</span></li>`).join('')}</ul>`;
}
const STEP_LABEL = { system: 'Triggered', xql: 'Queried', evidence: 'Evidence', decision: 'Verdict', task: 'Staged' };
function chainHTML(c) {
  const st = getWorklog(c).filter(e => e.by === 'agent').slice(-6);
  return `<div class="flex items-start">${st.map((e, i) => `
    <div class="flex-1 min-w-0 flex flex-col items-center text-center relative" title="${esc(e.title + ', ' + (e.result || e.detail))}">
      ${i ? '<div class="absolute top-[11px] right-1/2 w-full h-[2px] bg-cx/50"></div>' : ''}
      <div class="relative z-[1] w-6 h-6 rounded-full flex items-center justify-center ${e.type === 'task' ? 'bg-amber-500 text-slate-950' : e.type === 'decision' ? 'bg-ink text-panel' : 'bg-cx text-slate-950'}">${ic(e.type === 'task' ? 'hourglass' : 'check', 'w-3.5 h-3.5')}</div>
      <div class="text-[11px] font-semibold text-ink2 mt-1">${STEP_LABEL[e.type] || 'Step'}</div>
      <div class="text-[11px] font-mono text-ink4">${(e.time || '').slice(0, 5)}</div>
    </div>`).join('')}</div>`;
}
function slaRing(tk) {
  const waited = Date.now() - tk.created, f = Math.min(1, waited / SLA_MS), col = f < .66 ? '#00c389' : f < 1 ? '#f59e0b' : '#f43f5e';
  const C = 2 * Math.PI * 17;
  return `<div class="flex items-center gap-2" title="Waiting on you vs the 15-minute human SLA">
    <svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="17" fill="none" stroke="rgb(var(--line))" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>
    <div class="leading-tight"><div class="text-[13px] font-bold font-mono" style="color:${col}">${fmtMs(waited)}</div><div class="text-[11px] text-ink4">waiting · SLA 15m</div></div></div>`;
}

