/* ======================================================================
   SECOPS · MISSIONS
   The queue of missions. A mission opens in the panel on the right, so the
   list stays in view while deciding. The activity log sits between the two
   as a thin strip that opens on demand.
   ====================================================================== */
const M_TABS = [['needs', 'Needs you'], ['running', 'Running'], ['waiting', 'Waiting'], ['done', 'Done'], ['all', 'All']];
/* Which filter a mission belongs to. A blocked mission needs a person, so it is under Needs you. */
const mTabOf = t => ({ blocked: 'needs' })[myState(t)] || myState(t);
const mDay = 86400000;
/* Where the mission's data comes from: the data source it is about, or the source behind the first rule it touches. */
function mSrcOf(t) {
  const W = M.W; if (!t || !t.affects) return '';
  const byId = id => { const s = W.sources.find(x => x.id === id); return s ? s.name : ''; };
  if (t.affects.source) return byId(t.affects.source);
  const rid = (t.affects.rules || [])[0] || t.affects.suggested, r = rid && mRule(rid), p = r && W.pipes.find(x => x.id === r.pipe);
  if (p) return byId(p.src) || p.product || '';
  if (t.affects.node) { const p2 = W.pipes.find(x => x.id === t.affects.node.pipe); return p2 ? byId(p2.src) || p2.product : ''; }
  return '';
}
/* Two separate things: where the run is, and what waits on a person. A finished run can still need a decision. */
const M_RUN = { running: ['Running', 'blue'], waiting: ['Waiting', 'indigo'], blocked: ['Blocked', 'rose'], finished: ['Finished', 'cx'], paused: ['Paused', 'slate'] };
function mRunOf(t) {
  if (t.paused) return 'paused';
  if (t.status === 'blocked') return 'blocked';
  if (t.status === 'progress') return t.handed ? 'waiting' : 'running';
  if (t.status === 'pending' && t.waitOn) return 'waiting';
  return 'finished';
}
function mRunCell(t) {
  const k = mRunOf(t), [l, tone] = M_RUN[k], dot = { blue: 'bg-blue-500 animate-pulse', indigo: 'bg-indigo-400', rose: 'bg-rose-500', cx: 'bg-cx', slate: 'bg-slate-400' }[tone];
  const sub = t.status === 'done' ? myEndTxt(t).toLowerCase() : k === 'waiting' ? (t.waitOn ? 'on ' + t.waitOn : 'on the ' + (t.teamFix || 'other team')) : k === 'running' && t.progressNote ? t.progressNote.toLowerCase() : '';
  return `<span class="leading-tight min-w-0"><span class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap ${tone === 'slate' ? 'text-ink3' : 'c-' + tone}"><span class="w-1.5 h-1.5 rounded-full shrink-0 ${dot}"></span>${l}</span>${sub ? `<span class="block text-[11px] text-ink3 whitespace-nowrap pl-3 truncate">${esc(sub)}</span>` : ''}</span>`;
}
/* How many decisions wait on a person. Nothing when nothing does. */
function mNeedN(t) {
  if (t.status === 'blocked') return 1;
  if (t.status !== 'pending' || t.waitOn) return 0;
  if (t.findings) return t.findings.filter(f => f.prop && !f.dec).length;
  return t.decision ? 1 : 0;
}
function mNeedCell(t) {
  const n = mNeedN(t);
  if (!n) return '<span class="text-ink4">—</span>';
  return `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md tn tn-amber text-[12px] font-bold whitespace-nowrap">${t.status === 'blocked' ? 'Decide again' : n + ' to review'}</span>`;
}
const M_IMP = { High: 0, Medium: 1, Low: 2 };
function mWorkList() {
  const W = M.W, order = { needs: 0, running: 1, waiting: 2, done: 3 }, q = M.q.trim().toLowerCase();
  const by = M.sort === 'new' ? (a, b) => b.opened - a.opened : M.sort === 'old' ? (a, b) => a.opened - b.opened
    : (a, b) => (M_IMP[a.impact] ?? 3) - (M_IMP[b.impact] ?? 3) || b.opened - a.opened;
  const list = W.tasks.filter(t => M.tab === 'all' || mTabOf(t) === M.tab)
    .filter(t => !M.fType || t.job === M.fType)
    .filter(t => !M.fSrc || mSrcOf(t) === M.fSrc)
    .filter(t => !q || [t.id, t.title, t.sug, MY_CARD[t.card], MY_LAYER[t.layer].name, M_AG[t.agent].name, t.waitOn || '', (MY_JOBS[t.job] || {}).name || '', mSrcOf(t)].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (mRunning(b) ? 1 : 0) - (mRunning(a) ? 1 : 0) || order[mTabOf(a)] - order[mTabOf(b)] || (M.sort === 'impact' && a.status === 'done' ? (b.closed || 0) - (a.closed || 0) : by(a, b)));
  /* A mission that waits on another sits right under it, so the pair reads as one story. */
  list.filter(t => t.waitOn).forEach(t => { const k = list.findIndex(x => x.id === t.waitOn); if (k < 0) return; list.splice(list.indexOf(t), 1); list.splice(list.findIndex(x => x.id === t.waitOn) + 1, 0, t); });
  return list;
}
/* ---------- widgets ---------- */
function mRing(pct, col, label, size = 62) {
  const r = 26, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="shrink-0"><circle cx="32" cy="32" r="${r}" fill="none" stroke="rgb(var(--line2))" stroke-width="7"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" transform="rotate(-90 32 32)" class="m-ring" data-anim="ring" data-prop="strokeDashoffset" data-to="${c * (1 - pct / 100)}" style="stroke-dashoffset:${c}"/><text x="32" y="37" text-anchor="middle" font-size="15" font-weight="800" fill="rgb(var(--ink))" font-family="JetBrains Mono, monospace">${label}</text></svg>`;
}
function mSpark(vals, col) {
  const w = 120, h = 38, mn = Math.min(...vals), mx = Math.max(...vals), sp = Math.max(1, mx - mn);
  const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 4 - (v - mn) / sp * (h - 10)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${w} ${h}" class="w-full h-[38px] overflow-visible" preserveAspectRatio="none"><defs><linearGradient id="m-sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><path d="${line} L${w},${h} L0,${h} Z" fill="url(#m-sp)"/><path d="${line}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${col}"/></svg>`;
}
/* Four widgets, chosen from what detection-engineering products show (SOC optimization value, broken and noisy rules,
   ATT&CK coverage, rule health) and from what this agent changes:
   1. Missions now: the work, and the threshold the agent is watching.
   2. Noise: issues closed with no action, its trend, and where the fixes landed.
   3. Value this month: issues removed, analyst time returned, detections restored.
   4. Detection health and coverage: rules that cannot fire or are noisy, and ATT&CK techniques covered by working rules. */
const M_VALUE_BASE = { removed: 640, restored: 3 };
const M_TRIAGE_MIN = 6;
function mCoverage(W) {
  const tech = r => (r.tech || '').split(' - ')[0], en = W.rules.filter(r => r.status === 'Enabled' && r.tech && !r.retired);
  const broken = r => { const rv = myRuleReview(W, r); return rv.task && rv.task.status !== 'done' && ['Fix', 'Connect'].includes(rv.sug); };
  const all = new Set(W.rules.filter(r => r.tech).map(tech)), ok = new Set(en.filter(r => !broken(r)).map(tech)), gaps = W.tasks.filter(t => t.card === 'gap' && t.status !== 'done').length;
  return { ok: ok.size, total: all.size + gaps, lost: [...all].filter(x => en.some(r => tech(r) === x) && !ok.has(x)).length, gaps };
}
function mWidgets() {
  const W = M.W, st = myStats(W), dt = myDetections(W), nz = myNoise(W), un = myUnused(W), cv = mCoverage(W);
  const running = W.tasks.filter(mRunning).length, runN = W.tasks.filter(t => mTabOf(t) === 'running').length, waitN = W.tasks.filter(t => mTabOf(t) === 'waiting').length, doneN = W.tasks.filter(t => mTabOf(t) === 'done').length, tot = Math.max(1, st.pending + runN + waitN + doneN);
  const pct = Math.round(nz.share * 100), was = Math.round(W.noiseHistory[0] * 100), dn = pct - was;
  const seg = (k, n, cls, lbl, tone) => `<button onclick="M.tab='${k}';mRender()" class="text-left min-w-0 rounded-lg px-2 py-1 -mx-2 hover:bg-hov ${M.tab === k ? 'bg-hov' : ''}"><div class="text-[22px] leading-7 font-black font-mono ${tone}">${n}</div><div class="text-[11.5px] text-ink3 flex items-center gap-1.5 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full ${cls}"></span>${lbl}</div></button>`;
  const card = (body, oc = '') => `<div class="m-wid rounded-2xl border border-line px-3 py-2.5 min-w-0 ${oc ? 'cursor-pointer hover:border-line2' : ''}" ${oc ? `onclick="${oc}"` : ''}>${body}</div>`;
  const head = (t, tip, right = '') => `<div class="flex items-center justify-between gap-2 text-[11.5px] text-ink3 mb-1.5"><span class="font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">${t} ${mInfo(tip)}</span>${right}</div>`;
  /* the threshold the agent is watching right now */
  const w = (M.watch || []).find(x => !x.done), watch = w ? `<div data-watch class="mt-2 flex items-center gap-2 text-[11.5px] text-ink3 min-w-0"><span class="shrink-0 inline-flex items-center gap-1">${ic('gauge', 'w-3.5 h-3.5 c-amber')}Watching</span><span class="truncate text-ink2">${esc(w.label)}</span><span class="ml-auto font-mono shrink-0 ${w.n >= w.max - 1 ? 'c-amber font-bold' : ''}">${w.n}/${w.max}</span><span class="w-14 h-1.5 rounded-full bg-sunk overflow-hidden shrink-0"><span class="block h-full bg-amber-500 m-bar" data-anim="watch" data-to="${w.n / w.max * 100}%"></span></span></div>` : `<div class="mt-2 text-[11.5px] text-ink4 truncate">No threshold close to firing</div>`;
  /* noise trend: 8 weeks, with a mark on the weeks a fix was applied */
  const series = W.noiseHistory.concat([nz.share]).map(x => x * 100), fixes = W.tasks.filter(t => t.status === 'done' && ['approved', 'edited'].includes(t.end) && t.verdict === 'Noisy').length;
  const removed = M_VALUE_BASE.removed + st.removed, hours = Math.round(removed * M_TRIAGE_MIN / 60);
  const restored = M_VALUE_BASE.restored + W.tasks.filter(t => t.status === 'done' && ['approved', 'edited', 'auto'].includes(t.end) && t.verdict === 'Broken').length;
  const decided = W.tasks.filter(t => t.status === 'done' && t.by && ['approved', 'edited', 'rejected'].includes(t.end)).length;
  const hb = (n, cls) => `<div class="h-full ${cls}" style="width:${n / Math.max(1, dt.enabled) * 100}%"></div>`;
  return `<div class="m-wwrap"><div class="m-wgrid">
    ${card(`${head('<span class="w-1.5 h-1.5 rounded-full bg-cx animate-pulse"></span>Missions now', 'Every run of a job is a mission, including a run that finds nothing. Needs you: a person has to decide. Waiting: on another mission or team. Watching: a threshold that starts a mission when it is reached, like 7 issues closed as benign in 7 days.', `<span class="font-mono ${running ? 'c-blue' : 'text-ink4'}">${running ? `${running} running now` : `${doneN} done`}</span>`)}
      <div class="grid grid-cols-4 gap-2">${seg('needs', st.pending, 'bg-amber-500', 'Needs you', 'c-amber')}${seg('running', runN, 'bg-blue-500', 'Running', 'c-blue')}${seg('waiting', waitN, 'bg-indigo-400', 'Waiting', 'c-indigo')}${seg('done', doneN, 'bg-cx', 'Done', 'c-cx')}</div>
      <div class="mt-2 h-2 rounded-full bg-sunk flex gap-[2px] overflow-hidden"><div class="m-bar h-full bg-amber-500" data-anim="b-pend" data-to="${st.pending / tot * 100}%"></div><div class="m-bar h-full bg-blue-500 seg-live" data-anim="b-prog" data-to="${runN / tot * 100}%"></div><div class="m-bar h-full bg-indigo-400" data-anim="b-wait" data-to="${waitN / tot * 100}%"></div><div class="m-bar h-full bg-cx" data-anim="b-done" data-to="${doneN / tot * 100}%"></div></div>${watch}`)}
    ${card(`${head('Noise', 'Issues in the last 7 days that ended with no action: resolved as false positive or benign by an analyst or the Investigation Agent, divided by all issues. A benign true positive counts as noise here: the detection is right, but nobody needs to act.', `<span class="font-mono ${dn < 0 ? 'c-cx' : dn > 0 ? 'c-amber' : 'text-ink4'}">${dn < 0 ? '▼ ' + Math.abs(dn) : dn > 0 ? '▲ ' + dn : '±0'} pts in 8 weeks</span>`)}
      <div class="flex items-end gap-3"><div class="shrink-0"><div class="text-[22px] leading-7 font-black font-mono ${pct >= 40 ? 'c-amber' : 'c-cx'}">${pct}%</div><div class="text-[11px] text-ink3">of issues</div></div><div class="flex-1 min-w-0">${mSpark(series, dn <= 0 ? '#00c389' : '#f59e0b')}</div></div>
      <div class="text-[11.5px] text-ink3 leading-snug mt-1 truncate">${nz.noise.toLocaleString()} of ${nz.total.toLocaleString()} · 5 rules make ${Math.round(nz.topShare * 100)}%${fixes ? ` · <span class="c-cx">${fixes} fix${fixes === 1 ? '' : 'es'} applied</span>` : ''}</div>`)}
    ${card(`${head('Value this month', `What the approved changes returned. Issues removed: per week, from the backtest of each change. Analyst time: ${M_TRIAGE_MIN} minutes of triage per issue. Detections restored: rules that could not fire and fire again.`)}
      <div class="grid grid-cols-3 gap-2"><div><div class="text-[22px] leading-7 font-black font-mono c-cx">${removed.toLocaleString()}</div><div class="text-[11px] text-ink3 leading-tight">issues a week removed</div></div><div><div class="text-[22px] leading-7 font-black font-mono text-ink">${hours}h</div><div class="text-[11px] text-ink3 leading-tight">analyst time a week</div></div><div><div class="text-[22px] leading-7 font-black font-mono text-ink">${restored}</div><div class="text-[11px] text-ink3 leading-tight">detections restored</div></div></div>
      <div class="text-[11.5px] text-ink3 leading-snug mt-1.5 truncate">${decided} decision${decided === 1 ? '' : 's'} by people · every change has a mission</div>`)}
    ${card(`${head('Detection health and coverage', 'Enabled correlation rules: working, noisy (fires mostly on nothing), or cannot fire (data stopped, a filter drops it, a field arrives empty). Coverage: ATT&CK techniques with at least one working rule, out of the techniques your rules map plus open coverage gaps.')}
      <div class="flex items-baseline gap-2"><span class="text-[22px] leading-7 font-black font-mono ${dt.blind ? 'c-rose' : 'c-cx'}">${dt.blind}</span><span class="text-[12px] text-ink3">cannot fire · <span class="c-amber">${dt.noisy} noisy</span> · ${dt.ok} working</span></div>
      <div class="mt-1.5 h-2 rounded-full bg-sunk flex gap-[2px] overflow-hidden">${hb(dt.ok, 'bg-cx')}${hb(dt.noisy, 'bg-amber-500')}${hb(dt.blind, 'bg-rose-500')}</div>
      <div class="text-[11.5px] text-ink3 leading-snug mt-1.5 truncate"><b class="text-ink2 font-mono">${cv.ok}</b> of ${cv.total} ATT&CK techniques covered${cv.lost ? ` · <span class="c-rose">${cv.lost} lost to broken data</span>` : ''} · ${st.instErr ? `<span class="c-rose">${st.instErr} instance stopped</span>` : 'all data arriving'} · ${un.n} sources unread</div>`, "M.onlyOpen=true;mNav('rules')")}
  </div></div>`;
}
/* ---------- the activity log: a thin strip between the list and the panel ---------- */
const M_LOGK = { sweep: ['Sweep', 'text-ink3', 'clock'], check: ['Check', 'c-cx', 'shield-check'], task: ['New mission', 'c-indigo', 'file-plus-2'], ready: ['Needs you', 'c-amber', 'bell-ring'], handoff: ['Handoff', 'c-blue', 'corner-down-right'], test: ['Test', 'c-indigo', 'flask-conical'], done: ['Done', 'c-cx', 'circle-check'], step: ['Working', 'c-blue', 'activity'] };
function mNowLine() { const W = M.W, run = W.tasks.find(mRunning); return run ? `${run.id}: ${run.steps[Math.min(run.shown || 1, run.steps.length) - 1]}` : `Watching ${W.rules.length} detections and ${W.sources.flatMap(s => s.instances).length} data instances`; }
function mLog() {
  const W = M.W, n = myPendingTasks(W).length, now = mNowLine();
  if (!M.logOpen) return `<div id="m-log" class="hidden lg:flex w-11 shrink-0 flex-col items-center border-l border-line bg-panel2 cursor-pointer hover:bg-hov/60" onclick="M.logOpen=true;mRender()" title="Open the activity log (L)">
      <span class="${mPanelOn() ? 'mt-3' : 'mt-12'} text-ink2">${ic('chevrons-right', 'w-4 h-4')}</span><span class="mt-3 w-2 h-2 rounded-full bg-cx animate-pulse"></span>
      ${n ? `<span class="mt-3 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold font-mono flex items-center justify-center">${n}</span>` : ''}
      <div class="m-vert mt-4 text-[12px] text-ink3 whitespace-nowrap"><span>${esc(now.length > 58 ? now.slice(0, 58) : now)}…</span><b class="text-ink ml-3">Activity log</b></div></div>`;
  const rows = W.log.slice(0, 40).map(l => { const kind = l.kind === 'task' && /needs you/.test(l.text) ? 'ready' : l.kind, k = M_LOGK[kind] || M_LOGK.sweep, id = (l.text.match(/MSN-\d+/) || [])[0], d = new Date(l.t);
    return `<div ${id ? `onclick="mOpenTask('${id}')"` : ''} class="px-4 py-3 border-b border-line ${id ? 'cursor-pointer hover:bg-hov' : ''}">
      <div class="flex items-center gap-2 text-[11.5px]"><span class="${k[1]} shrink-0">${ic(k[2], 'w-3.5 h-3.5')}</span><span class="font-semibold ${k[1]}">${k[0]}</span><span class="font-mono text-ink4">${d.toTimeString().slice(0, 8)}</span>${id ? `<span class="ml-auto font-mono text-ink4">${id}</span>` : ''}</div>
      <div class="mt-1 text-[13px] text-ink2 leading-snug">${esc(l.text.replace(/^MSN-\d+: /, ''))}</div></div>`; }).join('');
  return `<div id="m-log" class="hidden lg:flex w-[300px] 2xl:w-[340px] shrink-0 min-h-0 flex-col border-l border-line bg-panel2 overflow-hidden">
    <div class="pl-4 pr-12 h-12 flex items-center justify-between shrink-0 border-b border-line"><div class="flex items-center gap-2 text-[13.5px]"><span class="w-2 h-2 rounded-full bg-cx animate-pulse"></span><b class="text-ink">Activity log</b><span class="text-[11.5px] c-cx">Live</span></div><button onclick="M.logOpen=false;mRender()" class="p-1.5 rounded-lg hover:bg-hov text-ink2" title="Collapse (L)">${ic('chevrons-left', 'w-4 h-4')}</button></div>
    <div class="px-4 py-3 border-b border-line flex gap-3 shrink-0"><span class="w-7 h-7 rounded-lg tn tn-cx flex items-center justify-center shrink-0">${ic('activity', 'w-3.5 h-3.5')}</span><div class="min-w-0"><div class="text-[11.5px] text-ink3">Working on now</div><div class="text-[13px] text-ink leading-snug">${esc(now)}…</div></div></div>
    <div class="flex-1 overflow-y-auto">${rows}</div></div>`;
}
/* Filters the table review asked for: the kind of work, the data source, and the order. */
function mFilters() {
  const W = M.W, jobs = [...new Set(W.tasks.map(t => t.job))].filter(j => MY_JOBS[j]), srcs = [...new Set(W.tasks.map(mSrcOf).filter(Boolean))].sort();
  const sel = (id, val, opts, on) => `<select id="${id}" onchange="${on}" class="text-[12.5px] pl-2.5 pr-7 py-1.5 bg-sunk border ${val && id !== 'm-sort' ? 'border-cx/60 text-ink' : 'border-line text-ink2'} rounded-lg focus:outline-none focus:border-cx">${opts.map(([v, l]) => `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  return sel('m-ftype', M.fType, [['', 'All types']].concat(jobs.map(j => [j, MY_JOBS[j].name])), "M.fType=this.value;mRender()")
    + sel('m-fsrc', M.fSrc, [['', 'All sources']].concat(srcs.map(x => [x, x])), "M.fSrc=this.value;mRender()")
    + sel('m-sort', M.sort, [['impact', 'Sort: impact'], ['new', 'Sort: newest'], ['old', 'Sort: oldest']], "M.sort=this.value;mRender()");
}
function mWork() {
  const W = M.W, list = mWorkList();
  const count = k => k === 'all' ? W.tasks.length : W.tasks.filter(t => mTabOf(t) === k).length;
  const dot = { needs: 'bg-amber-500', running: 'bg-blue-500', waiting: 'bg-indigo-400', done: 'bg-cx' };
  const rows = list.map(t => { const sel = M.panelTask === t.id, run = mRunning(t), fresh = t.fresh && Date.now() - t.fresh < 4000;
    return `<div data-task="${t.id}" onclick="mOpenTask('${t.id}')" class="mcols m-row items-center px-4 h-[54px] text-[13.5px] cursor-pointer border-b border-line transition-colors ${fresh ? 'm-fresh' : ''} ${t.status === 'done' && !sel ? 'opacity-70 hover:opacity-100' : ''} ${sel ? 'm-sel' : mTabOf(t) === 'needs' ? 'hover:bg-amber-400/10' : 'hover:bg-hov'}">
      ${mRunCell(t)}<span>${mNeedCell(t)}</span><span>${run ? mAnalyzing() : mSug(t.sug, { solid: true })}</span>
      <span class="min-w-0"><span class="m-title block truncate text-ink ${sel ? 'font-semibold' : ''}" title="${esc(t.title)}">${esc(t.title)}</span><span class="block text-[11.5px] text-ink3 truncate"><span class="font-mono">${t.id}</span>${mNeedN(t) ? `<span class="m-c-need hidden c-amber font-semibold"> · ${t.status === 'blocked' ? 'decide again' : mNeedN(t) + ' to review'}</span>` : `<span class="m-c-need hidden"> · ${esc(M_RUN[mRunOf(t)][0].toLowerCase())}</span>`}<span class="m-c-job"> · ${esc(MY_JOBS[t.job].name)} · ${t.waitOn ? `<span class="c-indigo">waits on ${t.waitOn}</span>` : t.status === 'blocked' ? '<span class="c-rose">partly applied</span>' : t.status === 'progress' && t.progressNote ? `<span class="c-blue">${esc(t.progressNote)}</span>` : t.findings ? `${t.findings.length} findings` : t.nothing ? 'nothing found' : esc(MY_CARD[t.card])}</span></span></span>
      <span>${run ? '<span class="text-ink4">—</span>' : mConf(t.conf)}</span>
      <span>${mImpact(t.impact)}</span>
      <span class="text-[12.5px] text-ink2 truncate">${esc(mSrcOf(t)) || '<span class="text-ink4">—</span>'}</span>
      <span class="text-[12.5px] text-ink3">${myAge(Date.now() - t.opened)}</span>
      ${t.nothing ? '<span class="text-ink4">—</span>' : t.findings ? `<span class="text-[12.5px] text-ink2">${t.findings.length} findings</span>` : `<span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 min-w-0">${ic(MY_LAYER[t.layer].icon, 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${MY_LAYER[t.layer].name}</span></span>`}
</div>`; }).join('') || `<div class="p-12 text-[13.5px] text-ink3">${M.q ? 'No mission matches the search.' : M.tab === 'needs' ? 'Nothing needs you right now.' : 'Nothing here right now.'}</div>`;

  $('mv-work').innerHTML = `<div class="flex-1 min-w-0 min-h-0 flex">
    <div class="flex-1 min-w-0 min-h-0 flex flex-col bg-panel">
      <div class="px-5 pt-4 pb-3 shrink-0 space-y-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="min-w-0 flex items-center gap-2"><div><h1 class="text-[18px] font-bold text-ink leading-tight">Missions</h1><p class="m-wk-sub text-[12.5px] text-ink3">SecOps</p></div></div>
          <button data-act="rail-off" onclick="M.railOff=true;mRender()" class="m-wk-hide hidden w-8 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink items-center justify-center" title="Hide the missions">${ic('panel-left-close', 'w-4 h-4')}</button>
          <button onclick="mOpenPanel()" class="lg:hidden mr-10 p-2 rounded-lg bg-sunk text-ink2" title="SecOps">${ic('sparkles', 'w-4 h-4 c-cx')}</button>
        </div>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="m-wk-tabs flex items-center flex-wrap gap-1 text-[12.5px]">${M_TABS.map(([k, l]) => `<button data-tab="${k}" onclick="M.tab='${k}';mRender()" class="${k === 'all' ? 'm-all ' : ''}px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${M.tab === k ? 'bg-hov text-ink font-semibold' : 'text-ink3 hover:text-ink'}">${dot[k] ? `<span class="w-1.5 h-1.5 rounded-full ${dot[k]} ${k === 'running' && W.tasks.some(mRunning) ? 'animate-pulse' : ''}"></span>` : ''}${l}<span class="font-mono text-[11.5px] ${k === 'running' && W.tasks.some(mRunning) && M.tab !== k ? 'c-blue font-bold' : M.tab === k ? 'text-ink2' : 'text-ink4'}">${count(k)}</span></button>`).join('')}</div>
          <div class="m-wk-filters flex items-center gap-2 flex-wrap">${mFilters()}<div class="relative flex-1 min-w-[180px] max-w-[240px]"><span class="absolute left-2.5 top-[8px] text-ink4">${ic('search', 'w-3.5 h-3.5')}</span><input type="text" id="m-search" data-keep value="${esc(M.q)}" placeholder="Search missions, IDs" oninput="M.q=this.value;mRender()" class="w-full text-[12.5px] pl-8 pr-3 py-1.5 bg-sunk border border-line rounded-lg text-ink placeholder:text-ink4 focus:outline-none focus:border-cx"></div></div>
        </div>
        ${mWidgets()}
      </div>
      <div data-scroll class="flex-1 min-h-[160px] overflow-auto border-t border-line">
        <div class="m-table">
          <div class="mcols m-thead px-4 py-2 border-b border-line bg-panel2 text-[11.5px] font-semibold text-ink3 select-none sticky top-0 z-[2]"><span>Run state</span><span>Needs you</span><span class="whitespace-nowrap">${mSugHead()}</span><span>Mission</span><span>Confidence</span><span>Priority</span><span>Source</span><span>Age</span><span>Root cause</span></div>
          ${rows}
        </div>
      </div>
      <div class="px-5 py-2 border-t border-line text-[11.5px] text-ink4 font-mono shrink-0 flex justify-between"><span>${list.length} of ${W.tasks.length} missions</span><span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-cx animate-pulse"></span>Live</span></div>
    </div>
    ${mLog()}
  </div>`;
}
