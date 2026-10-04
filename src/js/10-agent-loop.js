/* ======================================================================
   AGENT LOOP
   ====================================================================== */
let loop = null;
function startLoop() { clearInterval(loop); loop = setInterval(() => { if (S.running) tick(); }, S.speed); }

function tick() {
  S.tickN++;
  let c = byId(S.agentId);
  if (!c || !(c.plan && c.plan.length)) {
    if (c && c.verdict === 'Running') ensurePlan(c);
    else {
      c = S.cases.find(x => x.verdict === 'Running');
      if (!c) { ingest(); c = S.cases[0]; }
      S.agentId = c.id; ensurePlan(c);
      pushLog(c.id, 'system', `Picked up ${c.host}`, c.name);
    }
  }
  const step = c.plan.shift();
  step.time = clock();
  c.worklog.push(step);
  c.dur += 8 + rint(20); c.updated = Date.now(); c.assignee = 'Agent (Autonomous)';
  setPrompt(step.action);

  if (step.type === 'decision') {
    c.verdict = step.verdict; c.conf = step.conf; c.summary = step.detail;
    c.score = step.verdict === 'Malicious' ? Math.min(99, c.score + 10) : step.verdict === 'Benign' ? Math.max(12, c.score - 25) : c.score;
    const h = S.hourly[S.hourly.length - 1];
    if (step.verdict === 'Malicious') h.mal++; else if (step.verdict === 'Inconclusive') h.inc++; else h.ben++;
  }
  const l = stepToLine(c, step);
  pushLog(c.id, l.kind, l.text, l.sub);
  if (!c.plan.length) finishCase(c);
  if (S.tickN % 6 === 0) ingest();
  if (S.tickN % 4 === 1) itemTick();
  refresh(c.id);
}

function finishCase(c) {
  if (c.verdict === 'Benign') c.closedAt = Date.now();
  S.cases = S.cases.filter(x => x.id !== c.id);
  if (c.verdict === 'Malicious' || c.verdict === 'Inconclusive') {
    const tk = makeTask(c); tk.created = Date.now();
    c.task = tk.id; S.tasks.push(tk);
    S.cases.unshift(c);
    alertEntity();
  } else {
    S.cases.splice(Math.min(12, S.cases.length), 0, c);
    S.stats.autoResolved++;
  }
  S.justMoved = c.id; S.agentId = null;
  S.done.push({ t: Date.now(), by: 'agent' });
}

function ingest(custom) {
  const t = custom ? T[custom.threat] : THREATS[rint(THREATS.length)];
  const c = makeCase(++S.nextId, t, 'Running', { n: rint(80), updated: Date.now(), ...(custom || {}) });
  if (!(custom && custom.name)) c.name = uniqueName(t.key, Math.random, S.usedNames);
  c.opened = Date.now(); c.closedAt = null;
  S.cases.unshift(c); S.justMoved = c.id;
  pushLog(c.id, 'new', `${c.name} · ${c.host}`, `${c.severity} · SmartScore ${c.score} · in progress`);
  return c;
}

function injectIncident() {
  closeDemoMenu();
  const c = ingest({ threat: 'vss', host: 'FIN-WS-17', ip: '10.12.3.117', sev: 'Critical', score: 97, planned: 'Malicious', name: 'Ransomware precursor: shadow copy deletion on FIN-WS-17' });
  S.agentId = c.id; ensurePlan(c);
  pushLog(c.id, 'warn', 'Critical case jumped the queue', 'Agent preempted current run to investigate FIN-WS-17');
  if (!S.running) toggleSimulation();
  selectCase(c.id);
  toast('Critical case injected, watch agent.log', 'siren');
}
