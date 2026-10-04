/* ======================================================================
   APPROVAL CARD (reference UX): statement, consequence, evidence, flow
   ====================================================================== */
function apvData(tk) {
  const c = tk.caseId && byId(tk.caseId), it = tk.itemId && itemById(tk.itemId);
  if (c) {
    const inv = investigation(c), H = HERO[c.id];
    const statement = `I confirmed that ${c.host} is compromised. ${H ? H.why : inv.expl} I recommend we ${tk.title.charAt(0).toLowerCase() + tk.title.slice(1)}.`;
    const conseq = `This will run ${tk.playbook} on ${c.host}. ${tk.risk.split(',')[0]} impact.`;
    const signals = inv.Q.filter(q => !q.open && q.tone !== 'counter').map(q => ({ t: q.q.replace(/\?$/, ''), d: q.text.length > 110 ? q.text.slice(0, 108) + '…' : q.text }));
    const cut = (x, n) => x.length <= n ? x : x.slice(0, x.lastIndexOf(' ', n)) + '…', cap = x => x.charAt(0).toUpperCase() + x.slice(1);
    const done = getWorklog(c).filter(e => e.by === 'agent' && e.type !== 'task').slice(-4).map(e => ({ t: cap(e.title.replace(/^Query: /, '').replace(/^Evidence: /, '')), d: cut(e.result || e.detail || '', 64) }));
    const queued = [['Containment', `${tk.playbook} on ${c.host}`], ['Block C2', 'Firewall + EDR block for related indicators'], ['Forensic handoff', 'Timeline and evidence routed'], ['Case closure', 'Status and report updated']];
    return { P: PILLARS.analyst, statement, conseq, signals, done, queued, approve: tk.type === 'Investigation Steering' ? 'Approve & close' : 'Approve containment' };
  }
  const P = PILLARS[it.pillar];
  return { P, statement: `${it.result} I recommend we ${it.ask.charAt(0).toLowerCase() + it.ask.slice(1)}.`, conseq: `If you approve: ${it.done}. Risk: ${it.risk}.`,
    signals: it.steps.map((x, i) => ({ t: `Step ${i + 1}`, d: x })).concat(it.viz && it.viz.items ? [{ t: it.viz.head, d: it.viz.items.join(' · ') }] : []),
    done: it.steps.map((x, i) => ({ t: `Step ${i + 1}`, d: x.length > 64 ? x.slice(0, x.lastIndexOf(' ', 64)) + '…' : x })), queued: [['Apply', it.done || it.ask], ['Verify', 'Check the change worked'], ['Close', 'Item resolved and logged']], approve: 'Approve' };
}

