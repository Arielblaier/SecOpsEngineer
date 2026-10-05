/* ======================================================================
   SECOPS ENGINEERING · AGENTIC TASKS
   The queue of agentic tasks from both agents. The task itself opens in the
   agent panel on the right, so the list stays in view while deciding.
   ====================================================================== */
const M_TABS = [['all', 'All'], ['pending', 'Pending'], ['progress', 'In progress'], ['done', 'Done']];
function mWorkList() {
  const W = M.W, order = { pending: 0, progress: 1, done: 2 }, q = M.q.trim().toLowerCase();
  /* A task that just started stays visible in Pending while its agent runs, so a new trigger is never missed. */
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
  const seg = (k, n, cls, lbl, tone) => `<button onclick="M.tab='${k}';mRender()" class="text-left min-w-0 rounded-lg px-2 py-1 -mx-2 hover:bg-hov ${M.tab === k ? 'bg-hov' : ''}"><div class="text-[26px] leading-7 font-black font-mono ${tone}">${n}</div><div class="text-[11.5px] text-ink3 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${cls}"></span>${lbl}</div></button>`;
  const card = (body, extra = '') => `<div class="m-wid rounded-2xl border border-line px-3.5 py-3 min-w-0 ${extra}">${body}</div>`;
  return `<div class="grid grid-cols-2 xl:grid-cols-[1.7fr_1fr_1.15fr_1fr] gap-2.5">
    ${card(`<div class="flex items-center justify-between text-[11.5px] text-ink3 mb-1.5"><span class="font-semibold flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-cx animate-pulse"></span>Queue flow</span><span class="font-mono ${running ? 'c-blue' : 'text-ink4'}">${running ? `${running} agent run${running === 1 ? '' : 's'} now` : `${W.tasks.length} tasks`}</span></div>
      <div class="grid grid-cols-3 gap-3">${seg('pending', st.pending, 'bg-amber-500', 'Pending', 'c-amber')}${seg('progress', st.progress, 'bg-blue-500', 'In progress', 'c-blue')}${seg('done', st.done, 'bg-cx', 'Done', 'c-cx')}</div>
      <div class="mt-2 h-2.5 rounded-full bg-sunk flex gap-[2px] overflow-hidden"><div class="m-bar h-full bg-amber-500" data-anim="b-pend" data-to="${st.pending / total * 100}%"></div><div class="m-bar h-full bg-blue-500 seg-live" data-anim="b-prog" data-to="${st.progress / total * 100}%"></div><div class="m-bar h-full bg-cx" data-anim="b-done" data-to="${st.done / total * 100}%"></div></div>`, 'col-span-2 xl:col-span-1')}
    ${card(`<div class="text-[11.5px] text-ink3 font-semibold mb-1">Detections working</div><div class="flex items-center gap-3">${mRing(st.share, st.share >= 70 ? '#00c389' : '#f59e0b', st.share + '%')}<div class="min-w-0"><div class="text-[20px] leading-6 font-black font-mono text-ink">${st.healthy}<span class="text-ink4 text-[13px] font-bold"> / ${st.enabled}</span></div><div class="text-[11.5px] text-ink3 leading-snug">enabled rules healthy</div></div></div>`)}
    ${card(`<div class="flex items-center justify-between text-[11.5px] text-ink3 font-semibold"><span>Issues per week</span><span class="font-mono ${delta < 0 ? 'c-cx' : delta > 0 ? 'c-amber' : 'text-ink4'}">${delta < 0 ? '▼ ' + Math.abs(delta).toLocaleString() : delta > 0 ? '▲ ' + delta.toLocaleString() : 'no change'}</span></div><div class="flex items-end gap-2.5 mt-0.5"><div class="shrink-0"><div class="text-[22px] leading-7 font-black font-mono text-ink">${st.issuesNow.toLocaleString()}</div><div class="text-[11.5px] text-ink3 whitespace-nowrap">${st.removed ? `<span class="c-cx">${st.removed.toLocaleString()} removed by you</span>` : 'vs last week'}</div></div><div class="flex-1 min-w-0">${mSpark(W.history.concat([st.issuesNow]), delta < 0 ? '#00c389' : '#818cf8')}</div></div>`)}
    ${card(`<div class="text-[11.5px] text-ink3 font-semibold mb-1">Data instances</div><div class="text-[20px] leading-6 font-black font-mono ${st.instErr ? 'c-rose' : 'c-cx'}">${st.instOk}<span class="text-ink4 text-[13px] font-bold"> / ${st.inst}</span></div><div class="mt-1.5 flex flex-wrap gap-1">${inst.map(i => `<span class="w-2.5 h-2.5 rounded-[3px] ${{ ok: 'bg-cx', err: 'bg-rose-500 animate-pulse', warn: 'bg-amber-500', off: 'bg-slate-500/50' }[i.status]}" title="${esc(i.name)}: ${M_INST[i.status][2]}"></span>`).join('')}</div><div class="text-[11.5px] text-ink3 mt-1">${st.instErr ? `${st.instErr} in error` : 'none in error'}</div>`)}
  </div>`;
}
function mWork() {
  const W = M.W, list = mWorkList();
  const count = k => k === 'all' ? W.tasks.length : W.tasks.filter(t => t.status === k).length;
  const dot = { pending: 'bg-amber-500', progress: 'bg-blue-500', done: 'bg-cx' };
  const rows = list.map(t => { const sel = M.panelTask === t.id, run = mRunning(t), fresh = t.fresh && Date.now() - t.fresh < 4000;
    return `<div data-task="${t.id}" onclick="mOpenTask('${t.id}')" class="mcols items-center px-4 h-[54px] text-[13.5px] cursor-pointer border-b border-line transition-colors ${fresh ? 'm-fresh' : ''} ${t.status === 'done' && !sel ? 'opacity-70 hover:opacity-100' : ''} ${sel ? 'm-sel' : t.status === 'pending' ? 'hover:bg-amber-400/10' : 'hover:bg-hov'}">
      <span>${mStatus(t)}</span><span>${run ? mAnalyzing() : mSug(t.sug, { solid: true })}</span><span>${run ? '<span class="text-ink4">—</span>' : mConf(t.conf)}</span>
      <span class="min-w-0"><span class="block truncate text-ink" title="${esc(t.title)}">${esc(t.title)}</span><span class="block text-[11.5px] text-ink3 truncate"><span class="font-mono">${t.id}</span> · ${t.status === 'progress' && t.progressNote ? `<span class="c-blue">${esc(t.progressNote)}</span>` : esc(MY_CARD[t.card])}</span></span>
      <span title="${esc(mTaskAgents(t).map(k => M_AG[k].name).join(' + '))}">${mAvs(t, 22)}</span>
      <span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 min-w-0">${ic(MY_LAYER[t.layer].icon, 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${MY_LAYER[t.layer].name}</span></span>
      <span>${mImpact(t.impact)}</span>
      <span class="text-right text-[12.5px] text-ink3">${myAge(Date.now() - t.opened)}</span></div>`; }).join('') || `<div class="p-12 text-center text-[13.5px] text-ink3">${M.q ? 'No task matches the search.' : M.tab === 'pending' ? 'No open decisions.' : 'Nothing here right now.'}</div>`;

  $('mv-work').innerHTML = `<div class="flex-1 min-w-0 flex flex-col bg-panel">
      <div class="px-5 pt-4 pb-3 shrink-0 space-y-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="min-w-0"><h1 class="text-[18px] font-bold text-ink leading-tight">Agentic tasks</h1><p class="text-[12.5px] text-ink3">Detection engineering and data pipeline · Bank US</p></div>
          <button onclick="mOpenPanel()" class="lg:hidden p-2 rounded-lg bg-sunk text-ink2" title="Agents">${ic('sparkles', 'w-4 h-4 c-cx')}</button>
        </div>
        ${mWidgets()}
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-1 text-[12.5px]">${M_TABS.map(([k, l]) => `<button data-tab="${k}" onclick="M.tab='${k}';mRender()" class="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${M.tab === k ? 'bg-hov text-ink font-semibold' : 'text-ink3 hover:text-ink'}">${dot[k] ? `<span class="w-1.5 h-1.5 rounded-full ${dot[k]}"></span>` : ''}${l}<span class="font-mono text-[11.5px] ${M.tab === k ? 'text-ink2' : 'text-ink4'}">${count(k)}</span></button>`).join('')}</div>
          <div class="relative flex-1 min-w-[180px] max-w-[280px]"><span class="absolute left-2.5 top-[8px] text-ink4">${ic('search', 'w-3.5 h-3.5')}</span><input type="text" id="m-search" data-keep value="${esc(M.q)}" placeholder="Search tasks, agents, IDs" oninput="M.q=this.value;mRender()" class="w-full text-[12.5px] pl-8 pr-3 py-1.5 bg-sunk border border-line rounded-lg text-ink placeholder:text-ink4 focus:outline-none focus:border-cx"></div>
        </div>
      </div>
      <div class="mcols px-4 py-2 border-y border-line bg-panel2 text-[11.5px] font-semibold text-ink3 shrink-0 select-none"><span>Status</span><span class="whitespace-nowrap">${mSugHead()}</span><span>Confidence</span><span>Task</span><span>Agent</span><span>Root cause</span><span>Impact</span><span class="text-right">Age</span></div>
      <div data-scroll class="flex-1 overflow-y-auto">${rows}</div>
      <div class="px-5 py-2 border-t border-line text-[11.5px] text-ink4 font-mono shrink-0 flex justify-between"><span>${list.length} of ${W.tasks.length} tasks</span><span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-cx animate-pulse"></span>Live · new triggers appear here</span></div>
    </div>`;
}
