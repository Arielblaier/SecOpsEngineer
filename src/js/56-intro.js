/* ======================================================================
   INTRO
   ====================================================================== */
const INTRO_LINES = [
  ['Meet your Agentic Workforce', 'text-[28px] sm:text-[34px] font-black text-ink leading-tight tracking-tight'],
  ['Four AI agents work your security queues around the clock. They handle the routine and bring you only what needs a human.', 'text-[15.5px] text-ink2 leading-relaxed max-w-[440px] mx-auto']
];
let introTimers = [], introDone = false;
function showIntro() { introDone = true; const ov = $('intro'); ov.classList.add('hidden'); ov.classList.remove('flex'); startGame(); }
function _oldShowIntro() {
  introDone = false; introTimers.forEach(clearTimeout); introTimers = [];
  const ov = $('intro'); ov.classList.remove('hidden'); ov.classList.add('flex');
  $('intro-card').classList.remove('intro-out'); $('intro-card').classList.add('intro-in');
  $('intro-lines').innerHTML = INTRO_LINES.map((l, i) => `<p id="il-${i}" class="${l[1]}"></p>`).join('');
  $('intro-roster').innerHTML = ''; const ab0 = $('intro-about'); if (ab0) ab0.classList.add('opacity-0', 'translate-y-2'); $('intro-go').classList.add('hidden'); $('intro-go').classList.remove('flex');
  $('intro-hint').style.opacity = '0';
  let li = 0;
  const typeLine = () => {
    if (introDone) return;
    if (li >= INTRO_LINES.length) return showRoster();
    const el = $('il-' + li); const text = INTRO_LINES[li][0]; let ci = 0;
    el.classList.add('intro-caret');
    const iv = setInterval(() => {
      if (introDone) return clearInterval(iv);
      ci += 1; el.textContent = text.slice(0, ci);
      if (ci >= text.length) { clearInterval(iv); el.classList.remove('intro-caret'); li++; introTimers.push(setTimeout(typeLine, li === 1 ? 500 : 380)); }
    }, li === 0 ? 38 : 22);
  };
  introTimers.push(setTimeout(typeLine, 700));
}
function showRoster() {
  const ab = $('intro-about'); if (ab) setTimeout(() => ab.classList.remove('opacity-0'), 1400);
  $('intro-roster').innerHTML = PILLAR_KEYS.map((k, i) => { const P = PILLARS[k]; return `
    <div class="pop flex flex-col items-center gap-2 w-[92px]" style="animation-delay:${300 + i * 160}ms">${agentAv(P, 40)}
      <span class="leading-tight"><span class="block text-[14px] font-bold text-ink">${P.name}</span><span class="block text-[11.5px] text-ink3 mt-0.5">${P.title}</span></span></div>`; }).join('');
  icons();
  introTimers.push(setTimeout(() => { const b = $('intro-go'); b.classList.remove('hidden'); b.classList.add('flex', 'pop'); $('intro-hint').style.opacity = '1'; introDone = true; }, 1500));
}
function skipIntro() {
  introDone = true; introTimers.forEach(clearTimeout);
  INTRO_LINES.forEach((l, i) => { const el = $('il-' + i); if (el) { el.textContent = l[0]; el.classList.remove('intro-caret'); } });
  if (!$('intro-roster').children.length) showRoster(); else { $('intro-go').classList.remove('hidden'); $('intro-go').classList.add('flex'); }
  introTimers.push(setTimeout(() => { $('intro-go').classList.remove('hidden'); $('intro-go').classList.add('flex'); $('intro-hint').style.opacity = '1'; }, 850));
}
function startGame() {
  const ov = $('intro');
  $('intro-card').classList.remove('intro-in'); $('intro-card').classList.add('intro-out');
  ov.style.transition = 'opacity .5s'; ov.style.opacity = '0';
  setTimeout(() => { ov.classList.add('hidden'); ov.classList.remove('flex'); ov.style.opacity = ''; }, 500);
  if (!S.running) { S.running = true; }
  pushLog(null, 'system', 'Workforce steering started by Guy R.', '');
  setPrompt('Resuming investigation of #994821 on Domain-Ctrl-02…');
  renderLogControls(); alertEntity();
  navigateTo('home');
}
const introOpen = () => !$('intro').classList.contains('hidden');
