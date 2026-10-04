/* ======================================================================
   AI INVESTIGATION MODEL, questions → answers → evidence → confidence
   ====================================================================== */
const TECH_NAME = { 'T1558.003': 'Kerberoasting', 'T1021.002': 'SMB lateral movement', 'T1071.004': 'DNS command & control', 'T1528': 'application token theft', 'T1190': 'exploitable public service', 'T1059.001': 'malicious PowerShell', 'T1078': 'valid-account abuse', 'T1619': 'cloud storage discovery', 'T1490': 'recovery inhibition', 'T1189': 'drive-by compromise' };
const EV_ICON = { query: 'search', artifact: 'file-code-2', intel: 'globe', telemetry: 'activity', asset: 'monitor', change: 'clipboard-check' };
function investigation(c) {
  const t = T[c.threat], m = caseModel(c), wl = getWorklog(c).filter(e => e.by === 'agent');
  const xq = wl.filter(e => e.type === 'xql'), evd = wl.find(e => e.type === 'evidence');
  const vd = verdictOf(c), mal = vd === 'Malicious', ben = vd === 'Benign', inc = vd === 'Inconclusive', run = vd === 'Running';
  const H = HERO[c.id];
  const lean = run ? (decisionSignals(c).reduce((a, x) => a + x.dir * x.w, 0) >= 0 ? 'mal' : 'ben') : mal ? 'mal' : ben ? 'ben' : 'mal';
  const M = lean === 'mal';
  const tech = t.mitre[0], techN = TECH_NAME[tech] || tech;
  const qEv = (e, fallback) => e ? { kind: 'query', label: e.title.replace(/^Query: /, 'XQL · '), detail: e.result, query: e.query } : { kind: 'telemetry', label: 'Telemetry', detail: fallback };
  let Q;
  if (H) Q = H.Q.map((x, i) => ({ need: i + 1, ...x, ev: x.ev.map(e => ({ ...e })) }));
  else Q = [
    { q: `Is the ${ISSUE_LABEL[c.threat].toLowerCase()} signal real, not a sensor glitch?`, ans: 'Yes', tone: 'support', w: .8, need: 1,
      text: `Confirmed in raw telemetry from ${c.host}. ${xq[0] ? xq[0].result : t.r1m}`,
      ev: [qEv(xq[0], t.r1m), { kind: 'telemetry', label: 'Raw events', detail: `${m.issues.length * 17} matching events across ${m.issues.length} issues` }] },
    { q: `Is this normal behavior for ${c.host}?`, ans: M ? 'No' : 'Yes', tone: inc ? 'counter' : 'support', w: 1.2, need: 2,
      text: xq[1] ? xq[1].result : (M ? t.r2m : t.r2b),
      ev: [qEv(xq[1], M ? t.r2m : t.r2b), { kind: 'telemetry', label: '30-day baseline', detail: M ? `0 similar events on ${c.host} in the last 30 days` : `Seen ${12 + (parseInt(c.id) % 30)} times in the last 30 days` }] },
    { q: `Is there proof of ${techN} (${tech})?`, ans: M ? 'Yes' : 'No', tone: 'support', w: 1.5, need: 3,
      text: M ? (evd ? evd.detail : t.evm) : 'No technique-specific artifacts were found on the host.',
      ev: [{ kind: 'artifact', label: `${m.hashes[0].file} (${m.hashes[0].sha})`, detail: M ? (m.hashes[0].bad ? 'Flagged as malware by sandbox analysis' : 'Behavior matches the technique') : 'Signed, known-good hash' },
           { kind: 'telemetry', label: `MITRE ${tech}`, detail: M ? `Behavior matches ${techN}` : 'No match' }] },
    { q: 'Does threat intelligence know these indicators?', ans: M ? 'Yes' : 'No', tone: inc ? 'neutral' : 'support', w: .9, need: 3,
      text: M ? `${m.ext} appears on 3 threat-intel feeds as malicious infrastructure.` : `No matches for ${m.ext} or the file hashes across 12 intel feeds.`,
      ev: [{ kind: 'intel', label: m.ext, detail: M ? 'Listed on 3 feeds · first seen 6 days ago' : 'Clean across 12 feeds' }, { kind: 'intel', label: m.hashes[0].sha, detail: M ? 'Known to 2 sandbox vendors' : 'Unknown to intel vendors' }] },
    { q: 'Is there a legitimate business explanation?', ans: ben ? 'Yes' : inc ? 'Unclear' : 'No', tone: inc ? 'unclear' : 'support', w: 1, need: 4,
      text: ben ? t.sb : inc ? `It could be known automation on ${c.host}, but no approval record was found. The agent needs your input.` : 'No approved change ticket, admin baseline or known automation matches this activity.',
      ev: [{ kind: 'change', label: 'Change management', detail: ben ? 'Matching approved change found' : '0 matching change tickets in the last 14 days' }, { kind: 'asset', label: c.host, detail: `Owner: IT operations · role: ${c.domain.toLowerCase()} asset` }] }
  ];
  const doneSteps = run ? (S.agentId === c.id && c.plan ? c.planTotal - c.plan.length : 0) : 99;
  Q.forEach(x => { x.open = run && doneSteps < x.need; if (x.open) { x.ans = 'Pending'; x.tone = 'open'; } });
  // analyst feedback outcomes
  const fb = (S.fb || {})[c.id] || {};
  Q.forEach((x, i) => { const f = fb[i]; if (!f || f.status !== 'done') return;
    if (f.outcome === 'revised') { x.revised = true; x.ans = 'Revised'; x.tone = 'unclear'; x.text = `After your feedback the agent could not confirm this answer. ${f.note ? 'Your note: “' + f.note + '”.' : ''}`; }
    if (f.outcome === 'excluded') { x.excluded = true; x.ans = 'Excluded'; x.tone = 'neutral'; }
  });
  const sign = x => x.tone === 'support' ? 1 : x.tone === 'counter' ? -1 : 0;
  Q.forEach(x => { x.contrib = x.open ? 0 : sign(x) * x.w; });
  const maxW = Math.max(...Q.filter(x => x.tone === 'support').map(x => x.w), 1);
  Q.forEach(x => { x.impact = x.open ? '' : x.excluded ? 'Excluded' : x.tone === 'unclear' ? 'Needs you' : x.tone === 'counter' ? 'Points against' : x.tone === 'neutral' ? 'No effect' : x.w / maxW >= .85 ? 'Strong support' : x.w / maxW >= .6 ? 'Supports' : 'Weak support'; });
  const label = run ? (M ? 'Leaning malicious' : 'Leaning benign') : vd;
  const color = mal ? '#f43f5e' : ben ? '#00c389' : inc ? '#f59e0b' : '#3b82f6';
  const top = [...Q].map((x, i) => ({ ...x, i })).filter(x => !x.open && x.tone === 'support').sort((a, b) => b.w - a.w).slice(0, 3);
  const lv = confLevel(c.conf);
  const expl = H ? H.why : mal ? `${t.sm} Nothing legitimate explains it.` : ben ? t.sb
    : inc ? 'Evidence points both ways: the activity is real and unusual, but it may be legitimate automation that nobody recorded.'
    : `The investigation is still running; the evidence so far is ${M ? 'leaning malicious' : 'leaning benign'}.`;
  const calib = run ? 'Confidence will settle when the open questions are answered.'
    : lv === 'High' ? `High-confidence ${vd.toLowerCase()} verdicts were confirmed by analysts 96% of the time over the last 90 days.`
    : lv === 'Medium' ? `Medium-confidence verdicts were confirmed 81% of the time, the agent asks before acting on these.`
    : 'Low confidence, the agent never acts on these without you.';
  const shift = H ? H.shift : mal ? `Would drop to ${lv === 'High' ? 'Medium' : 'Low'} if an approved change or known automation explained the activity.`
    : ben ? 'Would drop if the same activity appeared on a critical asset.' : inc ? `Would rise if you confirm whether ${c.host} is approved automation.` : '';
  const gaps = H ? H.gaps : (GAPS[c.domain] || GAPS.Endpoint);
  return { Q, target: c.conf || 50, label, color, top, expl, calib, shift, gaps, prior: 50,
    evCount: Q.reduce((a, x) => a + (x.open ? 0 : x.ev.length), 0), answered: Q.filter(x => !x.open).length };
}
function waterfallSVG(inv) {
  const W = 680, H = 190, L = 34, R = 10, n = inv.Q.length + 2, bw = (W - L - R) / n;
  const y = v => 160 - v / 100 * 138;
  let g = '', cum = inv.prior, prevTop = y(cum);
  const bar = (i, from, to, fill, lbl, top, dash, sub) => {
    const x = L + i * bw + bw * .18, w = bw * .64, y1 = y(Math.max(from, to)), y2 = y(Math.min(from, to));
    return `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1.5, y2 - y1).toFixed(1)}" rx="3" fill="${dash ? 'none' : fill}" ${dash ? `stroke="${fill}" stroke-dasharray="3 3"` : ''}/>
      <text x="${(x + w / 2).toFixed(1)}" y="${(y1 - 5).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${dash ? 'rgb(var(--ink4))' : fill}" font-family="JetBrains Mono, monospace">${top}</text>
      <text x="${(x + w / 2).toFixed(1)}" y="178" text-anchor="middle" font-size="10" class="fill-ink3" font-family="Lato, sans-serif">${lbl}</text>`;
  };
  g += [0, 50, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="stroke-line" stroke-dasharray="${v === 50 ? '4 4' : '2 5'}"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end" font-size="9" class="fill-ink4" font-family="JetBrains Mono, monospace">${v}%</text>`).join('');
  g += bar(0, 0, inv.prior, 'rgb(var(--ink4))', 'Start', inv.prior + '%');
  inv.Q.forEach((q, i) => {
    const to = cum + q.contrib;
    const col = q.open ? 'rgb(var(--ink4))' : q.contrib >= 0 ? inv.color : '#94a3b8';
    g += `<line x1="${(L + i * bw + bw * .82).toFixed(1)}" x2="${(L + (i + 1) * bw + bw * .18).toFixed(1)}" y1="${y(cum).toFixed(1)}" y2="${y(cum).toFixed(1)}" class="stroke-line2" stroke-dasharray="2 2"/>`;
    g += `<g class="wf-q cursor-pointer" data-q="${i}">${bar(i + 1, cum, q.open ? cum + 4 : to, col, 'Q' + (i + 1), q.open ? '?' : (q.contrib >= 0 ? '+' : '') + q.contrib, q.open)}</g>`;
    cum = to;
  });
  g += `<line x1="${(L + n * bw - bw * 1.18).toFixed(1)}" x2="${(L + (n - 1) * bw + bw * .18).toFixed(1)}" y1="${y(cum).toFixed(1)}" y2="${y(cum).toFixed(1)}" class="stroke-line2" stroke-dasharray="2 2"/>`;
  g += bar(n - 1, 0, inv.target, inv.color, inv.Q.some(q => q.open) ? 'So far' : 'Confidence', inv.target + '%');
  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" role="img" aria-label="How confidence was built">${g}</svg>`;
}
function investigationHTML(c) {
  const inv = investigation(c);
  const tonePill = { support: ['tn-cx', ''], counter: ['tn-rose', ''], neutral: ['tn-slate', ''], unclear: ['tn-amber', ''], open: ['tn-blue', ''] };
  S.cvQ = S.cvQ || {};
  const opened = S.cvQ[c.id] || {};
  return `
  <section id="cv-inv" class="mt-5 rounded-2xl border border-line overflow-hidden">
    <div class="px-5 py-4 bg-panel2 border-b border-line flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div class="text-[15px] font-semibold text-ink flex items-center gap-2">${ic('microscope', 'w-4 h-4 c-cx')}How the agent investigated</div>
        <div class="text-[12px] text-ink3 mt-0.5">${inv.answered} of ${inv.Q.length} questions answered · ${inv.evCount} pieces of evidence · each answer shapes the verdict${Object.keys((S.fb || {})[c.id] || {}).length ? ` · <span class="c-indigo font-semibold">you reviewed ${Object.keys(S.fb[c.id]).length}</span>` : ''}</div>
      </div>
      <div class="flex items-center gap-3 text-[11px] text-ink3">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:${inv.color}"></span>Supports the verdict</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400"></span>Points the other way</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm border border-dashed border-ink4"></span>Still open</span>
      </div>
    </div>
    <div class="p-4 pt-2 space-y-2">
      ${inv.Q.map((q, i) => {
        const [tn] = tonePill[q.tone];
        return `<details class="group rounded-xl border ${q.open ? 'border-dashed border-line2' : 'border-line'} bg-panel" data-qi="${i}" ${opened[i] ? 'open' : ''} ontoggle="S.cvQ['${c.id}']=S.cvQ['${c.id}']||{};S.cvQ['${c.id}'][${i}]=this.open">
          <summary class="list-none cursor-pointer px-4 py-3 flex items-center gap-3">
            <span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${q.open ? 'border border-dashed border-line2 text-ink4' : q.tone === 'counter' ? 'border border-rose-400/50 bg-rose-500/10 text-rose-300' : q.tone === 'neutral' ? 'border border-line2 text-ink3' : 'border border-cx/50 bg-cx/10 c-cx'}">${ic(q.open ? 'loader-circle' : q.tone === 'counter' ? 'x' : q.tone === 'neutral' ? 'minus' : 'check', 'w-3 h-3')}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-[13.5px] font-medium ${q.open ? 'text-ink3' : 'text-ink'}">${esc(q.q)}</span>
              ${q.open ? '' : `<span class="block text-[12px] text-ink3 truncate group-open:hidden">${esc(q.text)}</span>`}
            </span>
            ${fbBadge(c, i)}
            <span class="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold tn ${tn}">${q.ans}</span>
            <span class="shrink-0 w-[70px] text-right text-[12px] font-semibold" style="color:${q.open ? 'rgb(var(--ink4))' : q.contrib >= 0 ? inv.color : '#94a3b8'}">${q.open ? '—' : q.impact}</span>
            <span class="shrink-0 text-[11px] text-ink4 hidden sm:inline w-20 text-right">${q.open ? 'in progress' : q.ev.length + ' evidence'}</span>
            ${ic('chevron-down', 'w-4 h-4 text-ink4 shrink-0 transition-transform group-open:rotate-180')}
          </summary>
          <div class="px-4 pb-4 pl-14 space-y-3">
            ${q.open ? `<div class="text-[12.5px] text-ink3">The agent hasn’t answered this yet.</div>` : `
            <div class="text-[13px] text-ink2 leading-relaxed"><span class="font-semibold text-ink">Answer:</span> ${esc(q.text)}</div>
            <button style="display:none" onclick="S.cvMain='evidence';S.evSel=S.evSel||{};S.evSel['${c.id}']='${i}-0';openCaseDrawer('${c.id}',true)" class="text-[12px] c-cx font-semibold hover:underline inline-flex items-center gap-1">${ic('file-search', 'w-3.5 h-3.5')}Inspect this evidence in detail</button>
            <div class="grid gap-2 sm:grid-cols-2">
              ${q.ev.map((e, k) => `<div class="rounded-lg border border-line p-2.5 min-w-0">
                <div class="flex items-center gap-1.5 text-[12px] font-semibold text-ink2 min-w-0">${ic(EV_ICON[e.kind] || 'file', 'w-3.5 h-3.5 text-ink3 shrink-0')}<span class="truncate">${esc(e.label)}</span></div>
                <div class="text-[12px] text-ink3 mt-1 leading-snug">${esc(e.detail || '')}</div>
                ${e.query ? `<pre class="mt-1.5 px-2 py-1.5 rounded-md bg-code text-[11px] font-mono text-ink2 whitespace-pre-wrap break-all">${esc(e.query)}</pre>` : ''}
                <button onclick="S.rawOpen=S.rawOpen||{};S.rawOpen['${c.id}-${i}-${k}']=!S.rawOpen['${c.id}-${i}-${k}'];S.cvSig=null;openCaseDrawer('${c.id}',true)" class="mt-2 text-[11.5px] font-semibold c-ai inline-flex items-center gap-1">${ic('braces', 'w-3.5 h-3.5')}${(S.rawOpen || {})[c.id + '-' + i + '-' + k] ? 'Hide raw events' : 'View raw events'}</button>
                ${(S.rawOpen || {})[c.id + '-' + i + '-' + k] ? rawEventsHTML(c, e, i * 10 + k) : ''}
              </div>`).join('')}
            </div>
            ${feedbackHTML(c, i)}`}
          </div>
        </details>`; }).join('')}
    </div>
  </section>`;
}

function goQuestion(id, i) {
  S.cvMain = 'investigation'; S.cvQ = S.cvQ || {}; S.cvQ[id] = S.cvQ[id] || {}; S.cvQ[id][i] = true;
  openCaseDrawer(id, true);
  setTimeout(() => { const d = $('case-drawer').querySelector(`details[data-qi="${i}"]`); if (d && d.scrollIntoView) d.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30);
}