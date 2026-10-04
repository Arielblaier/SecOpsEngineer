/* ======================================================================
   CASES TABLE (existing product table + AI investigation metadata)
   ====================================================================== */
function aiJustification(c) {
  const H = HERO[c.id], t = T[c.threat], vd = verdictOf(c);
  if (H && vd !== 'Running') return H.why;
  if (vd === 'Running') { const inv = investigation(c); return `Investigation in progress, ${inv.answered} of ${inv.Q.length} questions answered so far.`; }
  if (c.verdict === 'Contained') return `Contained after your approval. ${t.sm}`;
  if (c.verdict === 'Closed') return 'Closed by an analyst after review.';
  if (vd === 'Malicious') return t.sm;
  if (vd === 'Benign') return t.sb;
  return `Real and unusual, but may be legitimate automation on ${c.host}, needs your input.`;
}
const CT_COLS = [
  ['id', 'Case ID', 'w-[90px]'], ['name', 'Case name', 'min-w-[260px]'], ['severity', 'Severity', 'w-[96px]'], ['status', 'Status', 'w-[112px]'],
  ['assignee', 'Assignee', 'w-[150px]'], ['issues', 'Issues', 'w-[70px] text-right'], ['hosts', 'Hosts', 'w-[64px] text-right'], ['created', 'Created', 'w-[130px]'],
  ['aiv', 'AI verdict', 'w-[130px]', 1], ['aic', 'Confidence', 'w-[118px]', 1], ['aij', 'Rationale', 'min-w-[320px]', 1]
];
const CT_ST = { pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved' };
function ctVal(c, k) {
  switch (k) {
    case 'id': return +c.id; case 'name': return c.name; case 'severity': return SEV_RANK[c.severity];
    case 'status': return { pending: 3, in_progress: 2, resolved: 1 }[lifecycle(c)]; case 'assignee': return c.assignee;
    case 'issues': return caseModel(c).issues.length; case 'hosts': return caseModel(c).hosts.length; case 'created': return c.opened || c.updated;
    case 'aiv': return VERD_RANK[c.verdict]; case 'aic': return c.conf || 0; case 'aij': return aiJustification(c);
  }
}
const ordDate = d => { const n = d.getDate(), sfx = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'; return `${d.toLocaleDateString('en-US', { month: 'short' })} ${n}${sfx} ${d.getFullYear()}`; };

const SLA_TARGET = { Critical: 60, High: 240, Medium: 1440, Low: 4320 };   // minutes
function slaCell(c) {
  const tgt = SLA_TARGET[c.severity] * 60000, start = c.opened || c.updated, lc = lifecycle(c);
  const used = lc === 'resolved' ? (c.dur || (c.updated - start)) : Date.now() - start, frac = Math.min(1.2, used / tgt);
  const st = lc === 'resolved' ? (used <= tgt ? ['Met', '#00c389'] : ['Missed', '#f43f5e']) : used > tgt ? ['Breached', '#f43f5e'] : frac > .75 ? ['At risk', '#f59e0b'] : ['On track', '#60a5fa'];
  const left = tgt - used;
  const hm = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.max(1, m)}m`; };
  const sub = lc === 'resolved' ? `in ${hm(used)}` : left < 0 ? `${hm(-left)} over` : `${hm(left)} left`;
  const C = 2 * Math.PI * 6;
  return `<span class="inline-flex items-center gap-2 whitespace-nowrap" title="Target ${fmtDur(tgt)} for ${c.severity.toLowerCase()} cases"><svg viewBox="0 0 16 16" width="16" height="16" style="transform:rotate(-90deg)"><circle cx="8" cy="8" r="6" fill="none" stroke="rgb(var(--line2))" stroke-width="2.2"/><circle cx="8" cy="8" r="6" fill="none" stroke="${st[1]}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="${(Math.min(1, frac) * C).toFixed(1)} ${C.toFixed(1)}"/></svg>
    <span class="text-[13px] font-semibold" style="color:${st[1]}">${st[0]}</span><span class="text-[12px] text-ink3">${sub}</span></span>`;
}

/* product lifecycle status (New / In progress / Resolved) and response status (Pending / In progress / Error / Completed) */
function prodStatus(c) {
  if (lifecycle(c) === 'resolved') return 'Resolved';
  if (c.task || verdictOf(c) === 'Malicious') return 'In progress';
  if (verdictOf(c) === 'Running') return getWorklog(c).filter(e => e.by === 'agent').length < 2 ? 'New' : 'In progress';
  return 'New';
}
function respStatus(c) {
  if (c.task) return 'Pending';
  if (Object.values(((S.plan || {})[c.id]) || {}).includes('running')) return 'In progress';
  if (c.verdict === 'Contained') return 'Completed';
  if (verdictOf(c) === 'Malicious' && lifecycle(c) !== 'resolved') return hashStr(c.id) % 3 === 0 ? 'Error' : 'In progress';
  return '';
}
const RESP_STYLE = { Pending: ['bg-amber-500/15 c-amber', 'clock', 'Waiting for your approval'], 'In progress': ['bg-blue-500/15 c-blue', 'loader-circle', 'Response playbook is running'], Error: ['bg-rose-500/15 c-rose', 'triangle-alert', 'Playbook failed: the EDR agent did not respond. Josh will retry in 5 minutes.'], Completed: ['bg-cx/15 c-cx', 'circle-check', 'Response finished'] };
function respCell(c) {
  const r = respStatus(c); if (!r) return '<span class="text-ink3">—</span>';
  const [cls, icn, tip] = RESP_STYLE[r];
  return `<span ${tipAttr(`<div class="text-[13px] text-ink">${r}</div><div class="text-[12px] text-ink3">${tip}</div>`)} class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${cls} text-[13px] font-semibold whitespace-nowrap cursor-help">${ic(icn, 'w-3.5 h-3.5')}${r}</span>`;
}
function prodStatusIcon(st) { return statusIcon(st === 'New' ? 'pending' : st === 'In progress' ? 'in_progress' : 'resolved'); }

function vdPillG(c, small) { const vd = verdictOf(c), sz = small ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]';
  if (vd === 'Running') return `<span class="inline-flex items-center gap-1.5 ${sz} rounded-md border border-line2 text-ink3"><span class="conf-spin inline-flex">${ic('loader-circle', 'w-3 h-3')}</span>Assessing</span>`;
  const st = vd === 'Malicious' ? 'background:rgb(136 19 55 / .55);border-color:rgb(244 63 94 / .6);color:#ffe4e6' : vd === 'Inconclusive' ? 'background:rgb(120 53 15 / .45);border-color:rgb(245 158 11 / .6);color:#fef3c7' : 'background:rgb(6 78 59 / .5);border-color:rgb(16 185 129 / .55);color:#d1fae5';
  return `<span class="inline-flex items-center ${sz} rounded-md border font-semibold" style="${st}">${vd}</span>`; }
