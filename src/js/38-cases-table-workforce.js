/* ======================================================================
   CASES TABLE
   ====================================================================== */
const TABS = [['all', 'All'], ['pending', 'Pending'], ['in_progress', 'In progress'], ['resolved', 'Resolved']];
const COLS = [['lifecycle', 'Status'], ['verdict', 'Verdict'], ['verdict', 'Confidence', 'col-conf'], ['name', 'Agentic investigation'], ['score', 'Score', 'col-score'], ['lifecycle', 'Open tasks'], ['open', 'Age', 'text-right']];
const VERD_RANK = { Malicious: 5, Inconclusive: 4, Running: 3, Contained: 2, Benign: 1, Closed: 0 };

const SECTIONS = [['pending', 'Pending', 'bg-amber-500', 10], ['in_progress', 'In progress', 'bg-blue-500', 6], ['resolved', 'Resolved', 'bg-cx', 6]];
function sectionData() {
  const q = S.search.toLowerCase().trim();
  let base = S.cases.filter(c => !q || c.name.toLowerCase().includes(q) || c.id.includes(q) || c.asset.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q));
  if (S.sort) {
    const { key, dir } = S.sort;
    const LR = { pending: 3, in_progress: 2, resolved: 1 };
    const val = c => key === 'lifecycle' ? LR[lifecycle(c)] : key === 'open' ? openMs(c) : key === 'verdict' ? (c.conf || 0) + VERD_RANK[c.verdict] * 1000 : c[key];
    base = [...base].sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
  }
  return SECTIONS.filter(([k]) => S.filter === 'all' || S.filter === k).map(([k, l, dot, cap]) => {
    let all = base.filter(c => lifecycle(c) === k);
    if (!S.sort) {
      if (k === 'pending') all = [...all].sort((a, b) => (b.task ? 1 : 0) - (a.task ? 1 : 0));
      if (k === 'in_progress') all = [...all].sort((a, b) => (b.id === S.agentId ? 1 : 0) - (a.id === S.agentId ? 1 : 0));
      if (k === 'resolved') all = [...all].sort((a, b) => b.updated - a.updated);
    }
    const capN = S.filter === k ? cap * 2 : cap;
    return { k, l, dot, all, capN, shown: S.showAll ? all : all.slice(0, capN) };
  });
}
function visibleCases() { return sectionData().flatMap(s => s.shown); }

function renderTabs() {
  renderPillarTabs();
  const itemQ = S.pillar && S.pillar !== 'analyst';
  const src = itemQ ? (S.items[S.pillar] || []) : S.cases;
  const n = { all: src.length, pending: 0, in_progress: 0, resolved: 0 };
  src.forEach(c => n[itemQ ? c.status : lifecycle(c)]++);
  const dot = { pending: 'bg-amber-500', in_progress: 'bg-blue-500', resolved: 'bg-cx' };
  if (!$('tab-all')) {
    $('tabs').innerHTML = TABS.map(([k, l]) => `
      <button id="tab-${k}" onclick="S.filter='${k}';renderTabs();renderTable()" class="px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition">
        ${dot[k] ? `<span class="w-1.5 h-1.5 rounded-full ${dot[k]}"></span>` : ''}${l}<span id="tabn-${k}" class="font-mono text-[11px]">0</span>
      </button>`).join('');
  }
  TABS.forEach(([k]) => {
    $('tab-' + k).className = `px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${S.filter === k ? 'bg-hov text-ink font-semibold' : 'text-ink3 hover:text-ink'}`;
    const el = $('tabn-' + k); el.classList.toggle('text-ink2', S.filter === k); el.classList.toggle('text-ink4', S.filter !== k);
    setNum(el, n[k], String, true);
  });
  let acc = 0;
  S._barPrev = S._barPrev || {};
  ['pending', 'in_progress', 'resolved'].forEach(k => {
    const w = n[k] / n.all * 100, seg = $('bar-' + k);
    seg.style.width = w + '%';
    const prev = S._barPrev[k];
    if (prev !== undefined && prev !== n[k]) {
      seg.classList.remove('seg-pop'); void seg.offsetWidth; seg.classList.add('seg-pop');
      const d = document.createElement('span'); d.className = 'bar-delta ' + ({ pending: 'c-amber', in_progress: 'c-blue', resolved: 'c-cx' })[k];
      d.textContent = (n[k] > prev ? '+' : '−') + Math.abs(n[k] - prev); d.style.left = (acc + w / 2) + '%';
      $('bar-deltas').appendChild(d); setTimeout(() => d.remove(), 1600);
    }
    S._barPrev[k] = n[k]; acc += w;
    setNum($('lg-' + k), n[k], String, true);
  });
  renderKpis();
}

