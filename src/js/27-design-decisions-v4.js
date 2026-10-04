/* ======================================================================
   DESIGN DECISIONS v4
   ====================================================================== */
/* ---------- 1B · header + what decided it (A + C) ---------- */
dxV = (orig => function (id) {
  if (id !== 'B') return orig(id);
  const H = DXD.hyp, alt = `<div class="text-[11px] text-ink3 tracking-wide">OTHER HYPOTHESES JOSH TESTED</div>${H.slice(1).map(h => `<div class="mt-2"><div class="flex justify-between gap-6 text-[12.5px]"><span class="text-ink">${h.q}</span><span class="text-ink3">${h.pct}%</span></div><div class="mt-1">${dxBar(h.pct, h.col, 5)}</div></div>`).join('')}`;
  return dxCard(`<div class="grid gap-6" style="grid-template-columns:1fr 300px"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">SUMMARY</div><p class="mt-2 text-[14px] text-white/80 leading-relaxed">a.levi clicked a link in an “Urgent invoice” email. The page exploited Edge, dropped an unsigned DLL and ran it. The DLL beacons to a known Cobalt Strike server and tried to read credentials, which was blocked.</p>
      <div class="mt-4 grid gap-4" style="grid-template-columns:1fr 1fr"><div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT DECIDED IT</div>${['The email link served a browser exploit', 'The dropped DLL is known Cobalt Strike malware', 'It tried to read credentials (blocked)'].map(x => `<div class="mt-1.5 flex gap-2 text-[13px] text-white/85"><span class="mt-0.5 w-4 h-4 rounded-full border border-emerald-400/50 bg-emerald-500/10 text-emerald-300 flex items-center justify-center text-[10px] shrink-0">✓</span>${x}</div>`).join('')}</div>
        <div><div class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT WOULD CHANGE IT</div><div class="mt-1.5 text-[13px] text-white/70">An approved phishing simulation that used this exact link and file.</div></div></div></div>
    <div class="border-l border-white/10 pl-6"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</div>
      <div class="mt-1 flex items-center gap-3"><span class="text-[26px] font-black text-rose-400">Malicious</span><span class="flex gap-1 w-[90px]">${[1, 1, 1].map(() => '<span class="flex-1 h-2 rounded-full bg-rose-500"></span>').join('')}</span></div><div class="text-[12px] text-white/55">High confidence</div>
      <div class="mt-2 rounded-xl px-3 py-2 bg-rose-500/[.08] border border-rose-400/30 text-[12.5px] text-white/85"><span class="font-black text-rose-300 mr-1">H1 · ${H[0].pct}%</span>${H[0].q}</div>
      <div class="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-indigo-200 cursor-help" ${tipAttr(alt)}><span class="w-4 h-4 rounded-full border border-indigo-300/60 flex items-center justify-center text-[10px]">i</span>2 other hypotheses ruled out · hover</div></div></div>`);
})(dxV);