function deckCardHTML(tk) {
  const A = apvData(tk), c = tk.caseId && byId(tk.caseId), it = tk.itemId && itemById(tk.itemId), P = A.P;
  const iv = c ? investigation(c) : null, B = c ? blastModel(c) : null;
  return `<div class="rounded-[18px] p-5 grid lg:grid-cols-[1.15fr,1fr] gap-5" style="background:linear-gradient(180deg, rgb(30 38 84 / .65), rgb(14 20 40 / .8));border:1px solid rgb(129 140 248 / .35);box-shadow:0 20px 50px -30px rgb(99 102 241 / .7)">
    <div class="min-w-0 flex flex-col">
      <div class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-white" style="box-shadow:0 0 10px #fff"></span><span class="text-[12px] font-black tracking-[.14em] text-ink">APPROVAL REQUIRED</span>
        <span class="ml-auto inline-flex items-center gap-2 text-[12px] text-ink3">${agentAv(P, 20, false)}${P.name} · ${fmtMs(Date.now() - tk.created)}</span></div>
      <div class="text-[19px] font-bold text-ink mt-2.5 leading-snug">${esc(tk.title)}</div>
      ${c ? `<div class="mt-2 inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full border border-indigo-400/25 text-[12px]" ${tipAttr(verdictTip(c))}><span class="text-ink3">Verdict</span><b style="color:${iv.color}">${iv.label}</b><span class="text-ink3">· ${confLevel(c.conf) || 'building'}</span></div>` : ''}
      <p class="mt-2.5 text-[14px] text-ink2 leading-relaxed">${c ? richText(c, A.statement) : esc(A.statement)}</p>
      <div class="mt-3 space-y-1">${A.signals.slice(0, 5).map(x => `<div class="flex items-center gap-2 text-[12.5px] text-ink2"><span class="w-4 h-4 rounded-full border border-cx/50 bg-cx/10 c-cx flex items-center justify-center shrink-0">${ic('check', 'w-2.5 h-2.5')}</span><span class="truncate"><b class="text-ink font-semibold">${esc(x.t)}</b></span></div>`).join('')}</div>
      <div class="mt-auto pt-4 flex gap-2 flex-wrap items-center">
        <button onclick="homeDeck('approve')" class="hm-pill pri">${esc(A.approve)}</button><button onclick="homeDeck('decline')" class="hm-pill">Decline</button>
        <span class="text-[12px] text-ink3 ml-1">${esc(tk.risk.split(',')[0])} risk</span></div>
    </div>
    <div class="min-w-0 flex flex-col gap-3">
      ${c ? `<div class="deck-vis rounded-xl overflow-hidden">${impactHTML(c, tk)}</div>
        <div class="grid grid-cols-3 gap-2">${[[B.ring1.length, 'assets reachable'], [B.ring2.length, 'crown jewels at risk'], [fmtDur(c.dur || 0), 'to investigate']].map(([v, l]) => `<div class="rounded-xl px-3 py-2 bg-white/[.03] border border-indigo-400/15"><div class="text-[16px] font-black text-ink">${v}</div><div class="text-[11px] text-ink3">${l}</div></div>`).join('')}</div>`
        : it && it.viz ? itemVizHTML(it) : ''}
      <p class="text-[12.5px] text-ink3">${esc(A.conseq)}</p>
    </div>
  </div>`;
}
function approvalCardHTML(tk, key, opts = {}) {
  if (opts.deck) return deckCardHTML(tk);
  const A = apvData(tk); S.home.ev = S.home.ev || {}; S.home.fl = S.home.fl || {};
  const evOpen = S.home.ev[key] || opts.deck, flOpen = S.home.fl[key];
  const pill = (label, on, cls = '') => `<button onclick="${on}" class="px-4 py-2 rounded-full border text-[14px] font-semibold transition ${cls || 'border-indigo-400/35 bg-white/[.04] text-ink2 hover:text-ink hover:border-indigo-300/60'}">${label}</button>`;
  const approveBtn = opts.deck ? `homeDeck('approve')` : opts.cu ? `homeCu('approve')` : `homeDecide('${tk.id}','approve')`;
  const declineBtn = opts.deck ? `homeDeck('decline')` : opts.cu ? `homeCu('decline')` : `homeDecide('${tk.id}','decline')`;
  const kind = tk.caseId ? 'case' : 'item', id = tk.caseId || tk.itemId;
  return `<div class="rounded-2xl p-5" style="background:linear-gradient(180deg, rgb(30 38 84 / .55), rgb(14 20 40 / .65));border:1px solid rgb(129 140 248 / .35);box-shadow:0 20px 50px -30px rgb(99 102 241 / .7)">
    <div class="flex items-center gap-2.5"><span class="w-2 h-2 rounded-full bg-white" style="box-shadow:0 0 10px #fff"></span><span class="text-[12px] font-black tracking-[.14em] text-ink">APPROVAL REQUIRED</span>
      <span class="ml-auto inline-flex items-center gap-2 text-[12px] text-ink3">${agentAv(A.P, 22, false)}${A.P.name} · waiting ${fmtMs(Date.now() - tk.created)}</span></div>
    ${tk.caseId ? (() => { const cc = byId(tk.caseId), iv = investigation(cc); return `<div class="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-indigo-400/25 text-[12.5px]" ${tipAttr(verdictTip(cc))}><span class="text-ink3">Verdict</span><b style="color:${iv.color}">${iv.label}</b><span class="text-ink3">· ${confLevel(cc.conf) || 'building'} confidence</span></div>`; })() : ''}
    <p class="mt-3 text-[15.5px] text-ink leading-relaxed">${tk.caseId ? richText(byId(tk.caseId), A.statement) : esc(A.statement)}</p>
    <p class="mt-2 text-[14px] text-ink3">${esc(A.conseq)}</p>
    ${evOpen && !opts.deck ? '' : `<div class="mt-4 flex gap-2 flex-wrap">${pill(A.approve, approveBtn, 'border-indigo-300/60 bg-indigo-500/15 text-ink hover:bg-indigo-500/25')}${pill('Decline', declineBtn)}${opts.deck ? '' : pill('Tell me more', `S.home.ev['${key}']=true;S._homeHtml=null;renderHome(false)`)}</div>`}
    ${opts.deck && tk.caseId ? `<div class="mt-5 deck-vis">${impactHTML(byId(tk.caseId), tk)}</div>` : ''}
    ${opts.deck && tk.caseId ? (() => { const B = blastModel(byId(tk.caseId)); return `<div class="mt-3 grid grid-cols-3 gap-2">${[[B.ring1.length, 'assets reachable'], [B.ring2.length, 'crown jewels at risk'], [byId(tk.caseId).dur ? fmtDur(byId(tk.caseId).dur) : '—', 'to investigate']].map(([v, l]) => `<div class="rounded-xl px-3 py-2 bg-white/[.03] border border-indigo-400/15"><div class="text-[17px] font-black text-ink">${v}</div><div class="text-[11.5px] text-ink3">${l}</div></div>`).join('')}</div>`; })() : opts.deck && tk.itemId && itemById(tk.itemId).viz ? `<div class="mt-3">${itemVizHTML(itemById(tk.itemId))}</div>` : ''}
    ${evOpen ? `<div class="${opts.deck ? '' : 'xp-in '}mt-4 -mx-5 -mb-5 border-t border-indigo-400/20">
      <div class="px-5 pt-4"><span class="text-[12px] font-black tracking-[.14em] c-cx">EVIDENCE SUMMARY</span> <span class="text-[12px] text-ink3 ml-1">${A.signals.length} signals</span>
        <p class="text-[14px] text-ink2 mt-1">I confirmed the recommendation through ${A.signals.length} signals.</p></div>
      <div class="mt-3 divide-y divide-indigo-400/15 border-y border-indigo-400/15">${A.signals.map(x => `<div class="px-5 py-3 flex gap-3"><span class="mt-0.5 w-6 h-6 rounded-full border border-cx/50 bg-cx/10 c-cx flex items-center justify-center shrink-0">${ic('check', 'w-3.5 h-3.5')}</span><div class="min-w-0"><div class="text-[14px] font-bold text-ink">${esc(x.t)}</div><div class="text-[12.5px] text-ink3 mt-0.5">${esc(x.d)}</div></div></div>`).join('')}</div>
      ${flOpen ? flowHTML(A, tk, approveBtn) : ''}
      <div class="px-5 py-4 flex items-center gap-2 flex-wrap">${pill(A.approve, approveBtn, 'border-indigo-300/60 bg-indigo-500/15 text-ink hover:bg-indigo-500/25')}${pill('Decline', declineBtn)}
        <button onclick="S.home.fl['${key}']=!S.home.fl['${key}'];S._homeHtml=null;renderHome(false)" class="ml-auto text-[14px] font-semibold c-cx hover:underline">${flOpen ? 'Hide evidence flow' : 'Open full evidence flow'}</button></div>
    </div>` : ''}
  </div>`;
}
function flowHTML(A, tk, approveBtn) {
  const node = (t, d, st) => `<div class="w-[168px] shrink-0 rounded-2xl border p-3 ${st === 'done' ? 'border-cx/35 bg-cx/[.06]' : 'border-line bg-white/[.02] opacity-60'}">
    <span class="inline-flex px-2 py-0.5 rounded-md ${st === 'done' ? 'bg-cx/15 c-cx' : 'bg-blue-500/10 c-blue'}">${ic(st === 'done' ? 'check' : 'clock', 'w-3.5 h-3.5')}</span>
    <div class="text-[13.5px] font-bold text-ink mt-2 leading-snug">${esc(t)}</div><div class="text-[12px] text-ink3 mt-0.5 leading-snug">${esc(d)}</div></div>`;
  const link = st => `<span class="w-6 h-[2px] self-center shrink-0 ${st === 'done' ? 'bg-cx/60' : 'bg-line2'}"></span>`;
  return `<div class="xp-in px-5 py-5 overflow-x-auto border-b border-indigo-400/15" style="background:radial-gradient(420px 220px at 50% 55%, rgb(139 92 246 / .22), transparent 70%)">
    <div class="flex items-stretch min-w-max">${A.done.map((x, i) => (i ? link('done') : '') + node(x.t, x.d, 'done')).join('')}</div>
    <div class="flex justify-center"><span class="w-[2px] h-6 bg-cx/60"></span></div>
    <div class="mx-auto max-w-[420px] rounded-2xl p-4 border" style="border-color:rgb(245 158 11 / .6);background:rgb(40 30 10 / .55);box-shadow:0 0 40px -10px rgb(245 158 11 / .45)">
      <div class="flex items-center gap-2 text-[11px] font-black tracking-[.12em]"><span class="text-ink3">APPROVAL GATE</span><span class="c-amber">ONLY HUMAN GATE BEFORE CONTAINMENT</span></div>
      <div class="text-[16px] font-bold text-ink mt-1.5">Final analyst approval</div>
      <div class="text-[13px] text-ink2 mt-1">${esc(tk.title)}</div>
      <button onclick="${approveBtn}" class="mt-3 w-full py-2.5 rounded-xl border border-indigo-300/60 bg-indigo-600/40 hover:bg-indigo-600/60 text-ink text-[14px] font-bold">${esc(A.approve)}</button></div>
    <div class="flex justify-center"><span class="w-[2px] h-6 bg-line2"></span></div>
    <div class="flex items-stretch min-w-max justify-center">${A.queued.map(([t, d], i) => (i ? link('q') : '') + node(t, d, 'q')).join('')}</div>
  </div>`;
}
function homeAlt(kind, id) {
  pauseStory();
  const key = kind + ':' + id; S.home.qa = S.home.qa || {}; const qa = S.home.qa[key] = S.home.qa[key] || [];
  S.home.open = S.home.open || {}; S.home.open[key] = true;
  qa.push({ role: 'user', text: 'Find another way' }, { role: 'typing' }); S._homeHtml = null; renderHome(false);
  setTimeout(() => {
    qa.splice(qa.findIndex(x => x.role === 'typing'), 1);
    const c = kind === 'case' && byId(id), it = kind === 'item' && itemById(id);
    const txt = c ? `Here are softer options for ${c.host}:\n1. **Block only the C2 traffic** at the firewall and keep the host online, with stricter alerting.\n2. **Isolate after the user’s session ends**, within 2 hours, with the account locked meanwhile.\n3. **Monitor for 24 hours** with full packet capture. I don’t recommend this one: the attacker keeps access.`
      : `A few alternatives:\n1. **Roll it out to a pilot group first** and widen after 24 hours.\n2. **Schedule it for tonight’s maintenance window** instead of now.\n3. **Keep it as a recommendation** and I’ll remind you tomorrow.`;
    qa.push({ role: 'agent', text: txt }); S._homeHtml = null; renderHome(false);
  }, 700);
}

