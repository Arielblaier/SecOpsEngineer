/* ======================================================================
   THREAT HUNTING · ONE HUNT
   Three tabs, from the answer to the proof:
     Summary  executive summary, verdict, hypothesis, cases, detection
     Report   the long text. One per hunt. Never edited after it is written
     Hunt     what the agent asked, with every query and what came back
   ====================================================================== */
const hH2 = (t, id = '') => `<h2 ${id ? `id="${id}"` : ''} class="h-h2">${t}</h2>`;
const H_RESULT = { supported: ['check', 'c-cx', 'supported'], not: ['x', 'text-ink3', 'not supported'], partial: ['circle-dot', 'c-amber', 'supported in part'] };

/* The path of this hunt through the product: the same five boxes on every hunt. */
function hLineage(h) {
  const run = h.status === 'running', threat = !run && h.verdict === 'threat', is = h.issue && h.issue.opened ? h.issue : null;
  const step = (n, label, value, state, oc = '') => `<${oc ? 'button onclick="' + oc + '"' : 'div'} class="h-step ${state} text-left"><span class="block text-[10.5px] font-black tracking-[.14em] uppercase opacity-70">${n} · ${label}</span><span class="block text-[13px] font-semibold mt-0.5 truncate">${value}</span></${oc ? 'button' : 'div'}>`;
  const arrow = `<span class="shrink-0 self-center text-ink4">${ic('arrow-right', 'w-4 h-4')}</span>`;
  return `<div class="flex items-stretch gap-2 overflow-x-auto pb-1">
    ${step('02', 'Hunt', run ? `Running · ${HY_STAGES[h.stage]}` : `${h.questions.length} queries · ${hMins(h)}m`, run ? 'h-step-live' : 'h-step-on', "hTab('hunt')")}${arrow}
    ${step('03', 'Report', run ? 'Written when the hunt ends' : `Immutable · ${hyDate(h.ended)}`, run ? 'h-step-off' : 'h-step-on', run ? '' : "hTab('report')")}${arrow}
    ${run ? step('04', 'Issue', 'Only on Threat found', 'h-step-off') + arrow + step('05', 'Case', 'Existing grouping engine', 'h-step-off')
      : is ? step('04', 'Issue · Threat Hunting', `${is.id} · ${is.state}`, 'h-step-bad', `hOpenIssue('${h.id}')`) + arrow + step('05', 'Case', `${is.case.id} · ${is.case.mode === 'new' ? 'new' : 'joined'}`, 'h-step-on', `hOpenIssue('${h.id}')`)
      : threat ? step('04', 'Issue', 'Waiting for an analyst', 'h-step-wait', `hIssueNow('${h.id}')`) + arrow + step('05', 'Case', 'After the issue opens', 'h-step-off')
      : step('—', 'No issue', 'Kept in the Hunts list as history', 'h-step-ok')}
  </div>`;
}

