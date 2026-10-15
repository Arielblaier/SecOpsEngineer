/* ======================================================================
   SECOPS ENGINEERING · SHELL
   State, the two agents, navigation, the docked agent panel, and the two
   things that bring a user back from a native screen: the return bar and
   the decisions dock.
   ====================================================================== */
let M = null;
const M_VIEWS = ['home', 'work', 'rules', 'iocs', 'streams', 'sources', 'mitre', 'insights'];
const M_NATIVE = { rules: 'Correlation Rules', iocs: 'IOC Rules', streams: 'Data Streams', sources: 'Data Sources & Integrations', mitre: 'MITRE ATT&CK Coverage' };
const M_NAV = [
  ['home', 'house', 'Home', 'Home'], ['work', 'sparkles', 'Missions', 'Missions'], null,
  ['rules', 'file-code-2', 'Correlation Rules', 'Rules'], ['iocs', 'fingerprint', 'IOC Rules', 'IOCs'], ['streams', 'workflow', 'Data Streams', 'Streams'], ['sources', 'cable', 'Data Sources & Integrations', 'Sources'], ['mitre', 'grid-3x3', 'MITRE ATT&CK Coverage', 'ATT&CK'], null,
  ['insights', 'gauge', 'Insights', 'Insights']
];
const M_USER = 'Ariel B.';
/* Seconds between new triggers while the demo is open. ?live=10 makes it faster. */
const M_LIVE_GAP = (() => { try { const v = +new URLSearchParams(location.search).get('live'); return v > 0 ? v * 1000 : 60000; } catch (e) { return 60000; } })();

/* ---------- the agents ---------- */
const M_AG = {
  sec: { name: 'SecOps', role: 'Detections and the data behind them', c: ['#3ee6a0', '#36d4ea', '#7ff7d6'], hex: '#10b981' },
  det: { name: 'Detection Engineer', role: 'Rules, indicators and coverage', c: ['#8b5cf6', '#c4b5fd', '#c4b5fd'], hex: '#8b5cf6' },
  inv: { name: 'Investigation Agent', role: 'Triage and investigation', c: ['#3b82f6', '#7dd3fc', '#93c5fd'], hex: '#3b82f6' },
  hunt: { name: 'Threat Hunter agent', role: 'Hunts and findings', c: ['#f97316', '#fdba74', '#fdba74'], hex: '#f97316' }
};
const M_FROM = { analyst: 'inv', hunter: 'hunt', det: 'det' };
function mAv(k, size = 24, live = false) {
  const a = M_AG[k] || M_AG.det, d = Math.max(6, Math.round(size * .2));
  return `<span class="relative inline-flex shrink-0" style="width:${size}px;height:${size}px" title="${esc(a.name)}">${robotSVG(size, a.c[0], a.c[1], a.c[2])}${live ? `<span class="absolute rounded-full" style="width:${d}px;height:${d}px;right:${Math.round(size * .02)}px;bottom:${Math.round(size * .08)}px;background:#4DFFA6;box-shadow:0 0 0 2px rgb(var(--panel)), 0 0 8px #4DFFA6"></span>` : ''}</span>`;
}
/* One agent owns a mission. When the cause is in the other agent's area, a second mission is opened and the first waits on it. */
const mTaskAgents = t => [t.agent || 'det'];
const mAvs = (t, size = 22) => mAv(t.agent || 'det', size);

const mTask = id => M.W.tasks.find(t => t.id === id);
const mRule = id => M.W.rules.find(r => r.id === id) || M.W.suggested.find(r => r.id === id);

function mInit() {
  if (M) mLiveStop();
  M = { W: myWorld(), view: 'home', tab: 'needs', q: '', sheet: null, pivot: null, panelOpen: false, panelTask: null, panelObj: null, deck: null, logOpen: false, sbs: false, editing: null, chats: { _: [] }, more: {}, typing: null, onlyOpen: false, iocAll: false, lastDecision: null, timers: [], prev: {},
    /* the workspace: panel size per kind of screen, who the next message is for, the open chat, the quick switcher */
    size: { work: 'work', native: 'side' }, pct: { work: 40, native: 34 }, leftPx: 300, artPct: 56, artFold: false, fType: '', fSrc: '', sort: 'impact', railOff: false, chatKey: '_', to: 'sec', sel: false, menu: false, people: false, scn: null, scnBar: false };
  mWsSeed();
  mLiveStart();
}

/* ---------- small shared pieces ---------- */
/* The AI suggestion: what the agent proposes to do. With a mission, the chip opens that mission in the agent panel. */
function mSug(s, o = {}) {
  if (!s) return '<span class="text-ink4">—</span>';
  const m = MY_SUGGEST[s] || ['slate', ''], t = o.task;
  if (s === 'Keep' && !o.solid) return `<span class="inline-flex items-center gap-1 text-[12.5px] text-ink3 whitespace-nowrap" title="${esc(m[1])}">${ic('check', 'w-3.5 h-3.5 c-cx')}Keep</span>`;
  const chip = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md tn tn-${m[0]} text-[12px] font-semibold whitespace-nowrap ${o.declined ? 'opacity-60' : ''}" title="${esc(o.declined ? 'Declined' + (o.declined.reason ? ': ' + myDeclTxt(o.declined) : '') : m[1])}">${esc(s)}${o.declined ? ' · ' + (o.declined.reason ? esc(M_DECL[o.declined.reason][0].toLowerCase()) : 'declined') : ''}${t ? ic('chevron-right', 'w-3 h-3 opacity-70') : ''}</span>`;
  return t ? `<button onclick="event.stopPropagation();mOpenTask('${t.id}')" class="hover:brightness-125" data-sug="${t.id}">${chip}</button>` : chip;
}
const mConf = c => { if (!c) return '<span class="text-ink4">—</span>'; const n = { High: 3, Medium: 2, Low: 1 }[c];
  return `<span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2" title="Confidence: ${c}"><span class="inline-flex items-end gap-[2px] h-3">${[1, 2, 3].map(i => `<span class="w-[3px] rounded-sm ${i <= n ? 'bg-cx' : 'bg-line2'}" style="height:${4 + i * 3}px"></span>`).join('')}</span>${c}</span>`; };
