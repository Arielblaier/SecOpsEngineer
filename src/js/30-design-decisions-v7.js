/* ======================================================================
   DESIGN DECISIONS v7: output flow, in-place expansion, full screen
   ====================================================================== */
/* ---------- 2A · more room, items expand where they are ---------- */
dxCollab = function () {
  S.dxCmts = S.dxCmts || { q5: [{ id: 0, who: 'josh', t: 'Watching the two other inboxes. Neither has clicked yet.' }] };
  const cols = dxCollabCards(), titles = ['THE CASE', 'HYPOTHESES', 'QUESTIONS', '', 'DECISION'], sel = S.dxCm, focus = 'q5';
  const card = ([key, kind, t, s1]) => { const n = ((S.dxCmts[key]) || []).length, on = sel === key;
    const tag = key === focus ? `<span class="absolute flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5 text-[10.5px] font-bold" style="top:-11px;left:12px;background:#5eead4;color:#04261a">${agentAv(PILLARS.analyst, 16, false)}Josh is here</span>` : `<span class="absolute" style="top:-10px;right:-10px">${agentAv(PILLARS.analyst, 20, false)}</span>`;
    if (!on) return `<button onclick="S.dxCm='${key}';renderDxSim()" class="relative w-full text-left rounded-2xl border p-4 flex flex-col ${key === focus ? 'border-teal-300/60' : 'border-white/10 hover:border-white/25'}" style="height:156px;background:linear-gradient(180deg, rgb(30 38 80 / .55), rgb(16 22 46 / .7))">${tag}
      <div class="text-[10.5px] font-black tracking-[.14em] text-white/45">${kind.toUpperCase()}</div><div class="mt-1.5 text-[13.5px] font-semibold text-white leading-snug" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${t}</div>
      <div class="mt-auto flex items-center gap-2 text-[11.5px]"><span class="text-white/55 truncate flex-1">${s1}</span><span class="${n ? 'text-indigo-200' : 'text-white/35'}">💬 ${n || ''}</span></div></button>`;
    S._dxCompact = true; const det = dxCardDetail(key).replace(/<pre class="rounded-lg px-3 py-2/g, '<pre style="word-break:break-all" class="rounded-lg px-3 py-2'); S._dxCompact = false;
    return `<div class="relative rounded-2xl border border-indigo-300/70 p-4" style="min-width:0;background:linear-gradient(180deg, rgb(36 46 96 / .8), rgb(16 22 46 / .9));box-shadow:0 18px 40px -20px rgb(0 0 0 / .9)">${tag}
      <div class="flex items-center gap-2"><span class="text-[10.5px] font-black tracking-[.14em] text-white/45">${kind.toUpperCase()}</span><button onclick="S.dxCm=null;renderDxSim()" class="ml-auto text-white/50 hover:text-white text-[12px]">Collapse</button></div>
      <div class="mt-1 [&_*]:max-w-full">${det}</div>${dxThread(key)}</div>`; };
  return dxCard(`<div class="flex items-center gap-3 mb-5 rounded-xl px-3 py-2 border border-teal-300/25 bg-teal-300/[.05]">${agentAv(PILLARS.analyst, 24, true)}<span class="text-[13px] text-white/85"><b>Josh</b> is on this board · last change 10:05 · <span class="text-white/55">open any card in place for the details and to comment</span></span></div>
    <div class="grid items-start" style="grid-template-columns:repeat(5,minmax(0,1fr));gap:28px">${cols.map((col, i) => `<div style="min-width:0"><div class="text-[10.5px] font-black tracking-[.16em] text-white/40 mb-4 h-3">${titles[i]}</div><div style="display:grid;gap:26px;min-width:0">${col.map(card).join('')}</div></div>`).join('')}</div>`);
};

/* ---------- 2B · the output, start to end, as a flow ---------- */
function dxOutputFlow() {
  const R = DXD.rounds, Q = DXD.qs, H = DXD.hyp, EV = DXD.events; S.dxBcp = S.dxBcp ?? R.length - 1; const k = S.dxBcp, r = R[k], decided = k >= 2;
  S.dxOf = S.dxOf ?? null;
  const issues = EV.filter(e => e.k === 'issue' && dxRoundOf(e) <= k), pbs = EV.filter(e => e.k === 'pb' && dxRoundOf(e) <= k), found = Q.map((q, i) => [q, i]).filter(([q]) => q.r <= k);
  const box = (key, head, body, more, opts = {}) => { const on = S.dxOf === key;
    return `<div class="relative rounded-2xl border ${on ? 'border-indigo-300/70' : opts.brd || 'border-white/10'} ${on ? '' : 'hover:border-white/25'} p-4" style="min-width:0;background:${opts.bg || 'linear-gradient(180deg, rgb(30 38 80 / .55), rgb(16 22 46 / .72))'}${on ? ';box-shadow:0 18px 40px -20px rgb(0 0 0 / .9)' : ''}">
      <span class="absolute" style="top:-10px;right:-10px">${agentAv(PILLARS.analyst, 20, false)}</span>
      <div onclick="S.dxOf=S.dxOf==='${key}'?null:'${key}';renderDxSim()" class="cursor-pointer">${head}</div>${on ? `<div class="mt-3 pt-3 border-t border-white/10">${more}</div>` : body ? `<div class="mt-2">${body}</div>` : ''}</div>`; };
  const L = t => `<div class="text-[10.5px] font-black tracking-[.16em] text-white/45 mt-3 mb-1.5 first:mt-0">${t}</div>`;
  const assets = [['SOC-Tech', 'Host · compromised', 'rose', 0], ['a.levi', 'User · clicked the link', 'rose', 0], ['svc_backup', 'Service account · exposed', 'amber', 3], ['2 inboxes', 'Received the email', 'slate', 4]].filter(x => x[3] <= k);
  const col1 = box('case', `<div class="text-[10.5px] font-black tracking-[.14em] text-white/45">THE CASE</div><div class="mt-1 text-[15px] font-bold text-white">Phishing → code execution</div><div class="text-[12px] text-white/55">${issues.length} issues · ${pbs.length} playbooks · since 09:03</div>`,
    `<div class="flex flex-wrap gap-1.5">${assets.map(([n, d, c]) => `<span class="px-2 py-0.5 rounded-md text-[11.5px] border ${c === 'rose' ? 'border-rose-400/40 text-rose-200' : c === 'amber' ? 'border-amber-400/40 text-amber-200' : 'border-white/15 text-white/65'}" ${tipAttr(`<div class="text-[12.5px] text-ink">${n}</div><div class="text-[12px] text-ink3">${d}</div>`)}>${n}</span>`).join('')}</div>`,
    `${L('AFFECTED ASSETS')}${assets.map(([n, d, c]) => `<div class="mt-1 flex items-center gap-2 text-[13px]"><span class="w-2 h-2 rounded-full" style="background:${c === 'rose' ? '#fb7185' : c === 'amber' ? '#fbbf24' : '#94a3b8'}"></span><b class="text-white">${n}</b><span class="text-white/55">${d}</span></div>`).join('')}
     ${L('ISSUES')}${issues.map(e => `<div class="mt-1 flex items-center gap-2 text-[12.5px] text-white/80"><span class="w-2 h-2 rounded-full" style="background:${dxSev(e.sev)}"></span><span class="font-mono text-white/45">${e.t}</span>${e.n}</div>`).join('')}
     ${L('PLAYBOOKS')}${pbs.map(e => `<div class="mt-1 text-[12.5px] text-white/80"><span class="font-mono text-white/45 mr-2">${e.t}</span>${e.n.replace(' · ', ' · took ')}</div>`).join('')}`);
  const col2 = H.map((h, i) => box('h' + i, `<div class="flex items-center gap-2"><span class="text-[10.5px] font-black tracking-[.14em]" style="color:${h.col}">${DX_HN[h.id].toUpperCase()}</span><span class="ml-auto text-[13px] font-bold text-white">${r.h[i]}%</span></div><div class="mt-1 text-[13px] text-white/85 leading-snug">${h.q}</div><div class="mt-2">${dxBar(r.h[i], h.col, 5)}</div>`, '',
    `${L('HOW IT MOVED')}<div class="text-[12.5px] text-white/75">${R.slice(0, k + 1).map(x => `${x.t} ${x.h[i]}%`).join(' → ')}</div>${L('SUPPORTED BY')}${found.filter(([q]) => q.eff[i] > 0).map(([q]) => `<div class="mt-1 text-[12.5px] text-white/80">▲ ${q.q}</div>`).join('') || '<div class="text-[12.5px] text-white/45">Nothing</div>'}${L('ARGUED AGAINST BY')}${found.filter(([q]) => q.eff[i] < 0).map(([q]) => `<div class="mt-1 text-[12.5px] text-white/80">▼ ${q.q}</div>`).join('') || '<div class="text-[12.5px] text-white/45">Nothing</div>'}`)).join('');
  const col3 = found.map(([q, i]) => box('f' + i, `<div class="flex items-start gap-2"><span class="flex-1 text-[13px] font-semibold text-white leading-snug">${q.q}</span>${dxAns(q.a)}</div><div class="mt-1.5 text-[12px] text-white/60">${q.ev[0]}</div><div class="mt-2 flex items-center gap-1.5 flex-wrap">${q.eff.map((w, h) => dxEff(w, H[h].id)).join('')}<span class="ml-auto text-[11px] text-white/45">${DX_EVENTS[i].length} events</span></div>`, '',
    `${L('WHAT JOSH FOUND')}${q.ev.map(e => `<div class="mt-1 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${e}</div>`).join('')}${L('THE DATA')}${dxEventsTable(i)}`)).join('') + (Q.length > found.length ? `<div class="rounded-2xl border border-dashed border-white/15 p-3 text-[12.5px] text-white/45">${Q.length - found.length} more question${Q.length - found.length > 1 ? 's' : ''} later in the case</div>` : '');
  const col4 = box('v', decided ? `<div class="text-[10.5px] font-black tracking-[.14em] text-white/45">VERDICT · DETERMINED</div><div class="mt-1 text-[22px] font-black text-rose-400">Malicious</div><div class="text-[12px] text-white/55">High confidence · ${DX_HN.H1} ${r.h[0]}%</div>` : `<div class="text-[10.5px] font-black tracking-[.14em] text-blue-300">VERDICT · IN PROGRESS</div><div class="mt-1 text-[17px] font-bold text-white/80 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>Investigating</div><div class="text-[12px] text-white/55">${DX_HN.H1} leads at ${r.h[0]}%</div>`, '',
    decided ? `${L('WHAT DECIDED IT')}${['The email link served a browser exploit', 'The dropped DLL is known Cobalt Strike malware', 'No simulation explains it'].map(x => `<div class="mt-1 flex gap-2 text-[13px] text-white/80"><span class="text-emerald-300">✓</span>${x}</div>`).join('')}${L('WHAT WOULD CHANGE IT')}<p class="text-[13px] text-white/80">An approved phishing simulation using this exact link and file.</p>` : `<p class="text-[13px] text-white/75">Josh needs more evidence before deciding.</p>`, { brd: decided ? 'border-rose-400/45' : 'border-blue-400/40' });
  const col5 = decided ? DX_ACT.slice(0, k >= 4 ? 4 : 3).map(([t, st, sub], i) => box('o' + i, `<div class="text-[13px] font-semibold text-white leading-snug">${t}</div><div class="text-[12px] mt-1 ${st === 'wait' ? 'text-amber-300' : st === 'done' ? 'text-emerald-300' : 'text-white/50'}">${sub}</div>`, '', `${L('WHY')}<p class="text-[13px] text-white/80">${['Cuts the C2 channel and stops further credential attempts.', 'Stops every host from reaching the attacker.', 'Removes any stolen session for a.levi.', 'Removes the email before anyone clicks it.'][i]}</p>`, { brd: st === 'wait' ? 'border-amber-500/45' : 'border-white/10' })).join('') : `<div class="rounded-2xl border border-dashed border-white/15 p-3 text-[12.5px] text-white/45">Offers come with the verdict</div>`;
  const arrow = `<div class="flex items-start justify-center pt-10 text-white/25"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M4,11 H17 M12,6 L17,11 L12,16" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>`;
  const colW = (t, inner, sub) => `<div style="min-width:0"><div class="text-[10.5px] font-black tracking-[.16em] text-white/40 mb-3">${t}${sub ? ` <span class="font-normal tracking-normal text-white/30">· ${sub}</span>` : ''}</div><div style="display:grid;gap:18px">${inner}</div></div>`;
  return dxCard(`<div class="flex items-center gap-3 mb-5"><span class="text-[11px] font-black tracking-[.16em] text-ink3">CYCLE</span>
      <select onchange="S.dxBcp=+this.value;S.dxOf=null;renderDxSim()" class="rounded-lg bg-sunk border border-line2 text-[13px] text-ink px-3 py-1.5">${R.map((x, i) => `<option value="${i}" ${i === k ? 'selected' : ''}>${x.t} · ${x.n}${i === R.length - 1 ? ' (latest)' : ''}</option>`).join('')}</select>
      ${k < R.length - 1 ? `<button onclick="S.dxBcp=${R.length - 1};renderDxSim()" class="text-[12px] c-ai font-semibold">Back to latest</button>` : ''}<span class="ml-auto text-[12px] text-white/45">Click any card to open it in place</span></div>
    <div class="grid items-start" style="grid-template-columns:minmax(0,1fr) 30px minmax(0,1fr) 30px minmax(0,1.5fr) 30px minmax(0,.9fr) 30px minmax(0,.9fr);gap:6px">
      ${colW('THE CASE', col1)}${arrow}${colW('HYPOTHESES', col2)}${arrow}${colW('FINDINGS', col3, 'question · answer · evidence')}${arrow}${colW('VERDICT', col4)}${arrow}${colW('OFFERS', col5)}
    </div>`);
}
dxP = (orig => function (id) { return id === 'B' ? dxOutputFlow() : orig(id); })(dxP);
(() => { const P = DX[1];
  P.opts[1] = { id: 'B', name: 'Output flow', tag: 'Results, start to end', idea: 'What Josh produced, as a left-to-right flow: the case (affected assets, issues, playbooks) → hypotheses → findings (each one is question + answer + evidence together) → verdict (determined or in progress) → offers. Every card opens in place with the data behind it. A Cycle drop-down shows the output at an earlier moment.', pros: ['Reads like a story, not a list of queries', 'Question, answer and evidence live in one card', 'The case card shows what’s affected'], cons: ['Wide; needs the full-screen mode on small screens'] };
  P.opts[0].idea = 'Symmetric cards in five columns with room to breathe. Open a card where it is: it grows in place with the full details and the comment thread. Josh answers comments; delete yours and his reply goes too.';
})();



/* ---------- interactive chat with Josh ---------- */
const DX_CHAT0 = () => [{ who: 'josh', t: 'I reached a verdict at 09:17 and kept investigating as the case grew. Isolating SOC-Tech needs your approval. Ask me anything about this case.' }];
var dxJoshReply = function (q) {
  const l = q.toLowerCase();
  if (/isolate/.test(l)) { DX_ACT[0][1] = 'done'; DX_ACT[0][2] = 'Approved by you · done'; return 'Done. SOC-Tech is isolated: the C2 channel is cut and a.levi’s session on it is closed. I’ll release it after the rebuild. Want me to block 8.130.54.67 everywhere too?'; }
  if (/block/.test(l)) { DX_ACT[1][1] = 'done'; DX_ACT[1][2] = 'Done'; return 'Blocked 8.130.54.67 at the firewall and on every endpoint. No other host has contacted it in the last 30 days.'; }
  if (/purge|email/.test(l)) { DX_ACT[3][1] = 'done'; DX_ACT[3][2] = 'Done'; return 'Purged “Urgent invoice #4471” from j.adler’s and r.cohen’s inboxes. Neither opened it.'; }
  if (/reset|credential|password/.test(l)) { DX_ACT[2][1] = 'done'; DX_ACT[2][2] = 'Done'; return 'Reset a.levi’s password and signed out all sessions. The LSASS read was blocked, so no credentials were stolen, but this removes any doubt.'; }
  if (/h2|simulation|rule out/.test(l)) return 'H2 was “an approved phishing simulation”. I checked the awareness platform and IT change tickets: nothing scheduled this week, and the DLL is real Cobalt Strike malware, which simulations never use. That dropped H2 to 9%.';
  if (/09:40|changed|what happened/.test(l)) return 'At 09:40 a critical issue joined the case: rundll32 tried to read LSASS memory. I added a question (“Were credentials touched?”), found the read was blocked, and H1 rose from 79% to 86%.';
  if (/why|verdict|malicious/.test(l)) return 'Three things decided it: the email link served a browser exploit, the dropped DLL is known Cobalt Strike malware, and it tried to read credentials. Nothing legitimate explains that chain.';
  if (/spread|other|lateral/.test(l)) return 'Not so far. Two other inboxes got the email but didn’t click, and there are no logins from SOC-Tech to other machines in the last 6 hours. I’m watching both.';
  return 'Good question. In short: this is a real attack that started with the invoice email, it’s contained to SOC-Tech so far, and the only open step is your approval to isolate the host.';
}
function dxAsk(q) {
  q = (q || '').trim(); if (!q) return; S.dxChat = S.dxChat || DX_CHAT0();
  S.dxChat.push({ who: 'you', t: q }); S.dxChat.push({ who: 'josh', t: '…', typing: true }); renderDxSim();
  setTimeout(() => { S.dxChat.pop(); S.dxChat.push({ who: 'josh', t: dxJoshReply(q) }); renderDxSim(); const th = document.getElementById('dx-thread'); if (th) th.scrollTop = th.scrollHeight; }, 700);
}
function dxOffers() {
  S.dxChat = S.dxChat || DX_CHAT0();
  const used = new Set(S.dxChat.filter(m => m.who === 'you').map(m => m.t));
  const pool = [DX_ACT[0][1] !== 'done' && 'Isolate SOC-Tech now', DX_ACT[1][1] !== 'done' && 'Block 8.130.54.67 everywhere', DX_ACT[3][1] !== 'done' && 'Purge the email from 2 inboxes', DX_ACT[2][1] !== 'done' && 'Reset a.levi’s credentials', 'Why did you rule out H2?', 'What changed at 09:40?', 'Did it spread?'].filter(Boolean).filter(x => !used.has(x));
  return pool.slice(0, 4);
}
renderDxSim = (orig => function () {
  S.dxChat = S.dxChat || DX_CHAT0();
  orig();
  const el = $('dx-sim'), box = el && el.firstElementChild; if (!box) return;
  const foot = box.lastElementChild; if (foot) foot.remove();
  box.insertAdjacentHTML('beforeend', `<div class="border-t border-white/10" style="background:rgb(13 18 40 / .92)">
    <div id="dx-thread" class="px-6 pt-4 max-h-[280px] overflow-y-auto space-y-3">${S.dxChat.map(m => m.who === 'josh' ? `<div class="flex gap-2.5 max-w-[760px]"><span class="shrink-0 mt-0.5">${agentAv(PILLARS.analyst, 26, false)}</span><div class="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/[.06] text-[13.5px] text-white/90 leading-relaxed">${m.typing ? '<span class="inline-flex gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></span><span class="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style="animation-delay:.2s"></span><span class="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style="animation-delay:.4s"></span></span>' : esc(m.t)}</div></div>` : `<div class="flex justify-end"><div class="rounded-2xl rounded-tr-sm px-3.5 py-2 bg-indigo-500/30 border border-indigo-300/30 text-[13.5px] text-white max-w-[600px]">${esc(m.t)}</div></div>`).join('')}</div>
    <div class="px-6 py-4"><div class="flex gap-2 flex-wrap mb-2.5">${dxOffers().map(t => `<button onclick="dxAsk(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="px-3 py-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/[.08] text-[12.5px] text-white/85 hover:bg-indigo-500/20">${t}</button>`).join('')}</div>
      <div class="flex items-center gap-2 rounded-2xl p-1.5 pl-2.5 border border-indigo-400/35 bg-white/[.03]">${agentAv(PILLARS.analyst, 26, false)}<input id="dx-in" onkeydown="if(event.key==='Enter'){dxAsk(this.value);}" placeholder="Ask Josh about this case…" class="flex-1 bg-transparent outline-none text-[13.5px] text-white placeholder:text-white/40 py-1.5"/><button onclick="dxAsk(document.getElementById('dx-in').value)" class="w-8 h-8 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 flex items-center justify-center text-white">↑</button></div></div></div>`);
  const th = document.getElementById('dx-thread'); if (th) th.scrollTop = th.scrollHeight;
})(renderDxSim);
/* ---------- full screen for the investigation area ---------- */
renderDxSim = (orig => function () {
  orig();
  // a Full screen button next to the INVESTIGATION PROCESS label
  const lab = [...document.querySelectorAll('#dx-sim span')].find(e => e.textContent.trim() === 'INVESTIGATION PROCESS');
  if (lab && !lab.parentElement.querySelector('.dx-fs')) lab.parentElement.insertAdjacentHTML('beforeend', `<button onclick="S.dxFull=true;renderDxSim()" class="dx-fs ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 text-[12px] text-white/75 hover:text-white">⤢ Full screen</button>`);
  let ov = document.getElementById('dx-full');
  if (!S.dxFull) { if (ov) ov.remove(); return; }
  if (!ov) { ov = document.createElement('div'); ov.id = 'dx-full'; ov.style.cssText = 'position:fixed;inset:0;z-index:400;overflow:auto;background:radial-gradient(900px 500px at 50% 0%, rgb(99 102 241 / .14), transparent 70%), #070b16'; document.body.appendChild(ov); }
  const pick = (S.dxPick && S.dxPick.process) || DX[1].rec, st = ov.scrollTop;
  ov.innerHTML = `<div class="max-w-[1600px] mx-auto px-8 py-6"><div class="flex items-center gap-3 mb-4">${agentAv(PILLARS.analyst, 30, false)}<div><div class="text-[12px] text-white/50">Case #555548 · Josh’s investigation</div><div class="text-[18px] font-bold text-white">${DXD.title}</div></div><button onclick="S.dxFull=false;renderDxSim()" class="ml-auto px-3 py-1.5 rounded-lg border border-white/20 text-[13px] text-white/85 hover:text-white">⤡ Exit full screen</button></div>${dxP(pick)}</div>`;
  ov.scrollTop = st; icons();
})(renderDxSim);