/* ---------- 2B · step-by-step board (each step leads to the next) ---------- */
var dxStepBoard = function () {
  const R = DXD.rounds, Q = DXD.qs, H = DXD.hyp, EV = DXD.events; S.dxBcp = S.dxBcp ?? R.length - 1; const k = S.dxBcp, r = R[k];
  const issues = EV.filter(e => e.k === 'issue' && dxRoundOf(e) <= k), pbs = EV.filter(e => e.k === 'pb' && dxRoundOf(e) <= k), asked = Q.filter(q => q.r <= k);
  S.dxSel2 = S.dxSel2 ?? null; S.dxQ2 = S.dxQ2 ?? -1;
  const steps = [
    { key: 'c', t: 'Case created', s: '#555548 · 09:04', st: 'done', d: `${dxLbl('WHAT')}<p class="text-[13.5px] text-white/80">Cortex opened the case when a.levi clicked a suspicious email link.</p>${dxLbl('JOSH')}<p class="text-[13.5px] text-white/80">Picked it up the same minute.</p>` },
    { key: 'g', t: 'Issues grouped', s: `${issues.length} issues so far`, st: 'done', fresh: issues.some(e => dxRoundOf(e) === k) && k > 0, d: `${dxLbl('ISSUES IN THE CASE')}${issues.map(e => `<div class="mt-1 flex items-center gap-2 text-[13px] text-white/80"><span class="w-2 h-2 rounded-full" style="background:${dxSev(e.sev)}"></span><span class="font-mono text-white/45">${e.t}</span>${e.n}</div>`).join('')}${dxLbl('WHY GROUPED')}<p class="text-[13px] text-white/75">They share the email, the user a.levi or the host SOC-Tech.</p>` },
    { key: 'p', t: 'Playbooks ran', s: `${pbs.length} runs · enrichment`, st: 'done', d: `${dxLbl('RUNS')}${pbs.map(e => `<div class="mt-1 text-[13px] text-white/80"><span class="font-mono text-white/45 mr-2">${e.t}</span>${e.n}</div>`).join('')}${dxLbl('WHAT THEY DON’T DO')}<p class="text-[13px] text-white/75">Playbooks enrich each issue. They don’t reason across the case; Josh does.</p>` },
    { key: 'h', t: 'Framed 3 hypotheses', s: `H1 leads at ${r.h[0]}%`, st: 'done', bar: [r.h[0], H[0].col], d: `${H.map((h, i) => `<div class="mt-2"><div class="flex justify-between text-[13px]"><span class="text-white/85"><b style="color:${h.col}">${h.id}</b> · ${h.q}</span><span class="text-white/55">${r.h[i]}%${k ? ` <span class="${dxDelta(k, i) > 0 ? 'text-emerald-300' : dxDelta(k, i) < 0 ? 'text-rose-300' : 'text-white/30'}">${dxDelta(k, i) > 0 ? '+' : ''}${dxDelta(k, i)}</span>` : ''}</span></div><div class="mt-1">${dxBar(r.h[i], h.col, 5)}</div></div>`).join('')}` },
    { key: 'q', t: `Investigated ${asked.length} questions`, s: `${asked.filter(q => q.eff[0] > 0).length} support H1 · ${Q.length - asked.length} still open`, st: asked.length < Q.length ? 'running' : 'done', fresh: asked.some(q => q.r === k) && k > 0,
      d: `${dxLbl('QUESTIONS · click one for its evidence')}${asked.map(q => { const i = Q.indexOf(q); return `<button onclick="S.dxQ2=S.dxQ2===${i}?-1:${i};renderDxSim()" class="mt-1.5 w-full text-left rounded-xl px-3 py-2 border ${S.dxQ2 === i ? 'border-indigo-300/60 bg-indigo-500/10' : 'border-white/10 bg-white/[.03] hover:border-white/25'}"><div class="flex items-center gap-2"><span class="flex-1 text-[13px] text-white/90">${q.q}</span>${dxAns(q.a)}</div><div class="mt-1 flex gap-1">${q.eff.map((w, h) => dxEff(w, H[h].id)).join('')}${q.r === k && k ? dxNew : ''}</div></button>${S.dxQ2 === i ? `<div class="mt-1.5">${dxEventsTable(i)}</div>` : ''}`; }).join('')}` },
    { key: 'v', t: k >= 2 ? 'Verdict · Malicious' : 'Verdict', s: k >= 2 ? `H1 ${r.h[0]}% · High confidence` : `Not yet · H1 at ${r.h[0]}%`, st: k >= 2 ? 'done' : 'running', d: `${dxLbl('WHY')}<p class="text-[13.5px] text-white/80">${k >= 2 ? 'The email led to an exploit, a known loader ran, and no simulation covers it.' : 'Josh needs more evidence before deciding.'}</p>` },
    { key: 'o', t: 'Josh’s offers', s: k >= 2 ? `${k >= 4 ? 4 : 3} offers · 1 needs you` : 'After the verdict', st: k >= 2 ? 'wait' : 'queued', d: k >= 2 ? DX_ACT.slice(0, k >= 4 ? 4 : 3).map(([t, s1, sub]) => `<div class="mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2 border ${s1 === 'wait' ? 'border-amber-500/40' : 'border-white/10'} bg-white/[.03] text-[13px]"><span class="flex-1 text-white/90">${t}</span><span class="${s1 === 'wait' ? 'text-amber-300' : s1 === 'done' ? 'text-emerald-300' : 'text-white/50'} text-[12px]">${sub}</span></div>`).join('') : '' }
  ];
  const badge = st => st === 'done' ? ['bg-cx/15 c-cx', '✓'] : st === 'wait' ? ['bg-amber-500/15 c-amber', '✋'] : st === 'running' ? ['bg-blue-500/15 c-blue', '◌'] : ['bg-white/5 text-ink3', '◷'];
  return dxCard(`<div class="dx-row">${steps.map((x, i) => { const [bc, bi] = badge(x.st), on = S.dxSel2 === x.key, tg = `S.dxSel2=S.dxSel2==='${x.key}'?null:'${x.key}';renderDxSim()`;
      const brd = x.fresh ? 'border-teal-300/60' : x.st === 'wait' ? 'border-amber-500/40' : x.st === 'running' ? 'border-blue-500/40' : x.st === 'done' ? 'border-cx/25' : 'border-white/[.08]';
      const josh = `<span class="absolute" style="top:-11px;right:-11px">${agentAv(PILLARS.analyst, 24, false)}</span>`;
      if (!on) return `<button onclick="${tg}" class="dxc ${i < steps.length - 1 ? 'fc-next' : ''} relative rounded-2xl border ${brd} text-left p-4 flex flex-col hover:border-indigo-300/60 ${x.st === 'queued' ? 'opacity-60' : ''}" style="background:linear-gradient(180deg, rgb(255 255 255 / .06), rgb(255 255 255 / .02))">${josh}<div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md text-[11px] ${bc}">${bi}</span><span class="text-[11px] font-mono text-ink3">${String(i + 1).padStart(2, '0')}</span>${x.fresh ? `<span class="ml-auto">${dxNew}</span>` : ''}</div><div class="fc-t mt-2.5 text-[15px] font-bold text-ink leading-snug">${x.t}</div><div class="fc-s mt-1 text-[12.5px] text-ink3">${x.s}</div>${x.bar ? `<div class="mt-auto" style="width:100%">${dxBar(x.bar[0], x.bar[1], 6)}</div>` : ''}</button>`;
      return `<div class="dxc dx-open relative rounded-2xl border ${brd} p-5" style="background:linear-gradient(180deg, rgb(255 255 255 / .06), rgb(255 255 255 / .02))">${josh}<div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md text-[11px] ${bc}">${bi}</span><span class="text-[11px] font-mono text-ink3">step ${String(i + 1).padStart(2, '0')}</span><button onclick="${tg}" class="ml-auto text-ink3 text-[12px]">Collapse</button></div><div class="text-[17px] font-bold text-ink mt-2">${x.t}</div><div class="text-[13px] text-ink3">${x.s}</div>${x.d}</div>`; }).join('')}</div>${dxBullets()}`);
}

/* ---------- 2A · next-gen whiteboard (Miro-like) ---------- */
var dxMiroNotes = function () {
  const Q = DXD.qs, H = DXD.hyp, EV = DXD.events.filter(e => e.k === 'issue' || e.k === 'info');
  const n = [];
  EV.forEach((e, i) => n.push({ key: 'm-e' + i, f: 'case', x: 40 + (i % 3) * 150, y: 70 + Math.floor(i / 3) * 130, bg: '#bfdbfe', t: e.n, s: e.t }));
  H.forEach((h, i) => n.push({ key: 'm-h' + i, f: 'hyp', x: 560 + i * 150, y: 70, bg: '#fbcfe8', t: `${h.id} · ${h.q}`, s: `${h.pct}%` }));
  Q.forEach((q, i) => n.push({ key: 'm-q' + i, f: 'q', x: 560 + (i % 3) * 150, y: 275 + Math.floor(i / 3) * 140, bg: '#fde68a', t: q.q, s: `${q.a}`, eff: q.eff }));
  n.push({ key: 'm-v', f: 'dec', x: 1060, y: 70, bg: '#fecaca', t: 'Verdict: Malicious', s: 'High confidence' });
  DX_ACT.forEach(([t, st], i) => n.push({ key: 'm-a' + i, f: 'dec', x: 1060 + (i % 2) * 150, y: 210 + Math.floor(i / 2) * 130, bg: st === 'done' ? '#bbf7d0' : '#a7f3d0', t, s: st === 'wait' ? 'Needs you' : st === 'done' ? 'Done' : 'Suggested' }));
  S.dxMpos = S.dxMpos || {}; n.forEach(x => { if (S.dxMpos[x.key]) [x.x, x.y] = S.dxMpos[x.key]; });
  return n;
}
var dxMiro = function () {
  S.dxMz = S.dxMz ?? .62; S.dxMp = S.dxMp || [10, 0];
  const n = dxMiroNotes(), z = S.dxMz, [px, py] = S.dxMp;
  const frames = [['The case', 20, 30, 470, 400, '#93c5fd'], ['Hypotheses', 540, 30, 470, 190, '#f9a8d4'], ['Questions Josh asked', 540, 250, 470, 320, '#fcd34d'], ['Decision', 1040, 30, 320, 440, '#6ee7b7']];
  const last = n.find(x => x.key === 'm-q5');
  return dxCard(`<div class="flex items-center gap-2 mb-2"><div class="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1">${['↖', '▢', '↗', '💬'].map((t, i) => `<span class="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] ${i === 0 ? 'bg-indigo-500/25 text-white' : 'text-white/60'}">${t}</span>`).join('')}</div>
      <span class="text-[12px] text-white/50">Drag the background to pan · drag notes to move them</span>
      <div class="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1"><button onclick="S.dxMz=Math.max(.35,S.dxMz-.1);renderDxSim()" class="w-8 h-8 rounded-lg text-white/75 hover:bg-white/10">−</button><span class="w-12 text-center text-[12px] text-white/70">${Math.round(z * 100)}%</span><button onclick="S.dxMz=Math.min(1.2,S.dxMz+.1);renderDxSim()" class="w-8 h-8 rounded-lg text-white/75 hover:bg-white/10">+</button><button onclick="S.dxMz=.62;S.dxMp=[10,0];renderDxSim()" class="px-2 h-8 rounded-lg text-[12px] text-white/70 hover:bg-white/10">Fit</button></div></div>
    <div id="dx-miro" onpointerdown="dxMiroPan(event)" class="relative rounded-2xl border border-white/10 overflow-hidden" style="height:520px;cursor:grab;background-color:#f4f5f8;background-image:radial-gradient(rgb(0 0 0 / .12) 1px, transparent 1px);background-size:${22 * z}px ${22 * z}px;background-position:${px}px ${py}px">
      <div id="dx-miro-world" class="absolute" style="left:0;top:0;transform-origin:0 0;transform:translate(${px}px,${py}px) scale(${z});width:1400px;height:800px">
        ${frames.map(([t, x, y, w, h, c]) => `<div class="absolute rounded-xl" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:rgb(255 255 255 / .75);border:1.5px solid ${c}"><div class="absolute" style="top:-22px;left:0;font-size:13px;font-weight:700;color:#334155">${t}</div></div>`).join('')}
        <svg class="absolute inset-0 pointer-events-none" width="1400" height="800">${DXD.qs.map((q, i) => q.eff.map((w, h) => { if (!w) return ''; const a = n.find(x => x.key === 'm-q' + i), b = n.find(x => x.key === 'm-h' + h); return `<path d="M${a.x + 65},${a.y} C${a.x + 65},${a.y - 50} ${b.x + 65},${b.y + 160} ${b.x + 65},${b.y + 115}" fill="none" stroke="${w > 0 ? '#16a34a' : '#e11d48'}" stroke-width="2" opacity=".55"/>`; }).join('')).join('')}</svg>
        ${n.map(x => `<div data-mn="${x.key}" onpointerdown="event.stopPropagation();dxMiroDown(event,'${x.key}')" class="absolute select-none" style="left:${x.x}px;top:${x.y}px;width:132px;min-height:112px;padding:10px;background:${x.bg};box-shadow:0 6px 14px -6px rgb(0 0 0 / .35);transform:rotate(${(x.key.length % 3 - 1) * .8}deg);cursor:grab;border-radius:3px">
          <div style="font-size:12px;line-height:1.35;color:#1e293b;font-weight:600">${x.t}</div><div style="margin-top:6px;font-size:11px;color:#475569">${x.s}</div>${x.eff ? `<div class="mt-1 flex gap-1">${x.eff.map((w, h) => w ? `<span style="font-size:10px;font-weight:700;color:${w > 0 ? '#15803d' : '#be123c'}">${w > 0 ? '▲' : '▼'}H${h + 1}</span>` : '').join('')}</div>` : ''}
          <span class="absolute" style="right:-9px;bottom:-9px">${agentAv(PILLARS.analyst, 22, false)}</span></div>`).join('')}
        ${last ? `<div class="absolute pointer-events-none dx-cursor" style="left:${last.x + 120}px;top:${last.y + 90}px"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M2,2 L18,10 L10,12 L7,20 Z" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/></svg><span class="absolute left-4 top-4 whitespace-nowrap px-2 py-0.5 rounded-md bg-blue-500 text-white text-[11px] font-bold">Josh</span></div>
          <div class="absolute pointer-events-none rounded-xl px-3 py-2" style="background:#fff;color:#334155;font-size:12px;box-shadow:0 8px 20px -8px rgb(0 0 0 / .3);left:${last.x + 150}px;top:${last.y + 130}px;width:210px;border:1px solid #cbd5e1"><b>Josh</b> added a note: the same email hit 2 more inboxes. Checking if anyone clicked.</div>` : ''}
      </div>
      <div class="absolute rounded-lg p-1.5" style="right:12px;bottom:12px;width:150px;height:90px;background:rgb(255 255 255 / .92);border:1px solid #cbd5e1"><div class="relative w-full h-full">${n.map(x => `<span class="absolute rounded-[1px]" style="left:${x.x / 1400 * 100}%;top:${x.y / 800 * 100}%;width:8px;height:7px;background:${x.bg};border:.5px solid rgb(0 0 0 / .2)"></span>`).join('')}<span class="absolute border-2 border-blue-500 rounded" style="left:${Math.max(0, -px / z / 1400 * 100)}%;top:${Math.max(0, -py / z / 800 * 100)}%;width:${Math.min(100, 1000 / z / 1400 * 100)}%;height:${Math.min(100, 520 / z / 800 * 100)}%"></span></div></div>
      <div class="absolute flex items-center gap-2 rounded-full pl-1 pr-3 py-1" style="left:12px;bottom:12px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:12px">${agentAv(PILLARS.analyst, 22, true)}<span><b>Josh</b> is on the board</span></div>
    </div>`);
}
let _dxMd = null;
function dxMiroPan(e) { _dxMd = { pan: true, sx: e.clientX, sy: e.clientY, ox: S.dxMp[0], oy: S.dxMp[1] }; }
var dxMiroDown = function (e, key) { const n = dxMiroNotes().find(x => x.key === key); _dxMd = { key, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, el: e.currentTarget }; }
document.addEventListener('pointermove', e => {
  const d = _dxMd; if (!d) return;
  const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
  if (d.pan) { S.dxMp = [d.ox + dx, d.oy + dy]; const w = document.getElementById('dx-miro-world'), b = document.getElementById('dx-miro'); if (w) w.style.transform = `translate(${S.dxMp[0]}px,${S.dxMp[1]}px) scale(${S.dxMz})`; if (b) b.style.backgroundPosition = `${S.dxMp[0]}px ${S.dxMp[1]}px`; return; }
  const z = S.dxMz || 1, nx = d.ox + dx / z, ny = d.oy + dy / z; S.dxMpos = S.dxMpos || {}; S.dxMpos[d.key] = [nx, ny]; d.el.style.left = nx + 'px'; d.el.style.top = ny + 'px';
});
document.addEventListener('pointerup', () => { if (_dxMd) { const wasNote = !_dxMd.pan; _dxMd = null; if (wasNote) renderDxSim(); } });
dxP = (orig => function (id) { return id === 'A' ? dxMiro() : id === 'B' ? dxStepBoard() : orig(id); })(dxP);

/* ---------- 3B · Josh’s explanation with citations ---------- */
dxR = (orig => function (id) {
  if (id !== 'B') return orig(id);
  S.dxCite = S.dxCite ?? -1; const Q = DXD.qs;
  const c = (i, n) => `<button onclick="S.dxCite=S.dxCite===${i}?-1:${i};renderDxSim()" class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 rounded-md text-[10.5px] font-bold align-[2px] ${S.dxCite === i ? 'bg-indigo-400 text-slate-950' : 'bg-indigo-500/25 text-indigo-200 hover:bg-indigo-500/40'}" ${tipAttr(`<div class="text-[12.5px] text-ink">${Q[i].q}</div><div class="text-[12px] text-ink3">${DX_EVENTS[i].length} events · click to open</div>`)}>${n}</button>`;
  const para = [
    `a.levi opened an “Urgent invoice” email and clicked its link. The page served a browser exploit${c(0, 1)}. Within seconds Edge wrote an unsigned DLL to disk and ran it with rundll32${c(1, 2)}.`,
    `That DLL is a known Cobalt Strike loader, seen in two FIN7 campaigns${c(2, 3)}. There is no phishing simulation or red-team activity scheduled that could explain it${c(3, 4)}.`,
    `At 09:39 the loader tried to read LSASS memory; Cortex XDR blocked it${c(4, 5)}. The same email reached two more inboxes, but nobody else clicked and there are no logins from SOC-Tech to other machines${c(5, 6)}.`
  ];
  return dxCard(`<div class="flex items-center gap-2 mb-3">${agentAv(PILLARS.analyst, 26, false)}<span class="text-[13px] text-white/70">Josh explains what he found. Every claim cites the question and the raw events behind it.</span></div>
    <div class="space-y-3 text-[15px] leading-[1.75] text-white/85 max-w-[900px]">${para.map(p => `<p>${p}</p>`).join('')}</div>
    <div class="mt-4 flex gap-2 flex-wrap">${Q.map((q, i) => `<button onclick="S.dxCite=S.dxCite===${i}?-1:${i};renderDxSim()" class="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border text-[12px] ${S.dxCite === i ? 'border-indigo-300/70 bg-indigo-500/15 text-white' : 'border-white/10 bg-white/[.03] text-white/70 hover:text-white'}"><span class="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-100 text-[10.5px] font-bold flex items-center justify-center">${i + 1}</span>${q.q.length > 34 ? q.q.slice(0, 33) + '…' : q.q}</button>`).join('')}</div>
    ${S.dxCite >= 0 ? `<div class="mt-3 rounded-xl p-4 border border-indigo-400/30 bg-indigo-500/[.05]"><div class="flex items-start gap-3"><div class="flex-1"><div class="text-[11px] font-bold tracking-[.14em] text-white/45">SOURCE ${S.dxCite + 1}</div><div class="text-[14px] font-semibold text-white mt-0.5">${Q[S.dxCite].q} ${dxAns(Q[S.dxCite].a)}</div></div><div class="flex gap-1">${Q[S.dxCite].eff.map((w, h) => dxEff(w, DXD.hyp[h].id)).join('')}</div></div><div class="mt-3">${dxEventsTable(S.dxCite)}</div></div>` : ''}`);
})(dxR);

