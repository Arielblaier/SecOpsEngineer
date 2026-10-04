/* ======================================================================
   ACTIONS
   ====================================================================== */
function addWl(c, e) {
  getWorklog(c).push({ id: uid(), time: clock(), tokens: 0, latency: 'Local', by: 'Guy R.', status: 'Signed: Guy R.', ...e });
  c.updated = Date.now();
}
function removeTask(c) { if (!c.task) return; S.tasks = S.tasks.filter(t => t.id !== c.task); c.task = null; }

function agentOfTask(tk) { if (tk.caseId) return 'analyst'; const it = tk.itemId && itemById(tk.itemId); return (it && it.pillar) || tk.pillar || 'analyst'; }
function snapDecision(tk, kind) {
  const c = byId(tk.caseId), it = tk.itemId && itemById(tk.itemId);
  S.decHist = S.decHist || [];
  S.decHist.unshift({ id: uid(), tk, kind, at: Date.now(), idx: S.tasks.indexOf(tk),
    c: c ? { task: c.task, assignee: c.assignee, verdict: c.verdict, summary: c.summary, closedAt: c.closedAt } : null,
    it: it ? { status: it.status, task: it.task, approved: it.approved, declined: it.declined, done: it.done } : null,
    can: tk.type !== 'Investigation Steering' });
  S.decHist = S.decHist.slice(0, 12);
}
function revertDecision(hid) {
  const h = (S.decHist || []).find(x => x.id === hid); if (!h || !h.can) return;
  const c = byId(h.tk.caseId), it = h.tk.itemId && itemById(h.tk.itemId);
  if (c && h.c) { Object.assign(c, h.c); addWl(c, { type: 'system', title: `Decision reverted by Guy R.`, detail: h.kind === 'approved' ? `“${h.tk.title}” was rolled back. Back to waiting for a decision.` : `“${h.tk.title}” is back for a decision.` }); }
  if (it && h.it) Object.assign(it, h.it);
  S.tasks.splice(Math.min(Math.max(0, h.idx), S.tasks.length), 0, h.tk);
  S.cu.reviewed = Math.max(0, (S.cu.reviewed || 0) - 1);
  S.decHist = S.decHist.filter(x => x.id !== hid);
  pushLog(h.tk.caseId || null, 'user', `Reverted by Guy R. · ${h.tk.title}`, h.kind === 'approved' ? 'Action rolled back' : 'Decision reopened');
  toast(`Reverted: ${h.tk.title}`, 'undo-2');
  S.cu.hist = false; S.cu.idx = Math.max(0, S.tasks.indexOf(h.tk));
  refresh(); if (S.cu.open) renderCatchup(true);
}
function recordDecision(tk) { S.done.push({ t: Date.now(), by: 'human' }); S.stats.decided = (S.stats.decided || 0) + 1; S.stats.decisionMs = (S.stats.decisionMs || 0) + (Date.now() - tk.created); }
function authorizeTask(taskId, quiet) {
  const tk = S.tasks.find(t => t.id === taskId); if (!tk) return;
  snapDecision(tk, 'approved');
  recordDecision(tk);
  const c = byId(tk.caseId);
  S.tasks = S.tasks.filter(t => t.id !== taskId);
  if (c) {
    c.task = null; c.assignee = 'Guy R.';
    addWl(c, { type: 'task', title: `Action executed: ${tk.title}`, detail: `Approved by Guy R. Playbook "${tk.playbook}" completed on ${tk.target}.` });
    if (tk.type === 'Investigation Steering') { c.verdict = 'Closed'; c.summary = 'Analyst reviewed the steering request and closed the case.'; }
    c.closedAt = Date.now();
    if (tk.type === 'Investigation Steering') {} else { c.verdict = 'Contained'; c.summary = `Contained: ${tk.title.toLowerCase()} executed on ${c.host}. ` + c.summary; }
    S.justMoved = c.id;
  }
  const it = tk.itemId && itemById(tk.itemId);
  if (it) { it.status = 'resolved'; it.task = null; it.updated = Date.now(); it.approved = true; }
  pushLog(tk.caseId || null, 'ok', `Approved by Guy R. · ${tk.title}`, it ? (it.done || '') : `Playbook ${tk.playbook} executed`);
  if (!quiet) toast(`Approved: ${tk.title}`, 'shield-check');
  refresh();
}

