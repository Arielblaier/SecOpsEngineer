/* ======================================================================
   CASE / STEP / TASK FACTORIES
   ====================================================================== */
function makeCase(id, t, verdict, opts = {}) {
  const n = opts.n ?? sint(80);
  const host = opts.host || `${t.host}-${String(n).padStart(2,'0')}`;
  const ip = opts.ip || `10.${10 + (n % 30)}.${n % 40}.${(n * 7) % 250 + 2}`;
  const mal = verdict === 'Malicious' || verdict === 'Contained';
  const conf = verdict === 'Running' ? null : mal ? 86 + sint(13) : verdict === 'Inconclusive' ? 52 + sint(16) : 95 + sint(5);
  return {
    id: String(id), threat: t.key, name: opts.name || `${t.name} on ${host}`, domain: t.domain,
    severity: opts.sev || t.sev, assignee: opts.assignee || ASSIGNEES[sint(ASSIGNEES.length)],
    score: opts.score ?? Math.max(12, Math.min(99, t.score + sint(14) - 7 - (verdict === 'Benign' ? 25 : 0))),
    verdict, conf, host, ip, user: USERS[n % USERS.length], objId: `obj-${(n * 9173).toString(16)}`,
    summary: opts.summary || (mal ? t.sm : verdict === 'Inconclusive' ? `Signals conflict: ${t.r1m} But ${t.r2b.charAt(0).toLowerCase() + t.r2b.slice(1)}` : verdict === 'Running' ? 'In progress: the autonomous agent is investigating. The agent will correlate endpoint, identity and network telemetry.' : t.sb),
    asset: `${host} (${ip})`, mitre: t.mitre, dur: opts.dur ?? (verdict === 'Running' ? 0 : 30 + sint(200)),
    updated: opts.updated ?? Date.now() - sint(3600) * 1000,
    worklog: null, plan: null, planTotal: 0, chat: null, task: null, planned: opts.planned || null
  };
}

function buildSteps(c, v) {
  const t = T[c.threat], m = v === 'Malicious', inc = v === 'Inconclusive';
  const fill = s => s.replace('{host}', c.host).replace('{user}', c.user).replace('{ip}', c.ip).replace('{id}', c.objId);
  const conf = m ? 88 + rint(11) : inc ? 55 + rint(15) : 95 + rint(5);
  const s = [
    {type:'system',title:'Investigation triggered',detail:`Agent ingested the case. SmartScore ${c.score} exceeded the tenant threshold (70). Built the initial causality graph for ${c.host}.`,status:'Verified',action:`Building causality graph for ${c.host}…`},
    {type:'xql',title:'Query: primary signal validation',detail:`Validated the triggering signal on ${c.host}.`,query:fill(t.q1),result:(m||inc)?t.r1m:t.r1b,status:'Success',action:`Running XQL signal validation on ${c.host}…`},
    {type:'xql',title:'Query: baseline correlation',detail:'Compared activity against the 30-day tenant baseline.',query:fill(t.q2),result:m?t.r2m:t.r2b,status:m?'Corroborated':'Baseline match',action:`Correlating ${c.host} against the 30-day baseline…`}
  ];
  if (m) s.push({type:'evidence',title:`Evidence: ${t.mitre[0]} confirmed`,detail:t.evm,status:'High fidelity',action:'Extracting high-fidelity evidence artifacts…'});
  s.push({type:'decision',title:`Verdict: ${v} (${confLevel(conf)} confidence)`,detail:m?t.sm:inc?`Conflicting signals: ${t.r1m} However, ${t.r2b.charAt(0).toLowerCase()+t.r2b.slice(1)} Analyst steering needed.`:t.sb,status:'Formulated',verdict:v,conf,action:'Formulating verdict…'});
  if (m) s.push({type:'task',title:`Decision needed: ${t.action}`,detail:`Raised a ${t.atype.toLowerCase()} in the Resolution Center. Automatic execution is on hold until an analyst approves.`,status:'Awaiting review',action:'Staging response action for approval…'});
  else if (inc) s.push({type:'task',title:'Steering requested',detail:'Agent paused. Analyst input is needed to resolve the ambiguous lineage.',status:'Awaiting review',action:'Requesting analyst steering…'});
  else s.push({type:'system',title:'Auto-resolved and closed',detail:'Case closed as benign. Reasoning saved to tenant memory for future matches.',status:'Signed',action:'Writing reasoning to tenant memory…'});
  return s.map(e => ({ ...e, id: uid(), tokens: 80 + rint(420), latency: (150 + rint(950)) + 'ms', by: 'agent' }));
}

function stampTimes(entries, endTs) {
  let ts = endTs - entries.length * 14000;
  entries.forEach(e => { ts += 6000 + rint(16000); e.time = clock(new Date(ts)); });
  return entries;
}

function getWorklog(c) {
  if (c.worklog) return c.worklog;
  if (c.verdict === 'Running') {
    c.worklog = [{id:uid(),type:'system',title:'Investigation opened',detail:`Case received. ${c.host} telemetry is being collected.`,status:'In progress',time:clock(new Date(c.updated)),tokens:20,latency:'40ms',by:'agent'}];
  } else {
    const v = c.verdict === 'Contained' ? 'Malicious' : c.verdict === 'Closed' ? 'Benign' : c.verdict;
    const steps = buildSteps(c, v);
    steps.forEach(s => { if (s.type === 'decision') { s.title = `Verdict: ${v} (${confLevel(c.conf)} confidence)`; } });
    if (c.verdict === 'Contained') steps.push({id:uid(),type:'task',title:`Action executed: ${T[c.threat].action}`,detail:`Authorized by an analyst. Playbook "${T[c.threat].playbook}" completed on ${c.host}.`,status:'Signed',tokens:60,latency:'2.1s',by:'Sarah C.'});
    c.worklog = stampTimes(steps, c.updated);
  }
  return c.worklog;
}

function ensurePlan(c) {
  if (c.plan && c.plan.length) return;
  getWorklog(c);
  const t = T[c.threat];
  const v = c.planned || (Math.random() < t.mal ? 'Malicious' : Math.random() < .3 ? 'Inconclusive' : 'Benign');
  c.planned = null;
  c.plan = buildSteps(c, v).slice(1);
  c.planTotal = c.plan.length;
}

function makeTask(c, custom = {}) {
  const t = T[c.threat], mal = c.verdict === 'Malicious';
  return {
    id: uid(), caseId: c.id,
    title: custom.title || (mal ? t.action : 'Review & steer verdict'),
    type: custom.type || (mal ? t.atype : 'Investigation Steering'),
    severity: c.severity, target: c.asset,
    justification: custom.justification || c.summary,
    playbook: custom.playbook || (mal ? t.playbook : 'Analyst Steering Workflow'),
    risk: custom.risk || (mal ? t.risk : 'None, agent waits for your input'),
    created: Date.now() - rint(1800) * 1000
  };
}

