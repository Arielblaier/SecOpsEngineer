/* ======================================================================
   CASE: attack story + blast radius (attack paths)
   ====================================================================== */
function blastModel(c) {
  if (c._bm) return c._bm;
  const m = caseModel(c), t = T[c.threat], H = c.id === '555548';
  const ring1 = H ? [
      { n: 'FS-FIN-01', k: 'Finance file server', via: 'Mapped drive (SMB)', crit: 'High' },
      { n: 'DC-02', k: 'Domain controller', via: 'Cached admin credentials', crit: 'Critical' },
      { n: 'VPN-GW', k: 'VPN gateway', via: 'Saved VPN profile', crit: 'Medium' },
      { n: 'j.adler', k: 'Treasury identity', via: 'Mailbox delegation', crit: 'High' }]
    : [...m.hosts.slice(1).map(h => ({ n: h, k: 'Related host', via: 'Same credentials seen', crit: 'High' })),
       { n: c.domain === 'Identity' ? 'DC-02' : 'FS-SHARED-02', k: c.domain === 'Identity' ? 'Domain controller' : 'Shared file server', via: c.domain === 'Identity' ? 'Kerberos tickets' : 'SMB session', crit: 'Critical' },
       { n: m.users[0], k: 'Identity', via: 'Active session token', crit: 'High' }].slice(0, 4);
  const ring2 = H ? [
      { n: 'PAY-DB-01', k: 'Payments database', via: 'Service account reuse', from: 0 },
      { n: 'SWIFT-GW', k: 'SWIFT gateway', via: 'Domain admin rights', from: 1 },
      { n: 'HR-CORE', k: 'HR records', via: 'Delegated access', from: 3 }]
    : [{ n: 'PAY-DB-01', k: 'Payments database', via: 'Service account reuse', from: 0 }, { n: 'CORE-BANK', k: 'Core banking', via: 'Admin path through DC', from: Math.min(1, ring1.length - 1) }];
  const story = H ? [
      ['Initial access', 'Booby-trapped WebP image exploits Edge (CVE-2023-4863)', 'obs'], ['Execution', 'Edge launches rundll32.exe', 'obs'], ['Command & control', 'Cobalt Strike beacon to 8.130.54.67', 'obs'],
      ['Credential access', 'LSASS dump with comsvcs.dll', 'next'], ['Lateral movement', 'SMB to FS-FIN-01, admin creds to DC-02', 'pos'], ['Impact', 'Payments data theft or ransomware', 'pos']]
    : [['Initial signal', t.r1m, 'obs'], ['Confirmed activity', t.evm, 'obs'], ['Next likely step', `Credential access on ${c.host}`, 'next'], ['Lateral movement', `Reach ${ring1[0] ? ring1[0].n : 'nearby hosts'}`, 'pos'], ['Impact', `Access to ${ring2[0].k.toLowerCase()}`, 'pos']];
  const paths = ring2.map((r2, i) => { const r1 = ring1[r2.from] || ring1[0]; return { steps: [c.host, r1.n, r2.n], via: [r1.via, r2.via], like: i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low', target: r2.k }; });
  c._bm = { ring1, ring2, story, paths }; return c._bm;
}
function blastHTML(c, part) {
  const B = blastModel(c), after = S.cvAfter;
  const W = 720, H = 460, cx = 360, cy = 230;
  const ang = (i, n, off = -90) => (off + i * 360 / n) * Math.PI / 180;
  const p1 = B.ring1.map((r, i) => ({ ...r, x: cx + 150 * Math.cos(ang(i, B.ring1.length)), y: cy + 125 * Math.sin(ang(i, B.ring1.length)) }));
  const p2 = B.ring2.map(r => { const s = p1[r.from] || p1[0]; const a = Math.atan2(s.y - cy, s.x - cx) + (r.from % 2 ? .28 : -.28); return { ...r, x: cx + 300 * Math.cos(a), y: cy + 205 * Math.sin(a), s }; });
  const cutMark = (x, y) => `<g><circle cx="${x}" cy="${y}" r="10" fill="#00c389"/><path d="M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}" stroke="#04120c" stroke-width="2.2"/></g>`;
  const critC = { Critical: '#f43f5e', High: '#f59e0b', Medium: '#60a5fa' };
  const edges = p1.map(n => `<path d="M${cx},${cy} L${n.x},${n.y}" stroke="#f43f5e" stroke-width="2" stroke-dasharray="6 5" class="br-edge" opacity="${after ? .15 : .8}"/>${after ? cutMark((cx + n.x) / 2, (cy + n.y) / 2) : ''}`).join('')
    + p2.map(n => `<path d="M${n.s.x},${n.s.y} L${n.x},${n.y}" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3 5" class="br-edge" opacity="${after ? .12 : .65}"/>`).join('');
  const dots = after ? '' : [...p1.map(n => [cx, cy, n.x, n.y]), ...p2.map(n => [n.s.x, n.s.y, n.x, n.y])].map(([a, b, x, y], i) => `<circle r="3" fill="#fb7185"><animateMotion dur="2.2s" begin="${(i % 4) * .5}s" repeatCount="indefinite" path="M${a},${b} L${x},${y}"/></circle>`).join('');
  const node = (n, r, fill, label, sub, crown) => `<g opacity="${after ? .35 : 1}"><circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${fill}" fill-opacity=".18" stroke="${fill}" stroke-width="1.6"/>
    ${crown ? `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="14">👑</text>` : `<circle cx="${n.x}" cy="${n.y}" r="5" fill="${fill}"/>`}
    <text x="${n.x}" y="${n.y + r + 15}" text-anchor="middle" font-size="12" font-weight="700" class="fill-ink" font-family="Lato, sans-serif">${esc(label)}</text>
    <text x="${n.x}" y="${n.y + r + 29}" text-anchor="middle" font-size="10.5" class="fill-ink3" font-family="Lato, sans-serif">${esc(sub)}</text></g>`;
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="Blast radius">
    <defs><radialGradient id="brcore"><stop offset="0" stop-color="#f43f5e" stop-opacity=".55"/><stop offset="1" stop-color="#f43f5e" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy}" rx="300" ry="205" fill="none" stroke="rgb(var(--line2))" stroke-dasharray="2 6"/><ellipse cx="${cx}" cy="${cy}" rx="150" ry="125" fill="none" stroke="rgb(var(--line2))" stroke-dasharray="2 6"/>
    <text x="${cx + 154}" y="${cy - 118}" font-size="10.5" class="fill-ink3" font-family="Lato, sans-serif">1 hop</text><text x="${cx + 250}" y="${cy - 168}" font-size="10.5" class="fill-ink3" font-family="Lato, sans-serif">2 hops</text>
    <circle cx="${cx}" cy="${cy}" r="${after ? 60 : 210}" fill="url(#brcore)" opacity=".45"/>
    ${edges}${dots}
    ${p1.map(n => node(n, 18, critC[n.crit] || '#f59e0b', n.n, n.k, false)).join('')}
    ${p2.map(n => node(n, 22, '#f43f5e', n.n, n.k, true)).join('')}
    <circle cx="${cx}" cy="${cy}" r="34" fill="${after ? '#00c389' : '#f43f5e'}" fill-opacity=".25" stroke="${after ? '#00c389' : '#f43f5e'}" stroke-width="2"/>
    <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="11.5" font-weight="800" class="fill-ink" font-family="Lato, sans-serif">${esc(c.host)}</text>
    <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="${after ? '#5eead4' : '#fda4af'}" font-family="Lato, sans-serif">${after ? 'contained' : 'compromised'}</text>
  </svg>`;
  const story = `<div class="flex items-stretch overflow-x-auto pb-1">${B.story.map(([t, d, st], i) => `${i ? `<span class="w-6 h-[2px] self-center shrink-0 ${st === 'obs' ? 'bg-rose-500/70' : 'bg-line2'}"></span>` : ''}
    <div class="w-[170px] shrink-0 rounded-2xl p-3 border ${st === 'obs' ? 'border-rose-500/40 bg-rose-500/[.07]' : st === 'next' ? 'border-amber-500/50 bg-amber-500/[.07]' : 'border-dashed border-line2 opacity-70'}">
      <span class="text-[11px] font-bold ${st === 'obs' ? 'c-rose' : st === 'next' ? 'c-amber' : 'text-ink3'}">${st === 'obs' ? 'OBSERVED' : st === 'next' ? 'LIKELY NEXT' : 'POSSIBLE'}</span>
      <div class="text-[13.5px] font-bold text-ink mt-1">${t}</div><div class="text-[12px] text-ink3 mt-0.5 leading-snug">${esc(d)}</div></div>`).join('')}</div>`;
  const storySec = `<section class="mt-5 rounded-2xl border border-line p-5">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3"><div><div class="text-[15px] font-semibold text-ink flex items-center gap-2">${ic('git-commit-horizontal', 'w-4 h-4 c-ai')}The attack story</div><div class="text-[12.5px] text-ink3">What the attacker did, and where they are likely to go next</div></div></div>
      ${story}
    </section>`;
  const radiusSec = `<section class="mt-4 rounded-2xl border border-line overflow-hidden">
      <div class="px-5 py-4 flex items-center justify-between gap-3 flex-wrap border-b border-line">
        <div><div class="text-[15px] font-semibold text-ink flex items-center gap-2">${ic('radar', 'w-4 h-4 c-rose')}Possible impact · blast radius</div>
          <div class="text-[12.5px] text-ink3">Since ${esc(c.host)} and ${esc(c.user)} are compromised, this is what the attacker can reach through known attack paths</div></div>
        <button onclick="S.cvAfter=!S.cvAfter;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="px-3 py-1.5 rounded-full border text-[13px] font-semibold ${after ? 'border-cx/60 bg-cx/10 c-cx' : 'border-line2 text-ink2 hover:text-ink'}">${after ? 'Showing: after containment' : 'Preview: after containment'}</button>
      </div>
      <div class="grid lg:grid-cols-[1fr,280px]">
        <div class="p-3">${svg}</div>
        <div class="p-5 border-t lg:border-t-0 lg:border-l border-line space-y-4">
          <div class="grid grid-cols-2 gap-2">${[[after ? 0 : B.ring1.length, 'reachable assets'], [after ? 0 : B.ring2.length, 'crown jewels at risk'], [2, 'identities exposed'], [after ? '—' : '2 hops', 'to a crown jewel']].map(([v, l]) => `<div class="rounded-xl bg-sunk p-3"><div class="text-[20px] font-black font-mono ${after ? 'c-cx' : 'c-rose'}">${v}</div><div class="text-[11.5px] text-ink3">${l}</div></div>`).join('')}</div>
          <div><div class="text-[12px] font-semibold text-ink mb-2">Most likely attack paths</div>
            <div class="space-y-2">${B.paths.map(p => `<div class="rounded-xl border border-line p-2.5 ${after ? 'opacity-40' : ''}"><div class="flex items-center justify-between text-[11px]"><span class="text-ink3">To the ${esc(p.target)}</span><span class="${p.like === 'High' ? 'c-rose' : p.like === 'Medium' ? 'c-amber' : 'text-ink3'} font-bold">${p.like}</span></div>
              <div class="flex items-center gap-1 flex-wrap mt-1 text-[12px] font-mono text-ink">${p.steps.map((x, i) => `${i ? `<span class="text-ink3 font-sans text-[10.5px]">→ ${esc(p.via[i - 1])} →</span>` : ''}<span>${esc(x)}</span>`).join(' ')}</div></div>`).join('')}</div></div>
          <div class="text-[12px] text-ink3">${after ? 'Approving the containment cuts every path above.' : 'Approving the containment cuts these paths at the first hop.'}</div>
        </div>
      </div>
    </section>`;
  return part === 'story' ? storySec : part === 'radius' ? radiusSec : storySec + radiusSec;
}


function caseStory(c) {
  const wl = getWorklog(c), m = caseModel(c);
  const xq = wl.filter(e => e.by === 'agent' && e.type === 'xql'), evd = wl.find(e => e.by === 'agent' && e.type === 'evidence');
  const lc1 = x => x ? x.charAt(0).toLowerCase() + x.slice(1) : '';
  const f1 = xq[0] ? xq[0].result : T[c.threat].r1m, f2 = evd ? evd.detail : (xq[1] ? xq[1].result : '');
  return HERO[c.id] ? HERO[c.id].story : `${c.summary} It began on ${fmtDate(m.first)}, when a ${m.label.toLowerCase()} issue was raised on ${c.host}. Looking closer, the agent found that ${lc1(f1).replace(/\.$/, '')}.${f2 ? ' ' + f2.replace(/\.?$/, '.') : ''} By the time the case was opened, ${m.issues.length} related issues had been grouped together, touching ${m.hosts.length === 1 ? 'one host' : m.hosts.length + ' hosts'} (${m.hosts.join(', ')}) and ${m.users.length} accounts.`;
}

function caseHeaderBlock(c, compact) {
  const inv = investigation(c), story = caseStory(c);
  const lvlN = inv.Q.some(q => q.open) ? 1 : confN(inv.target), lvl = inv.Q.some(q => q.open) ? 'Building' : confLevel(inv.target);
  const col = t => `<div class="text-[11px] font-bold tracking-[.14em] text-ink3 mb-2">${t}</div>`;
  return `<div class="grid ${compact ? 'grid-cols-1' : 'md:grid-cols-[1fr,240px]'} rounded-2xl border border-indigo-400/25 overflow-hidden" style="background:linear-gradient(180deg, rgb(28 36 78 / .45), rgb(13 18 38 / .55))">
    <div class="p-5">${col('SUMMARY')}<p class="text-[14.5px] text-ink2 leading-[1.7]">${richText(c, story)}</p></div>
    <div class="p-5 ${compact ? 'border-t' : 'md:border-l'} border-indigo-400/20 flex flex-col" style="background:${inv.color}0d">${col('VERDICT')}
      <div ${tipAttr(verdictTip(c))} class="cursor-help self-start">
        <div class="text-[26px] font-black leading-tight" style="color:${inv.color}">${inv.label}</div>
        <div class="flex gap-1 mt-2 w-[150px]">${[0, 1, 2].map(k => `<div class="flex-1 h-2 rounded-full" style="background:${k < lvlN ? inv.color : 'rgb(var(--line))'}"></div>`).join('')}</div>
        <div class="text-[13px] text-ink2 mt-1.5">${lvl} confidence</div>
        <div class="text-[11.5px] text-ink3 mt-2 inline-flex items-center gap-1">${ic('info', 'w-3 h-3')}Hover for the rationale</div>
      </div>
      <div class="mt-auto pt-4 text-[12px] text-ink3">Last updated ${fmtAgo(c.updated)}</div>
    </div>
  </div>`;
}
function actionReasonHTML(tk, key) {
  const A = apvData(tk); S.arOpen = S.arOpen || {};
  const open = S.arOpen[key];
  return `<div class="rounded-xl border border-indigo-400/20 overflow-hidden">
    <button onclick="S.arOpen['${key}']=!S.arOpen['${key}'];${key.startsWith('cu') ? 'renderCatchup(false)' : key.startsWith('br') ? 'S.briefSig=null;renderBrief()' : `S.cvSig=null;openCaseDrawer(S.drawerId,true)`}" class="w-full text-left px-3.5 py-2.5 flex items-center gap-2 text-[13px] text-ink2 hover:text-ink">${ic('sparkles', 'w-3.5 h-3.5 c-ai')}Why I recommend this <span class="text-ink3">· ${A.signals.length} signals</span><span class="ml-auto">${ic(open ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</span></button>
    ${open ? `<div class="xp-in border-t border-indigo-400/15 px-3.5 py-3 text-[13px]">${actionReasonRich(tk.caseId ? byId(tk.caseId) : null, tk)}</div>` : ''}
  </div>`;
}

function invPanelHTML(c, mode, tk) {
  const inv = investigation(c), wl = getWorklog(c).filter(e => e.by === 'agent' && e.type !== 'task'), run = verdictOf(c) === 'Running';
  tk = tk || S.tasks.find(t => t.id === c.task);
  const pct = Math.round(inv.answered / Math.max(1, inv.Q.length) * 100), lvl = run ? 'Building' : confLevel(inv.target);
  const icn = { xql: 'database', evidence: 'file-search', verdict: 'scale', note: 'message-square', step: 'circle-dot' };
  const card = (inner, id) => `<section ${id ? `id="${id}"` : ''} class="rounded-2xl p-4" style="background:linear-gradient(180deg, rgb(28 36 78 / .45), rgb(13 18 38 / .55));border:1px solid rgb(129 140 248 / .25)">${inner}</section>`;
  const head = card(`<div class="flex items-center gap-2 text-[12px] text-ink3 flex-wrap">${pillarBadge('analyst')}<span class="font-mono">#${c.id}</span><span>· ${esc(c.host)}</span>
        <span class="ml-auto inline-flex items-center gap-1.5 ${run ? 'c-blue' : lifecycle(c) === 'pending' ? 'c-amber' : 'c-cx'} font-semibold">${run ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Investigating' : lifecycle(c) === 'pending' ? 'Waiting for you' : 'Done'}</span></div>
      <div class="text-[17px] font-bold text-ink leading-snug mt-2">${esc(c.name)}</div>
      <p class="text-[13.5px] text-ink2 leading-relaxed mt-2">${richText(c, caseStory(c).split(/(?<=\.)\s+/).slice(0, 3).join(' '))}</p>
      <div class="mt-3 flex items-center gap-3 flex-wrap" ${tipAttr(verdictTip(c))}><span class="text-[11px] font-bold tracking-[.14em] text-ink3">VERDICT</span><span class="text-[16px] font-black cursor-help" style="color:${inv.color}">${inv.label}</span>${confBars(c)}<span class="text-[12.5px] text-ink3">${lvl} confidence</span></div>`, mode === 'decision' ? 'cu-hero' : '');
  const progress = card(`<div class="text-[11px] font-bold tracking-[.14em] text-ink3">INVESTIGATION PROGRESS</div>
      <div class="mt-2 h-2 rounded-full bg-sunk overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:linear-gradient(90deg,#5eead4,#818cf8)"></div></div>
      <div class="mt-1.5 flex justify-between text-[12px] text-ink3"><span>${inv.answered} of ${inv.Q.length} questions answered</span><span>${wl.filter(e => e.type === 'xql').length} queries · ${fmtDur(c.dur || 0)}</span></div>
      ${run && wl.length ? `<div class="mt-3 flex items-center gap-2 text-[13px] text-ink"><span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>Now: ${esc(wl[wl.length - 1].title)}</div>` : ''}
      ${(S.ipOpen = S.ipOpen || {}, '')}<button onclick="S.ipOpen['${c.id}']=!S.ipOpen['${c.id}'];${mode === 'decision' ? 'renderCatchup(false)' : 'S.briefSig=null;renderBrief()'}" class="mt-3 inline-flex items-center gap-1.5 text-[12.5px] c-ai font-semibold">${S.ipOpen && S.ipOpen[c.id] ? 'Hide Josh’s steps' : `Show Josh’s steps (${wl.length})`} ${ic(S.ipOpen && S.ipOpen[c.id] ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5')}</button>
      ${S.ipOpen && S.ipOpen[c.id] ? `<ol class="mt-4 relative ml-2 border-l border-indigo-400/25 space-y-3">${wl.slice(mode === 'decision' ? -4 : -7).map((e, i, a) => `<li class="pl-4 relative"><span class="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${i === a.length - 1 && run ? 'bg-blue-500' : 'bg-indigo-500/30'}">${ic(icn[e.type] || 'circle-dot', 'w-2.5 h-2.5 text-white')}</span>
        <div class="text-[13px] text-ink font-semibold leading-snug">${esc(e.title.replace(/^Query: /, ''))}</div>${e.result || e.detail ? `<div class="text-[12px] text-ink3 leading-snug mt-0.5">${esc((e.result || e.detail).slice(0, 110))}${(e.result || e.detail).length > 110 ? '…' : ''}</div>` : ''}</li>`).join('') || '<li class="pl-4 text-[13px] text-ink3">Starting…</li>'}</ol>` : ''}`);
  let decision = '';
  if (tk) {
    const A = apvData(tk), key = (mode === 'decision' ? 'cu:' : 'br:') + tk.id;
    S.arOpen = S.arOpen || {};
    decision = card(`<div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="text-[11px] font-bold tracking-[.14em] c-amber">NEEDS YOUR DECISION</div><div class="text-[16px] font-semibold text-ink mt-1 leading-snug">${esc(tk.title)}</div>
        <div class="text-[12.5px] text-ink3 mt-1">${esc(A.conseq)}</div></div>${slaRing(tk)}</div>
      ${mode === 'decision' && c ? `<div class="mt-3">${impactHTML(c, tk)}</div>` : ''}
      <div class="mt-3">${actionReasonHTML(tk, key)}</div>
      ${mode === 'decision' ? '' : `<div class="mt-3 flex gap-2"><button onclick="caseDecide('${c.id}','approve');S.briefSig=null;renderBrief()" class="hm-pill pri">Approve</button><button onclick="caseDecide('${c.id}','decline');S.briefSig=null;renderBrief()" class="hm-pill">Decline</button></div>`}`, 'cu-dec');
  }
  if (mode === 'decision') { const prog = `<div class="mt-3 pt-3 border-t border-indigo-400/15"><div class="flex items-center gap-3 text-[12px] text-ink3"><span class="font-bold tracking-[.12em]">HOW HE GOT THERE</span><span class="flex-1 h-1.5 rounded-full bg-sunk overflow-hidden"><span class="block h-full rounded-full" style="width:${pct}%;background:linear-gradient(90deg,#5eead4,#818cf8)"></span></span><span>${inv.answered} of ${inv.Q.length} questions · ${wl.filter(e => e.type === 'xql').length} queries</span></div>
      <button onclick="S.ipOpen=S.ipOpen||{};S.ipOpen['${c.id}']=!S.ipOpen['${c.id}'];renderCatchup(false)" class="mt-2 inline-flex items-center gap-1.5 text-[12.5px] c-ai font-semibold">${S.ipOpen && S.ipOpen[c.id] ? 'Hide Josh’s steps' : `Show Josh’s steps (${wl.length})`} ${ic(S.ipOpen && S.ipOpen[c.id] ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5')}</button>${S.ipOpen && S.ipOpen[c.id] ? `<ol class="mt-3 relative ml-2 border-l border-indigo-400/25 space-y-2.5">${wl.slice(-5).map(e => `<li class="pl-4 relative"><span class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-300"></span><div class="text-[12.5px] text-ink">${esc(e.title.replace(/^Query: /, ''))}</div>${e.result ? `<div class="text-[11.5px] text-ink3">${esc(e.result)}</div>` : ''}</li>`).join('')}</ol>` : ''}</div>`;
    return `<div class="space-y-3">${head.replace(/<\/section>$/, prog + '</section>')}${decision}</div>`; }
  return `<div class="space-y-3">${head}${progress + decision}</div>`;
}
function renderInvProgress() {
  const el = $('brief'), c = byId(S.briefId); if (!c) { el.innerHTML = ''; return; }
  const inv = investigation(c), wl = getWorklog(c).filter(e => e.by === 'agent' && e.type !== 'task');
  const key = ['prog', c.id, c.verdict, c.task, wl.length, inv.answered, JSON.stringify(S.arOpen || {})].join('|');
  if (S.briefSig === key) return; S.briefSig = key;
  el.innerHTML = `<div class="fade-up space-y-3">${invPanelHTML(c, 'brief')}
    <button onclick="openCaseDrawer('${c.id}')" class="w-full py-2.5 rounded-xl border border-indigo-400/35 bg-indigo-500/10 text-ink text-[13.5px] font-semibold inline-flex items-center justify-center gap-2">${ic('maximize-2', 'w-4 h-4')}Open the full investigation</button></div>`;
  icons();
}

function rawEventsHTML(c, e, seed) {
  const r = mulberry32(hashStr(c.id + ':' + seed)), m = caseModel(c), t0 = c.opened || c.updated;
  const evs = Array.from({ length: 3 }, (_, n) => {
    const ts = new Date(t0 - (3 - n) * (40 + Math.floor(r() * 90)) * 1000).toISOString();
    const base = { _time: ts, agent_hostname: c.host, agent_os_type: 'AGENT_OS_WINDOWS', actor_effective_username: `BANKUS\\${c.user}` };
    if (e.kind === 'net' || /beacon|network|C2|traffic|IP/i.test(e.label)) return { ...base, event_type: 'NETWORK', action_local_ip: c.ip, action_remote_ip: m.ext, action_remote_port: 443, action_app_id_transitions: ['ssl', 'web-browsing'], actor_process_image_name: 'rundll32.exe', bytes_sent: 1200 + Math.floor(r() * 400) };
    if (e.kind === 'file' || /file|hash|binary|image/i.test(e.label)) return { ...base, event_type: 'FILE', action_file_name: (m.hashes[0] || {}).file || 'payload.bin', action_file_sha256: ((m.hashes[0] || {}).sha || 'a3f1…') + 'c9e2b1', action_file_path: 'C:\\Users\\' + c.user + '\\AppData\\Local\\Temp\\', wildfire_verdict: 'MALWARE' };
    return { ...base, event_type: 'PROCESS', actor_process_image_name: 'msedge.exe', action_process_image_name: 'rundll32.exe', action_process_command_line: 'rundll32.exe C:\\Users\\Public\\vcredist.dll,Start', causality_actor_process_image_name: 'explorer.exe', action_process_signature_status: 'UNSIGNED' };
  });
  return `<pre class="mt-2 max-h-[240px] overflow-auto px-2.5 py-2 rounded-md bg-code text-[11px] leading-[1.45] font-mono text-ink2">${esc(evs.map(x => JSON.stringify(x, null, 2)).join('\n'))}</pre>
    <div class="mt-1 text-[11px] text-ink3">Raw events from the ${e.kind === 'net' ? 'network' : 'endpoint'} dataset · 3 of ${2 + Math.floor(r() * 30)} matching</div>`;
}

function caseStoryGraph(c) {
  const B = blastModel(c), m = caseModel(c), H = c.id === '555548';
  const proc = H ? 'rundll32.exe' : m.label.slice(0, 18), ext = m.ext;
  const ASSET = 'rgb(125 200 225 / .7)', ART = 'rgb(205 185 255 / .65)';
  const tip = (h, a, b) => tipAttr(`<div class="text-[14px] font-bold text-ink">${esc(h)}</div><div class="text-[12.5px] text-ink2 mt-0.5">${a}</div>${b ? `<div class="text-[11.5px] text-ink3 mt-1">${b}</div>` : ''}`);
  const I = { user: DXI.user, host: '<rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-4,7 h8" stroke="currentColor" stroke-width="1.5"/>', proc: DXI.proc, ip: DXI.ip, issue: '<path d="M0,-6 L6,5 L-6,5 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>', server: DXI.server, crown: DXI.crown };
  const ring = B.ring1.slice(0, 4);
  const N = { iss: [80, 100, 'issue', m.label, 'first issue', `${m.issues.length} issues grouped · first ${fmtDate(m.first)}`, 1, 0], user: [230, 100, 'user', c.user, 'user', 'Signed in to the host', 1, 1], host: [380, 100, 'host', c.host, 'host · compromised', 'Where the attack ran', 1, 1], proc: [530, 100, 'proc', proc, 'process', H ? 'Started by msedge.exe with no arguments' : 'Unusual parent process', 1, 0], ip: [680, 100, 'ip', ext, 'command & control', '24 beacons, every ~45s', 1, 0] };
  ring.forEach((r, i) => { N['r' + i] = [300 + i * 160, 235, r.k === 'Identity' || /identity/i.test(r.k) ? 'user' : r.crit === 'Critical' ? 'crown' : 'server', r.n, r.k, `Reachable via ${r.via}`, 0, 1]; });
  const E = [['iss', 'user', 'raised for', 1], ['user', 'host', 'signed in to', 1], ['host', 'proc', 'ran', 1], ['proc', 'ip', 'beacons to', 1], ...ring.map((r, i) => ['host', 'r' + i, r.via, 0])];
  const edge = ([a, b, v, obs]) => { const [x1, y1] = N[a], [x2, y2] = N[b], hz = Math.abs(y2 - y1) < 5, sx = hz ? x1 + 18 : x1, sy = hz ? y1 : y1 + 44, ex = hz ? x2 - 18 : x2, ey = hz ? y2 : y2 - 18, my = (sy + ey) / 2, mx = (sx + ex) / 2;
    const d = hz ? `M${sx},${sy} L${ex},${ey}` : `M${sx},${sy} C${sx},${my} ${ex},${my} ${ex},${ey}`;
    return `<path d="${d}" fill="none" stroke="rgb(var(--line2))" stroke-width="1.1" ${obs ? '' : 'stroke-dasharray="4 3"'}/><text x="${hz ? mx : ex + 6}" y="${hz ? sy - 7 : ey - 10}" text-anchor="${hz ? 'middle' : 'start'}" font-size="9" fill="rgb(var(--ink3))">${esc(v)}</text><path d="${d}" fill="none" stroke="transparent" stroke-width="14" style="cursor:help" ${tip(`${N[a][3]} ${v} ${N[b][3]}`, N[b][5], obs ? 'Observed' : 'Possible next step · not observed')}/>`; };
  const node = k => { const [x, y, ic0, a, b, t, obs, asset] = N[k];
    return `<g style="cursor:pointer" ${tip(a, t, `${asset ? 'Asset' : 'Artifact'} · ${obs ? 'observed' : 'reachable'}`)} onclick="openEnt('${c.id}','${ic0 === 'ip' ? 'ip' : ic0 === 'proc' ? 'file' : ic0 === 'user' ? 'user' : 'host'}','${esc(a)}')" color="#e7ecff"><circle cx="${x}" cy="${y}" r="17" fill="${asset ? '#1f2d3f' : '#29263f'}" stroke="${asset ? ASSET : ART}" stroke-width="1.5" ${obs ? '' : 'stroke-dasharray="3 3"'}/><g transform="translate(${x},${y})">${I[ic0]}</g>
      <text x="${x}" y="${y + 32}" text-anchor="middle" font-size="10" fill="rgb(var(--ink2))">${esc(String(a).slice(0, 20))}</text><text x="${x}" y="${y + 44}" text-anchor="middle" font-size="8.5" fill="rgb(var(--ink3))">${esc(b)}</text></g>`; };
  const marks = ['host', 'proc', 'ip'].map(k => { const [x, y] = N[k]; return `<polygon points="${x + 15},${y - 22} ${x + 21},${y - 12} ${x + 9},${y - 12}" fill="#e11d48" ${tipAttr('<div class="text-[13px] text-ink">An issue fired here</div>')}/>`; }).join('');
  return `<svg viewBox="0 0 960 300" class="w-full h-auto" font-family="Lato, sans-serif">${E.map(edge).join('')}${Object.keys(N).map(node).join('')}${marks}</svg>
    <div class="mt-1 flex items-center gap-4 flex-wrap text-[12px] text-ink3 px-1"><span><span style="display:inline-block;width:11px;height:11px;border-radius:9px;border:1.4px solid ${ASSET};vertical-align:-1px;margin-right:6px"></span>asset</span><span><span style="display:inline-block;width:11px;height:11px;border-radius:9px;border:1.4px solid ${ART};vertical-align:-1px;margin-right:6px"></span>artifact</span><span><span style="display:inline-block;width:18px;border-top:1.2px dashed rgb(148 158 196);vertical-align:middle;margin-right:6px"></span>reachable, not observed</span><span class="ml-auto">Hover anything · click a node for details</span></div>`;
}
function attackGraphSVG(c) {
  const B = blastModel(c), m = caseModel(c), H = c.id === '555548';
  S.cvExp = S.cvExp || {}; const lvl = S.cvExp[c.id] || 0;
  const W = 980, Hh = lvl === 0 ? 250 : lvl === 1 ? 400 : 540, rose = '#e11d48';
  const lbl = (x, y, a, b) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="11.5" font-weight="700" class="fill-ink">${esc(a)}</text>${b ? `<text x="${x}" y="${y + 14}" text-anchor="middle" font-size="10" class="fill-ink3">${esc(b)}</text>` : ''}`;
  const edge = (x1, y1, x2, y2, dash, col, txt) => `<path d="M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}" fill="none" stroke="${col || 'rgb(var(--line2))'}" stroke-width="${dash ? 1.6 : 1.2}" ${dash ? 'stroke-dasharray="5 4"' : ''}/>${txt ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle" font-size="9.5" fill="#fda4af">${esc(txt)}</text>` : ''}`;
  const vedge = (x1, y1, x2, y2, txt, tip) => `${tip ? `<path d="M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}" fill="none" stroke="transparent" stroke-width="16" style="cursor:help" ${tipAttr(tip)}/>` : ''}<path d="M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}" fill="none" stroke="#f43f5e" stroke-opacity=".75" stroke-width="1.6" stroke-dasharray="5 4" marker-end="url(#agArrR)" pointer-events="none"/>${txt ? `<rect x="${x2 - 66}" y="${y2 - 30}" width="132" height="18" rx="9" fill="rgb(var(--panel))" stroke="#f43f5e" stroke-opacity=".35"/><text x="${x2}" y="${y2 - 17}" text-anchor="middle" font-size="9.5" fill="#fda4af">${esc(txt.length > 22 ? txt.slice(0, 21) + '…' : txt)}</text>` : ''}`;
  const node = (x, y, kind, hot) => {
    const ring = hot ? `<circle cx="${x}" cy="${y}" r="21" fill="none" stroke="${rose}" stroke-width="1.6" stroke-opacity=".8"><animate attributeName="r" values="19;24;19" dur="2.4s" repeatCount="indefinite"/></circle>` : '';
    const g = kind === 'user' ? `<circle cx="${x}" cy="${y - 4}" r="4" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M${x - 7},${y + 8} q7,-9 14,0" fill="none" stroke="#fff" stroke-width="1.5"/>`
      : kind === 'host' ? `<rect x="${x - 8}" y="${y - 6}" width="16" height="10" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M${x - 4},${y + 8} h8" stroke="#fff" stroke-width="1.5"/>`
      : kind === 'ip' ? `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="900" fill="#fff">IP</text>`
      : kind === 'proc' ? `<path d="M${x - 7},${y - 5} l4,5 -4,5 M${x},${y + 6} h7" fill="none" stroke="#fff" stroke-width="1.6"/>`
      : kind === 'crown' ? `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13">👑</text>`
      : kind === 'id' ? `<circle cx="${x}" cy="${y - 3}" r="3.5" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M${x - 6},${y + 7} q6,-8 12,0" fill="none" stroke="#fff" stroke-width="1.4"/>`
      : `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    return `${ring}<circle cx="${x}" cy="${y}" r="15" fill="${kind === 'crown' ? '#4c0519' : hot ? '#7f1d1d' : '#2b3445'}" stroke="${hot || kind === 'crown' ? rose : 'none'}" stroke-width="1.2"/>${g}`;
  };
  const shield = (x, y) => `<path d="M${x},${y - 15} l12,5 v8 c0,9 -6,14 -12,17 c-6,-3 -12,-8 -12,-17 v-8 z" fill="#4f6bed"/><circle cx="${x}" cy="${y + 1}" r="3" fill="#fff"/>`;
  const tri = (x, y) => `<polygon points="${x},${y - 13} ${x + 13.6},${y + 10} ${x - 13.6},${y + 10}" fill="${rose}" stroke="${rose}" stroke-width="2.5" stroke-linejoin="round"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="12" font-weight="900" fill="#fff">!</text>`;
  const plus = (x, y, n, txt, lv) => `<g style="cursor:pointer" onclick="S.cvExp['${c.id}']=${lv};S.cvSig=null;openCaseDrawer('${c.id}',true)">
      <circle cx="${x}" cy="${y}" r="15" fill="rgb(var(--panel))" stroke="#f43f5e" stroke-dasharray="3 3" stroke-width="1.6"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="900" fill="#fb7185">+</text>
      ${lbl(x, y + 30, `${n} ${txt}`, 'Click to expand')}</g>`;
  const Y0 = 80, X = [0, 110, 300, 490, 680, 870];
  const proc = H ? 'rundll32.exe' : m.label.slice(0, 18), ext = m.ext;
  let out = '';
  // observed chain
  const hov = (kind, name, inner) => `<g ${tipAttr(entTip(c, kind, name) + '<div class="mt-2 text-[11.5px] text-ink3">Click for details</div>')} style="cursor:pointer" onclick="openEnt('${c.id}','${kind}','${esc(name)}')">${inner}</g>`;
  const actTip = (h, lines) => `<div class="text-[11px] text-ink3 tracking-wide">ACTIVITY</div><div class="text-[14px] font-bold text-ink mt-0.5">${h}</div>${lines.map(l => `<div class="text-[12.5px] text-ink2 mt-1">${l}</div>`).join('')}`;
  const chain = (x1, x2, verb, tip, hot) => `<path d="M${x1},${Y0} L${x2},${Y0}" stroke="${hot ? '#f43f5e' : 'rgb(var(--line2))'}" stroke-width="${hot ? 2 : 1.4}" ${hot ? '' : 'stroke-dasharray="4 4"'} marker-end="url(#${hot ? 'agArrR' : 'agArr'})"/>
    <rect x="${(x1 + x2) / 2 - verb.length * 3.1 - 8}" y="${Y0 - 26}" width="${verb.length * 6.2 + 16}" height="17" rx="8.5" fill="rgb(var(--panel))" stroke="${hot ? 'rgb(244 63 94 / .45)' : 'rgb(var(--line2))'}"/><text x="${(x1 + x2) / 2}" y="${Y0 - 14}" text-anchor="middle" font-size="10" fill="${hot ? '#fda4af' : 'rgb(var(--ink3))'}">${verb}</text>
    <path d="M${x1},${Y0} L${x2},${Y0}" stroke="transparent" stroke-width="22" style="cursor:help" ${tipAttr(tip)}/>`;
  const H0 = c.id === '555548';
  out += chain(X[1] + 16, X[2] - 18, 'grouped on', actTip(`${m.issues.length} issues tied to ${c.user}`, [`Grouped because they share the user and host`, `First at ${fmtDate(m.first)}`]))
    + chain(X[2] + 18, X[3] - 18, 'signed in to', actTip(`${c.user} → ${c.host}`, [`Interactive session since 08:55`, H0 ? 'Opened a web page in Microsoft Edge at 14:21:58' : 'Normal working hours, known device']))
    + chain(X[3] + 18, X[4] - 18, 'spawned', actTip(`${c.host} ran ${proc}`, [H0 ? 'msedge.exe → rundll32.exe with no arguments at 14:22:01' : `${proc} started by a parent it doesn’t usually come from`, H0 ? 'Never seen on any Bank US host before' : 'Rare in the last 30 days']), true)
    + chain(X[4] + 18, X[5] - 18, 'beacons to', actTip(`${proc} → ${ext}`, ['24 encrypted connections in 18 minutes', 'Every ~45 seconds, TLS fingerprint 72a589da…', 'Known Cobalt Strike server on 3 feeds']), true);
  out += `<g ${tipAttr(`<div class="text-[14px] font-bold text-ink">${esc(m.label)}</div><div class="text-[12.5px] text-ink3">${m.issues.length} issues grouped · first ${fmtDate(m.first)}</div>`)}>${tri(X[1], Y0) + lbl(X[1], Y0 + 32, m.label.length > 22 ? m.label.slice(0, 21) + '…' : m.label, `${m.issues.length} issues`)}</g>`;
  out += hov('user', c.user, node(X[2], Y0, 'user', true) + lbl(X[2], Y0 + 32, c.user, 'compromised account'));
  out += hov('host', c.host, node(X[3], Y0, 'host', true) + lbl(X[3], Y0 + 32, c.host, 'compromised host'));
  out += hov('file', proc, node(X[4], Y0, 'proc') + lbl(X[4], Y0 + 32, proc, 'process'));
  out += hov('ip', ext, node(X[5], Y0, 'ip') + lbl(X[5], Y0 + 32, ext, 'command & control'));
  // blast radius: level 1
  const n1 = B.ring1.length, Y1 = 262;
  const xs1 = B.ring1.map((_, i) => 160 + i * ((W - 320) / Math.max(1, n1 - 1)));
  if (lvl === 0) out += vedge(X[3], Y0 + 50, X[3], 175) + plus(X[3], 190, n1, 'reachable assets', 1);
  else {
    B.ring1.forEach((r, i) => { out += vedge(X[3], Y0 + 50, xs1[i], Y1 - 18, r.via, `<div class="text-[11px] text-ink3 tracking-wide">POSSIBLE NEXT STEP</div><div class="text-[14px] font-bold text-ink mt-0.5">${esc(c.host)} → ${esc(r.n)}</div><div class="text-[12.5px] text-ink2 mt-1">How: ${esc(r.via)}</div><div class="text-[12.5px] text-ink3 mt-0.5">Not observed yet. This is a path the attacker could take.</div>`) + `<g ${tipAttr(entTip(c, 'asset', r.n) + '<div class="mt-2 text-[11.5px] text-ink3">Click for details</div>')} style="cursor:pointer" onclick="openEnt('${c.id}','asset','${esc(r.n)}')">${node(xs1[i], Y1, /identity/i.test(r.k) ? 'id' : 'host') + lbl(xs1[i], Y1 + 32, r.n, r.k)}</g>`; });
    if (lvl === 1) out += vedge(xs1[0], Y1 + 52, (W / 2), 325) + plus(W / 2, 340, B.ring2.length, 'crown jewels', 2);
    else {
      const Y2 = 420; B.ring2.forEach(r2 => { const sx = xs1[r2.from] || xs1[0]; const x = Math.max(110, Math.min(W - 110, sx + (r2.from % 2 ? 60 : -60))); out += vedge(sx, Y1 + 50, x, Y2 - 18, r2.via, `<div class="text-[11px] text-ink3 tracking-wide">PATH TO A CROWN JEWEL</div><div class="text-[14px] font-bold text-ink mt-0.5">→ ${esc(r2.n)}</div><div class="text-[12.5px] text-ink2 mt-1">How: ${esc(r2.via)}</div><div class="text-[12.5px] text-ink3 mt-0.5">Two hops from the compromised host.</div>`) + `<g ${tipAttr(entTip(c, 'asset', r2.n) + '<div class="mt-2 text-[11.5px] text-ink3">Click for details</div>')} style="cursor:pointer" onclick="openEnt('${c.id}','asset','${esc(r2.n)}')">${node(x, Y2, 'crown') + lbl(x, Y2 + 32, r2.n, r2.k)}</g>`; });
      out += `<g style="cursor:pointer" onclick="S.cvExp['${c.id}']=0;S.cvSig=null;openCaseDrawer('${c.id}',true)"><text x="${W - 20}" y="${Hh - 14}" text-anchor="end" font-size="11" class="fill-ink3">Collapse blast radius ↑</text></g>`;
    }
    out += `<text x="20" y="${Y1 - 50}" font-size="10" class="fill-ink3" letter-spacing="1.5">BLAST RADIUS · 1 HOP</text>${lvl === 2 ? `<text x="20" y="${420 - 50}" font-size="10" class="fill-ink3" letter-spacing="1.5">2 HOPS · CROWN JEWELS</text>` : ''}`;
  }
  return `<svg viewBox="0 0 ${W} ${Hh}" class="w-full h-auto" preserveAspectRatio="xMidYMid meet" font-family="Lato, system-ui, sans-serif"><defs><marker id="agArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="rgb(148 158 196 / .7)"/></marker><marker id="agArrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f43f5e"/></marker></defs>${out}</svg>`;
}