const mImpact = i => `<span class="inline-flex px-2 py-0.5 rounded-md tn tn-${{ High: 'rose', Medium: 'amber', Low: 'blue' }[i]} text-[12px] font-semibold">${i}</span>`;
const mStatusTxt = t => { const st = myState(t); if (st === 'done') return myEndTxt(t);
  if (st === 'waiting') return t.waitOn ? 'Waiting on ' + t.waitOn : 'Waiting on another team'; if (st === 'running') return 'Running'; if (st === 'blocked') return 'Blocked · partly applied'; return 'Needs you'; };
const mStatus = t => { const st = myState(t), tone = st === 'done' ? (['rejected', 'cancelled', 'nothing'].includes(t.end) ? 'slate' : 'cx') : M_STATE[st][1];
  const dot = `<span class="w-1.5 h-1.5 rounded-full shrink-0 ${{ amber: 'bg-amber-500', blue: 'bg-blue-500 animate-pulse', indigo: 'bg-indigo-400', rose: 'bg-rose-500', cx: 'bg-cx', slate: 'bg-slate-400' }[tone]}"></span>`;
  const short = M_STATE[st][0];
  return `<span class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap ${tone === 'slate' ? 'text-ink3' : 'c-' + tone}" title="${esc(mStatusTxt(t))}">${dot}${esc(short)}</span>`; };
