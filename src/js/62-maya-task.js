/* ======================================================================
   MAYA · THE AGENTIC TASK
   One task shows the work Maya did and the one decision she needs. The
   current state and the recommended change are inside the task, so the
   user decides here and opens a native screen only if they want to.
   ====================================================================== */
function mSec(title, body, right = '') { return `<section class="rounded-2xl border border-line bg-card p-4"><div class="flex items-center justify-between gap-3 mb-2.5"><h3 class="text-[12px] font-bold tracking-wide text-ink3 uppercase">${title}</h3>${right}</div>${body}</section>`; }

/* The chain from data source to rule. The step where the problem starts is marked. */
function mChain(layer, verdict) {
  const tone = (MY_VERDICT[verdict] || ['slate'])[0];
  return `<div class="flex items-stretch gap-1">${MY_LAYERS.map(([k, n, i], idx) => { const on = k === layer;
    return `${idx ? `<span class="self-center text-ink4">${ic('chevron-right', 'w-3.5 h-3.5')}</span>` : ''}<div class="flex-1 min-w-0 rounded-xl px-2 py-2 text-center border ${on ? `tn tn-${tone} m-pulse` : 'border-line bg-sunk text-ink3'}">
      <div class="flex justify-center">${ic(on ? 'triangle-alert' : i, 'w-4 h-4')}</div><div class="text-[11.5px] mt-1 font-semibold truncate ${on ? '' : 'text-ink3'}">${n}</div><div class="text-[10.5px] ${on ? '' : 'text-ink4'}">${on ? 'starts here' : 'checked'}</div></div>`; }).join('')}</div>`;
}
function mBlock(b, side) {
  if (!b) return '';
  const head = `<div class="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-line text-[11.5px]"><span class="font-bold ${side === 'rec' ? 'c-cx' : 'text-ink3'}">${side === 'rec' ? 'RECOMMENDED' : 'CURRENT'}</span><span class="text-ink3 truncate">${esc(b.label)}</span></div>`;
  if (b.kind === 'code') return `<div class="rounded-xl border ${side === 'rec' ? 'border-cx/40' : 'border-line'} bg-code overflow-hidden min-w-0">${head}<pre class="px-0 py-2 text-[12px] leading-[1.7] font-mono overflow-x-auto">${b.lines.map(([l, f]) => `<div class="px-3 ${f === 'del' ? 'm-del' : f === 'add' ? 'm-add' : 'text-ink2'}"><span class="select-none inline-block w-4 opacity-60">${f === 'del' ? '−' : f === 'add' ? '+' : ' '}</span>${esc(l)}</div>`).join('')}</pre></div>`;
  return `<div class="rounded-xl border ${side === 'rec' ? 'border-cx/40' : 'border-line'} bg-sunk overflow-hidden min-w-0">${head}<div class="divide-y divide-line">${b.rows.map(([k, v]) => `<div class="px-3 py-2 flex gap-3 text-[13px]"><span class="w-[42%] shrink-0 text-ink3">${esc(k)}</span><span class="min-w-0 ${side === 'rec' ? 'text-ink font-semibold' : 'text-ink2'}">${esc(v)}</span></div>`).join('')}</div></div>`;
}
function mValidation(v) {
  if (!v) return '';
  return `<div class="space-y-3">${v.rows.map(([l, a, b, mx]) => `<div><div class="flex justify-between text-[12.5px] text-ink2 mb-1"><span>${esc(l)}</span><span class="font-mono"><span class="text-ink3">${a.toLocaleString()}</span> → <b class="c-cx">${b.toLocaleString()}</b></span></div>
    <div class="space-y-1"><div class="h-2 rounded-full bg-sunk overflow-hidden"><div class="h-full rounded-full bg-slate-400" style="width:${Math.max(a ? 2 : 0, a / mx * 100)}%"></div></div><div class="h-2 rounded-full bg-sunk overflow-hidden"><div class="h-full rounded-full bg-cx" style="width:${Math.max(b ? 2 : 0, b / mx * 100)}%"></div></div></div></div>`).join('')}
    <div class="text-[11.5px] text-ink3 flex gap-3"><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400"></span>Today</span><span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-cx"></span>With the change</span></div>
    <p class="text-[12.5px] text-ink3 leading-relaxed">${esc(v.note)}</p></div>`;
}
function mAffected(t) {
  const W = M.W, out = [];
  (t.affects.rules || []).forEach(id => { const r = mRule(id); if (r) out.push(`<button onclick="mOpenRule(${id})" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line hover:border-line2 text-[12.5px] text-ink2">${ic('file-code-2', 'w-3.5 h-3.5 text-ink3')}${esc(r.name)} <span class="font-mono text-ink4">${id}</span></button>`); });
  if (t.affects.node) { const p = W.pipes.find(x => x.id === t.affects.node.pipe), st = t.affects.node.stage; if (st !== 'source') out.push(`<button onclick="mOpenNode('${p.id}','${st}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line hover:border-line2 text-[12.5px] text-ink2">${ic(MY_LAYER[st].icon, 'w-3.5 h-3.5 text-ink3')}${esc(MY_LAYER[st].name)} step · ${esc(p.product)}</button>`); }
  const src = W.sources.find(s => s.id === t.affects.source);
  if (src) out.push(`<button onclick="mOpenSource('${src.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line hover:border-line2 text-[12.5px] text-ink2">${ic('cable', 'w-3.5 h-3.5 text-ink3')}${esc(src.name)}</button>`);
  return out.join('');
}
function mFb(t, key, label) {
  const v = (t.fb || {})[key];
  return `<div class="flex items-center justify-between gap-3 text-[12.5px]"><span class="text-ink3">${label}</span><span class="flex gap-1.5">${[['agree', 'thumbs-up', 'Agree'], ['disagree', 'thumbs-down', 'Disagree']].map(([k, i, l]) => `<button onclick="mFeedback('${t.id}','${key}','${k}')" class="px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 ${v === k ? (k === 'agree' ? 'tn tn-cx' : 'tn tn-rose') : 'border-line text-ink3 hover:text-ink'}">${ic(i, 'w-3.5 h-3.5')}${l}</button>`).join('')}</span></div>`;
}
function mFeedback(id, key, v) { const t = mTask(id); t.fb = t.fb || {}; t.fb[key] = t.fb[key] === v ? null : v; mSheetRender(); icons(); }

