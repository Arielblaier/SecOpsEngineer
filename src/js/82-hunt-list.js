/* ======================================================================
   THREAT HUNTING · THE HUNTS LIST
   Every hunt the agent ran, running first. A hunt that found nothing stays
   here as history: it is the proof that a technique was checked.
   ====================================================================== */
const H_FILTERS = [['all', 'All'], ['running', 'Running'], ['threat', 'Threat found'], ['clear', 'No threat found']];
function hList() {
  const q = H.q.trim().toLowerCase(), f = H.filter;
  return H.W.hunts.filter(h => f === 'all' || (f === 'running' ? h.status === 'running' : h.status === 'done' && h.verdict === f))
    .filter(h => !q || [h.id, h.title, h.tech, h.techName, h.tactic, HY_TRIGGER[h.trigger][0], h.issue && h.issue.opened ? h.issue.id + ' ' + h.issue.case.id : '', h.detection ? h.detection.id : ''].join(' ').toLowerCase().includes(q))
    /* Running first, then what still needs a person, then the newest. */
    .sort((a, b) => (b.status === 'running') - (a.status === 'running') || hNeeds(b) - hNeeds(a) || (b.ended || b.started) - (a.ended || a.started));
}
const hNeeds = h => h.status === 'done' && h.verdict === 'threat' && (!h.issue.opened || h.issue.state === 'Open') ? 1 : 0;

function hWidgets() {
  const st = hyStats(H.W), W = H.W;
  const card = (body, oc = '') => `<div class="m-wid rounded-2xl border border-line px-4 py-3 min-w-0 ${oc ? 'cursor-pointer hover:border-line2' : ''}" ${oc ? `onclick="${oc}"` : ''}>${body}</div>`;
  const head = (t, tip, right = '') => `<div class="flex items-center justify-between gap-2 text-[11.5px] text-ink3 mb-1.5"><span class="font-semibold inline-flex items-center gap-1.5">${t} ${hInfo(tip)}</span>${right}</div>`;
  const big = (n, cls = 'text-ink') => `<span class="text-[26px] leading-7 font-black font-mono ${cls}">${n}</span>`;
  const run = hyRunning(W)[0];
  return `<div class="grid gap-2.5 grid-cols-2 xl:grid-cols-4">
    ${card(`${head('<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Hunts, last 30 days', 'Finished hunts by verdict in the last 30 days, and what is running now.', `<span class="font-mono ${st.running ? 'c-blue' : 'text-ink4'}">${st.running ? st.running + ' running now' : 'none running'}</span>`)}
      <div class="flex items-baseline gap-2">${big(st.d30)}<span class="text-[12.5px] text-ink3">finished</span></div>
      <div class="mt-2 h-2 rounded-full bg-sunk flex gap-[2px] overflow-hidden"><div class="h-full bg-rose-500" style="width:${st.d30 ? Math.max(st.threat30 ? 3 : 0, st.threat30 / st.d30 * 100) : 0}%"></div><div class="h-full bg-cx flex-1"></div></div>
      <div class="text-[11.5px] text-ink3 mt-1.5 truncate"><span class="${st.threat30 ? 'c-rose font-semibold' : ''}">${st.threat30} threat found</span> · ${st.clear30} no threat found</div>`, run ? `hOpen('${run.id}')` : '')}
    ${card(`${head('Techniques checked', 'ATT&CK techniques in the rotation that had at least one hunt in the last 30 days. A technique with no recent hunt is a place nobody looked.')}
      <div class="flex items-baseline gap-2">${big(st.tech30)}<span class="text-[12.5px] text-ink3">of ${st.techAll} in the rotation</span></div>
      <div class="mt-2 flex gap-[3px]">${Array.from({ length: st.techAll }, (_, i) => `<span class="h-2 flex-1 rounded-sm ${i < st.tech30 ? 'bg-cx' : 'bg-line2'}"></span>`).join('')}</div>
      <div class="text-[11.5px] text-ink3 mt-1.5 truncate">${st.techAll - st.tech30 ? `<span class="c-amber font-semibold">${st.techAll - st.tech30} not checked in 30 days</span>` : 'all checked in 30 days'}</div>`)}
    ${card(`${head('Findings that became work', 'Each report that says Threat found opens one issue. The existing grouping engine then puts the issue in a case.')}
      <div class="flex items-center gap-2 text-ink">${big(st.issues)}<span class="text-[12.5px] text-ink3 leading-tight">issue${st.issues === 1 ? '' : 's'}</span>${ic('arrow-right', 'w-4 h-4 text-ink4')}${big(st.cases)}<span class="text-[12.5px] text-ink3 leading-tight">case${st.cases === 1 ? '' : 's'}</span></div>
      <div class="text-[11.5px] text-ink3 mt-3.5 truncate">${st.issuesOpen ? `<span class="c-rose font-semibold">${st.issuesOpen} still open</span>` : 'none open'}${st.waiting ? ` · <span class="c-amber font-semibold">${st.waiting} waiting for an analyst to open the issue</span>` : ''}</div>`, "H.filter='threat';hRender()")}
    ${card(`${head('Hunts that became detections', 'A hunt that can be repeated as a query is turned into a detection, so the next time is an alert and not a hunt.')}
      <div class="flex items-baseline gap-2">${big(st.detections, 'c-cx')}<span class="text-[12.5px] text-ink3">detection${st.detections === 1 ? '' : 's'} from ${st.threat} hunt${st.threat === 1 ? '' : 's'} with a finding</span></div>
      <div class="text-[11.5px] text-ink3 mt-3.5 truncate">${st.queries.toLocaleString()} queries logged in ${st.done} finished hunts</div>`)}
  </div>`;
}

