/* ======================================================================
   CASES TABLE → WORKFORCE VIEW (offer + transition)
   ====================================================================== */
let offerTimer = null;
function offerCopy() {
  const n = S.tasks.length, run = S.cases.filter(c => c.verdict === 'Running').length;
  $('wf-offer-title').textContent = n ? `${n} decision${n > 1 ? 's' : ''} waiting for you` : 'Your workforce is busy';
  $('wf-offer-body').textContent = `The agents are working ${run} cases right now${n ? ' and need your call on ' + (n > 1 ? 'a few of them' : 'one') : ''}. Switch to the workforce view to watch them and decide.`;
  const b = $('wf-btn-count'); b.textContent = n; b.classList.toggle('hidden', !n);
}
function showOffer(reason) {
  if (S.view !== 'cases' || S.drawerId || S.wfDismissed || tourOpen() || introOpen()) return;
  offerCopy();
  if (reason) $('wf-offer-title').textContent = reason;
  const el = $('wf-offer'); if (!el.classList.contains('hidden')) return;
  el.classList.remove('hidden'); el.classList.remove('offer-in'); void el.offsetWidth; el.classList.add('offer-in'); icons();
}
function hideOffer(dismiss) { $('wf-offer').classList.add('hidden'); if (dismiss) S.wfDismissed = true; }
function scheduleOffer() { clearTimeout(offerTimer); offerTimer = setTimeout(() => showOffer(), 3500); }

function toWorkforce() {
  hideOffer(); clearTimeout(offerTimer);
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const src = $('view-cases');
  const canAnim = !!src.animate && !calm && window.innerWidth >= 1024 && S.view === 'cases';
  if (!canAnim) { navigateTo('autonomous'); return; }
  const r0 = src.getBoundingClientRect();
  // ghost of the table we are leaving
  const ghost = src.cloneNode(true);
  ghost.removeAttribute('id'); ghost.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  Object.assign(ghost.style, { position: 'fixed', left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px', zIndex: 44, transformOrigin: '0 0', margin: '0', display: 'flex', pointerEvents: 'none', boxShadow: '0 30px 60px -20px rgb(15 23 42 / .35)', overflow: 'hidden' });
  ghost.classList.remove('hidden');
  document.body.appendChild(ghost);
  navigateTo('autonomous');
  const pc = $('pane-cases'), cp = $('pane-copilot'), mt = $('metrics'), side = S.logCollapsed ? $('log-rail') : $('pane-log');
  const tb = $('table-body'), th = $('table-head');
  const r1 = unionRect('table-head', 'table-body') || pc.getBoundingClientRect();
  const sc = Math.min(r1.width / r0.width, r1.height / r0.height);
  [cp, mt, tb, th].forEach(e => e && (e.style.opacity = '0'));
  setTimeout(() => { [cp, mt, tb, th].forEach(e => e && (e.style.opacity = '')); if (ghost.isConnected) ghost.remove(); }, 1600);
  const ease = 'cubic-bezier(.2,.8,.2,1)';
  // 1. the table shrinks into its place in the workforce view
  ghost.animate([{ transform: 'none', borderRadius: '0px' }, { transform: `translate(${r1.left - r0.left}px, ${r1.top - r0.top}px) scale(${sc})`, borderRadius: '18px' }], { duration: 720, easing: ease, fill: 'forwards' });
  ghost.animate([{ opacity: 1 }, { opacity: 1, offset: .72 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }).onfinish = () => ghost.remove();
  // 2. the live table fades in underneath
  setTimeout(() => { [tb, th].forEach(e => { e.style.opacity = ''; e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380 }); }); }, 620);
  // 3. the agent panel opens from the right
  setTimeout(() => { cp.style.opacity = ''; cp.animate([{ transform: 'translateX(105%)', opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: 760, easing: ease }); pulseEntity(); }, 180);
  // 4. the log rail slides in from the left side
  if (side) side.animate([{ transform: 'translateX(-100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 260, easing: ease, fill: 'backwards' });
  // 5. KPIs unfold from the left, one by one
  setTimeout(() => {
    mt.style.opacity = '';
    [...mt.children].forEach((k, i) => k.animate([{ transform: 'translateX(-70px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay: i * 90, easing: ease, fill: 'backwards' }));
  }, 380);
  setTimeout(() => { if (S.tasks.length) toast(`${S.tasks.length} decisions are waiting, review them when you're ready`, 'bell-ring'); }, 1300);
}
function pulseEntity() { const b = $('entity-btn'); if (b) { b.classList.add('tap'); setTimeout(() => b.classList.remove('tap'), 300); } }

