/* ======================================================================
   QUESTION FEEDBACK
   ====================================================================== */
function fbGet(id, i) { return ((S.fb || {})[id] || {})[i] || null; }
function fbBadge(c, i) {
  const f = fbGet(c.id, i); if (!f) return '';
  if (f.status === 'checking') return `<span class="shrink-0 c-blue text-[11px] font-semibold">Re-checking…</span>`;
  return f.v === 'up' ? `<span class="shrink-0 c-cx" title="You confirmed this answer">${ic('thumbs-up', 'w-3.5 h-3.5')}</span>` : `<span class="shrink-0 c-amber" title="You flagged this answer">${ic('flag', 'w-3.5 h-3.5')}</span>`;
}
function feedbackHTML(c, i) {
  const f = fbGet(c.id, i);
  const btn = (v, icn, lbl, on, onCls) => `<button onclick="qFeedback('${c.id}',${i},'${v}')" class="px-2.5 py-1 rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 border ${on ? onCls : 'border-line text-ink2 hover:border-cx'}">${ic(icn, 'w-3.5 h-3.5')}${lbl}</button>`;
  if (f && f.status === 'checking') return `<div class="pt-3 border-t border-line flex items-center gap-2 text-[12.5px] c-blue"><span class="typing"><span></span><span></span><span></span></span>The agent is re-checking this answer…</div>`;
  if (f && f.status === 'done') {
    const o = { revised: ['tn-amber', 'Answer revised', 'The agent could not confirm its original answer, so it removed it from the verdict and lowered the confidence.'],
                upheld: ['tn-cx', 'Agent stands by its answer', 'It re-collected the evidence from two other sources and they agree. The confidence is unchanged.'],
                excluded: ['tn-slate', 'Question excluded', 'The agent dropped this question from the verdict and will skip it on similar cases.'] }[f.outcome];
    return `<div class="pt-3 border-t border-line">
      <div class="rounded-xl border p-3 tn ${o[0]}"><div class="text-[12.5px] font-bold">${o[1]}</div><div class="text-[12.5px] text-ink2 mt-0.5">${o[2]}${f.confFrom && f.confFrom !== confLevel(c.conf) ? ` Confidence: <b>${f.confFrom} → ${confLevel(c.conf)}</b>.` : ''}</div>
      ${f.note ? `<div class="text-[12px] text-ink3 mt-1">Your note: “${esc(f.note)}”</div>` : ''}</div>
      <button onclick="qFeedbackUndo('${c.id}',${i})" class="mt-2 text-[12px] text-ink3 hover:text-ink underline">Undo my feedback</button></div>`;
  }
  const reasons = [['answer', 'The answer is wrong'], ['evidence', 'The evidence is wrong'], ['irrelevant', 'Not relevant to this case']];
  return `<div class="pt-3 border-t border-line space-y-2">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-[12px] text-ink3 mr-1">Is this right?</span>
      ${btn('up', 'thumbs-up', 'Correct', f && f.v === 'up', 'bg-cx/10 border-cx c-cx')}
      ${btn('down', 'thumbs-down', 'Wrong', f && f.v === 'down', 'bg-amber-500/10 border-amber-500 c-amber')}
      ${f && f.v === 'up' ? `<span class="text-[12px] text-ink3">Thanks, the agent will trust this pattern more.</span>` : ''}
    </div>
    ${f && f.v === 'down' ? `<div class="rounded-xl bg-sunk p-3 space-y-2">
      <div class="flex flex-wrap gap-1.5">${reasons.map(([k, l]) => `<button onclick="S.fb['${c.id}'][${i}].reason='${k}';openCaseDrawer('${c.id}',true)" class="px-2.5 py-1 rounded-lg text-[12px] font-semibold border ${f.reason === k ? 'bg-ink text-panel border-ink' : 'bg-panel border-line text-ink2 hover:border-cx'}">${l}</button>`).join('')}</div>
      <div class="flex items-center gap-2"><input id="fbn-${c.id}-${i}" placeholder="Tell the agent what it missed (optional)" onkeydown="if(event.key==='Enter') qFeedbackNote('${c.id}',${i})" class="flex-1 min-w-0 text-[12.5px] px-3 py-2 rounded-lg bg-panel border border-line text-ink placeholder:text-ink4 focus:outline-none focus:border-cx">
        <button onclick="qFeedbackNote('${c.id}',${i})" ${f.reason ? '' : 'disabled'} class="px-3 py-2 rounded-lg text-[12px] font-semibold ${f.reason ? 'bg-ink text-panel' : 'bg-line text-ink4 cursor-not-allowed'}">Send to agent</button></div>
    </div>` : ''}
  </div>`;
}
function qFeedback(id, i, v) {
  S.fb = S.fb || {}; S.fb[id] = S.fb[id] || {};
  S.cvQ = S.cvQ || {}; S.cvQ[id] = S.cvQ[id] || {}; S.cvQ[id][i] = true;
  const cur = S.fb[id][i];
  if (cur && cur.v === v) delete S.fb[id][i];
  else {
    S.fb[id][i] = { v };
    if (v === 'up') { pushLog(id, 'user', `Confirmed the answer to Q${i + 1}`, 'Analyst feedback'); toast(`Q${i + 1} confirmed`, 'thumbs-up'); }
  }
  openCaseDrawer(id, true);
}
function qFeedbackNote(id, i) {
  const f = S.fb[id][i]; if (!f || !f.reason) return;
  const el = $(`fbn-${id}-${i}`); f.note = (el && el.value.trim()) || '';
  f.status = 'checking';
  const c = byId(id);
  pushLog(id, 'user', `Flagged Q${i + 1}: ${({ answer: 'answer is wrong', evidence: 'evidence is wrong', irrelevant: 'not relevant' })[f.reason]}`, f.note || 'The agent is re-checking');
  S.thinking = true; renderCopilot();
  openCaseDrawer(id, true);
  setTimeout(() => {
    S.thinking = false;
    const inv = investigation(c), q = inv.Q[i];
    f.confFrom = confLevel(c.conf); f.confOrig = c.conf;
    if (f.reason === 'evidence') f.outcome = 'upheld';
    else if (f.reason === 'irrelevant') { f.outcome = 'excluded'; if (q && q.impact === 'Strong support') c.conf = Math.max(50, c.conf - 12); }
    else { f.outcome = 'revised'; c.conf = c.conf >= 85 ? 74 : c.conf >= 65 ? 58 : c.conf; }
    f.status = 'done';
    const msg = { upheld: 'Agent stands by its answer', excluded: 'Question excluded', revised: `Answer revised, confidence now ${confLevel(c.conf)}` }[f.outcome];
    addWl(c, { type: 'system', title: `Re-check of Q${i + 1}: ${msg}`, detail: f.note || 'Triggered by analyst feedback', by: 'agent', status: 'Re-checked' });
    pushLog(id, f.outcome === 'upheld' ? 'ok' : 'warn', msg, `Q${i + 1} · after analyst feedback`);
    toast(msg, f.outcome === 'upheld' ? 'check' : 'flag');
    c._m = null; S.cvSig = null; S.briefSig = null;
    refresh(); openCaseDrawer(id, true); renderCopilot();
  }, 1800);
}
function qFeedbackUndo(id, i) {
  const f = fbGet(id, i), c = byId(id); if (!f) return;
  if (f.confOrig) c.conf = f.confOrig;
  delete S.fb[id][i];
  pushLog(id, 'user', `Withdrew feedback on Q${i + 1}`, '');
  S.cvSig = null; S.briefSig = null; refresh(); openCaseDrawer(id, true);
}

function gapsHTML(c) {
  const inv = investigation(c);
  return `<section class="mt-4 rounded-2xl border border-dashed border-line2 p-5">
    <div class="text-[14px] font-semibold text-ink flex items-center gap-2">${ic('eye-off', 'w-4 h-4 text-ink3')}What the agent didn’t check</div>
    <p class="text-[12px] text-ink3 mt-0.5">Blind spots worth knowing before you decide.</p>
    <ul class="mt-2.5 space-y-1.5">${inv.gaps.map(g => `<li class="flex gap-2 text-[13px] text-ink2"><span class="text-ink4 mt-[1px]">${ic('minus', 'w-3.5 h-3.5')}</span>${esc(g)}</li>`).join('')}</ul>
  </section>`;
}