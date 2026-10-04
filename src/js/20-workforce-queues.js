/* ======================================================================
   WORKFORCE QUEUES (four pillars)
   ====================================================================== */
const ITEM_COLS = [['status', 'Status'], ['id', 'ID'], ['title', 'Work item'], ['impact', 'Impact', 'col-score'], ['result', 'Outcome'], ['open', 'Age', 'text-right']];
function renderPillarTabs() {
  const el = $('pillar-tabs'); if (!el) return;
  const html = PILLAR_KEYS.map(k => {
    const P = PILLARS[k], st = pillarStats(k), on = S.pillar === k;
    return `<button onclick="setPillar('${k}')" class="text-left px-2.5 py-2 rounded-xl border transition flex items-center gap-2 min-w-0 ${on ? 'bg-panel border-line2 shadow-sm' : 'border-transparent bg-sunk/60 hover:bg-sunk'}" style="${on ? `box-shadow: inset 0 -2px 0 ${P.col}` : ''}">
      ${agentAv(P, 30)}
      <span class="min-w-0 flex-1"><span class="block text-[12.5px] font-bold ${on ? 'text-ink' : 'text-ink2'} truncate">${P.name} <span class="font-normal text-ink3">· ${P.title}</span></span><span class="block text-[11px] text-ink3 truncate">${st.prog} ${P.noun} in progress</span></span>
      ${st.need ? `<span class="shrink-0 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold flex items-center justify-center">${st.need}</span>` : ''}
    </button>`;
  }).join('');
  if (html !== S._ptHtml) { el.innerHTML = html; S._ptHtml = html; icons(); }
}
function setPillar(k) { S.pillar = k; setTimeout(() => mountWfBorn(false), 0); S.filter = 'pending'; S.search = ''; const si = $('search-input'); if (si) si.value = ''; S._tblHtml = null; S.frozenIds = null; renderTabs(); renderHead(); renderTable(); icons(); }
function queueItems() {
  const q = S.search.toLowerCase().trim();
  const order = { pending: 0, in_progress: 1, resolved: 2 };
  return (S.items[S.pillar] || []).filter(x => (S.filter === 'all' || x.status === S.filter) && (!q || (x.title + ' ' + x.id + ' ' + x.result).toLowerCase().includes(q)))
    .sort((a, b) => order[a.status] - order[b.status] || b.updated - a.updated);
}
function itemRowHTML(it) {
  const P = PILLARS[it.pillar], lc = it.status, rev = S.cu.open && it.task && it.task === S.cu.taskId, sel = !rev && S.briefItem === it.id;
  const tint = { pending: 'hover:bg-amber-400/10', in_progress: 'hover:bg-blue-500/10', resolved: 'hover:bg-emerald-500/10' }[lc];
  const out = lc === 'pending' ? it.ask : lc === 'resolved' ? (it.done || it.result) : 'Working…';
  const imp = it.impact === 'High' ? 'background:rgb(136 19 55 / .55);border-color:rgb(244 63 94 / .55);color:#ffe4e6' : it.impact === 'Medium' ? 'background:rgb(124 45 18 / .5);border-color:rgb(249 115 22 / .5);color:#ffedd5' : 'background:rgb(30 58 138 / .45);border-color:rgb(96 165 250 / .45);color:#dbeafe';
  return `<div data-item="${it.id}" class="item-row group relative icols items-center px-3 h-[46px] text-[13.5px] cursor-pointer border-b border-line transition-colors ${lc === 'resolved' && !sel ? 'opacity-60 hover:opacity-100' : ''} ${rev ? 'bg-amber-500/10 row-review' : sel ? 'bg-cx/10' : tint}" style="${sel ? 'box-shadow: inset 3px 0 0 #00c389' : ''}">
    <span>${queueStatus(lc, it.task)}</span>
    <span class="font-mono text-[11.5px] text-ink3">${it.id}</span>
    <span class="min-w-0 flex items-center gap-1.5">${rev ? `<span class="shrink-0 inline-flex items-center gap-1 px-1.5 rounded tn tn-amber text-[11px] font-bold">${ic('eye', 'w-2.5 h-2.5')}REVIEWING</span>` : ''}${sel ? `<span class="shrink-0 inline-flex items-center gap-1 px-1.5 rounded bg-cx text-slate-950 text-[11px] font-bold">${ic('eye', 'w-2.5 h-2.5')}VIEWING</span>` : ''}<span class="truncate ${lc === 'resolved' ? 'text-ink2' : 'text-ink'}" title="${esc(it.title)}">${esc(it.title)}</span></span>
    <span class="col-score"><span class="inline-flex px-2 py-0.5 rounded-md border text-[12px] font-semibold" style="${imp}">${it.impact}</span></span>
    <span class="truncate text-[13px] ${lc === 'pending' ? 'text-amber-300' : lc === 'in_progress' ? 'text-ink3' : 'text-ink2'}" title="${esc(out)}">${esc(out)}</span>
    <span class="text-right text-[12.5px] text-ink3">${fmtOpen(Date.now() - it.opened)}</span>
  </div>`;
}
function renderItemTable() {
  const list = queueItems(), box = $('table-body'), all = S.items[S.pillar] || [];
  $('table-count').textContent = `${list.length} of ${all.length} ${PILLARS[S.pillar].noun} · ${PILLARS[S.pillar].name}, ${PILLARS[S.pillar].title}`;
  const html = list.map(itemRowHTML).join('') || `<div class="p-10 text-center text-[13px] text-ink3">Nothing here right now.</div>`;
  if (html === S._tblHtml) return;
  if (S._ptrDown) { clearTimeout(S._tblT); S._tblT = setTimeout(renderTable, 250); return; }
  S._tblHtml = html; const st = box.scrollTop; box.innerHTML = html; box.scrollTop = st; icons();
}
function showItemBrief(id) {
  if (S.briefItem === id && !S.cu.open) { closeBrief(); renderTable(); return; }
  if (S.cu.open) closeCatchup();
  if (S.briefItem !== id) S.chat = [];
  S.briefItem = id; S.briefId = null; S.briefSig = null; S._tblHtml = null;
  renderTable(); renderCopilot(); renderTranscript();
  if (window.innerWidth < 1024) mobileTab('copilot');
}
function renderItemBrief() {
  const el = $('brief'), it = itemById(S.briefItem); if (!it) { el.innerHTML = ''; return; }
  const P = PILLARS[it.pillar], tk = S.tasks.find(x => x.id === it.task);
  const key = ['item', it.id, it.status, it.task, !!tk && Math.floor((Date.now() - tk.created) / 30000)].join('|');
  if (S.briefSig === key) return; S.briefSig = key;
  const stTn = { pending: 'amber', in_progress: 'blue', resolved: 'cx' }[it.status], stTx = { pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved' }[it.status];
  el.innerHTML = `<div class="fade-up space-y-3">
    <section class="rounded-2xl border border-line bg-card p-5">
      <div class="flex items-center gap-2 text-[12px] text-ink3 flex-wrap">
        <span class="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full font-semibold" style="background:${P.col}1f;color:${P.col}">${agentAv(P, 18, false)}${P.name} · ${P.title}</span>
        <span class="tn tn-${stTn} px-1.5 py-0.5 rounded-md font-semibold">${stTx}</span><span class="font-mono">${it.id}</span><span>· impact ${it.impact.toLowerCase()}</span>
      </div>
      <div class="mt-2 text-[17px] font-semibold text-ink leading-snug">${esc(it.title)}</div>
      <p class="mt-2 text-[13px] text-ink2 leading-relaxed">${esc(it.status === 'resolved' && it.done ? it.done + '. ' + it.result : it.result)}</p>
    </section>
    <section class="rounded-2xl border border-line bg-card p-5">
      <div class="text-[12px] text-ink3 mb-2">What the agent did</div>
      <ol class="space-y-2">${it.steps.map((x, i) => `<li class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style="background:${P.col}">${i + 1}</span>${esc(x)}</li>`).join('')}</ol>
      ${it.viz ? `<div class="mt-4">${itemVizHTML(it)}</div>` : ''}
    </section>
    ${tk ? `<section class="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5">
      <div class="flex items-center justify-between gap-3"><div class="min-w-0"><div class="text-[12px] c-amber font-semibold">Waiting for your decision</div><div class="text-[16px] font-semibold text-ink mt-1 leading-snug">${esc(tk.title)}</div></div>${slaRing(tk)}</div>
      <button onclick="openCatchup('${tk.id}')" class="mt-4 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[14px] font-bold">Review decision</button></section>`
      : `<div class="text-center text-[12px] text-ink3 py-1">${it.status === 'resolved' ? 'Nothing needed from you, this is done.' : 'No decision needed yet.'}</div>`}
  </div>`;
  icons();
}
function itemVizHTML(it) {
  const v = it.viz, P = PILLARS[it.pillar]; if (!v) return '';
  if (v.kind === 'bars') return `<div class="space-y-3">${v.rows.map(([l, a, b, u]) => { const mx = Math.max(a, b);
    return `<div><div class="flex justify-between text-[12px] text-ink2 mb-1"><span>${l}</span><span class="font-mono"><span class="text-ink3">${a.toLocaleString()}${u}</span> → <b class="c-cx">${b.toLocaleString()}${u}</b></span></div>
      <div class="space-y-1"><div class="h-2.5 rounded-full bg-sunk overflow-hidden"><div class="h-full rounded-full bg-slate-400" style="width:${a / mx * 100}%"></div></div>
      <div class="h-2.5 rounded-full bg-sunk overflow-hidden"><div class="impact-after h-full rounded-full bg-cx transition-all duration-700" style="width:${b / mx * 100}%"></div></div></div></div>`; }).join('')}
    <div class="text-[11px] text-ink3 flex gap-3"><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400"></span>Today</span><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-cx"></span>After approval</span></div></div>`;
  return `<div class="rounded-xl bg-sunk p-3.5"><div class="text-[12px] font-semibold text-ink mb-1.5">${esc(v.head)}</div><ul class="space-y-1">${v.items.map(x => `<li class="flex gap-2 text-[12.5px] text-ink2"><span style="color:${P.col}">${ic('chevron-right', 'w-3.5 h-3.5 mt-[2px]')}</span>${esc(x)}</li>`).join('')}</ul></div>`;
}
function itemCardHTML(tk, it, animate) {
  const P = PILLARS[it.pillar];
  return `<div id="cu-card" class="${animate ? 'card-in' : ''} flex-1 min-h-0 flex flex-col bg-panel">
    <div id="cu-scroll" class="flex-1 min-h-0 overflow-y-auto cp-pad py-6 space-y-5">
      <div id="cu-hero" class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-[12px] text-ink3 flex items-center gap-1.5 flex-wrap">
            <span class="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full font-semibold" style="background:${P.col}1f;color:${P.col}">${agentAv(P, 18, false)}${P.name} · ${P.title}</span>
            <span class="font-mono">${it.id}</span><span>· impact ${it.impact.toLowerCase()}</span>
          </div>
          <div class="text-[clamp(19px,1.7vw,26px)] font-bold text-ink leading-tight mt-1.5">${esc(tk.title)}</div>
          <div class="text-[13px] text-ink2 mt-2 leading-relaxed">${esc(it.result)}</div>
        </div>
        <div class="shrink-0">${slaRing(tk)}</div>
      </div>
      <section id="impact" class="rounded-2xl border border-line p-4">
        <div class="text-[14px] font-semibold text-ink mb-3">${esc(it.title)}</div>
        ${itemVizHTML(it)}
        <div class="text-[12px] text-ink3 mt-3">If you approve: <span class="text-ink2">${esc(it.done || tk.title)}</span> · Risk: <span class="text-ink2">${esc(it.risk)}</span></div>
      </section>
      <details id="cu-conf" class="group">
        <summary class="cursor-pointer list-none flex items-center gap-3 rounded-xl px-3 py-2.5 bg-sunk hover:bg-hov">
          <span class="text-[13px] font-semibold text-ink flex-1">How ${P.name} got here</span>
          <span class="text-[12px] text-ink3 inline-flex items-center gap-1">${it.steps.length} steps ${ic('chevron-down', 'w-3.5 h-3.5 transition-transform group-open:rotate-180')}</span>
        </summary>
        <ol class="pt-3 px-1 space-y-2">${it.steps.map((x, i) => `<li class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style="background:${P.col}">${i + 1}</span>${esc(x)}</li>`).join('')}</ol>
      </details>
      <div id="cu-thread" class="${tk.thread.length ? '' : 'hidden'} pt-3 border-t border-line space-y-3"></div>
    </div>
    <div class="cp-pad pt-3 pb-4 border-t border-line bg-panel shrink-0 space-y-2.5">
      <div id="cu-actions" class="flex gap-2">
        <button onclick="cuDecide('approve')" class="flex-[1.4] py-2.5 rounded-xl bg-ink hover:opacity-90 text-panel leading-tight"><span class="flex items-center justify-center gap-1.5 text-[14px] font-bold">${ic('check', 'w-4 h-4')}Approve</span><span class="block text-[11px] opacity-70 truncate px-2">${esc(it.done || '')}</span></button>
        <button onclick="cuDecide('decline')" class="flex-1 py-2.5 rounded-xl tn tn-rose text-[14px] font-semibold flex items-center justify-center gap-1.5">${ic('x', 'w-4 h-4')}Decline</button>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="group flex-1 min-w-0">
          <div id="cu-quick" class="hidden group-focus-within:flex flex-wrap gap-1.5 mb-2"></div>
          <div class="flex items-center rounded-xl bg-sunk border border-line focus-within:border-cx">
            <input id="cu-input" placeholder="Ask before deciding…" onkeydown="if(event.key==='Enter') cuAsk()" class="flex-1 min-w-0 bg-transparent px-3 py-2 text-[13px] text-ink placeholder:text-ink3 focus:outline-none">
            <button onclick="cuAsk()" class="mr-1 p-1.5 rounded-lg text-ink3 hover:bg-ink hover:text-panel">${ic('arrow-up', 'w-4 h-4')}</button>
          </div>
        </div>
        ${S.tasks.length > 1 ? `<button onclick="cuDecide('later')" class="shrink-0 text-[12px] text-ink3 hover:text-ink inline-flex items-center gap-0.5">Later ${ic('chevron-right', 'w-3.5 h-3.5')}</button>` : ''}
      </div>
    </div>
  </div>`;
}
function itemAnswer(it, q) {
  const l = q.toLowerCase(), P = PILLARS[it.pillar];
  if (/another way|alternativ|other option/.test(l)) return `A few alternatives:\n1. **Roll it out to a pilot group first** and widen after 24 hours.\n2. **Schedule it for tonight’s maintenance window** instead of now.\n3. **Keep it as a recommendation** and I’ll remind you tomorrow.`;
  if (/wait|later|if i don|what happens/.test(l)) return `Nothing breaks right away. ${it.risk.startsWith('Low') ? 'But' : 'And'} the longer this waits, the longer the gap stays open: ${it.result}`;
  if (/risk|safe|revers|undo/.test(l)) return `Risk: ${it.risk}. I can roll it back in one step if anything looks wrong.`;
  if (/why|how|evidence|sure/.test(l)) return `Here's what I did:\n${it.steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}`;
  return `Noted, I've added that to ${P.name}'s notes on ${it.id}.`;
}
