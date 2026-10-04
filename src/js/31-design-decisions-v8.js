/* ======================================================================
   DESIGN DECISIONS v8: simpler process options, case questions, richer decision A, chat references
   ====================================================================== */
/* ---------- 2B · cycles, one line each ---------- */
function dxCycleList() {
  const R = DXD.rounds, Q = DXD.qs, EV = DXD.events; S.dxCl = S.dxCl ?? R.length - 1;
  return dxCard(`<div class="space-y-2">${R.map((r, k) => { const ch = EV.filter(e => dxRoundOf(e) === k && e.k !== 'pb'), qs = Q.filter(q => q.r === k), on = S.dxCl === k;
    return `<div class="rounded-xl border ${on ? 'border-indigo-300/50 bg-indigo-500/[.06]' : 'border-white/10 bg-white/[.03]'}"><button onclick="S.dxCl=S.dxCl===${k}?-1:${k};renderDxSim()" class="w-full text-left px-4 py-3 flex items-center gap-3">
        <span class="font-mono text-[12px] text-white/50 w-11">${r.t}</span><span class="text-[13.5px] text-white/60 w-[260px] truncate">${ch.map(e => e.n).join(' · ') || 'Case opened'}</span><span class="text-white/30">→</span>
        <span class="flex-1 text-[14px] font-semibold ${r.verdict ? 'text-rose-300' : 'text-white'}">${r.n}</span><span class="text-[12px] text-white/55">${DX_HN.H1} ${r.h[0]}%</span><span class="text-white/35">${on ? '▾' : '▸'}</span></button>
      ${on ? `<div class="px-4 pb-4 pl-[72px] text-[13px] text-white/80">${qs.length ? qs.map(q => `<div class="mt-1.5 flex items-center gap-2"><span class="flex-1">${q.q}</span>${dxAns(q.a)}</div>`).join('') : `<div>${r.n}.</div>`}</div>` : ''}</div>`; }).join('')}</div>`);
}
/* ---------- 2C · the story in three cards ---------- */
function dxThreePart() {
  const Q = DXD.qs, H = DXD.hyp;
  const card = (n, t, body) => `<div class="rounded-2xl border border-white/10 p-5" style="background:linear-gradient(180deg, rgb(30 38 80 / .55), rgb(16 22 46 / .72))"><div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-slate-950" style="background:#5eead4">${n}</span><span class="text-[11px] font-black tracking-[.14em] text-white/55">${t}</span></div><div class="mt-3">${body}</div></div>`;
  return dxCard(`<div class="grid gap-4 items-start" style="grid-template-columns:1fr 1.4fr 1fr">
    ${card(1, 'WHAT HAPPENED', `<p class="text-[13.5px] text-white/80 leading-relaxed">a.levi clicked an invoice email link. Edge was exploited, a Cobalt Strike loader ran on SOC-Tech, beaconed to 8.130.54.67 and tried to read credentials.</p><div class="mt-3 text-[12px] text-white/50">6 issues · 2 playbooks · 09:03–10:05</div>`)}
    ${card(2, 'WHAT JOSH CHECKED', Q.map(q => `<div class="flex items-center gap-2 py-1.5 border-b border-white/[.06] last:border-0"><span class="flex-1 text-[13px] text-white/85">${q.q}</span>${dxAns(q.a)}</div>`).join(''))}
    ${card(3, 'WHAT HE CONCLUDED', `<div class="text-[22px] font-black text-rose-400">Malicious</div><div class="text-[12.5px] text-white/55">High confidence · ${DX_HN.H1} ${H[0].pct}%</div><p class="mt-2 text-[13px] text-white/75">Ruled out: an approved simulation (${H[1].pct}%) and a legitimate tool (${H[2].pct}%).</p>`)}
  </div>`);
}
dxP = (orig => function (id) { return id === 'B' ? dxCycleList() : id === 'C' ? dxThreePart() : orig(id); })(dxP);

