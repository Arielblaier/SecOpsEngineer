/* ======================================================================
   WALKTHROUGH
   ====================================================================== */
function unionRect(...ids) {
  const rs = ids.map(id => $(id) && $(id).getBoundingClientRect()).filter(r => r && r.width);
  if (!rs.length) return null;
  const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top)), r = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom));
  return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
}
const TOUR = [
  { mode: 'base', rect: () => unionRect('metrics'), icon: 'gauge', title: 'Josh’s queue board', body: 'How Josh’s queue is moving: how many investigations are pending, in progress and resolved, how many he closed on his own, and how fast decisions come back from you.' },
  { mode: 'base', rect: () => unionRect('table-head', 'table-body'), icon: 'table', title: 'Josh’s queue', body: 'His investigations move here live as he picks them up, investigates and resolves them. Click any row to see how the investigation is going.' },
  { mode: 'base', rect: () => unionRect('pane-copilot'), icon: 'sparkles', title: 'Where Josh is waiting for you', body: 'This is where Josh brings you what he needs: decisions, questions and his progress. Ask him anything here, or give him input on an investigation.' },
  { mode: 'base', rect: () => unionRect('cp-bell'), pad: 10, icon: 'bell-ring', title: 'Your decisions', body: 'When Josh needs your approval, it becomes a decision and the bell counts it. Let’s open one and walk through it.', next: 'Open the decision' },
  { mode: 'cu', target: 'cu-hero', icon: 'target', title: 'Read the ask', body: 'Each card is one decision. On top: what the agent wants to do, on which case and host. The ring shows how long it has been waiting against your 15-minute SLA, green, then amber, then red.' },
  { mode: 'cu', target: 'impact', icon: 'git-fork', title: 'See the impact', body: 'Red lines are live malicious activity. Hover Approve to preview what changes if you say yes, connections cut, keys rotated, access revoked.' },
  { mode: 'cu', target: 'cu-conf', icon: 'scale', title: 'How sure is the agent?', body: 'Its confidence and which way the evidence leans. Open “Why” to see each finding and the steps the agent took.' },
  { mode: 'cu', target: 'cu-actions', icon: 'mouse-pointer-click', title: 'Decide, or dig deeper', body: 'Approve or decline right here, or view the full case first. Let’s drill into the case.', next: 'View the case' },
  { mode: 'case', target: ['cv-head', 'cv-verdict'], icon: 'file-search', title: 'The verdict, up front', body: 'The case opens over everything. First thing you see: the agent’s verdict and how confident it is. Below it, what happened and why the agent decided this way.' },
  { mode: 'case', target: 'cv-inv', icon: 'microscope', title: 'How the agent investigated', body: 'The agent answers a set of questions. Each answer is backed by evidence and supports or weakens the verdict, together they set the confidence level. Click any question to see its evidence, and tell the agent if an answer is wrong.' },
  { mode: 'case', target: 'cv-decide', icon: 'check-check', title: 'One place to decide', body: 'Seen enough? Head back to the decision. Approvals always happen in Decisions, so nothing runs by accident.' },
  { mode: 'base', rect: () => S.logCollapsed ? unionRect('log-rail') : unionRect('pane-log'), icon: 'activity', title: 'Watch your workforce', body: 'Want to see your agents actually doing the job? The agent log streams every query, finding and verdict as it happens.', final: true }
];
let tourI = 0, tourSteps = [], tourMode = 'base', tourBusy = false;
const tourOpen = () => !$('tour').classList.contains('hidden');
function stepRect(st) {
  if (st.rect) return st.rect();
  const ids = [].concat(st.target);
  const el = $(ids[0]); if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  return unionRect(...ids);
}
function applyTourMode(mode) {
  if (mode === tourMode) return false;
  if (mode === 'base') { if (S.drawerId) closeCaseDrawer(); if (S.cu.open) closeCatchup(); }
  if (mode === 'cu' || mode === 'case') {
    if (!S.tasks.length) return false;
    if (!S.cu.open) { S.cu.idx = 0; S.pillar = 'analyst'; openCatchup((S.tasks.find(t => t.caseId) || S.tasks[0]).id); }
    if (mode === 'cu' && S.drawerId) closeCaseDrawer();
    if (mode === 'case') { const id = reviewingCaseId(); S.cvMain = 'investigation'; if (id && S.drawerId !== id) openCaseDrawer(id); }
  }
  tourMode = mode; return true;
}
function startTour() {
  closeDemoMenu();
  if (S.view !== 'autonomous') navigateTo('autonomous');
  tourSteps = TOUR.filter(t => t.mode === 'base' || S.tasks.length);
  tourMode = S.drawerId ? 'case' : S.cu.open ? 'cu' : 'base';
  tourI = 0; $('tour').classList.remove('hidden'); goTour(0);
}
function goTour(i) {
  if (tourBusy) return;
  tourI = Math.max(0, Math.min(tourSteps.length - 1, i));
  const changed = applyTourMode(tourSteps[tourI].mode);
  if (changed) { tourBusy = true; $('tour-card').style.opacity = '0'; setTimeout(() => { tourBusy = false; $('tour-card').style.opacity = '1'; if (tourOpen()) renderTour(); }, 480); }
  else renderTour();
}
function renderTour() {
  if (!tourOpen()) return;
  const st = tourSteps[tourI], r = stepRect(st); if (!r) return tourI < tourSteps.length - 1 ? goTour(tourI + 1) : endTour(false);
  const pad = st.pad || 6, spot = $('tour-spot');
  spot.style.left = (r.left - pad) + 'px'; spot.style.top = (r.top - pad) + 'px';
  spot.style.width = (r.width + pad * 2) + 'px'; spot.style.height = (r.height + pad * 2) + 'px';
  const card = $('tour-card');
  card.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <span class="w-9 h-9 rounded-xl bg-cx/15 c-cx flex items-center justify-center">${ic(st.icon, 'w-5 h-5')}</span>
      <div class="flex items-center gap-1">${tourSteps.map((_, i) => `<span class="h-1.5 rounded-full transition-all ${i === tourI ? 'w-5 bg-cx' : i < tourI ? 'w-1.5 bg-cx/60' : 'w-1.5 bg-line2'}"></span>`).join('')}</div>
    </div>
    <div class="text-[16px] font-bold text-ink">${st.title}</div>
    <p class="text-[13px] text-ink2 leading-relaxed mt-1.5">${st.body}</p>
    <div class="flex items-center justify-between mt-4 gap-2">
      ${st.final ? `<button onclick="endTour(false)" class="text-[12px] text-ink3 hover:text-ink">Maybe later</button>
        <button onclick="endTour(true)" class="px-4 py-2 rounded-xl bg-ink hover:opacity-90 text-panel text-[13px] font-bold inline-flex items-center gap-1.5">${ic('activity', 'w-4 h-4')}Open the agent log</button>`
      : `<button onclick="endTour(false)" class="text-[12px] text-ink3 hover:text-ink">Skip tour</button>
        <div class="flex items-center gap-2">${tourI ? `<button onclick="tourBack()" class="px-3 py-2 rounded-xl bg-sunk text-ink2 text-[13px] font-semibold">Back</button>` : ''}
        <button onclick="tourNext()" class="px-4 py-2 rounded-xl bg-ink hover:opacity-90 text-panel text-[13px] font-bold">${st.next || 'Next'}</button></div>`}
    </div>`;
  icons();
  const cw = card.offsetWidth || 360, ch = card.offsetHeight || 220, vw = window.innerWidth, vh = window.innerHeight, gap = 18;
  let left, top;
  if (r.right + gap + cw + 12 < vw) { left = r.right + gap; top = r.top; }
  else if (r.left - gap - cw > 12) { left = r.left - gap - cw; top = r.top; }
  else { left = r.left + r.width / 2 - cw / 2; top = r.bottom + gap + ch < vh ? r.bottom + gap : r.top - gap - ch; }
  if (r.height > vh * .5 && top === r.top) top = r.top + Math.min(80, r.height / 4);
  card.style.left = Math.max(12, Math.min(vw - cw - 12, left)) + 'px';
  card.style.top = Math.max(12, Math.min(vh - ch - 12, top)) + 'px';
}
function tourNext() { if (tourI < tourSteps.length - 1) goTour(tourI + 1); else endTour(false); }
function tourBack() { if (tourI > 0) goTour(tourI - 1); }
function endTour(openLog) {
  $('tour').classList.add('hidden');
  applyTourMode('base');
  if (openLog && S.logCollapsed) toggleLog();
  if (S.tasks.length) setTimeout(() => toast(`${S.tasks.length} decisions are waiting for you`, 'bell'), 500);
}
window.addEventListener('resize', () => { if (tourOpen()) renderTour(); });