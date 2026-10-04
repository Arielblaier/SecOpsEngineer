/* ======================================================================
   HOVER CARDS (entities, verdicts, scores, graph nodes)
   ====================================================================== */
const tipAttr = html => `data-tip="${encodeURIComponent(html)}"`;
document.addEventListener('click', () => { const m = document.getElementById('ct-colmenu'); if (m) m.classList.add('hidden'); });
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('[data-tip]'), tip = $('gtip'); if (!tip) return;
  if (!el) { tip.classList.add('hidden'); return; }
  tip.innerHTML = decodeURIComponent(el.dataset.tip); tip.classList.remove('hidden'); icons();
  const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = Math.min(window.innerWidth - tw - 12, Math.max(12, r.left + r.width / 2 - tw / 2)), y = r.bottom + 8;
  if (y + th > window.innerHeight - 12) y = r.top - th - 8;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
});
document.addEventListener('scroll', () => { const t = $('gtip'); if (t) t.classList.add('hidden'); }, true);
function entInfo(c, kind, name) {
  const m = caseModel(c), H = c.id === '555548';
  const bad = n => n === c.host || n === c.user;
  if (kind === 'host') return { icon: 'monitor', type: 'Host', facts: [['OS', 'Windows 11 Enterprise'], ['Owner', name === c.host ? c.user : 'IT asset'], ['Agent', 'Cortex XDR 8.4 · online'], ['State', bad(name) ? 'Compromised' : 'Related']], risk: bad(name) ? 'High' : 'Medium' };
  if (kind === 'user') return { icon: 'user', type: 'Identity', facts: [['Account', `BANKUS\\${name}`], ['Department', name === 'j.adler' ? 'Treasury' : 'Finance'], ['MFA', 'Enabled'], ['State', bad(name) ? 'Session on compromised host' : 'Related']], risk: bad(name) ? 'High' : 'Medium' };
  if (kind === 'ip') return { icon: 'globe', type: 'IP address', facts: [['Reputation', name === m.ext ? 'Known command-and-control' : 'Internal'], ['Seen', name === m.ext ? '24 connections, every 45s' : 'Internal subnet'], ['Intel', name === m.ext && H ? 'Cobalt Strike team server (Avi)' : 'No match']], risk: name === m.ext ? 'High' : 'Low' };
  if (kind === 'file') return { icon: 'file', type: 'File / process', facts: [['Name', name], ['Signer', /rundll32|msedge/i.test(name) ? 'Microsoft (legitimate binary, abused)' : 'Unsigned'], ['Parent', /rundll32/i.test(name) ? 'msedge.exe' : 'explorer.exe']], risk: 'High' };
  if (kind === 'cve') return { icon: 'bug', type: 'Vulnerability', facts: [['ID', name], ['What', /4863/.test(name) ? 'libwebp heap overflow in image decoding' : 'Remote code execution'], ['Severity', 'Critical · exploited in the wild']], risk: 'Critical' };
  if (kind === 'asset') { const r = blastModel(c).ring1.concat(blastModel(c).ring2).find(x => x.n === name) || {}; return { icon: 'server', type: r.k || 'Asset', facts: [['Reachable via', r.via || '—'], ['Criticality', r.crit || 'Crown jewel']], risk: r.crit || 'Critical' }; }
  return { icon: 'circle', type: kind, facts: [], risk: 'Low' };
}
function entTip(c, kind, name) {
  const I = entInfo(c, kind, name);
  return `<div class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-ink">${ic(I.icon, 'w-4 h-4')}</span><div><div class="text-[14px] font-bold text-ink">${esc(name)}</div><div class="text-[11.5px] text-ink3">${I.type} · risk ${I.risk.toLowerCase()}</div></div></div>
    <div class="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-[12.5px]">${I.facts.map(([k, v]) => `<span class="text-ink3">${k}</span><span class="text-ink">${esc(v)}</span>`).join('')}</div>`;
}
function richText(c, text) {
  const m = caseModel(c);
  const ents = [];
  m.hosts.forEach(h => ents.push([h, 'host'])); m.users.forEach(u => ents.push([u, 'user'])); [m.ext, c.ip].forEach(ip => ip && ents.push([ip, 'ip']));
  let out = esc(text);
  const list = ents.filter(([n]) => n).sort((a, b) => b[0].length - a[0].length);
  const re = new RegExp('(' + list.map(([n]) => esc(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).concat(['CVE-\\d{4}-\\d{4,5}', '\\b[\\w-]+\\.(?:exe|dll|webp|ps1|bin)\\b']).join('|') + ')', 'g');
  return out.replace(re, w => { const hit = list.find(([n]) => esc(n) === w); const kind = hit ? hit[1] : /^CVE/.test(w) ? 'cve' : 'file';
    return `<span class="ent" ${tipAttr(entTip(c, kind, w.replace(/&amp;/g, '&')))}>${w}</span>`; });
}
function scoreStory(c) {
  const vd = verdictOf(c), h = hashStr(c.id + 'sc'), inv = investigation(c);
  const tq = inv.top && inv.top[0];
  let delta, why;
  if (vd === 'Running') { delta = 0; why = 'Josh is still investigating. The score will change once he reaches a verdict.'; }
  else if (vd === 'Malicious') { delta = 10 + h % 16; why = tq ? `Josh raised it after his investigation answered “${tq.q}” with “${tq.ans}”.` : 'Josh raised it after confirming the attack chain.'; }
  else if (vd === 'Benign') { delta = -(18 + h % 22); why = 'Josh lowered it: the activity has a legitimate explanation.'; }
  else { delta = (h % 2 ? 1 : -1) * (3 + h % 6); why = delta > 0 ? 'Josh raised it slightly: the evidence leans malicious but isn’t conclusive.' : 'Josh lowered it slightly: part of the activity looks legitimate.'; }
  const orig = Math.max(5, Math.min(99, c.score - delta));
  return { orig, delta: c.score - orig, why };
}
function scoreTip(c) {
  const inv = investigation(c), tk = S.tasks.find(t => t.id === c.task);
  const sst = scoreStory(c);
  return `<div class="text-[11px] text-ink3 tracking-wide">SMARTSCORE</div>
    <div class="mt-1 flex items-center gap-2 text-[14px]"><span class="text-ink3 line-through">${sst.orig}</span>${sst.delta ? `<span class="text-ink3">→</span>` : ''}<b class="text-ink text-[18px]">${c.score}</b>${sst.delta ? `<span class="text-[12px] ${sst.delta > 0 ? 'text-rose-300' : 'text-emerald-300'}">${sst.delta > 0 ? '+' : ''}${sst.delta} by Josh</span>` : ''}</div>
    <div class="mt-1 text-[12.5px] text-ink2 leading-snug max-w-[300px]">The detection scored it <b class="text-ink">${sst.orig}</b>. ${esc(sst.why)}</div>
    <div class="mt-2 text-[11px] text-ink3 tracking-wide">DECISIONS</div>
    ${tk ? `<div class="mt-1 flex items-center gap-2 text-[13px] text-ink"><span class="w-2 h-2 rounded-full bg-amber-500"></span>${esc(tk.title)}<span class="text-ink3">· waiting ${fmtMs(Date.now() - tk.created)}</span></div>`
      : c.verdict === 'Contained' ? `<div class="mt-1 text-[13px] text-ink flex items-center gap-2">${ic('check', 'w-3.5 h-3.5 c-cx')}Containment approved by Guy R.</div>` : `<div class="mt-1 text-[13px] text-ink3">No decision needed</div>`}`;
}
function verdictTip(c) { const inv = investigation(c), vd = verdictOf(c); return `<div class="flex items-center gap-2"><span class="text-[15px] font-bold" style="color:${inv.color}">${inv.label}</span>${confBars(c)}<span class="text-[12.5px] text-ink3">${vd === 'Running' ? 'confidence still building' : confLevel(c.conf) + ' confidence'}</span></div><div class="mt-1.5 text-[11px] text-ink3 tracking-wide">RATIONALE</div><div class="mt-0.5 text-[13px] text-ink2 leading-relaxed">${esc(inv.expl)}</div>${inv.shift ? `<div class="mt-1.5 text-[12px] text-ink3">${esc(inv.shift)}</div>` : ''}`; }

function openEnt(cid, kind, name) { S.entPanel = { cid, kind, name }; S.cvSig = null; openCaseDrawer(cid, true); }
function entPanelHTML(c) {
  const E = S.entPanel; if (!E || E.cid !== c.id) return '';
  const I = entInfo(c, E.kind, E.name), m = caseModel(c), B = blastModel(c);
  const acts = E.kind === 'host' ? ['Isolate the host', 'Collect forensic image', 'Run a full scan'] : E.kind === 'user' ? ['Reset credentials', 'Revoke sessions', 'Require MFA re-enrolment'] : E.kind === 'ip' ? ['Block at firewall and EDR', 'Add to watchlist'] : E.kind === 'asset' ? ['Check for signs of access', 'Tighten access path'] : ['Quarantine the file', 'Search the fleet for it'];
  const related = E.kind === 'host' ? m.issues.slice(0, 4).map(i => i.name) : E.kind === 'asset' ? B.paths.filter(p => p.steps.includes(E.name)).map(p => p.steps.join(' → ')) : getWorklog(c).filter(e => (e.result || e.detail || '').includes(E.name)).slice(0, 4).map(e => e.title);
  return `<div class="absolute top-0 right-0 bottom-0 z-[8] w-[min(400px,92%)] border-l border-indigo-400/30 overflow-y-auto drawer-in" style="background:linear-gradient(180deg, rgb(22 29 64 / .98), rgb(12 17 36 / .99));box-shadow:-30px 0 60px -30px rgb(0 0 0 / .7)">
    <div class="px-5 py-4 flex items-center gap-3 border-b border-indigo-400/20">
      <span class="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-ink">${ic(I.icon, 'w-4.5 h-4.5')}</span>
      <div class="min-w-0 flex-1"><div class="text-[16px] font-bold text-ink truncate">${esc(E.name)}</div><div class="text-[12px] text-ink3">${I.type} · risk ${I.risk.toLowerCase()}</div></div>
      <button onclick="S.entPanel=null;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="p-1.5 rounded-lg hover:bg-hov text-ink2">${ic('x', 'w-4 h-4')}</button></div>
    <div class="p-5 space-y-5">
      <div class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-[13px]">${I.facts.map(([k, v]) => `<span class="text-ink3">${k}</span><span class="text-ink">${esc(v)}</span>`).join('')}</div>
      ${related.length ? `<div><div class="text-[11px] font-bold tracking-[.14em] text-ink3 mb-2">RELATED IN THIS CASE</div><div class="space-y-1.5">${related.map(r => `<div class="text-[13px] text-ink2 rounded-lg bg-white/[.03] border border-indigo-400/10 px-3 py-2">${esc(r)}</div>`).join('')}</div></div>` : ''}
      <div><div class="text-[11px] font-bold tracking-[.14em] text-ink3 mb-2">ACTIONS</div><div class="flex flex-col gap-1.5">${acts.map(a => `<button onclick="toast('${esc(a)}: sent to the agents', 'check');pushLog('${c.id}','step','${esc(a)} · ${esc(E.name)}','Requested by Guy R.')" class="text-left px-3 py-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[13px] text-ink">${esc(a)}</button>`).join('')}</div></div>
      <button onclick="caseAsk('${c.id}', 'Tell me about ${esc(E.name)}')" class="w-full px-3 py-2 rounded-xl border border-line text-[13px] text-ink2 hover:text-ink inline-flex items-center justify-center gap-1.5">${ic('sparkles', 'w-3.5 h-3.5')}Ask about ${esc(E.name)}</button>
    </div></div>`;
}


/* hypotheses Josh frames for a case, and how each question tests them */
function caseHypotheses(c) {
  const inv = investigation(c), m = caseModel(c);
  const H = [
    { id: 'H1', t: 'It’s a real attack', col: '#f43f5e', why: `The activity matches a known attack pattern (${m.label.toLowerCase()}).` },
    { id: 'H2', t: 'It’s authorized activity', col: '#f59e0b', why: 'Someone allowed did this: a pen test, an admin task or an approved tool.' },
    { id: 'H3', t: 'It’s benign software behavior', col: '#22d3ee', why: 'Legitimate software behaving unusually, with no one behind it.' }
  ];
  const links = inv.Q.map((q, i) => {
    if (c.id === '555548' && AN_Q[i]) return AN_Q[i][2];
    if (q.open) return [];
    if (/approved|authori[sz]ed|test|change ticket|admin/i.test(q.q)) return q.tone === 'counter' ? [[1, 1], [0, -1]] : [[1, -1], [0, 1]];
    return q.tone === 'counter' ? [[0, -1], [2, 1]] : q.tone === 'neutral' ? [[0, 0]] : [[0, 1], [2, -1]];
  });
  const sc = [.2, .2, .2];
  links.forEach(L => L.forEach(([h, w]) => { sc[h] = Math.max(.03, sc[h] + (w > 0 ? .14 : w < 0 ? -.06 : 0)); }));
  const tot = sc.reduce((a, b) => a + b, 0);
  H.forEach((h, i) => { h.pct = Math.round(sc[i] / tot * 100); h.tests = links.map((L, qi) => L.some(([hh]) => hh === i) ? qi : -1).filter(x => x >= 0); });
  const top = H.slice().sort((a, b) => b.pct - a.pct);
  return { H, links, top };
}
function caseCheckpoints(c, HY) {
  const m = caseModel(c), iss = m.issues.slice().sort((a, b) => a.time - b.time), n = iss.length;
  const cuts = n <= 2 ? [[0, n]] : n <= 4 ? [[0, 1], [1, n]] : [[0, 1], [1, Math.ceil(n / 2)], [Math.ceil(n / 2), n]];
  const PBN = AN_PB.map(x => x[0]);
  const start = [36, 30, 34], fin = HY.H.map(h => h.pct);
  return cuts.map(([a, b], k) => {
    const f = cuts.length === 1 ? 1 : k / (cuts.length - 1);
    const pct = start.map((v, i) => Math.round(v + (fin[i] - v) * (k === cuts.length - 1 ? 1 : f * .75)));
    const top = pct.indexOf(Math.max(...pct));
    return { t: iss[a].time, add: b - a, total: b, pbs: iss.slice(a, b).map((_, j) => PBN[(a + j) % PBN.length]), pct, top, first: k === 0, last: k === cuts.length - 1 };
  });
}
function checkpointsHTML(c, HY) {
  const cps = caseCheckpoints(c, HY), inv = investigation(c);
  S.cpSel = S.cpSel || {}; S.cpOpen = S.cpOpen || {}; const sel = S.cpSel[c.id] ?? cps.length - 1, open = S.cpOpen[c.id];
  const go = k => `S.cpSel['${c.id}']=${k};S.cpOpen['${c.id}']=S.cpOpen['${c.id}']===${k}?null:${k};S.cvSig=null;openCaseDrawer('${c.id}',true)`;
  const cp = open != null ? cps[open] : null;
  return `<div class="mb-1"><div class="flex items-center gap-3 flex-wrap"><span class="text-[10.5px] font-black tracking-[.16em] text-ink3">CHECKPOINTS</span>
      <div class="relative flex items-center gap-1 flex-1 max-w-[560px]"><span class="absolute left-2 right-2 top-1/2 h-px bg-white/15"></span>
        ${cps.map((x, k) => `<button onclick="${go(k)}" class="relative z-[1] flex-1 flex justify-center"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${k === sel ? 'bg-indigo-500/20 border border-indigo-300/50' : 'bg-[rgb(var(--panel))] border border-white/10 hover:border-white/30'}"><span class="w-2 h-2 rounded-full ${x.last ? 'bg-teal-300' : k <= sel ? 'bg-indigo-300' : 'bg-white/30'}"></span><span class="text-[11px] font-mono ${k === sel ? 'text-ink' : 'text-ink3'}">${x.t.toTimeString().slice(0, 5)}</span></span></button>`).join('')}</div>
      ${sel < cps.length - 1 ? `<span class="text-[11.5px] text-amber-300">Viewing ${cps[sel].t.toTimeString().slice(0, 5)}</span><button onclick="S.cpSel['${c.id}']=${cps.length - 1};S.cpOpen['${c.id}']=null;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="text-[12px] c-ai font-semibold">Back to latest</button>` : '<span class="text-[11.5px] text-ink3">Latest</span>'}</div>
    ${cp ? `<div class="mt-2 rounded-2xl p-3.5 border border-indigo-400/35 bg-indigo-500/[.06] max-w-[620px] xp-in"><div class="flex items-center gap-2 text-[12px]">${agentAv(PILLARS.analyst, 20, false)}<span class="font-mono text-ink3">${cp.t.toTimeString().slice(0, 5)}</span><span class="text-ink font-semibold">${cp.first ? 'Case created' : `+${cp.add} issue${cp.add > 1 ? 's' : ''} grouped`}</span><span class="ml-auto text-ink3">${cp.total} issues total</span></div>
      <div class="mt-2 flex gap-1 flex-wrap">${cp.pbs.map(p0 => `<span class="px-1.5 py-px rounded border border-white/10 bg-white/[.04] text-[10.5px] text-ink3">${p0}</span>`).join('')}</div>
      <div class="mt-2 grid grid-cols-3 gap-3">${HY.H.map((h, i) => `<div class="text-[11px]"><div class="flex justify-between"><span class="font-bold" style="color:${h.col}">${h.id}</span><span class="text-ink3">${cp.pct[i]}%</span></div><div class="mt-1 rounded-full overflow-hidden" style="height:5px;background:rgb(255 255 255 / .08)"><div style="height:5px;width:${cp.pct[i]}%;background:${h.col}"></div></div></div>`).join('')}</div>
      <div class="mt-2 text-[12px] ${cp.last ? 'c-cx' : 'text-ink2'}">${cp.last ? `Verdict: ${inv.label}` : `${HY.H[cp.top].id} leads · ${cp.first ? 'first read' : 're-evaluated'}`}</div></div>` : ''}</div>`;
}
function investigationFlowHTML(c) {
  const m = caseModel(c), inv = investigation(c), tk = S.tasks.find(t => t.id === c.task), st = (S.plan || {})[c.id] || {};
  const wl = getWorklog(c).filter(e => e.by === 'agent');
  const run = verdictOf(c) === 'Running';
  const HY = caseHypotheses(c);
  const chipsFor = i => (HY.links[i] || []).filter(([, w]) => w).map(([h, w]) => [HY.H[h].id, w]);
  const phases = [
    ['TRIAGE', [
      { title: 'Case created', sub: `#${c.id} · ${fmtDate(new Date(c.opened || c.updated))}`, state: 'done', body: `Cortex created case #${c.id} from a ${m.label.toLowerCase()} issue on ${c.host}. SmartScore ${c.score}. Josh picked the case up as soon as it was created.` },
      { title: 'Playbooks ran', sub: `${m.issues.length} runs · enrichment, no reasoning`, state: 'done', body: `Each issue triggered its playbook (endpoint and identity enrichment, IP reputation, URL detonation). They added context to each issue, but none of them looked across the case.` },
      { title: 'Issues grouped', sub: `${m.issues.length} issues · ${m.hosts.length} hosts · ${m.users.length} users`, state: 'done', body: `Josh loaded what Cortex knows about ${c.host} and ${c.user}, and grouped ${m.issues.length} related issues into the case because they share the same host or user.`, list: m.issues.slice(0, 5).map(i => `${i.name} · ${i.host}`) }
    ]],
    ['FRAME', HY.H.map(h => ({ title: `${h.id} · ${h.t}`, sub: run ? 'Being tested' : `${h.pct}%${h === HY.top[0] ? ' · top hypothesis' : ''}`, state: 'done', bar: run ? null : [h.pct, h.col], body: `Before asking anything, Josh writes down what could explain the case. ${h.why}`, listLabel: 'TESTED BY', list: h.tests.map(qi => inv.Q[qi].q) }))],
    ['INVESTIGATE', inv.Q.map((q, i) => ({ title: q.q, chips: q.open ? null : chipsFor(i), sub: q.open ? 'Still checking' : `Answer: ${q.ans}`, state: q.open ? (run ? 'running' : 'queued') : 'done', tone: q.tone,
      body: q.text, list: (q.ev || []).map(e => `${e.label}${e.detail ? ' · ' + e.detail : ''}`), query: ((q.ev || []).find(e => e.query) || {}).query })) ],
    ['DECIDE', [{ title: run ? 'Verdict' : `Verdict · ${inv.label}`, sub: run ? 'Building' : `Top hypothesis ${HY.top[0].id} · ${HY.top[0].pct}% vs ${HY.top[1].pct}%${verdictHistory(c).length > 1 ? ` · changed ${verdictHistory(c).length - 1}×` : ''}`, state: run ? 'queued' : 'done', body: inv.expl, extra: inv.shift, hist: true }]],
    ['RESPOND', (tk ? [{ title: tk.title, sub: 'Waiting for your approval', state: 'wait', body: apvData(tk).statement, approve: true }] : (c.verdict === 'Contained' ? [{ title: 'Containment approved', sub: 'Completed', state: 'done', body: 'You approved the containment; the playbook ran successfully.' }] : []))
      .concat(planModel(c).map(x => ({ title: x.t, sub: st[x.id] === 'done' ? 'Done' : st[x.id] === 'running' ? `${PILLARS[x.who].name} working` : `Suggested · ${PILLARS[x.who].name}`, state: st[x.id] === 'done' ? 'done' : st[x.id] === 'running' ? 'running' : 'queued', body: x.why, sid: x.id, who: x.who })))
      .concat([{ title: 'Case closure', sub: 'Report and status updated', state: lifecycle(c) === 'resolved' ? 'done' : 'queued', body: 'Josh writes the case report, updates the status and hands the timeline to the record.' }])]
  ];
  { const cps = caseCheckpoints(c, HY); S.cpSel = S.cpSel || {}; const kSel = Math.min(S.cpSel[c.id] ?? cps.length - 1, cps.length - 1);
    if (kSel < cps.length - 1) {
      const cp = cps[kSel], T = phases[0][1], F = phases[1][1], Qs = phases[2][1];
      if (T[1]) T[1].sub = `${cp.total} run${cp.total > 1 ? 's' : ''} so far · ${cp.pbs.join(', ')}`;
      if (T[2]) T[2].sub = `${cp.total} issue${cp.total > 1 ? 's' : ''} so far`;
      F.forEach((h, i) => { h.sub = `${cp.pct[i]}%${i === cp.top ? ' · leading' : ''}`; h.bar = [cp.pct[i], HY.H[i].col]; });
      const nAns = Math.max(1, Math.round(Qs.length * (kSel + 1) / cps.length));
      Qs.forEach((q, i) => { if (i >= nAns) { q.state = 'queued'; q.sub = 'Not asked yet'; q.chips = null; } });
      phases[3][1] = [{ ...phases[3][1][0], title: 'Verdict', sub: `Not final · ${HY.H[cp.top].id} leads at ${cp.pct[cp.top]}%`, state: 'running' }];
      phases[4][1] = [{ title: 'No actions yet', sub: 'Recommendations came after the verdict', state: 'queued', body: 'At this checkpoint Josh was still investigating. The recommended actions came once the verdict was reached.' }];
    }
  }
  S.flowSel = S.flowSel || {}; const sel = S.flowSel[c.id];
  const badge = st0 => st0 === 'done' ? ['bg-cx/15 c-cx', 'check', 'COMPLETED', 'c-cx'] : st0 === 'running' ? ['bg-blue-500/15 c-blue', 'loader-circle', 'RUNNING', 'c-blue'] : st0 === 'wait' ? ['bg-amber-500/15 c-amber', 'hand', 'NEEDS YOU', 'c-amber'] : ['bg-white/5 text-ink3', 'clock', 'QUEUED', 'text-ink3'];
  let n = 0;
  const card = (s0, key) => {
    const [bc, bi, bl, tc] = badge(s0.state), on = sel === key, num = String(++n).padStart(2, '0');
    const toggle = `S.flowSel['${c.id}']=S.flowSel['${c.id}']==='${key}'?null:'${key}';S.cvSig=null;openCaseDrawer('${c.id}',true)`;
    const shell = `rounded-2xl border transition ${s0.state === 'done' ? 'border-cx/30' : s0.state === 'wait' ? 'border-amber-500/40' : s0.state === 'running' ? 'border-blue-500/40' : 'border-white/[.08]'}`;
    const bg = s0.state === 'queued' ? 'background:rgb(255 255 255 / .025)' : 'background:linear-gradient(180deg, rgb(255 255 255 / .06), rgb(255 255 255 / .025))';
    if (!on) return `<button onclick="${toggle}" class="flow-card ${shell} text-left p-3.5 flex flex-col justify-start hover:border-indigo-300/50 ${s0.state === 'queued' ? 'opacity-75 hover:opacity-100' : ''}" style="${bg}">
      <div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md ${bc}">${ic(bi, `w-3.5 h-3.5 ${s0.state === 'running' ? 'conf-spin' : ''}`)}</span><span class="text-[11px] font-mono text-ink3">${num}</span><span class="ml-auto text-ink3">${ic('maximize-2', 'w-3 h-3')}</span></div>
      <div class="fc-t mt-2 text-[13.5px] font-bold text-ink leading-snug">${esc(s0.title)}</div>
      <div class="fc-s mt-1 text-[12px] text-ink3 leading-snug">${esc(s0.sub)}</div>
      ${s0.chips && s0.chips.length ? `<div class="mt-1.5 flex gap-1 flex-wrap">${s0.chips.map(([h, w]) => `<span class="px-1.5 py-px rounded text-[10.5px] font-bold ${w > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}">${w > 0 ? '+' : '−'}${h}</span>`).join('')}</div>` : ''}
      ${s0.bar ? `<div class="mt-2 rounded-full overflow-hidden" style="height:6px;width:100%;background:rgb(255 255 255 / .1)"><div class="rounded-full" style="height:6px;width:${s0.bar[0]}%;background:${s0.bar[1]}"></div></div>` : ''}</button>`;
    return `<div class="flow-card flow-open xp-in ${shell} p-5" style="${bg};flex-basis:100%">
      <div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md ${bc}">${ic(bi, 'w-3.5 h-3.5')}</span><span class="text-[11px] font-black tracking-[.14em] ${tc}">${bl}</span><span class="text-[11px] font-mono text-ink3">· step ${num}</span>${s0.who ? pillarBadge(s0.who) : ''}
        <button onclick="${toggle}" class="ml-auto p-1 rounded hover:bg-hov text-ink3" title="Collapse">${ic('minimize-2', 'w-4 h-4')}</button></div>
      <div class="text-[17px] font-bold text-ink mt-2 leading-snug">${esc(s0.title)}</div>
      <div class="text-[13px] text-ink3 mt-0.5">${esc(s0.sub)}</div>
      ${s0.body ? `<p class="text-[14px] text-ink2 leading-relaxed mt-3">${richText(c, s0.body)}</p>` : ''}
      ${s0.extra ? `<p class="text-[12.5px] text-ink3 mt-1.5">${esc(s0.extra)}</p>` : ''}
      ${s0.hist ? verdictHistoryHTML(c) : ''}
      ${s0.list && s0.list.length ? `<div class="mt-3 text-[11px] font-bold tracking-[.14em] text-ink3">${s0.listLabel || (s0.query !== undefined ? 'EVIDENCE' : 'GROUPED ISSUES')}</div><ul class="mt-1.5 space-y-1">${s0.list.map(x => `<li class="flex gap-2 text-[13px] text-ink2"><span class="c-cx mt-[3px]">${ic('check', 'w-3 h-3')}</span>${richText(c, x)}</li>`).join('')}</ul>` : ''}
      ${s0.query ? `<div class="mt-3 text-[11px] font-bold tracking-[.14em] text-ink3">QUERY</div><pre class="mt-1 px-3 py-2 rounded-lg bg-code text-[12px] font-mono text-ink2 whitespace-pre-wrap break-all">${esc(s0.query)}</pre>` : ''}
      ${s0.sid && s0.state === 'queued' ? `<button onclick="runSuggestion('${c.id}','${s0.sid}')" class="mt-4 hm-pill pri">Ask ${PILLARS[s0.who].name} to do it</button>` : ''}
      ${s0.approve ? `<div class="mt-4 flex gap-2"><button onclick="caseDecide('${c.id}','approve')" class="hm-pill pri">Approve</button><button onclick="caseDecide('${c.id}','decline')" class="hm-pill">Decline</button></div>` : ''}
    </div>`;
  };
  const arrow = `<span class="flow-arrow self-center text-ink3/70">${ic('chevron-right', 'w-4 h-4')}</span>`;
  const full = S.flowFull === c.id;
  return `<div class="relative rounded-2xl border border-line p-4 sm:p-5 space-y-4" style="padding-top:58px;background:radial-gradient(700px 300px at 50% 40%, rgb(99 102 241 / .12), transparent 70%), rgb(var(--panel) / .6)">
    ${checkpointsHTML(c, HY)}
    <button onclick="S.flowFull=${full ? 'null' : `'${c.id}'`};S.cvSig=null;openCaseDrawer('${c.id}',true)" style="position:absolute;top:12px;right:12px;z-index:2" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-400/30 bg-panel/80 text-[12.5px] text-ink2 hover:text-ink" title="${full ? 'Back to the case' : 'Open full screen'}">${ic(full ? 'minimize-2' : 'maximize-2', 'w-3.5 h-3.5')}${full ? 'Collapse' : 'Full screen'}</button>
    ${phases.map(([label, steps], pi) => `<div class="flex flex-col md:flex-row gap-2 md:gap-4">
        <div class="md:w-[96px] shrink-0 pt-1"><div class="text-[11px] font-black tracking-[.16em] ${steps.every(x => x.state === 'done') ? 'c-cx' : steps.some(x => x.state === 'wait' || x.state === 'running') ? 'text-ink' : 'text-ink3'}">${label}</div>
          <div class="hidden md:block mt-2 w-px h-[calc(100%-24px)] ml-1 ${pi < phases.length - 1 ? 'bg-gradient-to-b from-cx/50 to-transparent' : ''}"></div></div>
        <div class="flex-1 min-w-0 flow-row">${steps.map((s0, si) => card(s0, label + si).replace('class="flow-card ', `class="flow-card ${si < steps.length - 1 ? 'fc-next ' : ''}`)).join('')}</div>
      </div>`).join('')}
  </div>`;
}

