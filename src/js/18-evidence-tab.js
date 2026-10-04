/* ======================================================================
   EVIDENCE TAB (detailed)
   ====================================================================== */
const EV_KIND_LABEL = { query: 'Queries', telemetry: 'Telemetry', artifact: 'Files', intel: 'Threat intel', asset: 'Assets', change: 'Change mgmt' };
function evItems(c) {
  const inv = investigation(c), out = [];
  inv.Q.forEach((q, qi) => { if (q.open) return; q.ev.forEach((e, k) => out.push({ ...e, id: `${qi}-${k}`, qi, q })); });
  return { inv, out };
}
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function evDetail(c, e) {
  const r = mulberry32(hashStr(c.id + e.id)), ri = n => Math.floor(r() * n), m = caseModel(c), t = T[c.threat];
  const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[ri(16)]).join('');
  const when = new Date(c.updated - ri(3600) * 1000);
  const mal = verdictOf(c) === 'Malicious' || verdictOf(c) === 'Running';
  const files = FILE[c.threat] || ['unknown.bin'];
  const ACT = { kerb: 'KERBEROS_TGS', smb: 'SERVICE_CREATE', dns: 'DNS_QUERY', oauth: 'OAUTH_CONSENT', ssl: 'IMAGE_SCAN', ps: 'PROCESS_START', travel: 'LOGIN', s3: 'API_CALL', vss: 'PROCESS_START' }[c.threat] || 'EVENT';
  const rowsFor = () => ({ cols: ['Time', 'Host', 'Process / actor', 'Action', 'Detail'],
    data: Array.from({ length: 5 }, (_, i) => [fmtShort(new Date(when.getTime() - i * (20 + ri(60)) * 1000)).split(' ').slice(-1)[0], m.hosts[i % m.hosts.length], i % 2 ? m.users[0] : files[i % files.length], i === 2 ? 'NETWORK_CONNECT' : ACT, i === 2 ? `${m.ext}:443` : (e.detail || '').slice(0, 48)]) });
  let source, fields, rows = null;
  if (e.kind === 'query') {
    const ds = ((e.query || '').match(/dataset = (\w+)/) || [, 'xdr_data'])[1];
    source = `XQL query · ${ds}`; fields = [['Dataset', ds], ['Time range', 'Last 24 hours'], ['Rows matched', String(8 + ri(400))], ['Runtime', `${200 + ri(900)} ms`]]; rows = rowsFor();
  } else if (e.kind === 'telemetry') {
    source = 'Endpoint & network telemetry'; fields = [['Sensor', 'Cortex XDR agent 8.4'], ['Events', String(20 + ri(900))], ['Window', '30 days'], ['Hosts covered', String(m.hosts.length)]]; rows = rowsFor();
  } else if (e.kind === 'artifact') {
    const bad = /malware|matches/i.test(e.detail || '') && mal;
    source = 'File reputation & sandbox'; fields = [['File', files[0]], ['SHA256', hex(64)], ['Signer', bad ? 'Not signed' : 'Microsoft Corporation'], ['Size', `${(40 + ri(900))} KB`], ['First seen', fmtShort(m.first)], ['Prevalence', bad ? '1 host in tenant' : `${1000 + ri(4000)} hosts`], ['Sandbox verdict', bad ? 'Malicious, injects into LSASS' : 'Benign']];
  } else if (e.kind === 'intel') {
    source = 'Threat intelligence'; fields = [['Indicator', e.label], ['Type', /^\d+\./.test(e.label) ? 'IPv4 address' : 'File hash'], ['Feeds matched', mal ? '3 of 12' : '0 of 12'], ['First seen', mal ? '6 days ago' : '—'], ['Tags', mal ? 'c2, cobalt-strike, loader' : '—'], ['Confidence', mal ? 'High' : 'n/a']];
  } else if (e.kind === 'change') {
    source = 'Change management (ServiceNow)'; fields = [['Tickets searched', String(120 + ri(300))], ['Matching tickets', /found/i.test(e.detail || '') ? '1 · CHG-4471' : '0'], ['Window', 'Last 14 days'], ['Scope', c.host]];
  } else {
    source = 'Asset inventory'; fields = [['Hostname', e.label], ['IP', e.label === c.host ? c.ip : `10.${ri(40)}.${ri(250)}.${ri(250)}`], ['OS', c.domain === 'Cloud' ? 'Managed cloud service' : 'Windows Server 2022'], ['Owner', 'IT operations'], ['Criticality', ['High', 'Medium', 'Critical'][ri(3)]], ['Last seen', fmtAgo(c.updated)]];
  }
  return { source, when, fields, rows };
}
function evidenceTabHTML(c, wide) {
  const { inv, out } = evItems(c);
  S.evSel = S.evSel || {};
  const kinds = [...new Set(out.map(e => e.kind))];
  const kind = S.evKind && kinds.includes(S.evKind) ? S.evKind : 'all';
  const list = out.filter(e => kind === 'all' || e.kind === kind);
  if (!list.length) return `<div class="py-16 text-center text-[13px] text-ink3">No evidence collected yet, the agent is still working.</div>`;
  const selId = list.some(e => e.id === S.evSel[c.id]) ? S.evSel[c.id] : list[0].id;
  const sel = out.find(e => e.id === selId), det = evDetail(c, sel);
  let lastQ = -1;
  const items = list.map(e => {
    const head = e.qi !== lastQ ? `<div class="px-3 pt-3 pb-1 text-[11px] font-semibold text-ink3 flex items-center gap-1.5"><span class="font-mono">Q${e.qi + 1}</span><span class="truncate">${esc(e.q.q)}</span></div>` : '';
    lastQ = e.qi;
    const on = e.id === selId;
    return head + `<button onclick="S.evSel['${c.id}']='${e.id}';openCaseDrawer('${c.id}',true)" class="w-full text-left px-3 py-2 rounded-lg flex items-start gap-2 ${on ? 'bg-cx/10 ring-1 ring-cx/40' : 'hover:bg-hov/60'}">
      <span class="mt-0.5 w-6 h-6 rounded-md bg-sunk flex items-center justify-center shrink-0 text-ink2">${ic(EV_ICON[e.kind] || 'file', 'w-3.5 h-3.5')}</span>
      <span class="min-w-0"><span class="block text-[12.5px] font-semibold text-ink truncate">${esc(e.label)}</span><span class="block text-[12px] text-ink3 truncate">${esc(e.detail || '')}</span></span></button>`;
  }).join('');
  const q = sel.q;
  return `<div class="mt-5 grid gap-4" style="grid-template-columns:${wide ? 'minmax(260px,340px) minmax(0,1fr)' : '1fr'}">
    <div class="rounded-2xl border border-line overflow-hidden flex flex-col ${wide ? 'max-h-[70vh]' : ''}">
      <div class="p-2.5 border-b border-line flex flex-wrap gap-1">
        ${[['all', `All ${out.length}`], ...kinds.map(k => [k, `${EV_KIND_LABEL[k]} ${out.filter(e => e.kind === k).length}`])].map(([k, l]) => `<button onclick="S.evKind='${k}';openCaseDrawer('${c.id}',true)" class="px-2 py-1 rounded-md text-[11px] font-semibold ${kind === k ? 'bg-ink text-panel' : 'bg-sunk text-ink3 hover:text-ink'}">${l}</button>`).join('')}
      </div>
      <div class="overflow-y-auto p-1.5 space-y-0.5">${items}</div>
    </div>
    <div class="rounded-2xl border border-line p-5 min-w-0 space-y-4">
      <div class="flex items-start gap-3">
        <span class="w-10 h-10 rounded-xl bg-sunk flex items-center justify-center shrink-0 text-ink2">${ic(EV_ICON[sel.kind] || 'file', 'w-5 h-5')}</span>
        <div class="min-w-0 flex-1">
          <div class="text-[16px] font-semibold text-ink break-all">${esc(sel.label)}</div>
          <div class="text-[12px] text-ink3 mt-0.5">${esc(det.source)} · collected ${fmtShort(det.when)}</div>
        </div>
      </div>
      <div class="rounded-xl bg-sunk p-3 text-[12.5px] text-ink2 flex items-start gap-2">
        <span class="font-mono font-bold shrink-0" style="color:${q.contrib >= 0 ? inv.color : '#94a3b8'}">Q${sel.qi + 1} · ${q.impact.toLowerCase()}</span>
        <span>Used to answer <b class="text-ink">${esc(q.q)}</b> → ${esc(q.ans)}</span>
      </div>
      <div>
        <div class="text-[12px] font-semibold text-ink mb-1.5">What it shows</div>
        <p class="text-[13px] text-ink2 leading-relaxed">${esc(sel.detail || '')}</p>
      </div>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        ${det.fields.map(([k, v]) => `<div class="min-w-0 border-b border-line/70 pb-1.5"><dt class="text-[11px] text-ink4">${k}</dt><dd class="text-[12.5px] text-ink font-mono break-all">${esc(v)}</dd></div>`).join('')}
      </dl>
      ${sel.query ? `<div><div class="flex items-center justify-between mb-1.5"><span class="text-[12px] font-semibold text-ink">Query</span><button onclick="copyText(${JSON.stringify(sel.query).replace(/"/g, '&quot;')}, 'Query copied')" class="text-[12px] c-cx font-semibold inline-flex items-center gap-1">${ic('copy', 'w-3 h-3')}Copy</button></div>
        <pre class="px-3 py-2.5 rounded-lg bg-code border border-line text-[12px] font-mono text-ink2 whitespace-pre-wrap break-all">${esc(sel.query)}</pre></div>` : ''}
      ${det.rows ? `<div><div class="text-[12px] font-semibold text-ink mb-1.5">Sample of matched events</div>
        <div class="overflow-x-auto rounded-lg border border-line"><table class="w-full text-[12px]"><thead class="bg-panel2 text-ink3"><tr>${det.rows.cols.map(h => `<th class="text-left font-semibold px-2.5 py-1.5 whitespace-nowrap">${h}</th>`).join('')}</tr></thead>
        <tbody class="divide-y divide-line">${det.rows.data.map(rw => `<tr>${rw.map((v, j) => `<td class="px-2.5 py-1.5 ${j < 4 ? 'font-mono whitespace-nowrap' : ''} text-ink2">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="flex items-center gap-2 flex-wrap">
        <button onclick="showInGraph('${c.id}','${sel.kind}',${JSON.stringify(sel.label).replace(/"/g, '&quot;')})" class="px-3 py-1.5 rounded-lg bg-sunk border border-line hover:border-cx text-[12px] font-semibold text-ink inline-flex items-center gap-1.5">${ic('share-2', 'w-3.5 h-3.5 c-cx')}Show in grouping graph</button>
      </div>
      ${feedbackHTML(c, sel.qi)}
    </div>
  </div>`;
}
function showInGraph(id, kind, label) {
  const node = { artifact: 'hash', intel: 'chain0', query: 'primary', telemetry: 'primary', asset: 'case', change: 'case' }[kind] || 'primary';
  S.graphHL = { id, node, label }; S.cvMain = 'overview'; S.cvSig = null;
  openCaseDrawer(id, true);
  setTimeout(() => { const g = $('cv-graph'); if (g && g.scrollIntoView) g.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 40);
  setTimeout(() => { if (S.graphHL && S.graphHL.id === id) { S.graphHL = null; S.cvSig = null; if (S.drawerId === id && S.cvMain === 'overview') openCaseDrawer(id, true); } }, 6000);
}