function mTaskSheet(s) {
  const t = mTask(s.id), W = M.W, pend = myPendingTasks(W), idx = pend.findIndex(x => x.id === t.id);
  const [trName, trIcon] = MY_TRIGGER[t.trigger.kind];
  const sub = `<div class="mt-2 flex items-center gap-2 flex-wrap">${mChip(t.verdict)}${mConf(t.conf)}<span class="text-ink4">·</span>${mImpact(t.impact)}<span class="text-[12px] text-ink3">impact</span><span class="text-ink4">·</span>${mStatus(t)}${t.progressNote && t.status === 'progress' ? `<span class="text-[12px] text-ink3">${esc(t.progressNote)}</span>` : ''}</div>`;
  const crumb = `<span class="inline-flex items-center gap-1.5">${agentAv(mP(), 18, false)}<b class="text-ink2">Maya</b> · SecOps Engineer · detection engineering · <span class="font-mono">${t.id}</span> · ${esc(MY_CARD[t.card])}</span>`;
  const walk = idx >= 0 && pend.length > 1 ? `<div class="px-5 py-1.5 border-b border-line bg-panel2 flex items-center justify-between text-[12px] text-ink3 shrink-0"><span>Decision ${idx + 1} of ${pend.length}</span><span class="flex gap-1"><button onclick="mOpenTask('${pend[(idx - 1 + pend.length) % pend.length].id}')" class="px-2 py-0.5 rounded-md hover:bg-hov hover:text-ink inline-flex items-center gap-1">${ic('chevron-left', 'w-3.5 h-3.5')}Previous</button><button onclick="mOpenTask('${pend[(idx + 1) % pend.length].id}')" class="px-2 py-0.5 rounded-md hover:bg-hov hover:text-ink inline-flex items-center gap-1">Next${ic('chevron-right', 'w-3.5 h-3.5')}</button></span></div>` : '';

  const both = t.current && t.recommended;
  const cmp = both ? mSec('Current state and recommended change', M.editing === t.id
      ? `<div class="space-y-2">${mBlock(t.current, 'cur')}<div class="rounded-xl border border-cx/40 overflow-hidden"><div class="px-3 py-1.5 border-b border-line text-[11.5px] font-bold c-cx">YOUR VERSION</div><textarea id="m-edit" spellcheck="false" class="w-full h-36 bg-code text-ink font-mono text-[12px] leading-[1.7] p-3 focus:outline-none">${esc(t.recommended.kind === 'code' ? t.recommended.lines.map(l => l[0]).join('\n') : t.recommended.rows.map(r => r.join(': ')).join('\n'))}</textarea></div></div>`
      : `<div class="${M.sbs ? 'grid grid-cols-2 gap-2' : 'space-y-2'}">${mBlock(t.current, 'cur')}${mBlock(t.recommended, 'rec')}</div>`,
      M.editing === t.id ? '' : `<button onclick="M.sbs=!M.sbs;mSheetRender();icons()" class="text-[12px] text-ink3 hover:text-ink inline-flex items-center gap-1">${ic(M.sbs ? 'rows-2' : 'columns-2', 'w-3.5 h-3.5')}${M.sbs ? 'Stacked' : 'Side by side'}</button>`) : '';

  const pivots = t.pivots && t.pivots.length ? `<div class="mt-3 pt-3 border-t border-line"><div class="text-[12px] text-ink3 mb-1.5">Open in</div><div class="flex flex-wrap gap-1.5">${t.pivots.map(([v, n, what]) => `<button onclick="mPivot('${t.id}','${v}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line2 hover:bg-hov text-[12.5px] text-ink font-semibold">${ic('arrow-up-right', 'w-3.5 h-3.5 c-indigo')}${esc(n)}<span class="font-normal text-ink3">· ${esc(what)}</span></button>`).join('')}</div></div>` : '';

  const body = `
    <div class="text-[14.5px] text-ink2 leading-relaxed">${esc(t.summary)}</div>
    ${t.status === 'done' && t.outcome ? `<section class="rounded-2xl border p-4 ${['rejected', 'dismissed'].includes(t.end) ? 'border-line bg-sunk' : 'tn tn-cx'}"><div class="text-[12px] font-bold tracking-wide uppercase">Outcome</div><p class="text-[13.5px] mt-1 leading-relaxed text-ink">${esc(t.outcome)}</p></section>` : ''}
    ${mSec('Diagnosis', `${mChain(t.layer, t.verdict)}<p class="text-[13.5px] text-ink mt-3 leading-relaxed">${esc(t.diagnosis)}</p>${t.noise ? `<div class="mt-2 text-[12.5px] text-ink3">Noise type: <b class="text-ink2">${esc(t.noise)}</b></div>` : ''}`)}
    ${cmp}
    ${t.validation ? mSec('Validation', mValidation(t.validation), t.validation.silent ? mInfo('A silent test runs the change next to the live rule. It sends no alerts to analysts and uses its own CU budget. It is evidence, not proof: it can miss a rare attack.') : '') : ''}
    ${mSec('Work done', `<ol class="space-y-2">${t.steps.map((x, i) => `<li class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style="background:${mP().col}">${i + 1}</span>${esc(x)}</li>`).join('')}</ol>`)}
    ${mSec('Trigger', `<div class="flex gap-2.5 text-[13px] text-ink2">${t.trigger.from ? agentAv(PILLARS[t.trigger.from], 22, false) : `<span class="w-[22px] h-[22px] rounded-full bg-sunk border border-line flex items-center justify-center text-ink3 shrink-0">${ic(trIcon, 'w-3 h-3')}</span>`}<div><b class="text-ink">${trName}${t.trigger.from ? ' from ' + PILLARS[t.trigger.from].name : ''}.</b> ${esc(t.trigger.text)}<div class="text-[12px] text-ink3 mt-1">Opened ${myWhen(t.opened)} by Maya${t.by ? ` · ${t.status === 'done' ? 'closed' : 'decided'} by ${esc(t.by)}` : ''}</div></div></div>`)}
    ${mSec('Affected objects', `<div class="flex flex-wrap gap-1.5">${mAffected(t) || '<span class="text-[13px] text-ink3">Nothing in this tenant. The logic belongs to Palo Alto.</span>'}</div>${pivots}`)}
    ${mSec('Feedback', `<div class="space-y-2">${mFb(t, 'diag', 'Is the diagnosis right?')}${t.recommended ? mFb(t, 'rec', 'Is the recommended change right?') : ''}</div>`)}`;

  const d = t.decision;
  const foot = t.status === 'pending' && d ? `<div class="px-5 pt-3 pb-4 border-t border-line bg-panel shrink-0">
      <div class="flex items-start gap-2.5 mb-2.5"><span class="mt-0.5 c-amber">${ic('circle-help', 'w-4 h-4')}</span><div class="min-w-0"><div class="text-[14.5px] font-bold text-ink">${esc(d.q)}</div><div class="text-[12.5px] text-ink3 leading-snug mt-0.5">${esc(d.effect)} <span class="text-ink2">Risk: ${esc(d.risk)}${d.reversible ? ' It can be reversed.' : ''}</span>${d.selfFix ? ` <span class="text-ink2">${esc(d.selfFix)}</span>` : ''}</div></div></div>
      ${M.editing === t.id
        ? `<div class="flex gap-2"><button onclick="mDecide('${t.id}','edit')" class="flex-[1.6] py-2.5 rounded-xl bg-ink text-panel text-[14px] font-bold inline-flex items-center justify-center gap-1.5">${ic('check', 'w-4 h-4')}Approve my version</button><button onclick="M.editing=null;mSheetRender();icons()" class="flex-1 py-2.5 rounded-xl bg-sunk border border-line text-ink2 text-[14px] font-semibold">Cancel</button></div>`
        : `<div class="flex gap-2 flex-wrap"><button onclick="mDecide('${t.id}','approve')" class="flex-[1.6] min-w-[170px] py-2.5 rounded-xl bg-ink text-panel text-[14px] font-bold inline-flex items-center justify-center gap-1.5 hover:opacity-90">${ic('check', 'w-4 h-4')}${esc(d.approve)}</button>
          ${t.current && t.recommended && !t.affects.instance && t.card !== 'content' ? `<button onclick="M.editing='${t.id}';mSheetRender();icons()" class="flex-1 py-2.5 rounded-xl bg-sunk border border-line text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 hover:border-line2">${ic('pencil', 'w-4 h-4')}Edit</button>` : ''}
          <button onclick="mDecide('${t.id}','reject')" class="flex-1 py-2.5 rounded-xl tn tn-rose text-[14px] font-semibold inline-flex items-center justify-center gap-1.5">${ic('x', 'w-4 h-4')}Reject</button>
          <button onclick="mDecide('${t.id}','dismiss')" class="px-3 py-2.5 rounded-xl text-ink3 hover:text-ink text-[13px]" title="Not relevant. Do not raise it again.">Dismiss</button></div>`}
    </div>` : t.status === 'progress' ? `<div class="px-5 py-3 border-t border-line bg-panel shrink-0 flex items-center gap-2.5 text-[13px] text-ink2"><span class="c-blue">${ic('loader', 'w-4 h-4 animate-spin')}</span><span><b class="text-ink">No decision needed yet.</b> ${esc(t.progressNote || '')}${t.handed ? '. The task closes on its own when the data arrives.' : '. Maya comes back when it ends.'}</span></div>` : '';

  /* A finished task always offers the next decision, so coming back from a native screen never ends in a dead end. */
  const nx = myPendingTasks(W)[0], mine = M.lastDecision && M.lastDecision.id === t.id;
  const nextBar = t.status === 'done' && (mine || nx) ? `<div class="px-5 py-3 border-t border-line bg-panel shrink-0 flex items-center justify-between gap-3"><span class="text-[13px] text-ink2 inline-flex items-center gap-2"><span class="c-cx">${ic('circle-check', 'w-4 h-4')}</span>${esc(mine ? M.lastDecision.text : `${mStatusTxt(t)}. ${pend.length} decision${pend.length === 1 ? '' : 's'} still waiting.`)}</span>${nx ? `<button onclick="mOpenTask('${nx.id}')" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap">Next decision${ic('arrow-right', 'w-4 h-4')}</button>` : `<button onclick="mCloseSheet()" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold whitespace-nowrap">All decided. Close</button>`}</div>` : '';

  return `${mSheetHead(crumb, esc(t.title), sub)}${walk}<div id="m-sheet-scroll" class="flex-1 overflow-y-auto px-5 py-4 space-y-3">${body}</div>${foot}${nextBar}`;
}

