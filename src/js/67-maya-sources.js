/* ======================================================================
   MAYA · NATIVE SCREEN: DATA SOURCES & INTEGRATIONS
   The existing table and its instance panel. A person can fix an instance
   here. Maya notices the data arriving and closes her task on her own.
   ====================================================================== */
const M_INST = { ok: ['circle-check', 'c-cx', 'Connected'], warn: ['circle-alert', 'c-amber', 'Warning'], err: ['circle-x', 'c-rose', 'Error'], off: ['circle-minus', 'text-ink4', 'Disabled'] };
function mInstChips(s) {
  const c = { ok: 0, warn: 0, err: 0, off: 0 }; s.instances.forEach(i => c[i.status]++);
  return `<span class="inline-flex items-center gap-3"><b class="text-ink w-4 text-right">${s.instances.length}</b><span class="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-sunk">${['ok', 'warn', 'err', 'off'].filter(k => c[k]).map(k => `<span class="inline-flex items-center gap-1 ${M_INST[k][1]}">${ic(M_INST[k][0], 'w-3.5 h-3.5')}${c[k]}</span>`).join('')}</span></span>`;
}
function mSources() {
  const W = M.W, t6 = mTask('TSK-1006'), oktaOpen = t6 && t6.status !== 'done', oktaFocus = mPivotFocus('source', 'okta');
  const rows = W.sources.map(s => { const t = mySourceTask(W, s.id), f = mPivotFocus('source', s.id), total = s.instances.reduce((a, i) => a + i.count, 0);
    return `<tr ${f ? 'data-focus="1"' : ''} onclick="mOpenSource('${s.id}')" class="border-t border-line cursor-pointer hover:bg-hov text-ink2 ${f ? 'm-focus' : ''}">
      <td class="px-4 py-4 text-ink"><span class="inline-flex items-center gap-2">${f ? `<span class="px-1.5 rounded tn tn-amber text-[10.5px] font-bold">FROM TASK</span>` : ''}${esc(s.name)}</span></td><td class="px-4 py-4">${esc(s.vendor)}</td><td class="px-4 py-4">${mInstChips(s)}</td>
      <td class="px-4 py-4 font-mono">${myNum(total)}</td><td class="px-4 py-4">${esc(s.cat)}</td><td class="px-4 py-4">${esc(s.pack)}</td>
      <td class="px-4 py-4 m-newcol">${t ? `<button onclick="event.stopPropagation();mOpenTask('${t.id}')" class="inline-flex items-center gap-2">${mChip(t.verdict)}<span class="text-[12px] ${t.status === 'pending' ? 'c-amber' : 'c-blue'} font-semibold">${mStatusTxt(t)}</span></button>` : mChip('Healthy')}</td></tr>`; }).join('');
  $('mv-sources').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <h1 class="text-[30px] font-bold text-ink leading-tight">Data Sources &amp; Integrations</h1><button class="px-4 py-2 rounded-lg bg-cx text-slate-950 text-[14px] font-bold">+ Add New</button></div>
    <div class="flex-1 min-h-0 mx-3 sm:mx-5 mb-3 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden">
      ${oktaOpen ? `<div ${oktaFocus ? 'data-focus="1"' : ''} class="m-newcol px-5 py-3 border-b border-line flex items-center gap-3 flex-wrap ${oktaFocus ? 'm-focus' : ''}">${agentAv(mP(), 26, false)}<div class="min-w-0 flex-1 text-[13.5px] text-ink2"><b class="text-ink">Not connected: Okta sign-in logs.</b> Maya recommends adding it. 9 Marketplace detections, including impossible travel, need this source. ${t6.status === 'progress' ? `<span class="c-blue">${esc(t6.progressNote)}.</span>` : ''}</div><button onclick="mOpenTask('TSK-1006')" class="px-3 py-1.5 rounded-lg border border-line2 text-[13px] font-semibold text-ink hover:bg-hov">Open the task</button></div>` : ''}
      <div class="px-5 py-3 flex items-center gap-3 text-[14.5px] text-ink2 shrink-0">${ic('filter', 'w-4 h-4')}<span>${W.sources.length} results</span><span class="px-2.5 py-1 rounded-md bg-sunk border border-line text-[12.5px]">Deprecated = No</span></div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto"><table class="w-full min-w-[1100px] text-[14.5px] border-collapse">
        <thead class="sticky top-0 z-[2] bg-panel text-ink3 text-[13px]"><tr>${['Name', 'Vendor', 'Instances Status', 'Count (Last 24h)', 'Category', 'Pack Version'].map(h => `<th class="text-left font-semibold px-4 py-3">${h}</th>`).join('')}<th class="text-left font-semibold px-4 py-3 m-newcol"><span class="inline-flex items-center gap-1 c-indigo">${ic('sparkles', 'w-3 h-3')}AI Review</span></th></tr></thead>
        <tbody>${rows}</tbody></table></div>
    </div>`;
}
function mSourceSheet(s) {
  const W = M.W, src = W.sources.find(x => x.id === s.id);
  const rows = src.instances.map(i => { const m = M_INST[i.status], t = W.tasks.find(x => x.status !== 'done' && x.affects.instance === i.id), f = mPivotFocus('instance', i.id);
    const pipe = W.pipes.find(p => p.src === src.id && (p.inst ? p.inst === i.id : true)), blind = pipe ? W.rules.filter(r => r.pipe === pipe.id && r.status === 'Enabled') : [];
    return `<div ${f ? 'data-focus="1"' : ''} class="rounded-2xl border p-4 ${i.status === 'err' ? 'border-rose-500/40' : 'border-line'} ${f ? 'm-focus' : ''}">
      <div class="flex items-center gap-3 flex-wrap"><span class="inline-flex items-center gap-1.5 text-[13px] font-semibold ${m[1]} w-[104px]">${ic(m[0], 'w-4 h-4')}${m[2]}</span><span class="text-[14.5px] text-ink flex-1 min-w-0 truncate">${esc(i.name)}</span><span class="font-mono text-[13px] text-ink2">${i.count ? myNum(i.count) + ' / 24h' : 'no events'}</span></div>
      <div class="mt-1.5 text-[12.5px] text-ink3">Last communication: ${myWhen(i.last)}${i.note ? ` · <span class="${i.status === 'err' ? 'c-rose' : ''}">${esc(i.note)}</span>` : ''}</div>
      ${t ? `<div class="mt-3 rounded-xl bg-amber-500/5 border border-amber-500/40 p-3 flex items-start gap-2.5">${agentAv(mP(), 24, false)}<div class="min-w-0 flex-1 text-[13px] text-ink2"><b class="text-ink">${t.id}</b> · ${blind.length} rule${blind.length === 1 ? '' : 's'} ha${blind.length === 1 ? 's' : 've'} no data because of this instance. ${t.handed ? 'The cloud team has been asked to replace the key.' : 'Maya cannot create credentials, so this needs a person.'}<div class="mt-1"><button onclick="mOpenTask('${t.id}')" class="font-semibold c-amber hover:underline">Open the task</button></div></div></div>` : ''}
      ${i.status === 'err' ? (M.reconnect === i.id
        ? `<div class="mt-3 rounded-xl border border-line bg-sunk p-3 space-y-2.5"><div class="text-[13px] font-semibold text-ink">Edit Amazon S3 log configuration</div>
            <label class="block text-[12px] text-ink3">Access key ID<input value="AKIA················" class="mt-1 w-full bg-panel border border-line rounded-lg px-3 py-2 text-[13px] font-mono text-ink focus:outline-none focus:border-cx"></label>
            <label class="block text-[12px] text-ink3">Secret access key<input type="password" value="newsecretnewsecret" class="mt-1 w-full bg-panel border border-line rounded-lg px-3 py-2 text-[13px] font-mono text-ink focus:outline-none focus:border-cx"></label>
            <div class="flex gap-2"><button onclick="mDoReconnect('${i.id}')" class="flex-1 py-2 rounded-lg bg-cx text-slate-950 text-[13.5px] font-bold">Save and test</button><button onclick="M.reconnect=null;mSheetRender();icons()" class="px-4 py-2 rounded-lg bg-panel border border-line text-ink2 text-[13.5px]">Cancel</button></div></div>`
        : `<div class="mt-3"><button onclick="M.reconnect='${i.id}';mSheetRender();icons()" class="px-3.5 py-2 rounded-lg bg-hov text-ink text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-line">${ic('key-round', 'w-4 h-4')}Replace the access key</button></div>`) : ''}
    </div>`; }).join('');
  return `${mSheetHead('Data Sources &amp; Integrations', esc(src.name), `<div class="text-[12.5px] text-ink3 mt-1">${src.instances.length} instance${src.instances.length === 1 ? '' : 's'} · ${esc(src.vendor)} · ${esc(src.cat)}</div>`)}
    <div id="m-sheet-scroll" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">${rows}</div>`;
}
/* A person fixes it in the native screen. No approval of a task is needed: the task sees the data and closes. */
function mDoReconnect(instId) {
  M.reconnect = null;
  const t = myReconnect(M.W, instId, M_USER);
  toast(t ? `Connected. ${t.id} closed automatically.` : 'Connected', 'check');
  mRender();
}
