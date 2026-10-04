/* ======================================================================
   CASE: the agentic investigation (one flowing page, ask anything inline)
   ====================================================================== */
function agentMark(px) { return `<span class="inline-flex shrink-0" style="width:${px}px;height:${px}px">${robotSVG(px, '#3ee6a0', '#36d4ea')}</span>`; }
function secDiscussion(c, sk, asks) {
  S.secQA = S.secQA || {}; const L = (S.secQA[c.id] = S.secQA[c.id] || {})[sk] || [];
  const asked = new Set(L.filter(m => m.role === 'user').map(m => m.text));
  return `<div class="mt-3">${L.length ? `<div class="mb-2.5 space-y-2 rounded-xl border border-indigo-400/20 bg-indigo-500/[.04] p-3">${L.map(m => m.role === 'user' ? `<div class="flex justify-end"><span class="rounded-2xl rounded-tr-sm px-3 py-1.5 bg-indigo-500/30 text-[13px] text-ink">${esc(m.text)}</span></div>` : `<div class="flex gap-2">${agentMark(20)}<span class="rounded-2xl rounded-tl-sm px-3 py-1.5 bg-white/[.06] text-[13px] text-ink2 leading-relaxed">${m.typing ? '…' : md(m.text)}</span></div>`).join('')}</div>` : ''}
    <div class="flex items-center gap-1.5 flex-wrap">${(asks || []).filter(q => !asked.has(q)).map(q => `<button onclick="caseAskAt('${c.id}','${sk}',${JSON.stringify(q).replace(/"/g, '&quot;')})" class="px-2.5 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/[.06] text-[12px] text-ink2 hover:text-ink hover:border-indigo-300/60 inline-flex items-center gap-1">${ic('sparkles', 'w-3 h-3 c-ai')}${esc(q)}</button>`).join('')}
      <span class="inline-flex items-center gap-1 rounded-full border border-line2 bg-sunk pl-2.5 pr-1 py-0.5"><input id="sq-${c.id}-${sk}" onkeydown="if(event.key==='Enter')caseAskAt('${c.id}','${sk}',this.value)" placeholder="Ask about this…" class="w-[150px] bg-transparent outline-none text-[12px] text-ink placeholder:text-ink3"/><button onclick="caseAskAt('${c.id}','${sk}',document.getElementById('sq-${c.id}-${sk}').value)" class="w-5 h-5 rounded-full bg-indigo-500/40 text-white text-[11px] flex items-center justify-center">↑</button></span></div></div>`;
}
function caseAnswerText(c, q) {
  const l = q.toLowerCase(); let a;
  if (/which attack path|most likely/.test(l)) { const B = blastModel(c), p = B.paths && B.paths[0]; a = p ? `The most likely path is **${p.steps.join(' → ')}**${p.via ? `: first through ${String(p.via[0]).toLowerCase()}` : ''}.` : 'Through the cached credentials on the host.'; }
  else if (/blast|impact|reach|radius|containment cut/.test(l)) { const B = blastModel(c); a = `If nothing is done, the attacker can reach **${B.ring1.length} assets in one hop**${B.ring2 ? ` and **${B.ring2.length} crown jewels** behind them` : ''}. Isolating ${c.host} cuts all of them.`; }
  else if (/how sure|confiden/.test(l)) { const inv = investigation(c); a = `**${confLevel(inv.target) || 'Still building'} confidence.** ${inv.calib || ''}${inv.shift ? ' ' + inv.shift : ''}`; }
  else if (/change the verdict|would change/.test(l)) { const inv = investigation(c); a = inv.shift || 'Proof that the activity was authorized, for example a change ticket or an approved test, would change it.'; }
  else if (/when did it start|start\?/.test(l)) { const m = caseModel(c); a = `It started **${fmtDate(m.first)}** on ${c.host}, with the first ${m.label.toLowerCase()} issue.`; }
  else if (/who else|affected/.test(l)) { const m = caseModel(c); a = `Hosts: **${m.hosts.join(', ')}**. Accounts: **${m.users.join(', ')}**.`; }
  else if (/which attack path|most likely/.test(l)) { const B = blastModel(c), p = B.paths && B.paths[0]; a = p ? `The most likely path is **${p.steps.join(' → ')}**.` : 'Through the cached credentials on the host.'; }
  else if (/why this verdict|why is it|explain the verdict/.test(l)) a = investigation(c).expl;
  else { const r = respond(c, q); a = typeof r === 'string' ? r : r.text; }
  return a;
}
function caseAskAt(cid, sk, q) {
  q = (q || '').trim(); if (!q) return; const c = byId(cid); if (!c) return;
  S.secQA = S.secQA || {}; const M = (S.secQA[cid] = S.secQA[cid] || {}); const L = (M[sk] = M[sk] || []);
  L.push({ role: 'user', text: q }, { role: 'agent', typing: true }); S.cvSig = null; openCaseDrawer(cid, true);
  setTimeout(() => { L.pop(); L.push({ role: 'agent', text: caseAnswerText(c, q) }); S.cvSig = null; openCaseDrawer(cid, true); }, 600);
}
function askChips(c, qs) { return `<div class="mt-3 flex gap-1.5 flex-wrap">${qs.map(q => `<button onclick="caseAsk('${c.id}', ${JSON.stringify(q).replace(/"/g, '&quot;')})" class="px-2.5 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/[.06] text-[12px] text-ink2 hover:text-ink hover:border-indigo-300/60 inline-flex items-center gap-1">${ic('sparkles', 'w-3 h-3 c-ai')}${esc(q)}</button>`).join('')}</div>`; }
function caseFollowUps(c) {
  const L = (caseAgentState().msgs[c.id] || []).filter(x => x.role === 'user').map(x => x.text.toLowerCase());
  const tk = S.tasks.find(t => t.id === c.task);
  const pool = [ 'Why this verdict?', 'What is the blast radius?', tk ? 'What happens if I wait?' : 'What should I check next?', 'Which attack path is most likely?', 'What would change the verdict?', 'Who else was affected?', 'When did it start?' ];
  return pool.filter(q => !L.includes(q.toLowerCase())).slice(0, 4);
}
function agenticInvHTML(c) {
  const inv = investigation(c), B = blastModel(c), tk = S.tasks.find(t => t.id === c.task), m = caseModel(c);
  const wl = getWorklog(c).filter(e => e.by === 'agent'), nq = wl.filter(e => e.type === 'xql').length;
  const msg = (title, inner, asks) => { const sk = title.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); return `<div id="sec-${sk}" class="flex gap-3.5 rounded-2xl">${agentMark(32)}<div class="min-w-0 flex-1">
      <div class="text-[15px] font-bold text-ink">${title}</div><div class="mt-2">${inner}</div>${secDiscussion(c, sk, asks)}</div></div>`; };
  const srcs = [...new Set(wl.filter(e => e.type === 'xql').map(e => (e.dataset || '').split('_')[0]).filter(Boolean))];
  const summary = `<p class="text-[14.5px] text-ink2 leading-relaxed">I picked up case #${c.id} the moment it was created, ${fmtDate(new Date(c.opened || c.updated))}. It started from a ${esc(m.label.toLowerCase())} issue on ${richText(c, c.host)}. I grouped ${m.issues.length} related issues into the case, then worked through ${inv.Q.length} questions: ${inv.Q.map(q => q.q.replace(/\?$/, '').charAt(0).toLowerCase() + q.q.replace(/\?$/, '').slice(1)).slice(0, 3).join('; ')}${inv.Q.length > 3 ? ', and more' : ''}. To answer them I ran ${nq || 'several'} queries${srcs.length ? ' across ' + srcs.join(', ') : ''} and collected ${inv.evCount} pieces of evidence. It took ${fmtDur(c.dur || 0)}.</p>
