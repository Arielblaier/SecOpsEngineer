/* ======================================================================
   DESIGN DECISIONS v3: an evolving case, Josh in the mock, new options
   ====================================================================== */
const DXQX = [
  { why: 'The case opened on a click from an email. First check: was the page itself malicious?', xql: 'dataset = proxy_logs | filter user = "a.levi" and url contains "invoice-portal" | fields _time, url, status, bytes' },
  { why: 'A new issue arrived: an unsigned DLL ran on SOC-Tech. Josh checked what the browser did after the click.', xql: 'dataset = xdr_data | filter agent_hostname = "SOC-Tech" and actor_process_image_name = "msedge.exe" | fields _time, action_file_path, action_process_command_line' },
  { why: 'If the DLL is known malware, “a legitimate finance tool” is almost impossible.', xql: 'dataset = xdr_data | filter action_file_sha256 = "a3f1…9e2b" | join (dataset = wildfire) | fields verdict, family' },
  { why: 'Before calling it malicious: rule out an approved phishing simulation.', xql: 'itsm.search(asset = "SOC-Tech", type in ("red_team","simulation"), window = 7d)' },
  { why: 'A critical issue joined the case: something touched LSASS. Josh checked if credentials were stolen.', xql: 'dataset = xdr_data | filter agent_hostname = "SOC-Tech" and action_type = "PROCESS_ACCESS" and target = "lsass.exe"' },
  { why: 'The same email reached 2 more inboxes. Josh checked whether the attack spread.', xql: 'dataset = email | filter subject contains "Urgent invoice #4471" | fields recipient, clicked' }
];
DXD.qs.forEach((q, i) => Object.assign(q, DXQX[i]));
const dxRoundOf = e => DXD.rounds.findIndex((r, k) => e.x <= r.x && (k === 0 || e.x > DXD.rounds[k - 1].x));
const dxDelta = (k, i) => k ? DXD.rounds[k].h[i] - DXD.rounds[k - 1].h[i] : 0;
const dxNew = `<span class="px-1.5 py-px rounded bg-teal-300 text-slate-950 text-[9.5px] font-black tracking-wide">NEW</span>`;
const dxLbl = t => `<div class="text-[10.5px] font-bold tracking-[.14em] text-white/45 mt-3 mb-1">${t}</div>`;

