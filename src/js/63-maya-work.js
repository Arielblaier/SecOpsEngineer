/* ======================================================================
   SECOPS · MISSIONS
   The queue of missions. A mission opens in the panel on the right, so the
   list stays in view while deciding. The activity log sits between the two
   as a thin strip that opens on demand.
   ====================================================================== */
const M_TABS = [['all', 'All'], ['pending', 'Pending'], ['progress', 'In progress'], ['done', 'Done']];
function mWorkList() {
  const W = M.W, order = { pending: 0, progress: 1, done: 2 }, q = M.q.trim().toLowerCase();
  /* A mission that just started stays visible in Pending while its agent runs, so a new trigger is never missed. */
  return W.tasks.filter(t => M.tab === 'all' || t.status === M.tab || (M.tab === 'pending' && mRunning(t)))
    .filter(t => !q || [t.id, t.title, t.sug, MY_CARD[t.card], MY_LAYER[t.layer].name, mAgentNames(t)].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (mRunning(b) ? 1 : 0) - (mRunning(a) ? 1 : 0) || order[a.status] - order[b.status] || (a.status === 'done' ? (b.closed || 0) - (a.closed || 0) : myRank(a, b)));
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
function mWidgets() {
  const W = M.W, st = myStats(W), total = W.tasks.length || 1, last = W.history[W.history.length - 1], delta = st.issuesNow - last;
  const inst = W.sources.flatMap(s => s.instances), running = W.tasks.filter(mRunning).length;
  const seg = (k, n, cls, lbl, tone) => `<button onclick="M.tab='${k}';mRender()" class="text-left min-w-0 rounded-lg px-2 py-1 -mx-2 hover:bg-hov ${M.tab === k ? 'bg-hov' : ''}"><div class="text-[24px] leading-7 font-black font-mono ${tone}">${n}</div><div class="text-[11.5px] text-ink3 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${cls}"></span>${lbl}</div></button>`;
  const card = (body, extra = '') => `<div class="m-wid rounded-2xl border border-line px-3 py-2.5 min-w-0 ${extra}">${body}</div>`;
  return `<div class="m-wwrap"><div class="m-wgrid">
    ${card(`<div class="flex items-center justify-between text-[11.5px] text-ink3 mb-1.5"><span class="font-semibold flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-cx animate-pulse"></span>Queue flow</span><span class="font-mono ${running ? 'c-blue' : 'text-ink4'}">${running ? `${running} running now` : `${W.tasks.length} missions`}</span></div>
      <div class="grid grid-cols-3 gap-2">${seg('pending', st.pending, 'bg-amber-500', 'Pending', 'c-amber')}${seg('progress', st.progress, 'bg-blue-500', 'In progress', 'c-blue')}${seg('done', st.done, 'bg-cx', 'Done', 'c-cx')}</div>
      <div class="mt-2 h-2.5 rounded-full bg-sunk flex gap-[2px] overflow-hidden"><div class="m-bar h-full bg-amber-500" data-anim="b-pend" data-to="${st.pending / total * 100}%"></div><div class="m-bar h-full bg-blue-500 seg-live" data-anim="b-prog" data-to="${st.progress / total * 100}%"></div><div class="m-bar h-full bg-cx" data-anim="b-done" data-to="${st.done / total * 100}%"></div></div>`, 'm-wide')}
    ${card(`<div class="text-[11.5px] text-ink3 font-semibold mb-1.5">Detections working</div><div class="flex items-center gap-2.5">${mRing(st.share, st.share >= 70 ? '#00c389' : '#f59e0b', st.share + '%', 56)}<div class="min-w-0"><div class="text-[20px] leading-6 font-black font-mono text-ink">${st.healthy}<span class="text-ink4 text-[13px] font-bold"> / ${st.enabled}</span></div><div class="text-[11.5px] text-ink3 leading-snug">rules healthy</div></div></div>`)}
    ${card(`<div class="flex items-center justify-between text-[11.5px] text-ink3 font-semibold"><span>Issues per week</span><span class="font-mono ${delta < 0 ? 'c-cx' : delta > 0 ? 'c-amber' : 'text-ink4'}">${delta < 0 ? '▼ ' + Math.abs(delta).toLocaleString() : delta > 0 ? '▲ ' + delta.toLocaleString() : 'no change'}</span></div><div class="text-[20px] leading-6 font-black font-mono text-ink mt-1">${st.issuesNow.toLocaleString()}</div><div class="mt-1">${mSpark(W.history.concat([st.issuesNow]), delta < 0 ? '#00c389' : '#818cf8')}</div><div class="text-[11.5px] text-ink3 whitespace-nowrap truncate">${st.removed ? `<span class="c-cx">${st.removed.toLocaleString()} removed by you</span>` : 'vs last week'}</div>`)}
    ${card(`<div class="text-[11.5px] text-ink3 font-semibold mb-1">Data instances</div><div class="text-[20px] leading-6 font-black font-mono ${st.instErr ? 'c-rose' : 'c-cx'}">${st.instOk}<span class="text-ink4 text-[13px] font-bold"> / ${st.inst}</span></div><div class="mt-1.5 flex flex-wrap gap-1">${inst.map(i => `<span class="w-2.5 h-2.5 rounded-[3px] ${{ ok: 'bg-cx', err: 'bg-rose-500 animate-pulse', warn: 'bg-amber-500', off: 'bg-slate-500/50' }[i.status]}" title="${esc(i.name)}: ${M_INST[i.status][2]}"></span>`).join('')}</div><div class="text-[11.5px] text-ink3 mt-1">${st.instErr ? `${st.instErr} in error` : 'none in error'}</div>`)}
  </div></div>`;
}
/* ---------- the activity log: a thin strip between the list and the panel ---------- */
const M_LOGK = { sweep: ['Sweep', 'text-ink3', 'clock'], check: ['Check', 'c-cx', 'shield-check'], task: ['New mission', 'c-indigo', 'file-plus-2'], ready: ['Needs you', 'c-amber', 'bell-ring'], handoff: ['Handoff', 'c-blue', 'corner-down-right'], test: ['Test', 'c-indigo', 'flask-conical'], done: ['Done', 'c-cx', 'circle-check'], step: ['Working', 'c-blue', 'activity'] };
function mNowLine() { const W = M.W, run = W.tasks.find(mRunning); return run ? `${run.id}: ${run.steps[Math.min(run.shown || 1, run.steps.length) - 1]}` : `Watching ${W.rules.length} detections and ${W.sources.flatMap(s => s.instances).length} data instances`; }
function mLog() {
  const W = M.W, n = myPendingTasks(W).length, now = mNowLine();
  if (!M.logOpen) return `<div id="m-log" class="hidden lg:flex w-11 shrink-0 flex-col items-center border-l border-line bg-panel2 cursor-pointer hover:bg-hov/60" onclick="M.logOpen=true;mRender()" title="Open the activity log (L)">
      <span class="mt-3 text-ink2">${ic('chevrons-right', 'w-4 h-4')}</span><span class="mt-3 w-2 h-2 rounded-full bg-cx animate-pulse"></span>
      ${n ? `<span class="mt-3 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold font-mono flex items-center justify-center">${n}</span>` : ''}
      <div class="m-vert mt-4 text-[12px] text-ink3 whitespace-nowrap"><span>${esc(now.length > 58 ? now.slice(0, 58) : now)}…</span><b class="text-ink ml-3">Activity log</b></div></div>`;
  const rows = W.log.slice(0, 40).map(l => { const kind = l.kind === 'task' && /ready for a decision/.test(l.text) ? 'ready' : l.kind, k = M_LOGK[kind] || M_LOGK.sweep, id = (l.text.match(/MSN-\d+/) || [])[0], d = new Date(l.t);
    return `<div ${id ? `onclick="mOpenTask('${id}')"` : ''} class="px-4 py-3 border-b border-line ${id ? 'cursor-pointer hover:bg-hov' : ''}">
      <div class="flex items-center gap-2 text-[11.5px]"><span class="${k[1]} shrink-0">${ic(k[2], 'w-3.5 h-3.5')}</span><span class="font-semibold ${k[1]}">${k[0]}</span><span class="font-mono text-ink4">${d.toTimeString().slice(0, 8)}</span>${id ? `<span class="ml-auto font-mono text-ink4">${id}</span>` : ''}</div>
      <div class="mt-1 text-[13px] text-ink2 leading-snug">${esc(l.text.replace(/^MSN-\d+: /, ''))}</div></div>`; }).join('');
  return `<div id="m-log" class="hidden lg:flex w-[300px] 2xl:w-[340px] shrink-0 flex-col border-l border-line bg-panel2 overflow-hidden">
    <div class="px-4 h-12 flex items-center justify-between shrink-0 border-b border-line"><div class="flex items-center gap-2 text-[13.5px]"><span class="w-2 h-2 rounded-full bg-cx animate-pulse"></span><b class="text-ink">Activity log</b><span class="text-[11.5px] c-cx">Live</span></div><button onclick="M.logOpen=false;mRender()" class="p-1.5 rounded-lg hover:bg-hov text-ink2" title="Collapse (L)">${ic('chevrons-left', 'w-4 h-4')}</button></div>
    <div class="px-4 py-3 border-b border-line flex gap-3 shrink-0"><span class="w-7 h-7 rounded-lg tn tn-cx flex items-center justify-center shrink-0">${ic('activity', 'w-3.5 h-3.5')}</span><div class="min-w-0"><div class="text-[11.5px] text-ink3">Working on now</div><div class="text-[13px] text-ink leading-snug">${esc(now)}…</div></div></div>
    <div class="flex-1 overflow-y-auto">${rows}</div></div>`;
}
function mWork() {
  const W = M.W, list = mWorkList();
  const count = k => k === 'all' ? W.tasks.length : W.tasks.filter(t => t.status === k).length;
  const dot = { pending: 'bg-amber-500', progress: 'bg-blue-500', done: 'bg-cx' };
  const rows = list.map(t => { const sel = M.panelTask === t.id, run = mRunning(t), fresh = t.fresh && Date.now() - t.fresh < 4000;
    return `<div data-task="${t.id}" onclick="mOpenTask('${t.id}')" class="mcols items-center px-4 h-[54px] text-[13.5px] cursor-pointer border-b border-line transition-colors ${fresh ? 'm-fresh' : ''} ${t.status === 'done' && !sel ? 'opacity-70 hover:opacity-100' : ''} ${sel ? 'm-sel' : t.status === 'pending' ? 'hover:bg-amber-400/10' : 'hover:bg-hov'}">
      <span>${mStatus(t)}</span><span>${run ? mAnalyzing() : mSug(t.sug, { solid: true })}</span>
      <span class="min-w-0"><span class="block truncate text-ink" title="${esc(t.title)}">${esc(t.title)}</span><span class="block text-[11.5px] text-ink3 truncate"><span class="font-mono">${t.id}</span> · ${t.status === 'progress' && t.progressNote ? `<span class="c-blue">${esc(t.progressNote)}</span>` : esc(MY_CARD[t.card])}</span></span>
      <span>${run ? '<span class="text-ink4">—</span>' : mConf(t.conf)}</span>
      <span>${mImpact(t.impact)}</span>
      <span class="text-[12.5px] text-ink3">${myAge(Date.now() - t.opened)}</span>
      <span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 min-w-0">${ic(MY_LAYER[t.layer].icon, 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${MY_LAYER[t.layer].name}</span></span>
      <span class="inline-flex items-center gap-2 text-[12.5px] text-ink3 min-w-0">${mAvs(t, 20)}<span class="truncate">${mTaskAgents(t).length > 1 ? 'Detection + Pipeline' : M_AG[t.agent].name.replace(' Engineer', '')}</span></span></div>`; }).join('') || `<div class="p-12 text-[13.5px] text-ink3">${M.q ? 'No mission matches the search.' : M.tab === 'pending' ? 'No open decisions.' : 'Nothing here right now.'}</div>`;

  $('mv-work').innerHTML = `<div class="flex-1 min-w-0 flex">
    <div class="flex-1 min-w-0 flex flex-col bg-panel">
      <div class="px-5 pt-4 pb-3 shrink-0 space-y-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="min-w-0"><h1 class="text-[18px] font-bold text-ink leading-tight">Missions</h1><p class="text-[12.5px] text-ink3">SecOps</p></div>
          <button onclick="mOpenPanel()" class="lg:hidden p-2 rounded-lg bg-sunk text-ink2" title="SecOps">${ic('sparkles', 'w-4 h-4 c-cx')}</button>
        </div>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-1 text-[12.5px]">${M_TABS.map(([k, l]) => `<button data-tab="${k}" onclick="M.tab='${k}';mRender()" class="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${M.tab === k ? 'bg-hov text-ink font-semibold' : 'text-ink3 hover:text-ink'}">${dot[k] ? `<span class="w-1.5 h-1.5 rounded-full ${dot[k]}"></span>` : ''}${l}<span class="font-mono text-[11.5px] ${M.tab === k ? 'text-ink2' : 'text-ink4'}">${count(k)}</span></button>`).join('')}</div>
          <div class="relative flex-1 min-w-[180px] max-w-[280px]"><span class="absolute left-2.5 top-[8px] text-ink4">${ic('search', 'w-3.5 h-3.5')}</span><input type="text" id="m-search" data-keep value="${esc(M.q)}" placeholder="Search missions, IDs" oninput="M.q=this.value;mRender()" class="w-full text-[12.5px] pl-8 pr-3 py-1.5 bg-sunk border border-line rounded-lg text-ink placeholder:text-ink4 focus:outline-none focus:border-cx"></div>
        </div>
        ${mWidgets()}
      </div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto border-t border-line">
        <div class="m-table">
          <div class="mcols px-4 py-2 border-b border-line bg-panel2 text-[11.5px] font-semibold text-ink3 select-none sticky top-0 z-[2]"><span>Status</span><span class="whitespace-nowrap">${mSugHead()}</span><span>Mission</span><span>Confidence</span><span>Impact</span><span>Age</span><span>Root cause</span><span>Worked by</span></div>
          ${rows}
        </div>
      </div>
      <div class="px-5 py-2 border-t border-line text-[11.5px] text-ink4 font-mono shrink-0 flex justify-between"><span>${list.length} of ${W.tasks.length} missions</span><span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-cx animate-pulse"></span>Live</span></div>
    </div>
    ${mLog()}
  </div>`;
}