function hHuntPage() {
  const h = hHunt(H.id); if (!h) return hNav('hunts');
  const run = h.status === 'running', is = h.issue && h.issue.opened ? h.issue : null;
  const chip = (body, cls = 'border border-line2 text-ink2', attrs = '') => `<span ${attrs} class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${cls} text-[12.5px] whitespace-nowrap">${body}</span>`;
  const sep = `<span class="w-px h-4 bg-line2"></span>`;
  $('hv-hunt').innerHTML = `<div class="px-5 sm:px-8 pt-4 shrink-0">
      <div class="text-[13px] text-ink3 flex items-center gap-1.5"><button onclick="hNav('hunts')" class="inline-flex items-center gap-1 hover:text-ink">${ic('arrow-left', 'w-3.5 h-3.5')}Threat Hunting</button><span>›</span><button onclick="hNav('hunts')" class="hover:text-ink">Hunts</button><span>›</span><span class="text-ink2 font-mono">${h.id}</span></div>
      <div class="mt-3 flex items-center gap-2 flex-wrap">
        ${chip(`${hAv(16)}<span class="font-mono">${h.id}</span>`)}
        ${is ? chip(`${ic('triangle-alert', 'w-3.5 h-3.5')}<span class="font-mono">${is.id}</span>`, 'border border-line2 text-ink2 hover:bg-hov cursor-pointer', `onclick="hOpenIssue('${h.id}')" title="Open the issue"`) : ''}
        ${run ? '' : hSev(h.severity)}${sep}
        ${chip('THREAT HUNTING', 'text-ink2 font-bold tracking-wide text-[11.5px]')}${sep}
        ${chip(run ? `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Running · ${hMins(h)}m` : is && is.state === 'Open' ? hOpenFor(is) : `Finished ${hyDate(h.ended)}`, 'text-ink2')}${sep}
        ${chip(`${h.tech} ${esc(h.techName)}`, 'text-ink2')}${sep}
        ${chip(`Trigger: ${HY_TRIGGER[h.trigger][0].toLowerCase()}`, 'text-ink2')}
      </div>
      <h1 class="text-[32px] text-ink leading-tight mt-3">${esc(h.title)}</h1>
      <div class="mt-4">${hLineage(h)}</div>
      <div class="mt-4 pb-4 border-b border-line"><div class="inline-flex items-center rounded-full border border-line p-1 bg-panel">${H_TABS.map(([k, l], i) => `<button onclick="hTab('${k}')" data-tab="${k}" class="px-5 py-2 rounded-full text-[15px] ${H.tab === k ? 'bg-hov text-ink font-bold' : 'text-ink3 hover:text-ink'}" title="Press ${i + 1}">${l}</button>`).join('')}</div></div>
    </div>
    <div data-scroll class="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 pt-6 pb-16">${({ summary: hSummaryTab, report: hReportTab, hunt: hHuntTab })[H.tab](h)}</div>`;
}
/* A running hunt has no report yet. Say so, and point to the tab that is alive. */
const hNotYet = (h, what) => `<div class="max-w-[820px] rounded-2xl border border-dashed border-line2 p-8 text-center"><div class="inline-flex">${hAv(40)}</div><div class="text-[18px] font-bold text-ink mt-3">The ${what} is written when the hunt ends</div><p class="text-[14px] text-ink3 mt-1.5">The agent is at <b class="c-blue">${HY_STAGES[h.stage]}</b>. A report is written once and is not edited afterwards, so nothing is shown before it is final.</p><button onclick="hTab('hunt')" class="mt-4 h-10 px-4 rounded-lg bg-hov text-ink text-[14px] font-bold inline-flex items-center gap-1.5">Watch the hunt ${ic('arrow-right', 'w-4 h-4')}</button></div>`;

/* ---------- Summary ---------- */
function hSummaryTab(h) {
  if (h.status === 'running') return hNotYet(h, 'summary');
  const threat = h.verdict === 'threat', is = h.issue && h.issue.opened ? h.issue : null, d = h.detection;
  const cases = !threat
    ? `<p class="h-p text-ink3">None. A hunt that finds no threat opens no issue. It stays in the Hunts list as history.</p><button onclick="hEscalate('${h.id}')" class="mt-3 h-9 px-3.5 rounded-lg border border-line2 text-ink2 hover:text-ink text-[13.5px] font-semibold inline-flex items-center gap-1.5">${ic('corner-up-right', 'w-4 h-4')}Escalate manually</button>`
    : h.findings.map(f => `<div class="flex items-start gap-3 flex-wrap"><p class="h-p flex-1 min-w-[260px]">${f.isNew ? '(new) ' : ''}${f.id} — ${esc(f.title)}.</p>
        ${is ? `<button onclick="hOpenIssue('${h.id}')" class="shrink-0 inline-flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-lg border border-line2 hover:bg-hov text-[13px] text-ink2"><span class="inline-flex items-center gap-1.5 ${is.state === 'Open' ? 'c-rose font-semibold' : ''}">${ic('triangle-alert', 'w-3.5 h-3.5')}Issue <span class="font-mono">${is.id}</span></span>${ic('arrow-right', 'w-3.5 h-3.5 text-ink4')}<span class="inline-flex items-center gap-1.5">${ic('folder-open', 'w-3.5 h-3.5')}<span class="font-mono">${is.case.id}</span> <span class="text-ink3">${is.case.mode === 'new' ? 'new' : 'joined'}</span></span>${ic('chevron-right', 'w-4 h-4 text-ink3')}</button>`
          : `<button onclick="hIssueNow('${h.id}')" class="shrink-0 h-9 px-3.5 rounded-lg bg-amber-500 text-slate-950 text-[13.5px] font-bold hover:brightness-110 inline-flex items-center gap-1.5">${ic('ticket', 'w-4 h-4')}Open an issue</button>`}</div>`).join('');
  return `<div class="max-w-[1000px]">
    ${hH2('Executive Summary')}
    ${h.summary.map(p => `<p class="h-p">${esc(p)}</p>`).join('')}
    <div class="h-verdict ${threat ? 'h-verdict-bad' : 'h-verdict-ok'}" data-verdict="${h.verdict}"><span>Verdict: ${threat ? 'THREAT FOUND' : 'NO THREAT FOUND'}</span><span class="h-verdict-side">${hConf(h.conf)}<span class="text-ink3">confidence</span></span></div>
    ${hH2('Hypothesis')}
    <p class="h-p">${esc(h.hypothesis)}</p>
    ${hH2('Cases')}
    ${cases}
    ${hH2('Detection')}
    ${d ? `<div class="text-[14px] text-ink3">(${d.isNew ? 'New' : 'Created'}) detection id</div><div class="mt-1 flex items-center gap-3 flex-wrap"><span class="font-mono text-[16px] text-ink2 break-all">${esc(d.id)}</span><button onclick="hTab('report');setTimeout(()=>{const e=document.getElementById('h-sec-detection');if(e)e.scrollIntoView({block:'start'})},40)" class="text-[13px] c-cx font-semibold hover:underline inline-flex items-center gap-1">${esc(d.kind)} · see the query ${ic('arrow-right', 'w-3.5 h-3.5')}</button></div>` : `<p class="h-p text-ink3">None. ${threat ? 'This finding is about specific hosts and does not repeat as a query.' : 'Nothing was found to detect.'}</p>`}
  </div>`;
}

