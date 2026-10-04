/* ======================================================================
   LANDING PAGE (marketing-style intro to the concept)
   ====================================================================== */
const LP_JOBS = [
  ['analyst', 'Triage & investigation', 'Picks up every new case the moment it is created. Groups related issues, asks the questions an analyst would, runs the queries, and reaches a verdict with the evidence behind it. Closes the benign ones on its own and brings the rest to you.'],
  ['analyst', 'Phishing response', 'Pulls reported emails, detonates links and attachments, finds every other recipient and drafts the clean-up. You approve the purge.'],
  ['engineer', 'Detection tuning', 'Watches which rules fire most and which are mostly wrong, replays history before changing anything, and proposes exclusions that keep every true detection.'],
  ['engineer', 'Data health', 'Notices when a data source goes quiet, finds out why, fixes what it can and backfills the gap so nothing is missed.'],
  ['hunter', 'Threat hunting', 'Turns new intel and odd patterns into hypotheses, searches the whole fleet, and hands real findings to Josh as cases and repeatable ones to Maya as rules.'],
  ['intel', 'Threat intelligence', 'Reads advisories and feeds every night, keeps only what matters to your sector and stack, and checks your own logs for contact with new indicators.'],
  ['intel', 'Exposure checks', 'When a critical vulnerability lands, matches it against your assets in minutes and tells you exactly which systems are exposed.']
];
const LP_FAQ = [
  ['How is this different from a SOAR playbook?', 'Playbooks follow a fixed script. The agents decide what to check next based on what they find, explain their reasoning, and still use your playbooks when it is time to act.'],
  ['Will an agent act without me?', 'Only within limits you set. Closing benign cases and gathering evidence happen on their own. Containment, account resets and anything that touches people or production wait for your approval.'],
  ['Can I see why it reached a verdict?', 'Always. Every verdict comes with the questions asked, the answers, the evidence and the raw events, and you can ask follow-up questions in plain words.'],
  ['Where does my data stay?', 'Inside your Cortex tenant. The agents use the same data, permissions and audit trail as your analysts.'],
  ['Is this a real product?', 'No. This is a concept demo with simulated data, built to explore how an agentic SOC could feel.']
];
let lpObs = null;
function applyAgentModeCopy() {
  if (!SINGLE) return;
  const hi = $('home-input'); if (hi && hi.dataset.phSingle) hi.placeholder = hi.dataset.phSingle;
  if (HOME_CTX.hero) HOME_CTX.hero = ['What did Josh close overnight?', 'Why is #555548 malicious?', 'Which case is the riskiest?'];
  const w = $('wf-sub'); if (w) w.textContent = 'Josh works the queue, you approve what matters';
  const i = $('ins-sub'); if (i) i.textContent = 'Josh, live.';
}
function showLanding() {
  applyAgentModeCopy();
  const L = $('landing'); L.classList.remove('hidden'); L.scrollTop = 0;
  if (!$('lp-mode-hero')) { const h1 = L.querySelector('section h1'); if (h1) h1.insertAdjacentHTML('beforebegin', `<div id="lp-mode-hero" class="lp-rv flex justify-center mb-2"></div>`); }
  $('lp-mode-hero').innerHTML = agentModeToggle();
  if (SINGLE) {
    const h1 = L.querySelector('section h1'); if (h1) h1.innerHTML = h1.innerHTML.replace('Agentic Workforce', 'Autonomous Analyst');
    const sub = h1 && h1.nextElementSibling; if (sub) sub.textContent = 'Meet Josh, an AI security analyst that works your case queue around the clock. He investigates every case inside Cortex, closes what’s benign, and comes back to you only when a decision needs a human.';
    const team = $('lp-agents'); const sec0 = team && team.closest('section');
    if (sec0) { const h2 = sec0.querySelector('h2'), p2 = h2 && h2.nextElementSibling; if (h2) h2.textContent = 'One analyst. Every case.'; if (p2) p2.textContent = 'Josh picks up every case the moment Cortex opens it, investigates it end to end and brings you only the decisions that need you.'; const lab = sec0.querySelector('.lp-rv'); if (lab) lab.textContent = 'MEET JOSH'; team.className = 'mt-12 mx-auto'; team.style.maxWidth = '560px'; }
    const au = $('lp-auto'); if (au) { const l0 = au.querySelector('.lp-rv'); if (l0 && /WORKFORCE/.test(l0.textContent)) l0.textContent = 'AUTONOMOUS ANALYST'; const q0 = [...au.querySelectorAll('p')].find(p0 => /workforce’s own queue/.test(p0.textContent)); if (q0) q0.textContent = 'This is Josh’s own queue, live. You don’t work it case by case. You watch him work, teach him how your team does things, and approve the moves that need a human.'; const p1 = [...au.querySelectorAll('p')].find(p0 => /the workforce picks them up/.test(p0.textContent)); if (p1) p1.textContent = p1.textContent.replace('the workforce picks them up on its own', 'Josh picks them up on his own'); }
  }
  // orbit of agents around the core
  setTimeout(() => renderHero(true, { svg: 'lp-hero-svg', goo: 'lp-hero-goo', lite: true, pfx: 'lp' }), 400);
  $('lp-chat').innerHTML = `<div class="flex items-center gap-2.5 pb-4 border-b border-white/10">${agentAv(PILLARS.analyst, 32)}<div><div class="text-[14px] font-bold text-white">Josh</div><div class="text-[12px] text-white/50">Security Analyst · online</div></div></div>
    <div class="space-y-3 pt-4 text-[14px]">
      <div class="lp-rv flex justify-end"><div class="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-indigo-500/30 text-white">Look into the Edge crash on SOC-Tech. Is it real?</div></div>
      <div class="lp-rv flex gap-2.5"><span class="mt-1">${agentMark(26)}</span><div class="rounded-2xl rounded-tl-md px-4 py-3 bg-white/[.06] text-white/85 leading-relaxed">It’s real. Edge was exploited through a booby-trapped image, launched <b class="text-white">rundll32.exe</b>, and is now beaconing to a known Cobalt Strike server every 45 seconds.<div class="mt-2 flex gap-2 flex-wrap text-[12px]"><span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200">Malicious · High</span><span class="px-2 py-0.5 rounded-full bg-white/10 text-white/70">5 questions · 10 evidence</span></div></div></div>
      <div class="lp-rv flex gap-2.5"><span class="mt-1">${agentMark(26)}</span><div class="rounded-2xl rounded-tl-md px-4 py-3 bg-white/[.06] text-white/85">I recommend isolating SOC-Tech. Want me to go ahead?<div class="mt-3 flex gap-2"><span class="px-3 py-1.5 rounded-full bg-white text-slate-950 text-[12.5px] font-bold">Approve</span><span class="px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-[12.5px]">Tell me more</span></div></div></div>
    </div>`;
  const TEAM = {
    analyst: ['Investigates every case', ['Picks up each case the moment it’s created', 'Asks the questions, runs the queries, reaches a verdict', 'Closes benign cases, brings you the rest'], [['147', 'cases investigated'], ['118', 'closed on his own']]],
    engineer: ['Keeps detections sharp', ['Tunes noisy rules before they waste time', 'Turns hunt findings into new detections', 'Fixes data sources that go quiet'], [['17', 'rules tuned'], ['23', 'new detections']]],
    hunter: ['Finds what rules miss', ['Turns intel and odd patterns into hunts', 'Searches the whole fleet for them', 'Hands real findings to Josh as cases'], [['38', 'hunts run'], ['3', 'became cases']]],
    intel: ['Turns intel into action', ['Reads advisories and feeds every night', 'Asks Tom to sweep for new indicators, nightly', 'Sends old cases back when the threat changes'], [['6', 'new groups tracked'], ['13', 'cases reopened']]]
  };
  $('lp-agents').innerHTML = PILLAR_KEYS.map((k, i) => { const P = PILLARS[k], [what, list, nums] = TEAM[k];
    return `<div class="lp-rv rounded-3xl p-6 border border-white/10 flex flex-col" style="background:linear-gradient(180deg, ${P.col}1a, rgb(255 255 255 / .02));transition-delay:${i * 90}ms">
      <div class="flex items-center gap-3">${agentAv(P, 40)}<div><div class="text-[17px] font-bold text-white">${P.name}</div><div class="text-[12.5px] text-white/55">${P.title}</div></div></div>
      <div class="mt-4 text-[16px] font-bold" style="color:${P.c2}">${what}</div>
      <ul class="mt-2 space-y-1.5 flex-1">${list.map(x => `<li class="flex gap-2 text-[13.5px] text-white/65 leading-snug"><span style="color:${P.c2}">•</span>${x}</li>`).join('')}</ul>
      <div class="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">${nums.map(([v, l]) => `<div><div class="text-[22px] font-black text-white">${v}</div><div class="text-[11.5px] text-white/50 leading-tight">${l}</div></div>`).join('')}</div>
      <div class="mt-2 text-[11px] text-white/35">last night</div></div>`; }).join('');
  const tile = (title, text, inner) => `<div class="lp-rv rounded-3xl p-7 border border-white/10 flex flex-col" style="background:linear-gradient(180deg, rgb(255 255 255 / .05), rgb(255 255 255 / .015))"><div class="text-[22px] font-bold text-white">${title}</div><p class="mt-2 text-[15px] text-white/60 leading-relaxed">${text}</p><div class="mt-6 flex-1">${inner}</div></div>`;
  $('lp-tiles').className = SINGLE ? $('lp-tiles').className.replace('lg:grid-cols-4', 'lg:grid-cols-3') : $('lp-tiles').className;
  $('lp-tiles').innerHTML =
    tile('Works inside Cortex', 'No new console. The agents run XQL, read the grouping graph, use your attack paths and trigger your playbooks.', `<div class="rounded-2xl p-4 bg-black/30 border border-white/10 font-mono text-[12px] text-white/70 leading-relaxed">dataset = xdr_data<br>| filter agent_hostname = "SOC-Tech"<br>| filter actor_process_image_name = "msedge.exe"<br><span style="color:#5eead4">→ rundll32.exe spawned with no arguments</span></div>`)
    + tile('Show it once', 'Walk an agent through how your team handles something. It saves the steps and follows them next time.', `<div class="rounded-2xl p-4 bg-black/30 border border-white/10 flex items-center gap-3"><span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span><span class="text-[14px] text-white">Maya is learning “Weekly rule review”</span><span class="ml-auto text-[12px] text-white/50 font-mono">0:42</span></div>`)
    + tile('Gets smarter every week', 'Agents remember how your environment works: who owns what, what is normal, and what you decided last time.', `<div class="rounded-2xl p-4 bg-black/30 border border-white/10 text-[13.5px] text-white/80 leading-relaxed">The QA team’s unsigned builds trip this rule every Tuesday. Last time you approved them. <span style="color:#5eead4">Saved to memory · Josh</span></div>`)
    + (SINGLE ? '' : tile('Hand work to each other', 'Put the agents on one case and they pass work between them. You see every handoff.', `<div class="space-y-2">${[['intel', 'Avi', 'asks Tom for nightly IOC sweeps'], ['hunter', 'Tom', 'escalated 2 hunts to Josh as cases'], ['analyst', 'Josh', 'asked Maya to tune 16 noisy rules'], ['intel', 'Avi', 'sent 15 old cases back for a second look']].map(([k, n, t]) => `<div class="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-black/30 border border-white/10">${agentAv(PILLARS[k], 24, false)}<span class="text-[13.5px] text-white"><b>${n}</b> <span class="text-white/65">${t}</span></span></div>`).join('')}</div>`));
  S.lpJob = S.lpJob || 0;
  renderLpJobs();
  renderLpAuto();
  renderLpAnatomy();
  $('lp-approval').innerHTML = `<div class="rounded-3xl p-6" style="background:linear-gradient(180deg, rgb(30 38 84 / .7), rgb(14 20 40 / .85));border:1px solid rgb(129 140 248 / .35);box-shadow:0 30px 80px -40px rgb(99 102 241 / .9)">
    <div class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-white" style="box-shadow:0 0 10px #fff"></span><span class="text-[12px] font-black tracking-[.14em] text-white">APPROVAL REQUIRED</span><span class="ml-auto inline-flex items-center gap-2 text-[12px] text-white/50">${agentAv(PILLARS.analyst, 20, false)}Josh · 3m</span></div>
    <div class="mt-3 text-[20px] font-bold text-white">Isolate SOC-Tech from the network</div>
    <div class="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-indigo-400/30 text-[12px]"><span class="text-white/50">Verdict</span><b class="text-rose-300">Malicious</b><span class="text-white/50">· High</span></div>
    <div class="mt-4 space-y-1.5">${['Edge actually ran the exploit', 'Edge started a process it never should', 'The process talks to attacker infrastructure', 'No approved security test covers it'].map(t => `<div class="flex items-center gap-2 text-[13.5px] text-white/80"><span class="w-4 h-4 rounded-full border border-teal-300/50 bg-teal-300/10 text-teal-300 flex items-center justify-center text-[10px]">✓</span>${t}</div>`).join('')}</div>
    <div class="mt-5 grid grid-cols-3 gap-2">${[['4 → 0', 'assets reachable'], ['3 → 0', 'crown jewels'], ['1 click', 'to undo']].map(([v, l]) => `<div class="rounded-xl px-3 py-2 bg-white/[.04] border border-white/10"><div class="text-[16px] font-black text-white">${v}</div><div class="text-[11.5px] text-white/50">${l}</div></div>`).join('')}</div>
    <div class="mt-5 flex gap-2"><span class="px-4 py-2 rounded-full bg-white text-slate-950 text-[13.5px] font-bold">Approve containment</span><span class="px-4 py-2 rounded-full border border-white/20 text-white/80 text-[13.5px]">Decline</span></div></div>`;
  $('lp-stats').innerHTML = [['2m 14s', 'average time to verdict'], ['118', 'benign cases closed alone'], ['−17%', 'issue volume this week']].map(([v, l]) => `<div class="rounded-2xl p-4 border border-white/10 bg-white/[.03]"><div class="text-[26px] font-black text-white">${v}</div><div class="text-[12.5px] text-white/55 mt-1">${l}</div></div>`).join('');
  $('lp-faqs').innerHTML = LP_FAQ.map(([q, a]) => `<details class="lp-rv group py-5"><summary class="cursor-pointer list-none flex items-center justify-between gap-4 text-[17px] font-semibold text-white">${q}<span class="text-white/50 text-[22px] leading-none transition group-open:rotate-45">+</span></summary><p class="mt-3 text-[15px] text-white/60 leading-relaxed">${a}</p></details>`).join('');
  icons();
  if (lpObs) lpObs.disconnect();
  const els = L.querySelectorAll('.lp-rv');
  if (window.IntersectionObserver) { lpObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); lpObs.unobserve(e.target); } }), { root: L, threshold: .12 }); els.forEach(el => lpObs.observe(el)); }
  else els.forEach(el => el.classList.add('in'));
}

