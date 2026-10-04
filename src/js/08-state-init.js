/* ======================================================================
   STATE
   ====================================================================== */
let S;
function initState() {
  rng = mulberry32(7); uidN = 0;
  const cases = heroCases();
  const now = Date.now();
  for (let i = 5; i <= 248; i++) {
    const t = THREATS[i % THREATS.length];
    const r = rng();
    let v;
    if (r < .15) v = 'Running';
    else if (r < .45) v = rng() < Math.max(.35, t.mal) ? 'Malicious' : 'Inconclusive';
    else v = (t.mal > .4 && rng() < .3) ? 'Contained' : 'Benign';
    cases.push(makeCase(600000 + i, t, v, { n: i, updated: now - i * 20000 - sint(15000) }));
  }
  const used = new Set(cases.slice(0, 4).map(c => c.name));
  cases.forEach((c, i) => { if (i >= 4) c.name = uniqueName(c.threat, rng, used); stampOpen(c, now); });
  const tasks = [];
  const hero = (id, custom) => { const c = cases.find(x => x.id === id); const tk = makeTask(c, custom); c.task = tk.id; tasks.push(tk); };
  hero('555548', { title: 'Isolate SOC-Tech from the network', type: 'Containment Action', playbook: 'Palo Alto Enterprise Quarantine v3.4', risk: 'Elevated, pauses the active user session', justification: 'Corroborated invalid heap write (CVE-2023-4863) followed by 24 encrypted TLS handshakes to Cobalt Strike controller 8.130.54.67.' });
  hero('183347', { title: 'Confirm QA runner or quarantine the binary', type: 'Investigation Steering', playbook: 'Code Signing Lineage Verifier', risk: 'Moderate, automated test jobs may be delayed' });
  const smb = cases.find(x => x.threat === 'smb' && x.verdict === 'Malicious' && !x.task);
  const kerb = cases.find(x => x.threat === 'kerb' && x.verdict === 'Malicious' && !x.task);
  [smb, kerb].forEach(c => { if (c) { const tk = makeTask(c); c.task = tk.id; tasks.push(tk); } });
  tasks.forEach((t, i) => t.created = now - [3, 9, 14, 21][i % 4] * 60000 - i * 17000);

  const prev = S || {};
  S = {
    cases, tasks, usedNames: used, showAll: false, itemSeq: 0, items: {}, pillar: prev.pillar || 'analyst', home: { msgs: [], canvas: null, open: {} }, briefItem: null, hourly: Array.from({ length: 12 }, () => ({ mal: 2 + sint(7), inc: 1 + sint(4), ben: 8 + sint(14) })),
    selectedId: '555548', filter: 'pending', search: '', sort: null,
    agentId: '994821', running: prev.running ?? true, speed: prev.speed || 3000, tickN: 0,
    justMoved: null, mpane: prev.mpane || 'cases', view: 'autonomous',
    secOpen: { pending: false, in_progress: false, resolved: false }, briefId: null, briefSig: null, cvTab: 'Grouping graph', cvRc: null, cvOpen: { users: false, hosts: true }, cvSig: null, drawerId: null, log: [], logScope: 'all', nextId: 700100, logCollapsed: prev.logCollapsed ?? true, logToggle: {}, logUnseen: 0, logSeen: 0, logStick: true, promptText: '',
    chat: [], thinking: false, entityAlertUntil: 0,
    cu: { open: false, idx: 0, reviewed: 0, busy: false, replyOpen: false },
    stats: { autoResolved: cases.filter(c => c.verdict === 'Benign').length }
  };
  S.done = [];
  for (let i = 0; i < 34; i++) S.done.push({ t: now - Math.floor(rng() * 3540000) - 20000, by: 'agent' });
  for (let i = 0; i < 3; i++) S.done.push({ t: now - Math.floor(rng() * 3540000) - 20000, by: 'human' });
  seedItems();
  const c994 = cases.find(x => x.id === '994821');
  ensurePlan(c994);
  for (let k = 0; k < 2; k++) { const st = c994.plan.shift(); st.time = clock(new Date(now - (3 - k) * 9000)); c994.worklog.push(st); }
  seedLog();
}

const sel = () => S.cases.find(c => c.id === S.selectedId) || S.cases[0];
const byId = id => S.cases.find(c => c.id === id);
