/* ======================================================================
   THE AGENT AVATAR: white robot head, navy visor, mint eyes, orbit ribbon
   (per-agent accent on the ribbon and side modules)
   ====================================================================== */
let _rbId = 0;
function robotInner(c1 = '#3ee6a0', c2 = '#36d4ea', glow = true, eye = '#7ff7d6', anim = true, detail = true) {
  const i = 'rb' + (++_rbId);
  const ring = `M92,612 a420,150 0 1,0 840,0 a420,150 0 1,0 -840,0 Z M118,598 a394,124 0 1,0 788,0 a394,124 0 1,0 -788,0 Z`;
  const orbitPath = `M105,606 a407,137 0 1,0 814,0 a407,137 0 1,0 -814,0`;
  // the orbit sways around the head and a light pulse travels along it
  const sway = anim ? `<animateTransform attributeName="transform" type="rotate" values="-15 512 612;-6 512 612;-15 512 612;-24 512 612;-15 512 612" dur="7s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>` : '';
  const pulse = anim ? `<path d="${orbitPath}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="7 93"><animate attributeName="stroke-dashoffset" values="0;-100" dur="3.2s" repeatCount="indefinite"/></path>` : '';
  const ew = detail ? 28 : 40, eg = detail ? 'M372,568 Q422,490 472,568' : 'M366,574 Q422,482 478,574', eg2 = detail ? 'M552,568 Q602,490 652,568' : 'M546,574 Q602,482 658,574';
  return `<defs>
    <radialGradient id="${i}s" cx="38%" cy="26%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#f2f5fa"/><stop offset=".82" stop-color="#d8dfeb"/><stop offset="1" stop-color="#b9c4d6"/></radialGradient>
    <radialGradient id="${i}r" cx="74%" cy="84%" r="55%"><stop offset="0" stop-color="${c1}" stop-opacity=".38"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${i}vr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7e8ba3"/><stop offset=".55" stop-color="#c6cfde"/><stop offset="1" stop-color="#f1f4f9"/></linearGradient>
    <linearGradient id="${i}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25344f"/><stop offset=".45" stop-color="#131d31"/><stop offset="1" stop-color="#0a101d"/></linearGradient>
    <linearGradient id="${i}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${i}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c3cddd"/></linearGradient>
    <linearGradient id="${i}o" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    ${glow ? `<filter id="${i}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>` : ''}
    <clipPath id="${i}b"><rect x="0" y="0" width="1024" height="612"/></clipPath><clipPath id="${i}t"><rect x="0" y="612" width="1024" height="412"/></clipPath>
    <clipPath id="${i}c"><rect x="262" y="372" width="500" height="300" rx="150" ry="140"/></clipPath>
  </defs>
  <g transform="translate(512 512) scale(.84) translate(-512 -530)" shape-rendering="geometricPrecision">
    <g transform="rotate(-15 512 612)">${sway}<g clip-path="url(#${i}b)"><path fill-rule="evenodd" fill="url(#${i}o)" opacity=".5" d="${ring}"/></g></g>
    <circle cx="512" cy="500" r="300" fill="url(#${i}s)"/><circle cx="512" cy="500" r="300" fill="url(#${i}r)"/>
    <circle cx="512" cy="500" r="298" fill="none" stroke="#8592a8" stroke-opacity=".55" stroke-width="${detail ? 4 : 10}"/>
    ${detail ? `<ellipse cx="420" cy="300" rx="120" ry="70" fill="#fff" opacity=".6" transform="rotate(-24 420 300)"/>` : ''}
    <rect x="248" y="358" width="528" height="328" rx="164" ry="154" fill="url(#${i}vr)"/>
    <rect x="262" y="372" width="500" height="300" rx="150" ry="140" fill="url(#${i}v)"/>
    ${detail ? `<g clip-path="url(#${i}c)"><path d="M300,420 C360,384 664,384 724,420 L724,468 C650,430 374,430 300,468 Z" fill="url(#${i}g)" opacity=".6"/></g>` : ''}
    <g fill="none" stroke-linecap="round">
      ${glow ? `<g filter="url(#${i}f)" stroke="${eye}" stroke-width="40" opacity=".65"><path d="${eg}"/><path d="${eg2}"/></g>` : ''}
      <g stroke="${eye}" stroke-width="${ew}"><path d="${eg}"/><path d="${eg2}"/></g>
      ${detail ? `<g stroke="#fff" stroke-opacity=".7" stroke-width="6"><path d="M384,560 Q422,504 460,560"/><path d="M564,560 Q602,504 640,560"/></g>` : ''}
    </g>
    <rect x="186" y="420" width="72" height="210" rx="36" fill="url(#${i}e)"/><rect x="246" y="432" width="12" height="186" rx="6" fill="#16202f"/><ellipse cx="208" cy="525" rx="24" ry="76" fill="#0b1520"/>
    <path d="M214,452 C238,478 238,572 214,598" fill="none" stroke="${c1}" stroke-width="11" stroke-linecap="round"/>
    <rect x="766" y="420" width="72" height="210" rx="36" fill="url(#${i}e)"/><rect x="766" y="432" width="12" height="186" rx="6" fill="#16202f"/><ellipse cx="816" cy="525" rx="24" ry="76" fill="#0b1520"/>
    <path d="M810,452 C786,478 786,572 810,598" fill="none" stroke="${c1}" stroke-width="11" stroke-linecap="round"/>
    <g transform="rotate(-15 512 612)">${sway}<g clip-path="url(#${i}t)"><path fill-rule="evenodd" fill="url(#${i}o)" opacity=".9" d="${ring}"/>${detail ? `<path d="M100,612 a412,143 0 1,0 824,0" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4"/>` : ''}${pulse}</g></g>
  </g>`;
}
const ROBOT_VB = '150 175 724 724';
function robotSVG(px, c1, c2, eye, anim = true) { return `<svg viewBox="${ROBOT_VB}" width="${px}" height="${px}" class="shrink-0 overflow-visible">${robotInner(c1, c2, px >= 40, eye || '#7ff7d6', anim && px >= 24, px >= 30)}</svg>`; }
const ROBOT_COL = { analyst: ['#3b82f6', '#7dd3fc', '#93c5fd'], engineer: ['#8b5cf6', '#c4b5fd', '#c4b5fd'], hunter: ['#f97316', '#fdba74', '#fdba74'], intel: ['#06b6d4', '#67e8f9', '#67e8f9'] };
function pillarKeyOf(P) { return Object.keys(PILLARS).find(k => PILLARS[k] === P) || 'analyst'; }
function agentAv(P, size = 28, live = true) {
  { const k = pillarKeyOf(P), [c1, c2, eye] = ROBOT_COL[k], d = Math.max(6, Math.round(size * .2));
    return `<span class="relative inline-flex shrink-0" style="width:${size}px;height:${size}px">${robotSVG(size, c1, c2, eye)}${live ? `<span class="absolute rounded-full" style="width:${d}px;height:${d}px;right:${Math.round(size * .02)}px;bottom:${Math.round(size * .08)}px;background:#4DFFA6;box-shadow:0 0 0 2px rgb(var(--panel)), 0 0 8px #4DFFA6"></span>` : ''}</span>`; }

  const f = Math.round(size * .42), d = Math.max(6, Math.round(size * .19)), ring = Math.max(1.5, size * .06);
  return `<span class="relative inline-flex shrink-0 rounded-full" style="width:${size}px;height:${size}px;padding:${ring}px;background:conic-gradient(from 210deg, ${P.c2}, ${P.col} 35%, ${P.dark} 60%, ${P.col} 80%, ${P.c2});box-shadow:0 0 0 1px rgb(255 255 255 / .06), 0 ${Math.round(size * .2)}px ${Math.round(size * .55)}px -${Math.round(size * .25)}px ${P.col}">
    <span class="flex-1 rounded-full flex items-center justify-center" style="background:radial-gradient(circle at 32% 24%, rgb(255 255 255 / .55) 0%, rgb(255 255 255 / 0) 34%), radial-gradient(circle at 50% 115%, ${P.col} 0%, ${P.dark} 72%);box-shadow:inset 0 -${Math.round(size * .12)}px ${Math.round(size * .3)}px rgb(0 0 0 / .35), inset 0 1px 2px rgb(255 255 255 / .3)">
      <span style="font:800 ${f}px/1 Lato, system-ui, sans-serif;color:rgb(255 255 255 / .96);letter-spacing:.02em;text-shadow:0 1px 3px rgb(0 0 0 / .35)">${P.name[0]}</span></span>
    ${live ? `<span class="absolute rounded-full" style="width:${d}px;height:${d}px;right:0;bottom:0;background:#4DFFA6;box-shadow:0 0 0 2px rgb(var(--panel)), 0 0 8px #4DFFA6"></span>` : ''}</span>`;
}
const ITEM_T = {
  engineer: [
    { title: 'Tune noisy rule “Suspicious PowerShell download”', impact: 'High', ask: 'Apply rule tuning', done: 'Tuning is live, 412 fewer issues a week',
      steps: ['Measured 30 days of issues: 1,084 raised, 38% were false positives', 'Traced the false positives to signed SCCM maintenance scripts', 'Drafted an exclusion for the SCCM signer and replayed 30 days of history'],
      result: 'An exclusion for signed SCCM scripts cuts 412 issues a week and still catches every real detection from the last 30 days.',
      viz: { kind: 'bars', rows: [['Issues per week', 1084, 672, ''], ['False-positive rate', 38, 4, '%']] }, risk: 'Low, reversible, all true positives still fire' },
    { title: 'Okta log ingestion stopped for 2 hours', impact: 'High', done: 'Ingestion restored and the gap backfilled',
      steps: ['Detected the Okta data source going silent at 02:14', 'Found an expired API token', 'Rotated the token and backfilled the missing events'],
      result: 'Rotated the expired API token and backfilled 2 hours of sign-in events. No detections were missed.' },
    { title: 'Deploy a detection for Kerberos relay (KrbRelayUp)', impact: 'Medium', ask: 'Deploy the new detection rule', done: 'Detection deployed to all domain controllers',
      steps: ['Read the new threat-intel report on KrbRelayUp', 'Wrote a correlation rule for the relay pattern', 'Replayed 14 days of logs, zero false positives'],
      result: 'The new rule catches the relay pattern with no false positives in 14 days of replayed data.',
      viz: { kind: 'list', head: 'Where it will run', items: ['12 domain controllers', 'Rule KRB-RELAY-LOCAL-01 · severity High', 'Detection only, nothing is blocked'] }, risk: 'Low, detection only, no blocking' },
    { title: 'Playbook “Enterprise Quarantine” fails on macOS', impact: 'Medium', inprog: true,
      steps: ['3 quarantine runs failed on macOS hosts this week', 'Root cause: the playbook has no macOS isolation step'], result: 'Adding a macOS isolation step and testing it on a lab Mac.' },
    { title: 'Retire 6 duplicate correlation rules', impact: 'Low', done: '6 duplicate rules retired',
      steps: ['Found 6 rules that fire on identical logic', 'Checked 90 days, every issue is also raised by the newer rule'], result: 'Retired 6 duplicates. Issue volume is down 7% with no coverage lost.' },
    { title: 'EDR agent outdated on 23 servers', impact: 'Medium', ask: 'Schedule the EDR agent upgrade', done: 'Upgrade scheduled for tonight 01:00',
      steps: ['23 servers still run agent 8.1 (current is 8.4)', '8.1 misses two new behavioral protections', 'Checked maintenance windows for all 23'],
      result: 'The upgrade can run tonight in the maintenance window; the servers stay online.',
      viz: { kind: 'list', head: 'What will change', items: ['23 Windows servers · finance & payments', 'Window 01:00–03:00 tonight', 'Rolling upgrade, no reboot'] }, risk: 'Low, rolling upgrade, no reboot' },
    { title: 'Firewall log parser broke after a vendor update', impact: 'Medium', done: 'Parser fixed',
      steps: ['The field “dst_zone” stopped parsing after the PAN-OS update', 'Updated the parser mapping and re-tested'], result: 'Parser mapping updated; the 4 detections that rely on the field work again.' },
    { title: 'Add asset owner to every issue', impact: 'Low', done: 'Owner enrichment is live',
      steps: ['Mapped the CMDB owner field into issue context'], result: 'Every issue now shows the asset owner, so escalations reach the right team first time.' }
  ],
  hunter: [
    { title: 'Hunt: Office apps launching living-off-the-land binaries', impact: 'High', done: 'Found 2 hosts, case opened',
      steps: ['Hypothesis: invoice-themed phishing is using Word to launch mshta.exe', 'Searched 30 days across 4,812 endpoints', 'Found the pattern on 2 finance workstations'],
      result: 'Word launched mshta.exe on FIN-WS-12 and FIN-WS-40 after both users opened the same invoice attachment. Handed to Josh as a case.' },
    { title: 'Hunt: dormant admin accounts waking up', impact: 'High', ask: 'Disable svc_legacy and open a case', done: 'svc_legacy disabled, case opened',
      steps: ['Listed admin accounts unused for 90+ days', 'Checked for any sign-in in the last 7 days', 'One hit: svc_legacy'],
      result: 'svc_legacy, unused since 2023, signed in to 3 servers at 03:12 from an unmanaged laptop.',
      viz: { kind: 'list', head: 'What the account touched', items: ['SRV-PAY-02 · SRV-PAY-07 · SRV-HR-01', 'Source: unmanaged laptop 10.40.2.88', 'No owner or scheduled jobs on record'] }, risk: 'Low, no owner, no running jobs' },
    { title: 'Hunt: DNS beacons to newly registered domains', impact: 'Medium', inprog: true,
      steps: ['Pulled 41 domains registered in the last 7 days that Bank US hosts contacted', 'Checking each for beacon-like timing'], result: 'Analyzing 41 new domains; 29 cleared so far.' },
    { title: 'Hunt: Cobalt Strike named pipes (from new intel)', impact: 'Medium', done: 'No hits',
      steps: ['Took 17 pipe names from the Threat Intel report', 'Searched every endpoint for them'], result: 'Searched 4,812 endpoints for 17 known pipe names, nothing found.' },
    { title: 'Hunt: risky OAuth grants in Microsoft 365', impact: 'Medium', done: '1 risky app revoked',
      steps: ['Listed apps granted mail access in the last 30 days', 'Flagged unverified publishers'], result: 'One unverified app had read access to a finance mailbox; the grant was revoked and the user notified.' },
    { title: 'IOC sweep for Avi: FIN7 indicators (nightly)', impact: 'Medium', done: 'Swept 4,812 endpoints · 1 hit, case opened',
      steps: ['Avi sent 14 new FIN7 indicators at 01:00', 'Searched DNS, proxy and EDR telemetry for all of them', 'One workstation resolved it-support-bankus[.]com last Tuesday'], result: 'One hit on FIN-WS-31; handed to Josh as a case. The other 13 indicators have no matches.' },
    { title: 'Hunt: RDP reachable from the internet', impact: 'Low', done: 'Clean, 2 rules flagged',
      steps: ['Checked firewall rules and inbound flows for port 3389'], result: 'No inbound RDP from outside. Two stale firewall rules were flagged to engineering.' }
  ],
  intel: [
    { title: 'Campaign: FIN7 targeting US banks with fake IT-support calls', impact: 'High', ask: 'Block 14 indicators and add a detection', done: 'Indicators blocked at firewall, email and EDR',
      steps: ['Read 3 vendor reports and a FS-ISAC advisory on the campaign', 'Extracted 14 indicators and checked them against our logs', '2 of the domains were contacted by Bank US hosts last week'],
      result: '14 indicators (6 domains, 5 IPs, 3 file hashes) tie to the campaign. Two domains were already contacted from inside, worth blocking now.',
      viz: { kind: 'list', head: 'What will be blocked', items: ['6 domains · e.g. it-support-bankus[.]com', '5 IPs · e.g. 45.61.137.12', '3 file hashes · remote-access tool installers', 'At: firewall, email gateway and EDR'] }, risk: 'Low, none of the indicators are business services' },
    { title: 'CVE-2026-1234 in Citrix NetScaler, exposure check', impact: 'High', done: '3 exposed appliances, patch tickets opened',
      steps: ['Matched the advisory against the asset inventory', 'Checked versions and internet exposure'], result: '3 of 5 NetScaler appliances run a vulnerable version and face the internet. Patch tickets are open with the network team.' },
    { title: 'Leaked credentials for 2 bankus.com accounts', impact: 'High', ask: 'Force a password reset for 2 accounts', done: 'Passwords reset, sessions revoked',
      steps: ['Found 2 bankus.com email/password pairs on a paste site', 'Confirmed both accounts are active', 'No suspicious sign-ins yet'],
      result: 'Two active employee accounts appear in a fresh credential dump. No misuse yet, resetting now closes the window.',
      viz: { kind: 'list', head: 'Accounts affected', items: ['j.adler@bankus.com · Treasury', 'm.klein@bankus.com · Payments', 'Both: MFA enabled, no risky sign-ins'] }, risk: 'Low, users set a new password at next sign-in' },
    { title: 'Phishing kit copying the Bank US login page', impact: 'Medium', inprog: true,
      steps: ['Spotted a look-alike domain registered yesterday', 'Requested takedown from the registrar'], result: 'Takedown requested; watching for new copies.' },
    { title: 'Nightly sweep request to Tom: BlackSuit ESXi tooling', impact: 'Medium', done: 'Tom swept 9 indicators · no hits',
      steps: ['Extracted 9 indicators from the new BlackSuit report', 'Asked Tom to sweep the 4 ESXi hosts and their admins’ workstations', 'Scheduled the same sweep every night for 30 days'], result: 'Recurring sweep set up with Tom. Tonight’s run found nothing.' },
    { title: 'Daily indicator digest: 212 new, 9 relevant', impact: 'Low', done: '9 indicators added to watchlists',
      steps: ['Scored 212 new indicators against our sector and tech stack'], result: 'Added 9 relevant indicators to watchlists; the other 203 target unrelated sectors.' },
    { title: 'Ransomware group “BlackSuit” moves to VMware ESXi', impact: 'Medium', done: '4 ESXi hosts in scope, hunt requested',
      steps: ['Summarized the new tradecraft', 'Mapped it to our 4 ESXi hosts'], result: 'Our 4 ESXi hosts match the targeting. A hunt for the group’s tooling was handed to Tom.' }
  ]
};
function makeItem(p, ti, status, ageMin) {
  const t = ITEM_T[p][ti], now = Date.now();
  const it = { id: `${{ engineer: 'TCK', hunter: 'HNT', intel: 'ASM' }[p]}-${1000 + (++S.itemSeq)}`, pillar: p, ti, title: t.title, impact: t.impact,
    status, steps: t.steps, result: t.result, viz: t.viz || null, ask: t.ask || null, done: t.done || null, risk: t.risk || 'Low',
    opened: now - ageMin * 60000, updated: now - Math.max(1, ageMin - 20) * 60000, task: null };
  return it;
}
function makeItemTask(it) {
  const P = PILLARS[it.pillar];
  const tk = { id: uid(), itemId: it.id, pillar: it.pillar, title: it.ask, type: P.name, severity: it.impact === 'High' ? 'High' : 'Medium',
    target: it.title, justification: it.result, playbook: P.name, risk: it.risk, created: Date.now() };
  it.task = tk.id; return tk;
}
function seedItems() {
  S.items = { engineer: [], hunter: [], intel: [] };
  if (SINGLE) return;
  ['engineer', 'hunter', 'intel'].forEach(p => {
    const askIdx = ITEM_T[p].findIndex(t => t.ask);
    ITEM_T[p].forEach((t, ti) => {
      if (ti === askIdx) return;
      const st = t.inprog ? 'in_progress' : 'resolved';
      S.items[p].push(makeItem(p, ti, st, 40 + ti * 55 + Math.floor(rng() * 40)));
    });
    // one live decision per team to start with
    if (askIdx >= 0) { const it = makeItem(p, askIdx, 'pending', 18 + Math.floor(rng() * 20)); S.items[p].unshift(it); const tk = makeItemTask(it); tk.created = it.updated; S.tasks.push(tk); }
  });
}
const itemById = id => { for (const p of ['engineer', 'hunter', 'intel']) { const it = (S.items[p] || []).find(x => x.id === id); if (it) return it; } return null; };
function pillarStats(p) {
  if (p === 'analyst') {
    const n = { pending: 0, in_progress: 0, resolved: 0 }; S.cases.forEach(c => n[lifecycle(c)]++);
    return { done: S.stats.autoResolved + S.cases.filter(c => c.verdict === 'Contained').length, prog: n.in_progress, need: S.tasks.filter(t => t.caseId).length };
  }
  const L = S.items[p] || [];
  return { done: PILLARS[p].base + L.filter(x => x.status === 'resolved').length, prog: L.filter(x => x.status === 'in_progress').length, need: L.filter(x => x.task).length };
}
function pillarHighlights(p) {
  if (p === 'analyst') {
    const mal = S.cases.filter(c => verdictOf(c) === 'Malicious').length;
    return [`Closed ${S.stats.autoResolved} benign cases on its own`, `Confirmed ${mal} real threats, ${S.tasks.filter(t => t.caseId).length} wait for your approval`];
  }
  return (S.items[p] || []).filter(x => x.status === 'resolved').sort((a, b) => b.updated - a.updated).slice(0, 2).map(x => x.done || x.result);
}
function itemTick() {
  if (SINGLE) return;
  const ps = ['engineer', 'hunter', 'intel'], p = ps[rint(3)], L = S.items[p];
  const prog = L.filter(x => x.status === 'in_progress');
  if (prog.length && Math.random() < .6) {
    const it = prog[rint(prog.length)];
    if (it.ask && Math.random() < .5) { it.status = 'pending'; const tk = makeItemTask(it); S.tasks.push(tk); pushLog(null, 'alert', `${PILLARS[p].name}: ${it.ask}`, it.title); alertEntity(); }
    else { it.status = 'resolved'; it.result = it.result; S.done.push({ t: Date.now(), by: 'agent' }); pushLog(null, 'ok', `${PILLARS[p].name} finished: ${it.title}`, it.done || it.result); }
    it.updated = Date.now();
  } else {
    const ti = rint(ITEM_T[p].length), it = makeItem(p, ti, 'in_progress', 0);
    it.opened = it.updated = Date.now(); L.unshift(it);
    pushLog(null, 'new', `${PILLARS[p].name} started: ${it.title}`, '');
  }
}
(function () {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ROBOT_VB}">${robotInner('#3ee6a0', '#36d4ea', false, '#7ff7d6', false, false)}</svg>`;
  document.documentElement.style.setProperty('--robot-img', `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`);
})();