/* ======================================================================
   SECOPS ENGINEERING · NATIVE SCREEN: CORRELATION RULES
   The existing table, plus two columns that show an agent worked here:
   AI suggestion and Confidence. A suggestion opens its mission in the agent
   panel. A rule the agent suggests is listed with an Adopt button, and the
   Source column names the agent once the rule is adopted.
   ====================================================================== */
function mSourceCell(s) { return `<span class="inline-flex items-center gap-1.5 min-w-0">${s.kind === 'agent' ? mAv('det', 16) : ic(s.kind === 'pack' ? 'package' : 'user', 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${esc(s.name)}</span></span>`; }
function mRules() {
  const W = M.W;
  const all = W.rules.map(r => ({ r, rv: myRuleReview(W, r) }));
  const hasOpen = x => x.rv.task && x.rv.task.status !== 'done';
  const list = all.filter(x => !M.onlyOpen || hasOpen(x));
  const withTask = all.filter(hasOpen).length + W.suggested.length;
  const th = (l, extra = '') => `<th class="text-left font-semibold px-3 py-3 whitespace-nowrap ${extra}">${l}</th>`;
  const tag = t => t ? `<span class="inline-block px-2 py-0.5 rounded-md border border-line2 text-[12px] italic">${esc(t)}</span>` : '';
  /* A rule the agent suggests. It is not a rule yet: it has no executions and no issues. */
  const sugRows = W.suggested.map(r => { const t = mTask(r.task), f = mPivotFocus('rule', r.id), sel = M.panelTask === t.id;
    return `<tr ${f ? 'data-focus="1"' : ''} data-suggested="${r.id}" onclick="mOpenTask('${t.id}')" class="border-t border-line cursor-pointer m-suggested text-ink2 ${f ? 'm-focus' : ''} ${sel ? 'm-sel' : ''}">
      <td class="px-3 py-3 font-mono text-[12.5px] whitespace-nowrap">${r.type}</td>
      <td class="px-3 py-3 whitespace-nowrap text-ink4">—</td>
      <td class="px-3 py-3 min-w-[260px] text-ink">${esc(r.name)}<span class="block text-[11.5px] c-cx font-semibold">New rule · suggested, not created yet</span></td>
      <td class="px-3 py-3"><button data-act="adopt" onclick="event.stopPropagation();mDecide('${t.id}','approve')" class="h-7 pl-2 pr-3 rounded-md bg-cx text-slate-950 text-[12.5px] font-bold inline-flex items-center gap-1 hover:brightness-110 whitespace-nowrap" title="Create and enable this rule">${ic('plus', 'w-3.5 h-3.5')}Adopt</button></td>
      <td class="px-3 py-3">${mConf(t.conf)}</td>
      <td class="px-3 py-3 whitespace-nowrap text-ink4">Suggested</td>
      <td class="px-3 py-3 text-right font-mono text-ink4">—</td>
      <td class="px-3 py-3 whitespace-nowrap">Off</td>
      <td class="px-3 py-3 whitespace-nowrap">${tag(r.tactic)}</td><td class="px-3 py-3 whitespace-nowrap">${tag(r.tech)}</td>
      <td class="px-3 py-3 whitespace-nowrap max-w-[190px]">${mSourceCell(r.source)}</td></tr>`; }).join('');
  const rows = list.map(({ r, rv }) => { const f = mPivotFocus('rule', r.id), off = r.status === 'Disabled', sel = (M.panelObj && M.panelObj.kind === 'rule' && M.panelObj.id === r.id) || (M.panelTask && rv.task && rv.task.id === M.panelTask && rv.sug !== 'Keep');
    return `<tr ${f ? 'data-focus="1"' : ''} data-rule="${r.id}" onclick="mOpenRule(${r.id})" class="border-t border-line cursor-pointer hover:bg-hov ${f ? 'm-focus' : ''} ${sel ? 'm-sel' : ''} ${off ? 'text-ink4' : 'text-ink2'}">
      <td class="px-3 py-3 font-mono text-[12.5px] whitespace-nowrap">${r.type}</td>
      <td class="px-3 py-3 whitespace-nowrap">${r.type === 'SCHEDULED' ? 'Aug 23rd 2026 10:40:00' : off && !r.retired ? 'Real-time (Not Executed)' : 'Real-time'}</td>
      <td class="px-3 py-3 min-w-[260px] ${off ? '' : 'text-ink'}"><span class="inline-flex items-center gap-2">${f ? `<span class="shrink-0 px-1.5 rounded tn tn-amber text-[10.5px] font-bold whitespace-nowrap">FROM MISSION</span>` : ''}${esc(r.name)}</span><span class="block text-[11.5px] text-ink4 font-mono">ID ${r.id}</span></td>
      <td class="px-3 py-3">${mSugCell(rv)}</td>
      <td class="px-3 py-3">${mConfCell(rv)}</td>
      <td class="px-3 py-3">${r.retired ? 'Retired' : r.status}</td>
      <td class="px-3 py-3 text-right font-mono">${r.issues7d.toLocaleString()}</td>
      <td class="px-3 py-3 whitespace-nowrap">${r.supp ? `<span class="c-cx">On</span> · ${esc(r.supp.dur)}` : 'Off'}</td>
      <td class="px-3 py-3 whitespace-nowrap">${tag(r.tactic)}</td><td class="px-3 py-3 whitespace-nowrap">${tag(r.tech)}</td>
      <td class="px-3 py-3 whitespace-nowrap max-w-[190px]">${mSourceCell(r.source)}</td></tr>`; }).join('');

  $('mv-rules').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <div><div class="text-[13px] text-ink3">Detection Rules <span class="mx-1.5">›</span> <span class="text-ink2">Correlations</span></div><h1 class="text-[30px] text-ink leading-tight mt-1.5">Correlation Rules</h1></div>
      <div class="flex items-center gap-2"><button class="px-4 py-2 rounded-lg bg-hov text-ink text-[14px] font-semibold">Import</button><button class="px-4 py-2 rounded-lg bg-cx text-slate-950 text-[14px] font-bold">+ Add Correlation</button></div></div>
    <div class="flex-1 min-h-0 mx-3 sm:mx-5 mb-3 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden">
      <div class="px-5 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div class="flex items-center gap-3 text-[14.5px] text-ink2">${ic('filter', 'w-4 h-4')}<span>${list.length} results</span>${ic('refresh-cw', 'w-4 h-4 text-ink3')}
          <button onclick="M.onlyOpen=!M.onlyOpen;mRender()" class="ml-2 px-3 py-1 rounded-full border text-[12.5px] inline-flex items-center gap-1.5 ${M.onlyOpen ? 'border-amber-500/60 bg-amber-500/10 c-amber font-semibold' : 'border-line2 text-ink2 hover:text-ink'}"><span class="c-indigo">${ic('sparkles', 'w-3 h-3')}</span>${withTask} with an open AI suggestion</button></div>
        <div class="flex items-center gap-4 text-[14.5px] text-ink2"><span class="inline-flex items-center gap-1.5">${ic('columns-3', 'w-4 h-4')}Display</span>${ic('download', 'w-4 h-4')}</div></div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto"><table class="w-full min-w-[1440px] text-[14px] border-collapse">
        <thead class="sticky top-0 z-[2] bg-panel text-ink3 text-[13px]"><tr>${th('Rule Type')}${th('Last execution')}${th('Name')}${th(mSugHead())}${th('Confidence')}${th('Status')}${th('# of issues (7d)', 'text-right')}${th('Suppression')}${th('Mitre ATT&CK Tactic')}${th('Mitre ATT&CK Technique')}${th('Source')}</tr></thead>
        <tbody>${sugRows}${rows}</tbody></table></div>
      <div class="px-5 py-2.5 border-t border-line text-[13px] text-ink3 shrink-0">Showing ${list.length} of ${W.rules.length}${W.suggested.length ? ` · ${W.suggested.length} suggested` : ''}</div>
    </div>`;
}

/* The rule as the product shows it. Used in the panel when a rule has no open mission. */
function mRuleBody(r) {
  const W = M.W, pipe = W.pipes.find(p => p.id === r.pipe), src = W.sources.find(x => x.id === (pipe && pipe.src));
  const box = (title, body) => `<section class="rounded-2xl border border-line p-4"><h3 class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase mb-2.5">${title}</h3>${body}</section>`;
  const kv = (k, v) => `<div class="flex gap-3 text-[13.5px] py-1"><span class="w-40 shrink-0 text-ink3">${k}</span><span class="text-ink min-w-0">${v}</span></div>`;
  return `${box('XQL search', `<pre class="rounded-xl bg-code p-3 text-[12.5px] leading-[1.7] font-mono text-ink2 overflow-x-auto">${esc(r.xql)}</pre>${src ? `<div class="text-[12px] text-ink3 mt-2">Reads data from ${esc(src.name)} through the ${esc(pipe.product)} pipeline.</div>` : ''}`)}
    ${box('General', kv('Description', esc(r.desc) || '<span class="text-ink4">None</span>') + kv('Status', r.retired ? 'Retired' : r.status) + kv('Type', r.type === 'SCHEDULED' ? 'Scheduled' : 'Real Time') + kv('Source', mSourceCell(r.source)) + kv('Modification Time', r.mod) + kv('Issue suppression', r.supp ? `<span class="c-cx font-semibold">On</span> · ${esc(r.supp.dur)} · ${esc(r.supp.fields)}` : 'Off') + kv('MITRE ATT&CK', r.tactic ? `${esc(r.tactic)} · ${esc(r.tech)}` : '<span class="text-ink4">Not mapped</span>') + kv('# of issues (7d)', r.issues7d.toLocaleString()))}`;
}
/* The human-request trigger, from the screen where the user already works. */
function mAskReview(id) {
  const r = mRule(id), key = 'rule:' + id; (M.chats[key] = M.chats[key] || []).push({ role: 'user', text: 'Review this rule now' });
  M.typing = { key }; mPanelRender(); icons(); mPanelBottom();
  setTimeout(() => { M.typing = null; M.W.log.unshift({ t: Date.now(), kind: 'check', text: `Reviewed rule ${id} on request from ${M_USER.replace(/\.$/, '')}: nothing to change` });
    M.chats[key].push({ role: 'agent', text: `Reviewed **${r.name}** again. The data arrives, the fields are mapped, and it created **${r.issues7d} issue${r.issues7d === 1 ? '' : 's'}** in the last 7 days. Nothing to change, so no mission was opened.` });
    mRender(); mPanelBottom(); }, 1400);
}