function vdTipG(c) { const inv = investigation(c), vd = verdictOf(c); return `<div class="flex items-center justify-between gap-6"><span class="text-[13px] text-ink3">Rationale</span><span class="text-[13px] c-ai">Confidence: ${vd === 'Running' ? 'Building' : confLevel(c.conf)}</span></div><div class="mt-1.5 text-[13.5px] text-ink leading-relaxed">${esc(inv.expl)}</div><div class="mt-2 pt-2 border-t border-line text-[12px] text-ink3">${(inv.top || []).slice(0, 2).map(t => `<div class="mt-0.5"><span class="text-ink2">${esc(t.q.replace(/\?$/, ''))}:</span> <b class="text-ink">${esc(t.ans)}</b></div>`).join('')}${vd === 'Running' ? '<div class="mt-1">Josh is still investigating; this may change.</div>' : `<div class="mt-1">Based on ${inv.answered} questions and ${Math.max(getWorklog(c).filter(e => e.type === 'evidence').length, inv.answered * 2)} pieces of evidence.</div>`}</div>`; }
function scoreBadgeG(c) { const sc = c.score, st = sc >= 90 ? 'background:rgb(136 19 55 / .55);border-color:rgb(244 63 94 / .55);color:#ffe4e6' : sc >= 70 ? 'background:rgb(124 45 18 / .5);border-color:rgb(249 115 22 / .5);color:#ffedd5' : 'background:rgb(30 58 138 / .45);border-color:rgb(96 165 250 / .45);color:#dbeafe';
  return `<span ${tipAttr(scoreTip(c))} class="inline-flex min-w-[32px] justify-center px-1.5 py-0.5 rounded-md border text-[12.5px] font-semibold cursor-help" style="${st}">${sc}</span>`; }
