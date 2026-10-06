/* ======================================================================
   THREAT HUNTING · SHELL
   State, navigation, the clock that moves a running hunt forward, the
   issue sheet and the keyboard. The screens are in 82 (the Hunts list)
   and 83 (one hunt: Summary, Report, Hunt).
   ====================================================================== */
let H = null;
const H_USER = 'Ariel B.';
const H_TABS = [['summary', 'Summary'], ['report', 'Report'], ['hunt', 'Hunt']];
/* Seconds between two steps of a running hunt. ?live=3 makes it faster. */
const H_STEP = (() => { try { const v = +new URLSearchParams(location.search).get('live'); return v > 0 ? v * 1000 : 12000; } catch (e) { return 12000; } })();
const H_HUNTER = ['#f97316', '#fdba74', '#fdba74'];
const hAv = (size = 22) => `<span class="inline-flex shrink-0" style="width:${size}px;height:${size}px" title="Threat Hunter agent">${robotSVG(size, H_HUNTER[0], H_HUNTER[1], H_HUNTER[2])}</span>`;
const hHunt = id => H.W.hunts.find(h => h.id === id);
/* Bold and code inside running text. */
const hMd = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink font-bold">$1</strong>').replace(/`(.+?)`/g, '<code class="h-code">$1</code>');
const hInfo = text => `<span ${tipAttr(`<span style="color:#e5e9f2">${esc(text)}</span>`)} class="inline-flex items-center text-ink4 hover:text-ink2 cursor-help align-middle">${ic('info', 'w-3.5 h-3.5')}</span>`;
const hMins = h => Math.max(1, Math.round(((h.ended || Date.now()) - h.started) / 60000));
const hDays = ts => Math.max(0, Math.floor((Date.now() - ts) / HY_DAY));
const hOpenFor = is => { const d = hDays(is.opened); return d ? `Open for ${d} day${d === 1 ? '' : 's'}` : 'Opened today'; };

/* ---------- small shared pieces ---------- */
const H_SEV = { Critical: 'rose', High: 'rose', Medium: 'amber', Low: 'slate' };
const hSev = s => `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md tn tn-${H_SEV[s]} text-[12px] font-semibold whitespace-nowrap">${ic(s === 'Low' ? 'chevron-down' : 'chevrons-up', 'w-3 h-3')}${s}</span>`;
const hConf = c => { const n = { High: 3, Medium: 2, Low: 1 }[c];
  return `<span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 whitespace-nowrap" title="Confidence: ${c}"><span class="inline-flex items-end gap-[2px] h-3">${[1, 2, 3].map(i => `<span class="w-[3px] rounded-sm ${i <= n ? 'bg-cx' : 'bg-line2'}" style="height:${4 + i * 3}px"></span>`).join('')}</span>${c}</span>`; };
/* The verdict of a finished hunt. A running hunt has no verdict yet. */
function hVerdict(h, big) {
  if (h.status === 'running') return `<span class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold c-blue whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Running · ${hMins(h)}m</span>`;
  const t = h.verdict === 'threat';
  return `<span class="inline-flex items-center gap-1.5 ${big ? 'px-2.5 py-1 text-[13px]' : 'px-2 py-0.5 text-[12px]'} rounded-md tn tn-${t ? 'rose' : 'cx'} font-bold whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full ${t ? 'bg-rose-500' : 'bg-cx'}"></span>${t ? 'Threat found' : 'No threat found'}</span>`;
}
const hTrigger = h => { const t = HY_TRIGGER[h.trigger]; return `<span class="inline-flex items-center gap-1.5 text-[12.5px] text-ink2 whitespace-nowrap" title="${esc(t[2])}">${ic(t[1], 'w-3.5 h-3.5 text-ink3')}${t[0]}</span>`; };
/* The six stages. A finished hunt has all of them filled. */
function hStageBar(h, slim) {
  const run = h.status === 'running';
  return `<div class="flex gap-1.5">${HY_STAGES.map((s, i) => `<span class="h-1.5 flex-1 rounded-full ${i < h.stage || !run ? 'bg-blue-500' : i === h.stage ? 'bg-blue-500 seg-live' : 'bg-line2'}"></span>`).join('')}</div>
    ${slim ? '' : `<div class="mt-2.5 text-[13px] text-ink3 flex flex-wrap gap-x-1.5">${HY_STAGES.map((s, i) => `<span class="${run && i === h.stage ? 'c-blue font-semibold' : !run || i < h.stage ? 'text-ink2' : ''}">${s}</span>`).join('<span class="text-ink4">·</span>')}</div>`}`;
}

