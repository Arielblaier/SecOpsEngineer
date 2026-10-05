/* ======================================================================
   MAYA · NATIVE SCREEN: CORRELATION RULES
   The existing table, plus three columns that show an agent worked here:
   AI Review, Confidence and Task status. The Source column also names the
   agent when she created a rule.
   ====================================================================== */
function mSourceCell(s) { return `<span class="inline-flex items-center gap-1.5 min-w-0">${s.kind === 'agent' ? agentAv(mP(), 16, false) : ic(s.kind === 'pack' ? 'package' : 'user', 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${esc(s.name)}</span></span>`; }
function mRules() {
  const W = M.W;
  const all = W.rules.map(r => ({ r, rv: myRuleReview(W, r) }));
  const list = all.filter(x => !M.onlyOpen || (x.rv.task && x.rv.task.status !== 'done'));
  const withTask = all.filter(x => x.rv.task && x.rv.task.status !== 'done').length;
  const th = (l, extra = '') => `<th class="text-left font-semibold px-3 py-3 whitespace-nowrap ${extra}">${l}</th>`;
  const rows = list.map(({ r, rv }) => { const f = mPivotFocus('rule', r.id), off = r.status === 'Disabled';
    return `<tr ${f ? 'data-focus="1"' : ''} onclick="mOpenRule(${r.id})" class="border-t border-line cursor-pointer hover:bg-hov ${f ? 'm-focus' : ''} ${off ? 'text-ink4' : 'text-ink2'}">
      <td class="px-3 py-3 font-mono text-[12.5px] whitespace-nowrap">${r.type}</td>
      <td class="px-3 py-3 whitespace-nowrap">${r.type === 'SCHEDULED' ? 'Aug 23rd 2026 10:40:00' : off && !r.retired ? 'Real-time (Not Executed)' : 'Real-time'}</td>
      <td class="px-3 py-3 min-w-[260px] ${off ? '' : 'text-ink'}"><span class="inline-flex items-center gap-2">${f ? `<span class="shrink-0 px-1.5 rounded tn tn-amber text-[10.5px] font-bold">FROM TASK</span>` : ''}${esc(r.name)}</span><span class="block text-[11.5px] text-ink4 font-mono">ID ${r.id}</span></td>
      <td class="px-3 py-3">${rv.task ? `<button onclick="event.stopPropagation();mOpenTask('${rv.task.id}')" title="Open ${rv.task.id}">${mChip(rv.v, 'hover:brightness-125')}</button>` : mChip(rv.v)}</td>
      <td class="px-3 py-3">${mConf(rv.conf)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${rv.task ? `<button onclick="event.stopPropagation();mOpenTask('${rv.task.id}')" class="inline-flex items-center gap-1.5 text-[12.5px] ${rv.st === 'Pending decision' ? 'c-amber font-semibold' : rv.st === 'In progress' ? 'c-blue font-semibold' : 'text-ink3'} hover:underline">${rv.st}<span class="font-mono text-[11px] text-ink4">${rv.task.id}</span></button>` : '<span class="text-ink4">—</span>'}</td>
      <td class="px-3 py-3">${r.retired ? 'Retired' : r.status}</td>
      <td class="px-3 py-3 text-right font-mono">${r.issues7d.toLocaleString()}</td>
      <td class="px-3 py-3 whitespace-nowrap">${r.supp ? `<span class="c-cx">On</span> · ${esc(r.supp.dur)}` : 'Off'}</td>
      <td class="px-3 py-3 whitespace-nowrap">${r.tactic ? `<span class="inline-block px-2 py-0.5 rounded-md border border-line2 text-[12px] italic">${esc(r.tactic)}</span>` : ''}</td>
      <td class="px-3 py-3 whitespace-nowrap">${r.tech ? `<span class="inline-block px-2 py-0.5 rounded-md border border-line2 text-[12px] italic">${esc(r.tech)}</span>` : ''}</td>
      <td class="px-3 py-3 whitespace-nowrap max-w-[190px]">${mSourceCell(r.source)}</td></tr>`; }).join('');

  $('mv-rules').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <div><div class="text-[13px] text-ink3">Detection Rules <span class="mx-1.5">›</span> <span class="text-ink2">Correlations</span></div><h1 class="text-[30px] text-ink leading-tight mt-1.5">Correlation Rules</h1></div>
      <div class="flex items-center gap-2"><button class="px-4 py-2 rounded-lg bg-hov text-ink text-[14px] font-semibold">Import</button><button class="px-4 py-2 rounded-lg bg-cx text-slate-950 text-[14px] font-bold">+ Add Correlation</button></div></div>
    <div class="flex-1 min-h-0 mx-3 sm:mx-5 mb-3 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden">
      <div class="px-5 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div class="flex items-center gap-3 text-[14.5px] text-ink2">${ic('filter', 'w-4 h-4')}<span>${list.length} results</span>${ic('refresh-cw', 'w-4 h-4 text-ink3')}
          <button onclick="M.onlyOpen=!M.onlyOpen;mRender()" class="ml-2 px-3 py-1 rounded-full border text-[12.5px] inline-flex items-center gap-1.5 ${M.onlyOpen ? 'border-amber-500/60 bg-amber-500/10 c-amber font-semibold' : 'border-line2 text-ink2 hover:text-ink'}">${agentAv(mP(), 16, false)}${withTask} with an open task</button></div>
        <div class="flex items-center gap-4 text-[14.5px] text-ink2"><span class="inline-flex items-center gap-1.5">${ic('columns-3', 'w-4 h-4')}Display</span>${ic('download', 'w-4 h-4')}</div></div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto"><table class="w-full min-w-[1560px] text-[14px] border-collapse">
        <thead class="sticky top-0 z-[2] bg-panel text-ink3 text-[13px]"><tr>${th('Rule Type')}${th('Last execution')}${th('Name')}${th(`<span class="inline-flex items-center gap-1.5"><span class="c-indigo">${ic('sparkles', 'w-3 h-3')}</span>AI Review ${mInfo(M_VERDICT_HELP)}</span>`)}${th('Confidence')}${th('Task status')}${th('Status')}${th('# of issues (7d)', 'text-right')}${th('Suppression')}${th('Mitre ATT&CK Tactic')}${th('Mitre ATT&CK Technique')}${th('Source')}</tr></thead>
        <tbody>${rows}</tbody></table></div>
      <div class="px-5 py-2.5 border-t border-line text-[13px] text-ink3 shrink-0">Showing ${list.length} of ${W.rules.length}</div>
    </div>`;
}

function mRuleSheet(s) {
  const W = M.W, r = mRule(s.id), rv = myRuleReview(W, r), t = rv.task, open = t && t.status !== 'done';
  const pipe = W.pipes.find(p => p.id === r.pipe), src = W.sources.find(x => x.id === (pipe && pipe.src));
  const box = (title, body) => `<section class="rounded-2xl border border-line p-4"><h3 class="text-[15px] italic text-ink mb-2.5">${title}</h3>${body}</section>`;
  const kv = (k, v) => `<div class="flex gap-3 text-[13.5px] py-1"><span class="w-40 shrink-0 text-ink3">${k}</span><span class="text-ink min-w-0">${v}</span></div>`;
  const maya = t ? `<section class="rounded-2xl border-2 p-4 ${open ? 'border-amber-500/50 bg-amber-500/5' : 'border-line bg-sunk'}">
      <div class="flex items-start gap-3">${agentAv(mP(), 30, false)}<div class="min-w-0 flex-1"><div class="flex items-center gap-2 flex-wrap">${mChip(rv.v)}${mConf(rv.conf)}<span class="text-[12px] text-ink3 font-mono">${t.id}</span>${mStatus(t)}</div>
        <div class="text-[14px] text-ink font-semibold mt-1.5 leading-snug">${esc(t.title)}</div><p class="text-[13px] text-ink2 mt-1 leading-relaxed">${esc(t.diagnosis)}</p>
        ${open && t.layer !== 'rule' ? `<p class="text-[12.5px] c-amber mt-1.5">Nothing in this rule needs to change. The problem starts at the ${MY_LAYER[t.layer].name.toLowerCase()} step.</p>` : ''}</div></div>
      ${open && t.layer === 'rule' && t.current && t.recommended ? `<div class="mt-3 space-y-2">${mBlock(t.current, 'cur')}${mBlock(t.recommended, 'rec')}</div>` : ''}
      <button onclick="mOpenTask('${t.id}')" class="mt-3 w-full py-2.5 rounded-xl ${open && t.status === 'pending' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-hov text-ink'} text-[13.5px] font-bold inline-flex items-center justify-center gap-2">${open && t.status === 'pending' ? 'Review Maya’s recommendation' : 'Open Maya’s task'}${ic('arrow-right', 'w-4 h-4')}</button>
    </section>` : `<section class="rounded-2xl border border-line bg-sunk p-4 flex items-center gap-3">${agentAv(mP(), 30, false)}<div class="flex-1 min-w-0"><div class="flex items-center gap-2">${mChip(rv.v)}${mConf(rv.conf)}</div><p class="text-[13px] text-ink2 mt-1">${rv.v === 'Healthy' ? 'Maya checked this rule in the last sweep and found nothing wrong.' : 'Maya has not reviewed this rule.'}</p></div><button onclick="mAskReview(${r.id})" class="px-3 py-2 rounded-xl border border-line2 text-[13px] font-semibold text-ink hover:bg-hov whitespace-nowrap">Review this rule</button></section>`;
  return `${mSheetHead(`Detection Rules › Correlations`, `Edit Correlation Rule <span class="text-ink3 font-normal">(Id: ${r.id})</span>`)}
    <div id="m-sheet-scroll" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      ${maya}
      ${box('General', kv('Rule Name', esc(r.name)) + kv('Rule Description', esc(r.desc) || '<span class="text-ink4">None</span>') + kv('Status', r.retired ? 'Retired' : r.status) + kv('Source', mSourceCell(r.source)) + kv('Modification Time', r.mod))}
      ${box('XQL Search', `<div class="flex justify-end mb-2"><span class="inline-flex rounded-lg border border-line2 overflow-hidden text-[12.5px]"><span class="px-3 py-1 ${r.type === 'REAL_TIME' ? 'bg-ink text-panel font-semibold' : 'text-ink3'}">Real Time</span><span class="px-3 py-1 ${r.type === 'SCHEDULED' ? 'bg-ink text-panel font-semibold' : 'text-ink3'}">Scheduled</span></span></div><pre class="rounded-xl bg-code p-3 text-[12.5px] leading-[1.7] font-mono text-ink2 overflow-x-auto">${esc(r.xql)}</pre>${src ? `<div class="text-[12px] text-ink3 mt-2">Reads data from <button onclick="mOpenSource('${src.id}')" class="underline underline-offset-2 hover:text-ink">${esc(src.name)}</button> through the ${esc(pipe.product)} pipeline.</div>` : ''}`)}
      ${box('Issue Suppression', kv('Enable issue suppression', r.supp ? '<span class="c-cx font-semibold">On</span>' : 'Off') + (r.supp ? kv('Duration time', esc(r.supp.dur)) + kv('Fields', esc(r.supp.fields)) : ''))}
      ${box('Action', kv('Resulting action', 'Generate issue') + kv('Issue Domain', 'Security') + kv('Severity', r.sev ? `User Defined · <span class="font-mono text-[12.5px]">${r.sev}</span>` : 'Medium') + kv('Category', esc(r.cat)) + kv('MITRE ATT&CK', r.tactic ? `${esc(r.tactic)} · ${esc(r.tech)}` : '<span class="text-ink4">0 Tactics and 0 Techniques</span>') + kv('# of issues (7d)', r.issues7d.toLocaleString()))}
    </div>`;
}
/* The human-request trigger, from the screen where the user already works. */
function mAskReview(id) {
  const r = mRule(id); toast(`Maya is reviewing “${r.name}”…`, 'search');
  setTimeout(() => { M.W.log.unshift({ t: Date.now(), kind: 'check', text: `Reviewed rule ${id} on request from ${M_USER}: healthy` }); toast(`Rule ${id}: healthy. No task opened.`, 'check'); if (M.view === 'work') mRender(); }, 1400);
}