/* Who a pending mission is pending on: a person, or the agent that owns the mission it waits on. */
const mPendingOn = t => { if (t.status === 'done') return `<span class="block text-[11px] text-ink3 whitespace-nowrap pl-3 truncate">${esc(myEndTxt(t).toLowerCase())}</span>`; if (t.status === 'progress' && t.handed) return `<span class="block text-[11px] text-ink3 whitespace-nowrap pl-3">on another team</span>`; if (t.status !== 'pending') return ''; const o = t.waitOn && mTask(t.waitOn); return o ? `<span class="flex items-center gap-1 text-[11px] c-indigo font-semibold whitespace-nowrap">${mAv(o.agent, 14)}on the ${M_AG[o.agent].name}</span>` : `<span class="block text-[11px] text-ink3 whitespace-nowrap pl-3">on you</span>`; };
/* Help that belongs to the product: a small info icon with a tooltip. */
const mInfo = text => `<span ${tipAttr(`<span style="color:#e5e9f2">${esc(text)}</span>`)} class="inline-flex items-center text-ink4 hover:text-ink2 cursor-help align-middle">${ic('info', 'w-3.5 h-3.5')}</span>`;
const M_SUG_HELP = Object.entries(MY_SUGGEST).map(([k, v]) => `${k}: ${v[1]}.`).join(' ');
const mSugHead = () => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="c-indigo">${ic('sparkles', 'w-3 h-3')}</span>AI suggestion ${mInfo(M_SUG_HELP)}</span>`;
const mFromName = t => t.trigger.from ? M_AG[M_FROM[t.trigger.from]].name : '';

/* ---------- boot ---------- */
function mBoot() {
  mInit();
  document.title = 'Cortex · SecOps';
  ['home', 'autonomous', 'cases', 'insights', 'anatomy'].forEach(v => { const el = $('view-' + v); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
  ['wf-offer', 'intro', 'landing'].forEach(id => { const el = $(id); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
  const main = document.querySelector('#app main');
  main.insertAdjacentHTML('beforeend', M_VIEWS.map(v => `<section id="mv-${v}" class="hidden flex-1 min-w-0 flex-col overflow-hidden bg-bg"></section>`).join('') + `
    <aside id="m-panel" class="hidden m-panel shrink-0 border-l border-line overflow-hidden">
      <div id="m-drag" class="hidden m-drag" onpointerdown="mDragStart(event,mDocked()?'dock':mSize()==='work'?'full':'panel')" title="Drag to change the width of the panel"><span></span></div><div id="m-drag-pct" class="hidden m-drag-pct"></div>
      <div id="m-ws-rail" class="hidden relative w-[280px] shrink-0 flex-col border-r border-line overflow-hidden"></div>
      <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div class="flex-1 min-h-0 flex overflow-hidden">
          <div id="m-conv" class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div id="m-panel-head" class="px-4 sm:px-5 h-12 flex items-center justify-between gap-3 shrink-0"></div>
            <div id="m-people" class="hidden shrink-0 border-b border-line"></div>
            <div id="m-panel-scroll" class="flex-1 overflow-y-auto px-4 sm:px-5 py-4"></div>
            <div id="m-foot" class="px-4 pb-4 pt-3 shrink-0 space-y-2.5">
              <div id="m-panel-acts"></div>
              <div id="m-say" class="relative"></div>
              <div class="flex items-center gap-2">
                <div id="m-cmd-box" class="flex-1 min-w-0 flex items-center rounded-2xl bg-sunk border border-line focus-within:border-cx transition">
                  <button id="m-to" type="button" onclick="M.sel=!M.sel;M.menu=false;mPanelRender();icons()" class="ml-1.5 shrink-0 pl-1.5 pr-2 py-1 rounded-xl inline-flex items-center gap-1.5 text-[12.5px] text-ink2 hover:bg-hov" title="Who answers"></button>
                  <input type="text" id="m-cmd" autocomplete="off" placeholder="Give a command…" onkeydown="if(event.key==='Enter')mSend()" class="flex-1 min-w-0 bg-transparent text-[13.5px] px-2.5 py-3 text-ink placeholder:text-ink4 focus:outline-none">
                  <button onclick="mSend()" class="mr-1.5 p-2 rounded-xl text-ink3 hover:text-slate-950 hover:bg-cx" title="Send">${ic('arrow-up', 'w-4 h-4')}</button>
                </div>
              </div>
              <div id="m-hint" class="text-[11.5px] text-ink4 px-1 empty:hidden"></div>
            </div>
          </div>
          <div id="m-art" class="hidden w-[52%] shrink-0 flex-col border-l border-line overflow-hidden relative"><div id="m-art-drag" class="m-drag" onpointerdown="mDragStart(event,'art')" title="Drag to share the space between the mission and the chat"><span></span></div>
            <div id="m-art-head" class="px-5 h-12 flex items-center justify-between gap-3 shrink-0 border-b border-line/70"></div>
            <div id="m-art-scroll" class="flex-1 overflow-y-auto px-6 sm:px-8 py-5"></div>
            <div id="m-art-acts" class="px-6 sm:px-8 pb-5 pt-3 shrink-0 empty:hidden"></div>
          </div>
        </div>
      </div>
    </aside>`);
  main.parentElement.insertAdjacentHTML('afterbegin', `<div id="m-scn" class="hidden shrink-0"></div><div id="m-return" class="hidden shrink-0"></div>`);
  document.body.insertAdjacentHTML('beforeend', `
    <div id="m-sheet-bg" class="hidden fixed inset-0 z-[44] bg-black/50" onclick="mCloseSheet()"></div>
    <aside id="m-sheet" class="hidden fixed inset-y-0 right-0 z-[45] w-[min(780px,100vw)] bg-panel border-l border-line2 shadow-2xl flex-col m-sheet-in"></aside>
    <button id="m-dock" onclick="mDockGo()" class="hidden fixed right-5 bottom-5 z-[42] items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-panel border border-line2 shadow-2xl hover:border-amber-500/60"></button>
    <button id="m-agx" onclick="mAgxGo()" class="hidden fixed top-1 right-1 z-[46] w-8 h-8 rounded-full items-center justify-center bg-bg hover:bg-hov" title="AgentiX"></button>`);
  const rail = document.querySelector('#app aside nav');
  if (rail) rail.id = 'm-rail';
  const mt = $('mobile-tabs'); if (mt) { mt.style.gridTemplateColumns = 'repeat(8,minmax(0,1fr))'; mt.innerHTML = M_NAV.filter(Boolean).map(([v, i, l, sh]) => `<button data-mtab="${v}" onclick="mNav('${v}')" class="py-2 flex flex-col items-center gap-0.5 text-ink3">${ic(i, 'w-4 h-4')}${sh}</button>`).join(''); }
  mPatchDemoMenu(); mScnMenu();
  /* The signed-in user, and a reset button that is always in reach. */
  const me = document.querySelector('#app aside [title^="Guy"]');
  if (me) { me.title = 'Ariel B. (SecOps Lead)'; me.textContent = 'AB'; me.insertAdjacentHTML('beforebegin', `<button id="m-reset" onclick="location.reload()" class="w-10 h-10 rounded-xl hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Reset the demo (R)">${ic('rotate-ccw', 'w-4 h-4')}</button>`); }
  window.addEventListener('resize', () => { if (M) mPanelShow(); });
  /* Missions is the detection engineer's home, so the demo starts there. */
  mNav('work');
  mScnFromUrl();
}
function mPatchDemoMenu() {
  const menu = $('demo-menu'); if (!menu) return;
  menu.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || '';
    if (/showExplore|startTour|toggleShortcuts|showLanding/.test(oc)) b.classList.add('hidden');
    if (/injectIncident/.test(oc)) { b.setAttribute('onclick', 'closeDemoMenu();mArriveNext()'); b.innerHTML = `${ic('zap', 'w-3.5 h-3.5')} Send a new trigger now`; } });
  ['demo-speed', 'core-switch'].forEach(id => { const el = $(id); if (el) { el.classList.add('hidden'); const lab = el.previousElementSibling; if (lab && id === 'demo-speed') lab.classList.add('hidden'); if (id === 'core-switch') el.parentElement.classList.add('hidden'); } });
}
function mReset() { location.reload(); }

/* ---------- new triggers arrive while the screen is open ---------- */
/* Gentle, not a firehose: a pack update arrives, a threshold the agent watches fills up and starts a mission
   when it is reached (the 7th benign issue in 7 days), and the weekly IOC sweep runs. */
function mLiveStart() {
  const at = id => M.W.incoming.findIndex(t => t.id === id);
  M.watch = [{ id: 'w1', label: 'Rule 237 · benign issues, 7 days', n: 4, max: 7, inc: 'MSN-1010' }];
  M.timers.push(setTimeout(() => mArrive(at('MSN-1009')), M_LIVE_GAP));
  const iv = setInterval(() => { const w = M.watch.find(x => !x.done); if (!w) return clearInterval(iv);
    w.n++; M.W.log.unshift({ t: Date.now(), kind: 'check', text: `Rule 237: issue ${w.n} of 7 closed as benign this week` });
    if (w.n >= w.max) { w.done = true; mArrive(at(w.inc)); } else mRender(); }, M_LIVE_GAP * .45);
  M.timers.push(iv);
  M.timers.push(setTimeout(() => mArrive(at('MSN-1011')), M_LIVE_GAP * 2.6));
}
function mLiveStop() { (M.timers || []).forEach(x => { clearTimeout(x); clearInterval(x); }); M.timers = []; }
function mArrive(n) {
  if (n < 0) return; const t = myArrive(M.W, n); if (!t) return;
  t.live = true; t.shown = 1;
  (M.watch || []).filter(w => w.inc === t.id).forEach(w => { w.done = true; w.n = w.max; });
  toast(`${MY_TRIGGER[t.trigger.kind][0]} · ${t.id} started`, t.trigger.kind === 'threshold' ? 'gauge' : 'zap');
  mRender();
  /* The agent works through its steps, then asks for a decision. */
  const stepMs = Math.min(20000, M_LIVE_GAP / 3) / t.steps.length;
  const iv = setInterval(() => {
    t.shown++;
    if (t.shown <= t.steps.length) M.W.log.unshift({ t: Date.now(), kind: 'step', text: `${t.id}: ${t.steps[t.shown - 1]}` });
    if (t.shown >= t.steps.length) { clearInterval(iv); myReady(M.W, t); toast(`${t.id} needs you: a decision is ready`, 'bell-ring'); }
    mRender();
  }, stepMs);
  M.timers.push(iv);
}
/* A mission that was unblocked checks its detection, then closes itself. */
function mResume() {
  /* A fix sent to another team: in the demo the team applies it a few seconds later. */
  M.W.tasks.filter(t => t.handed && t.teamAuto && t.status === 'progress' && !t.teamTimer).forEach(t => { t.teamTimer = true;
    M.timers.push(setTimeout(() => { myTeamApplied(M.W, t); toast(`${t.id}: the ${t.teamFix} applied the fix. Checking the detection`, 'user-check'); mResume(); mRender(); }, 4000)); });
  M.W.tasks.filter(t => t.resume && !t.resumeTimer).forEach(t => { t.resumeTimer = true;
    M.timers.push(setTimeout(() => { myResolve(M.W, t); toast(`${t.id} closed automatically: the detection works again`, 'circle-check'); mRender(); }, 5000)); });
}
function mArriveNext() { const n = M.W.incoming.findIndex(t => !M.W.tasks.includes(t)); if (n < 0) return toast('No more triggers in this demo', 'check'); mArrive(n); }

/* ---------- navigation ---------- */
function mNav(view, opts = {}) {
  /* Moving between native screens keeps the way back to the mission. Leaving them drops it. */
  if (!opts.keepPivot && !(M.pivot && M_NATIVE[view])) M.pivot = null;
  if (M.pivot) M.pivot.view = view;
  if (view === 'home') { M.panelOpen = false; M.panelTask = null; M.panelObj = null; M.deck = null; M.editing = null; }
  /* The panel follows the user. A mission stays in it only on the missions screen or while following a pivot. */
  const dropTask = !M.pivot && view !== M.view && (view !== 'work' ? !!(M.panelTask || M.panelObj) : !!M.panelObj);
  if (dropTask) { M.panelTask = null; M.panelObj = null; M.deck = null; M.editing = null; }
  M.view = view;
  M_VIEWS.forEach(v => { const el = $('mv-' + v); el.classList.toggle('hidden', v !== view); el.classList.toggle('flex', v === view); });
  const sec = $('mv-' + view); if (sec && !opts.keepScroll) sec.dataset.top = '1';
  mRender();
  if (dropTask) mScrollInit();
  if (M.pivot && M_NATIVE[view]) setTimeout(() => { const f = document.querySelector('#mv-' + view + ' [data-focus="1"]'); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}
/* Every render keeps what the user is typing and where they have scrolled. New triggers re-render at any moment. */
function mRender() {
  const sec = $('mv-' + M.view), sc = sec.querySelector('[data-scroll]'), top = sec.dataset.top ? 0 : sc ? sc.scrollTop : 0, left = sc ? sc.scrollLeft : 0;
  delete sec.dataset.top;
  const keep = [...document.querySelectorAll('[data-keep]')].map(el => [el.id, el.value, document.activeElement === el, el.selectionStart]);
  ({ home: mHome, work: mWork, rules: mRules, iocs: mIocs, streams: mStreams, sources: mSources, mitre: mMitre, insights: mInsights })[M.view]();
  mRail(); mReturnBar(); mPanelRender(); mDock();
  if (M.sheet) mSheetRender();
  const sc2 = sec.querySelector('[data-scroll]'); if (sc2) { sc2.scrollTop = top; sc2.scrollLeft = left; }
  keep.forEach(([id, v, focus, pos]) => { const el = id && $(id); if (!el) return; el.value = v; if (focus) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } });
  icons();
  mAnimate();
}
/* Bars and rings move from their last value to the new one. */
function mAnimate() {
  document.querySelectorAll('[data-anim]').forEach(el => { const k = el.dataset.anim, to = el.dataset.to, prop = el.dataset.prop || 'width', from = M.prev[k];
    el.style.transition = 'none'; if (from !== undefined) el.style[prop] = from; else if (prop === 'width') el.style.width = '0%';
    el.getBoundingClientRect(); if (from !== to) el.style.transition = '';
    el.style[prop] = to; M.prev[k] = to; });
}
function mRail() {
  const el = $('m-rail'); if (!el) return;
  const n = myPendingTasks(M.W).length;
  el.innerHTML = M_NAV.map(x => x === null ? `<div class="mx-auto w-6 border-t border-line my-1"></div>` : (() => { const [v, i, l] = x, on = M.view === v;
    return `<button onclick="mNav('${v}')" title="${esc(l)}" class="relative w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${on ? 'c-cx bg-hov border border-line2' : 'text-ink3 hover:text-ink hover:bg-hov/60'}">${ic(i, 'w-4 h-4')}${v === 'work' && n ? `<span class="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10.5px] font-bold flex items-center justify-center">${n}</span>` : ''}</button>`; })()).join('');
  document.querySelectorAll('#mobile-tabs [data-mtab]').forEach(b => b.className = `py-2 flex flex-col items-center gap-0.5 ${b.dataset.mtab === M.view ? 'c-cx font-semibold' : 'text-ink3'}`);
}

/* ---------- the agent panel: one panel, three sizes ----------
   Closed: the screen and its dashboards. Side: a narrow panel next to a native screen, where the working object is in the table.
   Workspace: the panel covers the screen, because the working object (the mission) lives in the panel. */
const mWide = () => window.innerWidth >= 1024;
const mPanelOn = () => M.view !== 'home' && M.panelOpen;
const mSizeKey = () => M.view === 'work' ? 'work' : 'native';
/* On the Missions screen AgentiX docks next to the table, like Claude: the table is the left column and keeps
   only the AI suggestion and the name when AgentiX takes the room. One width (the missions column) sets everything:
   wide AgentiX shows the mission and the chat side by side, narrow AgentiX stacks them. */
const mDocked = () => !!M && M.view === 'work' && mWide();
const mMainW = () => { const m = document.querySelector('#app main'); return m ? m.clientWidth : window.innerWidth; };
const M_RAIL = 300, M_TWO = 860;
const mDockPx = () => M.railOff ? mMainW() : Math.max(0, mMainW() - M.leftPx);
const mSize = () => !mWide() ? 'work' : mDocked() ? (mDockPx() >= M_TWO ? 'work' : 'side') : M.size[mSizeKey()];
/* F: on Missions it moves between the missions list with a wide AgentiX and the table with a narrow AgentiX. */
function mSizeToggle() {
  if (mDocked()) { M.railOff = false; M.leftPx = M.leftPx <= M_RAIL + 80 ? Math.round(mMainW() * .62) : M_RAIL; }
  else M.size[mSizeKey()] = mSize() === 'work' ? 'side' : 'work';
  mRender(); mScrollInit();
}
/* How wide the panel is in pixels. The side panel shows the full mission card from 560px, and the short card below that. */
function mPanelPx() { if (mDocked()) return mDockPx(); const w = mMainW();
  return mSize() === 'work' ? w : Math.max(420, w * M.pct[mSizeKey()] / 100); }
function mPanelShow() { const el = $('m-panel'), on = mPanelOn(), sz = mSize(), dk = mDocked(); el.classList.toggle('hidden', !on); el.classList.toggle('flex', on);
  el.classList.toggle('m-panel-work', sz === 'work'); el.classList.toggle('m-panel-side', sz !== 'work'); el.classList.remove('m-panel-split');
  el.classList.toggle('m-dock', dk); el.classList.toggle('m-two', dk && sz === 'work');
  if (dk) { const w = M.railOff ? '100%' : `calc(100% - ${M.leftPx}px)`;
    /* It opens from the side: AgentiX grows from the right edge and pushes the table until only the names are left. */
    if (on && !el.dataset.shown) { el.style.width = '0px'; el.getBoundingClientRect(); }
    el.style.width = w; }
  else el.style.width = sz !== 'work' && mWide() ? M.pct[mSizeKey()] + '%' : '';
  el.dataset.shown = on ? '1' : '';
  if (sz !== 'work' || dk) el.style.left = '';
  const wk = $('mv-work'); if (wk) { wk.classList.toggle('m-railoff', dk && on && !!M.railOff); wk.classList.toggle('m-docked', dk && on); }
  const h = $('m-drag'); if (h) h.classList.toggle('hidden', !(on && mWide() && (dk || sz !== 'work' || M.railOff)));
  const art = $('m-art'); if (art) { art.classList.toggle('m-art-fold', !!M.artFold); art.style.width = M.artFold ? '' : M.artPct + '%'; } }
/* Drag a divider. Three dividers, one rule each:
   - between the mission and the chat (full view): the chat can take up to 90%; below that the mission folds to a strip that only opens it back;
   - between the missions and AgentiX (full view): drag right and AgentiX shrinks; release under 78% and the Missions table comes back, with AgentiX as a side panel;
   - the side panel's left edge: 30% to 70%; drag past 78% and release, and it becomes the full view again. */
function mDragStart(e, what) {
  const key = mSizeKey(), lab = $('m-drag-pct'), main = document.querySelector('#app main'); if (!main) return;
  e.preventDefault(); document.body.classList.add('m-dragging');
  const show = t => { if (lab) { lab.textContent = t; lab.classList.remove('hidden'); } };
  let move, up, pct;
  if (what === 'art') {
    const el = $('m-art'), r = el.parentElement.getBoundingClientRect(); pct = M.artFold ? 0 : M.artPct; el.classList.remove('m-art-fold');
    move = ev => { pct = Math.max(0, Math.min(72, Math.round((ev.clientX - r.left) / r.width * 100))); const fold = pct < 14;
      el.style.width = fold ? '46px' : Math.max(22, pct) + '%'; show(fold ? 'Chat 90% · the mission folds to a strip' : `Mission ${Math.max(22, pct)}% · chat ${100 - Math.max(22, pct)}%`); };
    up = () => { M.artFold = pct < 14; if (!M.artFold) M.artPct = Math.max(22, pct); };
  } else if (what === 'dock') {
    /* The edge between the missions and AgentiX. The table keeps more columns the more room it gets. Under 200px the missions close. */
    const el = $('m-panel'), r = main.getBoundingClientRect(), wk = $('mv-work'); let two = mSize() === 'work';
    wk.classList.remove('m-railoff'); pct = M.railOff ? 0 : M.leftPx;
    move = ev => { pct = Math.max(0, Math.min(Math.round(r.width * .7), Math.round(ev.clientX - r.left))); const off = pct < 200;
      el.style.width = off ? '100%' : `calc(100% - ${pct}px)`; wk.classList.toggle('m-railoff', off);
      show(off ? 'Release to hide the missions' : `Missions ${pct}px · AgentiX ${Math.round((r.width - pct) / r.width * 100)}%`);
      const t2 = r.width - (off ? 0 : pct) >= M_TWO; if (t2 !== two) { two = t2; M.railOff = off; M.leftPx = Math.max(M_RAIL - 40, pct); mPanelRender(); icons(); } };
    up = () => { M.railOff = pct < 200; if (!M.railOff) M.leftPx = Math.max(240, pct); };
  } else if (what === 'full') {
    const el = $('m-panel'), r = main.getBoundingClientRect(), rail = $('m-ws-rail'); pct = 100; if (rail) rail.classList.add('hidden');
    move = ev => { pct = Math.max(30, Math.min(100, Math.round((r.right - ev.clientX) / r.width * 100))); el.style.left = (100 - pct) + '%';
      show(pct < 78 ? `AgentiX ${pct}% · release for the table and a side panel` : `AgentiX ${pct}% · release to stay in the full view`); };
    up = () => { el.style.left = ''; if (pct < 78) { M.size[key] = 'side'; M.pct[key] = Math.min(70, Math.max(30, pct)); } };
  } else {
    const el = $('m-panel'), r = main.getBoundingClientRect(); pct = M.pct[key];
    move = ev => { pct = Math.max(30, Math.min(100, Math.round((r.right - ev.clientX) / r.width * 100))); el.style.width = pct + '%';
      show(pct > 78 ? `AgentiX ${pct}% · release for the full view` : `AgentiX ${Math.min(70, pct)}% · screen ${100 - Math.min(70, pct)}%`); };
    up = () => { if (pct > 78) M.size[key] = 'work'; else M.pct[key] = Math.min(70, pct); };
  }
  const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); document.body.classList.remove('m-dragging'); if (lab) lab.classList.add('hidden'); up(); mRender(); mScrollInit(); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', end);
}
function mOpenPanel() { if (mDocked() && !M.panelOpen) { M.leftPx = Math.round(mMainW() * .62); M.railOff = false; } M.panelOpen = true; mRender(); mScrollInit(); }
function mClosePanel() {
  /* Closing slides AgentiX back out to the right; the table takes the room back. */
  const el = $('m-panel');
  if (mDocked() && el && el.dataset.shown && !M.closing) { M.closing = true; el.style.width = '0px'; return M.timers.push(setTimeout(() => { M.closing = false; mClosePanelNow(); }, 420)); }
  mClosePanelNow();
}
function mClosePanelNow() { M.panelOpen = false; M.panelTask = null; M.panelObj = null; M.deck = null; M.editing = null; M.sel = false; M.people = false; M.menu = false; mRender(); }
/* Opening a mission always means: show it in the agent panel. From Home that happens on the missions screen. */
function mOpenTask(id) {
  const t = mTask(id); if (!t) return;
  if (M.lastDecision && M.lastDecision.id !== id) M.lastDecision = null;
  /* A pending mission is always shown as one of the decisions, so the next one is a click away. */
  if (t.status === 'pending' && !t.waitOn && !(M.deck && M.deck.includes(id))) M.deck = myPendingTasks(M.W).map(x => x.id);
  const changed = M.panelTask !== id;
  M.recent = (M.recent || []).filter(r => r.id !== id); M.recent.unshift({ id, t: Date.now() }); M.art = null;
  /* From the table, a mission opens wide: AgentiX pushes the table back to the missions list. */
  if (mDocked() && (!M.panelOpen || !M.panelTask)) { M.leftPx = M_RAIL; M.railOff = false; }
  M.panelTask = id; M.panelObj = null; M.panelOpen = true; M.editing = null; t.unread = false; M.sel = false; M.people = false; M.menu = false; M.to = t.agent;
  if (M.sheet) { M.sheet = null; mSheetShow(false); }
  if (M.view === 'home') mNav('work'); else mRender();
  if (changed) mScrollInit();
}
/* A native object opens in the same panel: its mission if it has one, otherwise what is known about it. */
function mOpenObj(kind, id) {
  if (kind === 'tech') { M.panelObj = { kind, id }; M.panelTask = null; M.deck = null; M.panelOpen = true; M.editing = null; mRender(); return $('m-panel-scroll').scrollTo({ top: 0, behavior: 'instant' }); }
  const W = M.W, rv = kind === 'rule' ? myRuleReview(W, mRule(id)) : myIocReview(W, W.iocs.find(x => x.id === id));
  const sg = kind === 'rule' && W.suggested.find(r => r.id === id);
  if (sg) return mOpenTask(sg.task);
  /* With one open mission the row opens it. With several, the rule's own record lists them. */
  const openT = kind === 'rule' ? W.tasks.filter(t => t.status !== 'done' && ((t.affects.rules || []).includes(id) || (t.targets || []).includes(id))) : [];
  if (openT.length === 1) return mOpenTask(openT[0].id);
  if (!openT.length && rv.task && rv.sug !== 'Keep' && rv.task.status !== 'done') return mOpenTask(rv.task.id);
  M.panelObj = { kind, id }; M.panelTask = null; M.deck = null; M.panelOpen = true; M.editing = null;
  mRender(); $('m-panel-scroll').scrollTo({ top: 0, behavior: 'instant' });
}
function mPanelHome() { M.art = null; M.panelTask = null; M.panelObj = null; M.deck = null; M.editing = null; M.lastDecision = null; M.sel = false; M.people = false; M.menu = false; M.to = 'sec'; mRender(); mScrollInit(); }

/* ---------- pivot out, and the way back ---------- */
function mPivot(taskId, view) {
  M.pivot = { task: taskId, view };
  M.panelTask = taskId; M.panelObj = null; M.panelOpen = mWide(); M.size.native = 'side';
  M.sheet = null; mSheetShow(false);
  mNav(view, { keepPivot: true });
}
function mPivotFocus(kind, key) {
  if (!M.pivot) return false; const t = mTask(M.pivot.task); if (!t) return false;
  if (kind === 'rule') return (t.affects.rules || []).includes(key) || t.affects.suggested === key;
  if (kind === 'ioc') return (t.affects.iocs || []).includes(key);
  if (kind === 'node') return !!t.affects.node && t.affects.node.pipe === key.pipe && t.affects.node.stage === key.stage;
  if (kind === 'source') return t.affects.source === key;
  if (kind === 'instance') return t.affects.instance === key;
  return false;
}
function mBackToTask() { const id = M.pivot && M.pivot.task; if (id) { M.panelTask = id; M.panelOpen = true; } mNav('work'); mScrollInit(); }
function mToDecisions() { M.tab = 'needs'; mCloseSheet(); mNav('work'); }
function mReturnBar() {
  const el = $('m-return'); if (!el) return;
  const p = M.pivot, t = p && mTask(p.task);
  if (!t || !M_NATIVE[M.view]) { el.classList.add('hidden'); el.innerHTML = ''; return; }
  const waiting = t.status === 'pending', tone = waiting ? 'amber' : t.status === 'progress' ? 'blue' : 'cx';
  const msg = waiting ? 'Waiting for your decision' : t.status === 'progress' ? esc(t.progressNote || 'In progress') : esc(mStatusTxt(t));
  el.className = `shrink-0 m-return m-return-${tone}`;
  el.innerHTML = `<div class="flex items-center gap-3 px-4 py-2 flex-wrap">
    ${mAv('sec', 26)}
    <div class="min-w-0 flex-1">
      <div class="text-[11.5px] text-ink3 flex items-center gap-1.5 flex-wrap"><button onclick="mToDecisions()" class="hover:text-ink">Missions</button>${ic('chevron-right', 'w-3 h-3')}<button onclick="mBackToTask()" class="font-mono hover:text-ink">${t.id}</button>${ic('chevron-right', 'w-3 h-3')}<span class="text-ink2">${M_NATIVE[M.view]}</span></div>
      <div class="text-[13.5px] text-ink truncate"><b class="font-semibold">${esc(t.title)}</b> <span class="c-${tone}">· ${msg}</span></div>
    </div>
    ${M.panelOpen ? '' : `<button onclick="mOpenTask('${t.id}')" class="px-3 py-2 rounded-xl border border-line2 text-ink text-[13px] font-semibold hover:bg-hov inline-flex items-center gap-1.5">${ic('panel-right-open', 'w-4 h-4')}Show the mission here</button>`}
    <button onclick="mBackToTask()" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 hover:opacity-90">${ic('corner-up-left', 'w-4 h-4')}Back to Missions</button>
    <button onclick="M.pivot=null;mRender()" class="p-1.5 rounded-lg hover:bg-hov text-ink3" title="Stay here and hide this bar">${ic('x', 'w-4 h-4')}</button>
  </div>`;
}
/* Decisions that touch what the current screen shows. */
function mHere() {
  const pend = myPendingTasks(M.W), v = M.view, f = v === 'rules' ? t => (t.affects.rules || []).length || t.affects.suggested : v === 'iocs' ? t => (t.affects.iocs || []).length : v === 'streams' ? t => !!t.affects.node : v === 'sources' ? t => t.layer === 'source' || t.layer === 'integration' : null;
  if (v === 'mitre') { const ids = new Set(mTechs().flatMap(c => c.techs).filter(t => t.task).map(t => t.task.id)); return pend.filter(t => ids.has(t.id) || ids.has(t.unblocks)); }
  return f ? pend.filter(f) : pend;
}
/* With the panel closed, two things stay in view: the AgentiX icon with the number of decisions, and a pill that speaks about this screen. */
function mDock() {
  const el = $('m-dock'), ax = $('m-agx'); if (!el) return;
  const n = myPendingTasks(M.W).length, home = M.view === 'home', closed = !mPanelOn(), show = (!!M_NATIVE[M.view] || (home && n > 0)) && closed && !M.sheet, here = show ? mHere() : [];
  el.style.bottom = home ? '132px' : '';
  el.classList.toggle('hidden', !show); el.classList.toggle('flex', show);
  if (show) el.innerHTML = `${mAv('sec', 30, true)}<span class="text-left leading-tight"><span class="block text-[13px] font-bold text-ink">${home ? `${n} decision${n === 1 ? '' : 's'} waiting` : here.length ? `${here.length} decision${here.length === 1 ? '' : 's'} on this screen` : 'No decisions on this screen'}</span><span class="block text-[11.5px] text-ink3">${home ? 'Review them one by one' : `${n ? `${n} waiting in total` : 'Nothing is waiting for you'} · ${here.length ? 'Review' : 'Open SecOps'}`}</span></span>${ic(here.length ? 'arrow-right' : 'panel-right-open', 'w-4 h-4 text-ink3')}`;
  /* Home is already the conversation, so the icon is not needed there. */
  const icon = closed && !home; ax.classList.toggle('hidden', !icon); ax.classList.toggle('flex', icon);
  if (icon) ax.innerHTML = `<svg viewBox="0 0 24 24" class="w-6 h-6"><circle cx="12" cy="12" r="9.5" fill="none" stroke="#2dd4bf" stroke-width="1.6"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#5eead4" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="#99f6e4"/></svg>${n ? `<span class="absolute -bottom-0.5 -left-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10.5px] font-bold font-mono flex items-center justify-center ring-2 ring-[rgb(var(--bg))]">${n}</span>` : ''}`;
  ax.style.top = M.scnBar ? '44px' : '';
  ax.title = n ? `AgentiX · ${n} decision${n === 1 ? '' : 's'} waiting` : 'AgentiX';
}
function mDockGo() { if (M.view === 'home') return mReviewAll(); const h = mHere(); if (h.length) { M.deck = h.map(t => t.id); mOpenTask(h[0].id); } else mOpenPanel(); }
function mAgxGo() { if (M.view === 'home') return mNav('work'); mOpenPanel(); }