`;
  const plan = planModel(c), st = (S.plan || {})[c.id] || {};
  S.actOpen = S.actOpen || {};
  const actionCard = (key, who, title, why, buttons, tag, tagCls) => `<div id="act-${key}" class="rounded-2xl border ${tag.startsWith('Needs your approval') ? 'border-amber-500/40' : 'border-indigo-400/25'} overflow-hidden" style="background:linear-gradient(180deg, rgb(28 36 78 / .40), rgb(13 18 38 / .50))">
      <div class="px-4 py-3 flex items-center gap-3"><span class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tag.startsWith('Needs') ? 'bg-amber-500/15 text-amber-300' : 'bg-indigo-500/15 text-indigo-200'}">${ic(tag.startsWith('Needs') ? 'shield-alert' : 'zap', 'w-4 h-4')}</span><div class="min-w-0 flex-1"><div class="text-[14px] font-semibold text-ink">${esc(title)}</div><div class="text-[11.5px] ${tagCls}">${tag}</div></div>${buttons}</div>
      <button onclick="S.actOpen['${key}']=!S.actOpen['${key}'];S.cvSig=null;openCaseDrawer('${c.id}',true)" class="w-full text-left px-4 py-2 border-t border-indigo-400/15 text-[12.5px] text-ink3 hover:text-ink flex items-center gap-1.5">${ic('sparkles', 'w-3.5 h-3.5 c-ai')}Reasoning<span class="ml-auto">${ic(S.actOpen[key] ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</span></button>
      ${S.actOpen[key] ? `<div class="xp-in px-4 pb-4 text-[13px] text-ink2 leading-relaxed">${why}</div>` : ''}</div>`;
  const A = tk ? apvData(tk) : null;
  const actions = (tk ? actionCard(c.id + '-apv', 'analyst', tk.title, actionReasonRich(c, tk),
      `<span class="flex gap-1.5 shrink-0"><button onclick="caseDecide('${c.id}','approve')" class="hm-pill pri !py-1.5 !text-[13px]">Approve</button><button onclick="caseDecide('${c.id}','decline')" class="hm-pill !py-1.5 !text-[13px]">Decline</button></span>`, `Needs your approval · verdict ${inv.label}, ${confLevel(inv.target) || 'building'} confidence`, 'c-amber') : '')
    + plan.map(x => actionCard(c.id + '-s-' + x.id, x.who, x.t, suggestionReason(c, x),
      st[x.id] === 'done' ? `<span class="text-[12px] c-cx font-semibold inline-flex items-center gap-1 shrink-0">${ic('check', 'w-3.5 h-3.5')}Done</span>` : st[x.id] === 'running' ? `<span class="text-[12px] c-blue font-semibold inline-flex items-center gap-1.5 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Running</span>`
        : `<button onclick="runSuggestion('${c.id}','${x.id}')" class="hm-pill !py-1.5 !text-[13px] shrink-0">Run it</button>`,
      st[x.id] === 'done' ? 'Done' : st[x.id] === 'running' ? 'In progress' : 'Suggested', st[x.id] === 'done' ? 'c-cx' : st[x.id] === 'running' ? 'c-blue' : 'text-ink3')).join('');
  const convo = (caseAgentState().msgs[c.id] || []).map(x => x.role === 'user' ? `<div class="flex justify-end"><div class="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-500/25 border border-indigo-400/30 text-ink px-4 py-2.5 text-[14px]">${esc(x.text)}</div></div>`
    : x.role === 'typing' ? `<div class="flex gap-3.5">${agentMark(32)}<div class="typing pt-2.5"><span></span><span></span><span></span></div></div>`
    : `<div class="flex gap-3.5">${agentMark(32)}<div class="text-[14.5px] text-ink2 leading-relaxed pt-1">${md(x.text)}</div></div>`).join('');
  const exp = (S.cvExp || {})[c.id] || 0;
  return `<div class="mt-5 rounded-3xl border border-indigo-400/25 overflow-hidden" style="background:linear-gradient(180deg, rgb(20 27 58 / .55), rgb(10 14 30 / .55))">
    <div class="px-5 sm:px-7 py-7 space-y-9">
      ${msg('Here’s how I investigated', summary + `<div class="mt-4">${investigationFlowHTML(c)}</div><p class="mt-2 text-[12.5px] text-ink3">Click any step to open it: what I checked, the evidence and the query behind it.</p>`, ['When did it start?', 'Who else was affected?'])}
      ${msg('The attack, and how far it could spread', `<div class="rounded-2xl border border-line bg-panel/60 p-3">${caseStoryGraph(c)}</div>
        <p class="mt-2 text-[13px] text-ink3">Solid lines are what happened. Dashed nodes are what the attacker could reach from ${esc(c.host)}: ${B.ring1.length} assets, not observed yet.</p>`,
        ['Which attack path is most likely?', 'What does containment cut?'])}
      ${msg(`My verdict: <span style="color:${inv.color}">${inv.label}</span>`, `<p class="text-[14.5px] text-ink2 leading-relaxed">${richText(c, inv.expl)}</p>${inv.shift ? `<p class="text-[13px] text-ink3 mt-1.5">${esc(inv.shift)}</p>` : ''}${verdictHistoryHTML(c)}`, ['What would change the verdict?', 'How sure are you?'])}
      ${msg('The questions I answered', `<p class="text-[13px] text-ink3 mb-2">Each answer either supports the verdict or points the other way. Open one to see the evidence and the raw events behind it.</p>${investigationHTML(c).replace('mt-5 rounded-2xl border border-line overflow-hidden', 'rounded-2xl border border-line overflow-hidden')}${gapsHTML(c)}`)}
      <div id="ai-actions">${msg('What I recommend', `<div class="space-y-2.5">${actions}</div>`)}</div>
      ${convo ? `<div id="ai-convo" class="space-y-5 pt-2 border-t border-indigo-400/15">${convo}</div>` : '<div id="ai-convo"></div>'}
    </div>
    <div class="sticky bottom-0 z-[3] px-4 sm:px-6 py-3 border-t border-indigo-400/20" style="background:rgb(13 18 40 / .95);backdrop-filter:blur(8px)">
      <div class="mb-2 flex gap-1.5 flex-wrap">${caseFollowUps(c).map(q => `<button onclick="caseAsk('${c.id}', ${JSON.stringify(q).replace(/"/g, '&quot;')})" class="px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/[.06] text-[12.5px] text-ink2 hover:text-ink">${esc(q)}</button>`).join('')}</div>
      <div class="flex items-center gap-2 rounded-2xl p-1.5 pl-2.5 border border-indigo-400/35 bg-sunk">
        ${agentMark(28)}
        <input id="ca-in" placeholder="Ask about this investigation, or tell the agents what to do…" onkeydown="if(event.key==='Enter') caseAsk('${c.id}')" class="flex-1 min-w-0 bg-transparent text-[14px] text-ink placeholder:text-ink3 focus:outline-none py-2">
        <button onclick="caseAsk('${c.id}')" class="p-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-ink">${ic('arrow-up', 'w-4 h-4')}</button>
      </div>
    </div>
  </div>`;
}