/* ---------- 4A · attack replay (creative): the product-style graph, step by step ---------- */
const DXRP = [
  ['09:01', 'mail', 'Invoice email delivered'], ['09:03', 'user', 'a.levi clicks the link'], ['09:03', 'page', 'Exploit page loads'], ['09:04', 'edge', 'Edge is exploited'],
  ['09:04', 'dll', 'payload.dll is dropped'], ['09:04', 'rdl', 'rundll32 runs the payload'], ['09:15', 'c2', 'Beaconing to 8.130.54.67'], ['09:39', 'lsass', 'LSASS read attempt, blocked'], ['—', 'svc', 'svc_backup could be exposed']
];
function dxReplay() {
  S.dxRp = S.dxRp ?? DXRP.length - 1; const t = S.dxRp;
  let svg = dxAttackStory();
  const shown = new Set(DXRP.slice(0, t + 1).map(x => x[1]));
  const ids = ['mail', 'user', 'page', 'edge', 'host', 'dll', 'rdl', 'c2', 'lsass', 'svc', 'other'];
  return `${svg.replace('<svg viewBox="0 0 940 320"', `<style>${ids.filter(i => !shown.has(i) && !(i === 'host' && shown.has('edge')) && !(i === 'other' && shown.has('mail'))).map(() => '').join('')}</style><svg viewBox="0 0 940 320"`)}`
    .replace(/(<\/div>)\s*$/, '') + `<div class="-mt-2 mx-5 mb-4 rounded-2xl border border-white/10 bg-white/[.03] p-3 flex items-center gap-3">
      <button onclick="dxReplayPlay()" class="w-9 h-9 rounded-full bg-teal-300 text-slate-950 font-black">${S.dxRpT ? '❚❚' : '▶'}</button>
      <div class="flex-1"><input type="range" min="0" max="${DXRP.length - 1}" value="${t}" oninput="S.dxRp=+this.value;renderDxSim()" class="w-full accent-teal-300"/>
        <div class="flex justify-between text-[10.5px] font-mono text-white/45">${DXRP.map(x => `<span>${x[0]}</span>`).join('')}</div></div>
      <div class="w-[230px] text-[13px] text-white"><div class="text-[11px] text-white/45 font-mono">${DXRP[t][0]}</div>${DXRP[t][2]}</div></div></div>`;
}
function dxReplayPlay() {
  if (S.dxRpT) { clearInterval(S.dxRpT); S.dxRpT = null; renderDxSim(); return; }
  S.dxRp = 0; S.dxRpT = setInterval(() => { if (!document.getElementById('dx-sim')) return; S.dxRp++; if (S.dxRp >= DXRP.length - 1) { S.dxRp = DXRP.length - 1; clearInterval(S.dxRpT); S.dxRpT = null; } renderDxSim(); }, 900); renderDxSim();
}
// dim steps that haven't happened yet by tagging nodes/edges in the product-style graph
const _dxAS = dxAttackStory;
dxAttackStory = function () {
  let h = _dxAS();
  if ((S.dxPick && S.dxPick.attack) !== 'A') return h;
  const order = DXRP.map(x => x[1]), t = S.dxRp ?? order.length - 1, seen = new Set(order.slice(0, t + 1)); if (seen.has('edge')) seen.add('host'); if (seen.has('mail') && t >= 2) seen.add('other');
  return h.replace(/<g style="cursor:help" ([^>]*?)color="#e7ecff"><circle cx="(\d+)" cy="(\d+)"/g, (m, a, x, y) => { const id = { '70,150': 'mail', '200,150': 'user', '330,150': 'page', '460,150': 'edge', '460,255': 'host', '590,150': 'dll', '720,150': 'rdl', '860,70': 'c2', '860,150': 'lsass', '860,255': 'svc', '200,255': 'other' }[x + ',' + y]; const vis = seen.has(id), cur = id === order[t];
    return `<g style="cursor:help;opacity:${vis ? 1 : .12};transition:opacity .4s" ${a}color="#e7ecff">${cur ? `<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#5eead4" stroke-width="2"><animate attributeName="r" values="20;30;20" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>` : ''}<circle cx="${x}" cy="${y}"`; });
};
dxG = (orig => function (id) { return id === 'A' ? dxReplay() : orig(id); })(dxG);

/* ---------- option texts ---------- */
(() => {
  DX[0].opts[1] = { id: 'B', name: 'Header + what decided it', tag: 'A + C', idea: 'The header from A (summary, verdict, the winning hypothesis, others on hover) plus, under the summary, the three facts that decided it and what would change Josh’s mind.', pros: ['The verdict and its reasons in one glance', 'Alternatives still one hover away', 'Great for approvals'], cons: ['A little taller than A'] };
  DX[0].rec = 'B';
  const P = DX[1];
  P.opts[0] = { id: 'A', name: 'Live whiteboard', tag: 'Next-gen, Miro-like', idea: 'An infinite board with frames (the case, hypotheses, questions, decision), sticky notes, connectors, zoom and a minimap. Josh works on it live: you see his cursor and his comments as he adds notes.', pros: ['Feels collaborative, like working with a teammate', 'Free to rearrange and annotate', 'Presence makes autonomy visible'], cons: ['Less structured for quick reading', 'Needs good defaults to avoid clutter'] };
  P.opts[1] = { id: 'B', name: 'Step-by-step board', tag: 'Like the case today', idea: 'The board from the case, simplified: each step leads to the next (case created → issues grouped → playbooks → hypotheses → questions → verdict → offers). Questions are one step that opens into the full list; every step opens into a square.', pros: ['Familiar and easy to follow', 'Not crowded: 7 steps, each expandable', 'Cycle bullets replay the evolving case'], cons: ['Details are one click deeper'] };
  DX[2].opts[1] = { id: 'B', name: 'Josh explains, with citations', tag: 'Reads like a report', idea: 'Josh’s explanation in plain sentences. Every claim carries a numbered citation; click it for the question, the answer and its raw events.', pros: ['Easiest to read and share', 'Every claim is traceable to data', 'Feels like an AI answer with sources'], cons: ['Hypothesis effects are secondary', 'Less scannable than a table'] };
  const G = DX[3];
  G.opts[0] = { id: 'A', name: 'Attack replay', tag: 'Creative', idea: 'The product-style attack graph with a play button and a time scrubber: watch the attack unfold step by step, with the current step highlighted.', pros: ['Makes the attack story memorable', 'Great for briefings and handovers'], cons: ['Static view is the same as C'] };
})();

/* ---------- a juicier summary ---------- */
function dxSummary() {
  const E = (t, h) => `<span class="ent" style="cursor:help;border-bottom:1px dashed rgb(165 180 252 / .6);color:#e0e7ff" ${tipAttr(h)}>${t}</span>`;
  const N = t => `<b class="text-white">${t}</b>`;
  return `<p class="mt-2 text-[14.5px] text-white/80 leading-[1.7]">At ${N('09:03')} ${E('a.levi', '<div class="text-[13px] text-ink">a.levi</div><div class="text-[12px] text-ink3">Finance · SOC-Tech</div>')} clicked the link in an ${E('“Urgent invoice #4471”', '<div class="text-[13px] text-ink">Phishing email</div><div class="text-[12px] text-ink3">From billing@inv0ice-mail[.]com · 3 recipients</div>')} email. ${N('One second later')} the page exploited Edge on ${E('SOC-Tech', '<div class="text-[13px] text-ink">SOC-Tech</div><div class="text-[12px] text-ink3">Windows 11 · finance workstation</div>')}, dropped ${E('payload.dll', '<div class="text-[13px] text-ink">payload.dll</div><div class="text-[12px] text-ink3">Unsigned · Cobalt Strike loader (WildFire)</div>')} and ran it.</p>
    <p class="mt-2 text-[14.5px] text-white/80 leading-[1.7]">Since then it has called home to ${E('8.130.54.67', '<div class="text-[13px] text-ink">8.130.54.67</div><div class="text-[12px] text-ink3">Known Cobalt Strike server · FIN7 infrastructure</div>')} ${N('24 times')}, every ~45 seconds, and at ${N('09:39')} it tried to steal credentials from memory. ${N('Cortex XDR blocked it.')} Two colleagues got the same email; ${N('neither clicked')}.</p>
    <div class="mt-3 flex gap-2 flex-wrap">${[['Contained to', '1 host'], ['Credentials stolen', 'None'], ['Exposure', '3 assets reachable']].map(([a, b]) => `<span class="px-2.5 py-1 rounded-lg bg-white/[.05] border border-white/10 text-[12px] text-white/60">${a} <b class="text-white">${b}</b></span>`).join('')}</div>`;
}
dxV = (orig => function (id) {
  const h = orig(id);
  return h.replace(/<p class="mt-2 text-\[14px\] text-white\/80 leading-relaxed">a\.levi clicked a link in an “Urgent invoice” email\.[\s\S]*?<\/p>/, dxSummary());
})(dxV);

/* ---------- 2A · the whiteboard in our design, notes expand ---------- */
dxMiro = function () {
  S.dxMz = S.dxMz ?? .62; S.dxMp = S.dxMp || [10, 0];
  const n = dxMiroNotes(), z = S.dxMz, [px, py] = S.dxMp, Q = DXD.qs, H = DXD.hyp;
  const colOf = x => x.f === 'case' ? '#60a5fa' : x.f === 'hyp' ? '#f472b6' : x.f === 'q' ? '#fbbf24' : '#34d399';
  const frames = [['The case', 20, 30, 470, 400, '#60a5fa'], ['Hypotheses', 540, 30, 470, 190, '#f472b6'], ['Questions Josh asked', 540, 250, 470, 320, '#fbbf24'], ['Decision', 1040, 30, 320, 440, '#34d399']];
  const last = n.find(x => x.key === 'm-q5');
  const detail = x => { const i = +x.key.replace(/\D/g, ''); const L = t => `<div style="font-size:9.5px;font-weight:900;letter-spacing:.14em;color:rgb(255 255 255 / .45);margin-top:10px">${t}</div>`;
    if (x.f === 'q') { const q = Q[i]; return `${L('WHY JOSH ASKED')}<div style="font-size:12px;color:rgb(255 255 255 / .8)">${q.why}</div>${L('FOUND')}${q.ev.map(e => `<div style="font-size:12px;color:rgb(255 255 255 / .8);margin-top:3px">✓ ${e}</div>`).join('')}${L('EFFECT')}<div style="display:flex;gap:4px;margin-top:4px">${q.eff.map((w, h) => dxEff(w, H[h].id)).join('')}</div>${L('EVIDENCE')}<div style="font-size:12px;color:rgb(255 255 255 / .6)">${DX_EVENTS[i].length} raw events · ${[...new Set(DX_EVENTS[i].map(e => e[1]))].join(', ')}</div>`; }
    if (x.f === 'hyp') { const h = H[i]; return `${L('TESTED BY')}${Q.filter(q => q.eff[i]).map(q => `<div style="font-size:12px;color:rgb(255 255 255 / .8);margin-top:3px">${q.eff[i] > 0 ? '▲' : '▼'} ${q.q}</div>`).join('')}${L('OVER TIME')}<div style="font-size:12px;color:rgb(255 255 255 / .7)">${DXD.rounds.map(r => `${r.t} ${r.h[i]}%`).join(' → ')}</div>`; }
    if (x.f === 'case') return `${L('WHAT JOSH DID')}<div style="font-size:12px;color:rgb(255 255 255 / .8)">${(DXD.qs.filter(q => q.r === dxRoundOf(DXD.events.filter(e => e.k === 'issue' || e.k === 'info')[i])).map(q => 'Asked: ' + q.q).join('<br>')) || 'Kept it as context.'}</div>`;
    return `${L('WHY')}<div style="font-size:12px;color:rgb(255 255 255 / .8)">${x.key === 'm-v' ? 'Exploit page, known malware loader, and no simulation that explains it.' : ['Cuts the C2 channel on SOC-Tech.', 'Stops every host from reaching the attacker.', 'Removes any stolen session for a.levi.', 'Removes the email before anyone clicks.'][i]}</div>`; };
  return dxCard(`<div class="flex items-center gap-2 mb-2"><div class="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1">${['↖', '▢', '↗', '💬'].map((t, i) => `<span class="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] ${i === 0 ? 'bg-indigo-500/25 text-white' : 'text-white/60'}">${t}</span>`).join('')}</div>
      <span class="text-[12px] text-white/50">Drag to pan · drag notes to move · click a note to open it</span>
      <div class="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/[.04] p-1"><button onclick="S.dxMz=Math.max(.35,S.dxMz-.1);renderDxSim()" class="w-8 h-8 rounded-lg text-white/75 hover:bg-white/10">−</button><span class="w-12 text-center text-[12px] text-white/70">${Math.round(z * 100)}%</span><button onclick="S.dxMz=Math.min(1.2,S.dxMz+.1);renderDxSim()" class="w-8 h-8 rounded-lg text-white/75 hover:bg-white/10">+</button><button onclick="S.dxMz=.62;S.dxMp=[10,0];renderDxSim()" class="px-2 h-8 rounded-lg text-[12px] text-white/70 hover:bg-white/10">Fit</button></div></div>
    <div id="dx-miro" onpointerdown="dxMiroPan(event)" class="relative rounded-2xl border border-white/10 overflow-hidden" style="height:540px;cursor:grab;background-color:#0a0f1f;background-image:radial-gradient(rgb(255 255 255 / .08) 1px, transparent 1px);background-size:${22 * z}px ${22 * z}px;background-position:${px}px ${py}px">
      <div id="dx-miro-world" class="absolute" style="left:0;top:0;transform-origin:0 0;transform:translate(${px}px,${py}px) scale(${z});width:1400px;height:800px">
        ${frames.map(([t, x, y, w, h, c]) => `<div class="absolute rounded-2xl" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:rgb(255 255 255 / .025);border:1.5px dashed ${c}55"><div class="absolute" style="top:-24px;left:2px;font-size:13px;font-weight:800;color:${c}">${t}</div></div>`).join('')}
        <svg class="absolute inset-0 pointer-events-none" width="1400" height="800">${Q.map((q, i) => q.eff.map((w, h) => { if (!w) return ''; const a = n.find(x => x.key === 'm-q' + i), b = n.find(x => x.key === 'm-h' + h); return `<path d="M${a.x + 66},${a.y} C${a.x + 66},${a.y - 50} ${b.x + 66},${b.y + 160} ${b.x + 66},${b.y + 112}" fill="none" stroke="${w > 0 ? '#4ade80' : '#fb7185'}" stroke-width="1.6" opacity=".45"/>`; }).join('')).join('')}</svg>
        ${n.map(x => { const open = S.dxMOpen === x.key, c = colOf(x);
          return `<div data-mn="${x.key}" onpointerdown="event.stopPropagation();dxMiroDown(event,'${x.key}')" class="absolute select-none rounded-xl" style="left:${x.x}px;top:${x.y}px;width:${open ? 300 : 132}px;min-height:${open ? 0 : 108}px;padding:10px 11px;z-index:${open ? 20 : 1};background:linear-gradient(180deg, rgb(30 38 80 / .97), rgb(16 22 46 / .97));border:1px solid ${open ? 'rgb(165 180 252 / .8)' : 'rgb(255 255 255 / .12)'};border-top:3px solid ${c};box-shadow:0 12px 30px -14px rgb(0 0 0 / .9);cursor:grab">
            <div style="font-size:${open ? 14 : 12}px;line-height:1.35;color:#f1f5ff;font-weight:700">${x.t}</div><div style="margin-top:5px;font-size:11px;color:rgb(255 255 255 / .55)">${x.s}</div>${x.eff && !open ? `<div style="margin-top:4px;display:flex;gap:5px">${x.eff.map((w, h) => w ? `<span style="font-size:10px;font-weight:700;color:${w > 0 ? '#4ade80' : '#fb7185'}">${w > 0 ? '▲' : '▼'}H${h + 1}</span>` : '').join('')}</div>` : ''}
            ${open ? detail(x) + `<div style="margin-top:10px;font-size:11px;color:#a5b4fc">Click to close</div>` : ''}
            <span class="absolute" style="right:-10px;top:-12px">${agentAv(PILLARS.analyst, 22, false)}</span></div>`; }).join('')}
        ${last ? `<div class="absolute pointer-events-none dx-cursor" style="left:${last.x + 120}px;top:${last.y + 90}px"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M2,2 L18,10 L10,12 L7,20 Z" fill="#5eead4" stroke="#0a0f1f" stroke-width="1.5"/></svg><span class="absolute whitespace-nowrap px-2 py-0.5 rounded-md text-[11px] font-bold" style="left:16px;top:16px;background:#5eead4;color:#04261a">Josh</span></div>
          <div class="absolute pointer-events-none rounded-xl px-3 py-2" style="left:${last.x + 150}px;top:${last.y + 130}px;width:220px;background:#141b38;border:1px solid rgb(94 234 212 / .4);color:rgb(255 255 255 / .85);font-size:12px"><b style="color:#5eead4">Josh</b> added a note: the same email hit 2 more inboxes. Checking if anyone clicked.</div>` : ''}
      </div>
      <div class="absolute rounded-lg p-1.5" style="right:12px;bottom:12px;width:150px;height:90px;background:rgb(10 15 31 / .9);border:1px solid rgb(255 255 255 / .15)"><div class="relative w-full h-full">${n.map(x => `<span class="absolute rounded-[2px]" style="left:${x.x / 1400 * 100}%;top:${x.y / 800 * 100}%;width:8px;height:6px;background:${colOf(x)}"></span>`).join('')}<span class="absolute rounded" style="border:1.5px solid #a5b4fc;left:${Math.max(0, -px / z / 1400 * 100)}%;top:${Math.max(0, -py / z / 800 * 100)}%;width:${Math.min(100, 1000 / z / 1400 * 100)}%;height:${Math.min(100, 540 / z / 800 * 100)}%"></span></div></div>
      <div class="absolute flex items-center gap-2 rounded-full pl-1 pr-3 py-1" style="left:12px;bottom:12px;background:rgb(10 15 31 / .9);border:1px solid rgb(94 234 212 / .35);color:rgb(255 255 255 / .8);font-size:12px">${agentAv(PILLARS.analyst, 22, true)}<span><b style="color:#fff">Josh</b> is on the board</span></div>
    </div>`);
};
// click vs drag on notes
dxMiroDown = function (e, key) { const n = dxMiroNotes().find(x => x.key === key); _dxMd = { key, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, el: e.currentTarget, moved: false }; };
document.addEventListener('pointermove', e => { if (_dxMd && !_dxMd.pan && Math.abs(e.clientX - _dxMd.sx) + Math.abs(e.clientY - _dxMd.sy) > 4) _dxMd.moved = true; }, true);
document.addEventListener('pointerup', () => { const d = _dxMd; if (d && !d.pan && !d.moved) { S.dxMOpen = S.dxMOpen === d.key ? null : d.key; } }, true);

/* ---------- 2B · zoomed out ---------- */
dxStepBoard = (orig => function () { return orig().replace('<div class="dx-row">', '<div class="dx-row" style="zoom:.72;grid-template-columns:repeat(7,minmax(0,1fr));gap:16px 30px">'); })(dxStepBoard);

/* ---------- 2C · decluttered: playbooks folded into issues, lines only for the selected card ---------- */
dxFbItems = (orig => function () {
  const it = orig().filter(x => !(x.kind === 'case' && x.ev && x.ev.k === 'pb'));
  const pbs = DXD.events.filter(e => e.k === 'pb');
  let row = 0; it.forEach(x => { if (x.kind === 'case') { const pb = pbs.find(p => dxRoundOf(p) === x.round && p.x > x.ev.x && p.x - x.ev.x < 60); if (pb) x.sub += ` · ${pb.n.split(' · ')[0]} ran`; if (!S.dxPos[x.key]) x.y = 52 + row * 92; row++; } });
  return it;
})(dxFbItems);
dxFbLinesSVG = function (items) {
  const k = S.dxFbCyc ?? DXD.rounds.length - 1, sel = S.dxFbSel;
  return dxFbLinks(items).map(({ A, B, col, bold }) => { const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2, mx = (x1 + x2) / 2, dim = A.round > k || B.round > k, hit = sel && (A.key === sel || B.key === sel);
    const base = A.kind === 'case' ? .12 : A.kind === 'q' ? .3 : .8, op = dim ? .06 : sel ? (hit ? 1 : .05) : base;
    return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${col}" stroke-width="${hit ? 2.2 : bold ? 2.2 : 1.2}" opacity="${op}"/>`; }).join('');
};

/* ---------- 3A · folded by default ---------- */
dxR = (orig => function (id) { if (id === 'A' && S.dxRowInit !== true) { S.dxRow = -1; S.dxRowInit = true; } return orig(id); })(dxR);
