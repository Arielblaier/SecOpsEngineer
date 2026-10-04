/* ======================================================================
   NAV, THEME, CONTROLS
   ====================================================================== */
function navigateTo(view) {
  if (S) S._ptHtml = null;
  if (view === 'autonomous' && S.view === 'home' && !S.tourDone && !introOpen()) { S.tourDone = true; setTimeout(startTour, 1100); }
  S.view = view; S._tblHtml = null; S._ctHtml = null;
  ['home', 'autonomous', 'cases', 'insights', 'anatomy'].forEach(v => { $('view-' + v).classList.toggle('hidden', v !== view); $('view-' + v).classList.toggle('flex', v === view); });
  document.querySelectorAll('.nav-btn').forEach(b => {
    const on = b.dataset.nav === view;
    b.className = `nav-btn w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${on ? 'c-cx bg-hov border border-line2' : 'text-ink3 hover:text-ink hover:bg-hov/60'}`;
  });
  if (view === 'autonomous') { renderTabs(); renderHead(); renderTable(); renderConsole(); renderCopilot(); if (S.chat.length) renderTranscript(); }
  if (view === 'insights') renderInsights();
  if (view === 'anatomy') renderAnatomy();
  if (view === 'home') renderHome(true);
  if (view === 'autonomous') setTimeout(() => mountWfBorn(!S._wfBornDone && (S._wfBornDone = true)), 30);
  if (view === 'cases') { renderCaseTable(); offerCopy(); scheduleOffer(); } else { hideOffer(); clearTimeout(offerTimer); }
  updateMobileTabs(); icons();
}
function mobileTab(t) {
  if (t === 'insights') navigateTo('insights');
  else if (t === 'anatomy') navigateTo('anatomy');
  else if (t === 'home') navigateTo('home');
  else if (t === 'all') navigateTo('cases');
  else { S.mpane = t; $('workspace').dataset.mpane = t; if (S.view !== 'autonomous') navigateTo('autonomous'); if (t === 'log') renderConsole(); }
  updateMobileTabs();
}
function updateMobileTabs() {
  const active = S.view === 'autonomous' ? S.mpane : S.view === 'cases' ? 'all' : S.view === 'home' ? 'home' : S.view;
  document.querySelectorAll('#mobile-tabs button').forEach(b => b.className = `py-2 flex flex-col items-center gap-0.5 ${b.dataset.tab === active ? 'c-cx font-semibold' : 'text-ink3'}`);
}

function effectiveTheme() { return document.documentElement.dataset.theme || 'dark'; }
function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('cortex-demo-theme', next); } catch (e) {}
  renderThemeIcon();
}
function renderThemeIcon() { $('theme-icon-wrap').innerHTML = effectiveTheme() === 'dark' ? ic('sun', 'w-4 h-4 text-amber-400') : ic('moon', 'w-4 h-4 c-indigo'); icons(); }

function toggleSimulation() {
  S.running = !S.running;
  pushLog(null, S.running ? 'ok' : 'warn', S.running ? 'Agent resumed' : 'Agent paused by Guy R.', S.running ? '' : 'Running investigations are on hold');
  setPrompt(S.running ? 'Resuming the queue…' : 'Paused, waiting for you to resume');
  renderRail();
  renderLogControls();
}
function setSpeed(ms) { S.speed = ms; startLoop(); renderLogControls(); }
function toggleDemoMenu(e) { e.stopPropagation(); $('demo-menu').classList.toggle('hidden'); renderCoreSwitch(); }
function _rcs() { renderCoreSwitch(); }
function closeDemoMenu() { $('demo-menu').classList.add('hidden'); }
document.addEventListener('click', e => { if (!e.target.closest('#demo-menu')) closeDemoMenu(); });

function resetDemo() {
  closeDemoMenu(); closeCaseDrawer(); S.briefSig = null; document.querySelectorAll('[data-v],[id^=tabn-],[id^=lg-]').forEach(e => { e._v = undefined; }); initState(); closeCatchup(); applyLogCollapse();
  $('search-input').value = '';
  setPrompt('Validating SMB session fan-out on Domain-Ctrl-02…');
  S.home = { msgs: [], canvas: null, open: {} }; S._homeHtml = null; S._chipsDone = false; navigateTo('home'); toast('Demo data reset', 'rotate-ccw');
}