function hHunts() {
  const W = H.W, list = hList(), th = (l, extra = '') => `<th class="text-left font-semibold px-3 py-3 whitespace-nowrap ${extra}">${l}</th>`;
  const count = k => k === 'all' ? W.hunts.length : W.hunts.filter(h => k === 'running' ? h.status === 'running' : h.status === 'done' && h.verdict === k).length;
  const tag = t => `<span class="inline-block px-2 py-0.5 rounded-md border border-line2 text-[12px] italic whitespace-nowrap">${esc(t)}</span>`;
  const dash = '<span class="text-ink4">—</span>';
  const rows = list.map(h => { const run = h.status === 'running', is = h.issue && h.issue.opened ? h.issue : null, wait = !run && h.verdict === 'threat' && !is;
    return `<tr data-hunt="${h.id}" onclick="hOpen('${h.id}')" class="border-t border-line cursor-pointer hover:bg-hov text-ink2 ${run ? 'h-row-run' : ''}">
      <td class="px-3 py-3 font-mono text-[12.5px] whitespace-nowrap">${h.id}</td>
      <td class="px-3 py-3 min-w-[330px]"><span class="text-ink">${esc(h.title)}</span>${run ? `<div class="mt-1.5 max-w-[300px]">${hStageBar(h, true)}<div class="text-[11.5px] c-blue mt-1">${HY_STAGES[h.stage]}${h.stage === 3 ? ` · ${h.shown} of ${h.questions.length} queries` : ''}</div></div>` : ''}</td>
      <td class="px-3 py-3">${hVerdict(h)}</td>
      <td class="px-3 py-3">${run ? dash : hConf(h.conf)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${tag(h.tactic)}</td><td class="px-3 py-3 whitespace-nowrap">${tag(h.tech + ' ' + h.techName)}</td>
      <td class="px-3 py-3">${hTrigger(h)}</td>
      <td class="px-3 py-3 whitespace-nowrap">${is ? `<button onclick="event.stopPropagation();hOpenIssue('${h.id}')" class="inline-flex items-center gap-1.5 font-mono text-[12.5px] ${is.state === 'Open' ? 'c-rose font-semibold' : 'text-ink2'} hover:underline" title="${is.state} · ${is.case.id}">${ic('triangle-alert', 'w-3.5 h-3.5')}${is.id}</button><span class="block text-[11.5px] text-ink3 font-mono">${is.case.id}</span>` : wait ? `<button onclick="event.stopPropagation();hIssueNow('${h.id}')" class="h-7 px-2.5 rounded-md bg-amber-500 text-slate-950 text-[12.5px] font-bold hover:brightness-110">Open issue</button>` : dash}</td>
      <td class="px-3 py-3 whitespace-nowrap">${!run && h.detection ? `<span class="inline-flex items-center gap-1.5 text-[12.5px] c-cx" title="${esc(h.detection.id)}">${ic('shield-plus', 'w-3.5 h-3.5')}${h.detection.isNew ? 'New' : 'Created'}</span>` : dash}</td>
      <td class="px-3 py-3 text-right font-mono">${run ? h.shown : h.questions.length}</td>
      <td class="px-3 py-3 whitespace-nowrap">${hyDate(h.started, true)}</td>
      <td class="px-3 py-3 whitespace-nowrap text-right font-mono">${hMins(h)}m</td></tr>`; }).join('');
  const queue = W.queue.map(k => HY_LIB.find(t => t.k === k));
  $('hv-hunts').innerHTML = `<div class="px-5 sm:px-8 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap shrink-0">
      <div><div class="text-[13px] text-ink3">Threat Hunting <span class="mx-1.5">›</span> <span class="text-ink2">Hunts</span></div><h1 class="text-[30px] text-ink leading-tight mt-1.5">Hunts</h1></div>
      <div class="flex items-center gap-2.5">
        <button onclick="hSetAuto()" class="h-10 pl-3 pr-2.5 rounded-lg border border-line2 text-[13px] text-ink2 hover:text-ink inline-flex items-center gap-2.5" title="What happens when a hunt report says Threat found">On Threat found: <b class="text-ink font-semibold">${W.autoIssue ? 'open an issue automatically' : 'wait for an analyst'}</b><span class="relative w-8 h-[18px] rounded-full ${W.autoIssue ? 'bg-cx' : 'bg-line2'}"><span class="absolute top-[2px] ${W.autoIssue ? 'left-[16px]' : 'left-[2px]'} w-[14px] h-[14px] rounded-full bg-white transition-all"></span></span></button>
        <div id="h-new" class="relative"><button onclick="H.menu=!H.menu;hRender()" class="h-10 px-4 rounded-lg bg-cx text-slate-950 text-[14px] font-bold inline-flex items-center gap-1.5">${ic('plus', 'w-4 h-4')}New hunt</button>
          ${H.menu ? `<div class="absolute right-0 top-12 z-20 w-[360px] rounded-xl bg-panel border border-line2 shadow-2xl p-2"><div class="px-2.5 py-1.5 text-[11.5px] text-ink3">Start a hunt for a technique. It runs now and ends with a report.</div>${queue.length ? queue.map(t => `<button onclick="hStart('${t.k}')" class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-hov"><span class="block text-[13.5px] text-ink font-semibold leading-snug">${esc(t.title)}</span><span class="block text-[12px] text-ink3">${t.tech} ${esc(t.techName)} · ${esc(t.tactic)}</span></button>`).join('') : `<div class="px-2.5 py-2 text-[13px] text-ink3">No more hunts to start in this demo. Press R to reset.</div>`}</div>` : ''}</div>
      </div></div>
    <div class="px-3 sm:px-5 pb-3 shrink-0">${hWidgets()}</div>
    <div class="flex-1 min-h-0 mx-3 sm:mx-5 mb-3 rounded-2xl bg-panel border border-line flex flex-col overflow-hidden">
      <div class="px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div class="flex items-center gap-1.5 flex-wrap">${H_FILTERS.map(([k, l]) => `<button onclick="H.filter='${k}';hRender()" data-filter="${k}" class="px-3 py-1.5 rounded-full border text-[13px] inline-flex items-center gap-1.5 ${H.filter === k ? 'border-cx/60 bg-cx/10 c-cx font-semibold' : 'border-line2 text-ink2 hover:text-ink'}">${l}<span class="font-mono text-[12px] opacity-80">${count(k)}</span></button>`).join('')}</div>
        <div class="flex items-center gap-2 rounded-lg bg-sunk border border-line px-2.5 focus-within:border-cx w-[min(320px,100%)]">${ic('search', 'w-4 h-4 text-ink3')}<input id="h-search" type="text" autocomplete="off" placeholder="Search hunts, techniques, issues…" oninput="H.q=this.value;hRender()" class="flex-1 min-w-0 bg-transparent text-[13.5px] py-2 text-ink placeholder:text-ink4 focus:outline-none"></div></div>
      <div data-scroll class="flex-1 min-h-0 overflow-auto"><table class="w-full min-w-[1500px] text-[14px] border-collapse">
        <thead class="sticky top-0 z-[2] bg-panel text-ink3 text-[13px]"><tr>${th('Hunt ID')}${th('Hunt')}${th('Verdict')}${th('Confidence')}${th('Mitre ATT&CK Tactic')}${th('Mitre ATT&CK Technique')}${th('Trigger')}${th('Issue · Case')}${th('Detection')}${th('Queries', 'text-right')}${th('Started')}${th('Duration', 'text-right')}</tr></thead>
        <tbody>${rows || `<tr><td colspan="12" class="px-3 py-10 text-center text-ink3">No hunt matches.</td></tr>`}</tbody></table></div>
      <div class="px-5 py-2.5 border-t border-line text-[13px] text-ink3 shrink-0">Showing ${list.length} of ${W.hunts.length} · a hunt with no threat stays here as history</div>
    </div>`;
}