/* ---------- 3C · the questions as they are in the case today ---------- */
function dxCaseQuestions() {
  const Q = DXD.qs, H = DXD.hyp; S.dxCq = S.dxCq ?? -1;
  const icon = q => /^no\b|not yet/i.test(q.a) && !q.eff[0] ? ['border border-line2 text-ink3', '–'] : q.eff[0] > 0 || q.eff.some(w => w) ? ['border border-cx/50 bg-cx/10 c-cx', '✓'] : ['border border-rose-400/50 bg-rose-500/10 text-rose-300', '✕'];
  return dxCard(`<div class="flex items-center gap-2 mb-3">${agentAv(PILLARS.analyst, 24, false)}<span class="text-[14px] font-bold text-white">Questions I answered</span><span class="text-[12px] text-white/45">· ${Q.length}</span></div>
    <div class="rounded-2xl border border-indigo-400/20 overflow-hidden">${Q.map((q, i) => { const [cls, g] = icon(q), on = S.dxCq === i;
      return `<div class="${i ? 'border-t border-white/[.06]' : ''}"><button onclick="S.dxCq=S.dxCq===${i}?-1:${i};renderDxSim()" class="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[.02]">
        <span class="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] ${cls}">${g}</span>
        <div class="flex-1 min-w-0"><div class="text-[14px] font-semibold text-white">${q.q}</div><div class="mt-0.5 text-[13px] text-white/65">${q.a}. ${q.ev[0]}</div></div><span class="text-white/35 mt-1">${on ? '▾' : '▸'}</span></button>
        ${on ? `<div class="px-4 pb-4 pl-12"><div class="text-[11px] font-bold tracking-[.14em] text-white/45 mb-1">EVIDENCE</div>${q.ev.map(e => `<div class="mt-1 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}
          <div class="mt-3 text-[11px] font-bold tracking-[.14em] text-white/45 mb-1">QUERY</div><pre class="rounded-lg px-3 py-2 bg-black/40 border border-white/10 text-[11px] text-white/70 font-mono whitespace-pre-wrap">${esc(q.xql)}</pre><div class="mt-3">${dxEventsTable(i)}</div></div>` : ''}</div>`; }).join('')}</div>`);
}
dxR = (orig => function (id) { return id === 'C' ? dxCaseQuestions() : orig(id); })(dxR);

/* ---------- 5A · the decision card, with expandable reasoning like the workforce page ---------- */
dxDec = (orig => function (id) {
  if (id !== 'A') return orig(id);
  const A = DX_ACT, done = A[0][1] === 'done'; S.dxWhy = !!S.dxWhy;
  const sig = [['Did the email link serve an exploit?', 'Yes. URL Detonation: CVE-2023-4863 exploit page.'], ['Did a known malware loader run?', 'Yes. payload.dll is a Cobalt Strike loader (WildFire).'], ['Is it talking to attacker infrastructure?', 'Yes. 24 beacons to 8.130.54.67, every ~45s.'], ['Is there an approved simulation?', 'No. Nothing scheduled, no red-team ticket.']];
  return dxCard(`<div id="dx-decision-a" class="rounded-2xl border ${done ? 'border-emerald-400/40' : 'border-amber-500/45'} overflow-hidden" style="background:linear-gradient(180deg, rgb(245 158 11 / .06), transparent 40%)">
    <div class="p-5"><div class="flex items-center gap-2">${agentAv(PILLARS.analyst, 28, false)}<span class="text-[11px] font-bold tracking-[.14em] ${done ? 'text-emerald-300' : 'text-amber-300'}">${done ? 'APPROVED · DONE' : 'APPROVAL REQUIRED'}</span><span class="ml-auto inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-rose-400/30 text-[12px]"><span class="text-white/50">Verdict</span><b class="text-rose-300">Malicious</b><span class="text-white/50">· High</span></span></div>
      <div class="mt-3 text-[20px] font-bold text-white">${A[0][0]}</div>
      <p class="mt-2 text-[14px] text-white/80 leading-relaxed">I confirmed that SOC-Tech is compromised: the email led to an exploit, a known loader is running and it already tried to steal credentials. I recommend isolating SOC-Tech now.</p>
      <div class="mt-4 grid grid-cols-3 gap-2">${[['4 → 0', 'assets reachable'], ['1 → 0', 'crown jewels'], ['1 click', 'to undo']].map(([v, l]) => `<div class="rounded-xl px-3 py-2 bg-white/[.04] border border-white/10"><div class="text-[18px] font-black text-white">${v}</div><div class="text-[11.5px] text-white/50">${l}</div></div>`).join('')}</div>
      <div class="mt-4 flex items-center gap-2">${done ? '<span class="text-[13px] text-emerald-300 font-semibold">✓ Isolated · you can release it any time</span>' : `<button onclick="dxApprove(0)" class="px-4 py-2 rounded-full bg-indigo-500/40 border border-indigo-300/50 text-[13.5px] font-semibold text-white">Approve containment</button><button onclick="dxDecline(0)" class="px-4 py-2 rounded-full border border-white/15 text-[13.5px] text-white/75">Decline</button>`}</div></div>
    <button onclick="S.dxWhy=!S.dxWhy;renderDxSim()" class="w-full px-5 py-3 border-t border-white/10 flex items-center gap-2 text-left hover:bg-white/[.02]"><span class="c-ai">✦</span><span class="text-[13.5px] text-white/85">Why I recommend this</span><span class="text-[12px] text-white/45">· ${sig.length} signals</span><span class="ml-auto text-white/45">${S.dxWhy ? '▾' : '▸'}</span></button>
    ${S.dxWhy ? `<div class="px-5 pb-5"><div class="text-[11px] font-bold tracking-[.14em] text-white/45 mt-1 mb-1.5">EVIDENCE · ${sig.length} SIGNALS</div>${sig.map(([q, a]) => `<div class="mt-1.5 flex gap-2 text-[13px]"><span class="text-emerald-300">✓</span><span><b class="text-white">${q}</b> <span class="text-white/70">${a}</span></span></div>`).join('')}
      <div class="text-[11px] font-bold tracking-[.14em] text-white/45 mt-4 mb-1.5">WHAT THE PLAYBOOK DOES</div><ol class="space-y-1 text-[13px] text-white/80">${['Isolates SOC-Tech at the endpoint agent', 'Keeps the Cortex connection for evidence', 'Ends a.levi’s session on the host', 'Snapshots memory for forensics'].map((x, i) => `<li class="flex gap-2"><span class="text-white/40 font-mono">${i + 1}</span>${x}</li>`).join('')}</ol>
      <div class="mt-4 grid grid-cols-3 gap-2">${[['Risk', 'Medium · a.levi offline ~2h'], ['Rollback', 'Release with one click'], ['Precedent', '23 of 24 similar cases']].map(([a, b]) => `<div class="rounded-xl px-3 py-2 bg-white/[.04] border border-white/10"><div class="text-[10.5px] font-bold tracking-[.12em] text-white/45">${a.toUpperCase()}</div><div class="text-[12.5px] text-white mt-0.5">${b}</div></div>`).join('')}</div></div>` : ''}
  </div>`);
})(dxDec);

/* ---------- Josh’s chat points to the real thing on the page ---------- */
const DX_REF_LABEL = { decide: 'the decision', verdict: 'the verdict', reason: 'the questions', attack: 'the attack graph', process: 'the investigation' };
function dxGoto(key) {
  const lab = [...document.querySelectorAll('#dx-sim span')].find(e => e.textContent.trim() === DX.find(d => d.key === key).name.toUpperCase());
  const box = lab && lab.closest('div') && lab.closest('div').nextElementSibling; if (!lab) return;
  lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (box) { box.style.transition = 'box-shadow .3s'; box.style.boxShadow = '0 0 0 2px #5eead4, 0 0 40px -6px rgb(94 234 212 / .6)'; box.style.borderRadius = '18px'; setTimeout(() => { box.style.boxShadow = ''; }, 1800); }
}
const _dxJoshReply0 = dxJoshReply;
dxJoshReply = q => { const a = _dxJoshReply0(q), l = q.toLowerCase();
  const ref = /isolate|block|purge|reset|approve|decline/.test(l) ? 'decide' : /h2|simulation|rule out/.test(l) ? 'reason' : /09:40|changed|cycle/.test(l) ? 'process' : /spread|lateral|reach/.test(l) ? 'attack' : /why|verdict|malicious/.test(l) ? 'verdict' : null;
  return ref ? { t: a, ref } : a; };
renderDxSim = (orig => function () {
  // normalise chat messages that carry a reference
  (S.dxChat || []).forEach(m => { if (m.t && typeof m.t === 'object') { m.ref = m.t.ref; m.t = m.t.t; } });
  if (S.dxChat && S.dxChat[0] && !S.dxChat[0].ref) S.dxChat[0].ref = 'decide';
  orig();
  const th = document.getElementById('dx-thread'); if (!th) return;
  const msgs = S.dxChat || [];
  [...th.children].forEach((el, i) => { const m = msgs[i]; if (m && m.ref && m.who === 'josh' && !m.typing) {
    const bubble = el.querySelector('div.rounded-2xl'); if (bubble && !bubble.querySelector('.dx-ref')) bubble.insertAdjacentHTML('beforeend', `<button onclick="dxGoto('${m.ref}')" class="dx-ref mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1 border border-teal-300/35 bg-teal-300/[.07] text-[12px] text-teal-200 hover:bg-teal-300/15">↳ Go to ${DX_REF_LABEL[m.ref]} on this page</button>`);
  } });
})(renderDxSim);

/* ---------- option texts ---------- */
(() => {
  const P = DX[1]; P.rec = 'C';
  P.opts[1] = { id: 'B', name: 'Cycle list', tag: 'Simplest', idea: 'One line per cycle: what changed in the case → what Josh concluded, with where the leading hypothesis stood. Open a line to see the questions he asked then.', pros: ['Scannable in seconds', 'Shows the case evolving without any diagram'], cons: ['Little detail until you open a line'] };
  P.opts[2] = { id: 'C', name: 'Three-part story', tag: 'Clearest', idea: 'Three cards: what happened, what Josh checked (every question with its answer), and what he concluded, including what he ruled out.', pros: ['Anyone can read it', 'Fits on one screen'], cons: ['Doesn’t show how the case changed over time'] };
  const Rr = DX[2]; Rr.opts[2] = { id: 'C', name: 'As in the case today', tag: 'Today’s design', idea: '“Questions I answered”: one row per question with a ✓ / ✕ / – mark, the question, the answer and the key finding. Open a row for the evidence, the query and the raw events.', pros: ['Already familiar', 'Compact and readable'], cons: ['Effects on each hypothesis aren’t shown'] };
  const D = DX.find(d => d.key === 'decide'); D.opts[0] = { id: 'A', name: 'Decision card', tag: 'Like the workforce page', idea: 'The decision card from the workforce page: verdict, Josh’s recommendation, what it changes (4 → 0 assets), and an expandable “Why I recommend this” with the evidence signals, the playbook steps, risk, rollback and precedent.', pros: ['Everything needed to decide in one card', 'Detail is there when you want it'], cons: ['One decision at a time'] };
})();



function showExplore() {
  const E = $('explore'); E.classList.remove('hidden');
  S.dxPick = S.dxPick || {};
  const head = E.querySelector('section');
  if (head) head.innerHTML = `<div class="text-[12px] font-black tracking-[.18em]" style="color:#5eead4">DESIGN DECISIONS · NOTHING HERE CHANGES THE DEMO</div>
    <h1 class="mt-3 text-[clamp(34px,4.6vw,56px)] font-black leading-[1.03] text-white max-w-[900px]">The investigation area: three options per element</h1>
    <p class="mt-5 max-w-[760px] text-[17px] text-white/65 leading-relaxed">Pick one option for each element. The mock at the bottom rebuilds from your picks, with a real case, so you can see and click how it would actually work.</p>
    <button onclick="document.getElementById('dx-sim').scrollIntoView({behavior:'smooth',block:'start'})" class="mt-5 px-4 py-2 rounded-full text-[13.5px] font-bold text-slate-950" style="background:linear-gradient(90deg,#5eead4,#4DFFA6)">Jump to the mock ↓</button>`;
  const nav = E.querySelector('nav .text-\\[15px\\]'); if (nav) nav.innerHTML = 'Design decisions <span class="text-white/40 font-normal">· the investigation area</span>';
  const g = $('explore-grid'); g.className = 'relative max-w-[1240px] mx-auto px-6 pb-24 space-y-14';
  g.innerHTML = DX.map((el, n) => `<section>
      <div class="flex items-baseline gap-3 flex-wrap"><span class="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-slate-950" style="background:#5eead4">${n + 1}</span><h2 class="text-[26px] font-black text-white">${el.name}</h2><span class="text-[15px] text-white/55">${el.q}</span></div>
      <div class="mt-5 dx-grid">${el.opts.map(o => { const on = (S.dxPick[el.key] || el.rec) === o.id;
        return `<article class="rounded-3xl border ${on ? 'border-teal-300/70 ring-2 ring-teal-300/30' : 'border-white/10'} p-4 flex flex-col" style="background:linear-gradient(180deg, rgb(255 255 255 / .05), rgb(255 255 255 / .015))">
          <div class="rounded-2xl border border-white/10 overflow-hidden" style="height:200px;background:rgb(10 14 30 / .7)"><div style="zoom:.42;pointer-events:none;padding:8px">${el.render(o.id)}</div></div>
          <div class="mt-4 flex items-center gap-2"><span class="w-6 h-6 rounded-md bg-white/10 text-white text-[12px] font-black flex items-center justify-center">${o.id}</span><h3 class="text-[17px] font-bold text-white">${o.name}</h3>
            <span class="ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold ${el.rec === o.id ? 'bg-teal-300 text-slate-950' : 'bg-white/10 text-white/65'}">${el.rec === o.id ? 'My pick' : o.tag}</span></div>
          <p class="mt-2 text-[13.5px] text-white/70 leading-relaxed">${o.idea}</p>
          <div class="mt-3 grid grid-cols-2 gap-3 flex-1 text-[12.5px]">
            <div><div class="text-[10.5px] font-bold tracking-[.14em] text-emerald-300/80 mb-1">PROS</div>${o.pros.map(x => `<div class="flex gap-1.5 text-white/75 mt-1"><span class="text-emerald-300">✓</span>${x}</div>`).join('')}</div>
            <div><div class="text-[10.5px] font-bold tracking-[.14em] text-rose-300/80 mb-1">CONS</div>${o.cons.map(x => `<div class="flex gap-1.5 text-white/60 mt-1"><span class="text-rose-300">✕</span>${x}</div>`).join('')}</div>
          </div>
          <button onclick="S.dxPick['${el.key}']='${o.id}';const st=document.getElementById('explore').scrollTop;showExplore();document.getElementById('explore').scrollTop=st" class="mt-4 py-2 rounded-xl text-[13px] font-semibold ${on ? 'bg-teal-300 text-slate-950' : 'border border-white/15 text-white/80 hover:bg-white/5'}">${on ? 'In the mock' : `Use ${o.id} in the mock`}</button>
        </article>`; }).join('')}</div></section>`).join('')
    + `<section><div class="text-[12px] font-black tracking-[.18em]" style="color:#5eead4">THE MOCK · BUILT FROM YOUR PICKS</div><h2 class="mt-2 text-[28px] font-black text-white">How it would look on a real case</h2><p class="mt-2 text-[15px] text-white/55">Everything is clickable: checkpoints, matrix rows, hypothesis cards, the blast-radius toggle and the tabs. Hover the graph for activity.</p><div id="dx-sim" class="mt-5"></div></section>`;
  renderDxSim();
  icons();
}

function hideExplore() { $('explore').classList.add('hidden'); }