const PLAYBOOK_STEPS = ['Isolate the endpoint through the EDR agent', 'Kill the malicious process tree', 'Block the command-and-control address at the firewall', 'Collect a forensic triage package', 'Notify the asset owner'];
function actionReasonRich(c, tk) {
  const A = apvData(tk), B = c ? blastModel(c) : null, H = (t) => `<div class="text-[11px] font-bold tracking-[.14em] text-ink3 mt-4 mb-1.5">${t}</div>`;
  const prec = c ? (hashStr(c.id) % 6) + 19 : 0;
  return `<p class="text-ink2 leading-relaxed">${c ? richText(c, A.statement) : esc(A.statement)}</p>
    ${H(`EVIDENCE · ${A.signals.length} SIGNALS`)}<div class="space-y-1.5">${A.signals.map(x => `<div class="flex gap-2"><span class="mt-0.5 w-4 h-4 rounded-full border border-cx/50 bg-cx/10 c-cx flex items-center justify-center shrink-0">${ic('check', 'w-2.5 h-2.5')}</span><span><b class="text-ink">${esc(x.t)}.</b> ${esc(x.d)}</span></div>`).join('')}</div>
    ${c ? `<div class="mt-4">${impactHTML(c, tk)}</div>` : ''}
    ${B ? `${H('WHAT IT CHANGES')}<div class="grid grid-cols-3 gap-2">${[[B.ring1.length + ' → 0', 'assets reachable'], [B.ring2.length + ' → 0', 'crown jewels at risk'], ['Cut', 'C2 channel to ' + caseModel(c).ext]].map(([v, l]) => `<div class="rounded-xl px-3 py-2 bg-white/[.03] border border-indigo-400/15"><div class="text-[15px] font-black text-ink">${v}</div><div class="text-[11.5px] text-ink3">${esc(l)}</div></div>`).join('')}</div>` : ''}
    ${c ? `${H('WHAT THE PLAYBOOK DOES')}<ol class="space-y-1 list-decimal pl-5 text-ink2">${PLAYBOOK_STEPS.map(x => `<li>${x}</li>`).join('')}</ol>` : ''}
    ${H('RISK AND ROLLBACK')}<p class="text-ink2">${esc(tk.risk)}. ${c ? `${c.user} loses network access on ${c.host} until it is released. One click releases the host; nothing is deleted.` : 'The change is reversible in one step.'}</p>
    ${c ? `${H('PRECEDENT')}<p class="text-ink2">Analysts approved this action in <b class="text-ink">${prec} of ${prec + 1}</b> similar cases over the last 90 days. The one decline was an approved red-team exercise.</p>
    ${H('ALTERNATIVE I CONSIDERED')}<p class="text-ink2">Blocking only the C2 address keeps the host online, but the attacker’s process stays alive and could switch to a new address. Isolation stops both.</p>` : ''}`;
}
function suggestionReason(c, x) {
  const B = blastModel(c), m = caseModel(c);
  const eff = { block: `Stops all traffic to ${m.ext} from every Bank US host, not just ${c.host}.`, reset: `Invalidates any stolen session tokens for ${c.user}; they sign in again with MFA.`, hunt: 'Checks 4,812 endpoints for the same exploit, process and network pattern.', ring: `Looks for logins or file access from ${c.host} on ${B.ring1[0] ? B.ring1[0].n : 'the nearest asset'}.`, intel: 'Matches the address and tooling to known groups and their usual next steps.' }[x.id] || '';
  const risk = { block: 'Low. No business traffic to this address in the last 30 days.', reset: 'Low. The user is signed out once and signs back in with MFA.', hunt: 'None. Read-only search.', ring: 'None. Read-only check.', intel: 'None. Read-only lookup.' }[x.id] || 'Low.';
  const vis = {
    block: `<div class="mt-3 rounded-xl p-3 bg-black/25 border border-indigo-400/15 flex items-center gap-3 text-[12.5px]"><span class="px-2 py-1 rounded-md bg-white/5 text-ink">${esc(c.host)}</span><span class="flex-1 h-px" style="background:repeating-linear-gradient(90deg,#f43f5e 0 6px,transparent 6px 10px)"></span><span class="px-2 py-1 rounded-md bg-rose-500/15 text-rose-200">24 beacons / 18 min</span><span class="flex-1 h-px" style="background:repeating-linear-gradient(90deg,#f43f5e 0 6px,transparent 6px 10px)"></span><span class="px-2 py-1 rounded-md bg-white/5 text-ink font-mono">${esc(m.ext)}</span><span class="text-rose-300 font-bold">✕</span></div>`,
    reset: `<div class="mt-3 rounded-xl p-3 bg-black/25 border border-indigo-400/15 text-[12.5px] space-y-1">${[['Outlook · SOC-Tech', 'active'], ['Teams · iPhone', 'active'], ['VPN · SOC-Tech', 'active']].map(([a, b]) => `<div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span class="text-ink">${a}</span><span class="ml-auto text-ink3">${b} → signed out</span></div>`).join('')}</div>`,
    hunt: `<div class="mt-3 rounded-xl p-3 bg-black/25 border border-indigo-400/15 text-[12.5px]"><div class="flex justify-between text-ink3"><span>Endpoints in scope</span><span class="text-ink">4,812</span></div><div class="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full" style="width:100%;background:linear-gradient(90deg,#fb923c,#fbbf24)"></div></div><div class="mt-1.5 text-ink3">Pattern: Edge → rundll32.exe → outbound TLS every ~45s</div></div>`,
    ring: B.ring1[0] ? `<div class="mt-3 rounded-xl p-3 bg-black/25 border border-indigo-400/15 flex items-center gap-2 text-[12.5px]"><span class="px-2 py-1 rounded-md bg-rose-500/15 text-rose-200">${esc(c.host)}</span><span class="text-ink3">${esc(B.ring1[0].via)}</span><span class="text-ink3">→</span><span class="px-2 py-1 rounded-md bg-white/5 text-ink">${esc(B.ring1[0].n)}</span><span class="ml-auto text-ink3">${esc(B.ring1[0].k)}</span></div>` : '',
    intel: `<div class="mt-3 rounded-xl p-3 bg-black/25 border border-indigo-400/15 text-[12.5px] space-y-1">${[['Cobalt Strike team server', '3 feeds'], ['Same TLS fingerprint', '2 campaigns'], ['Hosting provider', 'seen in FIN7 activity']].map(([a, b]) => `<div class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span class="text-ink">${a}</span><span class="ml-auto text-ink3">${b}</span></div>`).join('')}</div>`
  }[x.id] || '';
  return `<p class="text-ink2 leading-relaxed">${esc(x.why)}</p>${vis}
    <div class="grid sm:grid-cols-2 gap-2 mt-3">${[['Expected effect', eff], ['Risk', risk]].map(([k, v]) => `<div class="rounded-xl px-3 py-2 bg-white/[.03] border border-indigo-400/15"><div class="text-[11px] font-bold tracking-[.12em] text-ink3">${k.toUpperCase()}</div><div class="text-[12.5px] text-ink mt-0.5 leading-snug">${esc(v)}</div></div>`).join('')}</div>`;
}
