/* ======================================================================
   SECOPS ENGINEERING · INSIGHTS
   Value regained, not rules produced. No coverage percentage: a status per
   technique that says what is true.
   ====================================================================== */
function mRuleChain(W, r) {
  /* A step counts against a rule only when an open mission says that step starves this rule. */
  const open = W.tasks.filter(t => t.status !== 'done' && (t.affects.rules || []).includes(r.id));
  const p = W.pipes.find(x => x.id === r.pipe), rv = myRuleReview(W, r);
  const data = mPipeInst(W, p).status === 'ok' && p.dest.includes('Analytics') && !open.some(t => ['integration', 'source', 'filter', 'parsing', 'routing'].includes(t.layer));
  const mapped = !open.some(t => t.layer === 'model');
  const tested = W.tasks.some(t => (t.affects.rules || []).includes(r.id) && t.validation && (t.status === 'progress' || ['approved', 'edited'].includes(t.end)));
  return { data, mapped, enabled: r.status === 'Enabled', healthy: rv.v === 'Healthy', tested, rv };
}
function mInsights() {
  const W = M.W, st = myStats(W);
  const kpi = (label, val, sub, tone) => `<div class="rounded-2xl bg-panel border border-line p-4"><div class="text-[12.5px] text-ink3">${label}</div><div class="text-[30px] leading-9 font-bold font-mono ${tone}">${val}</div><div class="text-[12.5px] text-ink3">${sub}</div></div>`;
  const byLayer = MY_LAYERS.map(([k, n, i]) => [k, n, i, W.tasks.filter(t => t.layer === k).length, myLayerOpen(W, k).length]);
  const mx = Math.max(1, ...byLayer.map(x => x[3]));
  const below = W.tasks.filter(t => t.layer !== 'rule').length;
  const yes = b => b ? `<span class="c-cx">${ic('check', 'w-4 h-4')}</span>` : `<span class="c-rose">${ic('x', 'w-4 h-4')}</span>`;
  const techAll = W.rules.filter(r => r.tech && !r.retired).map(r => ({ r, c: mRuleChain(W, r) })), techBad = techAll.filter(x => !(x.c.data && x.c.mapped && x.c.enabled && x.c.healthy));
  const techRows = techBad.concat(techAll.filter(x => !techBad.includes(x)).slice(0, 6)).map(({ r, c }) => {
    return `<tr class="border-t border-line hover:bg-hov cursor-pointer" onclick="mOpenRule(${r.id})"><td class="px-3 py-2.5 whitespace-nowrap"><span class="font-mono text-[12.5px] text-ink">${esc(r.tech.split(' - ')[0])}</span> <span class="text-ink3">${esc(r.tech.split(' - ')[1] || '')}</span></td><td class="px-3 py-2.5 text-ink2 min-w-[220px]">${esc(r.name)}</td><td class="px-3 py-2.5 text-center">${yes(c.data)}</td><td class="px-3 py-2.5 text-center">${yes(c.mapped)}</td><td class="px-3 py-2.5 text-center">${yes(c.enabled)}</td><td class="px-3 py-2.5 text-center">${c.tested ? yes(true) : '<span class="text-ink4 text-[12px]">never</span>'}</td><td class="px-3 py-2.5">${mSugCell(c.rv)}</td></tr>`; }).join('');
  const ends = [['approved', 'Approved'], ['edited', 'Approved with edits'], ['auto', 'Closed automatically'], ['handed', 'Handed over'], ['watch', 'Watching'], ['rejected', 'Rejected'], ['dismissed', 'Dismissed']].map(([k, l]) => [l, W.tasks.filter(t => t.status === 'done' && t.end === k).length]).filter(x => x[1]);
  $('mv-insights').innerHTML = `<div data-scroll class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
    <div class="flex items-end justify-between gap-4 flex-wrap"><div><div class="hm-label">INSIGHTS</div><h1 class="hm-title mt-1">SecOps</h1></div><div class="flex items-center gap-2 flex-wrap">${['det', 'pipe'].map(k => { const mine = W.tasks.filter(t => t.agent === k); return `<div class="flex items-center gap-2.5 rounded-2xl bg-panel border border-line px-3 py-2">${mAv(k, 30, true)}<div class="leading-tight"><div class="text-[13px] font-bold text-ink">${M_AG[k].name}</div><div class="text-[11.5px] text-ink3">${mine.filter(t => t.status === 'done').length} done · ${mine.filter(t => t.status === 'progress').length} in progress · ${mine.filter(t => t.status === 'pending').length} pending</div></div></div>`; }).join('')}</div></div>
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
      ${kpi('Detections working and useful', `${st.share}%`, `${st.healthy} of ${st.enabled} enabled rules`, st.share >= 70 ? 'c-cx' : 'c-amber')}
      ${kpi('Issues removed per week', st.removed.toLocaleString(), 'from changes you approved', 'c-indigo')}
      ${kpi(`Root cause below the rule ${mInfo('Missions whose root cause sits in the data source, filter, parsing, data model or routing, and not in the rule.')}`, `${below}<span class="text-ink4 text-[16px]"> of ${W.tasks.length}</span>`, 'missions', 'text-ink')}
      ${kpi('Missions closed', st.done, `${st.progress} in progress · ${st.pending} pending`, 'text-ink')}
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
      <div class="bg-panel border border-line rounded-2xl p-4"><h2 class="text-[14px] font-semibold text-ink mb-3">Missions by root-cause step</h2>
        <div class="space-y-2.5">${byLayer.map(([k, n, i, all, open]) => `<div><div class="flex items-center justify-between text-[12.5px] mb-1"><span class="inline-flex items-center gap-1.5 text-ink2">${ic(i, 'w-3.5 h-3.5 text-ink3')}${n}</span><span class="font-mono text-ink3">${all}${open ? ` · <span class="c-amber">${open} open</span>` : ''}</span></div><div class="h-2 rounded-full bg-sunk overflow-hidden flex"><div class="h-full bg-amber-500" style="width:${open / mx * 100}%"></div><div class="h-full bg-cx" style="width:${(all - open) / mx * 100}%"></div></div></div>`).join('')}</div>
        <div class="mt-3 text-[11.5px] text-ink3 flex gap-3"><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>Open</span><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-cx"></span>Closed</span></div>
        <h2 class="text-[14px] font-semibold text-ink mt-5">How missions ended</h2><div class="mt-2 flex flex-wrap gap-1.5">${ends.map(([l, n]) => `<span class="px-2.5 py-1 rounded-lg bg-sunk border border-line text-[12.5px] text-ink2">${l} <b class="font-mono text-ink">${n}</b></span>`).join('') || '<span class="text-[12.5px] text-ink3">No mission has ended yet.</span>'}</div>
      </div>
      <div class="xl:col-span-2 bg-panel border border-line rounded-2xl p-4 min-w-0"><h2 class="text-[14px] font-semibold text-ink mb-2 inline-flex items-center gap-1.5">ATT&CK status by technique ${mInfo('A technique counts as covered only when its data arrives, its fields are mapped, the rule is enabled and the rule is healthy. Tested shows whether a backtest or silent test has run.')}</h2>
        <div class="overflow-x-auto"><table class="w-full text-[13px] border-collapse"><thead class="text-[12px] text-ink3"><tr><th class="text-left font-semibold px-3 py-2">Technique</th><th class="text-left font-semibold px-3 py-2">Rule</th><th class="font-semibold px-3 py-2">Data arrives</th><th class="font-semibold px-3 py-2">Mapped</th><th class="font-semibold px-3 py-2">Enabled</th><th class="font-semibold px-3 py-2">Tested</th><th class="text-left font-semibold px-3 py-2">AI suggestion</th></tr></thead><tbody>${techRows}</tbody></table></div><button onclick="mNav('mitre')" class="mt-3 text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1">${techAll.length - techBad.length - Math.min(6, techAll.length - techBad.length)} more rules are fully working · open MITRE ATT&CK Coverage${ic('arrow-right', 'w-3.5 h-3.5')}</button>
      </div>
    </div></div>`;
}