/* ---------- deciding ---------- */
function mDecide(id, choice) {
  const t = mTask(id); if (!t || t.status !== 'pending') return;
  if (choice === 'edit') { const ta = $('m-edit'); if (ta && t.recommended.kind === 'code') t.recommended.lines = ta.value.split('\n').map(l => [l, 'add']); t.editedBy = M_USER; }
  myApply(M.W, t, choice, M_USER);
  M.editing = null;
  const left = myPendingTasks(M.W).length;
  const said = choice === 'reject' ? 'Rejected. Nothing changed.' : choice === 'dismiss' ? 'Dismissed.' : t.status === 'progress' ? 'Sent. ' + (t.progressNote || '') + '.' : choice === 'edit' ? 'Your version is applied.' : 'Approved and applied.';
  M.lastDecision = { id, text: `${said} ${left ? left + ' decision' + (left === 1 ? '' : 's') + ' left.' : 'Nothing else is waiting.'}` };
  if (!(M.sheet && M.sheet.kind === 'task' && M.sheet.id === id)) toast(`${t.id}: ${said}`, choice === 'reject' || choice === 'dismiss' ? 'x' : 'check');
  mRender();
}
function mReviewAll() { const nx = myPendingTasks(M.W)[0]; if (!nx) return toast('Nothing is waiting for you', 'check'); M.review = true; if (M.view !== 'work') mNav('work'); mOpenTask(nx.id); }
