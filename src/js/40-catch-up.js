/* ======================================================================
   CATCH-UP (Slack-style takeover)
   ====================================================================== */
function openCatchup(taskId) {
  if (S.view !== 'autonomous') navigateTo('autonomous');
  if (S.briefId || S.briefItem) { S.briefId = null; S.briefItem = null; S.briefSig = null; S.selectedId = null; const b = $('brief'); if (b) b.innerHTML = ''; S._tblHtml = null; }
  if (window.innerWidth < 1024) mobileTab('copilot');
  S.cu.open = true; S.cu.replyOpen = false;
  if (taskId) { const i = S.tasks.findIndex(t => t.id === taskId); if (i >= 0) S.cu.idx = i; }
  if (S.cu.idx >= S.tasks.length) S.cu.idx = 0;
  $('catchup').classList.remove('hidden'); $('catchup').classList.add('flex');
  renderCatchup(true);
}
function closeCatchup() {
  S.cu.open = false;
  $('catchup').classList.add('hidden'); $('catchup').classList.remove('flex');
  S.cu.taskId = null;
  renderCopilot(); renderTable();
}

function renderCatchupChrome() {
  { const H = S.decHist || [], b = $('cu-hist-btn'), pnl = $('cu-hist');
    if (b) { b.classList.toggle('hidden', !H.length); b.classList.toggle('inline-flex', !!H.length); $('cu-hist-n').textContent = H.length; }
    if (pnl) { pnl.classList.toggle('hidden', !S.cu.hist || !H.length);
      pnl.innerHTML = `<div class="px-2 pt-1 pb-2 text-[11px] font-bold tracking-[.12em] text-ink3">YOUR RECENT DECISIONS</div>${H.map(h => `<div class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-hov"><span class="w-1.5 h-1.5 rounded-full ${h.kind === 'approved' ? 'bg-emerald-400' : 'bg-rose-400'}"></span><div class="min-w-0 flex-1"><div class="text-[12.5px] text-ink truncate">${esc(h.tk.title)}</div><div class="text-[11px] text-ink3">${h.kind === 'approved' ? 'Approved' : 'Declined'} · ${fmtAgo(h.at)} · ${PILLARS[agentOfTask(h.tk)].name}</div></div>${h.can ? `<button onclick="revertDecision('${h.id}')" class="px-2 py-1 rounded-md border border-line2 text-[11.5px] text-ink2 hover:text-ink">Revert</button>` : '<span class="text-[11px] text-ink4">Can’t revert</span>'}</div>`).join('')}`; } }
  { const el = $('cu-agents'); if (el && SINGLE) { el.classList.add('hidden'); } else if (el) { const cnt = k => S.tasks.filter(t => agentOfTask(t) === k).length;
      el.innerHTML = [['all', 'All', S.tasks.length], ...PILLAR_KEYS.map(k => [k, PILLARS[k].name, cnt(k)])].map(([k, l, n]) => `<button onclick="S.cu.agent='${k}';S.cu.idx=0;renderCatchup(true)" class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] ${(S.cu.agent || 'all') === k ? 'bg-ink text-panel font-semibold' : 'text-ink2 hover:bg-hov'} ${n || k === 'all' ? '' : 'opacity-40'}">${k === 'all' ? '' : agentAv(PILLARS[k], 16, false)}${l}<span class="${(S.cu.agent || 'all') === k ? 'opacity-70' : 'text-ink3'}">${n}</span></button>`).join(''); } }
  const n = S.tasks.length, total = n + S.cu.reviewed;
  $('cu-sub').textContent = n ? `${n} decision${n > 1 ? 's' : ''} from your workforce · ${S.cu.reviewed} done` : `${S.cu.reviewed} reviewed this session`;
  $('cu-dots').innerHTML = Array.from({ length: Math.min(total, 10) }, (_, i) => {
    const done = i < S.cu.reviewed, cur = i === S.cu.reviewed + S.cu.idx;
    return `<span class="h-1.5 rounded-full transition-all ${cur ? 'w-5 bg-amber-500' : done ? 'w-1.5 bg-cx' : 'w-1.5 bg-line2'}"></span>`;
  }).join('');
}

function renderCatchup(animate) {
  if (S.cu.agent && S.cu.agent !== 'all') { const L = S.tasks.map((t, i) => [t, i]).filter(([t]) => agentOfTask(t) === S.cu.agent); if (L.length && !L.some(([, i]) => i === S.cu.idx)) S.cu.idx = L[0][1]; if (!L.length) S.cu.idx = S.tasks.length; }
  renderCatchupChrome();
  const stage = $('cu-stage');
  const tk = S.tasks[S.cu.idx];
  S.cu.taskId = tk ? tk.id : null;
  if (tk && tk.caseId) { if (S.pillar !== 'analyst') setPillar('analyst'); focusCaseRow(tk.caseId); }
  else if (tk && tk.itemId) { if (S.pillar !== tk.pillar) setPillar(tk.pillar); else { S._tblHtml = null; renderTable(); } }
  else renderTable();
  if (!tk) {
    stage.innerHTML = `<div class="m-auto p-6 text-center space-y-3 card-in max-w-[300px]">
      <div class="jv st-resolved mx-auto" style="width:120px;height:120px">${entityHTML('done')}</div>
      <div class="text-base font-bold text-ink">You're all caught up</div>
      <p class="text-xs text-ink3">${S.cu.reviewed ? `You cleared ${S.cu.reviewed} decision${S.cu.reviewed > 1 ? 's' : ''}. ` : ''}I'll ring the bell when the next one comes in.</p>
      <button onclick="closeCatchup()" class="px-4 py-2 rounded-xl bg-ink text-panel text-xs font-bold">Back to AgentiX</button></div>`;
    return;
  }
  if (tk.itemId) {
    const it = itemById(tk.itemId); tk.thread = tk.thread || [];
    stage.innerHTML = itemCardHTML(tk, it, animate);
    $('cu-quick').innerHTML = ['Why this?', 'What’s the risk?', 'What happens if I wait?'].map(q => `<button data-q="${esc(q)}" onmousedown="event.preventDefault()" class="px-2.5 py-1 rounded-full border border-line text-[11px] text-ink3 hover:text-ink hover:border-cx">${esc(q)}</button>`).join('');
    $('cu-quick').onclick = e => { const b = e.target.closest('[data-q]'); if (b) { $('cu-input').value = b.dataset.q; cuAsk(); } };
    renderThread(); icons(); return;
  }
  const c = byId(tk.caseId);
  const ev = c ? getWorklog(c).filter(e => e.by === 'agent' && (e.result || e.type === 'evidence')).slice(-3) : [];
  const steering = tk.type === 'Investigation Steering';
  tk.thread = tk.thread || [];
  const viewing = S.drawerId === tk.caseId;
  const sig = c ? decisionSignals(c) : [];
  const m = c ? caseModel(c) : null;
  const M = sig.filter(x => x.dir > 0).reduce((a, x) => a + x.w, 0), B = sig.filter(x => x.dir < 0).reduce((a, x) => a + x.w, 0);
  const leanMal = M >= B;
  const approveSub = steering ? 'close as reviewed' : `run ${esc(tk.playbook)}`;
  stage.innerHTML = `
  <div id="cu-card" class="${animate ? 'card-in' : ''} flex-1 min-h-0 flex flex-col bg-panel">
    <div id="cu-scroll" class="flex-1 min-h-0 overflow-y-auto cp-pad py-5 space-y-3">
      ${c ? invPanelHTML(c, 'decision', tk) : ''}
      <div id="cu-thread" class="${tk.thread.length ? '' : 'hidden'} pt-3 border-t border-line space-y-3"></div>
    </div>
    <div class="cp-pad pt-3 pb-4 border-t border-line bg-panel shrink-0 space-y-2.5">
      <div id="cu-actions" class="flex gap-2">
        <button onclick="cuDecide('approve')" onmouseenter="impactPreview(true)" onmouseleave="impactPreview(false)" onfocus="impactPreview(true)" onblur="impactPreview(false)" class="flex-[1.4] py-2.5 rounded-xl bg-ink hover:opacity-90 text-panel leading-tight">
          <span class="flex items-center justify-center gap-1.5 text-[14px] font-bold">${ic('check', 'w-4 h-4')}Approve</span><span class="block text-[11px] opacity-70 truncate px-2">${approveSub}</span></button>
        <button onclick="cuDecide('decline')" class="flex-1 py-2.5 rounded-xl tn tn-rose text-[14px] font-semibold flex items-center justify-center gap-1.5">${ic('x', 'w-4 h-4')}Decline</button>
        <button onclick="openCaseDrawer('${tk.caseId}')" class="flex-1 py-2.5 rounded-xl bg-sunk border border-line text-ink hover:border-cx text-[14px] font-semibold flex items-center justify-center gap-1.5">${ic('maximize-2', 'w-4 h-4')}Open investigation</button>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="group flex-1 min-w-0">
          <div id="cu-quick" class="hidden group-focus-within:flex flex-wrap gap-1.5 mb-2"></div>
          <div class="flex items-center rounded-xl bg-sunk border border-line focus-within:border-cx">
            <input id="cu-input" placeholder="Ask before deciding…" onkeydown="if(event.key==='Enter') cuAsk()" class="flex-1 min-w-0 bg-transparent px-3 py-2 text-[13px] text-ink placeholder:text-ink4 focus:outline-none">
            <button onclick="cuAsk()" class="mr-1 p-1.5 rounded-lg text-ink3 hover:bg-ink hover:text-panel">${ic('arrow-up', 'w-4 h-4')}</button>
          </div>
        </div>
        ${S.tasks.length > 1 ? `<button onclick="cuDecide('later')" class="shrink-0 text-[12px] text-ink3 hover:text-ink inline-flex items-center gap-0.5" title="Skip for now (L)">Later ${ic('chevron-right', 'w-3.5 h-3.5')}</button>` : ''}
      </div>
    </div>
  </div>`;
  const quick = ['Why do you think so?', 'What is the blast radius?', 'Show the query', steering ? 'It\'s an authorized QA runner' : 'What happens if I wait?'];
  $('cu-quick').innerHTML = quick.slice(0, 3).map(q => `<button data-q="${esc(q)}" onmousedown="event.preventDefault()" class="px-2.5 py-1 rounded-full border border-line text-[11px] text-ink3 hover:text-ink hover:border-cx">${esc(q)}</button>`).join('');
  $('cu-quick').onclick = e => { const b = e.target.closest('[data-q]'); if (b) { $('cu-input').value = b.dataset.q; cuAsk(); } };
  renderThread();
  icons();
}

function renderThread(typing) {
  const tk = S.tasks.find(t => t.id === S.cu.taskId); const el = $('cu-thread'); if (!tk || !el) return;
  el.classList.toggle('hidden', !tk.thread.length && !typing);
  el.innerHTML = tk.thread.map(m => `<div class="fade-up flex gap-2.5"><span class="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold ${m.role === 'user' ? 'bg-indigo-500/15 c-indigo' : 'agent-av'}">${m.role === 'user' ? 'GR' : ''}</span><div class="min-w-0"><div class="text-[12px] font-bold text-ink">${m.role === 'user' ? 'Guy R.' : 'AgentiX'}</div><div class="text-[13px] text-ink2 leading-relaxed">${md(m.text)}</div></div></div>`).join('')
    + (typing ? `<div class="typing"><span></span><span></span><span></span></div>` : '');
  const st = $('cu-scroll'); if (st) st.scrollTop = st.scrollHeight;
}

function cuToggleReply() { const i = $('cu-input'); if (i) i.focus(); }

function cuAsk() {
  const inp = $('cu-input'); const q = inp.value.trim(); if (!q) return; inp.value = '';
  const tk = S.tasks.find(t => t.id === S.cu.taskId); if (!tk) return;
  const c = byId(tk.caseId);
  tk.thread.push({ role: 'user', text: q });
  renderThread(true);
  setTimeout(() => {
    let a;
    if (tk.itemId) a = itemAnswer(itemById(tk.itemId), q);
    else if (/wait|later|if i don/.test(q.toLowerCase())) a = tk.type === 'Investigation Steering' ? 'Nothing breaks, I keep the case paused and the binary stays where it is.' : `Risky. ${c.verdict === 'Malicious' ? 'The activity is live; every minute gives it more room to spread.' : 'The signal may escalate.'} I'd approve now.`;
    else if (/^show the query/.test(q.toLowerCase())) { const e = [...getWorklog(c)].reverse().find(x => x.query); a = e ? `\`${e.query}\` → ${e.result}` : 'No query on this case yet.'; }
    else { const r = respond(c, q); a = typeof r === 'string' ? r : r.text; }
    tk.thread.push({ role: 'agent', text: a });
    if (!S.tasks.includes(tk)) {
      S.cu.reviewed++; S.cu.busy = true;
      renderThread();
      toast('Resolved in thread', 'check');
      setTimeout(() => { S.cu.busy = false; if (S.cu.idx >= S.tasks.length) S.cu.idx = 0; renderCatchup(true); }, 1400);
    } else renderThread();
    refresh();
  }, 700 + rint(400));
}

function cuDecide(kind) {
  if (S.cu.busy) return;
  if (S.drawerId) closeCaseDrawer();
  const tk = S.tasks.find(t => t.id === S.cu.taskId); if (!tk) return;
  S.cu.busy = true;
  const card = $('cu-card'); if (card) card.classList.add('out-' + kind);
  setTimeout(() => {
    const i0 = S.tasks.findIndex(t => t.id === tk.id); if (i0 >= 0 && kind !== 'later') S.cu.idx = i0;
    if (kind === 'approve') { authorizeTask(tk.id, true); S.cu.reviewed++; toast(`Approved: ${tk.title}`, 'shield-check'); }
    else if (kind === 'decline') { declineTask(tk.id, true); S.cu.reviewed++; toast(`Declined: ${tk.title}`, 'x'); }
    else { const i = S.tasks.findIndex(t => t.id === tk.id); S.cu.idx = (i + 1) % Math.max(1, S.tasks.length); }
    if (S.cu.idx >= S.tasks.length) S.cu.idx = 0;
    S.cu.replyOpen = false; S.cu.busy = false;
    renderCatchup(true);
  }, 320);
}
