/* ======================================================================
   SECOPS ENGINEERING · THE AGENT PANEL AND THE AGENTIC TASK
   The panel is one conversation with the agents. A task is shown inside it:
   the trigger, what the agents said to each other, the card with the one
   decision, and the open prompt bar underneath.
   ====================================================================== */
const mRunning = t => t.status === 'progress' && !!t.live;
const mAnalyzing = t => `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-line2 text-[12px] text-ink3 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Analyzing</span>`;
/* The AI suggestion cell used by every native table. */
function mSugCell(rv) {
  if (rv.task && mRunning(rv.task)) return `<button onclick="event.stopPropagation();mOpenTask('${rv.task.id}')" data-sug="${rv.task.id}">${mAnalyzing()}</button>`;
  return mSug(rv.sug, { task: rv.task && rv.sug !== 'Keep' ? rv.task : null, declined: rv.declined });
}
const mConfCell = rv => rv.task && mRunning(rv.task) ? '<span class="text-ink4">—</span>' : mConf(rv.sug ? rv.conf : '');

function mSec(title, body, right = '') { return `<section class="rounded-xl border border-line bg-card p-3.5"><div class="flex items-center justify-between gap-3 mb-2"><h3 class="text-[11.5px] font-bold tracking-wide text-ink3 uppercase">${title}</h3>${right}</div>${body}</section>`; }
function mFold(t, key, title, body) {
  const k = t.id + ':' + key, on = !!M.more[k];
  return `<section class="rounded-xl border border-line bg-card"><button onclick="M.more['${k}']=!M.more['${k}'];mPanelRender();icons()" class="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left"><span class="text-[11.5px] font-bold tracking-wide text-ink3 uppercase">${title}</span><span class="text-ink3">${ic(on ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</span></button>${on ? `<div class="px-3.5 pb-3.5">${body}</div>` : ''}</section>`;
}

/* The chain from data source to rule. The step where the problem starts is marked. */
function mChain(layer, sug) {
  const tone = (MY_SUGGEST[sug] || ['slate'])[0];
  return `<div class="flex items-stretch gap-0.5">${MY_LAYERS.map(([k, n, i], idx) => { const on = k === layer;
    return `${idx ? `<span class="self-center text-ink4">${ic('chevron-right', 'w-3 h-3')}</span>` : ''}<div class="flex-1 min-w-0 rounded-lg px-1 py-1.5 text-center border ${on ? `tn tn-${tone} m-pulse` : 'border-line bg-sunk text-ink3'}" title="${n}${on ? ': the problem starts here' : ': checked'}">
      <div class="flex justify-center">${ic(on ? 'triangle-alert' : i, 'w-3.5 h-3.5')}</div><div class="text-[10.5px] mt-0.5 font-semibold truncate ${on ? '' : 'text-ink3'}">${n}</div></div>`; }).join('')}</div>`;
}
function mBlock(b, side) {
  if (!b) return '';
  const head = `<div class="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-line text-[11.5px]"><span class="font-bold ${side === 'rec' ? 'c-cx' : 'text-ink3'}">${side === 'rec' ? 'SUGGESTED' : 'CURRENT'}</span><span class="text-ink3 truncate">${esc(b.label)}</span></div>`;
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
  const W = M.W, out = [], chip = (oc, icon, label) => `<button onclick="${oc}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line hover:border-line2 text-[12.5px] text-ink2 text-left">${ic(icon, 'w-3.5 h-3.5 text-ink3 shrink-0')}${label}</button>`;
  (t.affects.rules || []).concat(t.affects.suggested && !(t.affects.rules || []).includes(t.affects.suggested) ? [t.affects.suggested] : []).forEach(id => { const r = mRule(id); if (r) out.push(chip(`mOpenRule(${id})`, 'file-code-2', `${esc(r.name)} <span class="font-mono text-ink4">${id}</span>`)); });
  (t.affects.iocs || []).forEach(id => { const i = W.iocs.find(x => x.id === id); if (i) out.push(chip(`mPivot('${t.id}','iocs')`, 'fingerprint', `IOC rule ${id} · ${esc(i.type)}`)); });
  if (t.affects.node) { const p = W.pipes.find(x => x.id === t.affects.node.pipe), st = t.affects.node.stage; if (st !== 'source') out.push(chip(`mOpenNode('${p.id}','${st}')`, MY_LAYER[st].icon, `${esc(MY_LAYER[st].name)} step · ${esc(p.product)}`)); }
  const src = W.sources.find(s => s.id === t.affects.source);
  if (src) out.push(chip(`mOpenSource('${src.id}')`, 'cable', esc(src.name)));
  return out.join('');
}
function mFb(t, key, label) {
  const v = (t.fb || {})[key];
  return `<div class="flex items-center justify-between gap-3 text-[12.5px]"><span class="text-ink3">${label}</span><span class="flex gap-1.5">${[['agree', 'thumbs-up', 'Agree'], ['disagree', 'thumbs-down', 'Disagree']].map(([k, i, l]) => `<button onclick="mFeedback('${t.id}','${key}','${k}')" class="px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 ${v === k ? (k === 'agree' ? 'tn tn-cx' : 'tn tn-rose') : 'border-line text-ink3 hover:text-ink'}">${ic(i, 'w-3.5 h-3.5')}${l}</button>`).join('')}</span></div>`;
}
function mFeedback(id, key, v) { const t = mTask(id); t.fb = t.fb || {}; t.fb[key] = t.fb[key] === v ? null : v; mPanelRender(); icons(); }

