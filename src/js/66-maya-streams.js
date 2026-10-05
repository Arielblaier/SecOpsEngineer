/* ======================================================================
   SECOPS ENGINEERING · NATIVE SCREEN: DATA STREAMS
   Each pipeline drawn as source, filter, parsing, data model, destination.
   The Pipeline Engineer's marker sits on the step where a problem starts.
   ====================================================================== */
function mPipeInst(W, p) { const s = W.sources.find(x => x.id === p.src); return s.instances.find(i => i.id === p.inst) || s.instances[0]; }
function mNode(p, stage, o) {
  const W = M.W, t = myNodeTask(W, p.id, stage), f = mPivotFocus('node', { pipe: p.id, stage });
  if (!o) return `<div class="m-node m-node-none"><span class="text-[12px] text-ink4">${stage === 'filter' ? 'No filter' : 'No data model'}</span></div>`;
  const bad = o.bad || !!t;
  return `<button ${f ? 'data-focus="1"' : ''} onclick="mOpenNode('${p.id}','${stage}')" class="m-node ${bad ? 'm-node-bad' : ''} ${f ? 'm-focus' : ''}">
    ${t ? `<span class="m-mark" title="${mRunning(t) ? 'The Pipeline Engineer is checking this step' : 'Open AI suggestion on this step'}">${mAv('pipe', 20)}</span>` : ''}
    <span class="${bad ? 'c-amber' : 'text-ink3'} shrink-0">${ic(o.icon, 'w-4 h-4')}</span>
    <span class="min-w-0 text-left"><span class="block text-[13px] text-ink truncate">${esc(o.label)}</span><span class="block text-[11px] ${bad ? 'c-amber' : 'text-ink4'} truncate">${esc(o.sub)}</span></span></button>`;
}
function mStreams() {
  const W = M.W;
  const rows = W.pipes.map(p => { const s = W.sources.find(x => x.id === p.src), inst = mPipeInst(W, p), srcBad = inst.status !== 'ok', outside = !p.dest.includes('Analytics');
    const n = W.rules.filter(r => r.pipe === p.id && r.status === 'Enabled').length;
    return `<div class="m-pipe">
      ${mNode(p, 'source', { icon: 'cable', label: s.name, sub: `${inst.name} · ${{ ok: 'connected', err: 'error', warn: 'no events', off: 'disabled' }[inst.status]}`, bad: inst.status === 'err' })}
      <span class="m-wire ${srcBad ? 'm-wire-off' : ''}"></span>
      ${mNode(p, 'filter', p.filter && { icon: 'filter', label: p.filter.name, sub: p.filter.ok ? 'Filter rule' : 'Drops events a rule needs', bad: !p.filter.ok })}
      <span class="m-wire ${srcBad ? 'm-wire-off' : ''}"></span>
      ${mNode(p, 'parsing', { icon: 'braces', label: p.parsing.name, sub: `Parsing rule · ${p.parsing.origin}` })}
      <span class="m-wire ${srcBad ? 'm-wire-off' : ''}"></span>
      ${mNode(p, 'model', p.model && { icon: 'database', label: p.model.name, sub: p.model.ok ? `Data model · ${p.model.origin}` : 'A mapped field arrives empty', bad: !p.model.ok })}
      <span class="m-wire ${srcBad ? 'm-wire-off' : ''}"></span>
      <div class="m-node ${outside ? 'm-node-none' : ''} !cursor-default"><span class="${outside ? 'text-ink4' : 'c-cx'} shrink-0">${ic(outside ? 'archive' : 'shield-check', 'w-4 h-4')}</span><span class="min-w-0 text-left"><span class="block text-[13px] text-ink truncate">${esc(p.dest.join(' + '))}</span><span class="block text-[11px] text-ink4 truncate">${outside ? 'Not visible to rules · none depend on it' : `${n} rule${n === 1 ? '' : 's'} read this`}</span></span></div>
    </div>`; }).join('');
  const marks = W.pipes.reduce((a, p) => a + ['source', 'filter', 'parsing', 'model'].filter(st => myNodeTask(W, p.id, st)).length, 0);
  $('mv-streams').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <div><div class="text-[13px] text-ink3">Data Streams</div><h1 class="text-[30px] text-ink leading-tight mt-1.5">Data Streams</h1></div>
      <div class="flex items-center gap-3 text-[13px] text-ink3"><span class="inline-flex items-center gap-1.5">${ic('refresh-cw', 'w-4 h-4')}Last update: 6m ago</span><button class="px-4 py-2 rounded-lg bg-hov text-ink text-[14px] font-semibold">Create pipeline</button></div></div>
    <div class="flex-1 min-h-0 mx-3 sm:mx-5 mb-3 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden">
      <div class="px-5 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0 border-b border-line">
        <div class="flex items-center gap-2 text-[13px] text-ink2"><span class="px-3 py-1.5 rounded-lg bg-sunk border border-line">All Sources</span><span class="px-3 py-1.5 rounded-lg bg-sunk border border-line">All Destinations</span></div>
        <div class="text-[13px] text-ink3 inline-flex items-center gap-2">${mAv('pipe', 18)}${marks ? `${marks} step${marks === 1 ? '' : 's'} with an open AI suggestion` : 'No open AI suggestions'}</div></div>
      <div class="m-pipe m-pipe-head px-5 text-[11.5px] font-semibold text-ink3 uppercase tracking-wide"><span>Source</span><span></span><span>Filter</span><span></span><span>Parsing</span><span></span><span>Data model</span><span></span><span>Destination</span></div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto px-5 pt-3 pb-5 space-y-3">${rows}</div>
    </div>`;
}

function mNodeSheet(s) {
  const W = M.W, p = W.pipes.find(x => x.id === s.pipe), st = s.stage, t = myNodeTask(W, p.id, st), src = W.sources.find(x => x.id === p.src), inst = mPipeInst(W, p);
  const rules = W.rules.filter(r => r.pipe === p.id);
  const lastTask = t || W.tasks.find(x => x.affects.node && x.affects.node.pipe === p.id && x.affects.node.stage === st);
  const code = txt => `<pre class="rounded-xl bg-code p-3 text-[12.5px] leading-[1.7] font-mono text-ink2 overflow-x-auto">${esc(txt)}</pre>`;
  let body = '';
  if (st === 'source') body = `<div class="rounded-2xl border border-line p-4 text-[13.5px] text-ink2 space-y-1"><div><span class="text-ink3">Integration:</span> ${esc(src.name)}</div><div><span class="text-ink3">Instance:</span> ${esc(inst.name)}</div><div><span class="text-ink3">Status:</span> ${{ ok: 'Connected', err: 'Error', warn: 'Warning', off: 'Disabled' }[inst.status]}</div>${inst.note ? `<div class="c-amber">${esc(inst.note)}</div>` : ''}</div><button onclick="mOpenSource('${src.id}')" class="w-full py-2.5 rounded-xl bg-hov text-ink text-[13.5px] font-semibold">Open in Data Sources & Integrations</button>`;
  if (st === 'filter') body = code(lastTask && lastTask.current ? (lastTask.status === 'done' && ['approved', 'edited'].includes(lastTask.end) ? lastTask.recommended : lastTask.current).lines.map(l => l[0]).join('\n') : `[FILTER: ${p.filter.name}]`) + `<div class="text-[12.5px] text-ink3">Added ${esc(p.filter.on)} by ${esc(p.filter.by)}.</div>`;
  if (st === 'parsing') body = code(p.parsing.text) + `<div class="text-[12.5px] text-ink3 inline-flex items-center gap-1.5">Origin: ${esc(p.parsing.origin)} ${mInfo(p.parsing.origin === 'User defined' ? 'The Pipeline Engineer can suggest changes to user-defined rules.' : 'The Pipeline Engineer does not edit default or Marketplace rules. Problems in them are handed over to their owner.')}</div>`;
  if (st === 'model') body = code(lastTask && lastTask.current ? (lastTask.status === 'done' && ['approved', 'edited'].includes(lastTask.end) ? lastTask.recommended : lastTask.current).lines.map(l => l[0]).join('\n') : `[MODEL: ${p.model.name}]`) + `<div class="text-[12.5px] text-ink3">Origin: ${esc(p.model.origin)}.</div>`;
  const maya = t ? mSheetNote(t, t.recommended && st !== 'source' && !mRunning(t) ? `<div class="mt-3 space-y-2">${mBlock(t.current, 'cur')}${mBlock(t.recommended, 'rec')}</div>` : '')
    : `<section class="rounded-2xl border border-line bg-sunk p-4 flex items-center gap-3">${mAv('pipe', 30)}<p class="text-[13px] text-ink2">No open AI suggestion on this step.</p></section>`;
  return `${mSheetHead(`Data Streams › ${esc(p.product)}`, `${MY_LAYER[st].name} step`)}
    <div id="m-sheet-scroll" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">${maya}${body}
      <section class="rounded-2xl border border-line p-4"><h3 class="text-[12px] font-bold tracking-wide text-ink3 uppercase mb-2">Rules that read this pipeline</h3><div class="flex flex-wrap gap-1.5">${rules.map(r => `<button onclick="mOpenRule(${r.id})" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line hover:border-line2 text-[12.5px] text-ink2">${esc(r.name)} ${mSug(myRuleReview(W, r).sug)}</button>`).join('') || '<span class="text-[13px] text-ink3">None. Nothing depends on this pipeline.</span>'}</div></section>
    </div>`;
}
