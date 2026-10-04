/* ======================================================================
   DECISION IMPACT VISUALS, different per decision type
   ====================================================================== */
const IMPACT = {
  ps:     { icon: 'monitor', center: '{host}', effect: 'isolate', dir: 'out', title: 'Isolation cuts {host} off the network, C2 beaconing stops', threats: ['C2 · {ext}', 'Loader domain (3 days old)'], normal: ['File server', 'Domain controller', 'Mail relay'] },
  vss:    { icon: 'monitor', center: '{host}', effect: 'isolate', dir: 'out', title: 'Isolation stops encryption before it reaches shared drives', threats: ['\\\\finance-share', '\\\\hr-share', 'Backup server'], normal: ['Domain controller', 'Print server'] },
  smb:    { icon: 'server', center: '{host}', effect: 'isolate', dir: 'out', title: 'Isolating the source host stops lateral movement', threats: ['SRV-11', 'SRV-14', 'SRV-19', 'DC-02'], normal: ['Admin jump host'] },
  kerb:   { icon: 'key-round', center: 'Service accounts', effect: 'rotate', dir: 'out', title: 'Rotating passwords makes every stolen ticket useless', threats: ['svc_sql ticket → {host}', 'svc_backup ticket → {host}', 'svc_web ticket → {host}'], normal: ['Scheduled jobs', 'IIS app pools'] },
  dns:    { icon: 'globe', center: '{host}', effect: 'block', dir: 'out', title: 'Sinkholing the domain closes the DNS tunnel', threats: ['*.qz7-cdn.xyz (TXT)'], normal: ['Corporate resolver', 'Microsoft 365'] },
  oauth:  { icon: 'app-window', center: 'Unverified app', effect: 'revoke', dir: 'in', title: 'Revoking the grant removes the app’s mailbox access', threats: ['Mailbox read/write', 'Offline access token'], normal: ['Basic profile'] },
  travel: { icon: 'user-round', center: '{user}', effect: 'revoke', dir: 'in', title: 'Resetting sessions kicks the replayed token out', threats: ['Proxy session · São Paulo'], normal: ['Office session · Tel Aviv', 'Managed mobile'] },
  s3:     { icon: 'key-square', center: 'IAM access key', effect: 'revoke', dir: 'in', title: 'Suspending the key stops bulk reads across 44 buckets', threats: ['finance-archive', 'hr-exports', 'customer-pii'], normal: ['ci-artifacts'] },
  ssl:    { icon: 'container', center: '{host}', effect: 'patch', dir: 'in', title: 'Rebuilding replaces the vulnerable TLS stack', threats: ['Internet ingress :443'], normal: ['Internal batch jobs'] }
};
const EFFECT_WORD = { isolate: 'Isolate', rotate: 'Rotate', block: 'Sinkhole', revoke: 'Revoke', patch: 'Rebuild' };
function impactPreview(on) { const el = $('impact'); if (el) el.classList.toggle('preview', on ?? !el.classList.contains('preview')); }
function impactHTML(c, tk) {
  if (tk.type === 'Investigation Steering') return steeringVisual(c);
  const sp = IMPACT[c.threat] || IMPACT.ps, m = caseModel(c);
  const fill = x => x.replace('{ext}', m.ext).replace('{host}', c.host).replace('{user}', c.user);
  const W = 680, H = 250, cx = 340, cy = 125;
  const L = sp.normal.map(fill), R = sp.threats.map(fill);
  const ys = n => n === 1 ? [cy] : Array.from({ length: n }, (_, i) => 34 + i * (H - 68) / (n - 1));
  const ly = ys(L.length), ry = ys(R.length);
  const path = (x1, y1, x2, y2) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
  const box = (x, y, label, kind) => {
    const t = label.length > 26 ? label.slice(0, 25) + '…' : label;
    return `<g><rect x="${x - 82}" y="${y - 15}" width="164" height="30" rx="9" class="fill-panel" stroke="${kind === 'threat' ? '#f43f5e' : 'rgb(var(--line2))'}" stroke-width="${kind === 'threat' ? 1.6 : 1}"/>
      <circle cx="${x - 68}" cy="${y}" r="4" fill="${kind === 'threat' ? '#f43f5e' : 'rgb(var(--ink4))'}"/>
      <text x="${x - 58}" y="${y + 4}" font-size="11.5" class="fill-ink" font-family="Lato, sans-serif">${esc(t)}</text></g>`;
  };
  const mark = (x, y, kind) => {
    const g = { cut: ['#00c389', '✕'], rotate: ['#6366f1', '↻'], block: ['#00c389', '⊘'], revoke: ['#00c389', '🔒'], patch: ['#00c389', '✓'] }[kind];
    return `<g><circle cx="${x}" cy="${y}" r="11" fill="${g[0]}" stroke="rgb(var(--panel))" stroke-width="2"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${g[1]}</text></g>`;
  };
  let edges = '', nodes = '', pv = '';
  L.forEach((l, i) => {
    const d = path(cx - 44, cy, 176, ly[i]);
    edges += `<path d="${d}" class="fx-normal" fill="none" stroke="rgb(var(--line2))" stroke-width="2"/>`;
    nodes += box(94, ly[i], l, 'normal');
    if (sp.effect === 'isolate') pv += mark((cx - 44 + 176) / 2, (cy + ly[i]) / 2, 'cut');
  });
  R.forEach((r, i) => {
    const d = sp.dir === 'in' ? path(W - 176, ry[i], cx + 44, cy) : path(cx + 44, cy, W - 176, ry[i]);
    edges += `<path d="${d}" class="fx-threat" fill="none" stroke="#f43f5e" stroke-width="2.4" ${sp.effect === 'rotate' ? 'stroke-dasharray="6 4"' : ''}/>`;
    edges += [0, .5].map(o => `<circle r="3.4" fill="#f43f5e" class="packet"><animateMotion dur="1.8s" begin="${o * 1.8}s" repeatCount="indefinite" path="${d}"/></circle>`).join('');
    nodes += box(W - 94, ry[i], r, 'threat');
    const mx = (cx + 44 + W - 176) / 2, my = (cy + ry[i]) / 2;
    pv += sp.effect === 'isolate' ? mark(mx, my, 'cut') : sp.effect === 'rotate' ? mark(mx, my, 'rotate') : sp.effect === 'block' ? mark(mx, my, 'block') : mark(W - 176, ry[i], sp.effect);
  });
  const ringCol = sp.effect === 'rotate' ? '#6366f1' : '#00c389';
  const center = `
    <circle cx="${cx}" cy="${cy}" r="44" fill="url(#cg)"/>
    <foreignObject x="${cx - 16}" y="${cy - 16}" width="32" height="32"><div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff;display:flex;align-items:center;justify-content:center;width:32px;height:32px">${ic(sp.icon, 'w-8 h-8')}</div></foreignObject>
    <text x="${cx}" y="${cy + 62}" text-anchor="middle" font-size="12" font-weight="600" class="fill-ink" font-family="Lato, sans-serif">${esc(fill(sp.center))}</text>
    <g class="pv"><circle class="spin-ring" cx="${cx}" cy="${cy}" r="56" fill="none" stroke="${ringCol}" stroke-width="2.5" stroke-dasharray="7 6"/></g>`;
  return `<section id="impact" class="impact eff-${sp.effect} rounded-2xl border border-line overflow-hidden">
    <div class="px-4 py-3 flex items-center justify-between gap-3 bg-panel2 border-b border-line">
      <div class="min-w-0">
        <div class="text-[11px] text-ink3"><span class="before">Right now, live activity</span><span class="after c-cx font-semibold">After you approve</span></div>
        <div class="text-[14px] font-semibold text-ink leading-snug">${esc(fill(sp.title))}</div><div class="text-[11px] text-ink4 mt-0.5 hide-narrow">Red = live malicious activity · hover Approve to see the result</div>
      </div>
      <button onclick="impactPreview()" class="shrink-0 px-2.5 py-1.5 rounded-lg bg-panel border border-line text-[12px] font-semibold text-ink2 hover:border-cx inline-flex items-center gap-1.5">${ic('wand-sparkles', 'w-3.5 h-3.5 c-cx')}<span class="before">Preview ${EFFECT_WORD[sp.effect]}</span><span class="after">Show current</span></button>
    </div>
    <svg viewBox="0 0 ${W} ${H + 20}" class="w-full h-auto block" style="max-height:340px">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sp.effect === 'rotate' ? '#6366f1' : '#f43f5e'}"/><stop offset="1" stop-color="${sp.effect === 'rotate' ? '#22d3ee' : '#fb923c'}"/></linearGradient></defs>
      ${edges}${nodes}${center}<g class="pv">${pv}</g>
    </svg>
  </section>`;
}
function steeringVisual(c) {
  const sig = decisionSignals(c);
  const M = sig.filter(x => x.dir > 0).reduce((a, x) => a + x.w, 0), B = sig.filter(x => x.dir < 0).reduce((a, x) => a + x.w, 0);
  const pm = Math.round(M / Math.max(1, M + B) * 100), qa = c.id === '183347';
  return `<section id="impact" class="impact eff-steer rounded-2xl border border-line overflow-hidden">
    <div class="px-4 py-3 flex items-center justify-between gap-3 bg-panel2 border-b border-line">
      <div><div class="text-[11px] text-ink3"><span class="before">Two explanations fit the evidence</span><span class="after c-cx font-semibold">After you approve</span></div>
      <div class="text-[14px] font-semibold text-ink">The agent can’t tell these apart without you</div></div>
      <button onclick="impactPreview()" class="shrink-0 px-2.5 py-1.5 rounded-lg bg-panel border border-line text-[12px] font-semibold text-ink2 hover:border-cx inline-flex items-center gap-1.5">${ic('wand-sparkles', 'w-3.5 h-3.5 c-cx')}<span class="before">Preview approval</span><span class="after">Show current</span></button>
    </div>
    <div class="p-5 space-y-5">
      ${[['ben', qa ? 'Authorized automation' : 'Legitimate activity', qa ? `${c.host} is a known QA runner; the unsigned file is a test build` : T[c.threat].sb, 100 - pm, '#00c389'], ['mal', qa ? 'Malicious dropper' : 'Real attack', qa ? 'An unsigned binary is hiding inside a trusted pipeline' : T[c.threat].sm, pm, '#f43f5e']].map(([k, t, d, v, col]) => `
        <div>
          <div class="flex items-baseline justify-between"><span class="text-[14px] font-semibold text-ink">${t}</span><span class="font-mono text-[18px] font-bold" style="color:${col}"><span class="before">${v}%</span><span class="after">${k === 'ben' ? '97%' : '3%'}</span></span></div>
          <div class="text-[12px] text-ink3 mb-1.5">${d}</div>
          <div class="h-4 rounded-full bg-sunk overflow-hidden"><div class="hyp hyp-${k} h-full rounded-full" style="width:${v}%;background:${col}"></div></div>
        </div>`).join('')}
      <div class="rounded-xl bg-sunk p-3 text-[12.5px] text-ink2"><b class="text-ink">What would tip it:</b> ${qa ? `confirm ${esc(c.host)} is an approved runner, or that a code-signing exception exists for this build.` : `confirm whether this matches an approved change, a known automation, or expected behavior on ${esc(c.host)}.`}</div>
    </div>
  </section>`;
}