/* ---------- Report ---------- */
const hSlug = t => 'h-sec-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^detection-created$/, 'detection');
function hReportTab(h) {
  if (h.status === 'running') return hNotYet(h, 'report');
  const blocks = h.report(h), heads = blocks.filter(b => b[0] === 'h').map(b => b[1]);
  const cell = v => typeof v === 'number' ? v.toLocaleString() : hMd(String(v));
  const body = blocks.map(b => {
    if (b[0] === 'h') return hH2(esc(b[1]), hSlug(b[1]));
    if (b[0] === 'p') return `<p class="h-p">${hMd(b[1])}</p>`;
    if (b[0] === 'ul') return `<ul class="h-ul">${b[1].map(x => `<li>${hMd(x)}</li>`).join('')}</ul>`;
    if (b[0] === 'code') return `<pre class="h-pre">${esc(b[1])}</pre>`;
    if (b[0] === 'note') return `<div class="h-note tn tn-${b[1]}">${esc(b[2])}</div>`;
    if (b[0] === 'table') return `<div class="overflow-x-auto my-4 rounded-xl border border-line"><table class="w-full text-[14px] border-collapse"><thead class="bg-sunk text-ink3 text-[12.5px]"><tr>${b[1].map(x => `<th class="text-left font-semibold px-3 py-2.5 whitespace-nowrap">${esc(x)}</th>`).join('')}</tr></thead><tbody>${b[2].map(r => `<tr class="border-t border-line align-top ${/^Total/.test(r[0]) ? 'font-bold text-ink bg-sunk' : 'text-ink2'}">${r.map((v, i) => `<td class="px-3 py-2.5 ${typeof v === 'number' ? 'font-mono text-right' : i === 0 ? 'text-ink' : ''}">${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return ''; }).join('');
  return `<div class="flex gap-10 items-start">
    <article class="min-w-0 flex-1 max-w-[900px]">
      <div class="flex items-center gap-2.5 flex-wrap text-[12.5px] text-ink3 mb-1"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-line2 text-ink2">${ic('lock', 'w-3 h-3')}Immutable</span><span>Hunt report for <span class="font-mono text-ink2">${h.id}</span> · one report per hunt · written ${hyDate(h.ended, true)} by the Threat Hunter agent</span>${hVerdict(h)}</div>
      ${body}
      <div class="mt-10 pt-4 border-t border-line text-[13px] text-ink3">Every statement above comes from a query in the <button onclick="hTab('hunt')" class="c-cx font-semibold hover:underline">Hunt tab</button>. Open it to see the question, the query and the rows behind the verdict.</div>
    </article>
    <nav class="hidden xl:block w-56 shrink-0 sticky top-0 border-l border-line pl-4"><div class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase mb-2">In this report</div>${heads.map(t => `<button onclick="document.getElementById('${hSlug(t)}').scrollIntoView({block:'start',behavior:'smooth'})" class="block w-full text-left text-[13px] text-ink3 hover:text-ink py-1 leading-snug">${esc(t)}</button>`).join('')}</nav>
  </div>`;
}

/* ---------- Hunt ---------- */
/* How one finding was reached: scope, hypothesis, questions, data, finding, issue. */
function hGraph(h) {
  const node = (t, cls = 'border-line2 text-ink2') => `<span class="px-2 py-1 rounded-md border ${cls} text-[12px] font-mono whitespace-nowrap">${t}</span>`, arr = `<span class="text-ink4">›</span>`;
  const sets = [...new Set(h.questions.map(q => q.dataset.replace(/_raw$/, '')))];
  if (!h.findings.length) return `<div class="flex items-center gap-2 flex-wrap">${[node('Scope'), node(h.hyps.map(x => x.id).join(' · ')), node(h.questions.map(q => q.id).join(' · ')), node(sets.slice(0, 3).join(' · ')), node('No finding', 'border-cx/50 c-cx')].join(arr)}</div>`;
  return h.findings.map(f => `<div class="flex items-center gap-1.5 flex-wrap">${[node('Scope'), node(f.hyp), node(f.qs.join(' · ')), node(f.sets.join(' · ')), node(`${f.id} ${f.sev}`, 'border-rose-500/70 c-rose'), node('Issue')].join(arr)}</div>`).join('');
}
function hHuntTab(h) {
  const run = h.status === 'running', shown = run ? h.questions.slice(0, h.shown) : h.questions, next = run && h.stage === 3 ? h.questions[h.shown] : null;
  const box = (title, body, right = '') => `<section class="rounded-2xl border border-line bg-panel p-4 sm:p-5"><div class="flex items-center justify-between gap-2 mb-3"><h3 class="text-[12px] font-black tracking-[.14em] text-ink3 uppercase">${title}</h3>${right}</div>${body}</section>`;
  const res = x => { if (run && h.stage < 4) return `<span class="text-ink4 text-[12.5px] whitespace-nowrap">not decided yet</span>`; const r = H_RESULT[x.result]; return `<span class="inline-flex items-center gap-1 ${r[1]} text-[13px] font-semibold whitespace-nowrap">${ic(r[0], 'w-3.5 h-3.5')}${r[2]}</span>`; };
  const cond = { finding: ['c-rose', 'triangle-alert'], gap: ['c-amber', 'circle-dashed'], clear: ['c-cx', 'check'] };
  const rowsTxt = q => `${q.rows.toLocaleString()} row${q.rows === 1 ? '' : 's'}`;
  const qCard = q => `<div class="h-q" data-q="${q.id}">
      <div class="flex items-start gap-3"><span class="shrink-0 mt-0.5 w-9 text-center px-1 py-0.5 rounded-md bg-hov text-[12px] font-bold font-mono text-ink2">${q.id}</span>
        <div class="min-w-0 flex-1"><div class="text-[15.5px] text-ink font-semibold leading-snug">${esc(q.q)}</div>
          <div class="text-[12px] text-ink3 mt-0.5">tests ${q.cond ? q.cond + ' · ' : ''}${q.hyp}</div></div>
        <span class="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] text-ink3 font-mono whitespace-nowrap">${esc(q.dataset)} · ${rowsTxt(q)} ${ic('check', 'w-3.5 h-3.5 c-cx')}</span></div>
      <pre class="h-pre h-xql">${esc(q.xql)}</pre>
      <div class="flex items-start gap-2 text-[13.5px] text-ink2 leading-relaxed"><span class="shrink-0 mt-[3px] c-indigo">${ic('corner-down-right', 'w-3.5 h-3.5')}</span><span>${esc(q.note)}</span></div></div>`;
  const tok = h.logged.tokens >= 1e6 ? (h.logged.tokens / 1e6).toFixed(2) + 'M' : Math.round(h.logged.tokens / 1000) + 'K';
  const stat = (n, l) => `<div><div class="text-[20px] font-black font-mono text-ink leading-6">${n}</div><div class="text-[11.5px] text-ink3">${l}</div></div>`;
  return `<div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] items-start max-w-[1400px]">
    <div class="space-y-3 min-w-0">
      ${box('Stage', hStageBar(h), `<span class="text-[12.5px] ${run ? 'c-blue font-semibold' : 'text-ink3'}">${run ? `Running · ${hMins(h)}m` : `Finished in ${hMins(h)}m`}</span>`)}
      ${box('Hypotheses', `<div class="space-y-2.5">${h.hyps.map(x => `<div class="flex items-start gap-3"><span class="shrink-0 w-9 text-center px-1 py-0.5 rounded-md bg-hov text-[12px] font-bold font-mono text-ink2">${x.id}</span><div class="min-w-0 flex-1"><div class="text-[15px] text-ink leading-snug">${esc(x.text)}</div>${run && h.stage < 4 ? '' : `<div class="text-[13px] text-ink3 mt-0.5">${esc(x.note)}</div>`}</div>${res(x)}</div>`).join('')}
        ${h.conds ? `<div class="pt-3 mt-1 border-t border-line grid gap-2 sm:grid-cols-3">${h.conds.map(c => `<div class="rounded-xl bg-sunk px-3 py-2"><div class="flex items-center gap-1.5 text-[12px] font-bold font-mono ${cond[c.result][0]}">${ic(cond[c.result][1], 'w-3.5 h-3.5')}${c.id}</div><div class="text-[13px] text-ink leading-snug mt-0.5">${esc(c.text)}</div><div class="text-[12px] text-ink3 mt-0.5">${esc(c.note)}</div></div>`).join('')}</div>` : ''}</div>`)}
      ${box(`Questions <span class="text-ink4">→</span> Queries <span class="normal-case tracking-normal font-semibold">(all logged)</span>`, `${run && h.stage < 3 ? `<div class="text-[14px] text-ink3 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>The agent is at ${HY_STAGES[h.stage]}. Queries start at Collect evidence.</div>` : ''}<div class="divide-y divide-dashed divide-line2">${shown.map(qCard).join('')}</div>
        ${next ? `<div class="mt-3 pt-3 border-t border-dashed border-line2 flex items-center gap-3 text-[14px] text-ink3"><span class="shrink-0 w-9 text-center px-1 py-0.5 rounded-md bg-hov text-[12px] font-bold font-mono c-blue">${next.id}</span><span class="flex-1 min-w-0">${esc(next.q)}</span><span class="inline-flex items-center gap-1.5 c-blue text-[12.5px] font-semibold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>running the query</span></div>` : ''}`, `<span class="text-[12.5px] text-ink3 font-mono">${shown.length}${run ? ' of ' + h.questions.length : ''} queries</span>`)}
    </div>
    <div class="space-y-3 min-w-0 xl:sticky xl:top-0">
      ${box('Scope', `<div class="text-[16px] text-ink">${esc(h.window)} · ${esc(h.scope)} (${h.endpoints.toLocaleString()})</div><div class="text-[13px] text-ink3 mt-1.5 leading-relaxed">${hTrigger(h)}<span class="block mt-1">${esc(h.triggerText)}</span></div>`)}
      ${run ? '' : box('Hunt graph', hGraph(h) + `<div class="text-[12.5px] text-ink3 mt-2.5">The shortest path from the scope to ${h.findings.length ? 'each finding' : 'the result'}.</div>`)}
      ${box('Data sources', `<div class="text-[12px] text-ink3 mb-1.5">Queried</div><div class="flex flex-wrap gap-1.5">${h.sources.queried.map(s => `<span class="px-2 py-0.5 rounded-md bg-hov text-[12.5px] font-mono text-ink2">${esc(s)}</span>`).join('')}</div>
        <div class="text-[12px] text-ink3 mt-3 mb-1.5">Unavailable</div>${h.sources.missing.length ? h.sources.missing.map(([s, why]) => `<div class="flex items-start gap-2 py-1"><span class="shrink-0 mt-[3px] c-amber">${ic('circle-off', 'w-3.5 h-3.5')}</span><div class="min-w-0"><div class="text-[13.5px] text-ink leading-snug">${esc(s)}</div><div class="text-[12.5px] text-ink3 leading-snug">${esc(why)}</div></div></div>`).join('') : `<div class="text-[13.5px] text-ink3">None. Every source the plan asked for answered.</div>`}`)}
      ${box('Also logged', `<div class="grid grid-cols-3 gap-2">${stat(run ? '…' : h.logged.facts, 'facts')}${stat(run ? '…' : h.logged.entities, 'entities')}${stat(run ? '…' : tok, 'tokens')}</div><div class="text-[12.5px] text-ink3 mt-2.5 leading-relaxed">Raw results of every query are kept with the hunt. Each step is a reason for the verdict.</div>`)}
    </div>
  </div>`;
}