function renderHead() {
  $('table-head').classList.toggle('cols', !(S.pillar && S.pillar !== 'analyst')); $('table-head').classList.toggle('icols', !!(S.pillar && S.pillar !== 'analyst'));
  if (S.pillar && S.pillar !== 'analyst') { $('table-head').innerHTML = ITEM_COLS.map(([k, l, cls]) => [k, k === 'title' ? PILLARS[S.pillar].task : l, cls]).map(([k, l, cls = '']) => `<span class="${cls} ${cls.includes('right') ? 'text-right' : ''} truncate text-[13.5px] font-normal">${l}</span>`).join(''); return; }
  $('table-head').innerHTML = COLS.map(([k, l, cls = '']) => {
    const on = S.sort && S.sort.key === k;
    return `<button onclick="sortBy('${k}')" class="${cls} text-left ${cls.includes('right') ? 'text-right' : ''} hover:text-ink truncate text-[13.5px] font-normal ${k === 'verdict' && l === 'Verdict' ? 'c-ai' : ''} ${on ? 'text-ink' : ''}">${k === 'verdict' && l === 'Verdict' ? ic('sparkles', 'w-3.5 h-3.5 inline -mt-0.5 mr-1') : ''}${l}${on ? (S.sort.dir > 0 ? ' ↑' : ' ↓') : ''}</button>`;
  }).join('');
}
function sortBy(k) {
  if (!S.sort || S.sort.key !== k) S.sort = { key: k, dir: -1 };
  else if (S.sort.dir === -1) S.sort.dir = 1;
  else S.sort = null;
  renderHead(); renderTable();
  toast(S.sort ? `Sorted by ${k}` : 'Live order, agent priority', 'arrow-up-down');
}

