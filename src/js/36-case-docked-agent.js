/* ======================================================================
   CASE: the docked agent (bottom bar with floating answers, or side panel)
   ====================================================================== */
function caseAgentState() { S.caseAgent = S.caseAgent || { mode: 'bar', open: true, msgs: {}, side: 'agent' }; return S.caseAgent; }
function caseMsgsHTML(c) {
  const A = caseAgentState(), L = A.msgs[c.id] || [];
  return L.map(x => x.role === 'user' ? `<div class="flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-500/25 border border-indigo-400/30 text-ink px-3.5 py-2 text-[13.5px]">${esc(x.text)}</div></div>`
    : x.role === 'typing' ? `<div class="typing pl-1"><span></span><span></span><span></span></div>`
    : `<div class="flex gap-2.5"><span class="w-6 h-6 agent-av shrink-0"></span><div class="text-[13.5px] text-ink2 leading-relaxed">${md(x.text)}</div></div>`).join('');
}
function caseQuick(c) { return ['Why this verdict?', 'What is the blast radius?', 'Hunt for related activity'].map(q => `<button onmousedown="event.preventDefault()" onclick="caseAsk('${c.id}', ${JSON.stringify(q).replace(/"/g, '&quot;')})" class="px-2.5 py-1 rounded-full border border-indigo-400/30 text-[12px] text-ink2 hover:text-ink whitespace-nowrap">${q}</button>`).join(''); }
function caseAgentBar(c, wide) {
  const tk = S.tasks.find(t => t.id === c.task);
  const chips = ['Why this verdict?', 'What is the blast radius?'];
  return `<div class="absolute left-1/2 -translate-x-1/2 bottom-4 z-[6] w-[min(760px,calc(100%-32px))]">
    <div class="flex items-center gap-2 rounded-2xl p-1.5 pl-2.5" style="background:rgb(16 22 48 / .94);border:1px solid rgb(129 140 248 / .4);box-shadow:0 18px 50px -14px rgb(99 102 241 / .55);backdrop-filter:blur(10px)">
      <span class="w-7 h-7 agent-av shrink-0"></span>
      <input id="ca-in" placeholder="Ask anything about this case, or tell the agents what to do…" onkeydown="if(event.key==='Enter') caseAsk('${c.id}')" class="flex-1 min-w-0 bg-transparent text-[14px] text-ink placeholder:text-ink3 focus:outline-none py-2">
      <span class="hidden lg:flex gap-1.5">${chips.map(q => `<button onmousedown="event.preventDefault()" onclick="caseAsk('${c.id}', ${JSON.stringify(q).replace(/"/g, '&quot;')})" class="px-2.5 py-1 rounded-full border border-indigo-400/30 text-[12px] text-ink2 hover:text-ink whitespace-nowrap">${q}</button>`).join('')}</span>
      <button onclick="caseAsk('${c.id}')" class="p-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-ink">${ic('arrow-up', 'w-4 h-4')}</button>
    </div></div>`;
}
function caseAgentSide(c) {
  return `<div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto space-y-3 pb-3" id="ca-side">${caseMsgsHTML(c) || `<div class="text-[13px] text-ink3">Ask me anything about #${c.id}. I can explain the verdict, the blast radius, or find another way to respond.</div><div class="flex flex-wrap gap-1.5 mt-3">${caseQuick(c)}</div>`}</div>
    <div class="flex items-center gap-2 rounded-2xl p-1.5 pl-3 border border-indigo-400/35 bg-sunk">
      <input id="ca-in" placeholder="Ask about this case…" onkeydown="if(event.key==='Enter') caseAsk('${c.id}')" class="flex-1 min-w-0 bg-transparent text-[13.5px] text-ink placeholder:text-ink3 focus:outline-none py-1.5">
      <button onclick="caseAsk('${c.id}')" class="p-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-ink">${ic('arrow-up', 'w-4 h-4')}</button></div></div>`;
}
function caseAsk(id, preset) {
  const A = caseAgentState(), inp = $('ca-in'); const q = (preset || (inp && inp.value) || '').trim(); if (!q) return;
  const L = A.msgs[id] = A.msgs[id] || [];
  L.push({ role: 'user', text: q }, { role: 'typing' });
  S.cvMain = 'investigation'; S.cvSig = null; openCaseDrawer(id, true);
  const toBottom = () => { const mn = $('cv-main'); if (mn) mn.scrollTo({ top: mn.scrollHeight, behavior: 'smooth' }); };
  setTimeout(toBottom, 40);
  setTimeout(() => {
    L.splice(L.findIndex(x => x.role === 'typing'), 1);
    const c = byId(id); let a;
    const l = q.toLowerCase();
    if (/blast|impact|reach|radius|attack path|containment cut/.test(l)) { const B = blastModel(c); a = `If nothing is done, the attacker can reach **${B.ring1.length} assets in one hop** and **${B.ring2.length} crown jewels in two**: ${B.ring2.map(r => r.k.toLowerCase()).join(', ')}. The most likely path is ${B.paths[0].steps.join(' → ')}. Approving the containment cuts every path at the first hop. I expanded the blast radius in the graph above.`; S.cvExp = S.cvExp || {}; S.cvExp[id] = 2; }
    else if (/how sure|confiden/.test(l)) { const inv = investigation(c); a = `**${confLevel(inv.target) || 'Still building'} confidence.** ${inv.calib}${inv.shift ? ' ' + inv.shift : ''}`; }
    else if (/change the verdict|would change/.test(l)) { const inv = investigation(c); a = inv.shift || 'Proof that the activity was authorized, for example a change ticket or an approved test, would lower the verdict.'; }
    else if (/when did it start|start\?/.test(l)) { const m = caseModel(c); a = `It started **${fmtDate(m.first)}** on ${c.host}, with the first ${m.label.toLowerCase()} issue. The agent picked it up within seconds and grouped ${m.issues.length} related issues into this case.`; }
    else if (/who else|affected/.test(l)) { const m = caseModel(c); a = `Hosts: **${m.hosts.join(', ')}**. Accounts: **${m.users.join(', ')}**. Only ${c.host} shows the full attack chain; the others saw related activity.`; }
    else if (/how fast|payments database/.test(l)) { const B = blastModel(c); a = `Along the most likely path (${B.paths[0].steps.join(' → ')}), it’s **2 hops**. In similar intrusions that takes hours, not days, once credentials are dumped. That’s why isolation is recommended now.`; }
    else if (/which attack path|most likely/.test(l)) { const B = blastModel(c), p = B.paths[0]; a = `The most likely path is **${p.steps.join(' → ')}**: first through ${p.via[0].toLowerCase()}, then ${p.via[1].toLowerCase()}. It ends at the ${p.target.toLowerCase()}.`; }
    else if (/why this verdict|why is it|explain the verdict/.test(l)) { a = investigation(c).expl; }
    else if (/^why (block|reset|hunt|check|profile)/.test(l)) { const x = planModel(c).find(y => l.includes(y.t.toLowerCase().slice(0, 12))); a = x ? `${x.why} ${PILLARS[x.who].name} can do it now; it takes a couple of minutes.` : 'It reduces the attacker’s options while the main decision is pending.'; }
    else { const r = respond(c, q); a = typeof r === 'string' ? r : r.text; }
    L.push({ role: 'agent', text: a }); S.cvSig = null; openCaseDrawer(id, true); setTimeout(toBottom, 40);
    const el = $('ca-in'); if (el) el.focus();
  }, 650 + rint(350));
}