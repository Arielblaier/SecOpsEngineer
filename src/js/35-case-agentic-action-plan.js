/* ======================================================================
   CASE: the agentic action plan (right column)
   ====================================================================== */
function planModel(c) {
  const B = blastModel(c), m = caseModel(c);
  return [
    { id: 'block', who: 'engineer', t: `Block ${m.ext} at the firewall and EDR`, why: 'Cuts the command channel even before the host is isolated.' },
    { id: 'reset', who: 'analyst', t: `Reset credentials for ${c.user}`, why: 'The user worked on the compromised host, so their tokens may be stolen.' },
    { id: 'hunt', who: 'hunter', t: 'Hunt for the same activity on every endpoint', why: `${Math.max(1, m.hosts.length - 1)} other host${m.hosts.length > 2 ? 's' : ''} saw related activity.` },
    { id: 'ring', who: 'analyst', t: `Check ${B.ring1[0] ? B.ring1[0].n : 'nearby assets'} for signs of access`, why: B.ring1[0] ? `It is one hop away through ${B.ring1[0].via.toLowerCase()}.` : '' },
    { id: 'intel', who: 'intel', t: `Profile ${m.ext} against known groups`, why: 'Linking the infrastructure to a group tells us what they usually do next.' }
  ];
}
function runSuggestion(cid, sid) {
  S.plan = S.plan || {}; const st = S.plan[cid] = S.plan[cid] || {};
  const x = planModel(byId(cid)).find(y => y.id === sid); if (!x || st[sid]) return;
  st[sid] = 'running'; S.cvSig = null; openCaseDrawer(cid, true);
  pushLog(cid, 'step', `${PILLARS[x.who].name} started: ${x.t}`, '');
  setTimeout(() => { st[sid] = 'done'; pushLog(cid, 'ok', `${PILLARS[x.who].name} finished: ${x.t}`, ''); toast(`${PILLARS[x.who].name} finished: ${x.t}`, 'check'); if (S.drawerId === cid) { S.cvSig = null; openCaseDrawer(cid, true); } }, 2600 + rint(1200));
}
function caseDecide(cid, kind) {
  const c = byId(cid), tk = c && S.tasks.find(t => t.id === c.task); if (!tk) return;
  if (kind === 'approve') authorizeTask(tk.id, true); else declineTask(tk.id, true);
  toast(kind === 'approve' ? `Approved: ${tk.title}` : `Declined: ${tk.title}`, kind === 'approve' ? 'check' : 'x');
  S.cvSig = null; openCaseDrawer(cid, true);
}
function goPlanItem(cid, target) {
  S.cvMain = 'investigation'; S.actOpen = S.actOpen || {};
  if (target && target !== 'q') S.actOpen[target] = true;
  S.cvSig = null; openCaseDrawer(cid, true);
  setTimeout(() => { const el = target === 'q' ? document.getElementById('sec-the-questions-i-answered') : document.getElementById('act-' + target); if (!el) return; const mn = $('cv-main'); if (mn) mn.scrollTo({ top: mn.scrollTop + el.getBoundingClientRect().top - mn.getBoundingClientRect().top - Math.max(40, (mn.clientHeight - el.offsetHeight) / 2) }); else el.scrollIntoView({ block: 'center' }); el.style.transition = 'box-shadow .3s'; el.style.boxShadow = '0 0 0 2px #5eead4, 0 0 30px -6px rgb(94 234 212 / .55)'; setTimeout(() => { el.style.boxShadow = ''; }, 1800); }, 160);
}
function actionPlanHTML(c, rc) {
  const inv = investigation(c), tk = S.tasks.find(t => t.id === c.task), st = (S.plan || {})[c.id] || {};
  const sug = planModel(c), openQ = inv.Q.filter(q => q.open);
  const rows = [
    ...(tk ? [[tk.title, 'Waiting for you', 'c-amber', 'analyst', 'wait', c.id + '-apv']] : []),
    ...sug.map(x => [x.t, st[x.id] === 'done' ? 'Done' : st[x.id] === 'running' ? `${PILLARS[x.who].name} working` : 'Suggested', st[x.id] === 'done' ? 'c-cx' : st[x.id] === 'running' ? 'c-blue' : 'text-ink3', x.who, st[x.id] || 'sug', c.id + '-s-' + x.id]),
    ...openQ.map(q => [q.q, 'Open question', 'text-ink3', 'analyst', 'q', 'q'])
  ];
  const done = rows.filter(r => r[4] === 'done').length + (lifecycle(c) === 'resolved' ? 1 : 0);
  return `<div class="flex items-center gap-2.5">${agentAv(PILLARS.analyst, 32, false)}<div class="min-w-0"><div class="text-[16px] font-bold text-ink">Josh’s plan</div><div class="text-[12px] text-ink3">${done} of ${rows.length} next steps done</div></div></div>
    <div class="mt-3 h-1.5 rounded-full bg-sunk overflow-hidden"><div class="h-full rounded-full" style="width:${Math.round(done / Math.max(1, rows.length) * 100)}%;background:linear-gradient(90deg,#5eead4,#818cf8)"></div></div>
    <ol class="mt-5 relative ml-3 border-l border-indigo-400/25 space-y-1">${rows.map(([t, sub, cls, who, k, target]) => `<li onclick="goPlanItem('${c.id}','${target}')" class="pl-5 pr-2 py-1.5 relative rounded-lg cursor-pointer hover:bg-hov/60 group">
      <span class="absolute -left-[8px] top-0.5 w-[15px] h-[15px] rounded-full border-2 ${k === 'done' ? 'bg-cx border-cx' : k === 'running' ? 'bg-blue-500 border-blue-400 animate-pulse' : k === 'wait' ? 'bg-amber-500 border-amber-400' : 'bg-panel border-indigo-400/50'}"></span>
      <div class="text-[13px] text-ink leading-snug ${k === 'done' ? 'line-through decoration-ink3/50 text-ink2' : ''}">${esc(t)}</div>
      <div class="text-[11.5px] mt-0.5 ${cls} inline-flex items-center gap-1.5">${agentAv(PILLARS[who], 14, false)}${sub}</div></li>`).join('')}</ol>
    <p class="mt-5 text-[12px] text-ink3">Click any step to open it in the investigation.</p>`;
}