/* ======================================================================
   MAYA · WORKFORCE SCREEN
   Maya's queue of agentic tasks. This is where the work is seen and the
   decisions are made.
   ====================================================================== */
const M_TABS = [['pending', 'Needs you'], ['progress', 'In progress'], ['done', 'Done'], ['all', 'All']];
function mWorkList() {
  const W = M.W, order = { pending: 0, progress: 1, done: 2 };
  return W.tasks.filter(t => M.tab === 'all' || t.status === M.tab).sort((a, b) => order[a.status] - order[b.status] || (a.status === 'done' ? (b.closed || 0) - (a.closed || 0) : myRank(a, b)));
}
function mWork() {
  const W = M.W, st = myStats(W), list = mWorkList(), P = mP();
  const count = k => k === 'all' ? W.tasks.length : W.tasks.filter(t => t.status === k).length;
  const kpi = (label, val, sub, tone = 'text-ink') => `<div class="rounded-xl bg-sunk px-3.5 py-2.5 min-w-0"><div class="text-[11.5px] text-ink3 truncate">${label}</div><div class="text-[22px] leading-7 font-bold font-mono ${tone}">${val}</div><div class="text-[11.5px] text-ink4 truncate">${sub}</div></div>`;
  const rows = list.map(t => { const tr = MY_TRIGGER[t.trigger.kind], sel = M.sheet && M.sheet.kind === 'task' && M.sheet.id === t.id;
    return `<div onclick="mOpenTask('${t.id}')" class="mcols items-center px-4 h-[52px] text-[13.5px] cursor-pointer border-b border-line transition-colors ${t.status === 'done' && !sel ? 'opacity-70 hover:opacity-100' : ''} ${sel ? 'bg-cx/10' : t.status === 'pending' ? 'hover:bg-amber-400/10' : 'hover:bg-hov'}">
      <span>${mStatus(t)}</span><span>${mChip(t.verdict)}</span><span>${mConf(t.conf)}</span>
      <span class="min-w-0"><span class="block truncate text-ink" title="${esc(t.title)}">${esc(t.title)}</span><span class="block text-[11.5px] text-ink3 truncate"><span class="font-mono">${t.id}</span> · ${esc(MY_CARD[t.card])}</span></span>
      <span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 min-w-0">${ic(MY_LAYER[t.layer].icon, 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${MY_LAYER[t.layer].name}</span></span>
      <span>${mImpact(t.impact)}</span>
      <span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink3 min-w-0">${t.trigger.from ? agentAv(PILLARS[t.trigger.from], 18, false) : ic(tr[1], 'w-3.5 h-3.5 shrink-0')}<span class="truncate">${t.trigger.from ? 'From ' + PILLARS[t.trigger.from].name : { sweep: 'Sweep', change: 'Change', human: 'Request' }[t.trigger.kind]}</span></span>
      <span class="text-right text-[12.5px] text-ink3">${myAge(Date.now() - t.opened)}</span></div>`; }).join('') || `<div class="p-12 text-center text-[13.5px] text-ink3">${M.tab === 'pending' ? 'No open decisions.' : 'Nothing here right now.'}</div>`;

  $('mv-work').innerHTML = `<div class="flex-1 flex min-h-0">
    <div class="flex-1 min-w-0 flex flex-col bg-panel border-r border-line">
      <div class="px-5 pt-4 pb-3 shrink-0 space-y-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3 min-w-0">${agentAv(P, 40)}<div class="min-w-0"><h1 class="text-[17px] font-bold text-ink leading-tight">Maya <span class="font-normal text-ink3">· SecOps Engineer</span></h1><p class="text-[12.5px] text-ink3">Detection engineering · Bank US</p></div></div>
          <div class="flex items-center gap-1 text-[12.5px]">${M_TABS.map(([k, l]) => `<button onclick="M.tab='${k}';mRender()" class="px-3 py-1.5 rounded-lg ${M.tab === k ? 'bg-hov text-ink font-semibold border border-line2' : 'text-ink3 hover:text-ink'}">${l} <span class="font-mono ${k === 'pending' && count(k) ? 'c-amber' : 'text-ink4'}">${count(k)}</span></button>`).join('')}</div>
        </div>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-2">
          ${kpi('Detections working and useful', `${st.healthy}<span class="text-ink4 text-[15px]"> of ${st.enabled}</span>`, `${st.share}% of enabled rules`, st.share >= 70 ? 'c-cx' : 'c-amber')}
          ${kpi('Decisions waiting', st.pending, st.pending ? 'ranked by impact' : 'all clear', st.pending ? 'c-amber' : 'c-cx')}
          ${kpi('Data instances healthy', `${st.instOk}<span class="text-ink4 text-[15px]"> of ${st.inst}</span>`, st.instErr ? `${st.instErr} in error` : 'none in error', st.instErr ? 'c-rose' : 'c-cx')}
          ${kpi('Issues removed per week', st.removed.toLocaleString(), 'from changes you approved', 'c-indigo')}
        </div>
      </div>
      <div class="mcols px-4 py-2 border-y border-line bg-panel2 text-[11.5px] font-semibold text-ink3 shrink-0 select-none"><span>Status</span><span class="inline-flex items-center gap-1">Verdict ${mInfo(M_VERDICT_HELP)}</span><span>Confidence</span><span>Task</span><span>Root cause</span><span>Impact</span><span>Trigger</span><span class="text-right">Age</span></div>
      <div data-scroll class="flex-1 overflow-y-auto">${rows}</div>
      <div class="px-5 py-2 border-t border-line text-[11.5px] text-ink4 font-mono shrink-0">${list.length} of ${W.tasks.length} tasks</div>
    </div>
    <div class="hidden lg:flex w-[360px] shrink-0 flex-col bg-panel">
      <div class="px-5 pt-8 pb-5 text-center border-b border-line">
        <div class="flex justify-center">${agentAv(P, 84)}</div>
        <div class="mt-3 text-[18px] font-bold text-ink">Maya</div><div class="text-[13px] font-semibold" style="color:${P.c2}">SecOps Engineer</div>
        <div class="mt-3 text-[13px] text-ink3 leading-relaxed">${st.pending ? `${st.pending} task${st.pending === 1 ? '' : 's'} need${st.pending === 1 ? 's' : ''} your decision.` : 'Nothing needs you right now.'}</div>
        ${st.pending ? `<button onclick="mReviewAll()" class="mt-4 w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[14px] font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25">${ic('bell-ring', 'w-4 h-4')}Review ${st.pending} decision${st.pending === 1 ? '' : 's'}${ic('arrow-right', 'w-4 h-4')}</button>` : ''}
      </div>
      <div class="px-5 py-3 text-[12px] font-bold tracking-wide text-ink3 uppercase shrink-0">Activity</div>
      <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-3">${W.log.slice(0, 14).map(l => { const m = { sweep: ['clock', 'text-ink3'], check: ['shield-check', 'c-cx'], task: ['file-plus-2', 'c-amber'], handoff: ['corner-down-right', 'c-blue'], test: ['flask-conical', 'c-indigo'], done: ['circle-check', 'c-cx'] }[l.kind] || ['dot', 'text-ink3'];
        return `<div class="flex gap-2.5 text-[12.5px]"><span class="${m[1]} mt-0.5 shrink-0">${ic(m[0], 'w-3.5 h-3.5')}</span><div class="min-w-0"><div class="text-ink2 leading-snug">${esc(l.text)}</div><div class="text-[11px] text-ink4 font-mono">${myAge(Date.now() - l.t)} ago</div></div></div>`; }).join('')}</div>
    </div>
  </div>`;
}