function respG(c) { const r = respStatus(c);
  if (r === 'Pending') return `<span class="inline-flex items-center gap-1.5 text-rose-400 font-semibold whitespace-nowrap"><span class="w-3.5 h-3.5 rounded-[4px] bg-rose-500 text-white flex items-center justify-center text-[10px] font-black">!</span>Pending Approval</span>`;
  if (r === 'In progress') return '<span class="text-ink3">Running</span>';
  if (r === 'Completed') return `<span class="inline-flex items-center gap-1.5 text-ink font-semibold">${ic('circle-check', 'w-3.5 h-3.5')}Success</span>`;
  if (r === 'Error') return `<span class="inline-flex items-center gap-1.5 text-rose-400 font-semibold">${ic('triangle-alert', 'w-3.5 h-3.5')}Error</span>`;
  return '<span class="text-ink3">—</span>'; }
function statusG(c) { const st = prodStatus(c); return `<span class="inline-flex items-center gap-1.5 text-ink font-semibold whitespace-nowrap">${st === 'In progress' ? ic('loader-circle', 'w-3.5 h-3.5') : prodStatusIcon(st)}${st === 'In progress' ? 'In Progress' : st}</span>`; }
function queueStatus(lc, task) {
  if (lc === 'pending') return `<span class="inline-flex items-center gap-1.5 text-amber-300 font-semibold whitespace-nowrap"><span class="w-3.5 h-3.5 rounded-[4px] bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">!</span>Pending</span>`;
  if (lc === 'in_progress') return `<span class="inline-flex items-center gap-1.5 text-ink font-semibold whitespace-nowrap">${ic('loader-circle', 'w-3.5 h-3.5 c-blue')}In progress</span>`;
  return `<span class="inline-flex items-center gap-1.5 text-ink2 font-semibold whitespace-nowrap">${ic('circle-check', 'w-3.5 h-3.5 c-cx')}Resolved</span>`;
}
function openTasks(c) { const inv = investigation(c), n = inv.Q.filter(q => q.open).length + (c.task ? 1 : 0); return lifecycle(c) === 'pending' ? Math.max(1, n) : n; }
function invProgress(c) {
  const inv = investigation(c), n = inv.answered, t = inv.Q.length, pct = Math.round(n / Math.max(1, t) * 100);
  return `<span class="inline-flex items-center gap-2 w-full"><span class="flex-1 h-1.5 rounded-full bg-sunk overflow-hidden max-w-[70px]"><span class="block h-full rounded-full" style="width:${pct}%;background:${pct === 100 ? '#00c389' : 'linear-gradient(90deg,#5eead4,#818cf8)'}"></span></span><span class="text-[12px] text-ink3 font-mono">${n}/${t}</span></span>`;
}
const PROD_DOMAIN = d => d === 'Posture' ? 'Posture' : 'Security';
const SEV_COL = { Critical: '#e11d48', High: '#f0506e', Medium: '#f5a623', Low: '#4a90e2' };
function sevIcon(sev, px = 16) { const col = SEV_COL[sev] || '#8b95a8'; const n = sev === 'Critical' || sev === 'High' ? 2 : 1;
  return `<svg viewBox="0 0 16 16" width="${px}" height="${px}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${n === 2 ? '<path d="M3 9l5-4 5 4"/><path d="M3 13l5-4 5 4"/>' : '<path d="M3 11l5-4 5 4"/>'}</svg>`; }
