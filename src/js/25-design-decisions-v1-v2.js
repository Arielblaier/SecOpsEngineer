/* ======================================================================
   DESIGN DECISIONS: the investigation area (3 options per element + a live mock)
   ====================================================================== */
const DXD = {
  title: 'Phishing email led to code execution and a credential-theft attempt on SOC-Tech',
  hyp: [
    { id: 'H1', q: 'Did an attacker take control of SOC-Tech through the invoice email?', col: '#f43f5e', pct: 86 },
    { id: 'H2', q: 'Is this an approved phishing simulation or red-team test?', col: '#f59e0b', pct: 9 },
    { id: 'H3', q: 'Is this a legitimate finance tool behaving unusually?', col: '#22d3ee', pct: 5 }
  ],
  qs: [
    { q: 'Did the link in the email lead to an exploit page?', a: 'Yes', eff: [1, 0, -1], ev: ['Proxy: a.levi opened hxxps://invoice-portal[.]top/4471 at 09:03:41', 'URL Detonation: page serves a browser exploit (CVE-2023-4863)'], raw: { _time: '09:03:41', dataset: 'proxy', user: 'BANKUS\\a.levi', url: 'invoice-portal.top/4471', verdict: 'malicious' } },
    { q: 'Did a new process drop and run a file?', a: 'Yes', eff: [1, 0, -1], ev: ['msedge.exe wrote payload.dll to %TEMP% at 09:04:02', 'rundll32.exe loaded payload.dll 3 seconds later'], raw: { _time: '09:04:05', dataset: 'xdr_data', actor: 'msedge.exe', action: 'rundll32.exe payload.dll,Start', signed: false } },
    { q: 'Is the dropped file known malware?', a: 'Yes', eff: [1, -1, -1], ev: ['WildFire verdict: malware (Cobalt Strike loader)', 'Hash seen in 2 FIN7 campaigns'], raw: { sha256: 'a3f1…9e2b', wildfire: 'MALWARE', family: 'CobaltStrike' } },
    { q: 'Is there an approved simulation this week?', a: 'No', eff: [1, -1, 0], ev: ['No phishing simulation scheduled in the awareness platform', 'No red-team ticket covers SOC-Tech'], raw: { source: 'change-calendar', matches: 0 } },
    { q: 'Were credentials touched?', a: 'Yes, blocked', eff: [1, 0, -1], ev: ['rundll32.exe tried to read LSASS memory at 09:39:51', 'Blocked by Cortex XDR credential protection'], raw: { _time: '09:39:51', action: 'process_access', target: 'lsass.exe', result: 'blocked' } },
    { q: 'Did the attacker move to other hosts?', a: 'Not yet', eff: [0, 0, 0], ev: ['No logins from SOC-Tech to other machines', 'Two other inboxes got the same email; neither clicked'], raw: { lateral_logons: 0, other_recipients: 2, clicked: 0 } }
  ],
  events: [
    { t: '09:03', x: 70, k: 'issue', sev: 'high', n: 'User clicked a suspicious email link' },
    { t: '09:04', x: 140, k: 'case', n: 'Case opened' },
    { t: '09:05', x: 175, k: 'pb', n: 'URL Detonation · 2m 10s' },
    { t: '09:09', x: 285, k: 'issue', sev: 'high', n: 'Unsigned DLL dropped and run' },
    { t: '09:10', x: 320, k: 'pb', n: 'File Analysis · 40s' },
    { t: '09:15', x: 420, k: 'issue', sev: 'crit', n: 'C2 beaconing' },
    { t: '09:31', x: 545, k: 'info', n: 'Login from new device' },
    { t: '09:40', x: 640, k: 'issue', sev: 'crit', n: 'LSASS access attempt' },
    { t: '10:05', x: 820, k: 'issue', sev: 'med', n: 'Same email in 2 other inboxes' }
  ],
  rounds: [
    { t: '09:04', x: 140, h: [36, 30, 34], n: 'Framed 3 hypotheses' },
    { t: '09:09', x: 285, h: [58, 22, 20], n: 'Dropped file changes the picture' },
    { t: '09:17', x: 450, h: [79, 13, 8], n: 'Verdict: Malicious', verdict: true },
    { t: '09:40', x: 640, h: [86, 9, 5], n: 'Credential attempt confirms it' },
    { t: '10:05', x: 820, h: [86, 9, 5], n: 'New question: other inboxes' }
  ]
};
const dxBar = (pct, col, h) => `<span class="block rounded-full overflow-hidden" style="height:${h || 7}px;width:100%;background:rgb(255 255 255 / .08)"><span class="block rounded-full" style="height:${h || 7}px;width:${pct}%;background:${col}"></span></span>`;
const dxCard = inner => `<div class="rounded-2xl border border-white/10 p-5" style="background:linear-gradient(180deg, rgb(28 36 78 / .45), rgb(13 18 38 / .6))">${inner}</div>`;
const dxSev = s0 => s0 === 'crit' ? '#e11d48' : s0 === 'high' ? '#f97316' : '#f59e0b';
/* ---------- 1 · verdict and confidence ---------- */
var dxV = function (id) {
  if (id === 'A') return dxCard(`<div class="grid gap-5" style="grid-template-columns:1fr 220px"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">SUMMARY</div><p class="mt-2 text-[14px] text-white/80 leading-relaxed">a.levi clicked a link in an “Urgent invoice” email. The page exploited Edge, dropped an unsigned DLL and ran it. The DLL beacons to a known Cobalt Strike server and tried to read credentials, which was blocked.</p></div>
    <div class="border-l border-white/10 pl-5"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</div><div class="mt-1 text-[26px] font-black text-rose-400">Malicious</div><div class="mt-2 flex gap-1">${[1, 1, 1].map(() => '<span class="flex-1 h-2 rounded-full bg-rose-500"></span>').join('')}</div><div class="mt-1.5 text-[13px] text-white/60">High confidence · hover for rationale</div></div></div>`);
  if (id === 'B') return dxCard(`<div class="flex items-baseline gap-3 flex-wrap"><span class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</span><span class="text-[26px] font-black text-rose-400">Malicious</span><span class="text-[13px] text-white/60">High confidence · the top answer leads by 77 points</span></div>
    <div class="mt-4 text-[11px] font-bold tracking-[.14em] text-white/45">THE QUESTIONS JOSH SET OUT TO ANSWER</div>
    <div class="mt-2 space-y-3">${DXD.hyp.map((h, i) => `<div class="rounded-xl px-4 py-3 ${i === 0 ? 'bg-rose-500/[.08] border border-rose-400/40' : 'bg-white/[.03] border border-white/10'}"><div class="flex items-center gap-3"><span class="text-[11px] font-black" style="color:${h.col}">${h.id}</span><span class="flex-1 text-[14px] ${i === 0 ? 'text-white font-semibold' : 'text-white/75'}">${h.q}</span><span class="text-[14px] font-bold ${i === 0 ? 'text-rose-300' : 'text-white/55'}">${h.pct}%</span></div><div class="mt-2">${dxBar(h.pct, h.col, 6)}</div></div>`).join('')}</div>`);
  return dxCard(`<div class="grid gap-6" style="grid-template-columns:240px 1fr"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</div><div class="mt-1 text-[26px] font-black text-rose-400">Malicious</div><div class="mt-2 flex gap-1 max-w-[150px]">${[1, 1, 1].map(() => '<span class="flex-1 h-2 rounded-full bg-rose-500"></span>').join('')}</div><div class="mt-1.5 text-[13px] text-white/60">High confidence</div></div>
    <div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT DECIDED IT</div><div class="mt-2 space-y-2">${['The email link served a browser exploit', 'The dropped DLL is known Cobalt Strike malware', 'It tried to read credentials (blocked)'].map(x => `<div class="flex gap-2 text-[14px] text-white/85"><span class="mt-0.5 w-5 h-5 rounded-full border border-emerald-400/50 bg-emerald-500/10 text-emerald-300 flex items-center justify-center text-[11px] shrink-0">✓</span>${x}</div>`).join('')}</div>
      <div class="mt-3 text-[11px] font-bold tracking-[.14em] text-white/45">WHAT WOULD CHANGE MY MIND</div><div class="mt-1 text-[13.5px] text-white/65">An approved phishing simulation that used this exact link and file.</div></div></div>`);
}
/* ---------- 2 · investigation process (the case changes on its own) ---------- */
var dxP = function (id) {
  const ev = DXD.events, R = DXD.rounds;
  if (id === 'A') {
    const mark = e => e.k === 'issue' ? `<polygon points="${e.x},${46 - 9} ${e.x + 8},${46 + 5} ${e.x - 8},${46 + 5}" fill="${dxSev(e.sev)}"/>` : e.k === 'info' ? `<circle cx="${e.x}" cy="46" r="6" fill="#0b1030" stroke="#94a3b8"/><text x="${e.x}" y="49" text-anchor="middle" font-size="8" fill="#cbd5e1" font-weight="900">i</text>` : e.k === 'case' ? `<rect x="${e.x - 6}" y="40" width="12" height="12" rx="3" fill="#818cf8"/>` : `<rect x="${e.x - 2}" y="70" width="${e.n.includes('2m') ? 90 : 30}" height="12" rx="3" fill="#334155" stroke="#64748b"/>`;
    return dxCard(`<svg viewBox="0 0 900 250" class="w-full h-auto" font-family="Lato, sans-serif">
      <text x="10" y="24" font-size="10.5" fill="rgb(255 255 255 / .45)" letter-spacing="1.5">THE CASE · changes on its own</text><line x1="10" x2="890" y1="46" y2="46" stroke="rgb(255 255 255 / .12)"/>
      <text x="10" y="66" font-size="9.5" fill="rgb(255 255 255 / .35)">playbooks</text>
      ${ev.map(e => `<g ${tipAttr(`<div class="text-[13px] text-ink">${e.n}</div><div class="text-[12px] text-ink3">${e.t}</div>`)} style="cursor:help">${mark(e)}</g>`).join('')}
      <text x="10" y="128" font-size="10.5" fill="rgb(255 255 255 / .45)" letter-spacing="1.5">JOSH · keeps up</text><rect x="140" y="140" width="750" height="16" rx="8" fill="url(#dxJ)"/>
      ${R.map(r => `<g><line x1="${r.x}" x2="${r.x}" y1="52" y2="138" stroke="rgb(77 255 166 / .35)" stroke-dasharray="3 4"/><circle cx="${r.x}" cy="148" r="8" fill="#04261a" stroke="${r.verdict ? '#f43f5e' : '#4DFFA6'}" stroke-width="2"/>
        <g transform="translate(${r.x - 30},170)">${r.h.map((v, i) => `<rect x="0" y="${i * 10}" width="60" height="6" rx="3" fill="rgb(255 255 255 / .08)"/><rect x="0" y="${i * 10}" width="${v * .6}" height="6" rx="3" fill="${DXD.hyp[i].col}"/>`).join('')}</g>
        <text x="${r.x}" y="218" text-anchor="middle" font-size="10" fill="rgb(255 255 255 / .55)">${r.t}</text><text x="${r.x}" y="232" text-anchor="middle" font-size="10" fill="${r.verdict ? '#fda4af' : 'rgb(255 255 255 / .75)'}">${r.n.length > 26 ? r.n.slice(0, 25) + '…' : r.n}</text></g>`).join('')}
      <defs><linearGradient id="dxJ" x1="0" x2="1"><stop offset="0" stop-color="#5eead4" stop-opacity=".5"/><stop offset="1" stop-color="#4DFFA6" stop-opacity=".5"/></linearGradient></defs></svg>
    <div class="mt-2 text-[12.5px] text-white/55">Top: what happened to the case (issues, informational signals, playbook runs). Bottom: each time Josh re-evaluated, with the three hypotheses at that moment.</div>`);
  }
  if (id === 'B') {
    S.dxCp = S.dxCp ?? R.length - 1; const k = S.dxCp, r = R[k];
    const caseSince = ev.filter(e => (k === 0 ? e.x <= r.x : e.x > R[k - 1].x && e.x <= r.x));
    return dxCard(`<div class="text-[11px] font-bold tracking-[.14em] text-white/45 mb-2">CHECKPOINTS · each one is a change in the case and Josh’s re-evaluation</div>
      <div class="grid gap-2" style="grid-template-columns:repeat(${R.length},minmax(0,1fr))">${R.map((x, i) => `<button onclick="S.dxCp=${i};renderDxSim()" class="text-left rounded-xl p-3 border ${i === k ? 'border-indigo-300/70 bg-indigo-500/10' : 'border-white/10 bg-white/[.03] hover:border-white/25'}"><div class="flex justify-between text-[11.5px]"><span class="font-mono text-white/55">${x.t}</span>${i === R.length - 1 ? '<span class="text-[10px] font-bold text-emerald-300">LATEST</span>' : ''}</div><div class="mt-1 text-[12.5px] text-white/85 leading-snug">${x.n}</div><div class="mt-2">${dxBar(x.h[0], '#f43f5e', 5)}</div></button>`).join('')}</div>
      <div class="mt-4 grid gap-4" style="grid-template-columns:1fr 1fr">
        <div class="rounded-xl p-4 bg-white/[.03] border border-white/10"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT CHANGED IN THE CASE</div><div class="mt-2 space-y-1.5">${caseSince.map(e => `<div class="flex items-center gap-2 text-[13px]"><span class="w-2 h-2 rounded-full" style="background:${e.k === 'issue' ? dxSev(e.sev) : e.k === 'info' ? '#94a3b8' : e.k === 'pb' ? '#64748b' : '#818cf8'}"></span><span class="font-mono text-white/45">${e.t}</span><span class="text-white/85">${e.n}</span></div>`).join('') || '<div class="text-[13px] text-white/45">Nothing new</div>'}</div></div>
        <div class="rounded-xl p-4 bg-white/[.03] border border-white/10"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">HOW JOSH RE-EVALUATED</div><div class="mt-1 text-[13.5px] text-white/85">${r.n}</div><div class="mt-2 space-y-2">${DXD.hyp.map((h, i) => `<div class="flex items-center gap-2 text-[12px]"><span class="w-6 font-bold" style="color:${h.col}">${h.id}</span><span class="flex-1">${dxBar(r.h[i], h.col, 6)}</span><span class="w-9 text-right text-white/55">${r.h[i]}%</span>${k ? `<span class="w-10 text-right ${r.h[i] - R[k - 1].h[i] > 0 ? 'text-emerald-300' : r.h[i] - R[k - 1].h[i] < 0 ? 'text-rose-300' : 'text-white/35'}">${r.h[i] - R[k - 1].h[i] > 0 ? '+' : ''}${r.h[i] - R[k - 1].h[i] || '0'}</span>` : ''}</div>`).join('')}</div></div>
      </div>`);
  }
  const feed = [...ev.map(e => ({ t: e.t, sys: true, n: e.k === 'issue' ? `New issue grouped: ${e.n}` : e.k === 'pb' ? `Playbook ran: ${e.n}` : e.k === 'info' ? `Informational: ${e.n}` : e.n })), ...R.map(r => ({ t: r.t, n: r.n + '.' }))].sort((a, b) => a.t.localeCompare(b.t) || (a.sys ? -1 : 1));
  return dxCard(`<div class="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">${feed.map(f => f.sys ? `<div class="flex items-center gap-2 text-[12px] text-white/50"><span class="font-mono">${f.t}</span><span class="h-px w-4 bg-white/20"></span><span>${f.n}</span></div>` : `<div class="flex gap-2.5"><span class="mt-0.5 shrink-0">${agentAv(PILLARS.analyst, 22, false)}</span><div class="rounded-xl rounded-tl-sm px-3 py-2 bg-white/[.06] text-[13.5px] text-white/85"><span class="font-mono text-white/40 mr-2 text-[11.5px]">${f.t}</span>${f.n}</div></div>`).join('')}</div>`);
}
/* ---------- 3 · hypotheses, questions, answers, evidence ---------- */
var dxR = function (id) {
  const H = DXD.hyp, Q = DXD.qs;
  if (id === 'A') {
    const hx = i => 40 + i * 290, qx = i => 70 + i * 152;
    return dxCard(`<svg viewBox="0 0 900 330" class="w-full h-auto" font-family="Lato, sans-serif">
      ${Q.map((q, i) => q.eff.map((w, h) => w ? `<path d="M${qx(i)},242 C${qx(i)},170 ${hx(h) + 120},150 ${hx(h) + 120},96" fill="none" stroke="${w > 0 ? '#4ade80' : '#fb7185'}" stroke-width="1.8" opacity=".8"/>` : '').join('')).join('')}
      ${H.map((h, i) => `<rect x="${hx(i)}" y="14" width="240" height="82" rx="12" fill="rgb(28 36 78 / .8)" stroke="${h.col}"/><foreignObject x="${hx(i) + 10}" y="20" width="220" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 12px/1.35 Lato, sans-serif;color:#e7ecff"><span style="color:${h.col};font-weight:900">${h.id} · ${h.pct}%</span><br/>${h.q}</div></foreignObject>`).join('')}
      ${Q.map((q, i) => `<rect x="${qx(i) - 68}" y="242" width="136" height="76" rx="10" fill="rgb(28 36 78 / .8)" stroke="rgb(129 140 248 / .4)"/><foreignObject x="${qx(i) - 62}" y="247" width="124" height="68"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 11px/1.3 Lato, sans-serif;color:#e7ecff">${q.q}<div style="margin-top:3px;color:#fda4af;font-weight:800">${q.a}</div></div></foreignObject>`).join('')}</svg>`);
  }
  if (id === 'B') {
    S.dxRow = S.dxRow ?? 2;
    return dxCard(`<div class="text-[12.5px] text-white/55 mb-3">Each row is a question Josh asked. The columns show what its answer did to each hypothesis. Click a row to open the evidence.</div>
      <div class="rounded-xl border border-white/10 overflow-hidden"><div class="grid text-[11.5px] text-white/50 px-4 py-2 bg-white/[.03]" style="grid-template-columns:1fr 90px repeat(3, 64px)"><span>Question</span><span>Answer</span>${H.map(h => `<span class="text-center font-bold" style="color:${h.col}" ${tipAttr(`<div class="text-[13px] text-ink">${h.q}</div>`)}>${h.id}</span>`).join('')}</div>
      ${Q.map((q, i) => { const on = S.dxRow === i; return `<div class="border-t border-white/[.06]"><button onclick="S.dxRow=S.dxRow===${i}?-1:${i};renderDxSim()" class="w-full grid items-center text-left px-4 py-3 hover:bg-white/[.03] ${on ? 'bg-indigo-500/[.08]' : ''}" style="grid-template-columns:1fr 90px repeat(3, 64px)"><span class="text-[13.5px] text-white/90 flex items-center gap-2"><span class="text-white/35">${on ? '▾' : '▸'}</span>${q.q}</span><span class="text-[13px] ${/^yes/i.test(q.a) ? 'text-rose-300' : /^no\b/i.test(q.a) ? 'text-emerald-300' : 'text-white/50'}">${q.a}</span>${q.eff.map(w => `<span class="text-center"><span class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${w > 0 ? 'bg-emerald-500/15 text-emerald-300' : w < 0 ? 'bg-rose-500/15 text-rose-300' : 'text-white/30'}">${w > 0 ? 'supports' : w < 0 ? 'against' : '—'}</span></span>`).join('')}</button>
        ${on ? `<div class="px-4 pb-4 pl-10 grid gap-4" style="grid-template-columns:1fr 1fr"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">EVIDENCE</div>${q.ev.map(e => `<div class="mt-1.5 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}
            <div class="mt-3 text-[11px] font-bold tracking-[.14em] text-white/45">WHAT IT MEANS</div><div class="mt-1 text-[13px] text-white/70">${q.eff.map((w, h) => w > 0 ? `Supports ${H[h].id}` : w < 0 ? `Argues against ${H[h].id}` : '').filter(Boolean).join(' · ') || 'Doesn’t move any hypothesis yet.'}</div></div>
          <div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">RAW EVENT</div><pre class="mt-1.5 rounded-lg p-3 bg-black/40 border border-white/10 text-[11px] text-white/70 font-mono whitespace-pre-wrap">${esc(JSON.stringify(q.raw, null, 2))}</pre></div></div>` : ''}</div>`; }).join('')}</div>`);
  }
  S.dxHyp = S.dxHyp ?? 0;
  return dxCard(`<div class="space-y-2.5">${H.map((h, i) => { const on = S.dxHyp === i, forQ = Q.filter(q => q.eff[i] > 0), agQ = Q.filter(q => q.eff[i] < 0);
    return `<div class="rounded-xl border ${on ? 'border-white/25' : 'border-white/10'} overflow-hidden"><button onclick="S.dxHyp=S.dxHyp===${i}?-1:${i};renderDxSim()" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[.03]"><span class="text-[11px] font-black" style="color:${h.col}">${h.id}</span><span class="flex-1 text-[14px] text-white/90">${h.q}</span><span class="w-28">${dxBar(h.pct, h.col, 6)}</span><span class="w-10 text-right text-[13px] text-white/60">${h.pct}%</span></button>
      ${on ? `<div class="px-4 pb-4 grid gap-4" style="grid-template-columns:1fr 1fr"><div><div class="text-[11px] font-bold tracking-[.14em] text-emerald-300/80">FOR</div>${forQ.map(q => `<div class="mt-1.5 text-[13px] text-white/80">${q.q} <b class="text-white">${q.a}</b><div class="text-[12px] text-white/45">${q.ev[0]}</div></div>`).join('') || '<div class="mt-1.5 text-[13px] text-white/40">Nothing</div>'}</div>
        <div><div class="text-[11px] font-bold tracking-[.14em] text-rose-300/80">AGAINST</div>${agQ.map(q => `<div class="mt-1.5 text-[13px] text-white/80">${q.q} <b class="text-white">${q.a}</b><div class="text-[12px] text-white/45">${q.ev[0]}</div></div>`).join('') || '<div class="mt-1.5 text-[13px] text-white/40">Nothing</div>'}</div></div>` : ''}</div>`; }).join('')}</div>`);
}
/* ---------- 4 · attack graph and blast radius ---------- */
const DXG = {
  nodes: [
    { id: 'mail', x: 70, y: 70, k: 'mail', n: '“Urgent invoice #4471”', s: 'email · 3 recipients', obs: 1 },
    { id: 'user', x: 230, y: 70, k: 'user', n: 'a.levi', s: 'clicked the link', obs: 1 },
    { id: 'page', x: 390, y: 70, k: 'web', n: 'invoice-portal[.]top', s: 'exploit page', obs: 1 },
    { id: 'edge', x: 550, y: 70, k: 'proc', n: 'msedge.exe', s: 'exploited (CVE-2023-4863)', obs: 1 },
    { id: 'dll', x: 550, y: 190, k: 'file', n: 'payload.dll', s: 'unsigned · Cobalt Strike', obs: 1 },
    { id: 'rdl', x: 390, y: 190, k: 'proc', n: 'rundll32.exe', s: 'runs the payload', obs: 1 },
    { id: 'c2', x: 230, y: 190, k: 'ip', n: '8.130.54.67', s: 'C2 · 24 beacons', obs: 1 },
    { id: 'lsass', x: 390, y: 300, k: 'cred', n: 'LSASS memory', s: 'read attempt · blocked', obs: 1 },
    { id: 'svc', x: 600, y: 300, k: 'user', n: 'svc_backup', s: 'cached on SOC-Tech', obs: 0 },
    { id: 'other', x: 70, y: 190, k: 'user', n: '2 other inboxes', s: 'got it · didn’t click', obs: 1 }
  ],
  edges: [
    ['mail', 'user', 'delivered to', '09:01 · from billing@inv0ice-mail[.]com', 1], ['user', 'page', 'clicked', '09:03:41 · from Outlook on SOC-Tech', 1], ['page', 'edge', 'exploited', 'WebP heap overflow · Edge crashed and recovered', 1],
    ['edge', 'dll', 'dropped', '09:04:02 · %TEMP%\\payload.dll', 1], ['dll', 'rdl', 'loaded by', 'rundll32.exe payload.dll,Start', 1], ['rdl', 'c2', 'beacons to', '24 TLS connections, every ~45s', 1],
    ['rdl', 'lsass', 'tried to read', '09:39:51 · blocked by credential protection', 1], ['lsass', 'svc', 'would expose', 'svc_backup has a cached logon on SOC-Tech', 0], ['mail', 'other', 'also sent to', 'Same sender and link · no clicks', 1]
  ],
  blast: [
    { from: 'svc', x: 790, y: 250, n: 'FS-FIN-01', s: 'finance file server', via: 'svc_backup has admin rights' },
    { from: 'svc', x: 790, y: 330, n: 'BACKUP-01', s: 'backup server', via: 'service account login' },
    { from: 'svc', x: 820, y: 410, n: 'PAY-DB-01', s: 'payments database', via: 'backups include DB credentials', crown: 1 },
    { from: 'edge', x: 780, y: 110, n: 'VPN-GW', s: 'VPN gateway', via: 'saved VPN profile on SOC-Tech' }
  ]
};
var dxGraph = function (withBlast, onlyBlast) {
  const N = Object.fromEntries(DXG.nodes.map(n => [n.id, n]));
  const glyph = { mail: '✉', user: '👤', web: '🌐', proc: '⚙', file: '📄', ip: 'IP', cred: '🔑' };
  const node = (n, dim) => `<g ${tipAttr(`<div class="text-[14px] font-bold text-ink">${n.n}</div><div class="text-[12.5px] text-ink3">${n.s}</div><div class="text-[11.5px] mt-1 ${n.obs ? 'text-rose-300' : 'text-amber-300'}">${n.obs ? 'Observed' : 'Suspected · not observed yet'}</div>`)} style="cursor:help;opacity:${dim ? .35 : 1}"><circle cx="${n.x}" cy="${n.y}" r="20" fill="${n.obs ? '#3b1220' : '#2b3445'}" stroke="${n.obs ? '#f43f5e' : '#f59e0b'}" stroke-width="1.6" ${n.obs ? '' : 'stroke-dasharray="4 3"'}/><text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="${n.k === 'ip' ? 11 : 15}" font-weight="900" fill="#fff">${glyph[n.k]}</text>
    <text x="${n.x}" y="${n.y + 38}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">${n.n}</text><text x="${n.x}" y="${n.y + 52}" text-anchor="middle" font-size="10" fill="rgb(255 255 255 / .55)">${n.s}</text></g>`;
  const edge = ([a, b, verb, tip, obs], dim) => { const A = N[a], B = N[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, x1 = A.x + ux * 22, y1 = A.y + uy * 22, x2 = B.x - ux * 24, y2 = B.y - uy * 24, vert = Math.abs(dx) < 5, mx = (x1 + x2) / 2 + (vert ? verb.length * 3 + 14 : 0), my = vert ? y1 + (y2 - y1) * .7 : (y1 + y2) / 2;
    return `<g style="opacity:${dim ? .3 : 1}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${obs ? '#f43f5e' : '#f59e0b'}" stroke-width="1.8" ${obs ? '' : 'stroke-dasharray="5 4"'} marker-end="url(#dx${obs ? 'R' : 'A'})"/>
      <rect x="${mx - verb.length * 3 - 7}" y="${my - 9}" width="${verb.length * 6 + 14}" height="17" rx="8.5" fill="#0b1030" stroke="${obs ? 'rgb(244 63 94 / .45)' : 'rgb(245 158 11 / .45)'}"/><text x="${mx}" y="${my + 3.5}" text-anchor="middle" font-size="10" fill="${obs ? '#fda4af' : '#fcd34d'}">${verb}</text>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="18" style="cursor:help" ${tipAttr(`<div class="text-[11px] text-ink3 tracking-wide">ACTIVITY</div><div class="text-[14px] font-bold text-ink mt-0.5">${A.n} ${verb} ${B.n}</div><div class="text-[12.5px] text-ink2 mt-1">${tip}</div>`)}/></g>`; };
  let blast = '';
  if (withBlast || onlyBlast) blast = DXG.blast.map(b => { const A = N[b.from];
    return `<g ${tipAttr(`<div class="text-[11px] text-ink3 tracking-wide">BLAST RADIUS</div><div class="text-[14px] font-bold text-ink mt-0.5">${b.n} · ${b.s}</div><div class="text-[12.5px] text-ink2 mt-1">Reachable because ${b.via}</div>`)} style="cursor:help"><path d="M${A.x + 20},${A.y} C${(A.x + b.x) / 2},${A.y} ${(A.x + b.x) / 2},${b.y} ${b.x - 18},${b.y}" fill="none" stroke="#fb7185" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="2 5"/>
      <rect x="${b.x - 16}" y="${b.y - 16}" width="32" height="32" rx="8" fill="${b.crown ? '#4c0519' : '#1e293b'}" stroke="#fb7185" stroke-dasharray="3 3"/><text x="${b.x}" y="${b.y + 5}" text-anchor="middle" font-size="14">${b.crown ? '👑' : '🖥'}</text>
      <text x="${b.x + 24}" y="${b.y - 1}" font-size="11.5" font-weight="700" fill="#fff">${b.n}</text><text x="${b.x + 24}" y="${b.y + 13}" font-size="10" fill="rgb(255 255 255 / .55)">${b.s}</text></g>`; }).join('');
  return `<svg viewBox="0 0 960 ${withBlast || onlyBlast ? 450 : 380}" class="w-full h-auto" font-family="Lato, sans-serif"><defs><marker id="dxR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f43f5e"/></marker><marker id="dxA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f59e0b"/></marker></defs>
    ${DXG.edges.map(e => edge(e, onlyBlast)).join('')}${DXG.nodes.map(n => node(n, onlyBlast && !['svc', 'edge'].includes(n.id))).join('')}${blast}</svg>`;
}
var dxG = function (id) {
  const legend = `<div class="mt-2 flex gap-4 text-[12px] text-white/55"><span><span style="display:inline-block;width:20px;border-top:2px solid #f43f5e;vertical-align:middle;margin-right:6px"></span>observed</span><span><span style="display:inline-block;width:20px;border-top:2px dashed #f59e0b;vertical-align:middle;margin-right:6px"></span>suspected</span>${id !== 'A' ? '<span><span style="display:inline-block;width:20px;border-top:2px dotted #fda4af;vertical-align:middle;margin-right:6px"></span>reachable (blast radius)</span>' : ''}<span class="ml-auto">Hover any step for the activity</span></div>`;
  if (id === 'A') return dxCard(dxGraph(false) + legend);
  if (id === 'B') { S.dxBl = !!S.dxBl; return dxCard(`<div class="flex justify-end mb-1"><button onclick="S.dxBl=!S.dxBl;renderDxSim()" class="px-3 py-1.5 rounded-full text-[12.5px] font-semibold ${S.dxBl ? 'bg-rose-500/20 text-rose-200 border border-rose-400/50' : 'border border-white/15 text-white/75 hover:text-white'}">${S.dxBl ? 'Hide blast radius' : 'Show blast radius'}</button></div>${dxGraph(S.dxBl)}${legend}`); }
  S.dxTab = S.dxTab || 'attack';
  return dxCard(`<div class="inline-flex rounded-full border border-white/15 p-1 mb-2">${[['attack', 'Attack graph'], ['blast', 'Blast radius']].map(([k, l]) => `<button onclick="S.dxTab='${k}';renderDxSim()" class="px-3.5 py-1 rounded-full text-[12.5px] ${S.dxTab === k ? 'bg-white text-slate-950 font-bold' : 'text-white/65'}">${l}</button>`).join('')}</div>${dxGraph(false, S.dxTab === 'blast')}${legend}`);
}
const DX = [
  { key: 'verdict', name: 'Verdict and confidence', q: 'How should the case tell you what Josh concluded and how sure he is?', rec: 'B', render: id => dxV(id), opts: [
    { id: 'A', name: 'Header block', tag: 'Today', idea: 'Summary on the left; the verdict, three confidence bars and the rationale on hover on the right.', pros: ['Familiar, reads like a product header', 'Small footprint'], cons: ['Confidence is a level, not a reason', 'Doesn’t say what Josh ruled out'] },
    { id: 'B', name: 'Hypotheses as questions', tag: 'Ties to the method', idea: 'Josh’s hypotheses written as the questions he set out to answer for this case, each with how likely it is. The verdict is the top one.', pros: ['Confidence is explainable: one answer clearly leads', 'Specific to the use case, not generic labels', 'Shows what was ruled out'], cons: ['Longer than a single verdict word', 'Needs good writing per case type'] },
    { id: 'C', name: 'Verdict + what decided it', tag: 'Fastest read', idea: 'The verdict and confidence, the three facts that decided it, and what would change Josh’s mind.', pros: ['Answers “why?” immediately', 'Great for approvals on mobile'], cons: ['Hides the alternatives Josh considered', 'The three facts are a summary, not the full logic'] }
  ] },
  { key: 'process', name: 'Investigation process', q: 'The case keeps changing on its own. How should you see that, and how Josh kept up?', rec: 'B', render: id => dxP(id), opts: [
    { id: 'A', name: 'Two lanes, one clock', tag: 'Most honest', idea: 'Top lane: the case changing on its own (issues, informational signals, playbook runs). Bottom lane: Josh, with each re-evaluation lined up under what caused it.', pros: ['Shows clearly that the case and the investigation are separate', 'Cause and effect line up in time'], cons: ['Dense on busy cases', 'Details need hover'] },
    { id: 'B', name: 'Checkpoints', tag: 'Most usable', idea: 'One card per re-evaluation. Select one to see what changed in the case since the last one and how each hypothesis moved.', pros: ['Answers “what did Josh know at 09:09?”', 'Before/after is explicit (+22, −8)', 'Opens on the latest by default'], cons: ['Time is shown as steps, not to scale'] },
    { id: 'C', name: 'Feed with case events', tag: 'Most human', idea: 'Josh’s messages interleaved with system lines for every case change, like a chat with a log.', pros: ['Reads like a teammate’s report', 'Good for handover and audits'], cons: ['Long cases get long', 'Hard to compare moments'] }
  ] },
  { key: 'reason', name: 'Hypotheses, questions, answers, evidence', q: 'How should you see why each question was asked and what it proved?', rec: 'B', render: id => dxR(id), opts: [
    { id: 'A', name: 'Linked graph', tag: 'Same as the explainer', idea: 'Hypotheses on top, questions below, green and red lines show what each answer supports or argues against.', pros: ['Very clear at a glance', 'Consistent with the landing page'], cons: ['Busy past 6–8 questions', 'Evidence needs a second layer'] },
    { id: 'B', name: 'Evidence matrix', tag: 'Most precise', idea: 'Rows are questions with their answers, columns are hypotheses. Click a row: the evidence, what it means, and the raw event open in place.', pros: ['Scales to many questions', 'Shows exactly which answer moved which hypothesis', 'Evidence and raw data one click away'], cons: ['Less visual', 'Needs readable column headers (hover shows the hypothesis)'] },
    { id: 'C', name: 'Hypothesis cards', tag: 'Most guided', idea: 'One card per hypothesis; open it to see the questions and evidence for and against it.', pros: ['Argue with one explanation at a time', 'The winning one is obvious'], cons: ['Questions repeat across cards', 'Comparing hypotheses needs scrolling'] }
  ] },
  { key: 'attack', name: 'Attack graph and blast radius', q: 'How should the case show what actually happened, and what it could reach?', rec: 'B', render: id => dxG(id), opts: [
    { id: 'A', name: 'Attack graph only', tag: 'What happened', idea: 'The real chain of activity: email → click → exploit page → Edge → dropped DLL → rundll32 → C2 and a credential attempt. Observed in red, suspected in amber.', pros: ['Shows how this attack actually unfolded', 'Branches and dead ends are visible'], cons: ['No sense of impact'] },
    { id: 'B', name: 'Attack graph + blast radius layer', tag: 'One picture', idea: 'The same attack graph, with a toggle that adds what the attacker could reach from the compromised accounts and hosts.', pros: ['Impact grows out of the real attack', 'One mental model, two depths'], cons: ['Can get busy when the layer is on'] },
    { id: 'C', name: 'Two views', tag: 'Separate concerns', idea: 'Tabs: the attack graph, and a blast-radius view that dims the attack and highlights what’s reachable.', pros: ['Each view stays clean', 'Blast radius can be shown on its own in approvals'], cons: ['You switch to connect cause and impact'] }
  ] }
];
/* ---------- shared: rounds, multi-event evidence ---------- */
DXD.qs.forEach((q, i) => { q.r = [0, 1, 1, 2, 3, 4][i]; });
DXD.qs[5].q = 'Did the attacker reach other hosts or inboxes?';
const DX_EVENTS = [
  [['09:01:12', 'email', 'MAIL-GW', 'a.levi', 'Delivered', 'From billing@inv0ice-mail[.]com · “Urgent invoice #4471”'], ['09:03:41', 'proxy', 'SOC-Tech', 'a.levi', 'HTTP GET', 'invoice-portal[.]top/4471 · 200 · 48 KB'], ['09:03:42', 'proxy', 'SOC-Tech', 'a.levi', 'HTTP GET', 'invoice-portal[.]top/img/banner.webp · 200'], ['09:05:20', 'url_detonation', 'Sandbox', '—', 'Verdict', 'Exploit page · CVE-2023-4863 · malicious']],
  [['09:04:01', 'xdr_data', 'SOC-Tech', 'a.levi', 'Crash', 'msedge.exe renderer crashed and recovered'], ['09:04:02', 'xdr_data', 'SOC-Tech', 'a.levi', 'File write', 'msedge.exe → %TEMP%\\payload.dll (212 KB)'], ['09:04:05', 'xdr_data', 'SOC-Tech', 'a.levi', 'Process start', 'rundll32.exe payload.dll,Start · parent msedge.exe'], ['09:04:05', 'xdr_data', 'SOC-Tech', 'a.levi', 'Image load', 'payload.dll · unsigned'], ['09:04:06', 'xdr_data', 'SOC-Tech', 'a.levi', 'Registry', 'Run key added: “EdgeUpdateSvc”']],
  [['09:10:12', 'wildfire', 'Cloud', '—', 'Verdict', 'payload.dll · MALWARE · Cobalt Strike loader'], ['09:10:14', 'threat_intel', 'Unit 42', '—', 'Match', 'Hash seen in 2 FIN7 campaigns (2026-08, 2026-09)'], ['09:15:03', 'xdr_data', 'SOC-Tech', 'a.levi', 'Connection', 'rundll32.exe → 8.130.54.67:443 · TLS · JA3 72a589da…']],
  [['09:16:40', 'awareness', 'KnowBe4', '—', 'Lookup', 'No phishing simulation scheduled this week'], ['09:16:41', 'itsm', 'ServiceNow', '—', 'Lookup', 'No red-team or change ticket for SOC-Tech']],
  [['09:39:51', 'xdr_data', 'SOC-Tech', 'a.levi', 'Process access', 'rundll32.exe → lsass.exe · PROCESS_VM_READ'], ['09:39:51', 'xdr_data', 'SOC-Tech', 'a.levi', 'Prevented', 'Credential theft protection blocked the read'], ['09:40:02', 'xdr_data', 'SOC-Tech', 'SYSTEM', 'Logon cache', 'svc_backup has a cached logon on SOC-Tech']],
  [['10:05:10', 'email', 'MAIL-GW', 'j.adler', 'Delivered', 'Same sender and link · not opened'], ['10:05:10', 'email', 'MAIL-GW', 'r.cohen', 'Delivered', 'Same sender and link · not opened'], ['10:06:30', 'auth', 'AD', '—', 'Search', 'No logons from SOC-Tech to other machines in 6h'], ['10:06:31', 'xdr_data', 'Fleet', '—', 'Search', 'payload.dll hash on 0 other endpoints']]
];
function dxEventsCompact(qi) {
  const ev = DX_EVENTS[qi]; S.dxEv = S.dxEv || {}; const selE = S.dxEv[qi] ?? -1;
  return `<div class="rounded-xl border border-white/10 overflow-hidden"><div class="px-3 py-2 bg-white/[.04] text-[11px] text-white/55"><b class="text-white/70 tracking-[.12em]">RAW EVENTS</b> · ${ev.length}</div>${ev.map((e, k) => `<button onclick="event.stopPropagation();S.dxEv[${qi}]=S.dxEv[${qi}]===${k}?-1:${k};renderDxSim()" class="w-full text-left px-3 py-1.5 border-t border-white/[.06] ${k === selE ? 'bg-indigo-500/[.10]' : 'hover:bg-white/[.03]'}"><div class="text-[11px] text-white/50"><span class="font-mono">${e[0]}</span> · ${e[1]} · ${e[4]}</div><div class="text-[12px] text-white/85">${e[5]}</div>${k === selE ? `<pre class="mt-1.5 rounded-md p-2 bg-black/40 text-[10px] text-white/65 font-mono whitespace-pre-wrap" style="word-break:break-all">${esc(JSON.stringify({ _time: e[0], dataset: e[1], host: e[2], user: e[3], event: e[4] }, null, 1))}</pre>` : ''}</button>`).join('')}</div>`;
}
function dxEventsTable(qi) {
  if (S._dxCompact) return dxEventsCompact(qi);
  const ev = DX_EVENTS[qi]; S.dxEv = S.dxEv || {}; const selE = S.dxEv[qi] ?? 0;
  return `<div class="rounded-xl border border-white/10 overflow-hidden"><div class="flex items-center gap-2 px-3 py-2 bg-white/[.04] text-[11.5px] text-white/55"><span class="font-bold tracking-[.12em] text-white/45">RAW EVENTS</span><span>${ev.length} events · ${[...new Set(ev.map(e => e[1]))].join(', ')}</span><span class="ml-auto c-ai">Open in XQL ↗</span></div>
    <div class="grid text-[11px] text-white/40 px-3 py-1.5 border-t border-white/[.06]" style="grid-template-columns:70px 90px 80px 1fr"><span>Time</span><span>Source</span><span>Action</span><span>Details</span></div>
    ${ev.map((e, k) => `<button onclick="S.dxEv[${qi}]=${k};renderDxSim()" class="w-full grid text-left text-[12px] px-3 py-1.5 border-t border-white/[.06] ${k === selE ? 'bg-indigo-500/[.10]' : 'hover:bg-white/[.03]'}" style="grid-template-columns:70px 90px 80px 1fr"><span class="font-mono text-white/55">${e[0]}</span><span class="text-white/60">${e[1]}</span><span class="text-white/80">${e[4]}</span><span class="text-white/80 truncate">${e[5]}</span></button>`).join('')}
    <pre class="m-0 px-3 py-2 border-t border-white/10 bg-black/40 text-[10.5px] leading-[1.45] text-white/65 font-mono whitespace-pre-wrap">${esc(JSON.stringify({ _time: '2026-10-03T' + ev[selE][0] + 'Z', dataset: ev[selE][1], agent_hostname: ev[selE][2], actor_effective_username: ev[selE][3] === '—' ? null : 'BANKUS\\' + ev[selE][3], event_type: ev[selE][4].toUpperCase().replace(/ /g, '_'), details: ev[selE][5] }, null, 2))}</pre></div>`;
}
var dxEff = (w, h) => w > 0 ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300">▲ ${h}</span>` : w < 0 ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-300">▼ ${h}</span>` : '';
const dxAns = a => `<span class="inline-flex px-2 py-0.5 rounded-full text-[11.5px] font-bold ${/^yes/i.test(a) ? 'bg-rose-500/15 text-rose-200' : /^no\b/i.test(a) ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/10 text-white/60'}">${a}</span>`;

/* ---------- 1 · verdict (A is now the hybrid) ---------- */
const _dxV0 = dxV;
dxV = function (id) {
  if (id !== 'A') return _dxV0(id);
  const H = DXD.hyp, alt = `<div class="text-[11px] text-ink3 tracking-wide">OTHER HYPOTHESES JOSH TESTED</div>${H.slice(1).map(h => `<div class="mt-2"><div class="flex justify-between gap-6 text-[12.5px]"><span class="text-ink">${h.q}</span><span class="text-ink3">${h.pct}%</span></div><div class="mt-1">${dxBar(h.pct, h.col, 5)}</div></div>`).join('')}`;
  return dxCard(`<div class="grid gap-6" style="grid-template-columns:1fr 300px"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">SUMMARY</div><p class="mt-2 text-[14px] text-white/80 leading-relaxed">a.levi clicked a link in an “Urgent invoice” email. The page exploited Edge, dropped an unsigned DLL and ran it. The DLL beacons to a known Cobalt Strike server and tried to read credentials, which was blocked.</p></div>
    <div class="border-l border-white/10 pl-6"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</div>
      <div class="mt-1 flex items-center gap-3"><span class="text-[26px] font-black text-rose-400">Malicious</span><span class="flex gap-1 w-[90px]">${[1, 1, 1].map(() => '<span class="flex-1 h-2 rounded-full bg-rose-500"></span>').join('')}</span></div>
      <div class="mt-2 rounded-xl px-3 py-2 bg-rose-500/[.08] border border-rose-400/30 text-[12.5px] text-white/85"><span class="font-black text-rose-300 mr-1">H1 · ${H[0].pct}%</span>${H[0].q}</div>
      <div class="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-indigo-200 cursor-help" ${tipAttr(alt)}><span class="w-4 h-4 rounded-full border border-indigo-300/60 flex items-center justify-center text-[10px]">i</span>2 other hypotheses ruled out · hover</div></div></div>`);
};

/* ---------- 2 · process: A interactive, C rounds with cards ---------- */
const _dxP0 = dxP;
dxP = function (id) {
  const ev = DXD.events, R = DXD.rounds, Q = DXD.qs;
  if (id === 'A') {
    S.dxRound = S.dxRound ?? R.length - 1; const k = S.dxRound, r = R[k];
    const caseSince = ev.filter(e => (k === 0 ? e.x <= r.x : e.x > R[k - 1].x && e.x <= r.x));
    const mark = e => e.k === 'issue' ? `<polygon points="${e.x},37 ${e.x + 8},51 ${e.x - 8},51" fill="${dxSev(e.sev)}"/>` : e.k === 'info' ? `<circle cx="${e.x}" cy="46" r="6" fill="#0b1030" stroke="#94a3b8"/><text x="${e.x}" y="49" text-anchor="middle" font-size="8" fill="#cbd5e1" font-weight="900">i</text>` : e.k === 'case' ? `<rect x="${e.x - 6}" y="40" width="12" height="12" rx="3" fill="#818cf8"/>` : `<rect x="${e.x - 2}" y="64" width="${e.n.includes('2m') ? 90 : 30}" height="10" rx="3" fill="#334155" stroke="#64748b"/>`;
    return dxCard(`<svg viewBox="0 0 900 175" class="w-full h-auto" font-family="Lato, sans-serif">
      <text x="10" y="24" font-size="10.5" fill="rgb(255 255 255 / .45)" letter-spacing="1.5">THE CASE</text><line x1="10" x2="890" y1="46" y2="46" stroke="rgb(255 255 255 / .12)"/>
      ${ev.map(e => `<g ${tipAttr(`<div class="text-[13px] text-ink">${e.n}</div><div class="text-[12px] text-ink3">${e.t}</div>`)} style="cursor:help">${mark(e)}</g>`).join('')}
      <text x="10" y="108" font-size="10.5" fill="rgb(255 255 255 / .45)" letter-spacing="1.5">JOSH</text><rect x="140" y="118" width="750" height="12" rx="6" fill="rgb(77 255 166 / .25)"/>
      ${R.map((x, i) => `<g style="cursor:pointer" onclick="S.dxRound=${i};renderDxSim()"><line x1="${x.x}" x2="${x.x}" y1="52" y2="116" stroke="rgb(77 255 166 / ${i === k ? .7 : .25})" stroke-dasharray="3 4"/><circle cx="${x.x}" cy="124" r="${i === k ? 11 : 8}" fill="${i === k ? '#4DFFA6' : '#04261a'}" stroke="${x.verdict ? '#f43f5e' : '#4DFFA6'}" stroke-width="2"/><text x="${x.x}" y="155" text-anchor="middle" font-size="10.5" fill="${i === k ? '#fff' : 'rgb(255 255 255 / .55)'}">${x.t}</text><circle cx="${x.x}" cy="124" r="18" fill="transparent"/></g>`).join('')}</svg>
      <div class="mt-3 grid gap-4" style="grid-template-columns:1fr 1.2fr 1fr">
        <div class="rounded-xl p-3.5 bg-white/[.03] border border-white/10"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT CHANGED · ${r.t}</div>${caseSince.map(e => `<div class="mt-1.5 flex items-center gap-2 text-[12.5px]"><span class="w-2 h-2 rounded-full" style="background:${e.k === 'issue' ? dxSev(e.sev) : e.k === 'info' ? '#94a3b8' : e.k === 'pb' ? '#64748b' : '#818cf8'}"></span><span class="text-white/85">${e.n}</span></div>`).join('') || '<div class="mt-1.5 text-[12.5px] text-white/45">Nothing new</div>'}</div>
        <div class="rounded-xl p-3.5 bg-white/[.03] border border-white/10"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT JOSH ASKED</div>${Q.filter(q => q.r === k).map(q => `<div class="mt-2 flex items-start gap-2 text-[12.5px]"><span class="text-white/85 flex-1">${q.q}</span>${dxAns(q.a)}</div>`).join('') || `<div class="mt-1.5 text-[12.5px] text-white/45">${r.n}</div>`}</div>
        <div class="rounded-xl p-3.5 bg-white/[.03] border border-white/10"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">HYPOTHESES AFTER</div>${DXD.hyp.map((h, i) => `<div class="mt-2 flex items-center gap-2 text-[12px]"><span class="w-6 font-bold" style="color:${h.col}">${h.id}</span><span class="flex-1">${dxBar(r.h[i], h.col, 5)}</span><span class="w-9 text-right text-white/60">${r.h[i]}%</span></div>`).join('')}</div>
      </div>`);
  }
  if (id === 'C') {
    S.dxQOpen = S.dxQOpen ?? -1;
    return dxCard(`<div class="space-y-3">${R.map((r, k) => { const caseSince = ev.filter(e => (k === 0 ? e.x <= r.x : e.x > R[k - 1].x && e.x <= r.x)), qs = Q.map((q, i) => [q, i]).filter(([q]) => q.r === k);
      return `<div class="grid gap-3 items-stretch" style="grid-template-columns:200px 1fr 150px">
        <div class="rounded-xl p-3 bg-white/[.03] border border-white/10"><div class="font-mono text-[11.5px] text-white/50">${r.t}</div>${caseSince.filter(e => e.k !== 'pb').map(e => `<div class="mt-1 text-[12px] text-white/80 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:${e.k === 'issue' ? dxSev(e.sev) : e.k === 'info' ? '#94a3b8' : '#818cf8'}"></span>${e.n}</div>`).join('')}${caseSince.some(e => e.k === 'pb') ? `<div class="mt-1 text-[11px] text-white/40">${caseSince.filter(e => e.k === 'pb').map(e => e.n.split(' ·')[0]).join(', ')}</div>` : ''}</div>
        <div class="grid gap-2" style="grid-template-columns:repeat(2,minmax(0,1fr))">${qs.length ? qs.map(([q, i]) => `<button onclick="S.dxQOpen=S.dxQOpen===${i}?-1:${i};renderDxSim()" class="text-left rounded-xl p-3 border ${S.dxQOpen === i ? 'border-indigo-300/60 bg-indigo-500/10' : 'border-white/10 bg-white/[.04] hover:border-white/25'}" style="min-height:84px"><div class="text-[12.5px] font-semibold text-white leading-snug">${q.q}</div><div class="mt-2 flex items-center gap-1.5 flex-wrap">${dxAns(q.a)}${q.eff.map((w, h) => dxEff(w, DXD.hyp[h].id)).join('')}</div></button>`).join('') : `<div class="rounded-xl p-3 border border-dashed border-white/15 text-[12.5px] text-white/60 flex items-center" style="grid-column:1/-1">${r.n}</div>`}</div>
        <div class="rounded-xl p-3 ${r.verdict ? 'bg-rose-500/[.08] border border-rose-400/40' : 'bg-white/[.03] border border-white/10'}"><div class="text-[11px] text-white/45">${r.verdict ? 'VERDICT' : 'LEADING'}</div><div class="text-[13px] font-bold ${r.verdict ? 'text-rose-300' : 'text-white'}">${r.verdict ? 'Malicious' : 'H1'} · ${r.h[0]}%</div><div class="mt-2">${dxBar(r.h[0], '#f43f5e', 5)}</div></div>
      </div>${qs.some(([, i]) => i === S.dxQOpen) ? `<div class="ml-[212px] mr-[162px]">${dxEventsTable(S.dxQOpen)}</div>` : ''}`; }).join('')}</div>`);
  }
  return _dxP0(id);
};

/* ---------- 3 · questions: three new layouts built for many raw events ---------- */
dxR = function (id) {
  const H = DXD.hyp, Q = DXD.qs;
  const hhead = H.map(h => `<span class="text-center font-bold cursor-help" style="color:${h.col}" ${tipAttr(`<div class="text-[13px] text-ink">${h.q}</div>`)}>${h.id}</span>`).join('');
  if (id === 'A') {
    S.dxRow = S.dxRow ?? 1;
    return dxCard(`<div class="rounded-xl border border-white/10 overflow-hidden"><div class="grid text-[11.5px] text-white/50 px-4 py-2 bg-white/[.03]" style="grid-template-columns:1fr 110px repeat(3, 56px) 80px"><span>Question</span><span>Answer</span>${hhead}<span class="text-right">Evidence</span></div>
      ${Q.map((q, i) => { const on = S.dxRow === i; return `<div class="border-t border-white/[.06]"><button onclick="S.dxRow=S.dxRow===${i}?-1:${i};renderDxSim()" class="w-full grid items-center text-left px-4 py-3 hover:bg-white/[.03] ${on ? 'bg-indigo-500/[.08]' : ''}" style="grid-template-columns:1fr 110px repeat(3, 56px) 80px"><span class="text-[13.5px] text-white/90 flex items-center gap-2"><span class="text-white/35">${on ? '▾' : '▸'}</span>${q.q}</span><span>${dxAns(q.a)}</span>${q.eff.map(w => `<span class="text-center text-[14px] ${w > 0 ? 'text-emerald-300' : w < 0 ? 'text-rose-300' : 'text-white/20'}">${w > 0 ? '▲' : w < 0 ? '▼' : '·'}</span>`).join('')}<span class="text-right text-[12px] text-white/55">${DX_EVENTS[i].length} events</span></button>
        ${on ? `<div class="px-4 pb-4 pl-10 grid gap-4" style="grid-template-columns:300px 1fr"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT JOSH FOUND</div>${q.ev.map(e => `<div class="mt-1.5 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}<div class="mt-3 flex gap-1.5 flex-wrap">${q.eff.map((w, h) => dxEff(w, H[h].id)).join('')}</div></div>${dxEventsTable(i)}</div>` : ''}</div>`; }).join('')}</div>
      <div class="mt-2 text-[12px] text-white/45">▲ supports · ▼ argues against · hover H1–H3 for the full hypothesis</div>`);
  }
  if (id === 'B') {
    S.dxCardQ = S.dxCardQ ?? 2;
    return dxCard(`<div class="grid gap-3" style="grid-template-columns:repeat(3,minmax(0,1fr))">${Q.map((q, i) => `<button onclick="S.dxCardQ=S.dxCardQ===${i}?-1:${i};renderDxSim()" class="text-left rounded-xl p-3.5 border ${S.dxCardQ === i ? 'border-indigo-300/60 bg-indigo-500/10' : 'border-white/10 bg-white/[.04] hover:border-white/25'}" style="min-height:118px"><div class="text-[13px] font-semibold text-white leading-snug">${q.q}</div><div class="mt-2">${dxAns(q.a)}</div><div class="mt-2 flex gap-1 flex-wrap">${q.eff.map((w, h) => dxEff(w, H[h].id)).join('')}</div><div class="mt-2 text-[11.5px] text-white/45">${DX_EVENTS[i].length} raw events · ${q.ev.length} findings</div></button>`).join('')}</div>
      ${S.dxCardQ >= 0 ? `<div class="mt-3 rounded-xl p-4 border border-indigo-400/30 bg-indigo-500/[.05] grid gap-4" style="grid-template-columns:300px 1fr"><div><div class="text-[14px] font-semibold text-white">${Q[S.dxCardQ].q}</div><div class="mt-1">${dxAns(Q[S.dxCardQ].a)}</div>${Q[S.dxCardQ].ev.map(e => `<div class="mt-2 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}</div>${dxEventsTable(S.dxCardQ)}</div>` : ''}`);
  }
  S.dxSplit = S.dxSplit ?? 1; const q = Q[S.dxSplit];
  return dxCard(`<div class="grid gap-4" style="grid-template-columns:340px 1fr">
    <div class="space-y-1.5">${Q.map((x, i) => `<button onclick="S.dxSplit=${i};renderDxSim()" class="w-full text-left rounded-xl px-3 py-2.5 border ${i === S.dxSplit ? 'border-indigo-300/60 bg-indigo-500/10' : 'border-transparent hover:bg-white/[.04]'}"><div class="flex items-start gap-2"><span class="text-[13px] text-white/90 flex-1 leading-snug">${x.q}</span>${dxAns(x.a)}</div><div class="mt-1.5 flex gap-1">${x.eff.map((w, h) => dxEff(w, H[h].id)).join('')}</div></button>`).join('')}</div>
    <div class="rounded-xl p-4 border border-white/10 bg-white/[.02]"><div class="flex items-start gap-3"><div class="flex-1"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">QUESTION</div><div class="text-[16px] font-bold text-white mt-0.5">${q.q}</div></div>${dxAns(q.a)}</div>
      <div class="mt-3 grid gap-3" style="grid-template-columns:1fr 1fr"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT JOSH FOUND</div>${q.ev.map(e => `<div class="mt-1.5 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}</div>
        <div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">EFFECT ON THE HYPOTHESES</div>${q.eff.map((w, h) => `<div class="mt-1.5 flex items-center gap-2 text-[12.5px]"><span class="w-[72px] font-bold" style="color:${H[h].col}">${DX_HN[H[h].id]}</span><span class="${w > 0 ? 'text-emerald-300' : w < 0 ? 'text-rose-300' : 'text-white/35'}">${w > 0 ? '▲ supports' : w < 0 ? '▼ argues against' : 'no effect'}</span></div>`).join('')}</div></div>
      <div class="mt-4">${dxEventsTable(S.dxSplit)}</div></div></div>`);
};

/* ---------- 4 · attack graph: elegant pill nodes ---------- */
const DXI = {
  mail: '<rect x="-7" y="-5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M-7,-4 L0,1 L7,-4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  user: '<circle cx="0" cy="-3" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M-6,6 C-5,1 5,1 6,6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  web: '<circle cx="0" cy="0" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-6.5,0 H6.5 M0,-6.5 C-3,-3 -3,3 0,6.5 M0,-6.5 C3,-3 3,3 0,6.5" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  proc: '<rect x="-7" y="-6" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M-4,-2 L-1,1 L-4,4 M0,4 H4" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  file: '<path d="M-5,-7 H2 L6,-3 V7 H-5 Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2,-7 V-3 H6" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  ip: '<circle cx="0" cy="0" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="0" cy="0" r="2" fill="currentColor"/>',
  cred: '<circle cx="-3" cy="0" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M0.5,0 H7 M5,0 V3" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  server: '<rect x="-6" y="-6" width="12" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="-6" y="1" width="12" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  crown: '<path d="M-6,4 L-6,-3 L-3,0 L0,-5 L3,0 L6,-3 L6,4 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
};
const DXG2 = {
  nodes: [
    { id: 'mail', x: 100, y: 60, k: 'mail', n: 'Urgent invoice #4471', s: 'email', obs: 1 }, { id: 'user', x: 320, y: 60, k: 'user', n: 'a.levi', s: 'clicked the link', obs: 1 },
    { id: 'page', x: 540, y: 60, k: 'web', n: 'invoice-portal[.]top', s: 'exploit page', obs: 1 }, { id: 'edge', x: 760, y: 60, k: 'proc', n: 'msedge.exe', s: 'exploited', obs: 1 },
    { id: 'dll', x: 760, y: 175, k: 'file', n: 'payload.dll', s: 'Cobalt Strike loader', obs: 1 }, { id: 'rdl', x: 540, y: 175, k: 'proc', n: 'rundll32.exe', s: 'runs the payload', obs: 1 },
    { id: 'c2', x: 320, y: 175, k: 'ip', n: '8.130.54.67', s: 'command & control', obs: 1 }, { id: 'other', x: 100, y: 175, k: 'user', n: '2 other inboxes', s: 'didn’t click', obs: 1 },
    { id: 'lsass', x: 540, y: 290, k: 'cred', n: 'LSASS memory', s: 'read blocked', obs: 1 }, { id: 'svc', x: 760, y: 290, k: 'user', n: 'svc_backup', s: 'cached credential', obs: 0 }
  ],
  edges: DXG.edges,
  blast: [
    { from: 'edge', x: 930, y: 60, k: 'server', n: 'VPN-GW', s: 'saved VPN profile', via: 'a saved VPN profile on SOC-Tech' },
    { from: 'svc', x: 930, y: 250, k: 'server', n: 'FS-FIN-01', s: 'finance files', via: 'svc_backup has admin rights' },
    { from: 'svc', x: 930, y: 320, k: 'server', n: 'BACKUP-01', s: 'backup server', via: 'service account logon' },
    { from: 'svc', x: 930, y: 390, k: 'crown', n: 'PAY-DB-01', s: 'payments DB', via: 'backups include DB credentials', crown: 1 }
  ]
};
dxGraph = function (withBlast, onlyBlast) {
  const W = 150, Hh = 46, N = Object.fromEntries(DXG2.nodes.map(n => [n.id, n]));
  const pill = (x, y, k, n, s, col, dash, dim, tip) => `<g ${tip ? tipAttr(tip) : ''} style="cursor:help;opacity:${dim ? .32 : 1}" color="${col}"><rect x="${x - W / 2}" y="${y - Hh / 2}" width="${W}" height="${Hh}" rx="14" fill="#0e1430" stroke="${col}" stroke-opacity=".75" stroke-width="1.3" ${dash ? 'stroke-dasharray="5 4"' : ''}/>
      <circle cx="${x - W / 2 + 22}" cy="${y}" r="13" fill="${col}" fill-opacity=".14"/><g transform="translate(${x - W / 2 + 22},${y})">${DXI[k]}</g>
      <text x="${x - W / 2 + 42}" y="${y - 2}" font-size="11.5" font-weight="700" fill="#f1f5ff">${n.length > 17 ? n.slice(0, 16) + '…' : n}</text><text x="${x - W / 2 + 42}" y="${y + 12}" font-size="10" fill="rgb(255 255 255 / .5)">${s}</text></g>`;
  const border = (A, B) => { const dx = B.x - A.x, dy = B.y - A.y, t = Math.min(dx ? (W / 2 + 4) / Math.abs(dx) : 1e9, dy ? (Hh / 2 + 4) / Math.abs(dy) : 1e9); return [A.x + dx * t, A.y + dy * t]; };
  const edge = ([a, b, verb, tip, obs], dim) => { const A = N[a], B = N[b], [x1, y1] = border(A, B), [x2, y2] = border(B, A), vert = Math.abs(B.x - A.x) < 5, mx = (x1 + x2) / 2 + (vert ? verb.length * 2.9 + 12 : 0), my = (y1 + y2) / 2, col = obs ? '#fb7185' : '#fbbf24';
    return `<g style="opacity:${dim ? .25 : 1}"><path d="M${x1},${y1} L${x2},${y2}" stroke="${col}" stroke-opacity=".8" stroke-width="1.5" ${obs ? '' : 'stroke-dasharray="5 4"'} marker-end="url(#dx2${obs ? 'R' : 'A'})"/>
      <text x="${mx}" y="${my - (vert ? -3 : 6)}" text-anchor="middle" font-size="9.5" fill="${col}" fill-opacity=".9" style="paint-order:stroke" stroke="#0a0f1f" stroke-width="4">${verb}</text>
      <path d="M${x1},${y1} L${x2},${y2}" stroke="transparent" stroke-width="18" style="cursor:help" ${tipAttr(`<div class="text-[11px] text-ink3 tracking-wide">ACTIVITY</div><div class="text-[14px] font-bold text-ink mt-0.5">${A.n} ${verb} ${B.n}</div><div class="text-[12.5px] text-ink2 mt-1">${tip}</div>`)}/></g>`; };
  const showB = withBlast || onlyBlast;
  const blast = showB ? DXG2.blast.map(b => { const A = N[b.from], x1 = A.x + W / 2, x2 = b.x + 30 - W / 2 + 2;
    return `<path d="M${x1},${A.y} C${(x1 + x2) / 2},${A.y} ${(x1 + x2) / 2},${b.y} ${x2 - 4},${b.y}" fill="none" stroke="#fda4af" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="1.5 4" stroke-linecap="round"/>
      ${pill(b.x + 30, b.y, b.k, b.n, b.s, b.crown ? '#f43f5e' : '#fda4af', 1, 0, `<div class="text-[11px] text-ink3 tracking-wide">BLAST RADIUS</div><div class="text-[14px] font-bold text-ink mt-0.5">${b.n}</div><div class="text-[12.5px] text-ink2 mt-1">Reachable because ${b.via}</div>`)}`; }).join('') : '';
  return `<svg viewBox="0 0 ${showB ? 1060 : 850} ${showB ? 425 : 330}" class="w-full h-auto" font-family="Lato, sans-serif"><defs><marker id="dx2R" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1 L9,5 L0,9" fill="none" stroke="#fb7185" stroke-width="1.6"/></marker><marker id="dx2A" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,1 L9,5 L0,9" fill="none" stroke="#fbbf24" stroke-width="1.6"/></marker></defs>
    ${DXG2.edges.map(e => edge(e, onlyBlast)).join('')}
    ${DXG2.nodes.map(n => pill(n.x, n.y, n.k, n.n, n.s, n.obs ? '#fb7185' : '#fbbf24', !n.obs, onlyBlast && !['svc', 'edge'].includes(n.id), `<div class="text-[14px] font-bold text-ink">${n.n}</div><div class="text-[12.5px] text-ink3">${n.s}</div><div class="text-[11.5px] mt-1 ${n.obs ? 'text-rose-300' : 'text-amber-300'}">${n.obs ? 'Observed' : 'Suspected · not observed yet'}</div>`)).join('')}${blast}</svg>`;
};

/* ---------- option texts ---------- */
(() => {
  const V = DX[0]; V.rec = 'A';
  V.opts[0] = { id: 'A', name: 'Header + hypotheses on hover', tag: 'Hybrid', idea: 'The familiar header: summary, verdict and confidence. Under the verdict, the winning hypothesis as a question; the others Josh ruled out appear on hover.', pros: ['One clear verdict, still compact', 'The “why not something else” is one hover away', 'Confidence ties to the winning hypothesis'], cons: ['The alternatives aren’t visible by default'] };
  const P = DX[1]; P.rec = 'A';
  P.opts[0] = { id: 'A', name: 'Two lanes, interactive', tag: 'Your favorite, now live', idea: 'The case lane and Josh’s lane on one clock. Click any of Josh’s re-evaluations to see what changed in the case, what he asked and how the hypotheses moved.', pros: ['Case and investigation clearly separate', 'Cause and effect line up in time', 'Details come from the data, on click'], cons: ['Dense on very busy cases'] };
  P.opts[2] = { id: 'C', name: 'Rounds with cards', tag: 'Cards in a flow', idea: 'One row per round: on the left what changed in the case, in the middle the question cards Josh asked in that round, on the right where the hypotheses stood. Click a card for its evidence.', pros: ['The investigation cards finally have a home', 'Reads top to bottom like a story', 'Uniform card sizes, no clutter'], cons: ['Taller than the timeline', 'Time spacing isn’t to scale'] };
  const Rr = DX[2]; Rr.rec = 'C'; Rr.q = 'Every answer can rest on many raw events. How should you read the question, the answer and its data?';
  Rr.opts = [
    { id: 'A', name: 'Matrix + event table', tag: 'Most compact', idea: 'Rows are questions with ▲/▼ per hypothesis and an event count. Expanding a row shows Josh’s findings and a table of the raw events; pick an event to see its full record.', pros: ['All questions in one view', 'Handles any number of events'], cons: ['Expanding pushes the other rows down'] },
    { id: 'B', name: 'Question cards + detail', tag: 'Most visual', idea: 'A grid of question cards with the answer and effects. Click a card to open its findings and raw events below the grid.', pros: ['Easy to scan, friendly', 'Matches the card style elsewhere'], cons: ['Detail opens away from the card'] },
    { id: 'C', name: 'List + detail panel', tag: 'Clearest for data', idea: 'Questions on the left, the selected one on the right: answer, findings, effect on each hypothesis, and the raw events table with the full record.', pros: ['Plenty of room for many events', 'Nothing jumps around', 'Works like the products analysts already use'], cons: ['Needs width; on small screens it stacks'] }
  ];
  const G = DX[3];
  G.opts[0].idea = 'The real chain of activity as clean labelled nodes: email → click → exploit page → Edge → dropped DLL → rundll32 → C2, plus the credential attempt. Observed in red, suspected in amber.';
})();

/* ---------- 2C · the investigation canvas as it is in the case ---------- */
const DX_ACT = [['Isolate SOC-Tech from the network', 'wait', 'Needs your approval'], ['Block 8.130.54.67 at the firewall and EDR', 'queued', 'Suggested'], ['Reset credentials for a.levi', 'queued', 'Suggested'], ['Purge the email from 2 inboxes', 'queued', 'Suggested']];
var dxBoard = function () {
  const R = DXD.rounds, Q = DXD.qs, H = DXD.hyp; S.dxBcp = S.dxBcp ?? R.length - 1; const k = S.dxBcp, r = R[k], last = k === R.length - 1; S.dxBsel = S.dxBsel ?? null;
  const badge = st => st === 'done' ? ['bg-cx/15 c-cx', '✓', 'COMPLETED', 'c-cx'] : st === 'wait' ? ['bg-amber-500/15 c-amber', '✋', 'NEEDS YOU', 'c-amber'] : st === 'running' ? ['bg-blue-500/15 c-blue', '◌', 'RUNNING', 'c-blue'] : ['bg-white/5 text-ink3', '◷', 'QUEUED', 'text-ink3'];
  let n = 0;
  const card = (s0, key, next) => { const [bc, bi, bl, tc] = badge(s0.state), on = S.dxBsel === key, num = String(++n).padStart(2, '0');
    const shell = `rounded-2xl border ${s0.state === 'done' ? 'border-cx/30' : s0.state === 'wait' ? 'border-amber-500/40' : s0.state === 'running' ? 'border-blue-500/40' : 'border-white/[.08]'}`;
    const bg = s0.state === 'queued' ? 'background:rgb(255 255 255 / .025)' : 'background:linear-gradient(180deg, rgb(255 255 255 / .06), rgb(255 255 255 / .025))';
    const toggle = `S.dxBsel=S.dxBsel==='${key}'?null:'${key}';renderDxSim()`;
    if (!on) return `<button onclick="${toggle}" class="flow-card ${next ? 'fc-next' : ''} ${shell} text-left p-3.5 flex flex-col justify-start hover:border-indigo-300/50 ${s0.state === 'queued' ? 'opacity-75' : ''}" style="${bg}">
      <div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md text-[11px] ${bc}">${bi}</span><span class="text-[11px] font-mono text-ink3">${num}</span></div>
      <div class="fc-t mt-2 text-[13.5px] font-bold text-ink leading-snug">${s0.title}</div><div class="fc-s mt-1 text-[12px] text-ink3 leading-snug">${s0.sub}</div>
      ${s0.chips ? `<div class="mt-1.5 flex gap-1 flex-wrap">${s0.chips}</div>` : ''}${s0.bar ? `<div class="mt-2" style="width:100%">${dxBar(s0.bar[0], s0.bar[1], 6)}</div>` : ''}</button>`;
    return `<div class="flow-card flow-open ${shell} p-5" style="${bg}"><div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md text-[11px] ${bc}">${bi}</span><span class="text-[11px] font-black tracking-[.14em] ${tc}">${bl}</span><span class="text-[11px] font-mono text-ink3">· step ${num}</span><button onclick="${toggle}" class="ml-auto text-ink3 text-[12px] hover:text-ink">Collapse</button></div>
      <div class="text-[17px] font-bold text-ink mt-2">${s0.title}</div><div class="text-[13px] text-ink3 mt-0.5">${s0.sub}</div>${s0.detail || ''}</div>`; };
  const phases = [
    ['TRIAGE', [{ title: 'Case created', sub: '#555548 · 09:04', state: 'done', detail: `<p class="mt-3 text-[13.5px] text-white/75">Cortex opened the case when a.levi clicked a suspicious email link.</p>` },
      { title: 'Playbooks ran', sub: `${DXD.events.filter(e => e.k === 'pb' && e.x <= r.x).length} runs · enrichment, no reasoning`, state: 'done', detail: `<div class="mt-3 space-y-1">${DXD.events.filter(e => e.k === 'pb' && e.x <= r.x).map(e => `<div class="text-[13px] text-white/75">${e.t} · ${e.n}</div>`).join('')}</div>` },
      { title: 'Issues grouped', sub: `${DXD.events.filter(e => e.k === 'issue' && e.x <= r.x).length} issues so far`, state: 'done', detail: `<div class="mt-3 space-y-1">${DXD.events.filter(e => e.k === 'issue' && e.x <= r.x).map(e => `<div class="flex items-center gap-2 text-[13px] text-white/75"><span class="w-2 h-2 rounded-full" style="background:${dxSev(e.sev)}"></span>${e.t} · ${e.n}</div>`).join('')}</div>` }]],
    ['FRAME', H.map((h, i) => ({ title: `${h.id} · ${h.q}`, sub: `${r.h[i]}%${i === r.h.indexOf(Math.max(...r.h)) ? ' · leading' : ''}`, state: 'done', bar: [r.h[i], h.col], detail: `<p class="mt-3 text-[13.5px] text-white/75">Tested by: ${Q.filter(q => q.eff[i]).map(q => q.q).join(' · ')}</p>` }))],
    ['INVESTIGATE', Q.map((q, i) => q.r <= k ? { title: q.q, sub: `Answer: ${q.a}`, state: 'done', chips: q.eff.map((w, h) => dxEff(w, H[h].id)).join(''), detail: `<div class="mt-3 space-y-3"><div>${q.ev.map(e => `<div class="mt-1.5 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}</div>${dxEventsTable(i)}</div>` } : { title: q.q, sub: 'Not asked yet', state: 'queued' })],
    ['DECIDE', [k >= 2 ? { title: 'Verdict · Malicious', sub: `Top hypothesis H1 · ${r.h[0]}% vs ${Math.max(r.h[1], r.h[2])}%`, state: 'done', detail: `<p class="mt-3 text-[13.5px] text-white/75">The email led to an exploit, a known malware loader ran and tried to read credentials. Nothing legitimate explains it.</p>` } : { title: 'Verdict', sub: `Not final · H1 leads at ${r.h[0]}%`, state: 'running' }]],
    ['RESPOND', k >= 2 ? DX_ACT.map(([t, st, sub]) => ({ title: t, sub, state: st, detail: `<p class="mt-3 text-[13.5px] text-white/75">${st === 'wait' ? 'Cuts the C2 channel and stops the credential attempt. One click to release.' : 'Reasoning, expected effect and risk open here.'}</p>` })) : [{ title: 'No actions yet', sub: 'They come after the verdict', state: 'queued' }]]
  ];
  return dxCard(`<div class="flex items-center gap-3 mb-2 flex-wrap"><div class="text-[11px] font-black tracking-[.16em] text-ink3">CHECKPOINTS</div>${last ? '<span class="text-[11.5px] text-ink3">Showing the latest board · pick a checkpoint to see it as it was</span>' : `<span class="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-[11.5px] font-semibold">Viewing the board at ${r.t}</span><button onclick="S.dxBcp=${R.length - 1};renderDxSim()" class="text-[12px] c-ai font-semibold">Back to latest</button>`}</div>
    <div class="grid gap-2 mb-4" style="grid-template-columns:repeat(${R.length},minmax(0,1fr))">${R.map((x, i) => `<button onclick="S.dxBcp=${i};renderDxSim()" class="text-left rounded-xl p-2.5 border ${i === k ? 'border-indigo-300/70 bg-indigo-500/10' : 'border-white/10 bg-white/[.03] hover:border-white/25'}"><div class="flex justify-between text-[11px]"><span class="font-mono text-white/55">${x.t}</span>${i === R.length - 1 ? '<span class="text-[10px] font-bold text-emerald-300">LATEST</span>' : ''}</div><div class="mt-1 text-[12px] text-white/85 leading-snug">${x.n}</div><div class="mt-1.5 space-y-1">${H.map((h, j) => dxBar(x.h[j], h.col, 4)).join('')}</div></button>`).join('')}</div>
    <div class="space-y-4">${phases.map(([label, steps]) => `<div class="flex gap-4"><div class="w-[96px] shrink-0 pt-1 text-[11px] font-black tracking-[.16em] ${steps.every(x => x.state === 'done') ? 'c-cx' : 'text-ink3'}">${label}</div><div class="flex-1 min-w-0 flow-row">${steps.map((s0, si) => card(s0, label + si, si < steps.length - 1)).join('')}</div></div>`).join('')}</div>`);
}
const _dxP1 = dxP;
dxP = function (id) { return id === 'C' ? dxBoard() : _dxP1(id); };

/* ---------- 3B · a ledger: for and against the verdict ---------- */
const _dxR1 = dxR;
dxR = function (id) {
  if (id !== 'B') return _dxR1(id);
  const H = DXD.hyp, Q = DXD.qs; S.dxLed = S.dxLed ?? 2;
  const item = (q, i) => `<button onclick="S.dxLed=S.dxLed===${i}?-1:${i};renderDxSim()" class="w-full text-left rounded-xl px-3.5 py-3 border ${S.dxLed === i ? 'border-indigo-300/60 bg-indigo-500/10' : 'border-white/10 bg-white/[.03] hover:border-white/25'}"><div class="flex items-start gap-2"><span class="flex-1 text-[13px] text-white/90 leading-snug">${q.q}</span>${dxAns(q.a)}</div><div class="mt-1.5 text-[12px] text-white/50">${q.ev[0]} · ${DX_EVENTS[i].length} events</div></button>`;
  const forQ = Q.map((q, i) => [q, i]).filter(([q]) => q.eff[0] > 0), other = Q.map((q, i) => [q, i]).filter(([q]) => q.eff[0] <= 0);
  return dxCard(`<div class="rounded-xl px-4 py-3 bg-rose-500/[.07] border border-rose-400/35"><div class="text-[11px] font-bold tracking-[.14em] text-rose-300/80">THE CASE FOR THE VERDICT</div><div class="mt-1 text-[15px] font-bold text-white">${H[0].q}</div></div>
    <div class="mt-3 grid gap-4" style="grid-template-columns:1fr 1fr">
      <div><div class="flex items-center gap-2 text-[12px] font-bold tracking-[.12em] text-emerald-300/90">▲ FOR · ${forQ.length}</div><div class="mt-2 space-y-2">${forQ.map(([q, i]) => item(q, i)).join('')}</div></div>
      <div><div class="flex items-center gap-2 text-[12px] font-bold tracking-[.12em] text-white/50">▼ AGAINST OR OPEN · ${other.length}</div><div class="mt-2 space-y-2">${other.map(([q, i]) => item(q, i)).join('')}</div>
        <div class="mt-3 rounded-xl p-3 border border-dashed border-white/15"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT WOULD CHANGE THE VERDICT</div><div class="mt-1 text-[13px] text-white/75">An approved phishing simulation that used this exact link and file (H2), or a signed finance tool behind the DLL (H3).</div></div></div>
    </div>${S.dxLed >= 0 ? `<div class="mt-3">${dxEventsTable(S.dxLed)}</div>` : ''}`);
};

/* ---------- 4C · in the style of the case grouping graph ---------- */
function dxGroupGraph() {
  const rose = '#e11d48', T = (h, s) => tipAttr(`<div class="text-[14px] font-bold text-ink">${h}</div><div class="text-[12.5px] text-ink3 mt-0.5">${s}</div>`);
  const lbl = (x, y, a, b) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="rgb(var(--ink2))">${a}</text>${b ? `<text x="${x}" y="${y + 12}" text-anchor="middle" font-size="8.5" fill="rgb(var(--ink3))">${b}</text>` : ''}`;
  const tri = (x, y, sz, col) => `<polygon points="${x},${y - sz} ${x + sz * 1.05},${y + sz * .78} ${x - sz * 1.05},${y + sz * .78}" fill="${col}" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const circ = (x, y, inner) => `<circle cx="${x}" cy="${y}" r="14" fill="#2b3445"/><g transform="translate(${x},${y})" color="#fff">${inner}</g>`;
  const X = [80, 230, 400, 560, 720, 880], Y = [70, 170, 275];
  const E = (x1, y1, x2, y2, tip) => `<path d="M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}" fill="none" stroke="rgb(var(--line2))" stroke-width="1"/><path d="M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}" fill="none" stroke="transparent" stroke-width="14" style="cursor:help" ${tipAttr(`<div class="text-[11px] text-ink3 tracking-wide">LINK</div><div class="text-[13px] text-ink mt-0.5">${tip}</div>`)}/>`;
  const issues = (x, y, cnt, hi, md, list) => `<g style="cursor:help" ${T(`Issues (${cnt})`, list.join('<br>'))}>${tri(x + 7, y, 11, '#fb7185')}${tri(x - 4, y, 12, rose)}${lbl(x, y + 30, `Issues (${cnt})`, 'Click to expand')}<text x="${x}" y="${y + 56}" text-anchor="middle" font-size="8.5"><tspan fill="${rose}" font-weight="700">⌃ ${hi}</tspan>${md ? `<tspan fill="rgb(var(--ink4))">  |  </tspan><tspan fill="#f59e0b" font-weight="700">⌃ ${md}</tspan>` : ''}</text></g>`;
  const node = (x, y, inner, a, b, tip) => `<g style="cursor:help" ${T(a, tip)}>${circ(x, y, inner)}${lbl(x, y + 30, a, b)}</g>`;
  return dxCard(`<svg viewBox="0 0 960 350" class="w-full h-auto" font-family="Lato, sans-serif">
    ${E(X[0] + 14, Y[1], X[1] - 14, Y[1], 'The case was opened from this issue')}
    ${E(X[1] + 14, Y[1], X[2] - 14, Y[0], 'Same email message')}${E(X[1] + 14, Y[1], X[2] - 14, Y[1], 'Same causality chain on SOC-Tech')}${E(X[1] + 14, Y[1], X[2] - 14, Y[2], 'Same file hash')}
    ${[0, 1, 2].map(i => E(X[2] + 14, Y[i], X[3] - 16, Y[i], ['Issues tied to the email', 'Issues in the same process tree', 'Issues on the same file'][i])).join('')}
    ${E(X[3] + 16, Y[0], X[4] - 14, Y[0], 'Recipient who clicked')}${E(X[3] + 16, Y[1], X[4] - 14, Y[1], 'Host where it ran')}${E(X[3] + 16, Y[1], X[4] - 14, Y[2], 'Contacted address')}
    ${E(X[4] + 14, Y[0], X[5] - 14, Y[0], 'Same email, no click')}${E(X[4] + 14, Y[1], X[5] - 14, Y[1], 'Cached credential on the host (suspected)')}${E(X[4] + 14, Y[2], X[5] - 14, Y[2], 'Known infrastructure')}
    <g style="cursor:help" ${T('Case #555548', 'Phishing · 7 issues · opened 09:04')}><path d="M${X[0]},${Y[1] - 15} l12,5 v8 c0,9 -6,14 -12,17 c-6,-3 -12,-8 -12,-17 v-8 z" fill="#4f6bed"/><circle cx="${X[0]}" cy="${Y[1] + 1}" r="3" fill="#fff"/>${lbl(X[0], Y[1] + 30, 'Case #555548', 'Endpoint Domain')}</g>
    <g style="cursor:help" ${T('Suspicious email link click', 'The issue that opened the case · 09:03 · High')}>${tri(X[1], Y[1] - 2, 13, rose)}${lbl(X[1], Y[1] + 30, 'Email link click', 'Phishing')}</g>
    ${node(X[2], Y[0], DXI.mail, 'Email message', '“Urgent invoice #4471”', 'Sent to 3 recipients from billing@inv0ice-mail[.]com')}
    ${node(X[2], Y[1], '<circle cx="-4" cy="-3" r="2" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="4" cy="-3" r="2" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="0" cy="4" r="2" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M-3,-2 L-1,3 M3,-2 L1,3" stroke="#fff" stroke-width="1.2"/>', 'Causality Chain', 'msedge → rundll32', 'msedge.exe → payload.dll → rundll32.exe on SOC-Tech')}
    ${node(X[2], Y[2], '<circle cx="0" cy="0" r="5.5" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="0" cy="0" r="1.8" fill="#fff"/>', 'File hash', 'payload.dll', 'SHA256 a3f1…9e2b · WildFire: malware')}
    ${issues(X[3], Y[0], 2, 1, 1, ['Suspicious email link click · High', 'Same email in 2 other inboxes · Medium'])}
    ${issues(X[3], Y[1], 4, 4, 0, ['Browser exploit · High', 'Unsigned DLL dropped and run · High', 'C2 beaconing · Critical', 'LSASS access attempt · Critical'])}
    ${issues(X[3], Y[2], 1, 1, 0, ['Known malware hash · High'])}
    ${node(X[4], Y[0], DXI.user, 'a.levi', 'User', 'Finance · clicked the link at 09:03')}
    ${node(X[4], Y[1], '<rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M-4,7 h8" stroke="#fff" stroke-width="1.5"/>', 'SOC-Tech', 'Host', 'Windows 11 · compromised')}
    ${node(X[4], Y[2], DXI.ip, '8.130.54.67', 'IP', 'Cobalt Strike C2 · 24 beacons')}
    ${node(X[5], Y[0], DXI.user, '2 other inboxes', 'Users', 'j.adler, r.cohen · didn’t click')}
    ${node(X[5], Y[1], DXI.user, 'svc_backup', 'Service account', 'Cached logon on SOC-Tech · suspected exposure')}
    ${node(X[5], Y[2], DXI.web, 'invoice-portal[.]top', 'Domain', 'Exploit page · same hosting as the C2')}
  </svg><div class="mt-1 text-[12px] text-white/45">Hover any node or link for details.</div>`);
}
const _dxG1 = dxG;
dxG = function (id) { return id === 'C' ? dxGroupGraph() : _dxG1(id); };

(() => {
  const P = DX[1]; P.opts[2] = { id: 'C', name: 'The investigation canvas', tag: 'What the case has today', idea: 'The board from the case: checkpoints on top, then Triage, Frame, Investigate, Decide and Respond as uniform cards. Pick a checkpoint to see the board then; click a card to open it in place.', pros: ['Already familiar from the case', 'Every step is a card you can open', 'Checkpoints show the board over time'], cons: ['Long on big cases', 'Time isn’t to scale'] };
  const Rr = DX[2]; Rr.opts[1] = { id: 'B', name: 'For and against', tag: 'Reads like an argument', idea: 'The winning hypothesis on top, then two columns: the answers that support it and the ones that argue against it or are still open, plus what would change the verdict. Click any item for its raw events.', pros: ['Makes the reasoning feel like a case being argued', 'Weak spots are visible at once'], cons: ['Centered on one hypothesis', 'Questions that touch several hypotheses appear once'] };
  const G = DX[3]; G.opts[2] = { id: 'C', name: 'Grouping-graph style', tag: 'Matches the product', idea: 'The same look as the case grouping graph: case → issue → causality chain, email and hash → issue groups → users, hosts and IPs. Hover anything for details.', pros: ['Consistent with the existing product', 'Shows how the case was grouped'], cons: ['Shows grouping more than attack flow', 'No blast radius'] };
  DX.forEach(d => { if (d.key === 'attack') d.render = id => dxG(id); });
})();

/* ---------- 2C: checkpoints become bullets at the bottom; expanded cards are squares ---------- */
const _dxBoard0 = dxBoard;
dxBoard = function () {
  const R = DXD.rounds, k = S.dxBcp ?? R.length - 1, last = k === R.length - 1;
  let html = _dxBoard0();
  // drop the checkpoint strip at the top
  html = html.replace(/<div class="flex items-center gap-3 mb-2 flex-wrap"><div class="text-\[11px\] font-black tracking-\[\.16em\] text-ink3">CHECKPOINTS<\/div>[\s\S]*?<\/div>\s*<div class="grid gap-2 mb-4"[\s\S]*?<\/button>`?\)?\.?join\(''\)\}?<\/div>/, '');
  return html;
};
var dxBullets = function () {
  const R = DXD.rounds, k = S.dxBcp ?? R.length - 1, last = k === R.length - 1;
  return `<div class="mt-5 pt-4 border-t border-white/10">
    <div class="flex items-center gap-3 flex-wrap text-[12px]"><span class="font-black tracking-[.16em] text-[11px] text-ink3">INVESTIGATION CYCLES</span>${last ? '<span class="text-ink3">Showing the latest cycle · click a bullet to see an earlier one</span>' : `<span class="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">Viewing cycle ${k + 1} · ${R[k].t}</span><button onclick="S.dxBcp=${R.length - 1};renderDxSim()" class="c-ai font-semibold">Back to latest</button>`}</div>
    <div class="relative mt-4 mx-3"><div class="absolute left-0 right-0 top-[7px] h-px bg-white/15"></div>
      <div class="relative flex justify-between">${R.map((r, i) => `<button onclick="S.dxBcp=${i};renderDxSim()" class="flex flex-col items-center gap-1.5 group" ${tipAttr(`<div class="text-[13px] text-ink">${r.n}</div><div class="text-[12px] text-ink3">${r.t} · H1 ${r.h[0]}%</div>`)}>
        <span class="rounded-full border-2 transition ${i === k ? 'w-4 h-4 bg-teal-300 border-teal-200' : i < k ? 'w-3.5 h-3.5 bg-teal-300/40 border-teal-300/60' : 'w-3.5 h-3.5 bg-[#0b1030] border-white/30'} group-hover:scale-125"></span>
        <span class="text-[11px] font-mono ${i === k ? 'text-white' : 'text-white/50'}">${r.t}</span><span class="text-[11px] ${i === k ? 'text-white/85' : 'text-white/40'} max-w-[120px] text-center leading-tight">${r.n}</span></button>`).join('')}</div></div></div>`;
}
const _dxP2 = dxP;
dxP = function (id) {
  if (id !== 'C') return _dxP2(id);
  let h = dxBoard();
  // remove the top strip (robustly) and add bullets at the bottom
  h = h.replace(/<div class="flex items-center gap-3 mb-2 flex-wrap">[\s\S]*?<div class="space-y-4">/, '<div class="space-y-4">');
  return h.replace(/<\/div>\s*$/, dxBullets() + '</div>');
};

/* ---------- 4C: the same visual language, telling the attack ---------- */
var dxAttackStory = function () {
  const rose = '#e11d48', amber = '#f59e0b';
  const lbl = (x, y, a, b) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="rgb(var(--ink2))">${a}</text>${b ? `<text x="${x}" y="${y + 12}" text-anchor="middle" font-size="8.5" fill="rgb(var(--ink3))">${b}</text>` : ''}`;
  const tri = (x, y, sz, col) => `<polygon points="${x},${y - sz} ${x + sz * 1.05},${y + sz * .78} ${x - sz * 1.05},${y + sz * .78}" fill="${col}" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>`;
  const tipH = (h, s, tag) => tipAttr(`<div class="text-[14px] font-bold text-ink">${h}</div><div class="text-[12.5px] text-ink2 mt-0.5">${s}</div>${tag ? `<div class="text-[11.5px] mt-1 ${tag === 'Observed' ? 'text-rose-300' : 'text-amber-300'}">${tag}</div>` : ''}`);
  const N = {
    mail: [70, 150, DXI.mail, 'Invoice email', '09:01 · 3 recipients', 'From billing@inv0ice-mail[.]com', 1],
    user: [200, 150, DXI.user, 'a.levi', 'clicked 09:03', 'Finance · opened the link from Outlook', 1],
    page: [330, 150, DXI.web, 'invoice-portal[.]top', 'exploit page', 'Serves a WebP exploit (CVE-2023-4863)', 1],
    edge: [460, 150, DXI.proc, 'msedge.exe', 'exploited', 'Renderer crashed and recovered at 09:04:01', 1],
    dll: [590, 150, DXI.file, 'payload.dll', 'dropped 09:04', 'Unsigned · WildFire: Cobalt Strike loader', 1],
    rdl: [720, 150, DXI.proc, 'rundll32.exe', 'runs the payload', 'rundll32.exe payload.dll,Start · persistence via Run key', 1],
    c2: [860, 70, DXI.ip, '8.130.54.67', 'C2 · 24 beacons', 'Every ~45s over TLS · known Cobalt Strike server', 1],
    lsass: [860, 150, DXI.cred, 'LSASS memory', 'read blocked 09:39', 'Credential theft protection stopped the read', 1],
    svc: [860, 245, DXI.user, 'svc_backup', 'would be exposed', 'Cached logon on SOC-Tech · not observed in use', 0],
    other: [200, 260, DXI.user, '2 other inboxes', 'didn’t click', 'j.adler, r.cohen received the same email', 1]
  };
  const E = [['mail', 'user', 'delivered', 1], ['user', 'page', 'clicked', 1], ['page', 'edge', 'exploited', 1], ['edge', 'dll', 'dropped', 1], ['dll', 'rdl', 'loaded', 1], ['rdl', 'c2', 'beacons', 1], ['rdl', 'lsass', 'tried to read', 1], ['lsass', 'svc', 'would expose', 0], ['mail', 'other', 'also sent', 1]];
  const ISS = [['user', 'Suspicious email link click', 'High'], ['edge', 'Browser exploit', 'High'], ['dll', 'Unsigned DLL dropped and run', 'High'], ['c2', 'C2 beaconing', 'Critical'], ['lsass', 'LSASS access attempt', 'Critical']];
  const edge = ([a, b, v, obs]) => { const [x1, y1] = N[a], [x2, y2] = N[b], sx = x1 + (x2 > x1 + 5 ? 15 : 0), sy = y1 + (x2 > x1 + 5 ? 0 : 46), ex = x2 - (x2 > x1 + 5 ? 15 : 0), ey = y2 - (x2 > x1 + 5 ? 0 : 15), mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const d = Math.abs(x2 - x1) > 5 ? `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}` : `M${sx},${sy} L${ex},${ey}`;
    return `<path d="${d}" fill="none" stroke="${obs ? 'rgb(251 113 133 / .7)' : 'rgb(245 158 11 / .7)'}" stroke-width="1.2" ${obs ? '' : 'stroke-dasharray="4 3"'}/><text x="${Math.abs(x2 - x1) > 5 ? mx : mx + 8}" y="${Math.abs(x2 - x1) > 5 ? Math.min(sy, ey) + (sy === ey ? -6 : (my - Math.min(sy, ey)) - 4) : my}" text-anchor="${Math.abs(x2 - x1) > 5 ? 'middle' : 'start'}" font-size="8.5" fill="rgb(var(--ink3))">${v}</text>
      <path d="${d}" fill="none" stroke="transparent" stroke-width="14" style="cursor:help" ${tipH(`${N[a][3]} ${v} ${N[b][3]}`, N[b][5], obs ? 'Observed' : 'Suspected')}/>`; };
  const node = id => { const [x, y, ic0, a, b, tip, obs] = N[id];
    return `<g style="cursor:help" ${tipH(a, tip, obs ? 'Observed' : 'Suspected · not observed yet')}><circle cx="${x}" cy="${y}" r="15" fill="#2b3445" ${obs ? '' : `stroke="${amber}" stroke-dasharray="3 3"`}/><g transform="translate(${x},${y})" color="#fff">${ic0}</g>${lbl(x, y + 30, a, b)}</g>`; };
  const issues = ISS.map(([id, n, sev]) => { const [x, y] = N[id]; return `<g style="cursor:help" ${tipH(n, `Issue · ${sev}`, '')}>${tri(x + 14, y - 16, 6.5, sev === 'Critical' ? rose : '#fb7185')}</g>`; }).join('');
  return dxCard(`<svg viewBox="0 0 940 320" class="w-full h-auto" font-family="Lato, sans-serif">${E.map(edge).join('')}${Object.keys(N).map(node).join('')}${issues}</svg>
    <div class="mt-1 flex items-center gap-4 text-[12px] text-white/50"><span><span style="display:inline-block;width:18px;border-top:1.5px solid #fb7185;vertical-align:middle;margin-right:6px"></span>observed</span><span><span style="display:inline-block;width:18px;border-top:1.5px dashed #f59e0b;vertical-align:middle;margin-right:6px"></span>suspected</span><span><svg width="12" height="10" style="display:inline;vertical-align:-1px;margin-right:5px"><polygon points="6,0 12,10 0,10" fill="#e11d48"/></svg>issue fired here</span><span class="ml-auto">Hover any step for the activity</span></div>`);
}
const _dxG2 = dxG;
dxG = function (id) { return id === 'C' ? dxAttackStory() : _dxG2(id); };
(() => { const G = DX[3]; G.opts[2] = { id: 'C', name: 'Attack story, product style', tag: 'Matches the product', idea: 'The attack itself (email → click → exploit page → Edge → dropped DLL → rundll32 → C2 and the credential attempt) drawn in the same visual language as the case grouping graph. Red markers show where issues fired. Hover anything.', pros: ['Consistent with the existing product', 'Tells the attack, not the grouping', 'Shows which steps raised issues'], cons: ['No blast radius', 'Smaller labels than the card style'] }; })();

var renderDxSim = function () {
  const el = $('dx-sim'); if (!el) return;
  const pick = k => S.dxPick[k] || DX.find(d => d.key === k).rec;
  el.innerHTML = `<div class="rounded-3xl border border-white/10 overflow-hidden" style="background:#0a0f1f">
      <div class="px-6 py-4 border-b border-white/10 flex items-center gap-3 flex-wrap"><span class="text-[12px] text-white/45 font-mono">Case #555548</span><span class="text-[17px] font-bold text-white">${DXD.title}</span><span class="ml-auto text-[12px] text-white/45">Mock built from: ${DX.map(d => `<b class="text-white/75">${d.name.split(' ')[0]} ${pick(d.key)}</b>`).join(' · ')}</span></div>
      <div class="p-6 space-y-7">${DX.map(d => `<div><div class="flex items-center gap-2 mb-2"><span class="text-[11px] font-black tracking-[.16em]" style="color:#5eead4">${d.name.toUpperCase()}</span><span class="text-[11px] text-white/40">· option ${pick(d.key)} · ${d.opts.find(o => o.id === pick(d.key)).name}</span></div>${d.render(pick(d.key))}</div>`).join('')}</div></div>`;
  icons();
}