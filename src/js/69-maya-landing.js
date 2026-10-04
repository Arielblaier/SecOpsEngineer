/* ======================================================================
   MAYA · LANDING
   ====================================================================== */
function mLanding() {
  const el = $('m-landing'), P = mP(), st = myStats(M.W);
  el.classList.remove('hidden');
  el.style.background = 'radial-gradient(1100px 620px at 50% -10%, rgb(139 92 246 / .28), transparent 70%), #070b16';
  const card = (i, h, p) => `<div class="rounded-2xl border border-white/10 bg-white/[.04] p-5 text-left"><div style="color:${P.c2}">${ic(i, 'w-5 h-5')}</div><div class="mt-3 text-[16px] font-bold text-white">${h}</div><p class="mt-1.5 text-[13.5px] text-white/65 leading-relaxed">${p}</p></div>`;
  el.innerHTML = `<div class="min-h-full flex flex-col items-center justify-center px-6 py-14 text-center">
    <div class="mb-5">${agentModeToggle()}</div>
    <div class="flex justify-center">${agentAv(P, 96)}</div>
    <div class="mt-5 text-[12px] font-black tracking-[.18em]" style="color:${P.c2}">CORTEX · AGENTIC WORKFORCE</div>
    <h1 class="mt-2 text-[clamp(34px,5vw,64px)] font-black text-white leading-[1.05] max-w-[900px]">Meet Maya, your SecOps Engineer</h1>
    <p class="mt-4 text-[clamp(15px,1.3vw,18px)] text-white/70 leading-relaxed max-w-[720px]">Maya keeps your detections and the data under them working, so you get the full value of the platform. When something is wrong she follows it from the symptom to its root cause, and brings you one decision with the evidence.</p>
    <div class="mt-9 grid md:grid-cols-3 gap-3 max-w-[980px] w-full">
      ${card('scan-search', 'She shows the true status', 'For every detection: is the data arriving, are the fields mapped, is the rule enabled, is it noisy, was it ever tested.')}
      ${card('git-pull-request-arrow', 'She fixes at the root', 'A noisy or silent rule is often a symptom. The cause can be a stopped source, a filter or one mapping line. One cause is one task.')}
      ${card('panel-right-open', 'You decide in one place', 'Each task holds the current state and the recommended change. Open the native screen if you want to, and a bar brings you back.')}
    </div>
    <button onclick="mLandingClose()" class="mt-9 px-7 py-3.5 rounded-2xl bg-white text-slate-950 text-[15px] font-bold inline-flex items-center gap-2 hover:opacity-90">See what Maya found this morning${ic('arrow-right', 'w-4 h-4')}</button>
    <div class="mt-3 text-[12.5px] text-white/45">${st.rules} detections · ${st.inst} data instances · ${st.pending} decisions waiting · a concept demo with simulated data</div>
  </div>`;
  icons();
}
function mLandingClose() { const el = $('m-landing'); el.classList.add('hidden'); el.innerHTML = ''; }
