/* ======================================================================
   DESIGN DECISIONS v5: hypothesis names, case-style flow, Josh comments, decisions
   ====================================================================== */
const DX_HN = { H1: 'Attack', H2: 'Simulation', H3: 'Legit tool' };
dxEff = (w, h) => { const n = DX_HN[h] || h; return w > 0 ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300" ${tipAttr(`<div class="text-[12.5px] text-ink">Supports: ${(DXD.hyp.find(x => x.id === h) || {}).q || n}</div>`)}>▲ ${n}</span>` : w < 0 ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-300" ${tipAttr(`<div class="text-[12.5px] text-ink">Argues against: ${(DXD.hyp.find(x => x.id === h) || {}).q || n}</div>`)}>▼ ${n}</span>` : ''; };
// matrix header uses names, not H1/H2/H3
dxR = (orig => function (id) {
  let h = orig(id);
  if (id === 'A') { DXD.hyp.forEach(x => { h = h.replace(new RegExp(`(<span class="text-center font-bold cursor-help" style="color:${x.col}"[^>]*>)${x.id}(</span>)`), `$1${DX_HN[x.id]}$2`); }); h = h.replace(/repeat\(3, 56px\)/g, 'repeat(3, 108px)'); }
  return h;
})(dxR);

/* ---------- 2B · the case layout of today, as one logical flow with branches and a cycle dropdown ---------- */
var dxCaseFlow = function () {
  const R = DXD.rounds, Q = DXD.qs, H = DXD.hyp, EV = DXD.events; S.dxBcp = S.dxBcp ?? R.length - 1; const k = S.dxBcp, r = R[k];
  S.dxCf = S.dxCf ?? null; let n = 0;
  const badge = st => st === 'done' ? ['bg-cx/15 c-cx', 'check'] : st === 'wait' ? ['bg-amber-500/15 c-amber', 'hand'] : st === 'running' ? ['bg-blue-500/15 c-blue', 'loader-circle'] : ['bg-sunk text-ink3', 'clock'];
  const card = (x, next) => { const [bc, bi] = badge(x.st), on = S.dxCf === x.key, num = String(++n).padStart(2, '0'), tg = `S.dxCf=S.dxCf==='${x.key}'?null:'${x.key}';renderDxSim()`;
    const brd = x.st === 'done' ? 'border-cx/30' : x.st === 'wait' ? 'border-amber-500/40' : x.st === 'running' ? 'border-blue-500/40' : 'border-line';
    const bg = x.st === 'queued' ? 'background:rgb(var(--sunk) / .5)' : 'background:linear-gradient(180deg, rgb(255 255 255 / .06), rgb(255 255 255 / .025))';
    if (!on) return `<button onclick="${tg}" class="flow-card ${next ? 'fc-next' : ''} rounded-2xl border transition ${brd} text-left p-3.5 flex flex-col justify-start hover:border-indigo-300/50 ${x.st === 'queued' ? 'opacity-70' : ''}" style="${bg}">
      <div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md ${bc}">${ic(bi, 'w-3.5 h-3.5')}</span><span class="text-[11px] font-mono text-ink3">${num}</span><span class="ml-auto text-ink3">${ic('maximize-2', 'w-3 h-3')}</span></div>
      <div class="fc-t mt-2 text-[13.5px] font-bold text-ink leading-snug">${x.t}</div><div class="fc-s mt-1 text-[12px] text-ink3 leading-snug">${x.s}</div>${x.chips ? `<div class="mt-1.5 flex gap-1 flex-wrap">${x.chips}</div>` : ''}${x.bar ? `<div class="mt-2" style="width:100%">${dxBar(x.bar[0], x.bar[1], 6)}</div>` : ''}</button>`;
    return `<div class="flow-card flow-open rounded-2xl border transition ${brd} p-5" style="${bg}"><div class="flex items-center gap-2"><span class="inline-flex px-1.5 py-0.5 rounded-md ${bc}">${ic(bi, 'w-3.5 h-3.5')}</span><span class="text-[11px] font-mono text-ink3">step ${num}</span><button onclick="${tg}" class="ml-auto text-ink3 hover:text-ink">${ic('minimize-2', 'w-4 h-4')}</button></div><div class="text-[16px] font-bold text-ink mt-2">${x.t}</div><div class="text-[13px] text-ink3">${x.s}</div>${x.d || ''}</div>`; };
  const asked = Q.map((q, i) => [q, i]).filter(([q]) => q.r <= k);
  const qCard = ([q, i]) => ({ key: 'q' + i, t: q.q, s: `Answer: ${q.a}`, st: 'done', chips: q.eff.map((w, h) => dxEff(w, H[h].id)).join(''), d: `${dxLbl('WHY JOSH ASKED')}<p class="text-[13px] text-white/80">${q.why.replace(/^A new issue arrived: |^A critical issue joined the case: /, '')}</p>${dxLbl('FOUND')}${q.ev.map(e => `<div class="mt-1 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}<div class="mt-3">${dxEventsTable(i)}</div>` });
  const branches = [
    [H[0], asked.filter(([q]) => q.eff[0] > 0 && q.eff[1] >= 0)],
    [H[1], asked.filter(([q]) => q.eff[1] < 0)],
    [{ id: 'open', col: '#94a3b8' }, asked.filter(([q]) => q.eff.every(w => !w))]
  ].filter(([, qs]) => qs.length);
  const row = (label, cards, sub) => `<div class="flex gap-4"><div class="shrink-0 pt-1" style="width:104px"><div class="text-[11px] font-black tracking-[.16em] ${cards.every(c => c.st === 'done') ? 'c-cx' : 'text-ink3'}">${label}</div>${sub ? `<div class="text-[11px] text-ink3 mt-0.5">${sub}</div>` : ''}</div><div class="flex-1 min-w-0 flow-row">${cards.map((c, i) => card(c, i < cards.length - 1)).join('')}</div></div>`;
  const issues = EV.filter(e => e.k === 'issue' && dxRoundOf(e) <= k);
  return dxCard(`<div class="flex items-center gap-3 mb-4"><span class="text-[11px] font-black tracking-[.16em] text-ink3">CYCLE</span>
      <select onchange="S.dxBcp=+this.value;S.dxCf=null;renderDxSim()" class="rounded-lg bg-sunk border border-line2 text-[13px] text-ink px-3 py-1.5">${R.map((x, i) => `<option value="${i}" ${i === k ? 'selected' : ''}>${x.t} · ${x.n}${i === R.length - 1 ? ' (latest)' : ''}</option>`).join('')}</select>
      ${k < R.length - 1 ? `<button onclick="S.dxBcp=${R.length - 1};renderDxSim()" class="text-[12px] c-ai font-semibold">Back to latest</button>` : ''}</div>
    <div class="space-y-4">
      ${row('THE CASE', [{ key: 'case', t: `${issues.length} issues grouped`, s: `Since 09:03 · ${EV.filter(e => e.k === 'pb' && dxRoundOf(e) <= k).length} playbooks ran`, st: 'done', d: `${dxLbl('ISSUES')}${issues.map(e => `<div class="mt-1 flex items-center gap-2 text-[13px] text-white/80"><span class="w-2 h-2 rounded-full" style="background:${dxSev(e.sev)}"></span><span class="font-mono text-white/45">${e.t}</span>${e.n}</div>`).join('')}<p class="mt-3 text-[12.5px] text-white/50">The case keeps changing on its own. Josh re-reads it each cycle and adjusts his questions; questions aren’t tied to single issues.</p>` }])}
      ${row('FRAME', H.map((h, i) => ({ key: 'h' + i, t: h.q, s: `${DX_HN[h.id]} · ${r.h[i]}%`, st: 'done', bar: [r.h[i], h.col], d: `${dxLbl('SHARE OVER TIME')}<div class="text-[13px] text-white/75">${R.slice(0, k + 1).map(x => `${x.t} ${x.h[i]}%`).join(' → ')}</div>` })), 'what could be true')}
      <div class="flex gap-4"><div class="shrink-0 pt-1" style="width:104px"><div class="text-[11px] font-black tracking-[.16em] c-cx">INVESTIGATE</div><div class="text-[11px] text-ink3 mt-0.5">branches by hypothesis</div></div>
        <div class="flex-1 min-w-0 space-y-3">${branches.map(([h, qs]) => `<div class="relative pl-4 border-l-2" style="border-color:${h.col}66"><div class="text-[11.5px] font-bold mb-2" style="color:${h.col}">${h.id === 'open' ? 'Still open' : `Testing: ${DX_HN[h.id]}`}</div><div class="flow-row">${qs.map((x, i) => card(qCard(x), i < qs.length - 1)).join('')}</div></div>`).join('')}</div></div>
      ${row('DECIDE', [k >= 2 ? { key: 'v', t: 'Verdict · Malicious', s: `${DX_HN.H1} ${r.h[0]}% vs ${Math.max(r.h[1], r.h[2])}%`, st: 'done', d: `${dxLbl('WHY')}<p class="text-[13px] text-white/80">Exploit page, known malware loader, and no simulation that explains it.</p>` } : { key: 'v', t: 'Verdict', s: `Not yet · ${DX_HN.H1} at ${r.h[0]}%`, st: 'running' }])}
      ${row('RESPOND', k >= 2 ? DX_ACT.slice(0, k >= 4 ? 4 : 3).map(([t, st, sub], i) => ({ key: 'a' + i, t, s: sub, st: st === 'wait' ? 'wait' : st === 'done' ? 'done' : 'queued' })) : [{ key: 'a', t: 'No offers yet', s: 'After the verdict', st: 'queued' }])}
    </div>`);
}