/* ---------- pieces of the conversation ---------- */
const mBubble = (k, html, tail = '') => `<div class="flex gap-2.5">${mAv(k, 26)}<div class="min-w-0 flex-1"><div class="text-[11.5px] font-semibold mb-1" style="color:${M_AG[k].hex}">${M_AG[k].name}</div><div class="rounded-2xl rounded-tl-md px-3.5 py-2.5 bg-card border border-line text-[13.5px] text-ink2 leading-relaxed">${html}</div>${tail}</div></div>`;
const mUserMsg = text => `<div class="flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 bg-indigo-500/25 text-ink text-[13.5px]">${esc(text)}</div></div>`;
function mChatHtml(key) {
  const out = (M.chats[key] || []).map(m => m.role === 'user' ? mUserMsg(m.text) : mBubble(m.agent || 'det', md(m.text), m.task && m.task !== M.panelTask ? `<button onclick="mOpenTask('${m.task}')" class="mt-1.5 text-[12.5px] font-semibold c-cx inline-flex items-center gap-1">Open ${m.task}${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : ''));
  if (M.typing && M.typing.key === key) out.push(mBubble(M.typing.agent, `<span class="inline-flex gap-1 items-center h-4"><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.2s"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.4s"></span></span>`));
  return out.join('');
}
function mTriggerRow(t) {
  const [trName, trIcon] = MY_TRIGGER[t.trigger.kind], from = t.trigger.from && M_FROM[t.trigger.from];
  return `<div class="flex gap-2.5 text-[12.5px] text-ink3">${from ? mAv(from, 22) : `<span class="w-[22px] h-[22px] rounded-full bg-sunk border border-line flex items-center justify-center shrink-0">${ic(trIcon, 'w-3 h-3')}</span>`}<div class="min-w-0 leading-relaxed"><b class="text-ink2">${trName}${from ? ' from the ' + M_AG[from].name : ''}</b> · ${myAge(Date.now() - t.opened)} ago<br>${esc(t.trigger.text)}</div></div>`;
}

/* ---------- the task card ---------- */
function mCard(t) {
  const W = M.W, d = t.decision, tone = (MY_SUGGEST[t.sug] || ['slate'])[0];
  const head = `<div class="flex items-center gap-2 flex-wrap">${mSug(t.sug, { solid: true })}${mConf(t.conf)}<span class="text-ink4">·</span>${mImpact(t.impact)}<span class="text-[12px] text-ink3">impact</span><span class="ml-auto">${mStatus(t)}</span></div>
    <h2 class="text-[16.5px] font-bold text-ink leading-snug mt-2">${esc(t.title)}</h2>
    <p class="text-[13.5px] text-ink2 leading-relaxed mt-1.5">${esc(t.summary)}</p>`;
  const outcome = t.status === 'done' && t.outcome ? `<section class="rounded-xl border p-3.5 ${['rejected', 'dismissed'].includes(t.end) ? 'border-line bg-sunk' : 'tn tn-cx'}"><div class="text-[11.5px] font-bold tracking-wide uppercase">Outcome</div><p class="text-[13.5px] mt-1 leading-relaxed text-ink">${esc(t.outcome)}</p></section>` : '';
  const both = t.current && t.recommended;
  const cmp = both ? mSec('Current state and suggested change', M.editing === t.id
      ? `<div class="space-y-2">${mBlock(t.current, 'cur')}<div class="rounded-xl border border-cx/40 overflow-hidden"><div class="px-3 py-1.5 border-b border-line text-[11.5px] font-bold c-cx">YOUR VERSION</div><textarea id="m-edit" data-keep spellcheck="false" class="w-full h-36 bg-code text-ink font-mono text-[12px] leading-[1.7] p-3 focus:outline-none">${esc(t.recommended.kind === 'code' ? t.recommended.lines.map(l => l[0]).join('\n') : t.recommended.rows.map(r => r.join(': ')).join('\n'))}</textarea></div></div>`
      : `<div class="${M.sbs ? 'grid grid-cols-2 gap-2' : 'space-y-2'}">${mBlock(t.current, 'cur')}${mBlock(t.recommended, 'rec')}</div>`,
      M.editing === t.id ? '' : `<button onclick="M.sbs=!M.sbs;mPanelRender();icons()" class="text-[12px] text-ink3 hover:text-ink inline-flex items-center gap-1">${ic(M.sbs ? 'rows-2' : 'columns-2', 'w-3.5 h-3.5')}${M.sbs ? 'Stacked' : 'Side by side'}</button>`) : '';
  const canEdit = both && !t.affects.instance && t.card !== 'content';
  const decision = t.status === 'pending' && d ? `<section class="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-3.5">
      <div class="text-[14.5px] font-bold text-ink">${esc(d.q)}</div>
      <div class="text-[12.5px] text-ink3 leading-relaxed mt-1">${esc(d.effect)} <span class="text-ink2">Risk: ${esc(d.risk)}${d.reversible ? ' It can be reversed.' : ''}</span>${d.selfFix ? ` <span class="text-ink2">${esc(d.selfFix)}</span>` : ''}</div>
      <div class="mt-3">${M.editing === t.id
        ? `<div class="flex gap-2"><button onclick="mDecide('${t.id}','edit')" class="flex-[1.6] py-2.5 rounded-xl bg-ink text-panel text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5">${ic('check', 'w-4 h-4')}Approve my version</button><button onclick="M.editing=null;mPanelRender();icons()" class="flex-1 py-2.5 rounded-xl bg-sunk border border-line text-ink2 text-[13.5px] font-semibold">Cancel</button></div>`
        : `<div class="flex gap-2 flex-wrap"><button data-act="approve" onclick="mDecide('${t.id}','approve')" class="flex-[1.6] min-w-[150px] py-2.5 rounded-xl bg-ink text-panel text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 hover:opacity-90">${ic('check', 'w-4 h-4')}${esc(d.approve)}</button>
          ${canEdit ? `<button onclick="M.editing='${t.id}';mPanelRender();icons()" class="flex-1 py-2.5 rounded-xl bg-sunk border border-line text-ink text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:border-line2">${ic('pencil', 'w-4 h-4')}Edit</button>` : ''}
          <button data-act="reject" onclick="mDecide('${t.id}','reject')" class="flex-1 py-2.5 rounded-xl tn tn-rose text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5">${ic('x', 'w-4 h-4')}Reject</button>
          <button onclick="mDecide('${t.id}','dismiss')" class="px-2.5 py-2.5 rounded-xl text-ink3 hover:text-ink text-[12.5px]" title="Not relevant. Do not raise it again.">Dismiss</button></div>`}</div>
    </section>` : t.status === 'progress' ? `<section class="rounded-xl border border-blue-500/40 bg-blue-500/5 p-3.5 flex items-center gap-2.5 text-[13px] text-ink2"><span class="c-blue">${ic('loader', 'w-4 h-4 animate-spin')}</span><span><b class="text-ink">No decision needed now.</b> ${esc(t.progressNote || '')}${t.handed ? '. The task closes on its own when the data arrives.' : '.'}</span></section>` : '';
  const pivots = t.pivots && t.pivots.length ? `<div class="mt-3 pt-3 border-t border-line"><div class="text-[12px] text-ink3 mb-1.5">Open in</div><div class="flex flex-wrap gap-1.5">${t.pivots.map(([v, n, what]) => `<button data-pivot="${v}" onclick="mPivot('${t.id}','${v}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line2 hover:bg-hov text-[12.5px] text-ink font-semibold">${ic('arrow-up-right', 'w-3.5 h-3.5 c-indigo')}${esc(n)}<span class="font-normal text-ink3">· ${esc(what)}</span></button>`).join('')}</div></div>` : '';
  const nx = myPendingTasks(W)[0], mine = M.lastDecision && M.lastDecision.id === t.id;
  const next = t.status !== 'pending' && (mine || nx) ? `<div class="flex items-center justify-between gap-3 pt-1"><span class="text-[13px] text-ink2 inline-flex items-center gap-2"><span class="c-cx">${ic('circle-check', 'w-4 h-4')}</span>${esc(mine ? M.lastDecision.text : `${myPendingTasks(W).length} decision${myPendingTasks(W).length === 1 ? '' : 's'} still waiting.`)}</span>${nx ? `<button data-act="next" onclick="mOpenTask('${nx.id}')" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap">Next decision${ic('arrow-right', 'w-4 h-4')}</button>` : ''}</div>` : '';
  return `<div class="m-card rounded-2xl border border-line2 p-4 space-y-3" style="--mc:${M_AG[t.agent].hex}">
    <div>${head}</div>${outcome}
    ${mSec('Diagnosis', `${mChain(t.layer, t.sug)}<p class="text-[13.5px] text-ink mt-2.5 leading-relaxed">${esc(t.diagnosis)}</p>${t.noise ? `<div class="mt-1.5 text-[12.5px] text-ink3">Noise type: <b class="text-ink2">${esc(t.noise)}</b></div>` : ''}`)}
    ${cmp}
    ${t.validation ? mSec('Validation', mValidation(t.validation), t.validation.silent ? mInfo('A silent test runs the change next to the live rule. It sends no alerts to analysts and uses its own CU budget. It is evidence, not proof: it can miss a rare attack.') : '') : ''}
    ${decision}
    ${mFold(t, 'steps', `Work done · ${t.steps.length} steps`, `<ol class="space-y-2">${t.steps.map((x, i) => `<li class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style="background:${M_AG[t.agent].hex}">${i + 1}</span>${esc(x)}</li>`).join('')}</ol>`)}
    ${mFold(t, 'obj', 'Affected objects', `<div class="flex flex-wrap gap-1.5">${mAffected(t) || '<span class="text-[13px] text-ink3">Nothing in this tenant. The logic belongs to Palo Alto.</span>'}</div>${pivots}`)}
    ${mFold(t, 'fb', 'Feedback', `<div class="space-y-2">${mFb(t, 'diag', 'Is the diagnosis right?')}${t.recommended ? mFb(t, 'rec', 'Is the suggested change right?') : ''}</div>`)}
    ${next}
  </div>`;
}
/* An agent is still running: its steps appear one by one. */
function mWorking(t) {
  const n = Math.min(t.shown || 1, t.steps.length);
  return `<div class="m-card rounded-2xl border border-line2 p-4 space-y-3" style="--mc:${M_AG[t.agent].hex}">
    <div class="flex items-center gap-2">${mAnalyzing()}<span class="ml-auto">${mStatus(t)}</span></div>
    <h2 class="text-[16.5px] font-bold text-ink leading-snug">${esc(t.title)}</h2>
    <ol class="space-y-2">${t.steps.slice(0, n).map((x, i) => `<li class="flex gap-2.5 text-[13px] ${i === n - 1 ? 'text-ink' : 'text-ink2'}"><span class="w-5 h-5 shrink-0 flex items-center justify-center ${i === n - 1 ? 'c-blue' : 'c-cx'}">${ic(i === n - 1 ? 'loader' : 'check', 'w-4 h-4' + (i === n - 1 ? ' animate-spin' : ''))}</span>${esc(x)}</li>`).join('')}</ol>
    <div class="text-[12.5px] c-blue">${esc(t.progressNote || 'Working')}…</div>
  </div>`;
}
function mTaskStream(t) {
  const collab = (t.collab || []).map(([k, text]) => mBubble(k, esc(text))).join('');
  const wait = mRunning(t) && t.answer ? `<div class="flex items-center gap-2 text-[12.5px] text-ink3 pl-9"><span class="c-blue">${ic('loader', 'w-3.5 h-3.5 animate-spin')}</span>Waiting for the ${M_AG[t.answer[0]].name} to return its answer</div>` : '';
  const body = mRunning(t) ? mWorking(t) : mCard(t);
  return `<div class="space-y-3.5">${mTriggerRow(t)}${collab}${wait}
    <div class="flex gap-2.5">${mAv(t.agent, 26)}<div class="min-w-0 flex-1"><div class="text-[11.5px] font-semibold mb-1" style="color:${M_AG[t.agent].hex}">${M_AG[t.agent].name}<span class="font-normal text-ink3"> · ${t.id} · ${esc(MY_CARD[t.card])}</span></div>${body}</div></div>
    ${mChatHtml(t.id)}</div>`;
}

/* ---------- the panel with no task selected: the two agents and what they are doing ---------- */
function mPanelOverview() {
  const W = M.W, st = myStats(W), open = myOpen(W);
  const card = k => { const mine = open.filter(t => mTaskAgents(t).includes(k)), run = W.tasks.find(t => mRunning(t) && (t.answer ? t.answer[0] === k || t.agent === k : t.agent === k));
    return `<div class="rounded-2xl border border-line bg-card p-3.5 text-center"><div class="flex justify-center">${mAv(k, 60, true)}</div><div class="mt-2 text-[14px] font-bold text-ink">${M_AG[k].name}</div><div class="text-[12px] leading-snug" style="color:${M_AG[k].hex}">${M_AG[k].role}</div>
      <div class="mt-2 text-[12px] text-ink3">${mine.length} open task${mine.length === 1 ? '' : 's'}</div>
      <div class="text-[12px] ${run ? 'c-blue' : 'text-ink4'} truncate">${run ? `${run.answer && run.answer[0] === k ? 'Answering on' : 'Working on'} ${run.id}` : 'Standing by'}</div></div>`; };
  const prog = W.tasks.filter(t => t.status === 'progress');
  const icon = { sweep: ['clock', 'text-ink3'], check: ['shield-check', 'c-cx'], task: ['file-plus-2', 'c-amber'], handoff: ['corner-down-right', 'c-blue'], test: ['flask-conical', 'c-indigo'], done: ['circle-check', 'c-cx'] };
  return `<div class="space-y-4">
    <div class="grid grid-cols-2 gap-2.5">${card('det')}${card('pipe')}</div>
    <p class="text-center text-[13px] text-ink3 leading-relaxed">${st.pending ? `${st.pending} task${st.pending === 1 ? '' : 's'} need${st.pending === 1 ? 's' : ''} your decision.` : 'Nothing needs you right now.'} Each agent can pass a task to the other and wait for its answer.</p>
    ${st.pending ? `<button data-act="review" onclick="mReviewAll()" class="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[14px] font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25">${ic('bell-ring', 'w-4 h-4')}Review ${st.pending} decision${st.pending === 1 ? '' : 's'}${ic('arrow-right', 'w-4 h-4')}</button>` : ''}
    ${prog.length ? `<div><div class="text-[11.5px] font-bold tracking-wide text-ink3 uppercase mb-2">In progress</div><div class="rounded-xl border border-line divide-y divide-line overflow-hidden">${prog.map(t => `<button onclick="mOpenTask('${t.id}')" class="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-hov">${mAvs(t, 20)}<span class="min-w-0 flex-1"><span class="block text-[13px] text-ink truncate">${esc(t.title)}</span><span class="block text-[11.5px] c-blue truncate">${esc(t.progressNote || 'In progress')}</span></span><span class="text-ink4">${ic('chevron-right', 'w-4 h-4')}</span></button>`).join('')}</div></div>` : ''}
    ${mChatHtml('_')}
    <div><div class="text-[11.5px] font-bold tracking-wide text-ink3 uppercase mb-2">Activity</div><div class="space-y-2.5">${W.log.slice(0, 10).map(l => { const m = icon[l.kind] || ['dot', 'text-ink3'];
      return `<div class="flex gap-2.5 text-[12.5px]"><span class="${m[1]} mt-0.5 shrink-0">${ic(m[0], 'w-3.5 h-3.5')}</span><div class="min-w-0"><div class="text-ink2 leading-snug">${esc(l.text)}</div><div class="text-[11px] text-ink4 font-mono">${myAge(Date.now() - l.t)} ago</div></div></div>`; }).join('')}</div></div>
  </div>`;
}

function mPanelRender() {
  mPanelShow(); if (!mPanelOn()) return;
  const W = M.W, t = M.panelTask && mTask(M.panelTask), pend = myPendingTasks(W), native = M.view !== 'work' || !mWide();
  const close = native ? `<button onclick="mClosePanel()" class="p-2 -mr-1.5 rounded-lg hover:bg-hov text-ink2" title="Close the panel (Esc)">${ic('x', 'w-[18px] h-[18px]')}</button>` : '';
  if (t) {
    const idx = pend.findIndex(x => x.id === t.id);
    $('m-panel-head').innerHTML = `<div class="flex items-center gap-1.5 min-w-0"><button onclick="mPanelHome()" class="p-1.5 -ml-1.5 rounded-lg hover:bg-hov text-ink2" title="All tasks (Esc)">${ic('arrow-left', 'w-4 h-4')}</button><span class="text-[13px] font-bold text-ink font-mono whitespace-nowrap">${t.id}</span><span class="text-[12px] text-ink3 truncate">· ${esc(MY_CARD[t.card])}</span></div>
      <div class="flex items-center gap-1 shrink-0">${idx >= 0 && pend.length > 1 ? `<span class="text-[11.5px] text-ink3 mr-1">Decision ${idx + 1} of ${pend.length}</span><button onclick="mOpenTask('${pend[(idx - 1 + pend.length) % pend.length].id}')" class="p-1.5 rounded-lg hover:bg-hov text-ink2" title="Previous decision">${ic('chevron-left', 'w-4 h-4')}</button><button onclick="mOpenTask('${pend[(idx + 1) % pend.length].id}')" class="p-1.5 rounded-lg hover:bg-hov text-ink2" title="Next decision">${ic('chevron-right', 'w-4 h-4')}</button>` : ''}${close}</div>`;
    $('m-panel-scroll').innerHTML = mTaskStream(t);
  } else {
    $('m-panel-head').innerHTML = `<div class="flex items-center gap-2 min-w-0"><span class="inline-flex items-center">${mAv('det', 22)}<span class="-ml-1.5">${mAv('pipe', 22)}</span></span><span class="text-[13px] font-bold text-ink tracking-wide truncate">SecOps Engineering agents</span></div>
      <div class="flex items-center gap-1 shrink-0"><button onclick="mReviewAll()" class="relative p-2 rounded-xl hover:bg-hov text-ink2" title="Decisions (C)">${ic('bell', 'w-[18px] h-[18px]')}${pend.length ? `<span class="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold font-mono flex items-center justify-center">${pend.length}</span>` : ''}</button>${close}</div>`;
    $('m-panel-scroll').innerHTML = mPanelOverview();
  }
  const chips = t ? (t.status === 'pending' && t.decision && M.editing !== t.id ? [[t.decision.approve, `mDecide('${t.id}','approve')`, true]] : []).concat(mRunning(t) ? [['What are you checking?', "mSend('What are you checking?')"]] : [['Why?', "mSend('Why do you suggest this?')"], ['What is the risk?', "mSend('What is the risk?')"], ['What if I wait?', "mSend('What happens if I wait?')"], ['Which agents worked on it?', "mSend('Which agents worked on this?')"]])
    : (pend.length ? [[`Review ${pend.length} decision${pend.length === 1 ? '' : 's'}`, 'mReviewAll()', true]] : []).concat([['What changed since yesterday?', "mSend('What changed since yesterday?')"], ['Why did SentinelOne break?', "mSend('Why did SentinelOne break?')"], ['Are we covered for impossible travel?', "mSend('Are we covered for impossible travel?')"]]);
  $('m-panel-chips').innerHTML = chips.map(([l, f, hot]) => `<button onclick="${f}" class="px-3 py-1.5 rounded-full border text-[12.5px] ${hot ? 'border-amber-500/60 c-amber font-bold bg-amber-500/10 hover:bg-amber-500/20' : 'border-line2 text-ink2 hover:text-ink hover:bg-hov'}">${hot ? '✓ ' : ''}${esc(l)}</button>`).join('');
  $('m-panel-ctx').textContent = t ? t.id : 'All tasks';
  $('m-cmd').placeholder = t ? `Ask about ${t.id}, or tell the agents what to change…` : 'Ask the agents, or tell them what to check…';
}
function mPanelBottom() { const sc = $('m-panel-scroll'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); }

/* ---------- deciding ---------- */
function mDecide(id, choice) {
  const t = mTask(id); if (!t || t.status !== 'pending') return;
  if (choice === 'edit') { const ta = $('m-edit'); if (ta && t.recommended.kind === 'code') t.recommended.lines = ta.value.split('\n').map(l => [l, 'add']); t.editedBy = M_USER; }
  myApply(M.W, t, choice, M_USER);
  M.editing = null;
  const left = myPendingTasks(M.W).length;
  const said = choice === 'reject' ? 'Rejected. Nothing changed.' : choice === 'dismiss' ? 'Dismissed.' : t.status === 'progress' ? 'Sent. ' + (t.progressNote || '') + '.' : choice === 'edit' ? 'Your version is applied.' : 'Approved and applied.';
  M.lastDecision = { id, text: `${said} ${left ? left + ' decision' + (left === 1 ? '' : 's') + ' left.' : 'Nothing else is waiting.'}` };
  if (!(mPanelOn() && M.panelTask === id)) toast(`${t.id}: ${said}`, choice === 'reject' || choice === 'dismiss' ? 'x' : 'check');
  mRender();
  if (mPanelOn() && M.panelTask === id) mPanelBottom();
}
function mReviewAll() { const nx = myPendingTasks(M.W)[0]; if (!nx) return toast('Nothing is waiting for you', 'check'); mOpenTask(nx.id); }

/* ---------- the prompt bar ---------- */
function mSend(q) {
  const el = $('m-cmd'); q = (q || el.value || '').trim(); if (!q) return; el.value = '';
  const t = M.panelTask && mTask(M.panelTask), key = t ? t.id : '_';
  (M.chats[key] = M.chats[key] || []).push({ role: 'user', text: q });
  const a = t ? mTaskAnswer(t, q) : mAnswer(q);
  M.typing = { key, agent: a.agent || 'det' }; mPanelRender(); icons(); mPanelBottom();
  setTimeout(() => {
    M.typing = null; M.chats[key].push({ role: 'agent', agent: a.agent || 'det', text: a.text, task: a.task });
    if (a.act) mDecide(t.id, a.act); else { mPanelRender(); icons(); }
    mPanelBottom();
  }, 650);
}
/* Scripted answers about one task. Every fact is read from the task, not typed again. */
function mTaskAnswer(t, q) {
  const l = q.toLowerCase(), W = M.W, d = t.decision, ag = t.agent;
  const rules = (t.affects.rules || []).map(id => mRule(id)).filter(Boolean);
  if (mRunning(t)) return { agent: ag, text: `I am still working on this. So far: ${t.steps.slice(0, t.shown || 1).map(x => x.charAt(0).toLowerCase() + x.slice(1)).join('; ')}. I will ask for a decision when the work is done.` };
  if (t.status === 'pending' && /^(approve|yes|go ahead|do it|adopt|apply)\b/.test(l)) return { agent: ag, text: 'Done. I applied it as suggested.', act: 'approve' };
  if (t.status === 'pending' && /^(reject|no\b|decline)/.test(l)) return { agent: ag, text: 'Understood. Nothing changes.', act: 'reject' };
  if (/risk|safe|revers|undo|roll/.test(l)) return { agent: ag, text: d ? `**Risk: ${d.risk}**${d.reversible ? '\nThe change can be reversed.' : ''}${t.validation ? `\n${t.validation.note}` : ''}` : `This task is ${mStatusTxt(t).toLowerCase()}. No change is waiting.` };
  if (/wait|later|nothing|ignore|not now/.test(l)) { const n = rules.length;
    const cost = { Fix: `the problem stays: ${n ? `${n} rule${n === 1 ? '' : 's'} keep${n === 1 ? 's' : ''} working on missing or wrong data` : 'the data stays missing'}`, Tune: 'the noise stays at the same level', Drop: 'the unused detection logic stays enabled', Adopt: 'the gap stays open', Connect: 'the detections that need this source stay unavailable', Watch: 'nothing is lost, I keep checking' }[t.sug] || 'nothing changes';
    return { agent: ag, text: `Nothing changes until you decide, so ${cost}. The task stays in the Pending list, ranked by impact (**${t.impact}**).` }; }
  if (/agent|who|pipeline|worked|escalat/.test(l)) { const ks = mTaskAgents(t);
    return { agent: ag, text: ks.length > 1 ? `Two agents worked on this.\n${(t.collab || []).map(([k, x]) => `• **${M_AG[k].name}:** ${x}`).join('\n')}` : `Only the ${M_AG[ag].name} worked on this. The root cause is at the ${MY_LAYER[t.layer].name.toLowerCase()} step, so no escalation was needed.` }; }
  if (/rule|affect|object|which|what.*chang/.test(l)) return { agent: ag, text: rules.length ? `It affects **${rules.length} rule${rules.length === 1 ? '' : 's'}**:\n${rules.map(r => `• ${r.name} (ID ${r.id})`).join('\n')}${d ? `\n\n${d.effect}` : ''}` : (d ? d.effect : t.summary) };
  if (/why|how|explain|evidence|proof|sure|confiden/.test(l)) return { agent: ag, text: `${t.diagnosis}\n\nHow I got there:\n${t.steps.map(x => `• ${x}`).join('\n')}\n\nConfidence: **${t.conf}**.` };
  if (/option|alternativ|else|other/.test(l)) return { agent: ag, text: `You can approve the change as it is${t.current && t.recommended && !t.affects.instance ? ', edit it and approve your version' : ''}, reject it, or dismiss it so it is not raised again. Rejecting changes nothing and keeps the suggestion visible on the affected objects.` };
  const g = mAnswer(q); return g.fallback ? { agent: ag, text: `${t.summary}\n\nAsk me why I suggest this, what the risk is, what happens if you wait, or which rules are affected.` } : g;
}
