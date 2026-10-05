/* ======================================================================
   ORCHESTRATION
   ====================================================================== */
function refresh() {
  renderStats();
  if (S.view === 'autonomous') {
    renderTabs(); renderTable(); renderCopilot();
    if (S.drawerId) openCaseDrawer(S.drawerId, true);
    if (S.cu.open && !S.cu.busy) {
      if (S.cu.taskId && !S.tasks.some(t => t.id === S.cu.taskId)) { if (S.cu.idx >= S.tasks.length) S.cu.idx = 0; renderCatchup(true); }
      else if (!S.cu.taskId && S.tasks.length) renderCatchup(true);
      else renderCatchupChrome();
    }
  } else if (S.view === 'insights') renderInsights();

  else if (S.view === 'cases') {
    renderCaseTable(); if ($('wf-offer').classList.contains('hidden')) offerCopy(); else { const b = $('wf-btn-count'); b.textContent = S.tasks.length; b.classList.toggle('hidden', !S.tasks.length); } if (S.drawerId) openCaseDrawer(S.drawerId, true);
    if (S._offerTasks !== undefined && S.tasks.length > S._offerTasks) { S.wfDismissed = false; showOffer('A new decision just arrived'); }
  }
  S._offerTasks = S.tasks.length;
}

(function boot() {
  document.body.appendChild($('case-drawer'));   /* the case view lives at the page root so it shows from any screen */
  let savedTheme = null; try { savedTheme = localStorage.getItem('cortex-demo-theme'); } catch (e) {}
  document.documentElement.dataset.theme = savedTheme || 'dark';
  initState();
  S.running = false;
  renderThemeIcon();
  renderStats();
  applyLogCollapse();
  navigateTo('autonomous');
  mobileTab('cases');
  setPrompt('Workforce standing by for your go…');
  startLoop();
  ['home', 'autonomous', 'cases', 'insights', 'anatomy'].forEach(v => { const el = $('view-' + v); if (el) { el.classList.toggle('hidden', v !== 'home'); if (v === 'home') el.classList.add('flex'); } });
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === 'home'));
  { let skip = false; try { skip = sessionStorage.getItem('cortex-skip-landing') === '1'; sessionStorage.removeItem('cortex-skip-landing'); } catch (e) {}
  setTimeout(() => { const l = $('app-loader'); l.style.opacity = '0'; setTimeout(() => l.remove(), 650); if (MAYA) { mBoot(skip); return; } if (skip) { applyAgentModeCopy(); introDone = true; const ov = $('intro'); ov.classList.add('hidden'); ov.classList.remove('flex'); startGame(); toast(SINGLE ? 'Single agent: Josh only' : 'Workforce: Josh, Maya, Tom and Avi', 'users'); } else showLanding(); }, MAYA ? 3000 : skip ? 900 : 2600); }
  applySizes();
})();