/* the briefing sections, full screen, one at a time */
const NEXT_OF = { top: 'In the news for Bank US', news: 'How your environment looks', observe: 'Decisions that need you' };
function homeSection(m) {
  const sec = (label, title, inner) => `<section class="hm-sec">
    <div class="rv hm-label" data-d="0">${label}</div>
    <div class="rv hm-title mt-2 mb-5" data-d="120">${title}</div>
    ${inner}
    ${NEXT_OF[m.type] ? `<button onclick="homeNextFrom(this)" class="rv mt-5 self-center flex flex-col items-center gap-0.5 text-ink3 hover:text-ink" data-d="900"><span class="text-[12.5px]">${NEXT_OF[m.type]}</span>${ic('chevrons-down', 'w-4 h-4 animate-bounce')}</button>` : ''}
  </section>`;
  if (m.type === 'top') {
    const ev = topEvents(), more = S.home.moreTop ? moreEvents() : [], sevC = { Critical: 'bg-rose-500', High: 'bg-amber-500', Medium: 'bg-blue-500', Info: 'bg-cx', Low: 'bg-slate-400' };
    const row = (e, i, d) => `<button onclick="openCanvas('${e.kind}','${e.id}')" class="rv w-full text-left px-5 py-4 flex items-center gap-3.5 hover:bg-white/[.03]" data-d="${d}">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 ${sevC[e.sev]}" style="box-shadow:0 0 10px currentColor"></span>
        <span class="min-w-0 flex-1"><span class="block text-[15px] font-bold text-ink leading-snug">${esc(e.t)}</span><span class="block text-[13px] text-ink3 mt-0.5">${esc(e.sub)}</span></span>
        <span class="hidden sm:inline">${pillarBadge(e.p)}</span>${ic((S.home.open || {})[e.kind + ':' + e.id] ? 'chevron-up' : 'chevron-down', 'w-4 h-4 text-ink3 shrink-0')}</button>${inlineDetail(e.kind, e.id)}`;
    return sec('WHAT HAPPENED', 'The things worth knowing from last night',
      `<div class="hm-card overflow-hidden divide-y hm-row">${ev.map((e, i) => row(e, i, 250 + i * 160)).join('')}${more.map((e, i) => row(e, i, i * 90)).join('')}</div>
       <button onclick="S.home.moreTop=!S.home.moreTop;S._homeHtml=null;renderHome(false)" class="rv hm-pill mt-4 self-start inline-flex items-center gap-1.5" data-d="1100">${S.home.moreTop ? 'Show less' : `View ${moreEvents().length} more`} ${ic(S.home.moreTop ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</button>`);
  }
  if (m.type === 'news') {
    return sec('IN THE NEWS', 'What the world is talking about, and what it means for you',
      `<div class="grid gap-3">${NEWS.map((n, i) => { const it = itemByTitle(n.item); const op = it && (S.home.open || {})['item:' + it.id]; return `<div class="rv hm-card p-5" data-d="${250 + i * 220}">
        <div class="flex items-center gap-2 flex-wrap text-[12px]"><span class="text-ink3">${n.src}</span><span class="tn tn-${n.tn} px-2 py-0.5 rounded-full font-semibold">${n.tag}</span>
          <span class="ml-auto text-[12px] font-bold ${n.status === 'Needs you' ? 'c-amber' : n.status === 'In hand' ? 'c-blue' : 'text-ink3'}">${n.status}</span></div>
        <div class="text-[17px] font-bold text-ink leading-snug mt-2">${esc(n.head)}</div>
        <div class="mt-3 hm-label !text-[11px]">WHAT IT MEANS FOR BANK US</div>
        <div class="text-[14.5px] text-ink2 leading-relaxed mt-1">${esc(n.impact)}</div>
        ${it ? `<button onclick="openCanvas('item','${it.id}')" class="hm-pill mt-4 inline-flex items-center gap-1.5">${op ? 'Hide the analysis' : 'See the analysis'} ${ic(op ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</button>
          ${op ? `<div class="-mx-5 -mb-5 mt-4 overflow-hidden rounded-b-[18px]">${inlineDetail('item', it.id)}</div>` : ''}` : ''}
      </div>`; }).join('')}</div>`);
  }
  if (m.type === 'observe') {
    const o = envObservations(), mx = Math.max(...o.spark), mn = Math.min(...o.spark);
    return sec('YOUR ENVIRONMENT', 'How Bank US looks this morning',
      `<div class="rv hm-card p-5" data-d="250">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">${o.tiles.map(([l, v, sub, c]) => `<div class="rounded-2xl p-4 border border-indigo-400/15 bg-white/[.03]"><div class="text-[12px] text-ink3">${l}</div><div class="text-[26px] font-black font-mono ${c} leading-tight mt-1">${v}</div><div class="text-[12px] text-ink3">${sub}</div></div>`).join('')}</div>
        <div class="mt-5 flex items-end gap-2 h-16">${o.spark.map((v, i) => `<div class="flex-1 rounded-t-lg" style="height:${20 + (v - mn) / Math.max(1, mx - mn) * 80}%;background:${i === o.spark.length - 1 ? 'linear-gradient(180deg,#5eead4,#0d9488)' : 'rgb(129 140 248 / .22)'}" title="${v} issues"></div>`).join('')}</div>
        <div class="flex justify-between text-[11.5px] text-ink3 mt-1.5"><span>7 days ago</span><span>Issues per day</span><span>Today</span></div>
      </div>
      <ul class="mt-5 space-y-2.5">${o.notes.map((t, i) => `<li class="rv flex gap-3 text-[15px] text-ink2 leading-relaxed" data-d="${600 + i * 180}"><span class="mt-1 w-5 h-5 rounded-full border border-cx/50 bg-cx/10 c-cx flex items-center justify-center shrink-0">${ic('check', 'w-3 h-3')}</span>${esc(t)}</li>`).join('')}</ul>`);
  }
  if (m.type === 'needs') {
    const N = S.tasks.length;
    if (!N) return sec('DECISIONS', 'You’re all caught up', `<div class="hm-card p-6 flex items-center gap-3"><span class="c-cx">${ic('circle-check', 'w-6 h-6')}</span><div class="text-[15px] text-ink2">Nothing is waiting for you. I’ll bring the next decision here.</div></div>`);
    S.home.qa = S.home.qa || {}; S.home.open = S.home.open || {};
    S.home.si = Math.min(S.home.si || 0, N - 1);
    const card = (tk, ci) => { const A = apvData(tk), ag = PILLARS[agentOfTask(tk)], qa = S.home.qa[tk.id] || [], open = S.home.open[tk.id], act = ci === S.home.si;
      return `<div data-si="${ci}" onclick="if(!event.target.closest('button,input'))homeStripGo(${ci})" class="hs-card shrink-0 rounded-[18px] border ${act ? 'border-indigo-300/60' : 'border-indigo-400/20'} p-5 flex flex-col" style="scroll-snap-align:center;width:${open ? 'min(760px,86vw)' : 'min(500px,74vw)'};opacity:${act ? 1 : .45};transform:scale(${act ? 1 : .94});transition:width .35s ease, opacity .3s, transform .3s;cursor:${act ? 'default' : 'pointer'};background:linear-gradient(180deg, rgb(30 38 84 / .75), rgb(14 20 40 / .9))">
        <div class="flex items-center gap-2">${agentAv(ag, 26, false)}<span class="text-[12px] text-ink3">${ag.name} · ${ag.title}</span><span class="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-bold">Needs you</span></div>
        <div class="mt-3 text-[18px] font-bold text-ink leading-snug">${esc(tk.title)}</div>
        <p class="mt-2 text-[13.5px] text-ink2 leading-relaxed" style="display:-webkit-box;-webkit-line-clamp:${open ? 99 : 3};-webkit-box-orient:vertical;overflow:hidden">${esc(A.statement)}</p>
        ${open ? `<div class="mt-3 pt-3 border-t border-indigo-400/20 text-[13px]">${tk.caseId && byId(tk.caseId) ? `<div class="mb-3">${impactHTML(byId(tk.caseId), tk)}</div>` : ''}${actionReasonRich(tk.caseId ? byId(tk.caseId) : null, tk)}</div>` : ''}
        <button onclick="homeStrip('${tk.id}','more')" class="self-start mt-2 text-[12.5px] c-ai font-semibold">${open ? 'Less' : 'Full decision'}</button>
        ${qa.length ? `<div class="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">${qa.map(m => m.role === 'user' ? `<div class="flex justify-end"><span class="rounded-2xl rounded-tr-sm px-3 py-1.5 bg-indigo-500/30 text-[12.5px] text-ink">${esc(m.text)}</span></div>` : `<div class="flex gap-2">${agentAv(ag, 18, false)}<span class="rounded-2xl rounded-tl-sm px-3 py-1.5 bg-white/[.06] text-[12.5px] text-ink2 leading-relaxed">${m.typing ? '…' : esc(m.text)}</span></div>`).join('')}</div>` : ''}
        <div class="mt-auto pt-3"><div class="flex gap-1.5 flex-wrap mb-2">${['Why?', 'What if I wait?', 'What’s the risk?'].filter(q => !qa.some(m => m.text === q)).map(q => `<button onclick="homeStripAsk('${tk.id}',${JSON.stringify(q).replace(/"/g, '&quot;')})" class="px-2.5 py-1 rounded-full border border-indigo-400/30 text-[11.5px] text-ink2 hover:text-ink">${q}</button>`).join('')}</div>
          <div class="flex items-center gap-2"><input id="hs-in-${tk.id}" onkeydown="if(event.key==='Enter')homeStripAsk('${tk.id}',this.value)" placeholder="Ask ${ag.name} about this…" class="flex-1 min-w-0 rounded-xl bg-sunk border border-line2 px-3 py-2 text-[13px] text-ink outline-none"/>
            <button onclick="homeStrip('${tk.id}','approve')" class="px-3.5 py-2 rounded-xl bg-indigo-500/40 border border-indigo-300/50 text-[13px] font-semibold text-ink">Approve</button><button onclick="homeStrip('${tk.id}','decline')" class="px-3 py-2 rounded-xl border border-line2 text-[13px] text-ink2">Decline</button></div></div></div>`; };
    return sec('DECISIONS', `${N} decision${N > 1 ? 's' : ''} only you can make`, `
      <div class="rv relative" data-d="200">
        <div id="dstrip" onscroll="homeStripScroll()" class="flex gap-5 overflow-x-auto pb-3 items-stretch" style="scroll-snap-type:x mandatory;scrollbar-width:none;padding-left:calc(50% - min(250px,37vw));padding-right:calc(50% - min(250px,37vw))">${S.tasks.map(card).join('')}</div>
        <button onclick="homeStripGo((S.home.si||0)-1)" style="left:-20px;top:42%" class="absolute w-10 h-10 rounded-full bg-panel border border-indigo-400/30 flex items-center justify-center text-ink2 hover:text-ink shadow-lg">${ic('chevron-left', 'w-5 h-5')}</button>
        <button onclick="homeStripGo((S.home.si||0)+1)" style="right:-20px;top:42%" class="absolute w-10 h-10 rounded-full bg-panel border border-indigo-400/30 flex items-center justify-center text-ink2 hover:text-ink shadow-lg">${ic('chevron-right', 'w-5 h-5')}</button>
      </div>`);
  }
  return '';
}
function moreEvents() {
  const ev = [];
  S.cases.filter(c => c.task && !['555548', '994821', '183347'].includes(c.id)).slice(0, 2).forEach(c => ev.push({ sev: c.severity === 'Critical' ? 'Critical' : 'High', p: 'analyst', t: c.name, sub: 'Waiting for your decision', kind: 'case', id: c.id }));
  [['Campaign: FIN7', 'intel', 'High'], ['Leaked credentials', 'intel', 'High'], ['EDR agent outdated', 'engineer', 'Medium'], ['risky OAuth', 'hunter', 'Medium']].forEach(([f, p, sev]) => { const it = itemByTitle(f); if (it) ev.push({ sev, p, t: it.title, sub: it.status === 'pending' ? it.ask + ', waiting for you' : (it.done || it.result), kind: 'item', id: it.id }); });
  return ev.slice(0, 5);
}
/* catch-up, right here in the briefing */

function homeStripCenter(smooth) { const st = $('dstrip'); if (!st) return; const el = st.querySelector(`[data-si="${S.home.si || 0}"]`); if (!el) return; const left = el.offsetLeft - (st.clientWidth - el.offsetWidth) / 2; S._hsLock = Date.now(); st.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' }); }
function homeStripRender() { const sc = $('home-scroll'), y = sc ? sc.scrollTop : 0; S._homeHtml = null; renderHome(false); const sc2 = $('home-scroll'); if (sc2) sc2.scrollTop = y; homeStripCenter(false); setTimeout(() => homeStripCenter(true), 380); }
function homeStripGo(i) { const N = S.tasks.length; if (!N) return; S.home.si = Math.max(0, Math.min(N - 1, i)); document.querySelectorAll('#dstrip .hs-card').forEach(el => { const a = +el.dataset.si === S.home.si; el.style.opacity = a ? 1 : .45; el.style.transform = `scale(${a ? 1 : .94})`; el.style.cursor = a ? 'default' : 'pointer'; el.classList.toggle('border-indigo-300/60', a); }); homeStripCenter(true); }
function homeStripScroll() { if (Date.now() - (S._hsLock || 0) < 700) return; clearTimeout(S._hsT); S._hsT = setTimeout(() => { const st = $('dstrip'); if (!st) return; const mid = st.scrollLeft + st.clientWidth / 2; let best = 0, bd = 1e9; st.querySelectorAll('.hs-card').forEach(el => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = +el.dataset.si; } }); if (best !== S.home.si) { S.home.si = best; homeStripGo(best); } }, 140); }
function homeStrip(id, kind) {
  if (kind === 'more') { S.home.open[id] = !S.home.open[id]; const i0 = S.tasks.findIndex(t => t.id === id); if (i0 >= 0) S.home.si = i0; return homeStripRender(); }
  const tk = S.tasks.find(t => t.id === id); if (!tk) return;
  (kind === 'approve' ? authorizeTask : declineTask)(tk.id, true); toast(`${kind === 'approve' ? 'Approved' : 'Declined'}: ${tk.title}`, kind === 'approve' ? 'check' : 'x');
  homeStripRender();
}
function homeStripAsk(id, q) {
  q = (q || '').trim(); if (!q) return; const tk = S.tasks.find(t => t.id === id); if (!tk) return;
  const L = (S.home.qa[id] = S.home.qa[id] || []); L.push({ role: 'user', text: q }); L.push({ role: 'agent', typing: true }); homeStripRender();
  setTimeout(() => { L.pop(); const c = byId(tk.caseId), l = q.toLowerCase(); let a;
    if (tk.itemId) a = itemAnswer(itemById(tk.itemId), q);
    else if (/wait|later/.test(l)) a = `If you wait, ${c.host} stays connected to the attacker and the payload keeps running. Every few minutes adds risk.`;
    else if (/risk/.test(l)) a = `Low to medium. ${c.host} is offline until released, and it’s one click to undo. The bigger risk is leaving it connected.`;
    else { const r = respond(c, q); a = typeof r === 'string' ? r : r.text; }
    L.push({ role: 'agent', text: a }); homeStripRender(); }, 650);
}
function homeDeck(kind) {
  const top = $('deck-top'); const N = S.tasks.length; if (!N) return;
  const go = () => {
    const tk = S.tasks[S.home.deckIdx || 0];
    if (kind === 'approve' || kind === 'decline') { if (tk) { (kind === 'approve' ? authorizeTask : declineTask)(tk.id, true); toast(`${kind === 'approve' ? 'Approved' : 'Declined'}: ${tk.title}`, kind === 'approve' ? 'check' : 'x'); } }
    else if (kind === 'next') S.home.deckIdx = Math.min(N - 1, (S.home.deckIdx || 0) + 1);
    else if (kind === 'prev') S.home.deckIdx = Math.max(0, (S.home.deckIdx || 0) - 1);
    S.home.deckIn = true; S._homeHtml = null; renderHome(false); S.home.deckIn = false;
  };
  if (top) { top.classList.add('deck-out'); setTimeout(go, 380); } else go();
}
function startHomeCatchup() {
  const d = $('deck') || [...document.querySelectorAll('#home-thread [data-mi]')].pop(); const sc = $('home-scroll');
  if (d) sc.scrollTo({ top: sc.scrollTop + d.getBoundingClientRect().top - sc.getBoundingClientRect().top - 120, behavior: 'smooth' });
}
function _oldStartHomeCatchup() {
  pauseStory();
  S.home.cuOn = true; S.home.cuIdx = 0; S.home.cuDone = 0;
  S.home.msgs.forEach(m => { if (m.type === 'catchup') m.closed = true; });
  S.home.msgs.push({ role: 'agent', type: 'catchup' });
  S.home.scrollNext = true; S._homeHtml = null; renderHome(false, true);
}
function homeCu(kind) {
  const tk = S.tasks[S.home.cuIdx]; if (!tk) return;
  if (kind === 'later') S.home.cuIdx = (S.home.cuIdx + 1) % Math.max(1, S.tasks.length);
  else { if (kind === 'approve') authorizeTask(tk.id, true); else declineTask(tk.id, true); S.home.cuDone++; toast(kind === 'approve' ? `Approved: ${tk.title}` : `Declined: ${tk.title}`, kind === 'approve' ? 'check' : 'x'); }
  if (S.home.cuIdx >= S.tasks.length) S.home.cuIdx = 0;
  S.home.cuFlip = true; S._homeHtml = null; renderHome(false);
}
function homeCatchupHTML(m) {
  if (m.closed) return `<div class="text-[13px] text-ink3">Closed.</div>`;
  const tk = S.tasks[S.home.cuIdx];
  if (!tk) { S.home.cuOn = false; return `<div class="rounded-2xl border border-cx/40 bg-cx/5 p-5 flex items-center gap-3"><span class="c-cx">${ic('circle-check', 'w-6 h-6')}</span><div><div class="text-[15px] font-bold text-ink">You’re all caught up</div><div class="text-[13px] text-ink2">${S.home.cuDone} decision${S.home.cuDone === 1 ? '' : 's'} made. I’ll let you know when the next one comes in.</div></div></div>`; }
  const kind = tk.caseId ? 'case' : 'item', id = tk.caseId || tk.itemId;
  const c = tk.caseId && byId(tk.caseId), it = tk.itemId && itemById(tk.itemId), p = tk.pillar || 'analyst';
  const inv = c ? investigation(c) : null;
  const flip = S.home.cuFlip; S.home.cuFlip = false;
  return `<div class="${flip ? 'xp-in' : ''} rounded-2xl border border-line bg-panel overflow-hidden">
    <div class="px-5 py-3 border-b border-line flex items-center justify-between gap-3 bg-panel2">
      <div class="flex items-center gap-2 text-[12px] text-ink3">${ic('bell-ring', 'w-4 h-4 c-amber')}<span class="font-semibold text-ink">Decisions</span><span>${S.home.cuIdx + 1} of ${S.tasks.length}</span></div>
      <div class="flex items-center gap-1">${S.tasks.slice(0, 10).map((_, i) => `<span class="h-1.5 rounded-full ${i === S.home.cuIdx ? 'w-5 bg-amber-500' : 'w-1.5 bg-line2'}"></span>`).join('')}</div>
    </div>
    <div class="p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">${pillarBadge(p)}
          <div class="text-[20px] font-bold text-ink leading-tight mt-2">${esc(tk.title)}</div>
          <div class="text-[13px] text-ink3 mt-1">${esc(c ? c.name : it ? it.title : tk.target)}</div></div>
        <div class="shrink-0">${slaRing(tk)}</div>
      </div>
      <div class="mt-4">${approvalCardHTML(tk, 'cu:' + tk.id, { cu: true })}</div>
      <div class="mt-3 flex gap-2 flex-wrap">
        ${S.tasks.length > 1 ? `<button onclick="homeCu('later')" class="px-4 py-2 rounded-full text-ink3 hover:text-ink text-[13px] font-semibold">Later</button>` : ''}
        ${c ? `<button onclick="openCaseDrawer('${c.id}')" class="ml-auto px-3 py-2 rounded-xl text-[13px] font-semibold c-brand inline-flex items-center gap-1">Full case ${ic('maximize-2', 'w-3.5 h-3.5')}</button>` : ''}
      </div>
      ${askBox(kind, id)}
    </div></div>`;
}
function renderCanvas() {}

/* moving from Home into the workforce */
function mountWfBorn(play) {
  const who = S.pillar || 'analyst', e = $('entity');
  if (e && e.dataset.who !== who) { e.innerHTML = mainAgentSVG(); e.dataset.who = who; if (play !== false && e.animate) e.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,1.2,.3,1)' }); }
  const nm = $('cp-agent-name'); if (nm) nm.innerHTML = `${PILLARS[who].name} <span class="font-normal text-ink3">· ${PILLARS[who].title}</span>`;
  const en = $('ent-name'); if (en) en.innerHTML = `<div class="text-[20px] font-black text-ink">${PILLARS[who].name}</div><div class="text-[13px] font-semibold" style="color:${PILLARS[who].c2}">${PILLARS[who].title}</div>`;
}
function animateWorkforceIn() {
  mountWfBorn(true);
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || window.innerWidth < 1024 || !document.body.animate) return;
  const ease = 'cubic-bezier(.2,.8,.2,1)', cp = $('pane-copilot'), mt = $('metrics'), side = S.logCollapsed ? $('log-rail') : $('pane-log'), pc = $('pane-cases');
  pc.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: ease });
  cp.animate([{ transform: 'translateX(105%)', opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: 760, delay: 120, easing: ease, fill: 'backwards' });
  if (side) side.animate([{ transform: 'translateX(-100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, delay: 220, easing: ease, fill: 'backwards' });
  [...mt.children].forEach((k, i) => k.animate([{ transform: 'translateX(-70px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, delay: 300 + i * 90, easing: ease, fill: 'backwards' }));
  [...$('pillar-tabs').children].forEach((k, i) => k.animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, delay: 200 + i * 80, easing: ease, fill: 'backwards' }));
}
function goWorkforce(pillar, taskId) {
  if (S.drawerId) closeCaseDrawer();
  const home = $('view-home');
  const go = () => {
    S.filter = 'pending';
    if (pillar) S.pillar = pillar;
    else if (taskId === true) S.pillar = S.pillar || 'analyst';
    S._tblHtml = null;
    if (taskId) S.tourDone = true;
    navigateTo('autonomous');
    animateWorkforceIn();
    if (taskId) setTimeout(() => openCatchup(taskId === true ? undefined : taskId), 650);
  };
  if (S.view === 'home' && home.animate && window.innerWidth >= 1024) {
    home.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.98)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = () => { go(); home.getAnimations().forEach(a => a.cancel()); };
  } else go();
}