const verdictOf = c => c.verdict === 'Contained' ? 'Malicious' : c.verdict === 'Closed' ? 'Benign' : c.verdict;
function confRing(n, col, live) {
  const C = 2 * Math.PI * 5.5, seg = C / 3 - 2.2;
  return `<svg viewBox="0 0 14 14" width="14" height="14" class="shrink-0 ${live ? 'conf-spin' : ''}" style="transform:rotate(-90deg)">${[0, 1, 2].map(i => `<circle cx="7" cy="7" r="5.5" fill="none" stroke="${live ? '#60a5fa' : i < n ? col : 'rgb(var(--line2))'}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${seg.toFixed(2)} ${(C - seg).toFixed(2)}" stroke-dashoffset="${(-(i * C / 3) - 1.1).toFixed(2)}" ${live && i ? 'opacity=".25"' : ''}/>`).join('')}</svg>`;
}
function confBars(c) {
  const vd = verdictOf(c);
  if (vd === 'Running') return confRing(1, '#60a5fa', true);
  const col = vd === 'Malicious' ? '#f43f5e' : vd === 'Inconclusive' ? '#f59e0b' : '#00c389';
  return `<span class="inline-flex" title="${confLevel(c.conf)} confidence">${confRing(confN(c.conf), col)}</span>`;
}
function rowHTML(c) {
  const lc = lifecycle(c), agentOn = c.id === S.agentId;
  const reviewing = reviewingCaseId() === c.id;
  const viewing = !reviewing && (S.briefId === c.id || S.drawerId === c.id);
  const grey = lc === 'resolved' && !viewing && !reviewing;
  const tint = { pending: 'hover:bg-amber-400/15', in_progress: 'hover:bg-blue-500/10', resolved: 'hover:bg-emerald-500/10' }[lc];
  const status = lc === 'pending'
    ? `<span class="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md tn tn-amber text-[11px] font-semibold">${c.task ? ic('bell-ring', 'w-2.5 h-2.5') : '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>'}Pending</span>`
    : lc === 'in_progress'
    ? `<span class="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md tn tn-blue text-[11px] font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 ${agentOn ? 'animate-ping' : ''}"></span>${'In progress'}</span>`
    : `<span class="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md tn tn-cx text-[11px] font-semibold">${ic('check', 'w-2.5 h-2.5')}Resolved</span>`;
  const vd = verdictOf(c);
  const vdCol = vd === 'Malicious' ? 'c-rose' : vd === 'Inconclusive' ? 'c-amber' : vd === 'Running' ? 'c-blue' : 'c-cx';
  const scoreTn = c.score >= 85 ? 'rose' : c.score >= 65 ? 'amber' : 'slate';
  const nm = c.name.replace(new RegExp(` on ${c.host}$`), '');
  return `
  <div data-id="${c.id}" class="case-row group relative cols items-center px-3 h-[46px] text-[13.5px] cursor-pointer border-b border-line transition-colors duration-200 ${grey ? 'opacity-55 hover:opacity-100' : ''} ${reviewing ? 'bg-amber-500/10 row-review' : viewing ? 'bg-cx/10' : tint}" style="${viewing ? 'box-shadow: inset 3px 0 0 #00c389' : ''}">
    <span>${queueStatus(lc, c.task)}</span>
    <span ${tipAttr(vdTipG(c))} class="cursor-help">${vdPillG(c, true)}</span>
    <span class="col-conf inline-flex items-center gap-1.5 text-[12.5px] text-ink2">${verdictOf(c) === 'Running' ? `${confBars(c)}Building` : `${confBars(c)}${confLevel(c.conf)}`}</span>
    <span class="min-w-0 flex items-center gap-1.5">
      ${viewing ? `<span class="shrink-0 inline-flex items-center gap-1 px-1.5 rounded bg-cx text-slate-950 text-[11px] font-bold">${ic('eye', 'w-2.5 h-2.5')}VIEWING</span>` : ''}
      ${reviewing ? `<span class="shrink-0 inline-flex items-center gap-1 px-1.5 rounded tn tn-amber text-[11px] font-bold">${ic('eye', 'w-2.5 h-2.5')}REVIEWING</span>` : ''}
      <span class="truncate ${grey ? 'text-ink3' : 'text-ink'}" title="${esc(nm)}">${esc(nm)}</span>
    </span>
    <span class="col-score"><span ${tipAttr(scoreTip(c))} class="inline-flex min-w-[32px] justify-center px-1.5 py-0.5 rounded-md border border-line2 bg-sunk text-[12.5px] text-ink2 cursor-help">${c.score}</span></span>
    <span class="text-[13px] ${openTasks(c) ? (lc === 'pending' ? 'text-amber-300' : 'text-ink') : 'text-ink3'}">${openTasks(c) || '—'}</span>
    <span class="text-right text-[12.5px] text-ink3">${fmtOpen(openMs(c))}</span>
  </div>`;
}

