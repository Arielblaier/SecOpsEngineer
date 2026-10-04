/* ======================================================================
   AGENT BRIEF (row click → panel)
   ====================================================================== */
function showBrief(id) {
  if (S.briefId === id && !S.cu.open) { closeBrief(); S.selectedId = null; S._tblHtml = null; renderTable(); return; }
  S.briefItem = null;
  if (S.cu.open && id !== reviewingCaseId()) closeCatchup();
  if (S.briefId !== id) S.chat = [];
  S.briefId = id; S.briefSig = null;
  selectCase(id);
  renderCopilot(); renderTranscript();
  if (window.innerWidth < 1024) mobileTab('copilot');
}
function closeBrief() { S.briefItem = null; S._tblHtml = null; S.briefId = null; S.briefSig = null; $('brief').innerHTML = ''; renderCopilot(); }
function briefSuggestions(c) {
  if (!c) return [];
  if (c.task) return ['Why do you recommend this?', 'What is the blast radius?', 'What happens if I wait?'];
  if (c.verdict === 'Running') return ['What are you checking now?', S.agentId === c.id ? 'Summarize so far' : 'Prioritize this case', 'What is the blast radius?'];
  if (c.verdict === 'Inconclusive') return ['What open questions remain?', 'Steer: this is an authorized QA runner', 'Stage containment'];
  return ['Why this verdict?', 'Show the query', 'Reopen case'];
}
function renderBrief() {
  if (!S.briefItem && S.briefId) return renderInvProgress();
  if (S.briefItem) return renderItemBrief();
  const el = $('brief'); const c = S.briefId && byId(S.briefId);
  if (!c) { el.innerHTML = ''; return; }
  const tk = S.tasks.find(x => x.id === c.task), agentOn = S.agentId === c.id, lc = lifecycle(c);
  const key = [c.id, c.verdict, c.task, getWorklog(c).length, agentOn, c.plan ? c.plan.length : 0, !!tk && Math.floor((Date.now() - tk.created) / 30000)].join('|');
  if (S.briefSig === key) return; S.briefSig = key;
  const m = caseModel(c), vd = verdictOf(c);
  const vdCol = vd === 'Malicious' ? 'c-rose' : vd === 'Inconclusive' ? 'c-amber' : vd === 'Running' ? 'c-blue' : 'c-cx';
  const why = [...decisionSignals(c)].sort((a, b) => b.w - a.w)[0];
  const done = agentOn && c.plan ? c.planTotal - c.plan.length : 0;
  const statusTn = { pending: 'amber', in_progress: 'blue', resolved: 'cx' }[lc];
  const statusTxt = { pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved' }[lc];
  el.innerHTML = `
  <div class="fade-up space-y-3">
    <section class="rounded-2xl border border-line bg-card p-5">
      <div class="flex items-center gap-2 text-[12px] text-ink3">
        <span class="tn tn-${statusTn} px-1.5 py-0.5 rounded-md font-semibold">${statusTxt}</span>
        <span class="font-mono">#${c.id}</span><span>· ${esc(c.host)} · ${m.issues.length} issues · open ${fmtOpen(openMs(c))}</span>
      </div>
      <a href="#" onclick="event.preventDefault();openCaseDrawer('${c.id}')" class="block mt-2 text-[17px] font-semibold text-ink leading-snug hover:underline decoration-line2 underline-offset-4" title="Open the full case">${esc(c.name)}</a>
      <p class="mt-2 text-[13px] text-ink2 leading-relaxed">${esc(c.summary)}</p>
    </section>

    <section class="rounded-2xl border border-line bg-card p-5">
      <div class="text-[12px] text-ink3 mb-1.5">Verdict</div>
      <div class="flex items-center gap-3">
        <span class="text-[20px] font-bold ${vdCol}">${vd === 'Running' ? 'Not reached yet' : vd}</span>
        ${c.conf ? `${confBars(c)}<span class="text-[13px] text-ink2 font-medium">${confLevel(c.conf)} confidence</span>` : ''}
      </div>
      ${agentOn ? `<div class="mt-3"><div class="h-1.5 rounded-full bg-sunk overflow-hidden"><div class="h-full bg-blue-500 transition-all duration-700" style="width:${c.planTotal ? done / c.planTotal * 100 : 0}%"></div></div>
        <div class="text-[12.5px] text-ink3 mt-2">Agent is working · step ${done} of ${c.planTotal}</div></div>`
        : why ? `<div class="mt-2 text-[13px] text-ink2 leading-relaxed">${esc(why.text)}</div>` : ''}
    </section>

    ${tk ? `<section class="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[12px] c-amber font-semibold">Waiting for your decision</div>
          <div class="text-[16px] font-semibold text-ink mt-1 leading-snug">${esc(tk.title)}</div>
        </div>
        ${slaRing(tk)}
      </div>
      <button onclick="openCatchup('${tk.id}')" class="mt-4 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[14px] font-bold">Review decision</button>
    </section>` : `<div class="text-center text-[12px] text-ink4 py-1">${lc === 'resolved' ? 'No decision needed, this case is resolved.' : 'No decision needed yet.'}</div>`}
  </div>`;
  icons();
}
