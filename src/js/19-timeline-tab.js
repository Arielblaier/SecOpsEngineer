/* ======================================================================
   TIMELINE TAB
   ====================================================================== */
function timelineHTML(c) {
  const m = caseModel(c), now = new Date();
  const toDate = hms => { if (!hms) return new Date(c.updated); const [h, mi, se] = hms.split(':').map(Number); const d = new Date(now); d.setHours(h, mi, se || 0, 0); if (d > now) d.setDate(d.getDate() - 1); return d; };
  const items = [];
  m.issues.forEach((i, n) => {
    items.push({ d: i.time, k: 'issue', src: 'XDR', title: 'Issue created', detail: `${i.name} was created on ${i.host}` });
    items.push({ d: new Date(i.time.getTime() + 60000 * (2 + n % 5)), k: 'grouped', src: 'Case grouping', title: 'Issues grouped', detail: `${i.name} from ${i.host} was added to the case because it involves the same ${n % 2 ? 'host' : 'user: ' + i.user}` });
  });
  const created = new Date(c.opened || c.updated);
  items.push({ d: created, k: 'case', src: 'Cortex', title: 'Case created', detail: `Case #${c.id} was created from a ${m.label.toLowerCase()} issue on ${c.host} · ${m.issues.length} issues grouped · assigned to Josh` });
  getWorklog(c).forEach(e => { const human = e.by && e.by !== 'agent'; items.push({ d: toDate(e.time), k: human ? 'analyst' : 'agent', src: human ? 'Analyst' : 'Josh (AI)', title: e.title.replace(/^Query: /, 'Query · '), detail: e.result || e.detail || '' }); });
  S.tl = S.tl || { rec: 'all', type: '', src: '', dir: -1 };
  const T0 = S.tl;
  const list = items.filter(x => (T0.rec === 'all' || x.k === 'case' || (T0.rec === 'issues' ? ['issue', 'grouped'].includes(x.k) : T0.rec === x.k)) && (!T0.type || x.title === T0.type || (T0.type === 'Agent action' && x.k === 'agent')) && (!T0.src || x.src === T0.src))
    .sort((a, b) => T0.dir < 0 ? b.d - a.d : a.d - b.d);
  const sel = (key, label, opts) => `<label class="relative inline-flex items-center rounded-lg bg-hov text-[13.5px] text-ink2"><select onchange="S.tl.${key}=this.value;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="appearance-none bg-transparent pl-3 pr-8 py-2 focus:outline-none cursor-pointer">${opts.map(([v, t]) => `<option value="${v}" ${T0[key] === v ? 'selected' : ''} style="background:#101624">${t}</option>`).join('')}</select><span class="absolute right-2.5 pointer-events-none">${ic('chevron-down', 'w-3.5 h-3.5')}</span></label>`;
  const icon = k => k === 'case' ? `<span class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#5eead4,#818cf8)">${ic('briefcase', 'w-4 h-4 text-slate-950')}</span>` : k === 'issue' ? `<span class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#e11d48">${ic('triangle-alert', 'w-4 h-4 text-white')}</span>`
    : k === 'grouped' ? `<span class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#4f6bed">${ic('shield', 'w-4 h-4 text-white')}</span>`
    : k === 'agent' ? agentMark(28) : `<span class="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500">${ic('user', 'w-4 h-4 text-white')}</span>`;
  let prev = null, rows = '';
  list.forEach((x, n) => {
    const day = x.d.toDateString();
    if (!prev) rows += `<div class="flex"><div class="w-[64px] shrink-0"></div><div class="w-7 shrink-0 flex flex-col items-center"><span class="w-2.5 h-px bg-ink3"></span><span class="w-px h-3 bg-ink3"></span></div></div>
      <div class="flex items-center"><div class="w-[64px] shrink-0"></div><div class="w-7 shrink-0 flex justify-center"><span class="text-[11.5px] text-ink2 whitespace-nowrap bg-panel px-1">${x.d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div></div>`;
    else if (prev.toDateString() !== day) { const gap = Math.max(1, Math.round(Math.abs(prev - x.d) / 86400000)); rows += `<div class="flex items-center h-10"><div class="w-[64px] shrink-0"></div><div class="w-7 shrink-0 flex flex-col items-center h-full"><span class="flex-1 w-px border-l border-dashed border-ink3/60"></span><span class="text-[11px] text-ink2 bg-panel px-1 -my-0.5">${gap} day${gap > 1 ? 's' : ''}</span><span class="flex-1 w-px border-l border-dashed border-ink3/60"></span></div></div>`; }
    rows += `<div class="flex items-stretch gap-0">
      <div class="w-[64px] shrink-0 pt-3 pr-3 text-right text-[13px] text-ink2 font-mono">${x.d.toTimeString().slice(0, 5)}</div>
      <div class="w-7 shrink-0 flex flex-col items-center"><span class="w-px h-2 bg-ink3/50"></span>${icon(x.k)}<span class="w-px flex-1 bg-ink3/50"></span></div>
      <div class="flex-1 min-w-0 pl-4 pb-2"><div class="rounded-lg px-4 py-3 ${x.k === 'case' ? 'bg-indigo-500/10 border border-indigo-400/40' : 'bg-white/[.035] hover:bg-white/[.06] border border-white/[.03]'}">
        <div class="text-[13.5px] font-semibold text-ink">${esc(x.title)}</div>
        ${x.detail ? `<div class="text-[13px] text-ink2 mt-0.5 leading-snug">${esc(x.detail)}</div>` : ''}</div></div></div>`;
    prev = x.d;
  });
  return `<div class="mt-5">
    <div class="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 border border-indigo-400/25 bg-indigo-500/[.06]">${ic('briefcase', 'w-4 h-4 c-ai')}<span class="text-[13.5px] text-ink">Case #${c.id} created <b>${fmtDate(created)}</b></span><span class="text-[13px] text-ink3">· ${m.issues.length} issues grouped since · ${fmtAgo(created.getTime())}</span></div>
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div class="space-y-2.5">
        <div>${sel('rec', '', [['all', 'All records'], ['issues', 'Issues'], ['agent', 'Agent actions'], ['analyst', 'Analyst actions']])}</div>
        <div class="flex items-center gap-2 flex-wrap">${sel('type', 'Type', [['', 'Type'], ['Case created', 'Case created'], ['Issue created', 'Issue created'], ['Issues grouped', 'Issues grouped'], ['Agent action', 'Agent action']])}${sel('src', 'Source', [['', 'Source'], ['XDR', 'XDR'], ['Case grouping', 'Case grouping'], ['Josh (AI)', 'Josh (AI)'], ['Analyst', 'Analyst']])}${sel('tag', 'Tag', [['', 'Tag']])}
          <span class="ml-4 text-[13.5px] text-ink3">Sort by</span>${sel('sort', 'Sort', [['occ', 'Occurred At']])}
          <button onclick="S.tl.dir=-S.tl.dir;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="p-2 rounded-lg bg-hov text-ink2 hover:text-ink" title="Reverse order">${ic(T0.dir < 0 ? 'arrow-down-wide-narrow' : 'arrow-up-narrow-wide', 'w-4 h-4')}</button></div>
      </div>
      <div class="flex items-center gap-2"><span class="inline-flex rounded-lg bg-hov p-0.5"><span class="p-1.5 rounded-md text-ink3">${ic('table-2', 'w-4 h-4')}</span><span class="p-1.5 rounded-md bg-panel text-ink">${ic('list-ordered', 'w-4 h-4')}</span></span>
        <button onclick="toast('Add record: coming soon','plus')" class="px-3 py-2 rounded-lg bg-hov text-ink text-[13.5px] font-semibold inline-flex items-center gap-1.5">${ic('square-plus', 'w-4 h-4')}Add Record</button></div>
    </div>
    <div class="mt-5">${rows || '<div class="text-ink3 text-[13px] py-10 text-center">No records match these filters.</div>'}</div>
  </div>`;
}
