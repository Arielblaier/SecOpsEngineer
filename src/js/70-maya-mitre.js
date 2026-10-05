/* ======================================================================
   SECOPS · NATIVE SCREEN: MITRE ATT&CK COVERAGE
   The existing dashboard counts the detections mapped to each technique.
   The added layer says whether those detections can work: a technique can
   look covered while the rule behind it has no data. It also marks noisy
   techniques, real gaps, and gaps that existing content can close.
   Built-in detector counts and the threat-intelligence marks are invented.
   ====================================================================== */
const MY_ATTACK = [
  ['Reconnaissance', [['T1595', 'Active Scanning'], ['T1589', 'Gather Victim Identity Information'], ['T1590', 'Gather Victim Network Information'], ['T1592', 'Gather Victim Host Information']]],
  ['Resource Development', [['T1583', 'Acquire Infrastructure'], ['T1584', 'Compromise Infrastructure'], ['T1586', 'Compromise Accounts'], ['T1587', 'Develop Capabilities']]],
  ['Initial Access', [['T1078', 'Valid Accounts'], ['T1133', 'External Remote Services'], ['T1189', 'Drive-by Compromise'], ['T1190', 'Exploit Public-Facing Application'], ['T1566', 'Phishing'], ['T1091', 'Replication Through Removable Media']]],
  ['Execution', [['T1047', 'Windows Management Instrumentation'], ['T1053', 'Scheduled Task/Job'], ['T1059', 'Command and Scripting Interpreter'], ['T1072', 'Software Deployment Tools'], ['T1204', 'User Execution']]],
  ['Persistence', [['T1037', 'Boot or Logon Initialization Scripts'], ['T1098', 'Account Manipulation'], ['T1136', 'Create Account'], ['T1176', 'Browser Extensions'], ['T1543', 'Create or Modify System Process'], ['T1556', 'Modify Authentication Process']]],
  ['Privilege Escalation', [['T1055', 'Process Injection'], ['T1068', 'Exploitation for Privilege Escalation'], ['T1134', 'Access Token Manipulation'], ['T1548', 'Abuse Elevation Control Mechanism'], ['T1611', 'Escape to Host']]],
  ['Defense Evasion', [['T1006', 'Direct Volume Access'], ['T1014', 'Rootkit'], ['T1027', 'Obfuscated Files or Information'], ['T1036', 'Masquerading'], ['T1070', 'Indicator Removal'], ['T1218', 'System Binary Proxy Execution'], ['T1562', 'Impair Defenses']]],
  ['Credential Access', [['T1003', 'OS Credential Dumping'], ['T1040', 'Network Sniffing'], ['T1056', 'Input Capture'], ['T1110', 'Brute Force'], ['T1528', 'Steal Application Access Token'], ['T1552', 'Unsecured Credentials'], ['T1621', 'MFA Request Generation']]],
  ['Discovery', [['T1007', 'System Service Discovery'], ['T1012', 'Query Registry'], ['T1016', 'System Network Configuration Discovery'], ['T1018', 'Remote System Discovery'], ['T1046', 'Network Service Discovery'], ['T1615', 'Group Policy Discovery']]],
  ['Lateral Movement', [['T1021', 'Remote Services'], ['T1080', 'Taint Shared Content'], ['T1550', 'Use Alternate Authentication Material'], ['T1570', 'Lateral Tool Transfer']]],
  ['Collection', [['T1005', 'Data from Local System'], ['T1114', 'Email Collection'], ['T1530', 'Data from Cloud Storage'], ['T1560', 'Archive Collected Data']]],
  ['Command and Control', [['T1071', 'Application Layer Protocol'], ['T1105', 'Ingress Tool Transfer'], ['T1219', 'Remote Access Software'], ['T1571', 'Non-Standard Port'], ['T1572', 'Protocol Tunneling']]],
  ['Exfiltration', [['T1041', 'Exfiltration Over C2 Channel'], ['T1048', 'Exfiltration Over Alternative Protocol'], ['T1537', 'Transfer Data to Cloud Account'], ['T1567', 'Exfiltration Over Web Service']]],
  ['Impact', [['T1485', 'Data Destruction'], ['T1486', 'Data Encrypted for Impact'], ['T1490', 'Inhibit System Recovery'], ['T1496', 'Resource Hijacking']]]
];
/* Techniques with no built-in detector in this tenant, and techniques that threat intelligence marks as used against the sector. */
const MY_NOBUILTIN = { T1621: 'MSN-1006', T1528: null, T1537: null };
const MY_PRIORITY = ['T1021', 'T1078', 'T1218', 'T1621', 'T1528', 'T1537', 'T1110', 'T1566'];
const M_TSTATE = {
  degraded: ['rose', 'Fix', 'Looks covered. A rule behind it cannot fire.'], gap: ['indigo', 'Gap', 'No detection of any kind.'],
  suggest: ['cx', 'Adopt', 'A rule or existing content can add coverage.'], noisy: ['amber', 'Tune', 'Covered, but most issues end with no action.'], ok: ['slate', '', 'Detections are mapped and working.']
};
function mTechs() {
  const W = M.W; let seed = 77; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const open = rv => rv.task && rv.task.status !== 'done' && !mRunning(rv.task);
  return MY_ATTACK.map(([tactic, list]) => ({ tactic, techs: list.map(([id, name]) => {
    const a = rnd(), b = rnd(), none = id in MY_NOBUILTIN, pre = /^(Recon|Resource)/.test(tactic);
    const analytics = none ? 0 : pre ? Math.round(a * a * 3) : 1 + Math.round(a * a * 15), bioc = none || pre ? 0 : Math.round(b * b * 6);
    const corr = W.rules.filter(r => r.status === 'Enabled' && r.tech && r.tech.split(' ')[0].split('.')[0] === id).map(r => ({ r, rv: myRuleReview(W, r) }));
    const blind = corr.filter(x => open(x.rv) && ['Fix', 'Connect'].includes(x.rv.sug)), noisy = corr.filter(x => open(x.rv) && ['Tune', 'Drop'].includes(x.rv.sug));
    const sg = W.suggested.find(r => r.tech.split(' ')[0].split('.')[0] === id), gapT = none && MY_NOBUILTIN[id] ? mTask(MY_NOBUILTIN[id]) : null, total = analytics + bioc + corr.length;
    const state = blind.length ? 'degraded' : !total ? (gapT && gapT.status !== 'done' ? 'suggest' : 'gap') : sg ? 'suggest' : noisy.length ? 'noisy' : 'ok';
    const task = blind.length ? blind[0].rv.task : sg ? mTask(sg.task) : gapT && gapT.status !== 'done' ? gapT : noisy.length ? noisy[0].rv.task : null;
    return { id, name, tactic, analytics, bioc, corr, blind, noisy, total, state, task, pri: MY_PRIORITY.includes(id) };
  }) }));
}
function mMitre() {
  const cols = mTechs(), all = cols.flatMap(c => c.techs), F = M.mitreF || 'all';
  const n = k => all.filter(t => t.state === k).length, flagged = all.filter(t => t.state !== 'ok');
  const max = Math.max(...cols.map(c => c.techs.reduce((a, t) => a + t.total, 0)));
  const bars = cols.map(c => { const s = k => c.techs.reduce((a, t) => a + (k === 'corr' ? t.corr.length : t[k]), 0), H = 150, bad = c.techs.filter(t => t.state === 'degraded' || t.state === 'gap').length;
    return `<div class="flex-1 min-w-[22px] flex flex-col items-center gap-1.5"><div class="text-[10.5px] font-mono ${bad ? 'c-rose font-bold' : 'text-transparent'}">${bad ? '▾' + bad : '·'}</div><div class="w-2.5 flex flex-col-reverse rounded-full overflow-hidden bg-sunk" style="height:${H}px" title="${c.tactic}: ${s('analytics')} analytics, ${s('bioc')} BIOC, ${s('corr')} correlation">
      <div style="height:${s('corr') / max * H}px;background:#34d399"></div><div style="height:${s('analytics') / max * H}px;background:#a855f7"></div><div style="height:${s('bioc') / max * H}px;background:#38bdf8"></div></div>
      <div class="m-vert text-[10.5px] text-ink3 whitespace-nowrap h-[118px] text-right">${c.tactic}</div></div>`; }).join('');
  const fbtn = (k, tone, num, label) => `<button data-mf="${k}" onclick="M.mitreF=M.mitreF==='${k}'?'all':'${k}';mRender()" class="w-full text-left rounded-xl border px-3 py-2 flex items-center gap-3 transition ${F === k ? `tn tn-${tone}` : 'border-line hover:border-line2'}"><span class="text-[20px] font-black font-mono w-8 text-center ${F === k ? '' : 'c-' + (tone === 'cx' ? 'cx' : tone)}">${num}</span><span class="text-[12.5px] leading-snug ${F === k ? '' : 'text-ink2'}">${label}</span></button>`;
  const cell = t => { const st = M_TSTATE[t.state], sel = M.panelObj && M.panelObj.kind === 'tech' && M.panelObj.id === t.id, dim = F !== 'all' && t.state !== F;
    return `<button data-tech="${t.id}" onclick="mOpenObj('tech','${t.id}')" class="m-tech m-tech-${t.state} ${sel ? 'm-tech-sel' : ''} ${dim ? 'opacity-25' : ''}">
      <span class="flex items-center justify-between gap-1 w-full"><span class="inline-flex items-center gap-1.5 text-ink3">${t.bioc + t.analytics ? ic('shield', 'w-3.5 h-3.5') : ''}${t.corr.length ? ic('scan-search', 'w-3.5 h-3.5') : ''}${t.pri ? `<span class="c-amber" title="Used in recent campaigns against technology companies">${ic('flame', 'w-3.5 h-3.5')}</span>` : ''}</span>${st[1] ? `<span class="px-1.5 py-px rounded tn tn-${st[0]} text-[10.5px] font-bold">${st[1]}</span>` : ''}</span>
      <span class="block text-[12.5px] italic text-ink leading-snug mt-1.5">${esc(t.name)}</span>
      <span class="block text-[10.5px] font-mono text-ink4 mt-1">${t.id} · ${t.total} detection${t.total === 1 ? '' : 's'}</span></button>`; };
  const matrix = cols.map(c => { const list = F === 'all' ? c.techs : c.techs.slice().sort((a, b) => (b.state === F) - (a.state === F)), bad = c.techs.filter(t => t.state !== 'ok').length;
    return `<div class="w-[168px] shrink-0"><div class="h-[62px] px-1 text-center border-b border-line"><div class="text-[13px] font-bold c-blue leading-tight">${c.tactic}</div><div class="text-[11px] italic text-ink3 mt-1">${c.techs.length} techniques${bad ? ` · <span class="c-amber not-italic font-semibold">${bad} flagged</span>` : ''}</div></div><div class="mt-2 space-y-1.5">${list.map(cell).join('')}</div></div>`; }).join('');
  $('mv-mitre').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-3 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <div><div class="text-[13px] text-ink3">Dashboards &amp; Reports <span class="mx-1.5">›</span> <span class="text-ink2">Dashboards</span></div><h1 class="text-[28px] text-ink leading-tight mt-1.5">MITRE ATT&amp;CK Framework Coverage</h1></div>
      <div class="text-[13px] text-ink3 mt-2">Data is up to date</div></div>
    <div data-scroll class="flex-1 min-h-0 overflow-auto px-5 sm:px-8 pb-6 space-y-6">
      <div class="flex gap-6 flex-wrap xl:flex-nowrap">
        <div class="flex-1 min-w-[320px]"><div class="text-[16px] font-semibold text-ink mb-3">Number of Detection Rules Per Tactic</div>
          <div class="flex items-end gap-1 overflow-x-auto pb-1">${bars}</div>
          <div class="mt-2 flex items-center justify-center gap-5 text-[12px] text-ink2 flex-wrap">${[['#38bdf8', 'BIOC'], ['#a855f7', 'Analytics'], ['#34d399', 'Correlation Rule']].map(([c, l]) => `<span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background:${c}"></span>${l}</span>`).join('')}<span class="inline-flex items-center gap-1.5 c-rose font-semibold">▾ techniques with a detection problem</span></div></div>
        <div class="w-full xl:w-[330px] shrink-0 rounded-2xl border border-line bg-panel p-4"><div class="text-[14px] font-semibold text-ink inline-flex items-center gap-1.5 mb-1"><span class="c-indigo">${ic('sparkles', 'w-3.5 h-3.5')}</span>AI suggestions on coverage ${mInfo('This dashboard counts the detections mapped to each technique. A mapped detection is not always a working one. The suggestions come from checking the data, the mapping and the results of the rules behind each technique.')}</div>
          <div class="text-[12px] text-ink3 mb-3">${flagged.length} of ${all.length} techniques flagged</div>
          <div class="space-y-1.5">${fbtn('degraded', 'rose', n('degraded'), 'look covered, but a rule behind them cannot fire')}${fbtn('gap', 'indigo', n('gap'), 'have no detection of any kind')}${fbtn('suggest', 'cx', n('suggest'), 'can gain coverage from a suggested rule or existing content')}${fbtn('noisy', 'amber', n('noisy'), 'are covered, but most issues end with no action')}</div></div>
      </div>
      <div><div class="flex items-center justify-between gap-3 flex-wrap mb-3"><div class="text-[16px] font-semibold text-ink">MITRE ATT&amp;CK Framework Coverage</div>
          <div class="flex items-center gap-4 text-[12.5px] text-ink3"><span class="inline-flex items-center gap-1.5"><span class="c-amber">${ic('flame', 'w-3.5 h-3.5')}</span>used against the sector (Unit 42)</span><button onclick="M.mitreF='all';mRender()" class="${F === 'all' ? 'hidden' : ''} px-2.5 py-1 rounded-md border border-line2 text-ink2 hover:text-ink">Show all</button></div></div>
        <div class="flex gap-1.5 overflow-x-auto pb-3">${matrix}</div></div>
    </div>`;
}
/* A technique in the panel: what covers it, whether that works, and what is suggested. */
function mTechCard(id) {
  const t = mTechs().flatMap(c => c.techs).find(x => x.id === id), st = M_TSTATE[t.state];
  const why = { degraded: `${t.blind.length} of the ${t.corr.length} correlation rule${t.corr.length === 1 ? '' : 's'} mapped to this technique cannot fire right now.${t.analytics + t.bioc ? ` ${t.analytics + t.bioc} built-in detector${t.analytics + t.bioc === 1 ? '' : 's'} still cover it, so coverage is reduced, not gone.` : ' Nothing else covers it, so it is not detected at all.'}`,
    gap: `No BIOC, analytic or correlation rule is mapped to this technique.${t.pri ? ' It is used in recent campaigns against technology companies.' : ''} It has not been reviewed yet.`,
    suggest: t.total ? 'Built-in detectors cover part of it. A suggested correlation rule adds coverage on data that is already here.' : 'Nothing detects it today. Existing Marketplace content covers it once the missing data source is connected.',
    noisy: `It is covered, but ${t.noisy.length} rule${t.noisy.length === 1 ? '' : 's'} mapped to it create${t.noisy.length === 1 ? 's' : ''} issues that mostly end with no action.`, ok: 'The mapped detections have data, their fields are filled and they fire at a useful rate.' }[t.state];
  const kv = (k, v) => `<div class="flex items-center justify-between gap-3 text-[13.5px] py-1.5 border-b border-line last:border-0"><span class="text-ink3">${k}</span><span class="font-mono text-ink">${v}</span></div>`;
  return `<div class="space-y-4"><section class="rounded-2xl border border-line2 bg-card p-4 sm:p-5">
      <div class="text-[11px] font-black tracking-[.14em] uppercase" style="color:#5eead4">${esc(t.tactic)} · ${t.id}</div>
      <h2 class="text-[19px] font-bold text-ink leading-snug mt-1.5">${esc(t.name)}</h2>
      <div class="mt-4 flex items-center gap-3 flex-wrap"><span class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">AI suggestion</span>${st[1] ? (t.task ? mSug(t.task.sug, { solid: true }) : `<span class="px-2 py-0.5 rounded-md tn tn-${st[0]} text-[12px] font-semibold">${st[1]}</span>`) : mSug('Keep', { solid: true })}${t.pri ? `<span class="inline-flex items-center gap-1 text-[12.5px] c-amber">${ic('flame', 'w-3.5 h-3.5')}used against the sector</span>` : ''}</div>
      <p class="text-[13.5px] text-ink2 leading-relaxed mt-2.5"><b class="text-ink">${st[2]}</b> ${why}</p>
      ${t.task ? `<div class="mt-3">${mLink(t.task.id)}</div>` : t.state === 'gap' ? `<button onclick="mSend('Review this technique')" class="mt-3 px-3.5 py-2 rounded-xl border border-line2 text-[13px] font-semibold text-ink hover:bg-hov inline-flex items-center gap-1.5">${ic('scan-search', 'w-4 h-4')}Review this technique</button>` : ''}
    </section>
    <section class="rounded-2xl border border-line p-4">${mLabel('Covered methods')}<div class="mt-2">${kv('BIOC', t.bioc) + kv('Analytics', t.analytics) + kv('Correlation rules', t.corr.length)}</div></section>
    ${t.corr.length ? `<section class="rounded-2xl border border-line p-4">${mLabel('Correlation rules mapped to it')}<div class="mt-2 space-y-1">${t.corr.map(x => `<button onclick="mOpenRule(${x.r.id})" class="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-hov text-[13px] text-ink2"><span class="flex-1 min-w-0 truncate">${esc(x.r.name)}</span>${mSugCell(x.rv)}</button>`).join('')}</div></section>` : ''}
    ${mChatHtml('tech:' + t.id)}</div>`;
}