/* ---------- 2C · the canvas, bigger, evolving, with rich steps ---------- */
dxBoard = function () {
  const R = DXD.rounds, Q = DXD.qs, H = DXD.hyp, EV = DXD.events;
  S.dxBcp = S.dxBcp ?? R.length - 1; const k = S.dxBcp, r = R[k]; S.dxBsel = S.dxBsel ?? null;
  const st = s0 => s0 === 'done' ? ['bg-cx/15 c-cx', '✓', 'DONE', 'c-cx'] : s0 === 'wait' ? ['bg-amber-500/15 c-amber', '✋', 'NEEDS YOU', 'c-amber'] : s0 === 'running' ? ['bg-blue-500/15 c-blue', '◌', 'IN PROGRESS', 'c-blue'] : ['bg-white/5 text-ink3', '◷', 'LATER', 'text-ink3'];
  let n = 0;
  const card = (s0, key, next) => { const [bc, bi, bl, tc] = st(s0.state), on = S.dxBsel === key, num = String(++n).padStart(2, '0');
    const brd = s0.fresh ? 'border-teal-300/60' : s0.state === 'done' ? 'border-cx/25' : s0.state === 'wait' ? 'border-amber-500/40' : s0.state === 'running' ? 'border-blue-500/40' : 'border-white/[.08]';
    const bg = s0.state === 'queued' ? 'background:rgb(255 255 255 / .02)' : 'background:linear-gradient(180deg, rgb(255 255 255 / .06), rgb(255 255 255 / .02))';
    const tg = `S.dxBsel=S.dxBsel==='${key}'?null:'${key}';renderDxSim()`;
    if (!on) return `<button onclick="${tg}" class="dxc ${next ? 'fc-next' : ''} relative rounded-2xl border ${brd} text-left p-4 flex flex-col hover:border-indigo-300/60 ${s0.state === 'queued' ? 'opacity-60' : ''}" style="${bg}">
      <div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md text-[11px] ${bc}">${bi}</span><span class="text-[11px] font-mono text-ink3">${s0.time || num}</span>${s0.fresh ? `<span class="ml-auto">${dxNew}</span>` : ''}</div>
      <div class="fc-t mt-2.5 text-[14.5px] font-bold text-ink leading-snug">${s0.title}</div><div class="fc-s mt-1 text-[12.5px] text-ink3 leading-snug">${s0.sub}</div>
      <div class="mt-auto pt-2" style="width:100%">${s0.chips ? `<div class="flex gap-1 flex-wrap">${s0.chips}</div>` : ''}${s0.bar ? `<div style="width:100%">${dxBar(s0.bar[0], s0.bar[1], 6)}</div>` : ''}</div></button>`;
    return `<div class="dxc dx-open relative rounded-2xl border ${brd} p-5" style="${bg}"><div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md text-[11px] ${bc}">${bi}</span><span class="text-[11px] font-black tracking-[.14em] ${tc}">${bl}</span><span class="text-[11px] font-mono text-ink3">${s0.time ? '· ' + s0.time : ''}</span>${s0.fresh ? dxNew : ''}<button onclick="${tg}" class="ml-auto text-ink3 text-[12px] hover:text-ink">Collapse</button></div>
      <div class="text-[17px] font-bold text-ink mt-2 leading-snug">${s0.title}</div><div class="text-[13px] text-ink3 mt-0.5">${s0.sub}</div>${s0.detail || ''}</div>`; };
  const evCards = EV.filter(e => dxRoundOf(e) <= k && e.k !== 'case').map(e => ({ title: e.n.split(' · ')[0], sub: e.k === 'pb' ? `Playbook · ${e.n.split(' · ')[1] || ''}` : e.k === 'info' ? 'Informational signal' : `Issue · ${{ crit: 'Critical', high: 'High', med: 'Medium' }[e.sev]}`, time: e.t, state: 'done', fresh: dxRoundOf(e) === k && k > 0,
    detail: `${dxLbl('WHAT HAPPENED')}<p class="text-[13.5px] text-white/80">${e.k === 'pb' ? `The ${e.n.split(' · ')[0]} playbook ran automatically on the new issue and took ${e.n.split(' · ')[1]}.` : e.k === 'info' ? 'An informational signal was linked to the case. It doesn’t raise the score on its own.' : `Cortex grouped this issue into the case because it shares ${e.n.includes('email') ? 'the email message' : 'the host SOC-Tech and the user a.levi'}.`}</p>
      ${dxLbl('WHAT JOSH DID WITH IT')}<p class="text-[13.5px] text-white/80">${Q.filter(q => q.r === dxRoundOf(e)).map(q => `Asked: ${q.q}`).join('<br>') || 'Kept it as context; no new question was needed.'}</p>` }));
  const phases = [
    ['THE CASE', 'changes on its own', evCards],
    ['FRAME', 'what could be true', H.map((h, i) => ({ title: `${h.id} · ${h.q}`, sub: `${r.h[i]}%${k ? ` · ${dxDelta(k, i) > 0 ? '+' : ''}${dxDelta(k, i)} this cycle` : ''}`, state: 'done', bar: [r.h[i], h.col],
      detail: `${dxLbl('HOW IT MOVED')}<div class="flex items-end gap-1.5 h-[46px]">${R.slice(0, k + 1).map((x, j) => `<div class="flex flex-col items-center gap-1"><span class="w-6 rounded-t" style="height:${Math.max(3, x.h[i] * .4)}px;background:${h.col};opacity:${j === k ? 1 : .45}"></span><span class="text-[9.5px] font-mono text-white/45">${x.t}</span></div>`).join('')}</div>
        ${dxLbl('TESTED BY')}${Q.filter(q => q.r <= k && q.eff[i]).map(q => `<div class="mt-1 flex items-center gap-2 text-[13px] text-white/80">${dxEff(q.eff[i], h.id)}<span>${q.q}</span></div>`).join('') || '<div class="text-[13px] text-white/45">Not tested yet</div>'}` }))],
    ['INVESTIGATE', 'questions Josh asked', Q.map((q, i) => q.r <= k ? { title: q.q, sub: `Answer: ${q.a}`, time: R[q.r].t, state: 'done', fresh: q.r === k, chips: q.eff.map((w, h) => dxEff(w, H[h].id)).join(''),
      detail: `${dxLbl('WHY JOSH ASKED')}<p class="text-[13.5px] text-white/80">${q.why}</p>${dxLbl('THE QUERY')}<pre class="rounded-lg px-3 py-2 bg-black/40 border border-white/10 text-[11px] text-white/70 font-mono whitespace-pre-wrap">${esc(q.xql)}</pre>
        ${dxLbl('WHAT HE FOUND')}${q.ev.map(e => `<div class="mt-1 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}
        ${dxLbl('EFFECT')}<div class="flex gap-1.5 flex-wrap">${q.eff.map((w, h) => dxEff(w, H[h].id)).join('') || '<span class="text-[13px] text-white/45">No effect yet</span>'}</div><div class="mt-3">${dxEventsTable(i)}</div>` } : { title: q.q, sub: 'Not asked yet', state: 'queued' })],
    ['DECIDE', 'the verdict', [k >= 2 ? { title: 'Verdict · Malicious', sub: `H1 ${r.h[0]}% vs ${Math.max(r.h[1], r.h[2])}%`, time: R[2].t, state: 'done', fresh: k === 2,
      detail: `${dxLbl('WHY')}<p class="text-[13.5px] text-white/80">The email led to an exploit page, Edge dropped and ran a known Cobalt Strike loader, and no simulation covers it.</p>${dxLbl('WHAT WOULD CHANGE IT')}<p class="text-[13.5px] text-white/80">An approved phishing simulation that used this exact link and file.</p>${k > 2 ? `${dxLbl('SINCE THE VERDICT')}<p class="text-[13.5px] text-white/80">${R.slice(3, k + 1).map(x => `${x.t}: ${x.n}`).join('<br>')}</p>` : ''}` } : { title: 'Verdict', sub: `Not yet · H1 leads at ${r.h[0]}%`, state: 'running', detail: `${dxLbl('WHERE IT STANDS')}<p class="text-[13.5px] text-white/80">Josh needs more evidence before deciding. H1 leads, but H2 and H3 aren’t ruled out.</p>` }]],
    ['RESPOND', 'what Josh offers', k >= 2 ? DX_ACT.slice(0, k >= 4 ? 4 : 3).map(([t, s1, sub], i) => ({ title: t, sub, state: s1, fresh: (k === 2 && i < 3) || (k === 4 && i === 3),
      detail: `${dxLbl('WHY')}<p class="text-[13.5px] text-white/80">${['Cuts the C2 channel and stops further credential attempts on SOC-Tech.', 'Stops all Bank US hosts from reaching the attacker server.', 'Signs a.levi out everywhere in case the session was stolen.', 'Removes the email before anyone else clicks it.'][i]}</p>${dxLbl('RISK')}<p class="text-[13.5px] text-white/80">${['Medium · a.levi can’t work on SOC-Tech until it’s released. One click to undo.', 'Low · no business traffic to this address in 30 days.', 'Low · one extra sign-in with MFA.', 'None · the two recipients never opened it.'][i]}</p>${s1 === 'wait' ? '<div class="mt-3 flex gap-2"><span class="px-3 py-1.5 rounded-full bg-indigo-500/30 border border-indigo-300/50 text-[12.5px] text-white font-semibold">Approve</span><span class="px-3 py-1.5 rounded-full border border-white/15 text-[12.5px] text-white/75">Decline</span></div>' : ''}` })) : [{ title: 'Nothing to offer yet', sub: 'Offers come after the verdict', state: 'queued' }]]
  ];
  return dxCard(`<div class="space-y-5">${phases.map(([label, sub, steps]) => `<div class="flex gap-5"><div class="shrink-0 pt-1" style="width:110px"><div class="text-[11px] font-black tracking-[.16em] ${steps.some(x => x.fresh) ? 'text-teal-300' : 'text-ink3'}">${label}</div><div class="text-[11px] text-white/40 mt-0.5">${sub}</div></div><div class="flex-1 min-w-0 dx-row">${steps.map((s0, si) => card(s0, label + si, si < steps.length - 1)).join('')}</div></div>`).join('')}</div>${dxBullets()}`);
};
dxP = function (id) {
  const R = DXD.rounds, Q = DXD.qs, H = DXD.hyp, EV = DXD.events;
  if (id === 'C') return dxBoard();
  if (id === 'A') { // changelog: one entry per cycle (trigger → what Josh did → result)
    S.dxLog = S.dxLog ?? R.length - 1;
    return dxCard(`<div class="relative pl-6"><div class="absolute left-[9px] top-2 bottom-2 w-px bg-white/15"></div>${R.map((r, k) => { const trig = EV.filter(e => dxRoundOf(e) === k && e.k !== 'pb'), qs = Q.filter(q => q.r === k), on = S.dxLog === k;
      return `<div class="relative mb-3"><span class="absolute -left-[22px] top-3 w-3.5 h-3.5 rounded-full border-2 ${r.verdict ? 'bg-rose-500 border-rose-300' : on ? 'bg-teal-300 border-teal-200' : 'bg-[#0b1030] border-white/40'}"></span>
        <button onclick="S.dxLog=S.dxLog===${k}?-1:${k};renderDxSim()" class="w-full text-left rounded-xl px-4 py-3 border ${on ? 'border-indigo-300/50 bg-indigo-500/[.07]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}">
          <div class="flex items-center gap-3 flex-wrap"><span class="font-mono text-[12px] text-white/50">${r.t}</span><span class="text-[14px] font-semibold text-white">${r.n}</span><span class="ml-auto flex items-center gap-1.5">${H.map((h, i) => k ? `<span class="text-[11px] font-bold" style="color:${h.col}">${h.id} ${dxDelta(k, i) > 0 ? '+' : ''}${dxDelta(k, i)}</span>` : '').join('')}</span></div>
          <div class="mt-1 text-[12.5px] text-white/55">Because: ${trig.map(e => e.n).join(' · ') || 'the case opened'}</div></button>
        ${on ? `<div class="mt-2 ml-1 grid gap-3" style="grid-template-columns:1fr 1fr"><div class="rounded-xl p-3 bg-white/[.03] border border-white/10">${dxLbl('JOSH ASKED')}${qs.map(q => `<div class="mt-1.5 text-[13px] text-white/85">${q.q} ${dxAns(q.a)}<div class="text-[12px] text-white/45 mt-0.5">${q.why}</div></div>`).join('') || `<div class="text-[13px] text-white/60">${r.n}</div>`}</div>
          <div class="rounded-xl p-3 bg-white/[.03] border border-white/10">${dxLbl('HYPOTHESES AFTER')}${H.map((h, i) => `<div class="mt-1.5 flex items-center gap-2 text-[12px]"><span class="w-6 font-bold" style="color:${h.col}">${h.id}</span><span class="flex-1">${dxBar(r.h[i], h.col, 5)}</span><span class="w-9 text-right text-white/60">${r.h[i]}%</span></div>`).join('')}</div></div>` : ''}</div>`; }).join('')}</div>`);
  }
  // B · hypothesis race: how the explanations competed over time
  S.dxRace = S.dxRace ?? R.length - 1; const k = S.dxRace, r = R[k];
  const X = i => 60 + i * 200, Y = v => 190 - v * 1.6;
  return dxCard(`<svg viewBox="0 0 900 270" class="w-full h-auto" font-family="Lato, sans-serif">
    ${[0, 25, 50, 75, 100].map(v => `<line x1="40" x2="880" y1="${Y(v)}" y2="${Y(v)}" stroke="rgb(255 255 255 / .06)"/><text x="30" y="${Y(v) + 3}" text-anchor="end" font-size="9" fill="rgb(255 255 255 / .35)">${v}%</text>`).join('')}
    ${H.map((h, i) => `<polyline points="${R.map((x, j) => `${X(j)},${Y(x.h[i])}`).join(' ')}" fill="none" stroke="${h.col}" stroke-width="${i ? 1.8 : 2.8}" opacity="${i ? .8 : 1}"/>${R.map((x, j) => `<circle cx="${X(j)}" cy="${Y(x.h[i])}" r="${j === k ? 5 : 3}" fill="${h.col}"/>`).join('')}<text x="${X(R.length - 1) + 10}" y="${Y(R[R.length - 1].h[i]) + [4, -4, 10][i]}" font-size="11" font-weight="700" fill="${h.col}">${h.id}</text>`).join('')}
    <line x1="40" x2="880" y1="222" y2="222" stroke="rgb(255 255 255 / .15)"/>
    ${R.map((x, j) => `<g style="cursor:pointer" onclick="S.dxRace=${j};renderDxSim()"><rect x="${X(j) - 60}" y="20" width="120" height="235" fill="transparent"/><line x1="${X(j)}" x2="${X(j)}" y1="30" y2="222" stroke="rgb(255 255 255 / ${j === k ? .35 : .08})" stroke-dasharray="3 4"/>
      ${EV.filter(e => dxRoundOf(e) === j && e.k === 'issue').map((e, q) => `<polygon points="${X(j) - 20 + q * 14},${234} ${X(j) - 14 + q * 14},${244} ${X(j) - 26 + q * 14},${244}" fill="${dxSev(e.sev)}"/>`).join('')}
      <text x="${X(j)}" y="262" text-anchor="middle" font-size="10.5" fill="${j === k ? '#fff' : 'rgb(255 255 255 / .5)'}">${x.t}${x.verdict ? ' · verdict' : ''}</text></g>`).join('')}
  </svg>
  <div class="mt-2 grid gap-3" style="grid-template-columns:1fr 1fr"><div class="rounded-xl p-3 bg-white/[.03] border border-white/10">${dxLbl(`AT ${r.t} · WHAT CHANGED`)}${EV.filter(e => dxRoundOf(e) === k).map(e => `<div class="mt-1 text-[13px] text-white/80">${e.n}</div>`).join('')}</div>
    <div class="rounded-xl p-3 bg-white/[.03] border border-white/10">${dxLbl('WHAT JOSH ASKED')}${Q.filter(q => q.r === k).map(q => `<div class="mt-1 text-[13px] text-white/85">${q.q} ${dxAns(q.a)}</div>`).join('') || `<div class="text-[13px] text-white/60">${r.n}</div>`}</div></div>`);
};

/* ---------- 3B · question tree: why each question was asked ---------- */
dxR = (orig => function (id) {
  if (id !== 'B') return orig(id);
  const Q = DXD.qs, H = DXD.hyp; S.dxTree = S.dxTree ?? 1;
  const tree = [{ q: 0, kids: [{ q: 1, kids: [{ q: 2 }, { q: 4 }] }, { q: 5 }] }, { q: 3 }];
  const nodeH = (t, d) => { const q = Q[t.q], on = S.dxTree === t.q;
    return `<div class="relative ${d ? 'ml-7' : ''}">${d ? '<span class="absolute -left-4 top-0 h-6 w-4 border-l border-b border-white/20 rounded-bl-lg"></span>' : ''}
      <button onclick="S.dxTree=S.dxTree===${t.q}?-1:${t.q};renderDxSim()" class="mt-2 w-full text-left rounded-xl px-3.5 py-2.5 border ${on ? 'border-indigo-300/60 bg-indigo-500/10' : 'border-white/10 bg-white/[.03] hover:border-white/25'}"><div class="flex items-center gap-2"><span class="flex-1 text-[13.5px] text-white/90">${q.q}</span>${dxAns(q.a)}${q.eff.map((w, h) => dxEff(w, H[h].id)).join('')}</div>${d ? `<div class="text-[11.5px] text-white/45 mt-0.5">Follow-up: ${q.why}</div>` : ''}</button>
      ${on ? `<div class="mt-2 ${d ? '' : ''}">${dxEventsTable(t.q)}</div>` : ''}${(t.kids || []).map(k2 => nodeH(k2, d + 1)).join('')}</div>`; };
  return dxCard(`<div class="text-[12.5px] text-white/55">Each question is placed under the one that led to it, so you can see why Josh asked it.</div>
    <div class="mt-3 grid gap-5" style="grid-template-columns:1fr 1fr"><div><div class="text-[11px] font-black tracking-[.14em]" style="color:${H[0].col}">STARTED FROM H1 · ${H[0].q}</div>${nodeH(tree[0], 0)}</div>
      <div><div class="text-[11px] font-black tracking-[.14em]" style="color:${H[1].col}">TO RULE OUT H2 · ${H[1].q}</div>${nodeH(tree[1], 0)}</div></div>`);
})(dxR);

/* ---------- 4 · attack: sequence (A), containment preview (B), product style with gentle borders (C) ---------- */
const DXSEQ = { lanes: [['Email', 'artifact'], ['a.levi', 'asset'], ['SOC-Tech · Edge', 'asset'], ['payload.dll / rundll32', 'artifact'], ['8.130.54.67', 'artifact'], ['LSASS · svc_backup', 'asset']],
  steps: [['09:01', 0, 1, 'delivered to', 1], ['09:03', 1, 2, 'clicked the link on', 1], ['09:04', 2, 3, 'dropped and ran', 1], ['09:15', 3, 4, 'beacons to', 1], ['09:39', 3, 5, 'tried to read', 1], ['—', 5, 5, 'could expose svc_backup', 0]] };
function dxSeq() {
  const L = DXSEQ.lanes, X = i => 90 + i * 160;
  return dxCard(`<svg viewBox="0 0 980 340" class="w-full h-auto" font-family="Lato, sans-serif">
    ${L.map(([n, k0], i) => `<rect x="${X(i) - 70}" y="10" width="140" height="34" rx="10" fill="#0e1430" stroke="${k0 === 'asset' ? 'rgb(148 170 220 / .55)' : 'rgb(196 181 253 / .5)'}"/><text x="${X(i)}" y="31" text-anchor="middle" font-size="11.5" font-weight="700" fill="#eef2ff">${n}</text><line x1="${X(i)}" x2="${X(i)}" y1="44" y2="330" stroke="rgb(255 255 255 / .1)" stroke-dasharray="3 5"/>`).join('')}
    ${DXSEQ.steps.map(([t, a, b, v, obs], j) => { const y = 78 + j * 46, x1 = X(a), x2 = X(b), self = a === b;
      return `<g style="cursor:help" ${tipAttr(`<div class="text-[13px] text-ink">${L[a][0]} ${v} ${L[b][0]}</div><div class="text-[12px] text-ink3">${t}${obs ? ' · observed' : ' · suspected'}</div>`)}><text x="20" y="${y + 4}" font-size="10.5" font-family="JetBrains Mono, monospace" fill="rgb(255 255 255 / .5)">${t}</text>
        ${self ? `<path d="M${x1},${y - 8} c-40,0 -40,16 -4,16" fill="none" stroke="#fbbf24" stroke-dasharray="4 3" marker-end="url(#sqA)"/><text x="${x1 - 48}" y="${y + 4}" text-anchor="end" font-size="11" fill="#fcd34d">${v}</text>` :
        `<line x1="${x1}" x2="${x2 - (x2 > x1 ? 6 : -6)}" y1="${y}" y2="${y}" stroke="${obs ? '#fb7185' : '#fbbf24'}" stroke-width="1.6" marker-end="url(#sq${obs ? 'R' : 'A'})"/><rect x="${(x1 + x2) / 2 - v.length * 3.1 - 8}" y="${y - 20}" width="${v.length * 6.2 + 16}" height="16" rx="8" fill="#0a0f1f"/><text x="${(x1 + x2) / 2}" y="${y - 8}" text-anchor="middle" font-size="10.5" fill="#fecdd3">${v}</text>`}
        <circle cx="${x1}" cy="${y}" r="3.5" fill="#fb7185"/></g>`; }).join('')}
    <defs><marker id="sqR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9" fill="none" stroke="#fb7185" stroke-width="1.6"/></marker><marker id="sqA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9" fill="none" stroke="#fbbf24" stroke-width="1.6"/></marker></defs></svg>
    <div class="mt-1 text-[12px] text-white/50">Each column is an entity; each arrow is one step of the attack, in time order. Hover any step.</div>`);
}
function dxContain() {
  S.dxCt = !!S.dxCt;
  const cut = S.dxCt, Nn = [['SOC-Tech', 120, 140, 'asset', 1], ['a.levi', 120, 260, 'asset', 1], ['8.130.54.67', 380, 60, 'artifact', 1], ['svc_backup', 380, 200, 'asset', 0], ['FS-FIN-01', 640, 120, 'asset', 0], ['BACKUP-01', 640, 200, 'asset', 0], ['PAY-DB-01', 880, 200, 'crown', 0], ['VPN-GW', 380, 320, 'asset', 0]];
  const P = Object.fromEntries(Nn.map(n => [n[0], n]));
  const L = [['SOC-Tech', '8.130.54.67', 'C2 channel', 'Isolate SOC-Tech · Block the IP'], ['SOC-Tech', 'svc_backup', 'cached credential', 'Isolate SOC-Tech'], ['svc_backup', 'FS-FIN-01', 'admin rights', 'Isolate SOC-Tech'], ['svc_backup', 'BACKUP-01', 'service logon', 'Isolate SOC-Tech'], ['BACKUP-01', 'PAY-DB-01', 'DB credentials in backups', 'Isolate SOC-Tech'], ['a.levi', 'VPN-GW', 'saved VPN session', 'Reset a.levi']];
  return dxCard(`<div class="flex items-center gap-3 mb-2"><div class="text-[13px] text-white/70">What the attacker can reach now, and what Josh’s offers would cut.</div><button onclick="S.dxCt=!S.dxCt;renderDxSim()" class="ml-auto px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold ${cut ? 'bg-teal-300 text-slate-950' : 'border border-white/15 text-white/80'}">${cut ? 'Showing after Josh’s offers' : 'Preview Josh’s offers'}</button></div>
    <svg viewBox="0 0 1000 360" class="w-full h-auto" font-family="Lato, sans-serif">${L.map(([a, b, v, by]) => { const A = P[a], B = P[b], mx = (A[1] + B[1]) / 2, my = (A[2] + B[2]) / 2;
      return `<g ${tipAttr(`<div class="text-[13px] text-ink">${a} → ${b}</div><div class="text-[12px] text-ink3">${v}</div><div class="text-[12px] mt-1 ${cut ? 'text-emerald-300' : 'text-rose-300'}">${cut ? 'Cut by: ' + by : 'Open path'}</div>`)} style="cursor:help"><path d="M${A[1]},${A[2]} C${mx},${A[2]} ${mx},${B[2]} ${B[1]},${B[2]}" fill="none" stroke="${cut ? 'rgb(255 255 255 / .15)' : '#fb7185'}" stroke-width="1.6" ${cut ? 'stroke-dasharray="3 5"' : ''}/>${cut ? `<g transform="translate(${mx},${my})"><circle r="9" fill="#0a0f1f" stroke="#5eead4"/><path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="#5eead4" stroke-width="1.8"/></g>` : `<text x="${mx}" y="${my - 6}" text-anchor="middle" font-size="10" fill="#fda4af">${v}</text>`}<path d="M${A[1]},${A[2]} C${mx},${A[2]} ${mx},${B[2]} ${B[1]},${B[2]}" fill="none" stroke="transparent" stroke-width="16"/></g>`; }).join('')}
      ${Nn.map(([n, x, y, k0, comp]) => `<g ${tipAttr(`<div class="text-[13px] text-ink">${n}</div><div class="text-[12px] text-ink3">${comp ? 'Compromised' : k0 === 'crown' ? 'Crown jewel · reachable' : 'Reachable'}</div>`)} style="cursor:help"><rect x="${x - 62}" y="${y - 20}" width="124" height="40" rx="12" fill="#0e1430" stroke="${comp ? '#fb7185' : k0 === 'crown' ? '#f43f5e' : k0 === 'artifact' ? 'rgb(196 181 253 / .55)' : 'rgb(148 170 220 / .55)'}" ${comp ? '' : 'stroke-dasharray="4 3"'}/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#eef2ff">${k0 === 'crown' ? '♛ ' : ''}${n}</text></g>`).join('')}</svg>
    <div class="mt-1 text-[12.5px] ${cut ? 'text-emerald-300' : 'text-rose-300'}">${cut ? 'After Josh’s offers: 0 paths open · PAY-DB-01 no longer reachable' : '6 open paths · 1 crown jewel reachable in 3 hops'}</div>`);
}
dxAttackStory = (() => function () {
  const ASSET = 'rgb(125 200 225 / .7)', ART = 'rgb(205 185 255 / .65)';
  const html = (function () {
    const lbl = (x, y, a, b) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="rgb(var(--ink2))">${a}</text>${b ? `<text x="${x}" y="${y + 12}" text-anchor="middle" font-size="8.5" fill="rgb(var(--ink3))">${b}</text>` : ''}`;
    const tipH = (h, s, tag) => tipAttr(`<div class="text-[14px] font-bold text-ink">${h}</div><div class="text-[12.5px] text-ink2 mt-0.5">${s}</div>${tag ? `<div class="text-[11.5px] mt-1 text-ink3">${tag}</div>` : ''}`);
    const N = { mail: [70, 150, DXI.mail, 'Invoice email', '09:01', 'From billing@inv0ice-mail[.]com', 1, 0], user: [200, 150, DXI.user, 'a.levi', 'user', 'Finance · clicked at 09:03', 1, 1], page: [330, 150, DXI.web, 'invoice-portal[.]top', 'domain', 'Exploit page', 1, 0], edge: [460, 150, DXI.proc, 'msedge.exe', 'on SOC-Tech', 'Exploited at 09:04:01', 1, 0], host: [460, 255, '<rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-4,7 h8" stroke="currentColor" stroke-width="1.5"/>', 'SOC-Tech', 'host', 'Windows 11 · compromised', 1, 1], dll: [590, 150, DXI.file, 'payload.dll', 'file', 'Cobalt Strike loader', 1, 0], rdl: [720, 150, DXI.proc, 'rundll32.exe', 'process', 'Runs the payload', 1, 0], c2: [860, 70, DXI.ip, '8.130.54.67', 'IP', 'C2 · 24 beacons', 1, 0], lsass: [860, 150, DXI.cred, 'LSASS memory', 'read blocked', 'Credential protection stopped it', 1, 1], svc: [860, 255, DXI.user, 'svc_backup', 'service account', 'Cached logon · would be exposed', 0, 1], other: [200, 255, DXI.user, '2 other inboxes', 'users', 'Didn’t click', 1, 1] };
    const E = [['mail', 'user', 'delivered', 1], ['user', 'page', 'clicked', 1], ['page', 'edge', 'exploited', 1], ['edge', 'host', 'runs on', 1], ['edge', 'dll', 'dropped', 1], ['dll', 'rdl', 'loaded', 1], ['rdl', 'c2', 'beacons', 1], ['rdl', 'lsass', 'tried to read', 1], ['lsass', 'svc', 'would expose', 0], ['mail', 'other', 'also sent', 1]];
    const edge = ([a, b, v, obs]) => { const [x1, y1] = N[a], [x2, y2] = N[b], hz = Math.abs(x2 - x1) > 5, sx = x1 + (hz ? 18 : 0), sy = y1 + (hz ? 0 : 46), ex = x2 - (hz ? 18 : 0), ey = y2 - (hz ? 0 : 18), mx = (sx + ex) / 2;
      const d = hz ? `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}` : `M${sx},${sy} L${ex},${ey}`;
      return `<path d="${d}" fill="none" stroke="rgb(var(--line2))" stroke-width="1.1" ${obs ? '' : 'stroke-dasharray="4 3"'}/><text x="${hz ? mx : mx + 8}" y="${hz ? (sy === ey ? sy - 7 : (sy + ey) / 2 - 4) : (sy + ey) / 2}" text-anchor="${hz ? 'middle' : 'start'}" font-size="8.5" fill="rgb(var(--ink3))">${v}</text><path d="${d}" fill="none" stroke="transparent" stroke-width="14" style="cursor:help" ${tipH(`${N[a][3]} ${v} ${N[b][3]}`, N[b][5], obs ? 'Observed' : 'Suspected')}/>`; };
    const node = id => { const [x, y, ic0, a, b, tip, obs, asset] = N[id];
      return `<g style="cursor:help" ${tipH(a, tip, `${asset ? 'Asset' : 'Artifact'} · ${obs ? 'observed' : 'suspected'}`)} color="#e7ecff"><circle cx="${x}" cy="${y}" r="17" fill="${asset ? '#1f2d3f' : '#29263f'}" stroke="${asset ? ASSET : ART}" stroke-width="1.5" ${obs ? '' : 'stroke-dasharray="3 3"'}/><g transform="translate(${x},${y})">${ic0}</g>${lbl(x, y + 32, a, b)}</g>`; };
    const issues = [['user', 'High'], ['edge', 'High'], ['dll', 'High'], ['c2', 'Critical'], ['lsass', 'Critical']].map(([id, sev]) => { const [x, y] = N[id]; return `<polygon points="${x + 15},${y - 22} ${x + 21},${y - 12} ${x + 9},${y - 12}" fill="${sev === 'Critical' ? '#e11d48' : '#fb7185'}" ${tipAttr(`<div class="text-[13px] text-ink">Issue fired here · ${sev}</div>`)}/>`; }).join('');
    return `<svg viewBox="0 0 940 320" class="w-full h-auto" font-family="Lato, sans-serif">${E.map(edge).join('')}${Object.keys(N).map(node).join('')}${issues}</svg>`;
  })();
  return dxCard(html + `<div class="mt-1 flex items-center gap-4 text-[12px] text-white/50"><span><span style="display:inline-block;width:12px;height:12px;border-radius:9px;border:1.4px solid ${ASSET};vertical-align:-2px;margin-right:6px"></span>asset (users, hosts, accounts)</span><span><span style="display:inline-block;width:12px;height:12px;border-radius:9px;border:1.4px solid ${ART};vertical-align:-2px;margin-right:6px"></span>artifact (email, domain, file, process, IP)</span><span><span style="display:inline-block;width:18px;border-top:1.2px dashed rgb(148 158 196);vertical-align:middle;margin-right:6px"></span>suspected</span><span class="ml-auto">Hover anything</span></div>`);
})();
dxG = (orig => function (id) { return id === 'A' ? dxSeq() : id === 'B' ? dxContain() : dxAttackStory(); })(dxG);

/* ---------- option texts ---------- */
(() => {
  const P = DX[1]; P.rec = 'C'; P.q = 'The case keeps changing on its own. Does the view tell the story of an evolving case, and how Josh kept up?';
  P.opts[0] = { id: 'A', name: 'Investigation changelog', tag: 'Like a commit history', idea: 'One entry per cycle: what triggered it, how each hypothesis moved (+/−), and on open, what Josh asked and why.', pros: ['Very clear cause → action → result', 'Great for handover and audits', 'Compact, scales to long cases'], cons: ['Less visual', 'One cycle at a time'] };
  P.opts[1] = { id: 'B', name: 'Hypothesis race', tag: 'Shows the evolution', idea: 'A chart of how each hypothesis rose or fell across cycles, with the issues that caused each move marked underneath. Click a cycle for details.', pros: ['The evolution of the case is obvious at a glance', 'Shows exactly when the picture changed'], cons: ['Abstract for people new to hypotheses', 'Details live below the chart'] };
  P.opts[2] = { id: 'C', name: 'The investigation canvas', tag: 'Evolves with the case', idea: 'The case’s board, bigger. A “The case” lane shows issues and playbook runs as they arrive; new items in a cycle are marked NEW. Every step opens into a square with why, the query, findings, effect and raw events. Cycle bullets underneath replay the story.', pros: ['Tells the evolving story step by step', 'Each step carries its full reasoning', 'Already familiar from the case'], cons: ['Tall on big cases'] };
  const Rr = DX[2]; Rr.opts[1] = { id: 'B', name: 'Question tree', tag: 'Shows why each was asked', idea: 'Each question sits under the one that led to it, starting from the hypothesis it set out to test. Follow-ups explain what prompted them; click any question for its raw events.', pros: ['Explains the investigation’s logic, not just its results', 'Follow-ups triggered by new issues are obvious'], cons: ['Harder to compare answers side by side'] };
  const G = DX[3]; G.rec = 'C'; G.q = 'You need to know what happened, what is at risk, and what containment would change.';
  G.opts[0] = { id: 'A', name: 'Attack sequence', tag: 'What happened, in order', idea: 'A sequence diagram: each entity is a column and each step of the attack is an arrow, top to bottom in time.', pros: ['Order and timing are unambiguous', 'Easy to read for non-specialists'], cons: ['Branches are harder to see', 'No sense of reach'] };
  G.opts[1] = { id: 'B', name: 'Reach and containment', tag: 'Built for the decision', idea: 'Only what matters for the approval: the compromised entities, everything they can reach, and a “Preview Josh’s offers” toggle that shows which paths get cut.', pros: ['Answers “what happens if I approve?”', 'Crown jewels and paths are explicit'], cons: ['Doesn’t explain how the attack happened'] };
  G.opts[2] = { id: 'C', name: 'Attack story, product style', tag: 'Matches the product', idea: 'The attack in the case-graph language, with calm borders that separate assets (users, hosts, accounts) from artifacts (email, domain, file, process, IP). Red markers show where issues fired.', pros: ['Consistent with the product', 'Assets vs artifacts readable at a glance', 'Hover anything'], cons: ['No reach or containment view'] };
})();

/* ---------- 2C · a free investigation board (drag, structured detail, small cycle timeline) ---------- */
const DXFB = { W: 1060, H: 640 };
var dxFbItems = function () {
  const Q = DXD.qs, H = DXD.hyp, EV = DXD.events.filter(e => e.k !== 'case'), R = DXD.rounds;
  const it = [];
  EV.forEach((e, i) => it.push({ key: 'e' + i, kind: 'case', x: 20, y: 52 + i * 66, w: 210, h: 54, round: dxRoundOf(e), title: e.n.split(' · ')[0], sub: `${e.t} · ${e.k === 'pb' ? 'Playbook ' + (e.n.split(' · ')[1] || '') : e.k === 'info' ? 'Informational' : { crit: 'Critical', high: 'High', med: 'Medium' }[e.sev] + ' issue'}`, col: e.k === 'issue' ? dxSev(e.sev) : e.k === 'info' ? '#94a3b8' : '#64748b', ev: e }));
  Q.forEach((q, i) => it.push({ key: 'q' + i, kind: 'q', x: 280, y: 52 + i * 92, w: 250, h: 78, round: q.r, title: q.q, sub: `Answer: ${q.a}`, q, i }));
  H.forEach((h, i) => it.push({ key: 'h' + i, kind: 'h', x: 575, y: 80 + i * 150, w: 240, h: 96, round: 0, title: `${h.id} · ${h.q}`, sub: '', hyp: h, i }));
  it.push({ key: 'v', kind: 'v', x: 835, y: 120, w: 210, h: 92, round: 2, title: 'Verdict · Malicious', sub: 'H1 leads by 77 points' });
  DX_ACT.forEach(([t, st, sub], i) => it.push({ key: 'a' + i, kind: 'a', x: 835, y: 270 + i * 74, w: 210, h: 60, round: i === 3 ? 4 : 2, title: t, sub, st }));
  S.dxPos = S.dxPos || {}; it.forEach(x => { if (S.dxPos[x.key]) { x.x = S.dxPos[x.key][0]; x.y = S.dxPos[x.key][1]; } });
  return it;
}
function dxFbLinks(items) {
  const by = Object.fromEntries(items.map(x => [x.key, x])), L = [];
  items.filter(x => x.kind === 'case').forEach(e => items.filter(q => q.kind === 'q' && q.round === e.round).forEach(q => L.push([e.key, q.key, 'rgb(148 158 196 / .35)', 0])));
  items.filter(x => x.kind === 'q').forEach(q => q.q.eff.forEach((w, h) => { if (w) L.push([q.key, 'h' + h, w > 0 ? 'rgb(74 222 128 / .7)' : 'rgb(251 113 133 / .6)', 0]); }));
  L.push(['h0', 'v', 'rgb(244 63 94 / .8)', 1]);
  items.filter(x => x.kind === 'a').forEach(a => L.push(['v', a.key, 'rgb(129 140 248 / .5)', 0]));
  return L.map(([a, b, col, bold]) => ({ A: by[a], B: by[b], col, bold })).filter(l => l.A && l.B);
}
var dxFbLinesSVG = function (items) {
  const k = S.dxFbCyc ?? DXD.rounds.length - 1;
  return dxFbLinks(items).map(({ A, B, col, bold }) => { const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2, mx = (x1 + x2) / 2, dim = A.round > k || B.round > k;
    return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${col}" stroke-width="${bold ? 2.4 : 1.3}" opacity="${dim ? .12 : 1}"/>`; }).join('');
}
function dxFbCard(x) {
  const k = S.dxFbCyc ?? DXD.rounds.length - 1, dim = x.round > k, sel = S.dxFbSel === x.key, fresh = x.round === k && k > 0;
  const R = DXD.rounds[k];
  let body = '';
  if (x.kind === 'case') body = `<div class="flex items-start gap-2"><span class="mt-1 w-2 h-2 rounded-full shrink-0" style="background:${x.col}"></span><div class="min-w-0"><div class="text-[12.5px] font-semibold text-white leading-snug truncate">${x.title}</div><div class="text-[11px] text-white/50">${x.sub}</div></div></div>`;
  if (x.kind === 'q') body = `<div class="text-[12.5px] font-semibold text-white leading-snug" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${x.title}</div><div class="mt-1.5 flex items-center gap-1 flex-wrap">${dxAns(x.q.a)}${x.q.eff.map((w, h) => dxEff(w, DXD.hyp[h].id)).join('')}</div>`;
  if (x.kind === 'h') body = `<div class="text-[11px] font-black" style="color:${x.hyp.col}">${x.hyp.id} · ${R.h[x.i]}%</div><div class="mt-0.5 text-[12.5px] font-semibold text-white leading-snug" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${x.hyp.q}</div><div class="mt-2" style="width:100%">${dxBar(R.h[x.i], x.hyp.col, 5)}</div>`;
  if (x.kind === 'v') body = k >= 2 ? `<div class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</div><div class="text-[20px] font-black text-rose-400">Malicious</div><div class="text-[11.5px] text-white/55">H1 ${R.h[0]}% · High confidence</div>` : `<div class="text-[11px] font-bold tracking-[.14em] text-white/45">VERDICT</div><div class="text-[15px] font-bold text-white/70">Not yet</div><div class="text-[11.5px] text-white/50">H1 leads at ${R.h[0]}%</div>`;
  if (x.kind === 'a') body = `<div class="text-[12.5px] font-semibold text-white leading-snug truncate">${x.title}</div><div class="text-[11px] ${x.st === 'wait' ? 'text-amber-300' : 'text-white/50'}">${x.sub}</div>`;
  const josh = x.kind === 'case' ? `<span class="absolute" style="top:-9px;right:-9px" ${tipAttr('<div class="text-[12.5px] text-ink">Seen by Josh</div><div class="text-[11.5px] text-ink3">He folded it into the investigation</div>')}>${agentAv(PILLARS.analyst, 20, false)}</span>` : `<span class="absolute" style="top:-11px;right:-11px" ${tipAttr(`<div class="text-[12.5px] text-ink">${{ q: 'Asked by Josh', h: 'Framed by Josh', v: 'Decided by Josh', a: 'Offered by Josh' }[x.kind]}</div>`)}>${agentAv(PILLARS.analyst, 24, false)}</span>`;
  const brd = sel ? 'rgb(165 180 252 / .9)' : x.kind === 'a' && x.st === 'wait' ? 'rgb(245 158 11 / .55)' : x.kind === 'v' && k >= 2 ? 'rgb(244 63 94 / .55)' : fresh ? 'rgb(94 234 212 / .6)' : 'rgb(255 255 255 / .12)';
  return `<div data-fb="${x.key}" onpointerdown="dxFbDown(event,'${x.key}')" class="absolute rounded-2xl px-3 py-2.5 select-none" style="left:${x.x}px;top:${x.y}px;width:${x.w}px;min-height:${x.h}px;cursor:grab;opacity:${dim ? .28 : 1};background:${x.kind === 'case' ? 'rgb(255 255 255 / .035)' : 'linear-gradient(180deg, rgb(30 38 80 / .9), rgb(16 22 46 / .9))'};border:1px solid ${brd};box-shadow:${sel ? '0 0 0 3px rgb(129 140 248 / .25), ' : ''}0 10px 30px -18px rgb(0 0 0 / .8)">${fresh && !dim ? `<span class="absolute" style="top:-8px;left:12px">${dxNew}</span>` : ''}${josh}${body}</div>`;
}
function dxFbDetail(items) {
  const x = items.find(i => i.key === S.dxFbSel); if (!x) return '';
  const sec = (t, h) => `<div class="py-3 border-t border-white/[.07] first:border-0"><div class="text-[10.5px] font-black tracking-[.16em] text-white/45 mb-1.5">${t}</div>${h}</div>`;
  let parts = [];
  if (x.kind === 'q') { const q = x.q; parts = [['WHAT', `<div class="text-[14px] font-semibold text-white">${q.q}</div><div class="mt-1">${dxAns(q.a)}</div>`], ['WHY JOSH ASKED', `<p class="text-[13px] text-white/80">${q.why}</p>`], ['HOW', `<pre class="rounded-lg px-2.5 py-2 bg-black/40 border border-white/10 text-[10.5px] text-white/70 font-mono whitespace-pre-wrap">${esc(q.xql)}</pre>`], ['FOUND', q.ev.map(e => `<div class="flex gap-2 text-[13px] text-white/80 mt-1"><span class="text-emerald-300">✓</span>${e}</div>`).join('')], ['EFFECT', `<div class="flex gap-1.5 flex-wrap">${q.eff.map((w, h) => dxEff(w, DXD.hyp[h].id)).join('') || '<span class="text-[13px] text-white/45">None yet</span>'}</div>`], ['EVIDENCE', dxEventsTable(x.i)]]; }
  if (x.kind === 'h') { const h = x.hyp, i = x.i; parts = [['HYPOTHESIS', `<div class="text-[14px] font-semibold text-white">${h.q}</div>`], ['WHY JOSH CONSIDERED IT', `<p class="text-[13px] text-white/80">${['The activity matches a phishing-to-loader attack pattern.', 'Security teams run phishing simulations; this must be ruled out before calling it malicious.', 'Finance tools sometimes download and run plugins from links.'][i]}</p>`], ['OVER TIME', `<div class="flex items-end gap-2 h-[50px]">${DXD.rounds.map(r => `<div class="flex flex-col items-center gap-1"><span class="w-6 rounded-t" style="height:${Math.max(3, r.h[i] * .42)}px;background:${h.col}"></span><span class="text-[9.5px] font-mono text-white/45">${r.t}</span></div>`).join('')}</div>`], ['TESTED BY', DXD.qs.filter(q => q.eff[i]).map(q => `<div class="mt-1 flex items-center gap-2 text-[12.5px] text-white/80">${dxEff(q.eff[i], h.id)}${q.q}</div>`).join('')]]; }
  if (x.kind === 'case') { const e = x.ev; parts = [['WHAT HAPPENED', `<div class="text-[14px] font-semibold text-white">${e.n}</div><div class="text-[12px] text-white/50 mt-0.5">${e.t}</div>`], ['WHY IT’S IN THE CASE', `<p class="text-[13px] text-white/80">${e.k === 'pb' ? 'A playbook ran automatically on a new issue.' : e.k === 'info' ? 'Linked as context; informational signals don’t raise the score.' : 'Grouped because it shares the host SOC-Tech, the user a.levi or the email.'}</p>`], ['WHAT JOSH DID', `<p class="text-[13px] text-white/80">${DXD.qs.filter(q => q.r === x.round).map(q => 'Asked: ' + q.q).join('<br>') || 'Kept it as context.'}</p>`]]; }
  if (x.kind === 'v') parts = [['VERDICT', `<div class="text-[18px] font-black text-rose-400">Malicious</div><div class="text-[12.5px] text-white/55">High confidence · reached at 09:17</div>`], ['WHY', `<p class="text-[13px] text-white/80">The email led to an exploit page, Edge dropped and ran a known Cobalt Strike loader, and no simulation covers it.</p>`], ['WHAT WOULD CHANGE IT', `<p class="text-[13px] text-white/80">An approved phishing simulation that used this exact link and file.</p>`]];
  if (x.kind === 'a') parts = [['OFFER', `<div class="text-[14px] font-semibold text-white">${x.title}</div><div class="text-[12px] ${x.st === 'wait' ? 'text-amber-300' : 'text-white/50'}">${x.sub}</div>`], ['WHY', `<p class="text-[13px] text-white/80">${['Cuts the C2 channel and stops further credential attempts.', 'Stops every Bank US host from reaching the attacker.', 'Signs a.levi out everywhere in case the session was stolen.', 'Removes the email before anyone else clicks it.'][+x.key.slice(1)]}</p>`], ['RISK', `<p class="text-[13px] text-white/80">${['Medium · SOC-Tech is offline until released.', 'Low · no business traffic in 30 days.', 'Low · one extra MFA sign-in.', 'None · nobody opened it.'][+x.key.slice(1)]}</p>`]];
  return `<div class="absolute rounded-2xl border border-indigo-400/35 overflow-y-auto" style="top:12px;right:12px;bottom:58px;width:380px;z-index:5;background:linear-gradient(180deg, rgb(24 31 68 / .98), rgb(12 17 36 / .98));box-shadow:-20px 0 50px -30px rgb(0 0 0 / .8)">
    <div class="sticky top-0 px-4 py-3 flex items-center gap-2 border-b border-white/10" style="background:rgb(24 31 68 / .98)">${agentAv(PILLARS.analyst, 26, false)}<span class="text-[13px] text-white/80">${{ q: 'A question Josh asked', h: 'A hypothesis Josh framed', v: 'Josh’s verdict', a: 'An offer from Josh', case: 'A case change Josh saw' }[x.kind]}</span><button onclick="S.dxFbSel=null;renderDxSim()" class="ml-auto text-white/50 hover:text-white">✕</button></div>
    <div class="px-4 pb-3">${parts.map(([t, h]) => sec(t, h)).join('')}</div></div>`;
}
function dxFreeBoard() {
  const items = dxFbItems(), R = DXD.rounds, k = S.dxFbCyc ?? R.length - 1;
  const zones = [['THE CASE', 10, 'changes on its own'], ['QUESTIONS', 270, 'what Josh asked'], ['HYPOTHESES', 565, 'what could be true'], ['DECISION', 825, 'verdict and offers']];
  return dxCard(`<div class="flex items-center gap-3 mb-2 text-[12px] text-white/55"><span>Drag cards anywhere · click one for its full context</span><button onclick="S.dxPos={};renderDxSim()" class="ml-auto px-2.5 py-1 rounded-full border border-white/15 hover:text-white">Reset layout</button></div>
    <div id="dx-fb" class="relative rounded-2xl border border-white/10 overflow-auto" style="height:${DXFB.H + 70}px;background-color:#0a0f1f;background-image:radial-gradient(rgb(255 255 255 / .07) 1px, transparent 1px);background-size:22px 22px">
      <div class="relative" style="width:${DXFB.W}px;height:${DXFB.H}px">
        ${zones.map(([t, x, s1]) => `<div class="absolute top-2 text-[10.5px] font-black tracking-[.16em] text-white/35" style="left:${x + 10}px">${t} <span class="font-normal tracking-normal text-white/25">· ${s1}</span></div>`).join('')}
        <svg id="dx-fb-lines" class="absolute inset-0 pointer-events-none" width="${DXFB.W}" height="${DXFB.H}">${dxFbLinesSVG(items)}</svg>
        ${items.map(dxFbCard).join('')}
      </div>
      ${dxFbDetail(items)}
      <div class="sticky left-0 bottom-0 w-full px-4 py-2.5 flex items-center gap-3 border-t border-white/10" style="background:rgb(10 15 31 / .95)">
        <span class="text-[10.5px] font-black tracking-[.16em] text-white/40">CYCLES</span>
        <div class="relative flex-1 flex items-center justify-between max-w-[640px]"><span class="absolute left-0 right-0 top-1/2 h-px bg-white/15"></span>
          ${R.map((r, i) => `<button onclick="S.dxFbCyc=${i};S.dxFbCycOpen=S.dxFbCycOpen===${i}?-1:${i};renderDxSim()" class="relative z-[1] flex items-center gap-1.5 px-1.5 py-0.5 rounded-full ${i === k ? 'bg-teal-300/15' : ''}" ${tipAttr(`<div class="text-[12.5px] text-ink">${r.n}</div>`)}><span class="rounded-full ${i === k ? 'w-3 h-3 bg-teal-300' : i < k ? 'w-2.5 h-2.5 bg-teal-300/50' : 'w-2.5 h-2.5 border border-white/40 bg-[#0a0f1f]'}"></span><span class="text-[10.5px] font-mono ${i === k ? 'text-white' : 'text-white/45'}">${r.t}</span></button>`).join('')}</div>
        ${k < R.length - 1 ? `<button onclick="S.dxFbCyc=${R.length - 1};S.dxFbCycOpen=-1;renderDxSim()" class="text-[11.5px] c-ai font-semibold">Back to latest</button>` : ''}
      </div>
      ${(S.dxFbCycOpen ?? -1) >= 0 ? (() => { const r = R[S.dxFbCycOpen], j = S.dxFbCycOpen; return `<div class="absolute rounded-2xl border border-teal-300/40 p-4" style="left:16px;bottom:58px;width:430px;z-index:6;background:linear-gradient(180deg, rgb(18 40 48 / .98), rgb(10 18 30 / .98))">
        <div class="flex items-center gap-2">${agentAv(PILLARS.analyst, 22, false)}<span class="font-mono text-[12px] text-white/55">${r.t}</span><span class="text-[13.5px] font-bold text-white">${r.n}</span><button onclick="S.dxFbCycOpen=-1;renderDxSim()" class="ml-auto text-white/50">✕</button></div>
        <div class="mt-2 grid gap-3" style="grid-template-columns:1fr 1fr"><div><div class="text-[10.5px] font-black tracking-[.14em] text-white/45">CASE CHANGED</div>${DXD.events.filter(e => dxRoundOf(e) === j).map(e => `<div class="mt-1 text-[12px] text-white/80">${e.n}</div>`).join('')}</div>
          <div><div class="text-[10.5px] font-black tracking-[.14em] text-white/45">JOSH RE-EVALUATED</div>${DXD.hyp.map((h, i) => `<div class="mt-1 flex items-center gap-1.5 text-[11.5px]"><span class="w-5 font-bold" style="color:${h.col}">${h.id}</span><span class="flex-1">${dxBar(r.h[i], h.col, 4)}</span><span class="w-12 text-right text-white/60">${r.h[i]}%${j ? ` <span class="${dxDelta(j, i) > 0 ? 'text-emerald-300' : dxDelta(j, i) < 0 ? 'text-rose-300' : 'text-white/30'}">${dxDelta(j, i) > 0 ? '+' : ''}${dxDelta(j, i)}</span>` : ''}</span></div>`).join('')}</div></div></div>`; })() : ''}
    </div>`);
}
let _dxDrag = null;
function dxFbDown(e, key) {
  const el = e.currentTarget, items = dxFbItems(), it = items.find(x => x.key === key);
  _dxDrag = { key, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, el, moved: false, items };
  el.setPointerCapture && el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
}
document.addEventListener('pointermove', e => {
  const d = _dxDrag; if (!d) return;
  const dx = e.clientX - d.sx, dy = e.clientY - d.sy; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true; if (!d.moved) return;
  const nx = Math.max(0, Math.min(DXFB.W - 60, d.ox + dx)), ny = Math.max(24, Math.min(DXFB.H - 40, d.oy + dy));
  d.el.style.left = nx + 'px'; d.el.style.top = ny + 'px'; S.dxPos = S.dxPos || {}; S.dxPos[d.key] = [nx, ny];
  const it = d.items.find(x => x.key === d.key); it.x = nx; it.y = ny;
  const svg = document.getElementById('dx-fb-lines'); if (svg) svg.innerHTML = dxFbLinesSVG(d.items);
});
document.addEventListener('pointerup', () => {
  const d = _dxDrag; if (!d) return; _dxDrag = null; d.el.style.cursor = 'grab';
  if (!d.moved) { S.dxFbSel = S.dxFbSel === d.key ? null : d.key; renderDxSim(); }
});
dxP = (orig => function (id) { return id === 'C' ? dxFreeBoard() : orig(id); })(dxP);
(() => { const P = DX[1]; P.opts[2] = { id: 'C', name: 'Free investigation board', tag: 'Like a whiteboard', idea: 'One open board with four zones that read left to right: the case → questions → hypotheses → decision, with lines showing what led to what. Drag cards anywhere; click one for its structured context (what, why, how, found, effect, evidence). A small cycle timeline at the bottom replays how the board looked.', pros: ['Calm and spatial: you see the whole investigation at once', 'Cause → question → hypothesis → decision is explicit', 'Every card is clearly Josh’s work'], cons: ['Free layouts can get messy on huge cases (Reset layout helps)'] }; })();

/* ---------- Josh in the mock ---------- */
const _renderDxSim0 = renderDxSim;
renderDxSim = function () {
  _renderDxSim0();
  const el = $('dx-sim'); if (!el) return;
  const box = el.firstElementChild; if (!box) return;
  const head = box.firstElementChild;
  head.insertAdjacentHTML('afterend', `<div class="px-6 py-3 border-b border-white/10 flex items-center gap-3" style="background:rgb(99 102 241 / .06)">${agentAv(PILLARS.analyst, 34)}<div><div class="text-[14px] font-bold text-white">Josh <span class="font-normal text-white/50">· Security Analyst</span></div><div class="text-[12.5px] text-white/60">${DX_ACT[0][1] === 'done' ? 'SOC-Tech is isolated. I’m keeping an eye on the other inboxes and the C2 address.' : 'I reached a verdict at 09:17 and kept investigating as the case grew. One decision needs you.'}</div></div>${DX_ACT[0][1] === 'done' ? '<span class="ml-auto px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[12.5px] font-semibold">Contained</span>' : '<span class="ml-auto px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 text-[12.5px] font-semibold">1 decision waiting</span>'}</div>`);
  box.insertAdjacentHTML('beforeend', `<div class="px-6 py-4 border-t border-white/10" style="background:rgb(13 18 40 / .9)"><div class="flex gap-2 flex-wrap mb-2.5">${['Isolate SOC-Tech now?', 'Purge the email from 2 inboxes?', 'Why did you rule out H2?', 'Show me what changed at 09:40'].map(t => `<span class="px-3 py-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/[.08] text-[12.5px] text-white/85">${t}</span>`).join('')}</div>
    <div class="flex items-center gap-2 rounded-2xl p-1.5 pl-2.5 border border-indigo-400/35 bg-white/[.03]">${agentAv(PILLARS.analyst, 26, false)}<span class="flex-1 text-[13.5px] text-white/45 py-1.5">Ask Josh about this case…</span><span class="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center text-white">↑</span></div></div>`);
};