/* ---------- boot ---------- */
function hBoot() {
  H = { W: hyWorld(), view: 'hunts', id: null, tab: 'summary', filter: 'all', q: '', sheet: null, menu: false, timers: [] };
  document.title = 'Cortex · Threat Hunting';
  ['home', 'autonomous', 'cases', 'insights', 'anatomy'].forEach(v => { const el = $('view-' + v); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
  ['wf-offer', 'intro', 'landing'].forEach(id => { const el = $(id); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
  const main = document.querySelector('#app main');
  main.insertAdjacentHTML('beforeend', ['hunts', 'hunt'].map(v => `<section id="hv-${v}" class="hidden flex-1 min-w-0 flex-col overflow-hidden bg-bg"></section>`).join(''));
  document.body.insertAdjacentHTML('beforeend', `
    <div id="h-sheet-bg" class="hidden fixed inset-0 z-[44] bg-black/50" onclick="hCloseIssue()"></div>
    <aside id="h-sheet" class="hidden fixed inset-y-0 right-0 z-[45] w-[min(720px,100vw)] bg-panel border-l border-line2 shadow-2xl flex-col m-sheet-in"></aside>`);
  const rail = document.querySelector('#app aside nav'); if (rail) rail.id = 'h-rail';
  const mt = $('mobile-tabs'); if (mt) mt.classList.add('hidden');
  hPatchDemoMenu();
  const me = document.querySelector('#app aside [title^="Guy"]');
  if (me) { me.title = 'Ariel B. (Threat Hunting Lead)'; me.textContent = 'AB'; me.insertAdjacentHTML('beforebegin', `<button onclick="location.reload()" class="w-10 h-10 rounded-xl hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Reset the demo (R)">${ic('rotate-ccw', 'w-4 h-4')}</button>`); }
  document.addEventListener('click', e => { if (H.menu && !e.target.closest('#h-new')) { H.menu = false; hRender(); } });
  H.timers.push(setInterval(hTick, H_STEP));
  /* ?hunt=hero opens the full example at once. Useful for a link in a deck. */
  let open = null; try { open = new URLSearchParams(location.search).get('hunt'); } catch (e) {}
  if (open === 'hero') hOpen(H.W.hunts.find(h => h.hero).id); else hNav('hunts');
}
function hPatchDemoMenu() {
  const menu = $('demo-menu'); if (!menu) return;
  menu.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || '';
    if (/showExplore|startTour|toggleShortcuts|showLanding/.test(oc)) b.classList.add('hidden');
    if (/injectIncident/.test(oc)) { b.setAttribute('onclick', 'closeDemoMenu();hFinishNow()'); b.innerHTML = `${ic('zap', 'w-3.5 h-3.5')} Finish the running hunt now`; } });
  ['demo-speed', 'core-switch'].forEach(id => { const el = $(id); if (el) { el.classList.add('hidden'); const lab = el.previousElementSibling; if (lab && id === 'demo-speed') lab.classList.add('hidden'); if (id === 'core-switch') el.parentElement.classList.add('hidden'); } });
}

/* ---------- a running hunt moves on its own ---------- */
function hTick() {
  const run = hyRunning(H.W); if (!run.length) return;
  run.forEach(h => { if (hyStep(H.W, h)) hDone(h); });
  /* Only redraw what shows a running hunt, so reading a finished report is never interrupted. */
  if (H.view === 'hunts' || run.some(h => h.id === H.id)) hRender();
}
function hDone(h) {
  const t = h.verdict === 'threat';
  toast(`${h.id} finished: ${t ? 'Threat found' : 'No threat found'}${t && h.issue.opened ? ` · issue ${h.issue.id} opened` : ''}`, t ? 'siren' : 'circle-check');
  if (H.view === 'hunt' && H.id === h.id) H.tab = 'summary';
}
function hFinishNow() { const run = hyRunning(H.W); if (!run.length) return toast('No hunt is running', 'check'); run.forEach(h => { while (!hyStep(H.W, h)); hDone(h); }); hRender(); }

/* ---------- navigation ---------- */
function hNav(view) {
  H.view = view; if (view === 'hunts') H.id = null;
  ['hunts', 'hunt'].forEach(v => { const el = $('hv-' + v); el.classList.toggle('hidden', v !== view); el.classList.toggle('flex', v === view); });
  $('hv-' + view).dataset.top = '1';
  hRender();
}
function hOpen(id, tab) { const h = hHunt(id); if (!h) return; H.id = id; H.tab = tab || (h.status === 'running' ? 'hunt' : 'summary'); hNav('hunt'); }
function hTab(t) { H.tab = t; $('hv-hunt').dataset.top = '1'; hRender(); }
/* Every redraw keeps the scroll position and what is typed in the search box. */
function hRender() {
  const sec = $('hv-' + H.view), sc = sec.querySelector('[data-scroll]'), top = sec.dataset.top ? 0 : sc ? sc.scrollTop : 0, left = sc ? sc.scrollLeft : 0;
  delete sec.dataset.top;
  const s = $('h-search'), keep = s && [s.value, document.activeElement === s, s.selectionStart];
  H.view === 'hunts' ? hHunts() : hHuntPage();
  hRail();
  if (H.sheet) hIssueRender();
  const sc2 = sec.querySelector('[data-scroll]'); if (sc2) { sc2.scrollTop = top; sc2.scrollLeft = left; }
  const s2 = $('h-search'); if (s2 && keep) { s2.value = keep[0]; if (keep[1]) { s2.focus(); try { s2.setSelectionRange(keep[2], keep[2]); } catch (e) {} } }
  icons();
}
function hRail() {
  const el = $('h-rail'); if (!el) return; const n = hyRunning(H.W).length;
  el.innerHTML = `<button onclick="hNav('hunts')" title="Hunts" class="relative w-10 h-10 mx-auto rounded-xl flex items-center justify-center c-cx bg-hov border border-line2">${ic('crosshair', 'w-4 h-4')}${n ? `<span class="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-blue-500 text-white text-[10.5px] font-bold flex items-center justify-center" title="${n} running">${n}</span>` : ''}</button>`;
}

/* ---------- actions ---------- */
function hStart(k) { H.menu = false; const h = hyStart(H.W, k); toast(`${h.id} started`, 'crosshair'); hOpen(h.id, 'hunt'); }
function hSetAuto() { H.W.autoIssue = !H.W.autoIssue; toast(H.W.autoIssue ? 'Threat found opens an issue automatically' : 'Threat found waits for an analyst to open the issue', 'settings-2'); hRender(); }
function hIssueNow(id) { const h = hHunt(id); if (hyOpenIssue(H.W, h, 'analyst')) { toast(`Issue ${h.issue.id} opened · ${h.issue.case.mode === 'new' ? 'new case' : 'joined'} ${h.issue.case.id}`, 'ticket'); hRender(); } }
function hEscalate(id) { const h = hHunt(id); if (hyEscalate(H.W, h)) { toast(`Escalated · issue ${h.issue.id} opened in ${h.issue.case.id}`, 'ticket'); hOpenIssue(id); } }

/* ---------- the issue: one per report, type Threat Hunting ---------- */
function hSheetShow(on) { ['h-sheet', 'h-sheet-bg'].forEach(id => $(id).classList.toggle('hidden', !on)); $('h-sheet').classList.toggle('flex', on); }
function hOpenIssue(id) { H.sheet = id; hSheetShow(true); hRender(); const sc = $('h-sheet-scroll'); if (sc) sc.scrollTop = 0; }
function hCloseIssue() { if (!H || !H.sheet) return; H.sheet = null; hSheetShow(false); hRender(); }
function hRunStep(id, i) { const h = hHunt(id), is = h.issue; is.stepsDone = is.stepsDone || []; is.stepsDone[i] = true; toast(`${is.steps[i][0]} · started by ${H_USER.replace(/\.$/, '')}`, 'play'); hRender(); }
function hIssueRender() {
  const h = hHunt(H.sheet), is = h.issue, el = $('h-sheet'), sc = $('h-sheet-scroll'), top = sc ? sc.scrollTop : 0;
  const box = (title, body, right = '') => `<section class="rounded-2xl border border-line p-4"><div class="flex items-center justify-between gap-2 mb-2.5"><h3 class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">${title}</h3>${right}</div>${body}</section>`;
  const done = is.stepsDone || [], open = is.state === 'Open';
  const chip = (body, cls = 'border border-line2 text-ink2') => `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${cls} text-[12.5px] whitespace-nowrap">${body}</span>`;
  el.innerHTML = `<div class="px-5 pt-4 pb-3 border-b border-line shrink-0 flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">${chip(`${ic('triangle-alert', 'w-3.5 h-3.5')}<span class="font-mono">${is.id}</span>`)}${hSev(h.severity === 'Low' ? 'Medium' : h.severity)}${chip('THREAT HUNTING', 'tn tn-indigo font-bold tracking-wide text-[11.5px]')}${chip(open ? hOpenFor(is) : is.state)}</div>
        <div class="text-[20px] font-bold text-ink leading-snug mt-2">${esc(h.title)}</div>
        <div class="text-[12.5px] text-ink3 mt-1">Issue from hunt report <button onclick="hCloseIssue();hOpen('${h.id}','report')" class="font-mono text-ink2 hover:text-ink underline decoration-dotted">${h.id}</button> · opened ${is.by === 'auto' ? 'automatically, by the Threat found setting' : `by ${H_USER.replace(/\.$/, '')}`} on ${hyDate(is.opened, true)}</div>
      </div>
      <button onclick="hCloseIssue()" class="p-2 -mr-1 rounded-lg hover:bg-hov text-ink2" title="Close (Esc)">${ic('x', 'w-5 h-5')}</button></div>
    <div id="h-sheet-scroll" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      ${box(`<span class="inline-flex items-center gap-1.5"><span class="c-indigo">${ic('sparkles', 'w-3 h-3')}</span>AI summary</span>`, `<p class="text-[14.5px] text-ink leading-relaxed">${esc(is.ai)}</p>`)}
      ${h.findings.length ? box('Findings', h.findings.map(f => `<div class="flex items-start gap-2.5"><span class="shrink-0 mt-0.5 px-1.5 py-0.5 rounded tn tn-rose text-[11.5px] font-bold font-mono">${f.id}</span><div class="min-w-0"><div class="text-[14px] text-ink font-semibold leading-snug">${esc(f.title.charAt(0).toUpperCase() + f.title.slice(1))}</div><p class="text-[13.5px] text-ink2 leading-relaxed mt-1">${esc(f.text)}</p></div></div>`).join('')) : ''}
      ${box('Evidence', `<div class="divide-y divide-line">${is.evidence.map(([k, v]) => `<div class="flex gap-3 text-[13.5px] py-1.5"><span class="w-28 shrink-0 text-ink3">${esc(k)}</span><span class="text-ink min-w-0 break-words ${/\\|\d+\.\d+\.\d+/.test(v) ? 'font-mono text-[12.5px]' : ''}">${esc(v)}</span></div>`).join('')}</div>`)}
      ${box('Queries', `<button onclick="hCloseIssue();hOpen('${h.id}','hunt')" class="w-full flex items-center justify-between gap-3 text-left text-[13.5px] text-ink2 hover:text-ink"><span>${h.questions.length} queries, each with the question it answers and the rows it returned</span><span class="inline-flex items-center gap-1 c-cx font-semibold whitespace-nowrap">Open the hunt ${ic('arrow-right', 'w-3.5 h-3.5')}</span></button>`)}
      ${box('Recommended next steps', `<div class="space-y-2">${is.steps.map((s, i) => `<div class="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 ${done[i] ? 'bg-sunk' : ''}"><span class="shrink-0 w-8 h-8 rounded-lg bg-hov flex items-center justify-center text-ink2">${ic(s[2], 'w-4 h-4')}</span><div class="min-w-0 flex-1"><div class="text-[13.5px] text-ink font-semibold leading-snug">${esc(s[0])}</div><div class="text-[12.5px] text-ink3 leading-snug">${esc(s[1])}</div></div>${done[i] ? `<span class="shrink-0 inline-flex items-center gap-1 text-[12.5px] c-cx font-semibold">${ic('check', 'w-3.5 h-3.5')}${open ? 'Started' : 'Done'}</span>` : `<button onclick="hRunStep('${h.id}',${i})" class="shrink-0 h-8 px-3 rounded-lg bg-hov text-ink text-[12.5px] font-bold hover:bg-cx hover:text-slate-950 inline-flex items-center gap-1.5">${ic('play', 'w-3 h-3')}Run</button>`}</div>`).join('')}</div>`, `<span class="text-[11.5px] text-ink3">The agent recommends. An analyst runs.</span>`)}
      ${box('Case', `<div class="flex items-start gap-3"><span class="shrink-0 w-9 h-9 rounded-xl bg-hov flex items-center justify-center text-ink2">${ic('folder-open', 'w-4 h-4')}</span><div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><span class="text-[15px] font-bold text-ink font-mono">${is.case.id}</span><span class="px-2 py-0.5 rounded-md tn tn-${is.case.mode === 'new' ? 'cx' : 'blue'} text-[11.5px] font-bold">${is.case.mode === 'new' ? 'New case' : 'Joined an open case'}</span></div><p class="text-[13.5px] text-ink2 leading-relaxed mt-1">${esc(is.case.why)}</p><div class="text-[12.5px] text-ink3 mt-1.5">Existing grouping engine · from here the Investigation Agent and an analyst own it.</div></div></div>`)}
    </div>`;
  const sc2 = $('h-sheet-scroll'); if (sc2) sc2.scrollTop = top;
}

/* ---------- keyboard ---------- */
function hKey(e) {
  if (e.target.matches && e.target.matches('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') { closeDemoMenu(); if (H.sheet) hCloseIssue(); else if (H.menu) { H.menu = false; hRender(); } else if (H.view === 'hunt') hNav('hunts'); return; }
  if (k === 't') return toggleTheme();
  if (k === 'r') return location.reload();
  if (k === '/' && H.view === 'hunts') { const el = $('h-search'); if (el) { e.preventDefault(); el.focus(); } return; }
  if (H.view === 'hunt' && !H.sheet && ['1', '2', '3'].includes(k)) return hTab(H_TABS[+k - 1][0]);
}
