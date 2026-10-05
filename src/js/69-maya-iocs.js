/* ======================================================================
   SECOPS ENGINEERING · NATIVE SCREEN: IOC RULES
   The existing table, plus the same two columns as Correlation Rules:
   AI suggestion and Confidence. A suggestion opens its mission in the agent
   panel.
   ====================================================================== */
function mIocs() {
  const W = M.W, list = W.iocs.filter(i => M.iocAll || i.status === 'Enabled');
  const th = (l, extra = '') => `<th class="text-left font-semibold px-3 py-3 whitespace-nowrap ${extra}">${l}</th>`;
  const sev = s => `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm ${{ High: 'bg-rose-500', Medium: 'bg-amber-500', Low: 'bg-blue-500' }[s]}"></span>${s}</span>`;
  const rows = list.map(i => { const rv = myIocReview(W, i), f = mPivotFocus('ioc', i.id), off = i.status !== 'Enabled';
    return `<tr ${f ? 'data-focus="1"' : ''} data-ioc="${i.id}" onclick="mOpenObj('ioc', ${i.id})" class="border-t border-line cursor-pointer hover:bg-hov ${f ? 'm-focus' : ''} ${(M.panelObj && M.panelObj.kind === 'ioc' && M.panelObj.id === i.id) || (M.panelTask && rv.task && rv.task.id === M.panelTask) ? 'm-sel' : ''} ${off ? 'text-ink4' : 'text-ink2'}">
      <td class="px-3 py-3 font-mono text-[12.5px]">${i.id}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.mod)}</td>
      <td class="px-3 py-3 max-w-[230px] ${off ? '' : 'text-ink'}"><span class="inline-flex items-center gap-2 max-w-full">${f ? `<span class="shrink-0 px-1.5 rounded tn tn-amber text-[10.5px] font-bold whitespace-nowrap">FROM MISSION</span>` : ''}<span class="truncate font-mono text-[12.5px]" title="${esc(i.ind)}">${esc(i.ind)}</span></span></td>
      <td class="px-3 py-3">${mSugCell(rv)}</td>
      <td class="px-3 py-3">${mConfCell(rv)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.type)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${sev(i.sev)}</td>
      <td class="px-3 py-3 text-right font-mono">${i.issues.toLocaleString()}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.source)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.exp)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.status)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.rep)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${esc(i.rel)}</td></tr>`; }).join('');
  $('mv-iocs').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <div><div class="text-[13px] text-ink3">Detection Rules <span class="mx-1.5">›</span> <span class="text-ink2">IOC</span></div><h1 class="text-[30px] text-ink leading-tight mt-1.5">IOC Rules</h1></div>
      <button class="px-4 py-2 rounded-lg bg-cx text-slate-950 text-[14px] font-bold">+ Add IOC</button></div>
    <div class="flex-1 min-h-0 mx-3 sm:mx-5 mb-3 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden">
      <div class="px-5 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div class="flex items-center gap-3 text-[14.5px] text-ink2">${ic('filter', 'w-4 h-4')}<span>${list.length} out of ${W.iocs.length} results</span>${ic('refresh-cw', 'w-4 h-4 text-ink3')}
          ${M.iocAll ? `<button onclick="M.iocAll=false;mRender()" class="px-2.5 py-1 rounded-md border border-dashed border-line2 text-[12.5px] text-ink3 hover:text-ink">+ Status = Enabled</button>` : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sunk border border-line text-[12.5px]">Status = Enabled<button onclick="M.iocAll=true;mRender()" class="text-ink3 hover:text-ink" title="Remove the filter">${ic('x', 'w-3 h-3')}</button></span>`}</div>
        <div class="flex items-center gap-4 text-[14.5px] text-ink2"><span class="inline-flex items-center gap-1.5">${ic('columns-3', 'w-4 h-4')}Display</span>${ic('download', 'w-4 h-4')}</div></div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto"><table class="w-full min-w-[1380px] text-[14px] border-collapse">
        <thead class="sticky top-0 z-[2] bg-panel text-ink3 text-[13px]"><tr>${th('Rule ID')}${th('Modification Time')}${th('Indicator')}${th(mSugHead())}${th('Confidence')}${th('Type')}${th('Severity')}${th('# of issues', 'text-right')}${th('Source')}${th('Expiration Date')}${th('Status')}${th('Reputation')}${th('Reliability')}</tr></thead>
        <tbody>${rows}</tbody></table></div>
    </div>`;
}