function declineTask(taskId, quiet) {
  const tk = S.tasks.find(t => t.id === taskId); if (!tk) return;
  snapDecision(tk, 'declined');
  recordDecision(tk);
  const c = byId(tk.caseId);
  S.tasks = S.tasks.filter(t => t.id !== taskId);
  if (c) { c.task = null; c.assignee = 'Guy R.'; addWl(c, { type: 'system', title: 'Analyst declined staged action', detail: `"${tk.title}" declined. Case stays open, assigned to Guy R.` }); }
  const it = tk.itemId && itemById(tk.itemId);
  if (it) { it.status = 'resolved'; it.task = null; it.updated = Date.now(); it.declined = true; it.done = 'Declined by Guy R., no change made'; }
  pushLog(tk.caseId || null, 'warn', `Declined by Guy R. · ${tk.title}`, it ? 'No change made' : 'Case stays open for manual handling');
  if (!quiet) toast(`Declined: ${tk.title}`, 'x');
  refresh();
}

function reopenCase(c) {
  c.closedAt = null; c.opened = Date.now();
  removeTask(c);
  c.verdict = 'Running'; c.conf = null; c.plan = null;
  c.summary = 'Re-investigation in progress with expanded telemetry.';
  addWl(c, { type: 'system', title: 'Re-investigation started', detail: 'Analyst reopened the case.' });
  S.cases = S.cases.filter(x => x.id !== c.id); S.cases.unshift(c);
  S.agentId = c.id; ensurePlan(c); S.justMoved = c.id;
  pushLog(c.id, 'user', 'Reopened by Guy R., agent re-investigating', 'Expanded telemetry window: 24h');
}

function steerBenign(c, text) {
  c.closedAt = Date.now();
  removeTask(c);
  if (S.agentId === c.id) S.agentId = null;
  c.plan = null; c.verdict = 'Benign'; c.conf = 99;
  c.summary = `Closed as benign by analyst steering: "${text}". Rule saved to tenant memory.`;
  addWl(c, { type: 'decision', title: 'Verdict: Benign (analyst steered)', detail: `Steering: "${text}".` });
  S.justMoved = c.id;
  S.done.push({ t: Date.now(), by: 'human' });
  pushLog(c.id, 'ok', 'Steered to benign by Guy R.', 'Rule saved to tenant memory, similar activity will auto-resolve');
}

function stageAction(c) {
  const tk = makeTask(c); tk.created = Date.now();
  c.task = tk.id; S.tasks.push(tk);
  addWl(c, { type: 'task', title: `Decision needed: ${tk.title}`, detail: 'Staged at analyst request.' });
  pushLog(c.id, 'alert', `Decision needed: ${tk.title}`, `${c.host} · staged at your request`);
}


$('table-body').addEventListener('mouseenter', () => { S.freeze = true; S.frozenLc = null; S.frozenIds = [...$('table-body').querySelectorAll('.case-row')].map(r => r.dataset.id); S.frozenKey = [S.filter, S.search, JSON.stringify(S.sort), S.showAll].join('|'); });
$('table-body').addEventListener('mouseleave', () => { if (S.userFreeze) return; S.freeze = false; S.frozenIds = null; renderTable(); });
['table-body', 'ct-body'].forEach(id => { const el = $(id); if (!el) return;
  el.addEventListener('pointerdown', () => { S._ptrDown = true; });
  window.addEventListener('pointerup', () => { setTimeout(() => { S._ptrDown = false; }, 0); });
});