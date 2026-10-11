/* ======================================================================
   SECOPS · THE PANEL AND THE MISSION CARD
   The panel starts clean: SecOps standing by, ready to talk. The bell opens
   the decisions, one card at a time, with the actions fixed at the bottom
   and a line to ask before deciding.
   ====================================================================== */
const mRunning = t => t.status === 'progress' && !!t.live;
const mAnalyzing = () => `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-line2 text-[12px] text-ink3 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Analyzing</span>`;
/* The AI suggestion cell used by every native table. */
function mSugCell(rv) {
  if (rv.task && mRunning(rv.task)) return `<button onclick="event.stopPropagation();mOpenTask('${rv.task.id}')" data-sug="${rv.task.id}">${mAnalyzing()}</button>`;
  return mSug(rv.sug, { task: rv.task && rv.sug !== 'Keep' ? rv.task : null, declined: rv.declined });
}
const mConfCell = rv => rv.task && mRunning(rv.task) ? '<span class="text-ink4">—</span>' : mConf(rv.sug ? rv.conf : '');

const mLabel = (t, right = '') => `<div class="flex items-center justify-between gap-3"><div class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">${t}</div>${right}</div>`;
function mFold(t, key, title, body, hint = '') {
  const k = t.id + ':' + key, on = !!M.more[k];
  return `<div><button onclick="M.more['${k}']=!M.more['${k}'];mPanelRender();icons()" class="inline-flex items-center gap-1.5 text-[13px] font-semibold c-indigo hover:underline">${on ? title.replace(/^Show/, 'Hide') : title}${ic(on ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</button>${hint && !on ? `<span class="ml-2 text-[12.5px] text-ink3">${hint}</span>` : ''}${on ? `<div class="mt-2.5">${body}</div>` : ''}</div>`;
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
  const head = `<div class="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-line text-[11.5px]"><span class="font-bold ${side === 'rec' ? 'c-cx' : 'text-ink3'}">${side === 'rec' ? 'AFTER' : 'NOW'}</span><span class="text-ink3 truncate">${esc(b.label)}</span></div>`;
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
/* The objects a mission touches. Each one opens its own screen, with the object marked. */
function mAffected(t) {
  const W = M.W, out = [], chip = (view, icon, label) => `<button data-pivot="${view}" onclick="mPivot('${t.id}','${view}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line hover:border-line2 text-[12.5px] text-ink2 text-left">${ic(icon, 'w-3.5 h-3.5 text-ink3 shrink-0')}${label}${ic('arrow-up-right', 'w-3 h-3 c-indigo shrink-0')}</button>`;
  (t.affects.rules || []).concat(t.affects.suggested && !(t.affects.rules || []).includes(t.affects.suggested) ? [t.affects.suggested] : []).forEach(id => { const r = mRule(id); if (r) out.push(chip('rules', 'file-code-2', `${esc(r.name)} <span class="font-mono text-ink4">${id}</span>`)); });
  (t.affects.iocs || []).forEach(id => { const i = W.iocs.find(x => x.id === id); if (i) out.push(chip('iocs', 'fingerprint', `IOC rule ${id} · ${esc(i.type)}`)); });
  if (t.affects.node) { const p = W.pipes.find(x => x.id === t.affects.node.pipe), st = t.affects.node.stage; if (st !== 'source') out.push(chip('streams', MY_LAYER[st].icon, `${esc(MY_LAYER[st].name)} step · ${esc(p.product)}`)); }
  const src = W.sources.find(s => s.id === t.affects.source);
  if (src) out.push(chip('sources', 'cable', esc(src.name)));
  return out.join('');
}
function mFb(t, key, label) {
  const v = (t.fb || {})[key];
  return `<div class="flex items-center justify-between gap-3 text-[12.5px]"><span class="text-ink3">${label}</span><span class="flex gap-1.5">${[['agree', 'thumbs-up', 'Agree'], ['disagree', 'thumbs-down', 'Disagree']].map(([k, i, l]) => `<button onclick="mFeedback('${t.id}','${key}','${k}')" class="px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 ${v === k ? (k === 'agree' ? 'tn tn-cx' : 'tn tn-rose') : 'border-line text-ink3 hover:text-ink'}">${ic(i, 'w-3.5 h-3.5')}${l}</button>`).join('')}</span></div>`;
}
function mFeedback(id, key, v) { const t = mTask(id); t.fb = t.fb || {}; t.fb[key] = t.fb[key] === v ? null : v; mPanelRender(); icons(); }

/* ---------- the conversation ---------- */
const mBubble = (k, html, tail = '') => `<div class="flex gap-2.5">${mAv(k, 26)}<div class="min-w-0 flex-1"><div class="rounded-2xl rounded-tl-md px-3.5 py-2.5 bg-card border border-line text-[13.5px] text-ink2 leading-relaxed">${html}</div>${tail}</div></div>`;
const mUserMsg = text => `<div class="flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 bg-indigo-500/25 text-ink text-[13.5px]">${esc(text)}</div></div>`;
function mChatHtml(key) {
  const out = (M.chats[key] || []).map((m, i) => m.role === 'user' ? mUserMsg(m.text) : mBubble(m.agent || 'sec', md(m.text), m.card ? mChatCard(m.card)
    : m.approval ? (m.done ? `<div class="mt-1.5 text-[12px] text-ink3">${m.done === 'approved' ? 'You approved it.' : 'You declined it.'}</div>` : `<div class="mt-2 flex gap-2"><button data-chatact="ok" onclick="mChatAct('${key}',${i},true)" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold">Run it</button><button onclick="mChatAct('${key}',${i},false)" class="px-3 py-1.5 rounded-lg border border-line2 text-[12.5px] text-ink2 hover:bg-hov">Decline</button></div>`)
    : m.task && m.task !== M.panelTask ? `<button onclick="mOpenTask('${m.task}')" class="mt-1.5 text-[12.5px] font-semibold c-cx inline-flex items-center gap-1">Open ${m.task}${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : ''));
  if (M.typing && M.typing.key === key) out.push(mBubble('sec', `<span class="inline-flex gap-1 items-center h-4"><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.2s"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.4s"></span></span>`));
  return out.length ? `<div class="space-y-3.5">${out.join('')}</div>` : '';
}

/* ---------- the mission card ---------- */
const mLink = id => { const x = mTask(id); return x ? `<button data-link="${id}" onclick="mOpenTask('${id}')" class="inline-flex flex-wrap max-w-full items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sunk border border-line2 hover:bg-hov text-[12.5px] text-ink text-left"><span class="font-mono font-semibold whitespace-nowrap">${id}</span>${mAv(x.agent, 16)}<span class="text-ink2 truncate max-w-[340px]">${esc(x.title)}</span>${mStatus(x)}</button>` : ''; };
function mHow(t) {
  const [trName, trIcon] = MY_TRIGGER[t.trigger.kind], from = t.trigger.from && M_FROM[t.trigger.from];
  const trig = `<div class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full bg-sunk border border-line flex items-center justify-center shrink-0 text-ink3">${ic(trIcon, 'w-3 h-3')}</span><span><b class="text-ink">${trName}${from ? ' from the ' + M_AG[from].name : ''}.</b> ${esc(t.trigger.text)}</span></div>`;
  const steps = t.steps.map((x, i) => `<div class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white bg-indigo-500">${i + 1}</span>${esc(x)}</div>`).join('');
  return `<div>${mLabel('How it got there', `<span class="text-[12.5px] text-ink3 inline-flex items-center gap-2">${mAv(t.agent, 18)}${M_AG[t.agent].name} · ${t.steps.length} steps</span>`)}
    <div class="mt-2 h-1.5 rounded-full bg-sunk overflow-hidden"><div class="h-full rounded-full" style="width:100%;background:linear-gradient(90deg,#5eead4,#818cf8)"></div></div>
    <div class="mt-2">${mFold(t, 'steps', `Show the steps (${t.steps.length})`, `<div class="space-y-2">${trig}${steps}</div>`)}</div></div>`;
}
/* What a mission that needs you is asking, whatever its shape: one decision, several, or a blocked change. */
function mNeed(t) {
  if (t.status === 'blocked') return { q: 'Partly applied. Check rule 222 again, or stop here?', effect: t.partial ? t.partial.failed : '' };
  if (t.findings) { const left = t.findings.filter(f => f.prop && !f.dec); return { q: `${left.length} decision${left.length === 1 ? '' : 's'}: ${left.map(f => f.title.split(':')[0]).join(' · ')}`, effect: 'Each proposal has its own Approve and Decline.' }; }
  return t.decision || { q: '', effect: '' };
}
const M_CLASS = { action: ['Action needed', 'amber'], nothing: ['Nothing found', 'slate'], inconclusive: ['Inconclusive', 'slate'] };
/* The rules a proposal changes, the version it expects, and other open missions that change the same rule. */
function mExpects(t, f) {
  const W = M.W, tg = f ? (f.affects.rules || []) : (t.targets || []); if (!tg.length) return '';
  const vers = tg.map(id => { const r = mRule(id); return r ? `rule ${id} version ${f ? r.ver : (t.expects || {})[id] || r.ver}` : ''; }).filter(Boolean).join(', ');
  const others = f ? [] : W.tasks.filter(x => x !== t && x.status !== 'done' && x.targets && x.targets.some(id => tg.includes(id)) && (x.decision || x.findings));
  return `<div class="text-[12px] text-ink3 mt-1.5">Applies only to ${vers}. If the rule changes first, the proposal is checked again.</div>${others.map(x => `<div class="mt-2 rounded-xl border border-indigo-500/40 bg-indigo-500/5 px-3 py-2 text-[12.5px] text-ink2 flex items-start gap-2"><span class="c-indigo mt-0.5">${ic('git-merge', 'w-3.5 h-3.5')}</span><span>Another change is pending on this rule${x.part ? ` (${esc(x.part)})` : ''}: <button onclick="mOpenTask('${x.id}')" class="font-mono c-indigo hover:underline">${x.id}</button>. Whichever is approved first applies, and the other is checked again on the new version.</span></div>`).join('')}`;
}
function mChange(t, cur, rec, key) {
  if (!(cur && rec)) return '';
  if (M.editing === key) return `<div class="space-y-2">${mBlock(cur, 'cur')}<div class="rounded-xl border border-cx/40 overflow-hidden"><div class="px-3 py-1.5 border-b border-line text-[11.5px] font-bold c-cx">YOUR VERSION</div><textarea id="m-edit" data-keep spellcheck="false" class="w-full h-36 bg-code text-ink font-mono text-[12px] leading-[1.7] p-3 focus:outline-none">${esc(rec.kind === 'code' ? rec.lines.map(l => l[0]).join('\n') : rec.rows.map(r => r.join(': ')).join('\n'))}</textarea></div></div>`;
  return `<div class="space-y-2">${mBlock(cur, 'cur')}${mBlock(rec, 'rec')}</div>`;
}
/* Decline always asks why. The reason decides when, if ever, the suggestion may come back. */
function mDeclBox(id, fi) {
  const f = fi === undefined ? '' : `,${fi}`;
  return `<div data-decl="${id}" class="rounded-xl border border-line2 bg-panel p-2 space-y-1"><div class="px-2 pt-1 pb-1.5 text-[12.5px] text-ink2 font-semibold flex items-center justify-between">Why decline?<button onclick="M.decl=null;mPanelRender();icons()" class="text-ink3 hover:text-ink">${ic('x', 'w-4 h-4')}</button></div>
    ${Object.entries(M_DECL).map(([k, v]) => `<button data-reason="${k}" onclick="${fi === undefined ? `mDecide('${id}','reject','${k}')` : `mDecideP('${id}'${f},'reject','${k}')`}" class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-hov"><span class="block text-[13px] text-ink font-semibold">${v[0]}</span><span class="block text-[11.5px] text-ink3">${v[1]}</span></button>`).join('')}</div>`;
}
/* One finding of a mission with several: what was found, what is proposed, and its own decision. */
function mFinding(t, f, i) {
  const st = f.status === 'handled' ? `<span class="text-[12px] c-indigo">Handled in <button onclick="mOpenTask('${f.handledIn}')" class="font-mono hover:underline">${f.handledIn}</button></span>` : f.dec ? `<span class="text-[12px] ${f.dec.choice === 'reject' ? 'text-ink3' : 'c-cx'} font-semibold">${f.dec.choice === 'reject' ? 'Declined · ' + esc(myDeclTxt(f.dec)) : 'Applied'} by ${esc(f.dec.by)}</span>` : f.prop ? '<span class="text-[12px] c-amber font-semibold">Needs you</span>' : '';
  const p = f.prop, open = p && !f.dec && t.status === 'pending', key = t.id + ':' + f.id;
  return `<div data-finding="${f.id}" class="rounded-2xl border ${open ? 'border-line2' : 'border-line'} p-3.5 space-y-2.5 ${f.status === 'handled' ? 'opacity-80' : ''}">
    <div class="flex items-center justify-between gap-2 flex-wrap"><span class="text-[11px] font-black tracking-[.14em] uppercase text-ink3">Finding ${i + 1} · ${esc(MY_CARD[f.card])}</span>${st}</div>
    <div class="text-[14.5px] font-bold text-ink leading-snug">${esc(f.title)}</div>
    <div class="flex items-center gap-2 flex-wrap">${f.status === 'handled' ? '' : mSug('Tune', { solid: true })}${mConf(f.conf)}${f.noise ? `<span class="text-[12px] text-ink3">Noise type: ${esc(f.noise)}</span>` : ''}</div>
    <p class="text-[13px] text-ink2 leading-relaxed">${esc(f.diagnosis)}</p>
    ${p ? `<div class="pt-1">${mLabel(`Proposal · version ${p.ver}`)}<div class="mt-2">${mChange(t, p.current, p.recommended, key)}</div>${p.validation ? `<div class="mt-2 rounded-xl border border-line px-3 py-2.5">${mFold(t, 'why' + f.id, 'Show the evidence', mValidation(p.validation), `${esc(p.validation.rows[0][0])}: ${p.validation.rows[0][1]} → ${p.validation.rows[0][2]}`)}</div>` : ''}${mExpects(t, f)}</div>` : ''}
    ${open ? (M.decl && M.decl.id === t.id && M.decl.fi === i ? mDeclBox(t.id, i) : `<div><div class="text-[13.5px] font-semibold text-ink">${esc(p.decision.q)}</div><p class="text-[12.5px] text-ink3 mt-0.5">${esc(p.decision.effect)} Risk: ${esc(p.decision.risk)}</p>
      <div class="mt-2 flex gap-2"><button data-papprove="${f.id}" onclick="mDecideP('${t.id}',${i},'approve')" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold">${esc(p.decision.approve)}</button><button data-preject="${f.id}" onclick="M.decl={id:'${t.id}',fi:${i}};mPanelRender();icons()" class="px-3.5 py-2 rounded-xl border border-line2 text-[13px] font-semibold text-ink2 hover:bg-hov">Decline</button></div></div>`) : ''}
  </div>`;
}
function mCard(t) {
  const W = M.W, d = t.decision, done = t.status === 'done', j = MY_JOBS[t.job] || { name: 'Mission', ver: 1 };
  const v = t.validation, vHint = v ? `${esc(v.rows[0][0])}: ${v.rows[0][1].toLocaleString()} → ${v.rows[0][2].toLocaleString()}` : '';
  const change = mChange(t, t.current, t.recommended, t.id);
  const plan = mPlanBox(t), cls = M_CLASS[t.resultClass] || M_CLASS.action;
  const skips = (t.skips || []).map(([o, id]) => `<span class="block mt-0.5">Skipped ${esc(o)}: handled in <button onclick="mOpenTask('${id}')" class="font-mono c-indigo hover:underline">${id}</button></span>`).join('');
  const top = `<div class="flex items-center justify-between gap-3"><div class="text-[11px] font-black tracking-[.14em] uppercase" style="color:#5eead4">${esc(j.name)} · v${j.ver} · ${t.id}</div>${mVerTag(t)}</div>
    <h2 class="text-[19px] font-bold text-ink leading-snug mt-1.5">${esc(t.title)}</h2>
    <div class="text-[12.5px] text-ink3 mt-1.5 leading-relaxed"><span class="text-ink3">Objective:</span> <span class="text-ink2">${esc(t.objective || '')}</span></div>
    ${mChangesTxt(t) ? `<div class="text-[12.5px] text-ink3 mt-0.5">Changes: <span class="text-ink2">${esc(mChangesTxt(t))}</span></div>` : ''}
    <p class="text-[14px] text-ink2 leading-relaxed mt-2">${esc(t.summary)}</p>
    <div class="mt-4 flex items-center gap-x-3 gap-y-2 flex-wrap"><span class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">AI suggestion</span>${mSug(t.sug, { solid: true })}${mConf(t.conf)}<span class="text-[12.5px] text-ink3">confidence</span><span class="text-ink4">·</span><span class="text-[12.5px] c-${cls[1] === 'slate' ? 'ink3' : cls[1]} font-semibold">${cls[0]}</span><span class="text-ink4">·</span>${mImpact(t.impact)}<span class="text-[12.5px] text-ink3">priority</span></div>
    <div class="mt-2 text-[12.5px] text-ink3 leading-relaxed"><span class="inline-flex items-center gap-1.5">${ic('scan-search', 'w-3.5 h-3.5')}Looked at: <span class="text-ink2">${esc(t.coverage || '')}</span></span>${skips}</div>
    ${t.nothing ? '' : t.findings ? '' : `<div class="mt-4">${mLabel('Where the problem starts', `<span class="text-[12px] text-ink3">${esc(MY_CARD[t.card])}</span>`)}<div class="mt-2">${mChain(t.layer, t.sug)}</div><p class="text-[13.5px] text-ink mt-2.5 leading-relaxed">${esc(t.diagnosis)}${t.noise ? ` <span class="text-ink3">Noise type: ${esc(t.noise)}.</span>` : ''}</p></div>`}
    <div class="mt-4 pt-4 border-t border-line">${mHow(t)}</div>`;
  const links = (t.unblocks && mTask(t.unblocks) ? `<div class="flex items-center gap-2 flex-wrap text-[12.5px] text-ink3"><span>${t.status === 'done' ? 'Unblocked' : 'Unblocks'}</span>${mLink(t.unblocks)}</div>` : '') + (t.unblockedBy ? `<div class="flex items-center gap-2 flex-wrap text-[12.5px] text-ink3"><span>Unblocked by</span>${mLink(t.unblockedBy)}</div>` : '') + (t.raisedFrom ? `<div class="flex items-center gap-2 flex-wrap text-[12.5px] text-ink3"><span>Raised again after</span>${mLink(t.raisedFrom)}</div>` : '');
  let box;
  if (t.findings) { const left = t.findings.filter(f => f.prop && !f.dec).length;
    box = `<section class="space-y-3">${mLabel(t.status === 'pending' ? `<span style="color:#fbbf24">Needs you · ${left} decision${left === 1 ? '' : 's'}</span>` : 'Findings', `<span class="text-[12px] text-ink3">${t.findings.length} findings</span>`)}${t.findings.map((f, i) => mFinding(t, f, i)).join('')}${done ? `<p class="text-[13.5px] text-ink leading-relaxed">${esc(t.outcome || '')}</p>` : ''}</section>`; }
  else if (t.status === 'blocked') box = `<section class="rounded-2xl border-2 border-rose-500/50 bg-rose-500/5 p-4 space-y-3">
      ${mLabel('<span class="c-rose">Blocked · partly applied</span>', `<span class="text-[12px] text-ink3 font-mono">${myAge(Date.now() - (t.actedAt || t.opened))}</span>`)}
      <div class="space-y-1">${t.partial.done.map(x => `<div class="flex items-center gap-2 text-[13px] text-ink2"><span class="c-cx">${ic('circle-check', 'w-4 h-4')}</span>${esc(x)}</div>`).join('')}<div class="flex items-start gap-2 text-[13px] text-ink"><span class="c-rose mt-0.5">${ic('circle-x', 'w-4 h-4')}</span><span>${esc(t.partial.failed)}</span></div></div>
      <p class="text-[12.5px] text-ink3">Nothing else changes until you choose. The agent can check rule 222 again and ask you about the new version, or stop with what was applied.</p></section>`;
  else if (t.nothing) box = `<section class="rounded-2xl border border-line p-4 space-y-2">${mLabel('Outcome', mStatus(t))}<p class="text-[13.5px] text-ink leading-relaxed">${esc(t.outcome || '')}</p><p class="text-[12.5px] text-ink3">Nothing needs you. The run is kept so it can be checked and measured. If it missed something, say so below.</p></section>`;
  else if (t.status === 'pending' && t.waitOn) box = `<section class="rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-4 space-y-3">
      ${mLabel('<span class="c-indigo">Waiting · on another mission</span>', `<span class="text-[12px] text-ink3 font-mono">${myAge(Date.now() - t.opened)}</span>`)}
      <p class="text-[13.5px] text-ink2 leading-relaxed"><b class="text-ink">Nothing to decide here.</b> The cause is in the data pipeline, so the fix belongs to the mission below. When it is approved, this mission continues on its own and checks that the detection works again.</p>
      <div>${mLink(t.waitOn)}</div></section>`;
  else if (t.status === 'pending' && d) box = `<section class="rounded-2xl border border-line2 bg-card p-4 space-y-3">
      ${mLabel('<span style="color:#fbbf24">Needs you</span>', `<span class="text-[12px] text-ink3 font-mono">${myAge(Date.now() - t.opened)} waiting</span>`)}
      <div><h3 class="text-[16.5px] font-bold text-ink leading-snug">${esc(d.q)}</h3><p class="text-[13.5px] text-ink2 leading-relaxed mt-1">${esc(d.effect)}</p>
        <p class="text-[12.5px] text-ink3 leading-relaxed mt-1"><b class="text-ink2">Risk:</b> ${esc(d.risk)}${d.reversible ? ' It can be reversed.' : ''}${d.selfFix ? ' ' + esc(d.selfFix) : ''}</p>${mExpects(t)}</div>
      ${mChangedBox(t)}
      ${change ? `<div>${mLabel(`What changes · version ${t.ver || 1}`)}<div class="mt-2">${change}</div></div>` : ''}
      ${plan}
      ${v ? `<div class="rounded-xl border border-line px-3.5 py-3">${mFold(t, 'why', 'Show the evidence', mValidation(v), vHint)}</div>` : ''}
      ${links}
    </section>`;
  else if (t.status === 'progress') box = `<section class="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-4 flex items-center gap-2.5 text-[13.5px] text-ink2"><span class="c-blue">${ic('loader', 'w-4 h-4 animate-spin')}</span><span class="min-w-0"><b class="text-ink">No decision needed now.</b> ${esc(t.progressNote || '')}${t.handed ? '. The mission closes on its own when the data arrives.' : '.'}${links ? `<span class="block mt-2">${links}</span>` : ''}</span></section>${change ? `<section class="rounded-2xl border border-line bg-card p-4">${mLabel('What changes')}<div class="mt-2">${change}</div></section>` : ''}`;
  else box = `<section class="rounded-2xl border p-4 ${['rejected', 'cancelled'].includes(t.end) ? 'border-line bg-sunk' : 'tn tn-cx'}">${mLabel('Outcome', mStatus(t))}<p class="text-[13.5px] mt-1.5 leading-relaxed text-ink">${esc(t.outcome || '')}</p>${links ? `<div class="mt-2.5">${links}</div>` : ''}${plan ? `<div class="mt-3">${plan}</div>` : ''}</section>${change ? `<section class="rounded-2xl border border-line bg-card p-4">${mLabel('What changed')}<div class="mt-2">${change}</div></section>` : ''}`;
  const objs = mAffected(t), c = t.cost;
  const fb = `<div class="space-y-2">${mFb(t, 'res', 'Is the result right?')}${t.nothing || t.findings ? '' : mFb(t, 'diag', 'Is the diagnosis right?')}${t.recommended ? mFb(t, 'rec', 'Is the suggested change right?') : ''}${mMissed(t)}</div>`;
  return `<div class="space-y-4">${mCardBanners(t)}<section class="rounded-2xl border border-line2 bg-card p-4 sm:p-5">${top}</section>${box}
    <div class="px-1 space-y-2.5">${objs ? mFold(t, 'obj', 'Show affected objects', `<div class="flex flex-wrap gap-1.5">${objs}</div>`) : ''}${c ? mFold(t, 'cost', 'Show the cost of this run', `<div class="text-[13px] text-ink2">${c.min} minutes · ${c.queries} queries · ${c.pct}% of the job’s budget (${esc((MY_JOBS[t.job] || {}).budget || '')})</div>`) : ''}${done || t.status === 'pending' || t.status === 'blocked' ? mFold(t, 'fb', t.nothing ? 'Give feedback, or say what it missed' : 'Give feedback', fb, t.fb && t.fb.missed ? 'You reported something it missed' : '') : ''}</div>
    </div>`;
}
/* "You missed something": the feedback that matters most on a run that found nothing. */
function mMissed(t) {
  const fb = t.fb || {};
  if (fb.missed) return `<div class="rounded-xl border border-cx/40 bg-cx/5 px-3 py-2.5 text-[12.5px] text-ink2"><b class="text-ink">You said it missed:</b> “${esc(fb.missed)}”. Recorded on the mission and counted in the quality measure. The ${M_AG[t.agent].name} checks it on the next run and tells you what it finds.</div>`;
  return `<div class="flex items-center gap-2"><input id="m-missed-${t.id}" data-keep type="text" placeholder="You missed something? Say what" class="flex-1 min-w-0 text-[12.5px] px-3 py-1.5 bg-sunk border border-line rounded-lg text-ink placeholder:text-ink4 focus:outline-none focus:border-cx" onkeydown="if(event.key==='Enter')mMissedSend('${t.id}')"><button onclick="mMissedSend('${t.id}')" class="px-3 py-1.5 rounded-lg border border-line2 text-[12.5px] text-ink2 hover:bg-hov">Send</button></div>`;
}
function mMissedSend(id) { const t = mTask(id), el = $('m-missed-' + id), v = el && el.value.trim(); if (!t || !v) return; t.fb = t.fb || {}; t.fb.missed = v; t.history = t.history || []; t.history.push({ t: Date.now(), kind: 'feedback', who: 'me', text: `reported something the run missed: “${v}”` }); mPanelRender(); icons(); }
/* A run in progress: the steps appear one by one. */
function mWorking(t) {
  const n = Math.min(t.shown || 1, t.steps.length);
  return `<div class="space-y-4"><section class="rounded-2xl border border-line2 bg-card p-4 sm:p-5">
    <div class="flex items-center justify-between gap-3"><div class="text-[11px] font-black tracking-[.14em] uppercase" style="color:#5eead4">Running now · ${t.id}</div>${mAnalyzing()}</div>
    <h2 class="text-[19px] font-bold text-ink leading-snug mt-1.5">${esc(t.title)}</h2>
    <p class="text-[13.5px] text-ink3 mt-2"><b class="text-ink2">${MY_TRIGGER[t.trigger.kind][0]}.</b> ${esc(t.trigger.text)}</p>
    <ol class="space-y-2 mt-4">${t.steps.slice(0, n).map((x, i) => `<li class="flex gap-2.5 text-[13.5px] ${i === n - 1 ? 'text-ink' : 'text-ink2'}"><span class="w-5 h-5 shrink-0 flex items-center justify-center ${i === n - 1 ? 'c-blue' : 'c-cx'}">${ic(i === n - 1 ? 'loader' : 'check', 'w-4 h-4' + (i === n - 1 ? ' animate-spin' : ''))}</span>${esc(x)}</li>`).join('')}</ol>
    <div class="mt-4 text-[13px] c-blue">${esc(t.progressNote || 'Working')}…</div>
  </section></div>`;
}

/* A native object with no open mission: what SecOps knows about it. */
function mObjCard(o) {
  const W = M.W;
  if (o.kind === 'rule') { const r = mRule(o.id), rv = myRuleReview(W, r);
    return `<div class="space-y-4"><section class="rounded-2xl border border-line2 bg-card p-4 sm:p-5">
      <div class="text-[11px] font-black tracking-[.14em] uppercase" style="color:#5eead4">Correlation rule · ID ${r.id}</div>
      <h2 class="text-[19px] font-bold text-ink leading-snug mt-1.5">${esc(r.name)}</h2>
      <div class="mt-4 flex items-center gap-3 flex-wrap"><span class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">AI suggestion</span>${mSug(rv.sug, { solid: true })}${mConf(rv.sug ? rv.conf : '')}</div>
      <p class="text-[13.5px] text-ink2 leading-relaxed mt-2.5">${r.deleted ? 'This rule was deleted.' : rv.declined ? `A suggestion on this rule was declined: ${esc(myDeclTxt(rv.declined))}.` : rv.sug === 'Keep' ? (rv.task ? `The last mission on this rule is closed (${rv.task.id}). It is working and useful, so there is nothing to change.` : 'Checked in the last sweep. The data arrives, the fields are mapped and the rule fires at a useful rate. Nothing to change.') : rv.sug ? 'Open missions work on this rule. They are listed below.' : 'This rule is disabled and has not been reviewed.'}</p>
      ${r.deleted ? '' : `<button onclick="mAskReview(${r.id})" class="mt-3 px-3.5 py-2 rounded-xl border border-line2 text-[13px] font-semibold text-ink hover:bg-hov inline-flex items-center gap-1.5">${ic('scan-search', 'w-4 h-4')}Review this rule now</button>`}
    </section>${mRecord(r)}${mChatHtml('rule:' + r.id)}${mRuleBody(r)}</div>`; }
  if (o.kind === 'tech') return mTechCard(o.id);
  const i = W.iocs.find(x => x.id === o.id), rv = myIocReview(W, i), kv = (k, v) => `<div class="flex gap-3 text-[13.5px] py-1"><span class="w-40 shrink-0 text-ink3">${k}</span><span class="text-ink min-w-0 break-all">${v}</span></div>`;
  return `<div class="space-y-4"><section class="rounded-2xl border border-line2 bg-card p-4 sm:p-5">
    <div class="text-[11px] font-black tracking-[.14em] uppercase" style="color:#5eead4">IOC rule · ID ${i.id}</div>
    <h2 class="text-[17px] font-bold text-ink leading-snug mt-1.5 font-mono break-all">${esc(i.ind)}</h2>
    <div class="mt-4 flex items-center gap-3 flex-wrap"><span class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">AI suggestion</span>${mSug(rv.sug, { solid: true })}${mConf(rv.sug ? rv.conf : '')}</div>
    <p class="text-[13.5px] text-ink2 leading-relaxed mt-2.5">${rv.sug === 'Keep' ? 'Checked in the last sweep. The indicator is still listed as bad and creates no noise. Nothing to change.' : 'This indicator is disabled.'}</p>
  </section><section class="rounded-2xl border border-line p-4">${kv('Type', esc(i.type)) + kv('Severity', i.sev) + kv('# of issues', i.issues.toLocaleString()) + kv('Source', esc(i.source)) + kv('Expiration Date', esc(i.exp)) + kv('Status', esc(i.status)) + kv('Reputation', esc(i.rep)) + kv('Reliability', esc(i.rel))}</section></div>`;
}

/* The panel itself, standing by, the thread, the queue and the switcher are in 71-maya-workspace.js */
const mDeckOn = t => !!(t && M.deck && M.deck.includes(t.id));
function mPanelBottom() { const sc = $('m-panel-scroll'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' }); }

/* ---------- deciding ---------- */
function mDecide(id, choice, reason) {
  const t = mTask(id); if (!t || t.status !== 'pending' || t.findings) return;
  if (t.stale) { toast(`${t.id}: the rule changed. The agent is checking the proposal again`, 'triangle-alert'); return; }
  /* Decline always asks why. */
  if (choice === 'reject' && !reason) { M.decl = { id }; mPanelRender(); icons(); return; }
  M.decl = null;
  /* The decision is tied to the version on screen. A newer version has to be seen first. */
  if (t.next) { toast(`${t.id}: version ${(t.ver || 1) + 1} is ready. Review it before deciding`, 'triangle-alert'); return; }
  if (choice === 'edit') { const ta = $('m-edit'); if (ta && t.recommended.kind === 'code') t.recommended.lines = ta.value.split('\n').map(l => [l, 'add']); t.editedBy = M_USER; }
  t.decVer = t.ver || 1; t.actedAt = Date.now();
  myApply(M.W, t, choice, M_USER, reason); mResume(); mPlanTick(t); mStaleTick();
  M.editing = null;
  const left = myPendingTasks(M.W).length;
  const said = choice === 'reject' ? `Declined · ${myDeclTxt(t.declined)}. Nothing changed.` : t.status === 'blocked' ? 'Partly applied. It needs you again.' : t.status === 'progress' ? 'Sent. ' + (t.progressNote || '') + '.' : choice === 'edit' ? 'Your version is applied.' : 'Approved and applied.';
  M.lastDecision = { id, text: `${said} ${left ? left + ' decision' + (left === 1 ? '' : 's') + ' left.' : 'Nothing else is waiting.'}` };
  toast(`${t.id}: ${said}`, choice === 'reject' ? 'x' : t.status === 'blocked' ? 'triangle-alert' : 'check');
  /* In the decisions walk the next card comes up on its own. After the last one the panel goes back to standing by. */
  if (mPanelOn() && M.panelTask === id && mDeckOn(t) && !M.pivot && t.status !== 'blocked') {
    const n = M.deck.length, i = M.deck.indexOf(id); let nx = null;
    if (t.status !== 'blocked') for (let k = 1; k <= n; k++) { const c = mTask(M.deck[(i + k) % n]); if (c.status === 'pending' && c !== t) { nx = c; break; } }
    if (nx) return mOpenTask(nx.id);
    M.deck = null; M.panelTask = null; M.chatKey = '_'; M.chats._.push({ role: 'agent', text: `All decisions are made. ${M.lastDecision.text.replace(/ ?Nothing else is waiting\./, '')}` });
  }
  mRender();
}
/* A decision on one proposal of a mission with several findings. */
function mDecideP(id, fi, choice, reason) {
  const t = mTask(id); if (!t || !t.findings) return;
  if (choice === 'reject' && !reason) { M.decl = { id, fi }; mPanelRender(); icons(); return; }
  M.decl = null; myApplyProp(M.W, t, fi, choice, M_USER, reason); mStaleTick();
  const f = t.findings[fi]; toast(`${t.id} · ${f.id}: ${choice === 'reject' ? 'declined · ' + myDeclTxt(f.dec) : 'applied'}`, choice === 'reject' ? 'x' : 'check');
  mRender();
}
/* A blocked mission: check the refused part again, or stop. */
function mBlockedGo(id, how) { const t = mTask(id); if (!t) return; myUnblockPartial(M.W, t, how, M_USER); toast(`${id}: ${how === 'stop' ? 'stopped with what was applied' : 'version ' + t.ver + ' is ready'}`, 'check'); mRender(); }
/* Out-of-date proposals are checked again on the new version of the rule. */
function mStaleTick() {
  M.W.tasks.filter(t => t.stale && !t.staleTimer).forEach(t => { t.staleTimer = true;
    M.timers.push(setTimeout(() => { t.staleTimer = false; myReassess(M.W, t); toast(t.status === 'done' ? `${t.id}: cancelled, the rule was deleted` : `${t.id}: version ${t.ver} is ready, checked on the new rule`, 'git-compare-arrows'); mRender(); }, 2800)); });
}
function mReviewAll() { const nx = myPendingTasks(M.W)[0]; if (!nx) return toast('Nothing is waiting for you', 'check'); M.deck = null; mOpenTask(nx.id); }

/* Scripted answers about one mission. Every fact is read from the mission, not typed again. */
function mTaskAnswer(t, q) {
  const l = q.toLowerCase(), d = t.decision;
  const rules = (t.affects.rules || []).map(id => mRule(id)).filter(Boolean);
  if (mRunning(t)) return { text: `Still working on this. So far: ${t.steps.slice(0, t.shown || 1).map(x => x.charAt(0).toLowerCase() + x.slice(1)).join('; ')}. A decision will be asked for when the work is done.` };
  if (t.status === 'pending' && /^(approve|yes|go ahead|do it|adopt|apply)\b/.test(l)) return { text: 'Done. Applied as suggested.', act: 'approve' };
  if (t.status === 'pending' && /^(reject|no\b|decline)/.test(l)) return { text: 'Before I record it: why decline? Pick a reason below. It decides when, if ever, this comes back.', act: 'reject' };
  if (/risk|safe|revers|undo|roll/.test(l)) return { text: d ? `**Risk: ${d.risk}**${d.reversible ? '\nThe change can be reversed.' : ''}${t.validation ? `\n${t.validation.note}` : ''}` : `This mission is ${mStatusTxt(t).toLowerCase()}. No change is waiting.` };
  if (/agent|who|pipeline|worked|escalat|wait|block/.test(l) && (t.waitOn || t.unblocks || t.unblockedBy)) { const o = mTask(t.waitOn || t.unblocks || t.unblockedBy);
    return { text: t.waitOn ? `This mission belongs to the ${M_AG[t.agent].name}. The cause is in the pipeline, so it waits on **${o.id}** (${M_AG[o.agent].name}): ${o.title}. Approve that one and this mission continues on its own.` : `This mission belongs to the ${M_AG[t.agent].name}. ${t.unblocks ? `It ${o.status === 'done' || t.status === 'done' ? 'unblocked' : 'unblocks'} **${o.id}**: ${o.title}.` : `It was unblocked by **${o.id}**: ${o.title}.`}` }; }
  if (/agent|who|pipeline|worked/.test(l)) return { text: `This mission belongs to the ${M_AG[t.agent].name}. The root cause is at the ${MY_LAYER[t.layer].name.toLowerCase()} step.` };
  if (/wait|later|nothing|ignore|not now/.test(l)) { const n = rules.length;
    const cost = { Fix: `the problem stays: ${n ? `${n} rule${n === 1 ? '' : 's'} keep${n === 1 ? 's' : ''} working on missing or wrong data` : 'the data stays missing'}`, Tune: 'the noise stays at the same level', Drop: 'the unused detection logic stays enabled', Adopt: 'the gap stays open', Connect: 'the detections that need this source stay unavailable', Watch: 'nothing is lost, the checks continue' }[t.sug] || 'nothing changes';
    return { text: `Nothing changes until you decide, so ${cost}. The mission stays in Needs you, ranked by priority (**${t.impact}**).` }; }
  if (/rule|affect|object|which|what.*chang/.test(l)) return { text: rules.length ? `It affects **${rules.length} rule${rules.length === 1 ? '' : 's'}**:\n${rules.map(r => `• ${r.name} (ID ${r.id})`).join('\n')}${d ? `\n\n${d.effect}` : ''}` : (d ? d.effect : t.summary) };
  if (/why|how|explain|evidence|proof|sure|confiden/.test(l)) return { text: `${t.diagnosis}\n\nHow it was found:\n${t.steps.map(x => `• ${x}`).join('\n')}\n\nConfidence: **${t.conf}**.` };
  if (/option|alternativ|else|other/.test(l)) return { text: `You can approve the change as it is${t.current && t.recommended && !t.affects.instance ? ', edit it and approve your version' : ''}, or decline it. Declining changes nothing and keeps the suggestion visible on the affected objects.` };
  const g = mAnswer(q); return g.fallback ? { text: `${t.summary}\n\nAsk why this is suggested, what the risk is, what happens if you wait, or which rules are affected.` } : g;
}

/* The rule's own record: its version, the missions that involve it, pending changes and decisions. Every job that reaches the rule reads it first. */
function mRecord(r) {
  const W = M.W, ts = W.tasks.filter(t => (t.affects.rules || []).includes(r.id) || (t.targets || []).includes(r.id) || (t.findings || []).some(f => (f.affects.rules || []).includes(r.id)));
  const open = ts.filter(t => t.status !== 'done'), pend = open.filter(t => t.targets && t.targets.includes(r.id) && t.decision), decs = ts.filter(t => t.end === 'rejected' && t.declined);
  const row = (k, v) => `<div class="flex gap-3 text-[13px] py-1.5 border-b border-line last:border-0"><span class="w-36 shrink-0 text-ink3">${k}</span><span class="min-w-0 flex-1 text-ink2">${v}</span></div>`;
  const go = t => `<button onclick="mOpenTask('${t.id}')" class="font-mono c-indigo hover:underline">${t.id}</button>`;
  const warn = M.objWarn && M.objWarn.id === r.id ? M.objWarn.kind : null;
  return `<section class="rounded-2xl border border-line p-4" data-record="${r.id}"><h3 class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase mb-1.5">The rule’s record</h3>
    ${row('Version', `${r.deleted ? 'Deleted' : 'Version ' + r.ver}${r.editedBy ? ` · last changed by ${esc(r.editedBy)}` : ''}`)}
    ${r.checked ? row('Checked', `${myWhen(r.checked.at)} · ${esc(r.checked.why)} · next check ${myWhen(r.checked.next)}`) : ''}
    ${row('Open missions', open.length ? open.map(t => `<span class="block">${go(t)} ${mStatus(t)} <span class="text-ink3">${esc(t.objective || t.title)}</span></span>`).join('') : '<span class="text-ink4">None</span>')}
    ${row('Pending changes', pend.length ? pend.map(t => `<span class="block">${go(t)} changes the ${esc(t.part || 'rule')} · expects version ${t.expects[r.id]}${t.stale ? ' · <span class="c-indigo">out of date, checking again</span>' : ''}</span>`).join('') : '<span class="text-ink4">None</span>')}
    ${row('Decisions', decs.length ? decs.map(t => `<span class="block">${go(t)} declined by ${esc(t.declined.by)} · ${esc(myDeclTxt(t.declined))}</span>`).join('') : '<span class="text-ink4">None</span>')}
    ${r.deleted ? '' : warn ? `<div class="mt-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-3.5"><div class="text-[13.5px] font-bold text-ink">${pend.length ? `${pend.map(t => t.id).join(' and ')} ${pend.length === 1 ? 'has a pending change' : 'have pending changes'} on this rule` : 'No mission has a pending change on this rule'}</div>
        <p class="text-[12.5px] text-ink2 mt-1 leading-relaxed">${warn === 'delete' ? `Deleting the rule cancels ${pend.length ? 'those proposals. A mission with nothing left to change closes.' : 'nothing else.'}` : `Saving your edit makes ${pend.length ? 'them out of date. The agents check them again on the new version before anyone can approve.' : 'a new version of the rule.'}`}</p>
        <div class="mt-2.5 flex gap-2"><button data-act="obj-${warn}" onclick="mObjDo(${r.id},'${warn}')" class="px-3.5 py-2 rounded-xl ${warn === 'delete' ? 'bg-rose-500 text-white' : 'bg-ink text-panel'} text-[13px] font-bold">${warn === 'delete' ? 'Delete anyway' : 'Save my edit'}</button><button onclick="M.objWarn=null;mPanelRender();icons()" class="px-3.5 py-2 rounded-xl border border-line2 text-[13px] text-ink2 hover:bg-hov">Cancel</button></div></div>`
      : `<div class="mt-3 flex gap-2"><button data-act="obj-edit" onclick="M.objWarn={id:${r.id},kind:'edit'};mPanelRender();icons()" class="px-3 py-1.5 rounded-lg border border-line2 text-[12.5px] text-ink2 hover:bg-hov inline-flex items-center gap-1.5">${ic('pencil', 'w-3.5 h-3.5')}Edit rule</button><button data-act="obj-delete" onclick="M.objWarn={id:${r.id},kind:'delete'};mPanelRender();icons()" class="px-3 py-1.5 rounded-lg border border-line2 text-[12.5px] text-ink3 hover:text-rose-400 hover:bg-hov inline-flex items-center gap-1.5">${ic('trash-2', 'w-3.5 h-3.5')}Delete rule</button></div>`}
  </section>`;
}
/* A person edits or deletes the rule in the product. Nothing is locked: open proposals become out of date and are checked again. */
function mObjDo(id, kind, who) {
  const r = mRule(id), name = (who || M_USER).replace(/\.$/, ''); M.objWarn = null; if (!r) return;
  if (kind === 'delete') { r.deleted = true; r.status = 'Deleted'; }
  r.editedBy = name; myBump(M.W, id, `${kind === 'delete' ? 'deleted' : 'edited'} by ${name} in the rule editor`, null);
  M.W.log.unshift({ t: Date.now(), kind: 'check', text: `${name} ${kind === 'delete' ? 'deleted' : 'edited'} rule ${id}` });
  toast(`Rule ${id} ${kind === 'delete' ? 'deleted' : 'saved as version ' + r.ver}`, kind === 'delete' ? 'trash-2' : 'check');
  mStaleTick(); mRender();
}
