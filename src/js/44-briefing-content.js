/* ======================================================================
   BRIEFING CONTENT
   ====================================================================== */
const NEWS = [
  { src: 'FS-ISAC · 2 days ago', head: 'FIN7 is calling bank help desks posing as IT support', tag: 'Targets your sector', tn: 'rose',
    impact: 'Two of the campaign’s domains were contacted by Bank US hosts last week. Avi prepared blocks for 14 indicators, waiting for your approval.', status: 'Needs you', item: 'Campaign: FIN7' },
  { src: 'CISA KEV · yesterday', head: 'Critical Citrix NetScaler flaw exploited in the wild (CVE-2026-1234)', tag: 'You run this', tn: 'amber',
    impact: '3 of your 5 NetScaler appliances run the vulnerable version and face the internet. Patch tickets are open with the network team.', status: 'In hand', item: 'CVE-2026-1234' },
  { src: 'Vendor research · 3 days ago', head: 'BlackSuit ransomware now goes after VMware ESXi', tag: 'Partly relevant', tn: 'slate',
    impact: 'Your 4 ESXi hosts match the targeting. Tom searched them for the group’s tools and found nothing so far.', status: 'Watching', item: 'BlackSuit' }
];
function itemByTitle(frag) { for (const p of ['engineer', 'hunter', 'intel']) { const it = (S.items[p] || []).find(x => x.title.includes(frag) && x.status === 'pending') || (S.items[p] || []).find(x => x.title.includes(frag)); if (it) return it; } return null; }
function topEvents() {
  const ev = [];
  const hero = byId('555548'); if (hero) ev.push({ sev: 'Critical', p: 'analyst', t: 'Browser exploit on SOC-Tech with live command-and-control traffic', sub: hero.task ? 'Isolation is staged, waiting for you' : 'Contained', kind: 'case', id: '555548' });
  const rec = byId('994821'); if (rec) ev.push({ sev: 'Critical', p: 'analyst', t: 'Reconnaissance against Domain-Ctrl-02 from a finance workstation', sub: verdictOf(rec) === 'Running' ? 'Investigation in progress' : `Verdict: ${verdictOf(rec)}`, kind: 'case', id: '994821' });
  const leg = itemByTitle('dormant admin'); if (leg) ev.push({ sev: 'High', p: 'hunter', t: 'A dormant admin account (svc_legacy) woke up at 03:12', sub: leg.status === 'pending' ? 'Disable & open a case, waiting for you' : leg.done || '', kind: 'item', id: leg.id });
  const okta = itemByTitle('Okta'); if (okta) ev.push({ sev: 'Medium', p: 'engineer', t: 'Okta sign-in logs went silent for 2 hours', sub: 'Fixed and backfilled, no detections missed', kind: 'item', id: okta.id });
  ev.push({ sev: 'Info', p: 'analyst', t: `${S.stats.autoResolved} benign cases closed without you`, sub: 'Every one has a written reason you can audit', kind: 'closed', id: 'auto' });
  return ev;
}
function envObservations() {
  const n = { pending: 0, in_progress: 0, resolved: 0 }; S.cases.forEach(c => n[lifecycle(c)]++);
  const auto = Math.round(S.stats.autoResolved / Math.max(1, n.resolved) * 100);
  const late = S.tasks.filter(t => Date.now() - t.created > SLA_MS).length;
  const risky = S.cases.filter(c => lifecycle(c) === 'pending' && c.severity === 'Critical').slice(0, 3).map(c => c.host);
  return {
    tiles: [['Issue volume', '−18%', 'vs last week', 'c-cx'], ['Handled by agents', auto + '%', 'of resolved cases', 'c-cx'], ['Time to verdict', '2m 03s', 'agent average', 'c-blue'], ['Waiting on you', `${late}/${S.tasks.length}`, 'over 15 min', late ? 'c-amber' : 'c-cx']],
    spark: [1240, 1198, 1175, 1090, 1052, 1018, 1016],
    notes: [
      (SINGLE ? 'Issue volume keeps falling, so Josh spends more of his time on real threats.' : 'Issue volume keeps falling, mostly thanks to Maya’s rule tuning, the team is spending time on real threats.'),
      `Your riskiest assets right now: ${risky.join(', ') || 'none critical'}.`,
      late ? `The slowest step is human approval: ${late} decision${late > 1 ? 's have' : ' has'} waited more than 15 minutes.` : 'Human approvals are within the 15-minute target.',
      'Data health is good. One source (Okta) was down for 2 hours overnight and is back.'
    ]
  };
}