/* ---------- 2A · structured board + Josh’s presence and comments ---------- */
function dxCommentReply(key, text) {
  const l = text.toLowerCase();
  if (/why/.test(l)) return 'I asked it because the answer separates the hypotheses most. If it had been “no”, the legit-tool explanation would still be alive.';
  if (/sure|confiden/.test(l)) return 'Fairly sure. Two independent sources agree (endpoint telemetry and WildFire). I’d re-check only if the file turns out to be signed.';
  if (/check|look|also/.test(l)) return 'Good idea. I’ve added it to my next cycle and I’ll update this card when I have the answer.';
  return 'Noted. I’ll take that into account in the next cycle.';
}
var dxComment = function (key) {
  const inp = document.getElementById('dxc-in-' + key), t = (inp && inp.value || '').trim(); if (!t) return;
  S.dxCmts = S.dxCmts || {}; (S.dxCmts[key] = S.dxCmts[key] || []).push({ who: 'you', t }); renderDxSim();
  setTimeout(() => { S.dxCmts[key].push({ who: 'josh', t: dxCommentReply(key, t) }); renderDxSim(); }, 700);
}
var dxCollab = function () {
  const H = DXD.hyp, Q = DXD.qs, R = DXD.rounds, k = R.length - 1;
  S.dxCmts = S.dxCmts || { q5: [{ who: 'josh', t: 'Watching the two other inboxes. Neither has clicked yet.' }] };
  const focus = 'q5';
  const cards = [
    ['case', 'The case', `${DXD.events.filter(e => e.k === 'issue').length} issues grouped`, 'Since 09:03'],
    ...H.map((h, i) => ['h' + i, DX_HN[h.id], h.q, `${h.pct}%`]),
    ...Q.map((q, i) => ['q' + i, 'Question', q.q, `Answer: ${q.a}`]),
    ['v', 'Verdict', 'Malicious', 'High confidence']
  ];
  const groups = [['THE CASE', ['case']], ['HYPOTHESES', ['h0', 'h1', 'h2']], ['QUESTIONS', Q.map((_, i) => 'q' + i)], ['DECISION', ['v']]];
  const byKey = Object.fromEntries(cards.map(c => [c[0], c]));
  const box = key => { const [, kind, t, s1] = byKey[key], cm = (S.dxCmts[key] || []), open = S.dxCm === key, here = key === focus;
    return `<div class="relative rounded-2xl border ${here ? 'border-teal-300/60' : 'border-white/10'} p-3.5" style="background:linear-gradient(180deg, rgb(30 38 80 / .55), rgb(16 22 46 / .7))">
      ${here ? `<span class="absolute flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5 text-[10.5px] font-bold" style="top:-11px;left:12px;background:#5eead4;color:#04261a">${agentAv(PILLARS.analyst, 16, false)}Josh is here</span>` : ''}
      <div class="text-[10.5px] font-black tracking-[.14em] text-white/45">${kind.toUpperCase()}</div><div class="mt-1 text-[13.5px] font-semibold text-white leading-snug">${t}</div><div class="mt-1 text-[12px] text-white/55">${s1}</div>
      <button onclick="S.dxCm=S.dxCm==='${key}'?null:'${key}';renderDxSim()" class="mt-2 inline-flex items-center gap-1.5 text-[12px] ${cm.length ? 'text-indigo-200' : 'text-white/45'} hover:text-white">💬 ${cm.length ? `${cm.length} comment${cm.length > 1 ? 's' : ''}` : 'Comment'}</button>
      ${open ? `<div class="mt-2 rounded-xl border border-indigo-400/30 bg-black/20 p-2.5 space-y-2">${cm.map(c => `<div class="flex gap-2 text-[12.5px]">${c.who === 'josh' ? agentAv(PILLARS.analyst, 18, false) : '<span class="w-[18px] h-[18px] rounded-full bg-indigo-400/40 text-[9px] font-bold text-white flex items-center justify-center shrink-0">GR</span>'}<span class="${c.who === 'josh' ? 'text-white/85' : 'text-white'}">${esc(c.t)}</span></div>`).join('')}
        <div class="flex gap-1.5"><input id="dxc-in-${key}" onkeydown="if(event.key==='Enter')dxComment('${key}')" placeholder="Comment or @Josh…" class="flex-1 rounded-lg bg-white/[.05] border border-white/10 px-2 py-1 text-[12.5px] text-white outline-none"/><button onclick="dxComment('${key}')" class="px-2.5 rounded-lg bg-indigo-500/40 text-[12px] text-white">Send</button></div></div>` : ''}</div>`; };
  return dxCard(`<div class="flex items-center gap-3 mb-3 rounded-xl px-3 py-2 border border-teal-300/25 bg-teal-300/[.05]">${agentAv(PILLARS.analyst, 24, true)}<span class="text-[13px] text-white/85"><b>Josh</b> is on this board · last change 10:05 · <span class="text-white/55">comment on any card and he’ll answer there</span></span><span class="ml-auto flex -space-x-1.5">${agentAv(PILLARS.analyst, 22, false)}<span class="w-[22px] h-[22px] rounded-full bg-indigo-400/50 border border-[#0a0f1f] text-[9px] font-bold text-white flex items-center justify-center">GR</span></span></div>
    <div class="grid gap-4" style="grid-template-columns:200px minmax(0,1fr) minmax(0,1.5fr) 200px">${groups.map(([t, keys]) => `<div><div class="text-[10.5px] font-black tracking-[.16em] text-white/40 mb-2">${t}</div><div ${t === 'QUESTIONS' ? 'style="display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start"' : 'style="display:grid;gap:12px"'}>${keys.map(box).join('')}</div></div>`).join('')}</div>`);
}
dxP = (orig => function (id) { return id === 'A' ? dxCollab() : id === 'B' ? dxCaseFlow() : orig(id); })(dxP);

