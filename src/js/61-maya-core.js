/* ======================================================================
   MAYA · SHELL
   State, navigation, the side sheet, and the two things that bring a user
   back from a native screen: the return bar and the decisions dock.
   ====================================================================== */
let M = null;
const M_VIEWS = ['home', 'work', 'rules', 'streams', 'sources', 'insights'];
const M_NATIVE = { rules: 'Correlation Rules', streams: 'Data Streams', sources: 'Data Sources & Integrations' };
const M_NAV = [
  ['home', 'house', 'Home', 'Home'], ['work', 'sparkles', 'Workforce · Maya’s tasks', 'Tasks'], null,
  ['rules', 'file-code-2', 'Correlation Rules', 'Rules'], ['streams', 'workflow', 'Data Streams', 'Streams'], ['sources', 'cable', 'Data Sources & Integrations', 'Sources'], null,
  ['insights', 'gauge', 'Insights', 'Insights']
];
const M_USER = 'Guy R.';
const mP = () => PILLARS.engineer;
const mTask = id => M.W.tasks.find(t => t.id === id);
const mRule = id => M.W.rules.find(r => r.id === id);

function mInit() {
  M = { W: myWorld(), view: 'home', tab: 'pending', sheet: null, pivot: null, sbs: false, editing: null, review: false, chat: [], onlyOpen: false, lastDecision: null, srcOpen: null };
}

/* ---------- small shared pieces ---------- */
const mChip = (v, extra = '') => { const m = MY_VERDICT[v] || ['slate', '']; return `<span class="inline-flex items-center px-2 py-0.5 rounded-md tn tn-${m[0]} text-[12px] font-semibold whitespace-nowrap ${extra}" title="${esc(m[1])}">${esc(v)}</span>`; };
const mConf = c => { if (!c) return '<span class="text-ink4">—</span>'; const n = { High: 3, Medium: 2, Low: 1 }[c];
  return `<span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2" title="Confidence: ${c}"><span class="inline-flex items-end gap-[2px] h-3">${[1, 2, 3].map(i => `<span class="w-[3px] rounded-sm ${i <= n ? 'bg-cx' : 'bg-line2'}" style="height:${4 + i * 3}px"></span>`).join('')}</span>${c}</span>`; };
const mImpact = i => `<span class="inline-flex px-2 py-0.5 rounded-md tn tn-${{ High: 'rose', Medium: 'amber', Low: 'blue' }[i]} text-[12px] font-semibold">${i}</span>`;
const mStatusTxt = t => t.status === 'pending' ? 'Pending decision' : t.status === 'progress' ? 'In progress' : { approved: 'Approved', edited: 'Approved with edits', rejected: 'Rejected', dismissed: 'Dismissed', auto: 'Closed automatically', handed: 'Handed over', watch: 'Watching' }[t.end] || 'Done';
const mStatus = t => { const tone = t.status === 'pending' ? 'amber' : t.status === 'progress' ? 'blue' : ['rejected', 'dismissed'].includes(t.end) ? 'slate' : 'cx';
  return `<span class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold c-${tone === 'slate' ? 'blue' : tone} ${tone === 'slate' ? 'opacity-70' : ''}"><span class="w-1.5 h-1.5 rounded-full ${tone === 'amber' ? 'bg-amber-500' : tone === 'blue' ? 'bg-blue-500' : tone === 'cx' ? 'bg-cx' : 'bg-slate-400'}"></span>${mStatusTxt(t)}</span>`; };
/* Help that belongs to the product: a small info icon with a tooltip. */
const mInfo = text => `<span ${tipAttr(`<span style="color:#e5e9f2">${esc(text)}</span>`)} class="inline-flex items-center text-ink4 hover:text-ink2 cursor-help align-middle">${ic('info', 'w-3.5 h-3.5')}</span>`;
const M_VERDICT_HELP = 'Healthy: checked, nothing wrong. Broken: it cannot fire, or fires on wrong data. Noisy: it fires too much. Gap: something that should be detected is not. Mismatch: XSIAM and the source product disagree. Inconclusive: not enough evidence yet.';