const SHORTCUTS = [['J / K', 'Next / previous case'], ['Enter', 'Open the selected case'], ['/', 'Search cases'], ['Space', 'Talk to AgentiX'], ['C', 'Review decisions'], ['A / D / L', 'Approve / decline / later (decisions)'], ['R', 'Reply in thread (decisions)'], ['V', 'View / hide the case under review'], ['I', 'Inject critical case'], ['P', 'Pause / resume agents'], ['L', 'Open / collapse agent log'], ['T', 'Toggle theme'], ['Esc', 'Back / close'], ['?', 'This help']];
function toggleShortcuts(on) {
  $('shortcut-list').innerHTML = SHORTCUTS.map(([k, d]) => `<kbd class="px-1.5 py-0.5 rounded bg-sunk border border-line font-mono text-[11px] text-ink text-center">${k}</kbd><span>${d}</span>`).join('');
  $('shortcuts').classList.toggle('hidden', !on); $('shortcuts').classList.toggle('flex', on);
  closeDemoMenu(); icons();
}

document.addEventListener('keydown', e => {
  { const lp = document.getElementById('landing'), ex = document.getElementById('explore'); if (ex && !ex.classList.contains('hidden')) { if (e.key === 'Escape') hideExplore(); return; } if (lp && !lp.classList.contains('hidden')) return; }
  if (tourOpen()) { if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); const f = tourSteps[tourI] && tourSteps[tourI].final; f ? endTour(true) : tourNext(); } else if (e.key === 'ArrowLeft') tourBack(); else if (e.key === 'Escape') endTour(false); return; }
  if (S.view === 'home' && storyResolve && ['Enter', ' ', 'ArrowDown'].includes(e.key) && !(e.target.matches && e.target.matches('input, textarea'))) { e.preventDefault(); storyContinue(); return; }
  if (introOpen()) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); introDone && !$('intro-go').classList.contains('hidden') ? startGame() : skipIntro(); } if (e.key === 'Escape') skipIntro(); return; }
  if (e.target.matches && e.target.matches('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') { toggleShortcuts(false); closeDemoMenu(); if (S.drawerId) closeCaseDrawer(); else if (S.cu.open) closeCatchup(); else if (S.briefId) closeBrief(); return; }
  if (e.key === '?') return toggleShortcuts(true);
  if (S.cu.open) {
    if (k === 'a') return cuDecide('approve');
    if (k === 'd') return cuDecide('decline');
    if (k === 'l') return cuDecide('later');
    if (k === 'o' || k === 'v') { const id = reviewingCaseId(); if (id) openCaseDrawer(id); return; }
    if (k === 'r') { e.preventDefault(); cuToggleReply(); return; }
    return;
  }
  if (e.key === '/') { e.preventDefault(); if (S.view !== 'autonomous') navigateTo('autonomous'); $('search-input').focus(); return; }
  if (e.key === ' ') { e.preventDefault(); if (window.innerWidth < 1024) mobileTab('copilot'); focusCommand(); return; }
  if ((k === 'j' || k === 'k') && S.pillar !== 'analyst') return;
  if (k === 'j' || k === 'k') {
    const list = visibleCases(); const i = list.findIndex(c => c.id === S.selectedId);
    const nx = list[Math.max(0, Math.min(list.length - 1, i + (k === 'j' ? 1 : -1)))];
    if (nx) { if (S.cu.open && nx.id !== reviewingCaseId()) closeCatchup(); if (S.drawerId) { selectCase(nx.id); openCaseDrawer(nx.id, true); } else showBrief(nx.id); } return;
  }
  if (e.key === 'Enter') { openCaseDrawer(S.selectedId); return; }
  if (k === 'c') return openCatchup();
  if (k === 'i') return injectIncident();
  if (k === 'p') return toggleSimulation();
  if (k === 't') return toggleTheme();
  if (k === 'l') return toggleLog();
});

let toastT = null;
function toast(msg, icon = 'check') {
  $('toast-msg').textContent = msg; $('toast-icon').innerHTML = ic(icon, 'w-3.5 h-3.5 c-cx'); icons();
  $('toast').classList.add('toast-show');
  clearTimeout(toastT); toastT = setTimeout(() => $('toast').classList.remove('toast-show'), 2200);
}

