/* ======================================================================
   CASE DETAILS DRAWER + DECISION FOCUS
   ====================================================================== */
function reviewingCaseId() {
  if (!S.cu || !S.cu.open || !S.cu.taskId) return null;
  const t = S.tasks.find(x => x.id === S.cu.taskId); return t ? t.caseId : null;
}
function focusCaseRow(id) {
  S.selectedId = id;
  if (!visibleCases().some(c => c.id === id)) { S.filter = 'all'; S.search = ''; $('search-input').value = ''; renderTabs(); }
  if (!visibleCases().some(c => c.id === id)) S.showAll = true;
  renderTable(); renderLogControls();
  if (!document.querySelector(`.case-row[data-id="${id}"]`)) { S.frozenIds = null; renderTable(); }
  const row = document.querySelector(`.case-row[data-id="${id}"]`);
  if (row && row.scrollIntoView) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

const WL_TN = { xql: ['cyan', 'Query'], evidence: ['purple', 'Evidence'], decision: ['rose', 'Verdict'], task: ['amber', 'Action'], system: ['slate', 'Audit'] };
const ISSUE_LABEL = { kerb: 'Kerberoasting', smb: 'PsExec Lateral Movement', dns: 'DNS Tunneling', oauth: 'Suspicious OAuth Consent', ssl: 'Vulnerable Package', ps: 'Malicious Macro Execution', travel: 'Impossible Travel', s3: 'Bulk Object Access', vss: 'Shadow Copy Deletion' };
const FILE = { kerb: ['rubeus.exe', 'lsass.exe'], smb: ['psexesvc.exe', 'comsvcs.dll'], dns: ['dnscat.exe', 'svchost.exe'], oauth: ['consent-app', 'outlook.exe'], ssl: ['libssl.so.3', 'nginx'], ps: ['taskhostw.exe', 'comsvcs.dll'], travel: ['session-token', 'browser'], s3: ['aws-cli', 'boto3'], vss: ['vssadmin.exe', 'locker.dll'] };
const fmtDate = d => d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' ' + d.toTimeString().slice(0, 5);
const fmtShort = d => d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toTimeString().slice(0, 8);

function caseModel(c) {
  if (c._m) return c._m;
  const r = mulberry32(parseInt(c.id, 10) || 7), ri = n => Math.floor(r() * n);
  const H = HERO[c.id];
  const t = T[c.threat], label = (H && H.label) || ISSUE_LABEL[c.threat] || 'Suspicious Activity';
  const mal = c.verdict === 'Malicious' || c.verdict === 'Contained' || c.verdict === 'Running';
  const rel = S.cases.filter(x => x.threat === c.threat && x.id !== c.id).slice(0, 3);
  const hosts = [c.host, ...rel.map(x => x.host)].filter((v, i, a) => a.indexOf(v) === i);
  const users = [c.user, 'NT AUTHORITY\\SYSTEM'];
  const n = 6 + ri(18);
  const base = 1396383840 - ri(900000);
  const descs = (H && H.descs) || (mal || c.verdict === 'Inconclusive' ? [t.r1m, t.r2m, t.evm] : [t.r1b, t.r2b, t.sb]);
  const issues = Array.from({ length: n }, (_, i) => ({
    id: String(398142 - i * 7 - ri(5)), name: `${label} - ${base - i * 17}`,
    time: new Date(c.updated - i * 47000 - ri(30000)), desc: descs[i % 3],
    host: hosts[i % hosts.length], user: users[i % 2], sev: i % 5 === 4 ? 'Medium' : c.severity
  }));
  const files = (H && H.files) || FILE[c.threat] || ['unknown.bin', 'loader.dll'];
  const hashes = files.map((f, i) => ({ file: f, sha: (parseInt(c.id, 10) * (i + 7919)).toString(16).padEnd(8, 'a').slice(0, 4) + '…' + (ri(65535)).toString(16).padStart(4, '0'), bad: mal && i === 0 }));
  const first = new Date(c.updated - (2 + ri(8)) * 86400000 - ri(86400000));
  const durMs = c.updated - first.getTime();
  const dd = Math.floor(durMs / 86400000), hh = Math.floor(durMs / 3600000) % 24, mm = Math.floor(durMs / 60000) % 60;
  // graph split
  const a = Math.max(2, Math.round(n * .3)), b = Math.max(1, Math.round(n * .15)), rest = Math.max(3, n - a - b);
  const c1 = Math.ceil(rest / 3), c2 = Math.ceil((rest - c1) / 2), c3 = Math.max(1, rest - c1 - c2);
  c._m = { label, hosts, users, issues, hashes, first, dur: `${dd} days, ${hh} hours, ${mm} minutes`, clusters: [a, b, c1, c2, c3], ext: (H && H.ext) || `185.${40 + ri(200)}.${ri(255)}.${ri(255)}` };
  return c._m;
}

function graphSVG(c, m) {
  const W = 980, H = 330, rose = '#e11d48', amber = '#f59e0b';
  const lbl = (x, y, a, b) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="9.5" class="fill-ink2">${esc(a)}</text>${b ? `<text x="${x}" y="${y + 11}" text-anchor="middle" font-size="7.5" class="fill-ink4">${esc(b)}</text>` : ''}`;
  const sevRow = (x, y, hi, md) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="8"><tspan fill="${rose}" font-weight="700">⌃ ${hi}</tspan>${md ? `<tspan class="fill-ink4">  |  </tspan><tspan fill="${amber}" font-weight="700">⌃ ${md}</tspan>` : ''}</text>`;
  const edge = (x1, y1, x2, y2) => `<path d="M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}" fill="none" class="stroke-line2" stroke-width="1"/>`;
  const tri = (x, y, sz, col) => `<polygon points="${x},${y - sz} ${x + sz * 1.05},${y + sz * .78} ${x - sz * 1.05},${y + sz * .78}" fill="${col}" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/><text x="${x}" y="${y + sz * .55}" text-anchor="middle" font-size="${sz * .95}" font-weight="700" fill="#fff">!</text>`;
  const issuesNode = (x, y, cnt, hi, md) => `<g>${tri(x + 7, y, 11, '#fb7185')}${tri(x - 4, y, 12, rose)}</g>${lbl(x, y + 27, `Issues (${cnt})`, 'Click to expand')}${sevRow(x, y + 52, hi, md)}`;
  const chain = (x, y, text, sub) => `<circle cx="${x}" cy="${y}" r="13" fill="#2b3445"/><g stroke="#fff" stroke-width="1.3" fill="none"><circle cx="${x - 4}" cy="${y - 3}" r="2"/><circle cx="${x + 4}" cy="${y - 3}" r="2"/><circle cx="${x}" cy="${y + 4}" r="2"/><path d="M${x - 3},${y - 1.5} L${x - 1},${y + 2.5} M${x + 3},${y - 1.5} L${x + 1},${y + 2.5}"/></g>${lbl(x, y + 27, text, sub)}`;
  const hashNode = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="#2b3445"/><circle cx="${x}" cy="${y}" r="5.5" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>${lbl(x, y + 27, m.hashes[0].sha.replace('…', '') + '…', 'Hash')}`;
  const [a, b, c1, c2, c3] = m.clusters;
  const X = [95, 250, 420, 560, 740, 885], Y = [70, 170, 275];
  const med = k => (k > 3 ? 1 : 0);
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full min-w-[640px] h-auto" font-family="Lato, system-ui, sans-serif">
    ${edge(X[0] + 14, 132, X[1] - 14, 132)}${edge(X[1] + 14, 132, X[2] - 14, Y[0])}${edge(X[1] + 14, 132, X[2] - 14, Y[1])}
    ${edge(X[2] + 14, Y[0], X[3] - 16, Y[0])}${edge(X[2] + 14, Y[1], X[3] - 16, Y[1])}
    ${edge(X[3] + 16, Y[1], X[4] - 14, Y[0])}${edge(X[3] + 16, Y[1], X[4] - 14, Y[1])}${edge(X[3] + 16, Y[1], X[4] - 14, Y[2])}
    ${edge(X[4] + 14, Y[0], X[5] - 16, Y[0])}${edge(X[4] + 14, Y[1], X[5] - 16, Y[1])}${edge(X[4] + 14, Y[2], X[5] - 16, Y[2])}
    <path d="M${X[0]},${132 - 15} l12,5 v8 c0,9 -6,14 -12,17 c-6,-3 -12,-8 -12,-17 v-8 z" fill="#4f6bed"/><circle cx="${X[0]}" cy="${132 + 1}" r="3" fill="#fff"/>
    ${lbl(X[0], 162, `Case #${c.id}`, c.domain + ' Domain')}
    ${tri(X[1], 130, 13, rose)}${lbl(X[1], 162, `${m.label.slice(0, 16)}${m.label.length > 16 ? '…' : ''} - ${m.issues[0].name.split(' - ')[1].slice(0, 3)}…`, T[c.threat].domain)}
    ${chain(X[2], Y[0], 'Causality Chain')}${hashNode(X[2], Y[1])}
    ${issuesNode(X[3], Y[0], a, a - med(a), med(a))}${issuesNode(X[3], Y[1], b, b, 0)}
    ${chain(X[4], Y[0], 'Causality Chain')}${chain(X[4], Y[1], 'Causality Chain')}${chain(X[4], Y[2], 'Causality Chain')}
    ${issuesNode(X[5], Y[0], c1, c1 - med(c1), med(c1))}${issuesNode(X[5], Y[1], c2, c2 - med(c2), med(c2))}${issuesNode(X[5], Y[2], c3, c3 - med(c3), med(c3))}
    ${(() => { const h = S.graphHL && S.graphHL.id === c.id ? S.graphHL : null; if (!h) return '';
      const P = { case: [X[0], 132], primary: [X[1], 130], chain0: [X[2], Y[0]], hash: [X[2], Y[1]] }[h.node]; if (!P) return '';
      const t = h.label.length > 26 ? h.label.slice(0, 25) + '…' : h.label;
      return `<g><circle cx="${P[0]}" cy="${P[1]}" r="22" fill="none" stroke="#00c389" stroke-width="2.5"><animate attributeName="r" values="18;30;18" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite"/></circle>
        <rect x="${P[0] - 80}" y="${P[1] - 58}" width="160" height="22" rx="6" fill="#00c389"/><text x="${P[0]}" y="${P[1] - 43}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0f172a">${esc(t)}</text></g>`; })()}
  </svg>`;
}

function toggleCaseView(id) { S.drawerId === id ? closeCaseDrawer() : openCaseDrawer(id); if (S.cu.open) renderCatchup(false); }

function openCaseDrawer(id, silent) {
  const c = byId(id); if (!c) return;
  { const ae = document.activeElement; if (silent && ae && ae.id === 'ca-in' && ae.value && S.drawerId === id) return; }
  if (!silent && S.drawerId !== id) S.cvMain = 'investigation';
  const d = $('case-drawer');
  const wasOpen = !!S.drawerId;
  S.drawerId = id; S.selectedId = id;
  d.classList.remove('hidden'); d.classList.add('flex');
  const wide = window.innerWidth >= 1100;
  const sig = [c.id, c.verdict, c.task, getWorklog(c).length, S.cu.open, reviewingCaseId(), S.cvMain, S.cvRc, S.cvOpen.users, S.cvOpen.hosts, wide, S.agentId === c.id, JSON.stringify((S.fb || {})[c.id] || {}), (S.evSel || {})[c.id], S.evKind, S.tlKind, c.conf, JSON.stringify(S.graphHL || null), S.cvAfter, JSON.stringify(S.caseAgent || {}).length, S.caseAgent && S.caseAgent.mode, S.caseAgent && S.caseAgent.open, S.caseAgent && S.caseAgent.side, JSON.stringify(S.tl || {}), JSON.stringify(S.flowSel || {}), S.flowFull, JSON.stringify(S.entPanel || null), JSON.stringify(S.plan || {}), JSON.stringify(S.cvBlast || {}), JSON.stringify(S.rcOpen || {}), JSON.stringify(S.cvExp || {}), JSON.stringify(S.actOpen || {}), JSON.stringify(S.rawOpen || {}), JSON.stringify(S.arOpen || {}), S.rcPanel, JSON.stringify((S.secQA || {})[id] || {})].join('|');
  if (silent && S.cvSig === sig) return;
  S.cvSig = sig;
  const m = caseModel(c), t = T[c.threat], v = VERD[c.verdict];
  const tk = S.tasks.find(x => x.id === c.task);
  const wl = getWorklog(c);
  const mainScroll = d.querySelector('#cv-main'); const keepTop = silent && mainScroll ? mainScroll.scrollTop : 0;
  const status = { pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved' }[lifecycle(c)];
  const sevCol = { Critical: 'c-rose', High: 'c-rose', Medium: 'c-amber', Low: 'text-ink3' }[c.severity];
  const keyFinding = [...wl].reverse().find(e => e.by === 'agent' && (e.type === 'evidence' || e.result));
  const bullets = [
    c.summary,
    keyFinding ? (keyFinding.result || keyFinding.detail) : t.r1m,
    `This case involves ${m.hosts.length} host${m.hosts.length > 1 ? 's' : ''} and ${m.users.length} users, affecting ${m.hosts.join(', ')} host${m.hosts.length > 1 ? 's' : ''} and ${m.users.join(', ')} users`,
    `First issue detected on ${fmtDate(m.first)} was ${m.label} and the case duration was ${m.dur}`
  ];
  // Resolution center buckets
  const done = wl.filter(e => /^Action executed|Auto-resolved|analyst steered|Closed by analyst/.test(e.title));
  const running = c.verdict === 'Running';
  const buckets = { Pending: running && S.agentId !== c.id ? 1 : 0, Recommended: tk ? 1 : 0, 'In Progress': running && S.agentId === c.id ? 1 : 0, Done: done.length };
  const rcTab = S.cvRc && S.cvRc.id === c.id ? S.cvRc.tab : (tk ? 'Recommended' : running ? (S.agentId === c.id ? 'In Progress' : 'Pending') : 'Done');
  const chips = m.issues.slice(0, 3).map(i => `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line2 text-[11px] font-mono text-ink2">${ic('triangle-alert', 'w-3 h-3')}${i.id}</span>`).join('') + (m.issues.length > 3 ? `<span class="text-[11px] c-indigo font-medium">+${m.issues.length - 3}</span>` : '');
  let rcBody = '';
  if (rcTab === 'Recommended' && tk) {
    const rev = reviewingCaseId() === c.id;
    rcBody = `<div class="py-4 border-b border-line space-y-3">
      <div class="flex items-center justify-between"><span class="w-7 h-7 rounded-md bg-sunk flex items-center justify-center text-ink2">${ic('workflow', 'w-3.5 h-3.5')}</span><span class="text-[11px] font-semibold tn tn-amber px-1.5 py-0.5 rounded">Awaiting approval</span></div>
      <div class="text-[14px] text-ink font-medium leading-snug">Run "${esc(tk.playbook)}" automation for multiple issues</div>
      <div class="text-[12px] text-ink3">${esc(tk.title)} · ${esc(tk.risk)}</div>
      <div class="flex flex-wrap items-center gap-1.5">${chips}</div>
      ${rev ? `<div class="text-[11px] text-ink3 flex items-center gap-1.5">${ic('arrow-right', 'w-3 h-3')}Approve or decline in the decisions panel</div>`
            : `<div class="space-y-2">${actionReasonHTML(tk, 'rc:' + tk.id)}
                <div class="flex gap-2"><button onclick="caseDecide('${c.id}','approve')" class="flex-1 py-2 rounded-lg bg-indigo-500/25 border border-indigo-400/40 text-[12.5px] font-semibold text-ink hover:bg-indigo-500/35">Approve</button><button onclick="caseDecide('${c.id}','decline')" class="flex-1 py-2 rounded-lg bg-sunk border border-line text-[12.5px] font-semibold text-ink2 hover:text-ink">Decline</button></div></div>`}
    </div>`;
  } else if (rcTab === 'In Progress' && buckets['In Progress']) {
    rcBody = `<div class="py-4 border-b border-line space-y-2"><div class="text-[14px] text-ink font-medium">Autonomous investigation running</div><div class="text-[12px] text-ink3">Step ${c.planTotal - (c.plan ? c.plan.length : 0)} of ${c.planTotal} · ${esc(S.promptText || '')}</div></div>`;
  } else if (rcTab === 'Pending' && buckets.Pending) {
    rcBody = `<div class="py-4 border-b border-line space-y-2"><div class="text-[14px] text-ink font-medium">In progress, waiting for agent capacity</div><div class="text-[12px] text-ink3">The agent picks this up when capacity frees.</div></div>`;
  } else if (rcTab === 'Done' && done.length) {
    rcBody = done.map(e => `<div class="py-3 border-b border-line"><div class="flex items-center gap-1.5 text-[13px] text-ink font-medium">${ic('circle-check', 'w-3.5 h-3.5 c-cx')}${esc(e.title.replace(/^Action executed: /, ''))}</div><div class="text-[11px] text-ink3 mt-0.5">${esc(e.detail)}</div><div class="text-[11px] text-ink4 mt-0.5 font-mono">${e.time || ''}</div></div>`).join('');
  } else rcBody = `<div class="py-10 text-center text-[12px] text-ink4">Nothing here</div>`;
  const rc = `
    <div class="flex items-center gap-2 mb-4"><span class="text-ink">${ic('log-in', 'w-4 h-4')}</span><span class="text-[17px] text-ink">Resolution Center</span></div>
    <div class="grid grid-cols-4 gap-1.5 mb-2">
      ${Object.entries(buckets).map(([k, n]) => `<button onclick="S.cvRc={id:'${c.id}',tab:'${k}'};openCaseDrawer('${c.id}',true)" class="text-left px-2 py-2 rounded-xl border ${rcTab === k ? 'bg-sunk border-line2' : 'border-line hover:bg-hov/40'}">
        <span class="inline-flex w-4 h-4 rounded-full items-center justify-center text-[11px] font-bold ${n && rcTab === k ? 'bg-ink text-panel' : 'text-ink3'}">${n}</span>
        <span class="block text-[11px] ${rcTab === k ? 'text-ink font-semibold' : 'text-ink3'} truncate">${k}</span></button>`).join('')}
    </div>${rcBody}`;

  const issueItem = i => `<div class="relative pl-8 py-3">
    <span class="absolute left-1 top-3.5 ${i.sev === 'Medium' ? 'c-amber' : 'c-rose'}">${ic('chevrons-up', 'w-4 h-4')}</span>
    <div class="text-[13px] font-semibold text-ink">${esc(i.name)}</div>
    <div class="text-[11px] text-ink3">${fmtShort(i.time)}</div>
    <div class="text-[12px] text-ink2 mt-1">${esc(i.desc)}</div>
    <div class="flex flex-wrap gap-1.5 mt-1.5">
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-line2 text-[11px] text-ink2">${ic('monitor', 'w-3 h-3')}${esc(i.host.toLowerCase())}</span>
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-line2 text-[11px] text-ink2">${ic('user', 'w-3 h-3')}${esc(i.user)}</span>
    </div></div>`;
  const assetRow = (key, label, items, icn) => `<div class="border-b border-line">
    <button onclick="S.cvOpen.${key}=!S.cvOpen.${key};openCaseDrawer('${c.id}',true)" class="w-full flex items-center gap-2 py-2.5 text-[13px] text-ink">${ic(S.cvOpen[key] ? 'chevron-down' : 'chevron-right', 'w-3.5 h-3.5 text-ink3')}${label}<span class="text-[11px] px-1.5 rounded bg-sunk text-ink2">${items.length}</span></button>
    ${S.cvOpen[key] ? `<div class="pb-2 pl-6 space-y-1">${items.map(x => `<div class="flex items-center gap-1.5 text-[12px] text-ink2 font-mono">${ic(icn, 'w-3 h-3 text-ink4')}${esc(x)}</div>`).join('')}</div>` : ''}
  </div>`;
  const evidenceTab = `<div class="space-y-4 p-1">${wl.filter(e => e.type === 'xql' || e.type === 'evidence' || e.type === 'decision').map(e => `
    <div class="rounded-xl border border-line p-3">
      <div class="flex items-baseline justify-between gap-2"><span class="text-[13px] font-semibold text-ink">${esc(e.title)}</span><span class="text-[11px] font-mono text-ink4">${e.time || ''}</span></div>
      <div class="text-[12px] text-ink2 mt-1">${esc(e.detail)}</div>
      ${e.query ? `<pre class="mt-2 px-2.5 py-2 rounded-lg bg-code text-[11px] font-mono text-ink2 whitespace-pre-wrap break-all">${esc(e.query)}</pre>` : ''}
      ${e.result ? `<div class="text-[12px] text-ink2 mt-1.5"><span class="text-ink4">Result:</span> ${esc(e.result)}</div>` : ''}
    </div>`).join('') || '<div class="text-[12px] text-ink4 p-6 text-center">No evidence collected yet.</div>'}</div>`;

  const rtk = S.tasks.find(x => x.id === c.task) || null;
  const cvTabNow = S.cvMain || 'investigation';
  d.innerHTML = `
  <div class="h-12 shrink-0 border-b border-line bg-panel flex items-center justify-between px-4 sm:px-6">
    <div class="flex items-center gap-2 min-w-0"><span class="w-6 h-6 rounded-lg cortex-tile flex items-center justify-center shrink-0"><svg viewBox="0 -5 198 245" class="w-3 h-3.5"><path d="M125.421 50.7771C85.8879 50.7771 53.8326 80.9328 53.8326 118.131C53.8326 155.326 85.8832 185.48 125.412 185.484L125.421 50.7771C164.953 50.7771 197 80.933 197 118.131C197 155.326 164.941 185.48 125.412 185.484L125.421 236C56.1635 236 0 183.162 0 118.002C0 52.8273 56.1635 0 125.421 0V50.7771Z" fill="#4DFFA6"/></svg></span><span class="text-[13px] font-semibold text-ink truncate">Case #${c.id}</span><span class="text-[12px] text-ink4 truncate hidden sm:inline">· ${esc(c.host)}</span></div>
    <button onclick="closeCaseDrawer()" class="w-9 h-9 rounded-xl hover:bg-hov text-ink2 hover:text-ink flex items-center justify-center" title="Close (Esc)">${ic('x', 'w-5 h-5')}</button>
  </div>
  <div class="flex-1 min-h-0 flex">
    <div class="relative flex-1 min-w-0 flex">${entPanelHTML(c)}${S.rcPanel ? `<div class="absolute top-0 right-0 bottom-0 z-[9] w-[min(400px,92%)] border-l border-indigo-400/30 overflow-y-auto drawer-in px-4 pt-4 pb-6" style="background:linear-gradient(180deg, rgb(22 29 64 / .98), rgb(12 17 36 / .99));box-shadow:-30px 0 60px -30px rgb(0 0 0 / .7)"><div class="flex items-center justify-end -mb-2"><button onclick="S.rcPanel=false;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="p-1.5 rounded-lg hover:bg-hov text-ink2" title="Close">${ic('x', 'w-4 h-4')}</button></div>${rc}</div>` : ''}<div id="cv-main" class="flex-1 min-w-0 overflow-y-auto px-5 sm:px-6 pt-4 pb-6">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-1.5 text-[12px] text-ink3">
          <button onclick="closeCaseDrawer()" class="p-1 -ml-1 rounded-md hover:bg-hov text-ink3 hover:text-ink" title="Back to cases (Esc)">${ic('arrow-left', 'w-4 h-4')}</button>
          <button onclick="closeCaseDrawer()" class="hover:text-ink">Cases &amp; Issues</button>${ic('chevron-right', 'w-3 h-3')}<button onclick="closeCaseDrawer()" class="hover:text-ink">Cases</button>${ic('chevron-right', 'w-3 h-3')}<span class="text-ink2">Case #${c.id}</span>
        </div>
        <div class="flex items-center gap-5 text-[15px] text-ink">
          <span class="flex items-center gap-2">${statusIcon(lifecycle(c))}${status} ${ic('chevron-down', 'w-4 h-4 text-ink3')}</span>
          <span class="flex items-center gap-2">${sevIcon(c.severity)}${c.severity} ${ic('chevron-down', 'w-4 h-4 text-ink3')}</span>
          <span class="flex items-center gap-2 text-ink2">${ic('user', 'w-4 h-4 text-ink3')}${esc(c.assignee === 'Agent (Autonomous)' ? 'Josh (AI)' : c.assignee)} ${ic('chevron-down', 'w-4 h-4 text-ink3')}</span>
          <span class="w-9 h-9 rounded-lg bg-hov flex items-center justify-center">${ic('user-plus', 'w-4 h-4')}</span>
          <button onclick="S.rcPanel=!S.rcPanel;S.cvSig=null;openCaseDrawer('${c.id}',true)" class="relative w-9 h-9 rounded-lg ${S.rcPanel ? 'bg-indigo-500/30 text-ink' : 'bg-hov text-ink2 hover:text-ink'} flex items-center justify-center" ${tipAttr('<div class="text-[13px] text-ink">Resolution Center</div><div class="text-[12px] text-ink3">Run, pending and done actions</div>')}>${ic('log-in', 'w-4 h-4')}${S.tasks.some(t => t.id === c.task) ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>' : ''}</button>
          ${ic('more-vertical', 'w-4 h-4 text-ink2')}
        </div>
      </div>
      <div id="cv-head" class="flex items-start gap-3 mt-3">
        <span ${tipAttr(scoreTip(c))} class="mt-2 shrink-0 min-w-[30px] text-center px-1.5 py-1 rounded-md border border-cx/60 bg-cx/10 c-cx text-[13px] cursor-help">${c.score}</span>
        <h1 class="text-[26px] sm:text-[32px] text-ink leading-tight">${esc(c.name.replace(' on ' + c.host, ''))}</h1>
      </div>
      ${reviewingCaseId() === c.id ? `<div class="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold tn tn-amber px-2 py-0.5 rounded-md">${ic('eye', 'w-3 h-3')}You are reviewing this case's decision</div>` : ''}
      <div id="cv-verdict" class="mt-5">${caseHeaderBlock(c, !wide)}
        <div class="mt-2 text-[12px] text-ink3">Reached by Josh · ${investigation(c).answered} questions · ${investigation(c).evCount} pieces of evidence · ${fmtDur(c.dur)} of agent time · last updated ${fmtAgo(c.updated)}</div></div>

      <div id="cv-tabs" class="mt-6 sticky top-[-16px] z-[4] bg-panel border-b border-line flex items-center gap-1 pt-2">
        ${[['investigation', 'Agentic investigation', 'sparkles'], ['overview', 'Overview', 'layout-dashboard'], ['evidence', 'Evidence', 'file-search'], ['timeline', 'Timeline', 'history']].map(([k, l, icn]) => `<button onclick="S.cvMain='${k}';openCaseDrawer('${c.id}',true)" class="px-4 py-2.5 -mb-px border-b-2 text-[13px] font-semibold inline-flex items-center gap-1.5 ${cvTabNow === k ? 'border-cx text-ink' : 'border-transparent text-ink3 hover:text-ink'}">${ic(icn, 'w-4 h-4')}${l}${k === 'evidence' ? `<span class="text-[11px] font-mono px-1.5 rounded bg-sunk text-ink3">${evItems(c).out.length}</span>` : ''}</button>`).join('')}
      </div>
      ${cvTabNow === 'investigation' || cvTabNow === 'impact' ? agenticInvHTML(c) : cvTabNow === 'overview' ? `
      ${wide ? '' : `<div class="mt-5 rounded-2xl border border-line p-4">${actionPlanHTML(c, rc)}</div>`}
      <div class="mt-5 rounded-2xl border border-line p-4">
        <div class="flex items-center justify-between gap-2 mb-3">
          <div id="cv-graph" class="inline-flex p-1 rounded-lg bg-sunk border border-line text-[14px]"><span class="px-3 py-1 rounded-md bg-hov text-ink">Grouping graph</span><span class="px-3 py-1 text-ink3">Evidence</span></div>
          <span class="flex items-center gap-3">${ic('maximize-2', 'w-4 h-4 text-ink2')}<span class="px-3 py-1 rounded-full bg-ai c-ai text-[14px]">Case grouping is active</span></span>
        </div>
        <div class="overflow-x-auto">${graphSVG(c, m)}</div>
      </div>
      <div class="mt-5 grid ${wide ? 'grid-cols-2' : 'grid-cols-1'} gap-4">
        <div class="rounded-2xl border border-line p-4 min-w-0">
          <div class="text-[15px] font-semibold text-ink">${m.issues.length} Issues</div>
          <div class="mt-1 max-h-[420px] overflow-y-auto divide-y divide-line">${m.issues.map(issueItem).join('')}</div>
        </div>
        <div class="rounded-2xl border border-line p-4 min-w-0">
          <div class="text-[13px] text-ink3 mb-1">Assets</div>
          ${assetRow('users', 'Users', m.users, 'user')}
          ${assetRow('hosts', 'Hosts', m.hosts, 'monitor')}
          <div class="text-[13px] text-ink3 mt-4 mb-1">Artifacts</div>
          <div class="border-b border-line pb-2">
            <div class="flex items-center gap-2 py-2.5 text-[13px] text-ink">${ic('chevron-down', 'w-3.5 h-3.5 text-ink3')}Hash<span class="text-[11px] px-1.5 rounded bg-sunk text-ink2">${m.hashes.length}</span></div>
            ${m.hashes.map(h => `<div class="pl-6 py-1 text-[12px] text-ink2 flex items-center gap-2 flex-wrap"><span>${esc(h.file)}</span><span class="font-mono text-ink3">(${h.sha})</span>${h.bad ? '<span class="px-1.5 rounded bg-rose-500 text-white text-[11px] font-medium">Malware</span>' : ''}</div>`).join('')}
          </div>
          <div class="py-2.5">
            <div class="flex items-center gap-2 text-[13px] text-ink">${ic('chevron-down', 'w-3.5 h-3.5 text-ink3')}IP address<span class="text-[11px] px-1.5 rounded bg-sunk text-ink2">2</span></div>
            <div class="pl-6 pt-1 space-y-1 text-[12px] font-mono text-ink2"><div>${c.ip}</div><div>${m.ext} ${c.verdict === 'Malicious' ? '<span class="font-sans px-1.5 rounded tn tn-rose text-[11px]">Suspicious</span>' : ''}</div></div>
          </div>
        </div>
      </div>` : cvTabNow === 'evidence' ? evidenceTabHTML(c, wide) : timelineHTML(c)}
    </div>
    </div>
    ${wide ? `<aside class="w-[clamp(280px,22vw,340px)] shrink-0 border-l border-line overflow-y-auto px-4 pt-5 pb-6">${actionPlanHTML(c, rc)}</aside>
` : ''}
  </div>
  ${rtk ? `<div id="cv-decide" class="shrink-0 border-t border-line bg-panel px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
    <span class="w-8 h-8 rounded-lg tn tn-amber flex items-center justify-center shrink-0">${ic('bell-ring', 'w-4 h-4')}</span>
    <div class="min-w-0 flex-1"><div class="text-[11px] c-amber font-semibold">Decision waiting</div><div class="text-[13px] font-semibold text-ink truncate">${esc(rtk.title)}</div></div>
    ${S.cu.open ? `<button onclick="closeCaseDrawer()" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13px] font-bold inline-flex items-center gap-1.5">${ic('arrow-left', 'w-4 h-4')}Back to the decision</button>`
      : `<button onclick="S.cvMain='investigation';S.actOpen=S.actOpen||{};S.actOpen['${c.id}-apv']=true;S.cvSig=null;openCaseDrawer('${c.id}',true);setTimeout(()=>{const el=document.getElementById('ai-actions');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},80)" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13px] font-bold">Review the action</button>`}
  </div>` : ''}`;
  if (!silent || !wasOpen) { d.classList.remove('drawer-in'); void d.offsetWidth; d.classList.add('drawer-in'); }
  const ms = d.querySelector('#cv-main'); if (ms) ms.scrollTop = keepTop;
  renderTable();
  icons();
}
setTimeout(() => { if (typeof openCaseDrawer === 'function' && !openCaseDrawer._wrapped) { const _o = openCaseDrawer; window.openCaseDrawer = function () { const r = _o.apply(this, arguments); renderFlowFull(); return r; }; window.openCaseDrawer._wrapped = true; } }, 0);
function renderFlowFull() {
  const el = $('flow-full'); if (!el) return;
  const c = S.flowFull && byId(S.flowFull);
  if (!c || !S.drawerId) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const html = `<div class="max-w-[1500px] mx-auto"><div class="flex items-center gap-3 mb-5">${agentAv(PILLARS.analyst, 34, false)}<div><div class="text-[12.5px] text-ink3">Case #${c.id} · Josh’s investigation</div><div class="text-[20px] font-bold text-ink">${esc(c.name)}</div></div></div>${investigationFlowHTML(c)}</div>`;
  if (html === el._last) return; el._last = html; el.innerHTML = html;
  icons();
}
function closeCaseDrawer() { S.flowFull = null; setTimeout(renderFlowFull, 0); S.drawerId = null; S.cvSig = null; $('case-drawer').classList.add('hidden'); $('case-drawer').classList.remove('flex'); if (S.cu && S.cu.open) renderCatchup(false); }
window.addEventListener('resize', () => { if (S && S.drawerId) openCaseDrawer(S.drawerId, true); });
$('case-drawer').addEventListener('click', e => {
  const wq = e.target.closest('.wf-q');
  if (wq) { const d = $('case-drawer').querySelector(`details[data-qi="${wq.dataset.q}"]`); if (d) { d.open = true; d.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return; }
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const c = byId(S.drawerId); const en = c && getWorklog(c).find(x => x.id === b.dataset.copy);
  if (!en) return;
  const done = () => toast('XQL query copied', 'copy');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(en.query).then(done, done); else done();
});

