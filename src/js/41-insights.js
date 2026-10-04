/* ======================================================================
   INSIGHTS
   ====================================================================== */
function renderInsights() {
  if ($('ins-team')) $('ins-team').innerHTML = PILLAR_KEYS.map(k => { const P = PILLARS[k], st = pillarStats(k); return `<div class="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl border border-indigo-400/25 bg-white/[.03]">${agentAv(P, 30)}<div class="leading-tight"><div class="text-[13px] font-bold text-ink">${P.name}</div><div class="text-[11px] text-ink3">${st.done} done · ${st.prog} active</div></div></div>`; }).join('');
  const n = { pending: 0, in_progress: 0, resolved: 0 }; S.cases.forEach(c => n[lifecycle(c)]++);
  const benign = S.cases.filter(c => c.verdict === 'Benign').length;
  const kpi = (label, val, note, tn) => `<div class="bg-panel border border-line rounded-2xl p-4"><div class="text-[11px] text-ink3">${label}</div><div class="text-2xl font-bold text-ink mt-1 font-mono">${val}</div><div class="text-[11px] mt-1 c-${tn}">${note}</div></div>`;
  $('ins-kpis').innerHTML =
    kpi('Resolved without a human', benign, `${Math.round(benign / Math.max(1, n.resolved) * 100)}% of resolved cases`, 'cx') +
    kpi('Decisions waiting for you', S.tasks.length, S.tasks.length ? 'Open them from the bell' : 'All caught up', 'amber') +
    kpi('Under investigation', n.in_progress, `Agent on #${S.agentId || '—'}`, 'indigo') +
    kpi('Analyst time saved', `${(S.stats.autoResolved * 18 / 60).toFixed(1)}h`, 'Estimate at 18 min per auto-resolution', 'cx');
  const W = 620, H = 200, pad = 28, bw = (W - pad * 2) / S.hourly.length;
  const max = Math.max(...S.hourly.map(h => h.mal + h.inc + h.ben)) * 1.1; const now = new Date();
  let bars = '';
  S.hourly.forEach((h, i) => {
    const x = pad + i * bw + bw * .18, w = bw * .64; let y = H - pad;
    [['ben', '#00c389'], ['inc', '#f59e0b'], ['mal', '#f43f5e']].forEach(([k, col]) => { const hh = h[k] / max * (H - pad * 2); y -= hh; bars += `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(0, hh - 1)}" rx="2" fill="${col}"><title>${h[k]}</title></rect>`; });
    const hr = new Date(now.getTime() - (S.hourly.length - 1 - i) * 3600000).getHours();
    bars += `<text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" class="fill-ink4" font-size="10" font-family="JetBrains Mono, monospace">${String(hr).padStart(2, '0')}h</text>`;
  });
  const grid = [0, .5, 1].map(f => { const y = H - pad - f * (H - pad * 2); return `<line x1="${pad}" x2="${W - pad}" y1="${y}" y2="${y}" class="stroke-line" stroke-dasharray="3 4"/><text x="${pad - 6}" y="${y + 3}" text-anchor="end" class="fill-ink4" font-size="9" font-family="JetBrains Mono, monospace">${Math.round(f * max)}</text>`; }).join('');
  $('ins-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="w-full min-w-[480px] h-auto" role="img" aria-label="Verdicts per hour">${grid}${bars}</svg>`;
  const counts = {};
  S.cases.filter(c => c.verdict === 'Malicious' || c.verdict === 'Contained').forEach(c => c.mitre.forEach(m => counts[m] = (counts[m] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6); const tmax = top.length ? top[0][1] : 1;
  $('ins-mitre').innerHTML = top.map(([m, v]) => `<div class="text-[11px]"><div class="flex justify-between mb-0.5"><span class="font-mono text-ink2">${m}</span><span class="font-mono text-ink3">${v}</span></div><div class="h-1.5 rounded-full bg-sunk"><div class="h-full rounded-full bg-rose-500" style="width:${v / tmax * 100}%"></div></div></div>`).join('');
  const doms = {};
  S.cases.forEach(c => { doms[c.domain] = doms[c.domain] || { pending: 0, in_progress: 0, resolved: 0, t: 0 }; doms[c.domain][lifecycle(c)]++; doms[c.domain].t++; });
  $('ins-domains').innerHTML = Object.entries(doms).sort((a, b) => b[1].t - a[1].t).map(([d, v]) => `
    <div class="grid grid-cols-[80px,1fr,40px] items-center gap-3 text-[11px]"><span class="text-ink2 font-medium">${d}</span>
      <div class="h-2.5 rounded-full bg-sunk flex overflow-hidden"><div class="bg-amber-500" style="width:${v.pending / v.t * 100}%"></div><div class="bg-indigo-500" style="width:${v.in_progress / v.t * 100}%"></div><div class="bg-cx" style="width:${v.resolved / v.t * 100}%"></div></div>
      <span class="font-mono text-ink3 text-right">${v.t}</span></div>`).join('');
}