/* ---------- boot ---------- */
function mBoot(skipLanding) {
  mInit();
  document.title = 'Cortex · Maya, SecOps Engineer';
  ['home', 'autonomous', 'cases', 'insights', 'anatomy'].forEach(v => { const el = $('view-' + v); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
  ['wf-offer', 'intro', 'landing'].forEach(id => { const el = $(id); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
  const main = document.querySelector('#app main');
  main.insertAdjacentHTML('beforeend', M_VIEWS.map(v => `<section id="mv-${v}" class="hidden flex-1 min-w-0 flex-col overflow-hidden bg-bg"></section>`).join(''));
  main.parentElement.insertAdjacentHTML('afterbegin', `<div id="m-return" class="hidden shrink-0"></div>`);
  document.body.insertAdjacentHTML('beforeend', `
    <div id="m-sheet-bg" class="hidden fixed inset-0 z-[44] bg-black/50" onclick="mCloseSheet()"></div>
    <aside id="m-sheet" class="hidden fixed inset-y-0 right-0 z-[45] w-[min(780px,100vw)] bg-panel border-l border-line2 shadow-2xl flex-col m-sheet-in"></aside>
    <button id="m-dock" onclick="mToDecisions()" class="hidden fixed right-5 bottom-5 z-[42] items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-panel border border-line2 shadow-2xl hover:border-amber-500/60"></button>
    <div id="m-landing" class="hidden fixed inset-0 z-[80] overflow-y-auto"></div>`);
  const rail = document.querySelector('#app aside nav');
  if (rail) rail.id = 'm-rail';
  const mt = $('mobile-tabs'); if (mt) { mt.style.gridTemplateColumns = 'repeat(6,minmax(0,1fr))'; mt.innerHTML = M_NAV.filter(Boolean).map(([v, i, l, sh]) => `<button data-mtab="${v}" onclick="mNav('${v}')" class="py-2 flex flex-col items-center gap-0.5 text-ink3">${ic(i, 'w-4 h-4')}${sh}</button>`).join(''); }
  mPatchDemoMenu();
  mNav('home');
}
function mPatchDemoMenu() {
  const menu = $('demo-menu'); if (!menu) return;
  menu.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || '';
    if (/injectIncident|showExplore|startTour|toggleShortcuts/.test(oc)) b.classList.add('hidden');
    if (/showLanding/.test(oc)) b.setAttribute('onclick', 'closeDemoMenu();mLanding()'); });
  ['demo-speed', 'core-switch'].forEach(id => { const el = $(id); if (el) { el.classList.add('hidden'); const lab = el.previousElementSibling; if (lab && id === 'demo-speed') lab.classList.add('hidden'); if (id === 'core-switch') el.parentElement.classList.add('hidden'); } });
}
function mReset() { closeDemoMenu(); mCloseSheet(); const keepView = 'home'; mInit(); mNav(keepView); toast('Demo data reset', 'rotate-ccw'); }

/* ---------- navigation ---------- */
function mNav(view, opts = {}) {
  /* Moving between native screens keeps the way back to the task. Leaving them drops it. */
  if (!opts.keepPivot && !(M.pivot && M_NATIVE[view])) M.pivot = null;
  if (M.pivot) M.pivot.view = view;
  M.view = view;
  M_VIEWS.forEach(v => { const el = $('mv-' + v); el.classList.toggle('hidden', v !== view); el.classList.toggle('flex', v === view); });
  mRender();
  const sec = $('mv-' + view); if (sec && !opts.keepScroll) { const sc = sec.querySelector('[data-scroll]'); if (sc) sc.scrollTop = 0; }
  if (M.pivot && M_NATIVE[view]) setTimeout(() => { const f = document.querySelector('#mv-' + view + ' [data-focus="1"]'); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}
function mRender() {
  ({ home: mHome, work: mWork, rules: mRules, streams: mStreams, sources: mSources, insights: mInsights })[M.view]();
  mRail(); mReturnBar(); mDock();
  if (M.sheet) mSheetRender();
  icons();
}
function mRail() {
  const el = $('m-rail'); if (!el) return;
  const n = myPendingTasks(M.W).length;
  el.innerHTML = M_NAV.map(x => x === null ? `<div class="mx-auto w-6 border-t border-line my-1"></div>` : (() => { const [v, i, l] = x, on = M.view === v;
    return `<button onclick="mNav('${v}')" title="${esc(l)}" class="relative w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${on ? 'c-cx bg-hov border border-line2' : 'text-ink3 hover:text-ink hover:bg-hov/60'}">${ic(i, 'w-4 h-4')}${v === 'work' && n ? `<span class="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10.5px] font-bold flex items-center justify-center">${n}</span>` : ''}</button>`; })()).join('');
  document.querySelectorAll('#mobile-tabs [data-mtab]').forEach(b => b.className = `py-2 flex flex-col items-center gap-0.5 ${b.dataset.mtab === M.view ? 'c-cx font-semibold' : 'text-ink3'}`);
}

/* ---------- pivot out, and the way back ---------- */
function mPivot(taskId, view) {
  M.pivot = { task: taskId, view, from: M.view === 'home' ? 'home' : 'work' };
  M.sheet = null; mSheetShow(false);
  if (view === 'sources') { const t = mTask(taskId); M.srcOpen = t && t.affects.source && M.W.sources.some(s => s.id === t.affects.source) ? t.affects.source : null; }
  mNav(view, { keepPivot: true });
  if (view === 'sources' && M.srcOpen) mOpenSource(M.srcOpen);
}
function mPivotFocus(kind, key) {
  if (!M.pivot) return false; const t = mTask(M.pivot.task); if (!t) return false;
  if (kind === 'rule') return (t.affects.rules || []).includes(key);
  if (kind === 'node') return !!t.affects.node && t.affects.node.pipe === key.pipe && t.affects.node.stage === key.stage;
  if (kind === 'source') return t.affects.source === key;
  if (kind === 'instance') return t.affects.instance === key;
  return false;
}
function mBackToTask() { const id = M.pivot && M.pivot.task; M.review = true; mNav('work'); if (id) mOpenTask(id); }
function mToDecisions() { M.tab = 'pending'; mCloseSheet(); mNav('work'); }
function mReturnBar() {
  const el = $('m-return'); if (!el) return;
  const p = M.pivot, t = p && mTask(p.task);
  if (!t || !M_NATIVE[M.view]) { el.classList.add('hidden'); el.innerHTML = ''; return; }
  const left = myPendingTasks(M.W).filter(x => x.id !== t.id).length;
  const waiting = t.status === 'pending', tone = waiting ? 'amber' : t.status === 'progress' ? 'blue' : 'cx';
  const msg = waiting ? 'This decision is still waiting for you' : t.status === 'progress' ? esc(t.progressNote || 'In progress') : esc(mStatusTxt(t)) + '. Nothing more is needed here';
  el.className = `shrink-0 m-return m-return-${tone}`;
  el.innerHTML = `<div class="flex items-center gap-3 px-4 py-2.5 flex-wrap">
    ${agentAv(mP(), 26, false)}
    <div class="min-w-0 flex-1">
      <div class="text-[11.5px] text-ink3 flex items-center gap-1.5 flex-wrap"><button onclick="mToDecisions()" class="hover:text-ink">Workforce</button>${ic('chevron-right', 'w-3 h-3')}<button onclick="mBackToTask()" class="font-mono hover:text-ink">${t.id}</button>${ic('chevron-right', 'w-3 h-3')}<span class="text-ink2">${M_NATIVE[M.view]}</span></div>
      <div class="text-[13.5px] text-ink truncate"><b class="font-semibold">${esc(t.title)}</b> <span class="c-${tone}">· ${msg}</span></div>
    </div>
    ${waiting ? `<button onclick="mOpenTask('${t.id}')" class="px-3 py-2 rounded-xl border border-line2 text-ink text-[13px] font-semibold hover:bg-hov inline-flex items-center gap-1.5">${ic('panel-right-open', 'w-4 h-4')}Decide here</button>` : ''}
    <button onclick="mBackToTask()" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 hover:opacity-90">${ic('corner-up-left', 'w-4 h-4')}Back to the task</button>
    ${left ? `<button onclick="mToDecisions()" class="text-[12.5px] text-ink2 hover:text-ink inline-flex items-center gap-1"><span class="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold inline-flex items-center justify-center">${left}</span>more decision${left === 1 ? '' : 's'}</button>` : ''}
    <button onclick="M.pivot=null;mRender()" class="p-1.5 rounded-lg hover:bg-hov text-ink3" title="Stay here and hide this bar">${ic('x', 'w-4 h-4')}</button>
  </div>`;
}
/* On a native screen with no pivot, the dock is the way back to the decisions. */
function mDock() {
  const el = $('m-dock'); if (!el) return;
  const n = myPendingTasks(M.W).length, show = !!M_NATIVE[M.view] && !M.pivot && !M.sheet;
  el.classList.toggle('hidden', !show); el.classList.toggle('flex', show);
  if (show) el.innerHTML = `${agentAv(mP(), 30)}<span class="text-left leading-tight"><span class="block text-[13px] font-bold text-ink">${n ? `${n} decision${n === 1 ? '' : 's'} waiting` : 'Nothing is waiting for you'}</span><span class="block text-[11.5px] text-ink3">Back to Maya’s tasks</span></span>${ic('arrow-right', 'w-4 h-4 text-ink3')}`;
}

/* ---------- the side sheet: a task, a rule, a pipeline step or a source ---------- */
function mSheetShow(on) { ['m-sheet', 'm-sheet-bg'].forEach(id => $(id).classList.toggle('hidden', !on)); $('m-sheet').classList.toggle('flex', on); }
function mOpenSheet(s) { if (M.lastDecision && !(s.kind === 'task' && s.id === M.lastDecision.id)) M.lastDecision = null; M.sheet = s; M.editing = null; mSheetShow(true); mSheetRender(); mDock(); const sc = $('m-sheet-scroll'); if (sc) sc.scrollTop = 0; icons(); }
function mCloseSheet() { if (!M || !M.sheet) return; M.sheet = null; M.review = false; M.editing = null; mSheetShow(false); mRender(); }
function mSheetRender() {
  const s = M.sheet; if (!s) return;
  const el = $('m-sheet'), sc = $('m-sheet-scroll'), top = sc ? sc.scrollTop : 0;
  el.innerHTML = ({ task: mTaskSheet, rule: mRuleSheet, node: mNodeSheet, source: mSourceSheet })[s.kind](s);
  const sc2 = $('m-sheet-scroll'); if (sc2) sc2.scrollTop = top;
}
const mOpenTask = id => mOpenSheet({ kind: 'task', id });
const mOpenRule = id => mOpenSheet({ kind: 'rule', id });
const mOpenNode = (pipe, stage) => mOpenSheet({ kind: 'node', pipe, stage });
const mOpenSource = id => mOpenSheet({ kind: 'source', id });
const mSheetHead = (crumb, title, sub = '') => `<div class="px-5 pt-4 pb-3 border-b border-line shrink-0 flex items-start gap-3">
  <div class="min-w-0 flex-1"><div class="text-[11.5px] text-ink3">${crumb}</div><div class="text-[19px] font-bold text-ink leading-snug mt-0.5">${title}</div>${sub}</div>
  <button onclick="mCloseSheet()" class="p-2 -mr-1 rounded-lg hover:bg-hov text-ink2" title="Close (Esc)">${ic('x', 'w-5 h-5')}</button></div>`;

/* ---------- keyboard ---------- */
function mKey(e) {
  const lp = $('m-landing'); if (lp && !lp.classList.contains('hidden')) { if (e.key === 'Enter' || e.key === 'Escape') mLandingClose(); return; }
  if (e.target.matches && e.target.matches('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') { closeDemoMenu(); if (M.sheet) mCloseSheet(); else if (M.pivot) mBackToTask(); return; }
  if (k === 't') return toggleTheme();
  if (k === 'c') return mReviewAll();
  if (M.sheet && M.sheet.kind === 'task') { const t = mTask(M.sheet.id); if (t && t.status === 'pending' && !M.editing) { if (k === 'a') return mDecide(t.id, 'approve'); if (k === 'd') return mDecide(t.id, 'reject'); } }
}