function renderLpAuto() {
  let steps = [['Day 0', 'Data sources connected', 'Endpoints, identity and cloud start sending data to Cortex.', 'analyst'], ['+2 min', 'Josh takes the first case', 'Cortex opens a case from its detections; Josh starts on it right away.', 'analyst'], ['+20 min', 'Maya reviews 312 rules', 'Finds the noisy ones before they waste anyone’s time.', 'engineer'], ['+1 h', 'Avi checks your exposure', 'Matches this week’s advisories to your assets.', 'intel'], ['Day 1', 'Tom runs the first hunt', 'Looks for what the rules haven’t caught yet.', 'hunter']];
  if (SINGLE) steps = [steps[0], steps[1], ['+6 min', 'First benign case closed', 'Josh closes it on his own, with the evidence attached.', 'analyst'], ['+18 min', 'First decision for you', 'A real threat: Josh brings one decision with everything behind it.', 'analyst'], ['Day 1', 'Every case investigated', 'No case waits for a person to start on it.', 'analyst']];
  $('lp-dayzero').innerHTML = steps.map(([t, h, d, k], i) => `<div class="lp-rv rounded-2xl p-4 border border-white/10 relative" style="background:rgb(255 255 255 / .03);transition-delay:${i * 120}ms">
      <div class="flex items-center justify-between"><span class="text-[12px] font-mono" style="color:#5eead4">${t}</span>${i ? agentAv(PILLARS[k], 26, false) : `<span class="w-6 h-6 rounded-lg flex items-center justify-center" style="background:#0b1020;border:1px solid rgb(77 255 166 / .4)"><svg viewBox="0 -5 198 245" class="w-3 h-3.5"><path d="M125.421 50.7771C85.8879 50.7771 53.8326 80.9328 53.8326 118.131C53.8326 155.326 85.8832 185.48 125.412 185.484L125.421 50.7771C164.953 50.7771 197 80.933 197 118.131C197 155.326 164.941 185.48 125.412 185.484L125.421 236C56.1635 236 0 183.162 0 118.002C0 52.8273 56.1635 0 125.421 0V50.7771Z" fill="#4DFFA6"/></svg></span>`}</div>
      <div class="mt-3 text-[15px] font-bold text-white leading-snug">${h}</div><div class="mt-1 text-[13px] text-white/55 leading-snug">${d}</div>
      ${i < steps.length - 1 ? '<span class="hidden lg:block absolute top-1/2 -right-2.5 text-white/30">›</span>' : ''}</div>`).join('');
  try { renderTabs(); renderHead(); renderTable(); renderKpis(); renderCopilot(); } catch (e) {}
  const src = $('view-autonomous').cloneNode(true);
  src.classList.remove('hidden'); src.classList.add('flex'); src.style.cssText = 'width:1824px;height:900px;display:flex;pointer-events:none';
  src.querySelectorAll('[onclick],[onmouseenter],[oninput],[onkeydown]').forEach(el => ['onclick', 'onmouseenter', 'oninput', 'onkeydown'].forEach(a => el.removeAttribute(a)));
  src.querySelectorAll('[data-jv]').forEach(el => { el.removeAttribute('data-jv'); el.innerHTML = coreSVG(); });
  src.querySelectorAll('canvas').forEach(el => el.remove());
  const rail = `<div style="width:56px;flex-shrink:0;border-right:1px solid rgb(var(--line));background:rgb(var(--panel));display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:14px"><span style="width:34px;height:34px;border-radius:10px;background:#0b1020;border:1px solid rgb(77 255 166 / .35);display:flex;align-items:center;justify-content:center"><svg viewBox="0 -5 198 245" width="12" height="15"><path d="M125.421 50.7771C85.8879 50.7771 53.8326 80.9328 53.8326 118.131C53.8326 155.326 85.8832 185.48 125.412 185.484L125.421 50.7771C164.953 50.7771 197 80.933 197 118.131C197 155.326 164.941 185.48 125.412 185.484L125.421 236C56.1635 236 0 183.162 0 118.002C0 52.8273 56.1635 0 125.421 0V50.7771Z" fill="#4DFFA6"/></svg></span>${['house', 'sparkles', 'table', 'gauge'].map((n, i) => `<span style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;${i === 1 ? 'background:rgb(var(--hov))' : ''}"><i data-lucide="${n}" class="w-4 h-4 text-ink2"></i></span>`).join('')}</div>`;
  $('lp-queue').innerHTML = `<div class="flex items-center gap-2 px-4 h-9 border-b border-white/10" style="background:#0b0f1c"><span class="w-2.5 h-2.5 rounded-full bg-white/15"></span><span class="w-2.5 h-2.5 rounded-full bg-white/15"></span><span class="w-2.5 h-2.5 rounded-full bg-white/15"></span><span class="ml-3 text-[11.5px] text-white/40 font-mono">cortex.paloaltonetworks.com / workforce</span></div>
    <div id="lp-shot" class="relative overflow-hidden" style="aspect-ratio:1880/900"><div id="lp-shot-in" style="position:absolute;top:0;left:0;width:1880px;height:900px;transform-origin:0 0;display:flex" data-theme-scope></div></div>`;
  const inner = $('lp-shot-in'); inner.insertAdjacentHTML('beforeend', rail); inner.appendChild(src);
  const fit = () => { const w = $('lp-shot').clientWidth; inner.style.transform = `scale(${w / 1880})`; };
  fit(); window.addEventListener('resize', fit);
  icons();
}
const LP_JOB_X = [
  { steps: ['Case created', 'Questions asked and answered', 'Verdict with evidence'], vis: c => `<div class="space-y-2">${S.cases.filter(x => verdictOf(x) !== 'Running').slice(0, 3).map(x => `<div class="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-black/30 border border-white/10">${vdPillG(x, true)}<span class="text-[13px] text-white/85 truncate">${esc(x.name)}</span></div>`).join('')}</div>`, k: [['2m 14s', 'to a verdict'], ['118', 'closed alone']] },
  { steps: ['Pulls the reported email', 'Detonates links and files', 'Purges every copy after you approve'], vis: () => `<div class="rounded-xl p-3 bg-black/30 border border-white/10 text-[13px] text-white/80"><div class="text-white font-semibold">“Urgent invoice #4471”</div><div class="mt-1 text-white/55">14 recipients · link opens a fake Bank US login</div><div class="mt-2 inline-flex px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-200 text-[12px]">Phishing · purge ready</div></div>`, k: [['14', 'inboxes cleaned'], ['6m 40s', 'end to end']] },
  { steps: ['Finds the noisiest rules', 'Replays 30 days before changing anything', 'Ships the fix, keeps every true detection'], vis: () => `<div class="rounded-xl p-3 bg-black/30 border border-white/10"><div class="text-[12px] text-white/55">Suspicious PowerShell download · alerts per week</div><div class="mt-2 space-y-1.5"><div class="h-2.5 rounded-full bg-white/15" style="width:100%"></div><div class="h-2.5 rounded-full" style="width:62%;background:linear-gradient(90deg,#8b5cf6,#c4b5fd)"></div></div><div class="mt-2 text-[12.5px] text-white/80">1,084 → 672 · no true detections lost</div></div>`, k: [['17', 'rules tuned'], ['−37%', 'false positives']] },
  { steps: ['Notices a quiet data source', 'Finds the cause', 'Fixes it and backfills the gap'], vis: () => `<div class="rounded-xl p-3 bg-black/30 border border-white/10 text-[13px]"><div class="flex items-center gap-2 text-white/85"><span class="w-2 h-2 rounded-full bg-rose-400"></span>Okta logs silent since 02:14</div><div class="flex items-center gap-2 mt-1.5 text-white/85"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Token rotated · 2h backfilled</div></div>`, k: [['0', 'detections missed'], ['11m 20s', 'to fix']] },
  { steps: ['Turns intel into a hypothesis', 'Searches 4,812 endpoints', 'Hands findings to Josh and Maya'], vis: () => `<div class="rounded-xl p-3 bg-black/30 border border-white/10 font-mono text-[12px] text-white/70 leading-relaxed">filter actor_process = "winword.exe"<br>| filter action_process = "mshta.exe"<br><span style="color:#fdba74">→ 2 hosts · case opened for Josh</span></div>`, k: [['38', 'hunts'], ['9', 'became rules']] },
  { steps: ['Reads advisories every night', 'Keeps only what fits your sector', 'Checks your logs for contact'], vis: () => `<div class="space-y-1.5">${[['FIN7 help-desk calls', 'Targets your sector', '#f43f5e'], ['Citrix CVE-2026-1234', '3 assets exposed', '#f59e0b'], ['BlackSuit on ESXi', 'Watching', '#94a3b8']].map(([a, b, col]) => `<div class="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/30 border border-white/10 text-[13px]"><span class="w-2 h-2 rounded-full" style="background:${col}"></span><span class="text-white/85">${a}</span><span class="ml-auto text-white/50 text-[12px]">${b}</span></div>`).join('')}</div>`, k: [['213', 'indicators read'], ['9', 'relevant']] },
  { steps: ['A critical CVE lands', 'Matched to your assets in minutes', 'Patch tickets opened'], vis: () => `<div class="rounded-xl p-3 bg-black/30 border border-white/10 text-[13px] text-white/80"><div class="text-white font-semibold">NetScaler · CVE-2026-1234</div><div class="mt-2 grid grid-cols-5 gap-1">${[1, 1, 1, 0, 0].map(x => `<span class="h-6 rounded-md ${x ? 'bg-amber-500/60' : 'bg-white/10'}"></span>`).join('')}</div><div class="mt-2 text-white/55 text-[12px]">3 of 5 appliances exposed</div></div>`, k: [['14m', 'to answer'], ['3', 'tickets opened']] }
];
function renderLpJobs() {
  if (!PILLAR_KEYS.includes(LP_JOBS[S.lpJob || 0][0])) S.lpJob = LP_JOBS.findIndex(j => PILLAR_KEYS.includes(j[0]));
  const J = LP_JOBS[S.lpJob || 0], P = PILLARS[J[0]], X = LP_JOB_X[S.lpJob || 0];
  $('lp-jobs').innerHTML = `<div class="flex lg:flex-col gap-1.5 overflow-x-auto">${LP_JOBS.map((j, i) => !PILLAR_KEYS.includes(j[0]) ? '' : `<button onclick="S.lpJob=${i};renderLpJobs()" class="shrink-0 text-left px-4 py-3 rounded-2xl text-[15px] transition ${i === S.lpJob ? 'bg-white/10 text-white font-semibold' : 'text-white/55 hover:text-white hover:bg-white/5'}">${j[1]}</button>`).join('')}</div>
    <div class="rounded-3xl p-8 border border-white/10 min-h-[260px]" style="background:radial-gradient(500px 260px at 20% 0%, ${P.col}33, transparent 70%), rgb(255 255 255 / .03)">
      <div class="flex items-center gap-3">${agentAv(P, 36)}<div><div class="text-[13px] text-white/50">${P.name} · ${P.title}</div><div class="text-[26px] font-black text-white leading-tight">${J[1]}</div></div></div>
      <p class="mt-5 text-[17px] text-white/70 leading-relaxed max-w-[620px]">${J[2]}</p>
      <div class="mt-6 grid md:grid-cols-[1fr,1fr] gap-5 items-start">
        <div><div class="text-[11px] font-black tracking-[.16em] text-white/45 mb-2.5">HOW ${P.name.toUpperCase()} DOES IT</div>
          <ol class="space-y-2">${X.steps.map((t, i) => `<li class="flex items-center gap-3 text-[14px] text-white/80"><span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-slate-950" style="background:${P.c2}">${i + 1}</span>${t}</li>`).join('')}</ol>
          <div class="mt-5 grid grid-cols-2 gap-2">${X.k.map(([v, l]) => `<div class="rounded-xl px-3 py-2 bg-white/[.04] border border-white/10"><div class="text-[20px] font-black text-white">${v}</div><div class="text-[11.5px] text-white/50">${l}</div></div>`).join('')}</div></div>
        <div><div class="text-[11px] font-black tracking-[.16em] text-white/45 mb-2.5">WHAT YOU SEE</div>${X.vis()}</div>
      </div>
    </div>`;
  icons();
}
function lpGo(e, id) { if (e && e.preventDefault) e.preventDefault(); const L = $('landing'), t = $(id); if (t) L.scrollTo({ top: t.offsetTop - 70, behavior: 'smooth' }); }
function lpEnter() { const L = $('landing'); L.style.transition = 'opacity .6s ease'; L.style.opacity = '0'; introDone = true; setTimeout(() => { L.classList.add('hidden'); L.style.opacity = ''; const ov = $('intro'); ov.classList.add('hidden'); ov.classList.remove('flex'); startGame(); }, 550); }