/* ---------- 5 · decisions (new component) ---------- */
function dxApprove(i) { DX_ACT[i][1] = 'done'; DX_ACT[i][2] = 'Approved by you · done'; S.dxChat = S.dxChat || DX_CHAT0(); S.dxChat.push({ who: 'josh', t: ['Done. SOC-Tech is isolated and the C2 channel is cut.', 'Blocked 8.130.54.67 everywhere.', 'Reset a.levi’s password and signed out all sessions.', 'Purged the email from 2 inboxes.'][i] }); renderDxSim(); }
function dxDecline(i) { DX_ACT[i][1] = 'queued'; DX_ACT[i][2] = 'Declined'; S.dxChat = S.dxChat || DX_CHAT0(); S.dxChat.push({ who: 'josh', t: 'Understood, I won’t do that. Want me to suggest an alternative?' }); renderDxSim(); }
var dxDec = function (id) {
  const A = DX_ACT, risk = ['Medium', 'Low', 'Low', 'None'], why = ['Cuts the C2 channel and stops further credential attempts on SOC-Tech.', 'Stops every Bank US host from reaching the attacker server.', 'Removes any stolen session for a.levi.', 'Removes the email before anyone else clicks it.'];
  const btns = i => A[i][1] === 'done' ? '<span class="text-[12.5px] text-emerald-300 font-semibold">✓ Done</span>' : `<div class="flex gap-2"><button onclick="dxApprove(${i})" class="px-4 py-1.5 rounded-full bg-indigo-500/35 border border-indigo-300/50 text-[13px] font-semibold text-white hover:bg-indigo-500/50">Approve</button><button onclick="dxDecline(${i})" class="px-4 py-1.5 rounded-full border border-white/15 text-[13px] text-white/75 hover:text-white">Decline</button></div>`;
  if (id === 'A') return dxCard(`<div class="rounded-2xl border border-amber-500/40 p-5" style="background:linear-gradient(180deg, rgb(245 158 11 / .07), transparent)"><div class="flex items-start gap-3">${agentAv(PILLARS.analyst, 30, false)}<div class="flex-1"><div class="text-[11px] font-bold tracking-[.14em] text-amber-300">JOSH NEEDS YOUR DECISION</div><div class="text-[18px] font-bold text-white mt-1">${A[0][0]}</div><p class="mt-1.5 text-[13.5px] text-white/75">${why[0]}</p>
      <div class="mt-3 grid grid-cols-3 gap-2">${[['Risk', 'Medium · one click to release'], ['If you wait', 'C2 stays open; ~1 beacon / 45s'], ['Precedent', '23 of 24 similar cases']].map(([a, b]) => `<div class="rounded-xl px-3 py-2 bg-white/[.04] border border-white/10"><div class="text-[10.5px] font-bold tracking-[.12em] text-white/45">${a.toUpperCase()}</div><div class="text-[12.5px] text-white mt-0.5">${b}</div></div>`).join('')}</div></div><div class="shrink-0">${btns(0)}</div></div></div>`);
  if (id === 'B') { S.dxDecAfter = !!S.dxDecAfter;
    return dxCard(`<div class="grid gap-5" style="grid-template-columns:1fr 1.2fr"><div><div class="flex items-center gap-2">${agentAv(PILLARS.analyst, 26, false)}<span class="text-[11px] font-bold tracking-[.14em] text-amber-300">DECISION</span></div><div class="text-[18px] font-bold text-white mt-2">${A[0][0]}</div><p class="mt-1.5 text-[13.5px] text-white/75">${why[0]}</p>
        <div class="mt-3 space-y-1.5 text-[13px]">${[['Rollback', 'Release SOC-Tech with one click'], ['Business impact', 'a.levi can’t use SOC-Tech for ~2h'], ['If declined', 'Josh will block the IP instead']].map(([a, b]) => `<div class="flex gap-2"><span class="w-[110px] text-white/45">${a}</span><span class="text-white/85">${b}</span></div>`).join('')}</div><div class="mt-4">${btns(0)}</div></div>
      <div class="rounded-2xl border border-white/10 p-4 bg-black/20"><div class="flex items-center gap-2"><span class="text-[11px] font-bold tracking-[.14em] text-white/45">WHAT IT CHANGES</span><div class="ml-auto inline-flex rounded-full border border-white/15 p-0.5">${[['now', 'Now', false], ['after', 'After approval', true]].map(([k, l, v]) => `<button onclick="S.dxDecAfter=${v};renderDxSim()" class="px-3 py-1 rounded-full text-[12px] ${S.dxDecAfter === v ? 'bg-white text-slate-950 font-bold' : 'text-white/65'}">${l}</button>`).join('')}</div></div>
        <div class="mt-3 space-y-2">${[['SOC-Tech → 8.130.54.67', 'C2 channel'], ['SOC-Tech → FS-FIN-01', 'via svc_backup'], ['SOC-Tech → PAY-DB-01', 'crown jewel · 3 hops']].map(([p, d]) => `<div class="flex items-center gap-3 rounded-xl px-3 py-2 border ${S.dxDecAfter ? 'border-emerald-400/30 bg-emerald-500/[.05]' : 'border-rose-400/30 bg-rose-500/[.05]'}"><span class="font-mono text-[12.5px] ${S.dxDecAfter ? 'text-white/45 line-through' : 'text-white'}">${p}</span><span class="text-[12px] text-white/50">${d}</span><span class="ml-auto text-[12px] font-bold ${S.dxDecAfter ? 'text-emerald-300' : 'text-rose-300'}">${S.dxDecAfter ? 'Cut' : 'Open'}</span></div>`).join('')}</div>
        <div class="mt-3 text-[12.5px] ${S.dxDecAfter ? 'text-emerald-300' : 'text-rose-300'}">${S.dxDecAfter ? '0 open paths · nothing reachable from SOC-Tech' : '3 open paths · 1 crown jewel reachable'}</div></div></div>`); }
  return dxCard(`<div class="flex items-center gap-2 mb-3">${agentAv(PILLARS.analyst, 24, false)}<span class="text-[13px] text-white/80">Josh’s offers for this case, ranked by impact. Low-risk ones can go together.</span><button onclick="[1,2,3].forEach(i=>{if(DX_ACT[i][1]!=='done'){DX_ACT[i][1]='done';DX_ACT[i][2]='Approved by you · done';}});S.dxChat=S.dxChat||DX_CHAT0();S.dxChat.push({who:'josh',t:'Done: blocked the IP, reset a.levi and purged the email.'});renderDxSim()" class="ml-auto px-3.5 py-1.5 rounded-full bg-teal-300 text-slate-950 text-[12.5px] font-bold">Approve all low-risk (3)</button></div>
    <div class="rounded-2xl border border-white/10 overflow-hidden">${A.map(([t, st, sub], i) => `<div class="flex items-center gap-4 px-4 py-3 ${i ? 'border-t border-white/[.06]' : ''} ${i === 0 && st !== 'done' ? 'bg-amber-500/[.06]' : ''}"><span class="w-6 text-[12px] font-mono text-white/40">${i + 1}</span><div class="flex-1"><div class="text-[14px] font-semibold text-white">${t}</div><div class="text-[12px] text-white/55">${why[i]}</div></div><span class="px-2 py-0.5 rounded-md text-[11.5px] font-semibold ${risk[i] === 'Medium' ? 'bg-amber-500/15 text-amber-300' : risk[i] === 'Low' ? 'bg-white/10 text-white/70' : 'bg-emerald-500/15 text-emerald-300'}">${risk[i] === 'None' ? 'No' : risk[i]} risk</span>${btns(i)}</div>`).join('')}</div>`);
}
DX.push({ key: 'decide', name: 'Decisions', q: 'How should Josh bring you a decision, and what should you see before you approve?', rec: 'B', render: id => dxDec(id), opts: [
  { id: 'A', name: 'Approval card', tag: 'What we have', idea: 'One card for the decision that needs you: the action, why, the risk, what happens if you wait, and precedent. Approve or decline right there.', pros: ['Fast and familiar', 'All the essentials in one place'], cons: ['Impact is described, not shown', 'One decision at a time'] },
  { id: 'B', name: 'Decision with impact preview', tag: 'Shows the effect', idea: 'The decision on the left (why, rollback, business impact, what happens if declined) and on the right a Now / After approval toggle that shows which attack paths get cut.', pros: ['You see exactly what approving changes', 'Rollback and fallback are explicit'], cons: ['Takes more space'] },
  { id: 'C', name: 'Ranked offers', tag: 'Batch the easy ones', idea: 'All of Josh’s offers for the case in one list, ranked, with a risk tag. Approve the critical one on its own and the low-risk ones in one click.', pros: ['Clears many decisions quickly', 'Risk is visible per offer'], cons: ['Less detail per decision'] }
] });

/* ---------- option texts for step 2 ---------- */
(() => { const P = DX[1];
  P.opts[0] = { id: 'A', name: 'Shared board with Josh', tag: 'Collaboration, kept simple', idea: 'A structured board (case · hypotheses · questions · decision) with Josh’s presence on it. Comment on any card or @Josh; he answers in the thread on that card.', pros: ['Keeps the “working with a teammate” feel', 'Structured, not a messy canvas', 'Conversation lives next to the evidence'], cons: ['Comments add another place to look'] };
  P.opts[1] = { id: 'B', name: 'Case canvas, one logical flow', tag: 'Today’s design', idea: 'The exact canvas from the case, as one flow: the case → hypotheses → questions branching under the hypothesis they test → verdict → offers. A Cycle drop-down switches the whole board to an earlier cycle. Questions aren’t tied to single issues.', pros: ['Starts from what the case has today', 'Branches show why each question exists', 'Less data on screen: the case is one card'], cons: ['Branching needs care when a question tests several hypotheses'] };
  P.rec = 'B';
})();