function statusIcon(lc) {
  if (lc === 'pending') return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 1.8l6.2 6.2L8 14.2 1.8 8z"/><path d="M8 5.2l2.8 2.8L8 10.8 5.2 8z" fill="currentColor" stroke="none"/></svg>`;
  if (lc === 'in_progress') return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-dasharray="2.6 2.2"><circle cx="8" cy="8" r="6.2"/></svg>`;
  return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#00c389" stroke-width="1.7"><circle cx="8" cy="8" r="6.2"/><path d="M5.2 8.2l1.9 1.9 3.8-3.8"/></svg>`;
}
function donutSVG(parts, total) {
  const R = 44, C = 2 * Math.PI * R, gap = 3; let off = 0;
  const arcs = parts.filter(p => p[1] > 0).map(([, v, col]) => { const len = Math.max(0, v / Math.max(1, total) * C - gap); const a = `<circle cx="55" cy="55" r="${R}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 55 55)"/>`; off += v / Math.max(1, total) * C; return a; }).join('');
  return `<svg viewBox="0 0 110 110" class="w-[108px] h-[108px] shrink-0">${arcs}<text x="55" y="63" text-anchor="middle" font-size="24" class="fill-ink" font-family="Lato, sans-serif">${total}</text></svg>`;
}
function renderCaseTable() {
  if (!$('ct-body')) return;
  S.ct = S.ct || { page: 0, sort: { key: 'aiv', dir: -1 }, q: '', st: 'all', v: 'all', cf: 'all', hideResolved: true, f: {} };
  if (S.ct.hideResolved === undefined) S.ct.hideResolved = true;
  S.ct.f = S.ct.f || {};
  const st = S.ct, F = st.f;
  const lcLabel = { pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved' };
  const asg = c => c.assignee === 'Agent (Autonomous)' ? 'Josh (AI)' : c.assignee === 'Unassigned' ? 'N/A' : c.assignee;
  // base set: last 7 days, optional "status != resolved"
  const base = S.cases.filter(c => !st.hideResolved || lifecycle(c) !== 'resolved');
  const q = st.q.toLowerCase().trim();
  let list = base.filter(c => (!F.domain || PROD_DOMAIN(c.domain) === F.domain) && (!F.severity || c.severity === F.severity) && (!F.assignee || asg(c) === F.assignee) && (!F.status || prodStatus(c) === F.status)
    && (st.v === 'all' || verdictOf(c) === st.v) && (st.cf === 'all' || confLevel(c.conf) === st.cf)
    && (!q || [c.id, c.name, c.host, c.assignee, verdictOf(c), aiJustification(c), c.summary].join(' ').toLowerCase().includes(q)));
  // donuts (product widgets) over the base set
  const count = (arr, fn) => { const m = {}; arr.forEach(c => { const k = fn(c); m[k] = (m[k] || 0) + 1; }); return m; };
  const W = [
    ['domain', 'Case Domain', count(base, c => PROD_DOMAIN(c.domain)), { Security: '#5eead4', Posture: '#a78bfa', Hunting: '#8b5cf6', Health: '#60a5fa' }],
    ['severity', 'Severity', count(base, c => c.severity), { High: '#f0506e', Medium: '#f5a623', Critical: '#e11d48', Low: '#4a90e2' }],
    ['assignee', 'Assignee', count(base, asg), { 'N/A': '#a78bfa', 'Josh (AI)': '#5eead4', 'Guy R.': '#8b5cf6', 'Sarah C.': '#60a5fa', 'SecOps Tier 2': '#f5a623' }],
    ['status', 'Status', count(base, c => prodStatus(c)), { New: '#a78bfa', 'In progress': '#5eead4', Resolved: '#00c389' }]
  ];
  $('ct-donuts').innerHTML = W.map(([k, title, m, cols], wi) => {
    const parts = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, v]) => [n, v, cols[n] || '#94a3b8']);
    return `<div class="flex flex-col gap-3 py-2 min-w-0 ${wi ? 'xl:border-l border-line xl:pl-6' : ''}">
      <div class="text-[15px] text-ink2 flex items-center gap-2">${title} ${ic('chevron-down', 'w-4 h-4 text-ink3')}</div>
      <div class="flex items-center gap-5">${donutSVG(parts, base.length)}
        <div class="space-y-2 min-w-0">${parts.map(([n, v, col]) => `<button onclick="S.ct.f.${k}=S.ct.f.${k}===${JSON.stringify(n).replace(/"/g, '&quot;')}?null:${JSON.stringify(n).replace(/"/g, '&quot;')};S.ct.page=0;renderCaseTable()" class="flex items-center gap-3 text-[15px] hover:opacity-80 ${F[k] && F[k] !== n ? 'opacity-40' : ''}">
          <span class="w-1 h-4 rounded-full" style="background:${col}"></span><span class="w-8 text-left text-ink font-semibold">${v}</span><span class="text-ink2 truncate">${esc(n)}</span></button>`).join('')}</div>
      </div></div>`;
  }).join('');
  // filter chips
  const today = new Date(), wk = new Date(Date.now() - 7 * 86400000), fd = d => ordDate(d);
  const chip = (label, val, clear) => `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-line2 bg-sunk text-[14px] text-ink2">${label} <b class="text-ink font-semibold">${val}</b>${clear ? `<button onclick="${clear};S.ct.page=0;renderCaseTable()" class="text-ink3 hover:text-ink">${ic('x', 'w-3.5 h-3.5')}</button>` : ''}</span>`;
  const chips = [chip('Last Updated =', `Last 7D (${fd(wk)} - ${fd(today)})`)];
  if (st.hideResolved) chips.push(chip('Status !=', 'Resolved', 'S.ct.hideResolved=false'));
  [['domain', 'Case Domain ='], ['severity', 'Severity ='], ['assignee', 'Assignee ='], ['status', 'Status =']].forEach(([k, l]) => { if (F[k]) chips.push(chip(l, esc(F[k]), `S.ct.f.${k}=null`)); });
  if (st.v !== 'all') chips.push(chip('AI Verdict =', st.v === 'Running' ? 'In progress' : st.v, "S.ct.v='all'"));
  if (st.cf !== 'all') chips.push(chip('AI Confidence =', st.cf, "S.ct.cf='all'"));
  const sel = (id, label, cur, opts) => `<label class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ai text-[13px] c-ai font-semibold">${ic('sparkles', 'w-3.5 h-3.5')}${label}
    <select onchange="S.ct.${id}=this.value;S.ct.page=0;renderCaseTable()" class="bg-transparent text-ink focus:outline-none">${opts.map(([v, t]) => `<option value="${v}" ${cur === v ? 'selected' : ''} style="background:#101624">${t}</option>`).join('')}</select></label>`;
  $('ct-filters').classList.toggle('hidden', !st.fbar); $('ct-search').classList.toggle('hidden', !st.sOpen && !st.q);
  $('ct-filters').innerHTML = chips.join('') + `<span class="text-[14px] text-ink2 mx-2">OR</span>`
    + (!st.hideResolved ? `<button onclick="S.ct.hideResolved=true;renderCaseTable()" class="text-[13px] text-ink3 hover:text-ink">+ Status != Resolved</button>` : '')
    + `<span class="ml-auto flex items-center gap-2">${sel('v', 'AI verdict', st.v, [['all', 'All'], ['Malicious', 'Malicious'], ['Inconclusive', 'Inconclusive'], ['Benign', 'Benign'], ['Running', 'In progress']])}</span>`;
  $('ct-fcount').textContent = chips.length + (st.v !== 'all' ? 0 : 0);
  // sorting + stable order until refreshed
  const val = (c, k) => ({ sla: (SLA_TARGET[c.severity] * 60000) - (Date.now() - (c.opened || c.updated)), updated: c.updated, severity: SEV_RANK[c.severity], score: c.score, name: c.name, status: { New: 3, 'In progress': 2, Resolved: 1 }[prodStatus(c)], resp: { Error: 4, Pending: 3, 'In progress': 2, Completed: 1, '': 0 }[respStatus(c)], assignee: asg(c), aiv: VERD_RANK[c.verdict] * 1000 + c.score, aic: c.conf || 0 })[k] ?? c.updated;
  const { key, dir } = st.sort;
  list = list.map(c => [c, val(c, key === 'created' ? 'updated' : key)]).sort((a, b) => (a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0) * dir).map(x => x[0]);
  const ckey = [st.v, st.cf, st.q, key, dir, st.hideResolved, JSON.stringify(F)].join('|');
  let fresh = 0;
  if (st.ids && st.ckey === ckey) {
    const have = new Set(st.ids), live = new Set(list.map(c => c.id));
    fresh = list.filter(c => !have.has(c.id)).length;
    list = st.ids.filter(id => live.has(id)).map(byId).filter(Boolean);
  } else { st.ids = list.map(c => c.id); st.ckey = ckey; }
  const per = 25, pages = Math.max(1, Math.ceil(list.length / per)); st.page = Math.min(st.page, pages - 1);
  const rows = list.slice(st.page * per, st.page * per + per);
  $('ct-results').innerHTML = `${list.length.toLocaleString()} results${fresh ? ` · <button onclick="S.ct.ids=null;renderCaseTable()" class="c-ai font-semibold hover:underline">${fresh} new</button>` : ''}`;
  st.cols = st.cols || {};
  const vdCls = vd => vd === 'Malicious' ? 'c-rose' : vd === 'Inconclusive' ? 'c-amber' : vd === 'Running' ? 'c-blue' : 'c-cx';
  const vdPill = c => { const vd = verdictOf(c);
    if (vd === 'Running') return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-line2 text-[13px] text-ink3"><span class="conf-spin inline-flex">${ic('loader-circle', 'w-3.5 h-3.5')}</span>Assessing</span>`;
    const st = vd === 'Malicious' ? 'background:rgb(136 19 55 / .55);border-color:rgb(244 63 94 / .6);color:#ffe4e6' : vd === 'Inconclusive' ? 'background:rgb(120 53 15 / .45);border-color:rgb(245 158 11 / .6);color:#fef3c7' : 'background:rgb(6 78 59 / .5);border-color:rgb(16 185 129 / .55);color:#d1fae5';
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-md border text-[13px]" style="${st}">${vd}</span>`; };
  const vdTip = c => { const inv = investigation(c), vd = verdictOf(c); return `<div class="flex items-center justify-between gap-6"><span class="text-[13px] text-ink3">Rationale</span><span class="text-[13px] c-ai">Confidence: ${vd === 'Running' ? 'Building' : confLevel(c.conf)}</span></div><div class="mt-1.5 text-[13.5px] text-ink leading-relaxed">${esc(inv.expl)}</div><div class="mt-2 pt-2 border-t border-line text-[12px] text-ink3">${(inv.top || []).slice(0, 2).map(t => `<div class="mt-0.5"><span class="text-ink2">${esc(t.q.replace(/\?$/, ''))}:</span> <b class="text-ink">${esc(t.ans)}</b></div>`).join('')}${vd === 'Running' ? '<div class="mt-1">Josh is still investigating; this may change.</div>' : `<div class="mt-1">Based on ${inv.answered} questions and ${Math.max(getWorklog(c).filter(e => e.type === 'evidence').length, inv.answered * 2)} pieces of evidence.</div>`}</div>`; };
  const scoreBadge = c => { const sc = c.score, st = sc >= 90 ? 'background:rgb(136 19 55 / .55);border-color:rgb(244 63 94 / .55);color:#ffe4e6' : sc >= 70 ? 'background:rgb(124 45 18 / .5);border-color:rgb(249 115 22 / .5);color:#ffedd5' : 'background:rgb(30 58 138 / .45);border-color:rgb(96 165 250 / .45);color:#dbeafe';
    return `<span ${tipAttr(scoreTip(c))} class="inline-flex min-w-[34px] justify-center px-1.5 py-0.5 rounded-md border text-[13px] cursor-help" style="${st}">${sc}</span>`; };
  const statusCell = c => { const st = prodStatus(c); return `<span class="inline-flex items-center gap-2 text-ink whitespace-nowrap">${st === 'In progress' ? ic('loader-circle', 'w-4 h-4') : prodStatusIcon(st)}${st === 'In progress' ? 'In Progress' : st}</span>`; };
  const respCellD = c => { const r = respStatus(c);
    if (r === 'Pending') return `<span class="text-amber-300 whitespace-nowrap">Pending</span>`;
    if (r === 'In progress') return '<span class="text-ink3">Running</span>';
    if (r === 'Completed') return `<span class="inline-flex items-center gap-2 text-ink">${ic('circle-check', 'w-4 h-4')}Success</span>`;
    if (r === 'Error') return `<span ${tipAttr('<div class="text-[13px] text-ink">Error</div><div class="text-[12px] text-ink3">Playbook failed: the EDR agent did not respond. Josh will retry in 5 minutes.</div>')} class="inline-flex items-center gap-2 text-rose-400 cursor-help">${ic('triangle-alert', 'w-4 h-4')}Error</span>`;
    return '<span class="text-ink3">—</span>'; };
  const asgCell = c => c.assignee === 'Agent (Autonomous)' ? `<span class="inline-flex items-center gap-2 c-ai whitespace-nowrap">${agentMark(18)}Josh</span>` : `<span class="text-ink whitespace-nowrap">${esc(asg(c))}</span>`;
  const slaTxt = c => { const tgt = SLA_TARGET[c.severity] * 60000, used = lifecycle(c) === 'resolved' ? (c.dur || 0) : Date.now() - (c.opened || c.updated), left = tgt - used, m = Math.round(Math.abs(left) / 60000), t = m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.max(1, m)}m`;
    return lifecycle(c) === 'resolved' ? `<span class="text-ink3">Met</span>` : left < 0 ? `<span class="text-rose-400" title="Breached">−${t}</span>` : `<span class="text-ink">${t}</span>`; };
  const ALL = [
    { k: 'aiv', l: 'Verdict', w: 'w-[150px]', ai: 1, cell: c => `<span ${tipAttr(vdTip(c))} class="cursor-help">${vdPill(c)}</span>` },
    { k: 'score', l: 'Score', w: 'w-[90px]', cell: c => scoreBadge(c) },
    { k: 'name', l: 'Case Name', w: 'w-full min-w-[360px]', cell: c => `<div class="text-ink leading-snug py-1">${esc(c.name)}</div>` },
    { opt: 'conf', k: 'aic', l: 'Confidence', w: 'w-[140px]', ai: 1, cell: c => `<span class="inline-flex items-center gap-2">${confBars(c)}<span class="text-ink2">${verdictOf(c) === 'Running' ? 'Building' : confLevel(c.conf)}</span></span>` },
    { opt: 'just', k: '', l: 'Rationale', w: 'min-w-[340px]', ai: 1, cell: c => `<div class="clamp2 text-ink2 text-[13px] leading-snug max-w-[420px]">${esc(investigation(c).expl)}</div>` },
    { k: 'status', l: 'Status', w: 'w-[160px]', cell: statusCell },
    { k: 'resp', l: 'Response Status', w: 'w-[200px]', cell: respCellD },
    { k: 'assignee', l: 'Assignee', w: 'w-[170px]', cell: asgCell },
    { k: 'sla', l: 'Resolution SLA', w: 'w-[150px]', cell: slaTxt },
    { opt: 'severity', k: 'severity', l: 'Severity', w: 'w-[120px]', cell: c => `<span class="inline-flex items-center gap-2 text-ink">${sevIcon(c.severity)}${c.severity}</span>` },
    { opt: 'domain', k: '', l: 'Case Domain', w: 'w-[130px]', cell: c => { const dom = PROD_DOMAIN(c.domain); return `<span class="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-md border border-line2 text-[13px] text-ink"><span class="w-1 h-3.5 rounded-full" style="background:${dom === 'Posture' ? '#a78bfa' : '#3b82f6'}"></span>${dom}</span>`; } },
    { k: 'updated', l: 'Last Updated', w: 'w-[220px]', cell: c => { const up = new Date(c.updated); return `<span class="text-ink whitespace-nowrap">${ordDate(up)} ${up.toTimeString().slice(0, 8)}</span>`; } }
  ];
  const COLS = ALL.filter(x => !x.opt || st.cols[x.opt]);
  $('ct-colmenu').innerHTML = `<div class="text-[11px] font-bold tracking-[.14em] text-ink3 px-1 mb-1.5">OPTIONAL COLUMNS</div>${ALL.filter(x => x.opt).map(x => `<label class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-hov cursor-pointer text-[13px] text-ink"><input type="checkbox" ${st.cols[x.opt] ? 'checked' : ''} onchange="S.ct.cols['${x.opt}']=this.checked;S._ctHtml=null;renderCaseTable()" class="accent-indigo-400">${x.ai ? ic('sparkles', 'w-3.5 h-3.5 c-ai') : ''}${x.l}</label>`).join('')}`;
  $('ct-head').innerHTML = `<tr class="text-[15px] text-ink2"><th class="w-12 px-4 py-4"><span class="inline-block w-[18px] h-[18px] rounded border-2 border-line2 align-middle"></span></th>${COLS.map(x => `<th ${x.k ? `onclick="S.ct.sort={key:'${x.k}',dir:S.ct.sort.key==='${x.k}'?-S.ct.sort.dir:-1};renderCaseTable()"` : ''} class="${x.w} relative px-4 py-4 font-normal text-left whitespace-nowrap ${x.k ? 'cursor-pointer hover:text-ink' : ''} ${x.ai ? 'c-ai' : ''}"><span class="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-px bg-line2"></span>
    <span class="inline-flex items-center gap-1.5">${x.ai ? ic('sparkles', 'w-3.5 h-3.5') : ''}${x.l}${(key === x.k || (x.k === 'updated' && key === 'created')) ? (dir > 0 ? ' ↑' : ' ↓') : ''}</span></th>`).join('')}</tr>`;
  const ctHtml = rows.map(c => `<tr onclick="openCaseDrawer('${c.id}')" class="cursor-pointer border-t border-line hover:bg-hov/50 h-[64px]">
      <td class="px-4"><span class="inline-block w-[18px] h-[18px] rounded border-2 border-line2 align-middle"></span></td>
      ${COLS.map(x => `<td class="px-4">${x.cell(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${COLS.length + 1}" class="py-16 text-center text-ink3">No cases match these filters.</td></tr>`;
  if (ctHtml !== S._ctHtml) {
    if (S._ptrDown) { clearTimeout(S._ctT); S._ctT = setTimeout(renderCaseTable, 250); }
    else { S._ctHtml = ctHtml; $('ct-body').innerHTML = ctHtml; }
  }
  $('ct-info').textContent = `Showing ${list.length ? st.page * per + 1 : 0}–${Math.min(list.length, st.page * per + per)} of ${list.length}`;
  $('ct-page').textContent = `${st.page + 1} / ${pages}`;
  icons();
}
