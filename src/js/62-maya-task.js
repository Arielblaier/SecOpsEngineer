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
  const out = (M.chats[key] || []).map(m => m.role === 'user' ? mUserMsg(m.text) : mBubble('sec', md(m.text), m.task && m.task !== M.panelTask ? `<button onclick="mOpenTask('${m.task}')" class="mt-1.5 text-[12.5px] font-semibold c-cx inline-flex items-center gap-1">Open ${m.task}${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : ''));
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
function mCard(t) {
  const d = t.decision, both = t.current && t.recommended, done = t.status === 'done';
  const v = t.validation, vHint = v ? `${esc(v.rows[0][0])}: ${v.rows[0][1].toLocaleString()} → ${v.rows[0][2].toLocaleString()}` : '';
  const change = both ? (M.editing === t.id
      ? `<div class="space-y-2">${mBlock(t.current, 'cur')}<div class="rounded-xl border border-cx/40 overflow-hidden"><div class="px-3 py-1.5 border-b border-line text-[11.5px] font-bold c-cx">YOUR VERSION</div><textarea id="m-edit" data-keep spellcheck="false" class="w-full h-36 bg-code text-ink font-mono text-[12px] leading-[1.7] p-3 focus:outline-none">${esc(t.recommended.kind === 'code' ? t.recommended.lines.map(l => l[0]).join('\n') : t.recommended.rows.map(r => r.join(': ')).join('\n'))}</textarea></div></div>`
      : `<div class="space-y-2">${mBlock(t.current, 'cur')}${mBlock(t.recommended, 'rec')}</div>`) : '';
  const recs = mRecs(t), plan = mPlanBox(t);
  const top = `<div class="flex items-center justify-between gap-3"><div class="text-[11px] font-black tracking-[.14em] uppercase" style="color:#5eead4">${esc(MY_CARD[t.card])} · ${t.id}</div>${mVerTag(t)}</div>
    <h2 class="text-[19px] font-bold text-ink leading-snug mt-1.5">${esc(t.title)}</h2>
    <p class="text-[14px] text-ink2 leading-relaxed mt-2">${esc(t.summary)}</p>
    <div class="mt-4 flex items-center gap-3 flex-wrap"><span class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">AI suggestion</span>${mSug(t.sug, { solid: true })}${mConf(t.conf)}<span class="text-[12.5px] text-ink3">confidence</span><span class="text-ink4">·</span>${mImpact(t.impact)}<span class="text-[12.5px] text-ink3">impact</span></div>
    <div class="mt-4">${mLabel('Where the problem starts')}<div class="mt-2">${mChain(t.layer, t.sug)}</div><p class="text-[13.5px] text-ink mt-2.5 leading-relaxed">${esc(t.diagnosis)}${t.noise ? ` <span class="text-ink3">Noise type: ${esc(t.noise)}.</span>` : ''}</p></div>
    <div class="mt-4 pt-4 border-t border-line">${mHow(t)}</div>`;
  const links = (t.unblocks && mTask(t.unblocks) ? `<div class="flex items-center gap-2 flex-wrap text-[12.5px] text-ink3"><span>${t.status === 'done' ? 'Unblocked' : 'Unblocks'}</span>${mLink(t.unblocks)}</div>` : '') + (t.unblockedBy ? `<div class="flex items-center gap-2 flex-wrap text-[12.5px] text-ink3"><span>Unblocked by</span>${mLink(t.unblockedBy)}</div>` : '');
  const box = t.status === 'pending' && t.waitOn ? `<section class="rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-4 space-y-3">
      ${mLabel('<span class="c-indigo">Pending · waits on another mission</span>', `<span class="text-[12px] text-ink3 font-mono">${myAge(Date.now() - t.opened)}</span>`)}
      <p class="text-[13.5px] text-ink2 leading-relaxed"><b class="text-ink">Nothing to decide here.</b> The cause is in the data pipeline, so the fix belongs to the mission below. When it is approved, this mission continues on its own and checks that the detection works again.</p>
      <div>${mLink(t.waitOn)}</div></section>`
    : t.status === 'pending' && d ? `<section class="rounded-2xl border border-line2 bg-card p-4 space-y-3">
      ${mLabel('<span style="color:#fbbf24">Needs your decision</span>', `<span class="text-[12px] text-ink3 font-mono">${myAge(Date.now() - t.opened)} waiting</span>`)}
      <div><h3 class="text-[16.5px] font-bold text-ink leading-snug">${esc(d.q)}</h3><p class="text-[13.5px] text-ink2 leading-relaxed mt-1">${esc(d.effect)}</p>
        <p class="text-[12.5px] text-ink3 leading-relaxed mt-1"><b class="text-ink2">Risk:</b> ${esc(d.risk)}${d.reversible ? ' It can be reversed.' : ''}${d.selfFix ? ' ' + esc(d.selfFix) : ''}</p></div>
      ${mChangedBox(t)}
      ${recs ? mRecsBox(t) : change ? `<div>${mLabel('What changes')}<div class="mt-2">${change}</div></div>` : ''}
      ${plan}
      ${v ? `<div class="rounded-xl border border-line px-3.5 py-3">${mFold(t, 'why', 'Show the evidence', mValidation(v), vHint)}</div>` : ''}
      ${links}
    </section>`
    : t.status === 'progress' ? `<section class="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-4 flex items-center gap-2.5 text-[13.5px] text-ink2"><span class="c-blue">${ic('loader', 'w-4 h-4 animate-spin')}</span><span class="min-w-0"><b class="text-ink">No decision needed now.</b> ${esc(t.progressNote || '')}${t.handed ? '. The mission closes on its own when the data arrives.' : '.'}${links ? `<span class="block mt-2">${links}</span>` : ''}</span></section>${recs ? `<section class="rounded-2xl border border-line bg-card p-4">${mRecsBox(t)}</section>` : change ? `<section class="rounded-2xl border border-line bg-card p-4">${mLabel('What changes')}<div class="mt-2">${change}</div></section>` : ''}`
    : `<section class="rounded-2xl border p-4 ${['rejected', 'dismissed'].includes(t.end) ? 'border-line bg-sunk' : 'tn tn-cx'}">${mLabel('Outcome', mStatus(t))}<p class="text-[13.5px] mt-1.5 leading-relaxed text-ink">${esc(t.outcome || '')}</p>${links ? `<div class="mt-2.5">${links}</div>` : ''}${plan ? `<div class="mt-3">${plan}</div>` : ''}</section>${recs ? `<section class="rounded-2xl border border-line bg-card p-4">${mRecsBox(t)}</section>` : change ? `<section class="rounded-2xl border border-line bg-card p-4">${mLabel('What changed')}<div class="mt-2">${change}</div></section>` : ''}`;
  const objs = mAffected(t);
  return `<div class="space-y-4">${mCardBanners(t)}<section class="rounded-2xl border border-line2 bg-card p-4 sm:p-5">${top}</section>${box}
    <div class="px-1 space-y-2.5">${objs ? mFold(t, 'obj', 'Show affected objects', `<div class="flex flex-wrap gap-1.5">${objs}</div>`) : ''}${done || t.status === 'pending' ? mFold(t, 'fb', 'Give feedback', `<div class="space-y-2">${mFb(t, 'diag', 'Is the diagnosis right?')}${t.recommended ? mFb(t, 'rec', 'Is the suggested change right?') : ''}</div>`) : ''}</div>
    </div>`;
}
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
      <p class="text-[13.5px] text-ink2 leading-relaxed mt-2.5">${rv.sug === 'Keep' ? (rv.task ? `The last mission on this rule is closed (${rv.task.id}). It is working and useful, so there is nothing to change.` : 'Checked in the last sweep. The data arrives, the fields are mapped and the rule fires at a useful rate. Nothing to change.') : 'This rule is disabled and has not been reviewed.'}</p>
      <button onclick="mAskReview(${r.id})" class="mt-3 px-3.5 py-2 rounded-xl border border-line2 text-[13px] font-semibold text-ink hover:bg-hov inline-flex items-center gap-1.5">${ic('scan-search', 'w-4 h-4')}Review this rule now</button>
    </section>${mRuleBody(r)}${mChatHtml('rule:' + r.id)}</div>`; }
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
function mDecide(id, choice) {
  const t = mTask(id); if (!t || t.status !== 'pending') return;
  /* The decision is tied to the version on screen. A newer version has to be seen first. */
  if (t.next) { toast(`${t.id}: version ${(t.ver || 1) + 1} is ready. Review it before deciding`, 'triangle-alert'); return; }
  if (mRecs(t)) return mRecAll(id, choice === 'reject' || choice === 'dismiss' ? 'decline' : 'approve');
  if (choice === 'edit') { const ta = $('m-edit'); if (ta && t.recommended.kind === 'code') t.recommended.lines = ta.value.split('\n').map(l => [l, 'add']); t.editedBy = M_USER; }
  t.decVer = t.ver || 1; t.actedAt = Date.now();
  myApply(M.W, t, choice, M_USER); mResume(); mPlanTick(t);
  M.editing = null;
  const left = myPendingTasks(M.W).length;
  const said = choice === 'reject' ? 'Declined. Nothing changed.' : choice === 'dismiss' ? 'Dismissed.' : t.status === 'progress' ? 'Sent. ' + (t.progressNote || '') + '.' : choice === 'edit' ? 'Your version is applied.' : 'Approved and applied.';
  M.lastDecision = { id, text: `${said} ${left ? left + ' decision' + (left === 1 ? '' : 's') + ' left.' : 'Nothing else is waiting.'}` };
  toast(`${t.id}: ${said}`, choice === 'reject' || choice === 'dismiss' ? 'x' : 'check');
  /* In the decisions walk the next card comes up on its own. After the last one the panel goes back to standing by. */
  if (mPanelOn() && M.panelTask === id && mDeckOn(t) && !M.pivot) {
    const n = M.deck.length, i = M.deck.indexOf(id); let nx = null;
    for (let k = 1; k <= n; k++) { const c = mTask(M.deck[(i + k) % n]); if (c.status === 'pending') { nx = c; break; } }
    if (nx) return mOpenTask(nx.id);
    M.deck = null; M.panelTask = null; M.chatKey = '_'; M.chats._.push({ role: 'agent', text: `All decisions are made. ${M.lastDecision.text.replace(/ ?Nothing else is waiting\./, '')}` });
  }
  mRender();
}
function mReviewAll() { const nx = myPendingTasks(M.W)[0]; if (!nx) return toast('Nothing is waiting for you', 'check'); M.deck = null; mOpenTask(nx.id); }

/* Scripted answers about one mission. Every fact is read from the mission, not typed again. */
function mTaskAnswer(t, q) {
  const l = q.toLowerCase(), d = t.decision;
  const rules = (t.affects.rules || []).map(id => mRule(id)).filter(Boolean);
  if (mRunning(t)) return { text: `Still working on this. So far: ${t.steps.slice(0, t.shown || 1).map(x => x.charAt(0).toLowerCase() + x.slice(1)).join('; ')}. A decision will be asked for when the work is done.` };
  if (t.status === 'pending' && /^(approve|yes|go ahead|do it|adopt|apply)\b/.test(l)) return { text: 'Done. Applied as suggested.', act: 'approve' };
  if (t.status === 'pending' && /^(reject|no\b|decline)/.test(l)) return { text: 'Understood. Nothing changes.', act: 'reject' };
  if (/risk|safe|revers|undo|roll/.test(l)) return { text: d ? `**Risk: ${d.risk}**${d.reversible ? '\nThe change can be reversed.' : ''}${t.validation ? `\n${t.validation.note}` : ''}` : `This mission is ${mStatusTxt(t).toLowerCase()}. No change is waiting.` };
  if (/agent|who|pipeline|worked|escalat|wait|block/.test(l) && (t.waitOn || t.unblocks || t.unblockedBy)) { const o = mTask(t.waitOn || t.unblocks || t.unblockedBy);
    return { text: t.waitOn ? `This mission belongs to the ${M_AG[t.agent].name}. The cause is in the pipeline, so it waits on **${o.id}** (${M_AG[o.agent].name}): ${o.title}. Approve that one and this mission continues on its own.` : `This mission belongs to the ${M_AG[t.agent].name}. ${t.unblocks ? `It ${o.status === 'done' || t.status === 'done' ? 'unblocked' : 'unblocks'} **${o.id}**: ${o.title}.` : `It was unblocked by **${o.id}**: ${o.title}.`}` }; }
  if (/agent|who|pipeline|worked/.test(l)) return { text: `This mission belongs to the ${M_AG[t.agent].name}. The root cause is at the ${MY_LAYER[t.layer].name.toLowerCase()} step.` };
  if (/wait|later|nothing|ignore|not now/.test(l)) { const n = rules.length;
    const cost = { Fix: `the problem stays: ${n ? `${n} rule${n === 1 ? '' : 's'} keep${n === 1 ? 's' : ''} working on missing or wrong data` : 'the data stays missing'}`, Tune: 'the noise stays at the same level', Drop: 'the unused detection logic stays enabled', Adopt: 'the gap stays open', Connect: 'the detections that need this source stay unavailable', Watch: 'nothing is lost, the checks continue' }[t.sug] || 'nothing changes';
    return { text: `Nothing changes until you decide, so ${cost}. The mission stays in Pending, ranked by impact (**${t.impact}**).` }; }
  if (/rule|affect|object|which|what.*chang/.test(l)) return { text: rules.length ? `It affects **${rules.length} rule${rules.length === 1 ? '' : 's'}**:\n${rules.map(r => `• ${r.name} (ID ${r.id})`).join('\n')}${d ? `\n\n${d.effect}` : ''}` : (d ? d.effect : t.summary) };
  if (/why|how|explain|evidence|proof|sure|confiden/.test(l)) return { text: `${t.diagnosis}\n\nHow it was found:\n${t.steps.map(x => `• ${x}`).join('\n')}\n\nConfidence: **${t.conf}**.` };
  if (/option|alternativ|else|other/.test(l)) return { text: `You can approve the change as it is${t.current && t.recommended && !t.affects.instance ? ', edit it and approve your version' : ''}, or decline it. Declining changes nothing and keeps the suggestion visible on the affected objects.` };
  const g = mAnswer(q); return g.fallback ? { text: `${t.summary}\n\nAsk why this is suggested, what the risk is, what happens if you wait, or which rules are affected.` } : g;
}