function detailHTML(c) {
  const tk = S.tasks.find(x => x.id === c.task);
  const agentOn = S.agentId === c.id;
  let action = '';
  if (tk) action = `
    <div class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/40 flex-wrap">
      <span class="text-[11px] c-amber font-semibold flex items-center gap-1.5">${ic('bell-ring', 'w-3.5 h-3.5')} ${esc(tk.title)}</span>
      <span class="flex items-center gap-1.5">
        <button onclick="authorizeTask('${tk.id}')" class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-ink text-panel hover:opacity-90 hover:bg-cx-dark">Approve</button>
        <button onclick="declineTask('${tk.id}')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold tn tn-rose">Decline</button>
        <button onclick="openCatchup('${tk.id}')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink2 bg-panel border border-line">Discuss</button>
        <button onclick="openCaseDrawer('${c.id}')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink2 bg-panel border border-line">Full details</button>
      </span>
    </div>`;
  else if (c.verdict === 'Running') {
    const done = agentOn && c.plan ? c.planTotal - c.plan.length : 0, pct = agentOn && c.planTotal ? Math.round(done / c.planTotal * 100) : 0;
    action = `<div class="flex items-center gap-3 text-[11px] text-ink3"><div class="flex-1 h-1.5 rounded-full bg-sunk overflow-hidden"><div class="h-full bg-indigo-500 transition-all duration-700" style="width:${pct}%"></div></div>
      ${agentOn ? `<span class="font-mono">${done}/${c.planTotal} steps</span>` : `<button onclick="sendCmd('Prioritize this case')" class="c-cx font-semibold">Prioritize</button>`}</div>`;
  } else action = `<div class="flex gap-1.5">
      <button onclick="openCaseDrawer('${c.id}')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink bg-panel border border-line hover:border-cx">Full details</button>
      <button onclick="sendCmd('Why this verdict?')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink2 bg-panel border border-line hover:border-cx">Explain verdict</button>
      <button onclick="sendCmd('What is the blast radius?')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink2 bg-panel border border-line hover:border-cx">Blast radius</button>
      ${lifecycle(c) === 'pending' ? `<button onclick="sendCmd('Stage containment')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink2 bg-panel border border-line hover:border-cx">Stage action</button>` : `<button onclick="sendCmd('Reopen case')" class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-ink2 bg-panel border border-line hover:border-cx">Reopen</button>`}
    </div>`;
  return `<div class="detail-in px-4 py-3 border-b border-line bg-panel2 space-y-2.5" style="box-shadow: inset 2px 0 0 #00c389">
    <div class="text-[12px] text-ink font-semibold">${esc(c.name)}</div>
    <p class="text-[11px] text-ink2 leading-relaxed">${esc(c.summary)}</p>
    <div class="flex flex-wrap gap-1 text-[11px]">
      ${c.mitre.map(m => `<span class="tn tn-slate px-1.5 py-0.5 rounded font-mono">${m}</span>`).join('')}
      <span class="tn tn-slate px-1.5 py-0.5 rounded">${c.domain}</span>
      <span class="tn tn-slate px-1.5 py-0.5 rounded font-mono">${esc(c.asset)}</span>
      <span class="tn tn-slate px-1.5 py-0.5 rounded">${esc(c.assignee)}</span>
      ${c.conf ? `<span class="tn tn-${VERD[c.verdict].tn} px-1.5 py-0.5 rounded">${confLevel(c.conf)} confidence</span>` : ''}
    </div>
    ${action}
  </div>`;
}

function renderTable() {
  if (S.pillar && S.pillar !== 'analyst') return renderItemTable();
  const secs = sectionData();
  const box = $('table-body');
  let list = secs.flatMap(x => x.shown);
  const total = secs.reduce((a, x) => a + x.all.length, 0);
  const fkey = [S.filter, S.search, JSON.stringify(S.sort), S.showAll].join('|');
  let pending = 0;
  if (S.freeze) {
    if (!S.frozenIds || S.frozenKey !== fkey) { S.frozenIds = list.map(c => c.id); S.frozenKey = fkey; S.frozenLc = null; }
    if (!S.frozenLc) { S.frozenLc = {}; S.frozenIds.forEach(id => { const c = byId(id); if (c) S.frozenLc[id] = lifecycle(c) + (c.task ? 't' : ''); }); }
    const live = list.map(c => c.id), fz = new Set(S.frozenIds);
    const frozen = S.frozenIds.map(byId).filter(Boolean);
    pending = live.filter(id => !fz.has(id)).length + frozen.filter(c => S.frozenLc[c.id] !== lifecycle(c) + (c.task ? 't' : '')).length;
    list = frozen;
  }
  $('table-count').innerHTML = `${list.length} of ${total} investigations${pending ? ` · <button onclick="S.frozenIds=null;S.frozenLc=null;renderTable()" class="ml-1 px-2 py-0.5 rounded-full bg-ink text-panel font-sans text-[12px] font-semibold inline-flex items-center gap-1">${ic('refresh-cw', 'w-3 h-3')}${pending} update${pending === 1 ? '' : 's'}, refresh order</button>` : ''}`;
  const prev = {};
  box.querySelectorAll('.case-row').forEach(r => { prev[r.dataset.id] = r.getBoundingClientRect().top; });
  const hadRows = Object.keys(prev).length > 0;
  if (!total) { box.innerHTML = `<div class="p-10 text-center text-xs text-ink3 space-y-2">${ic('search', 'w-6 h-6 mx-auto text-ink4')}<div class="font-semibold text-ink2">No cases match</div><button onclick="S.search='';$('search-input').value='';S.filter='all';renderTabs();renderTable()" class="c-cx font-semibold">Clear search and filters</button></div>`; icons(); return; }
  const st = box.scrollTop;
  const hidden = total - list.length;
  const html = list.map(rowHTML).join('') + ((hidden > 0 || S.showAll) ? `<button data-more class="w-full py-2.5 text-[12px] font-semibold c-cx hover:bg-hov/50">${S.showAll ? 'Show fewer cases' : `Show all ${total} cases`}</button>` : '');
  if (html === S._tblHtml) { icons(); return; }          /* nothing changed, keep the DOM (and your click) intact */
  if (S._ptrDown) { clearTimeout(S._tblT); S._tblT = setTimeout(renderTable, 250); return; }  /* never swap rows mid-click */
  S._tblHtml = html;
  box.innerHTML = html;
  box.scrollTop = st;
  if (hadRows && !S.noFlip) {
    box.querySelectorAll('.case-row').forEach(r => {
      const o = prev[r.dataset.id];
      if (o === undefined) { r.classList.add('row-enter'); return; }
      const dy = o - r.getBoundingClientRect().top;
      if (Math.abs(dy) < 2) return;
      r.style.transition = 'none'; r.style.transform = `translateY(${dy}px)`;
      if (Math.abs(dy) > 45) r.classList.add('row-gliding');
      requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transition = 'transform 1100ms cubic-bezier(.22,.8,.24,1)'; r.style.transform = ''; }));
    });
  }
  S.noFlip = false;
  icons();
}

$('table-body').addEventListener('click', e => {
  const itr = e.target.closest('[data-item]'); if (itr) { showItemBrief(itr.dataset.item); return; }
  if (e.target.closest('[data-more]')) { S.showAll = !S.showAll; S.noFlip = true; renderTable(); return; }
  if (e.target.closest('[data-apply]')) { S.frozenIds = null; S.frozenLc = null; renderTable(); return; }
  const drill = e.target.closest('[data-drill]'); if (drill) { e.stopPropagation(); if (S.cu.open && drill.dataset.drill !== reviewingCaseId()) closeCatchup(); selectCase(drill.dataset.drill); openCaseDrawer(drill.dataset.drill); return; }
  const row = e.target.closest('.case-row'); if (!row) return;
  showBrief(row.dataset.id);
});

function selectCase(id, fromLog) {
  S.selectedId = id;
  renderTable(); renderCopilot();
  if (S.logScope === 'case') renderConsole(); else renderLogControls();
  if (!document.querySelector(`.case-row[data-id="${id}"]`)) { S.frozenIds = null; renderTable(); }
  const row = document.querySelector(`.case-row[data-id="${id}"]`);
  if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
}