/* ---------- the side sheet: a native object (a rule, an indicator, a pipeline step or a source) ---------- */
function mSheetShow(on) { ['m-sheet', 'm-sheet-bg'].forEach(id => $(id).classList.toggle('hidden', !on)); $('m-sheet').classList.toggle('flex', on); }
function mOpenSheet(s) { M.sheet = s; mSheetShow(true); mSheetRender(); mDock(); const sc = $('m-sheet-scroll'); if (sc) sc.scrollTop = 0; icons(); }
function mCloseSheet() { if (!M || !M.sheet) return; M.sheet = null; M.reconnect = null; mSheetShow(false); mRender(); }
function mSheetRender() {
  const s = M.sheet; if (!s) return;
  const el = $('m-sheet'), sc = $('m-sheet-scroll'), top = sc ? sc.scrollTop : 0;
  el.innerHTML = ({ node: mNodeSheet, source: mSourceSheet, form: mFormSheet })[s.kind](s);
  const sc2 = $('m-sheet-scroll'); if (sc2) sc2.scrollTop = top;
}
const mOpenRule = id => mOpenObj('rule', id);
const mOpenNode = (pipe, stage) => { const t = myNodeTask(M.W, pipe, stage); return t ? mOpenTask(t.id) : mOpenSheet({ kind: 'node', pipe, stage }); };
const mOpenSource = id => mOpenSheet({ kind: 'source', id });
const mSheetHead = (crumb, title, sub = '') => `<div class="px-5 pt-4 pb-3 border-b border-line shrink-0 flex items-start gap-3">
  <div class="min-w-0 flex-1"><div class="text-[11.5px] text-ink3">${crumb}</div><div class="text-[19px] font-bold text-ink leading-snug mt-0.5">${title}</div>${sub}</div>
  <button onclick="mCloseSheet()" class="p-2 -mr-1 rounded-lg hover:bg-hov text-ink2" title="Close (Esc)">${ic('x', 'w-5 h-5')}</button></div>`;
/* The agents' note on a native object: the suggestion, and one way into the mission. */
function mSheetNote(t, extra = '') {
  if (!t) return '';
  const open = t.status !== 'done';
  return `<section class="rounded-2xl border-2 p-4 ${open ? 'border-amber-500/50 bg-amber-500/5' : 'border-line bg-sunk'}">
    <div class="flex items-start gap-3">${mAvs(t, 28)}<div class="min-w-0 flex-1"><div class="flex items-center gap-2 flex-wrap">${mSug(t.sug, { solid: true })}${mConf(t.conf)}<span class="text-[12px] text-ink3 font-mono">${t.id}</span>${mStatus(t)}</div>
      <div class="text-[14px] text-ink font-semibold mt-1.5 leading-snug">${esc(t.title)}</div><p class="text-[13px] text-ink2 mt-1 leading-relaxed">${esc(t.diagnosis)}</p>${extra}</div></div>
    <button onclick="mOpenTask('${t.id}')" class="mt-3 w-full py-2.5 rounded-xl ${t.status === 'pending' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-hov text-ink'} text-[13.5px] font-bold inline-flex items-center justify-center gap-2">${t.status === 'pending' ? 'Review the suggestion' : 'Open the mission'}${ic('arrow-right', 'w-4 h-4')}</button></section>`;
}

/* ---------- keyboard ---------- */
function mKey(e) {
  if (e.target.matches && e.target.matches('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') { closeDemoMenu(); if (M.sel || M.people || M.menu || M.art) { if (M.art && !M.sel && !M.people && !M.menu) { M.art = null; mRender(); return; } M.sel = false; M.people = false; M.menu = false; mPanelRender(); icons(); } else if (M.sheet) mCloseSheet(); else if (M.editing) { M.editing = null; mRender(); } else if ((M.panelTask || M.panelObj) && M.view === 'work') mPanelHome(); else if (M.panelOpen) mClosePanel(); else if (M.pivot) mBackToTask(); return; }
  if (k === 't') return toggleTheme();
  if (k === 'r') return location.reload();
  if (k === 'c') return mReviewAll();
  if (k === 'f' && mPanelOn() && mWide()) return mSizeToggle();
  if (k === 'l' && M.view === 'work') { M.logOpen = !M.logOpen; return mRender(); }
  if (k === '/') { const el = $('m-cmd'); if (el && mPanelOn()) { e.preventDefault(); el.focus(); } return; }
  if (M.panelTask && mPanelOn() && !M.sheet) { const t = mTask(M.panelTask);
    if (e.key === 'ArrowRight' || k === 'j') return mMove(1); if (e.key === 'ArrowLeft' || k === 'k') return mMove(-1);
    if (t && t.status === 'pending' && t.decision && !M.editing) { if (k === 'a') return mDecide(t.id, 'approve'); if (k === 'd') return mDecide(t.id, 'reject'); } }
}
