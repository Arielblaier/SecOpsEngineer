/* ======================================================================
   SECOPS · THE WORKSPACE (first version)

   MISSION. A unit of work that one agent owns, and that may change
   something in the environment or goes on after you leave. It has a
   trigger (a sweep, a change, a handoff, or a person's request), a state
   (agent working, needs a human, waits on another mission, closed), a
   proposal with a version, and ONE conversation that everyone in it sees.
   Agents create missions: on their own, from a handoff, or when a person
   asks for work in a chat.

   CHAT. Private, one person with the agents. Nothing in the environment
   changes from a chat. When a request needs work, the agent opens a
   mission and links it.

   MISSION AND OBJECT. A mission CHANGES at most a few objects (a rule, an
   indicator, a pipeline step, an instance) and may REFERENCE many more
   (affected rules, cases as evidence). One object has at most one open
   mission that changes it. A new finding on that object goes into the
   open mission, as a new version, not into a second mission. A case is
   not wrapped in a mission: the case already has an owner, a state and a
   conversation, so a mission only links to cases.

   PANEL. Two sizes. Workspace on the Missions screen: the mission on the
   right, its conversation in the middle, the queue on the left. Side
   panel on a native screen: one column, the short form of the same
   mission card on top of the same conversation, Approve and Decline fixed
   at the bottom.

   AGENTS. The selector in the prompt bar says who answers. Outside a
   mission it starts on SecOps, which picks the agent. In a mission it
   starts on the owner. Choosing another agent brings it into the mission.
   Agents address each other with a tag. A question stays in the
   conversation. A change in another agent's area becomes a linked mission.
   ====================================================================== */

/* ---------- people (invented, like the rest of the story) ---------- */
const M_PPL = {
  me: { name: 'Ariel B.', role: 'SecOps Lead', ini: 'AB', hex: '#6366f1' },
  dana: { name: 'Dana K.', role: 'Detection engineer', ini: 'DK', hex: '#db2777' },
  noam: { name: 'Noam R.', role: 'SOC analyst', ini: 'NR', hex: '#d97706' }
};
const mMe = () => M_USER.replace(/\.$/, '');
function mHu(k, size = 22, live = false) {
  const p = M_PPL[k] || M_PPL.me, d = Math.max(6, Math.round(size * .3));
  return `<span class="relative inline-flex shrink-0 items-center justify-center rounded-full text-white font-bold" style="width:${size}px;height:${size}px;background:${p.hex};font-size:${Math.round(size * .4)}px" title="${esc(p.name)} · ${esc(p.role)}">${p.ini}${live ? `<span class="absolute rounded-full" style="width:${d}px;height:${d}px;right:-1px;bottom:-1px;background:#4DFFA6;box-shadow:0 0 0 2px rgb(var(--panel))"></span>` : ''}</span>`;
}
const mWho = (k, size, live) => M_PPL[k] ? mHu(k, size, live) : mAv(k, size, live);
const mWhoName = k => M_PPL[k] ? M_PPL[k].name : 'the ' + (M_AG[k] || M_AG.det).name;
const mAgo = ts => { const ms = Date.now() - ts; return ms < 50000 ? 'now' : myAge(ms) + ' ago'; };

/* ---------- story seeds: who else is in a mission, what they said, and the earlier private chats ---------- */
function mWsSeed() {
  const now = Date.now(), H = 3600000, M1 = 60000, t1 = mTask('MSN-1001'), t2 = mTask('MSN-1002');
  mNote('MSN-1012', { who: 'dana', kind: 'msg', t: now - 4 * H, text: 'I installed the pack update. I did not touch the data model, so the old mapping is still there.' });
  mNote('MSN-1002', { who: 'noam', kind: 'msg', t: now - 6 * H, text: 'These come from the extensions that IT approved. I close them by hand every day.' });
  mNote('MSN-1005', { who: 'dana', kind: 'msg', t: now - 40 * H, text: 'Rule 222 is a copy I made for a test. It is safe to disable.' });
  /* An agent asks another agent. A question stays in the conversation... */
  mNote('MSN-1002', { who: 'det', to: 'inv', kind: 'msg', t: t2.opened + 2 * M1, text: 'How did you close the Chrome extension issues in the last 30 days?' });
  mNote('MSN-1002', { who: 'inv', to: 'det', kind: 'msg', t: t2.opened + 3 * M1, text: '1,150 of 1,250 were closed with no action: the extension was on the list IT approved. The other 100 were on extensions nobody approved, and those were escalated.' });
  /* ...and a change in the other agent's area becomes a linked mission (MSN-1012). */
  mNote('MSN-1001', { who: 'det', to: 'pipe', kind: 'msg', t: t1.opened + 6 * M1, text: 'xdm.event.type is empty on every new SentinelOne event since the pack update. The rules did not change. Did the mapping change?' });
  mNote('MSN-1001', { who: 'pipe', to: 'det', kind: 'msg', t: t1.opened + 9 * M1, text: 'Yes. The pack renamed eventType to event_type, and the data model still reads the old name. That is a change in the data model, so it gets its own mission.' });
  /* Earlier private chats. The answers are computed from the world, like every other answer. */
  M.hist = [];
  [['h1', 'SentinelOne: why three rules went silent', 'Why did SentinelOne break?', 'MSN-1012', 4.5], ['h2', 'Impossible travel coverage', 'Are we covered for impossible travel?', 'MSN-1006', 28], ['h3', 'Status brief', 'Brief me', null, 52]].forEach(([id, title, q, task, h]) => {
    M.hist.push({ id, title, task, t: now - h * H });
    M.chats[id] = [{ role: 'user', text: q }, { role: 'agent', text: mAnswer(q).text }];
  });
}
function mNote(tid, o) { const t = mTask(tid); if (!t) return null; t.notes = t.notes || []; const n = Object.assign({ id: 'n' + (t.notes.length + 1), t: Date.now() }, o); t.notes.push(n); return n; }

/* ======================================================================
   VERSIONS
   A new finding on an object that already has an open mission goes into
   that mission. A material change (the proposal, the evidence, the
   impact) is a new version. If the mission is on screen, the old version stays there until
   the person asks for the new one, and Approve is locked. A small change
   (a re-check, a counter) is applied in place.
   ====================================================================== */
const M_UPD = {
  'MSN-1012': {
    material: { title: 'A second renamed field was found',
      what: ['The pack also renamed threatInfo_confidenceLevel to threat_confidence_level, so xdm.alert.severity arrives empty too.', 'The mapping now reads both new names and falls back to the old ones.', 'The replay was run again with the new mapping. The result did not change.'],
      apply: t => {
        const fix = (b, flag, line) => { b.lines = b.lines.map(l => /xdm\.alert\.severity/.test(l[0]) ? [line || l[0], flag] : l); };
        fix(t.current, 'del'); fix(t.recommended, 'add', '  xdm.alert.severity = coalesce(threat_confidence_level, threatInfo_confidenceLevel),');
        t.summary += ' A second field, the severity, was renamed in the same update.';
        t.validation.note = 'Replayed again with both fields corrected. ' + t.validation.note.replace(/^Replayed/, 'Before that, replayed');
      } },
    minor: { text: 'Checked the replay again on the newest events. The result is the same.', apply: t => { t.validation.note = t.validation.note.replace(/ Checked again.*$/, '') + ` Checked again at ${new Date().toTimeString().slice(0, 5)}.`; } }
  }
};
function mUpdate(tid, kind) {
  const t = mTask(tid), u = (M_UPD[tid] || {})[kind]; if (!t || !u || t.status === 'done') return;
  if (kind === 'minor') { u.apply(t); t.minor = { t: Date.now(), text: u.text }; mNote(tid, { who: t.agent, kind: 'minor', text: u.text }); M.timers.push(setTimeout(() => mRender(), 9000)); mRender(); return mThreadEnd(tid); }
  if (t.next || (t.ver || 1) > 1) return;
  const watching = M.panelTask === tid && mPanelOn(), v = (t.ver || 1) + 1;
  t.next = u; mNote(tid, { who: t.agent, kind: 'update', ver: v, title: u.title, what: u.what });
  M.W.log.unshift({ t: Date.now(), kind: 'task', text: `${tid}: version ${v} of the proposal is ready` });
  if (watching) toast(`${tid} changed while you are viewing it`, 'git-compare-arrows'); else { mSeeUpdate(tid, true); t.unread = true; }
  mRender(); mThreadEnd(tid);
}
/* The person asks for the new version: now it replaces the old one. */
function mSeeUpdate(tid, quiet) {
  const t = mTask(tid), u = t && t.next; if (!u) return;
  t.prevRec = JSON.parse(JSON.stringify(t.recommended || null)); u.apply(t);
  t.ver = (t.ver || 1) + 1; t.changed = { ver: t.ver, title: u.title, what: u.what }; t.next = null;
  if (!quiet) { mRender(); const a = $('m-art-scroll'); if (a) a.scrollTo({ top: 0, behavior: 'smooth' }); }
}
const mVerTag = t => `<span class="inline-flex items-center gap-1.5 shrink-0">${(t.ver || 1) > 1 ? `<span class="text-[11.5px] text-ink3">version ${t.ver}</span>` : ''}</span>`;
function mCardBanners(t) {
  const out = [];
  if (t.lockBy) out.push(`<section class="rounded-2xl border-2 border-cx/60 bg-cx/10 p-4 flex items-start gap-3">${mHu(t.lockBy, 30)}<div class="min-w-0"><div class="text-[14.5px] font-bold text-ink">${esc(M_PPL[t.lockBy].name)} ${t.end === 'rejected' ? 'declined' : 'approved'} this ${mAgo(t.closed)}, while you had it open</div><p class="text-[13px] text-ink2 mt-0.5 leading-relaxed">Nothing is left to decide. You stay on the mission, so nothing moves under you. The panel learns this on its next check, or when you press Approve.</p></div></section>`);
  if (t.next) out.push(`<section class="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-4 m-pulse tn-amber">
      <div class="flex items-start gap-3"><span class="c-amber mt-0.5">${ic('git-compare-arrows', 'w-5 h-5')}</span><div class="min-w-0 flex-1"><div class="text-[14.5px] font-bold text-ink">This mission changed while you were viewing it</div>
      <p class="text-[13px] text-ink2 mt-0.5 leading-relaxed">You are still looking at <b class="text-ink">version ${t.ver || 1}</b>. ${esc(t.next.title)}. Nothing here changes until you ask for version ${(t.ver || 1) + 1}.</p></div></div></section>`);
  if (t.minor && Date.now() - t.minor.t < 9000) out.push(`<div class="rounded-xl border border-cx/40 bg-cx/10 px-3.5 py-2 text-[12.5px] text-ink2 flex items-center gap-2 m-fresh"><span class="c-cx">${ic('refresh-cw', 'w-3.5 h-3.5')}</span><span><b class="text-ink">Updated in place.</b> ${esc(t.minor.text)} Nothing to review.</span></div>`);
  return out.join('');
}
function mChangedBox(t) {
  const c = t.changed; if (!c) return '';
  return `<div class="rounded-xl border border-amber-500/40 bg-amber-500/5 px-3.5 py-3"><div class="text-[11px] font-black tracking-[.14em] uppercase c-amber">Changed in version ${c.ver}</div>
    <ul class="mt-1.5 space-y-1">${c.what.map(x => `<li class="flex gap-2 text-[13px] text-ink2 leading-relaxed"><span class="c-amber mt-[3px] shrink-0">${ic('dot', 'w-3.5 h-3.5')}</span>${esc(x)}</li>`).join('')}</ul>
    ${t.prevRec ? `<div class="mt-2">${mFold(t, 'prev', `Show version ${c.ver - 1} to compare`, mBlock(Object.assign({}, t.prevRec, { label: `Version ${c.ver - 1} · ${t.prevRec.label}` }), 'cur'))}</div>` : ''}</div>`;
}
/* Another person decides while the mission is on this screen. */
function mOther(tid, who, choice) {
  const t = mTask(tid); if (!t || t.status !== 'pending') return;
  t.next = null; t.decVer = t.ver || 1; myApply(M.W, t, choice, M_PPL[who].name); mResume(); mPlanTick(t);
  if (M.panelTask === tid) t.lockBy = who; else t.unread = true;
  toast(`${tid}: ${choice === 'reject' ? 'declined' : 'approved'} by ${M_PPL[who].name}`, 'user-check');
  mRender(); mThreadEnd(tid);
}

/* ======================================================================
   THE PLAN AFTER AN APPROVAL
   Steps that depend on each other are one plan with one Approve. The
   states are read from the missions, not kept on the side.
   ====================================================================== */
const M_PS = { proposed: ['Proposed', 'slate', 'circle-dashed'], queued: ['Queued', 'slate', 'clock'], applying: ['Applying', 'blue', 'loader'], verifying: ['Verifying', 'blue', 'loader'], done: ['Done', 'cx', 'circle-check'], declined: ['Declined', 'slate', 'x'] };
function mPlan(t) {
  const o = t.unblocks && mTask(t.unblocks); if (!o || t.card !== 'pipeline' || !t.recommended) return null;
  const off = ['rejected', 'dismissed'].includes(t.end), ok = t.status === 'done' && !off, age = ok ? Date.now() - t.closed : 0;
  const s2 = ok ? (age > 3000 || o.status === 'done' ? 'done' : 'applying') : off ? 'declined' : 'queued';
  const s3 = ok ? (o.status === 'done' ? 'done' : s2 === 'done' ? 'verifying' : 'queued') : off ? 'declined' : 'queued';
  return [{ label: 'Apply the change', sub: t.recommended.label, state: ok ? 'done' : off ? 'declined' : 'proposed' },
    { label: 'Replay recent events through it', sub: t.validation ? t.validation.rows[0][0] : '', state: s2 },
    { label: `${o.id} checks that the detection works again`, sub: s3 === 'verifying' && o.progressNote ? o.progressNote : M_AG[o.agent].name, state: s3, link: o.id }];
}
function mPlanBox(t) {
  const p = mPlan(t); if (!p) return '';
  const S = M_PS, pending = t.status === 'pending';
  return `<div>${mLabel(pending ? 'One approval, in this order' : 'After the approval')}
    <div class="mt-2 rounded-xl border border-line overflow-hidden divide-y divide-line">${p.map((s, i) => { const x = S[s.state], spin = ['applying', 'verifying'].includes(s.state);
      return `<div class="px-3 py-2 flex items-center gap-3 bg-sunk"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${s.state === 'done' ? 'bg-cx text-slate-950' : 'bg-line2 text-ink2'}">${i + 1}</span>
        <div class="min-w-0 flex-1"><div class="text-[13px] text-ink leading-snug">${s.link ? `<button onclick="mOpenTask('${s.link}')" class="hover:underline text-left">${esc(s.label)}</button>` : esc(s.label)}</div><div class="text-[11.5px] text-ink3 truncate">${esc(s.sub)}</div></div>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg tn tn-${x[1]} text-[11.5px] font-semibold whitespace-nowrap shrink-0">${ic(x[2], 'w-3 h-3' + (spin ? ' animate-spin' : ''))}${pending && i ? `Waits for step ${i}` : pending ? 'Starts when you approve' : x[0]}</span></div>`; }).join('')}</div>
    ${pending ? `<p class="text-[12px] text-ink3 mt-1.5 leading-relaxed">You do not have to watch. The mission comes back to you only if a step fails.</p>` : ''}</div>`;
}
function mPlanTick(t) { if (mPlan(t) && t.status === 'done') M.timers.push(setTimeout(() => mRender(), 3200)); }
/* One line that says where a mission is, for the queue. */
function mLife(t) {
  const p = mPlan(t);
  if (p && t.status === 'done') { const cur = p.find(s => s.state !== 'done'); return cur ? `${M_PS[cur.state][0]}: step ${p.indexOf(cur) + 1} of ${p.length}` : 'All steps done'; }
  return t.status === 'progress' ? (t.progressNote || 'In progress') : mStatusTxt(t);
}

/* ======================================================================
   WHO IS IN THE MISSION
   The owner, the agents it asked, the agents that asked it, the agents a
   person brought in, and the people who wrote in it. Nobody else.
   ====================================================================== */
const M_AGENTS = ['sec', 'det', 'pipe', 'inv', 'hunt'];
const M_ROLE = { sec: 'Picks the right agent', det: 'Rules, indicators and coverage', pipe: 'Filtering, parsing and normalizing', inv: 'Triage and investigation', hunt: 'Hunts and findings' };
function mMissionAgents(t) {
  const out = [t.agent], add = k => { if (k && M_AG[k] && !out.includes(k)) out.push(k); };
  [t.waitOn, t.unblockedBy, t.unblocks].map(id => id && mTask(id)).forEach(x => x && add(x.agent));
  if (t.trigger.from) add(M_FROM[t.trigger.from]);
  (t.notes || []).forEach(n => { if (!M_PPL[n.who]) add(n.who); if (n.to) add(n.to); });
  (t.invited || []).forEach(add);
  return out;
}
function mPeople(t) {
  const out = [], role = k => {
    if (k === t.agent) return 'Owns this mission';
    const link = [t.waitOn, t.unblockedBy, t.unblocks].map(id => id && mTask(id)).find(x => x && x.agent === k);
    if (link) return `${t.waitOn === link.id ? 'Asked for help' : t.unblocks === link.id ? 'Asked for this' : 'Helped'} · ${link.id}`;
    if (t.trigger.from && M_FROM[t.trigger.from] === k) return 'Handed this over';
    return (t.invited || []).includes(k) ? 'Brought in by you' : 'Asked a question';
  };
  mMissionAgents(t).forEach(k => out.push({ k, role: role(k) }));
  const people = ['me'];
  (t.notes || []).forEach(n => { if (M_PPL[n.who] && !people.includes(n.who)) people.push(n.who); });
  const by = Object.keys(M_PPL).find(k => M_PPL[k].name.replace(/\.$/, '') === String(t.by || '').replace(/\.$/, '')); if (by && !people.includes(by)) people.push(by);
  people.forEach(k => out.push({ k, role: k === 'me' ? 'You' : M_PPL[k].role }));
  return out;
}
function mPeopleBar(t) {
  return `<div class="px-4 sm:px-5 py-3 space-y-2">${mPeople(t).map(p => `<div class="flex items-center gap-2.5 text-[12.5px]">${mWho(p.k, 22)}<span class="min-w-0 flex-1 truncate"><span class="text-ink font-semibold">${esc(M_PPL[p.k] ? M_PPL[p.k].name : M_AG[p.k].name)}</span> <span class="text-ink3">· ${esc(p.role)}</span></span></div>`).join('')}
    <p class="pt-1 text-[12px] text-ink3">Everyone here sees the whole conversation.</p></div>`;
}

/* ======================================================================
   THE MISSION CONVERSATION
   Built from the mission (trigger, steps, handoffs, decision, outcome)
   plus the messages people and agents add. Everyone in the mission sees
   all of it. Private questions belong in a chat.
   ====================================================================== */
function mThreadItems(t) {
  const out = [], run = mRunning(t), n = run ? Math.min(t.shown || 1, t.steps.length) : t.steps.length, from = t.trigger.from && M_FROM[t.trigger.from];
  if (t.decision) t.q0 = t.q0 || t.decision.q;
  out.push({ t: t.opened, kind: 'event', icon: MY_TRIGGER[t.trigger.kind][1], text: `${MY_TRIGGER[t.trigger.kind][0]}${from ? ' from the ' + M_AG[from].name : ''}. ${t.trigger.text}` });
  const u = t.unblocks && mTask(t.unblocks), w = (t.waitOn && mTask(t.waitOn)) || (t.unblockedBy && mTask(t.unblockedBy));
  if (u) out.push({ t: t.opened + 1, kind: 'call', who: t.agent, link: u.id, text: `Joined because the ${M_AG[u.agent].name} asked for help in ${u.id}.` });
  out.push({ t: t.opened + 2, kind: 'work', who: t.agent, steps: t.steps.slice(0, n), run, text: run ? 'Working on it.' : `Finished the analysis in ${n} steps.` });
  if (w) out.push({ t: Math.max(w.opened, t.opened + 3), kind: 'call', who: t.agent, link: w.id, text: `Called the ${M_AG[w.agent].name} for help. The cause is in its area, so ${w.id} was opened${t.waitOn ? ' and this mission waits on it' : ''}.` });
  if (!run && t.q0) out.push({ t: Math.max(t.opened + 4, t.readyAt || 0), kind: 'ask', who: t.agent, text: t.q0 });
  (t.notes || []).forEach(x => out.push(x));
  if (t.status === 'progress' && t.by && !t.recs && t.actedAt) out.push({ t: t.actedAt, kind: 'decision', by: t.by, tone: 'cx', text: `approved. ${t.progressNote}.` });
  if (t.status === 'done') out.push(t.end === 'auto' ? { t: t.closed, kind: 'outcome', who: t.agent, text: t.outcome } : { t: t.closed, kind: 'decision', by: t.by, tone: ['rejected', 'dismissed'].includes(t.end) ? 'slate' : 'cx', text: `${['rejected', 'dismissed'].includes(t.end) ? 'declined' : 'approved'}${(t.ver || 1) > 1 ? ' version ' + (t.decVer || t.ver) : ''}.`, more: String(t.outcome || '').replace(/^(Approved|Declined|Approved with edits|Approved in part|Dismissed) by [^.]+\. ?/, '') });
  return out.map((x, i) => [x, i]).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map(x => x[0]);
}
const mTag = k => `<span class="c-indigo font-semibold">@${esc(M_AG[k] ? M_AG[k].name : M_PPL[k].name)}</span> `;
function mThreadItem(t, x) {
  const when = `<span class="text-[11px] text-ink4 whitespace-nowrap">${mAgo(x.t)}</span>`;
  const name = k => esc(M_PPL[k] ? (k === 'me' ? 'You' : M_PPL[k].name) : M_AG[k].name);
  const quiet = (icon, html, cls = 'text-ink3') => `<div class="flex items-start gap-2.5 text-[12.5px] ${cls} leading-relaxed"><span class="w-[26px] flex justify-center shrink-0 mt-[3px]">${ic(icon, 'w-3.5 h-3.5')}</span><span class="min-w-0 flex-1">${html}</span>${when}</div>`;
  const msg = (k, html, tag = '', after = '') => `<div class="flex gap-2.5">${mWho(k, 26)}<div class="min-w-0 flex-1"><div class="flex items-center gap-2 text-[12.5px] flex-wrap"><b class="text-ink font-semibold">${name(k)}</b>${when}${tag}</div><div class="mt-0.5 text-[13.5px] text-ink2 leading-relaxed">${html}</div>${after}</div></div>`;
  const go = id => `<button onclick="mOpenTask('${id}')" class="font-mono c-indigo hover:underline">${id}</button>`;
  if (x.kind === 'event') return quiet(x.icon, esc(x.text));
  if (x.kind === 'work') return quiet(x.run ? 'loader' : 'list-checks', `${esc(M_AG[x.who].name)}: ${x.run ? 'working on it' : `${x.steps.length} steps`}.<ol class="mt-1.5 space-y-1 list-decimal pl-4">${x.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`);
  if (x.kind === 'call') return quiet('corner-down-right', esc(x.text).replace(x.link, go(x.link)));
  if (x.kind === 'ask') return '';
  if (x.kind === 'minor') return quiet('refresh-cw', `${esc(M_AG[x.who].name)} checked again. ${esc(x.text)}`);
  if (x.kind === 'join') return quiet('user-plus', `You brought in the ${esc(M_AG[x.who].name)}.`);
  if (x.kind === 'outcome') return quiet('circle-check', esc(x.text), 'text-ink2');
  if (x.kind === 'decision') { const k = Object.keys(M_PPL).find(p => M_PPL[p].name.replace(/\.$/, '') === String(x.by || '').replace(/\.$/, '')) || 'me';
    return msg(k, `<b class="text-ink">${k === 'me' ? 'You' : esc(M_PPL[k].name)} ${esc(x.text)}</b>${x.more ? ` <span class="text-ink3">${esc(x.more)}</span>` : ''}`); }
  /* a new version is the one thing in the conversation that asks for an action, so it is the one thing with a frame */
  if (x.kind === 'update') return `<div class="rounded-2xl border border-amber-500/50 px-4 py-3"><div class="flex items-center gap-2 text-[12.5px]">${mAv(x.who, 20)}<b class="text-ink">Version ${x.ver}: ${esc(x.title)}</b><span class="ml-auto">${when}</span></div>
    <ul class="mt-2 space-y-1 list-disc pl-5 text-[13px] text-ink2 leading-relaxed">${x.what.map(s => `<li>${esc(s)}</li>`).join('')}</ul><div class="mt-2 text-[12px] text-ink3">Same object as this mission, so it was added here as a new version, not as a second mission.</div></div>`;
  return msg(x.who, (x.to ? mTag(x.to) : '') + (M_PPL[x.who] ? esc(x.text) : md(x.text)));
}
function mThreadHtml(t) {
  const list = mThreadItems(t);
  /* How the mission started is one quiet line. It opens on request, and while the agent is still working. */
  const story = list.filter(x => ['event', 'work', 'call'].includes(x.kind)), rest = list.filter(x => !story.includes(x)), k = t.id + ':story', run = mRunning(t), open = !!M.more[k] || run;
  const from = t.unblocks && mTask(t.unblocks);
  const line = `<button onclick="M.more['${k}']=!M.more['${k}'];mPanelRender();icons()" class="w-full flex items-center gap-2.5 text-[12.5px] text-ink3 hover:text-ink text-left"><span class="w-[26px] flex justify-center shrink-0">${mAv(t.agent, 20)}</span><span class="min-w-0 flex-1">${esc(M_AG[t.agent].name)} opened this ${mAgo(t.opened)}${from ? `, asked by the ${esc(M_AG[from.agent].name)}` : t.trigger.kind === 'human' ? ', from a request in a chat' : ''}. ${t.steps.length} steps.</span>${run ? '' : ic(open ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5')}</button>`;
  const typing = M.typing && M.typing.key === t.id ? `<div class="flex gap-2.5">${mAv(M.typing.who || t.agent, 26)}<div class="bg-sunk rounded-2xl rounded-tl-md px-3.5 py-3"><span class="inline-flex gap-1 items-center h-4"><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.2s"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.4s"></span></span></div></div>` : '';
  const body = rest.map(x => mThreadItem(t, x)).filter(Boolean).join('');
  return `<div class="space-y-4" id="m-thread">${line}${open ? `<div class="space-y-2.5 pb-1">${story.map(x => mThreadItem(t, x)).join('')}</div>` : ''}
    ${body}${typing}${!body && !typing ? `<p class="text-[12.5px] text-ink4 pl-[36px]">Ask about this mission. Everyone in it sees the conversation.</p>` : ''}</div>`;
}
function mThreadEnd(tid) { if (M.panelTask === tid) setTimeout(mPanelBottom, 30); }
/* ---------- the prompt bar: who answers ----------
   Outside a mission the selector starts on SecOps, which picks the agent.
   In a mission it starts on the owner. The list shows the agents already
   in the mission first. Choosing another one brings it in when you send. */
function mSelHtml(t) {
  const inM = t ? mMissionAgents(t) : [], first = t ? inM : ['sec'], rest = M_AGENTS.filter(k => !first.includes(k) && (!t || k !== 'sec'));
  const row = k => `<button data-to="${k}" onclick="M.to='${k}';M.sel=false;mPanelRender();icons();$('m-cmd').focus()" class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 ${M.to === k ? 'bg-hov' : 'hover:bg-hov/60'}">${mAv(k, 22)}<span class="min-w-0 flex-1"><span class="block text-[13px] text-ink">${esc(M_AG[k].name)}${t && k === t.agent ? ' <span class="text-ink3">· owner</span>' : ''}</span><span class="block text-[11.5px] text-ink3 truncate">${esc(M_ROLE[k])}</span></span>${M.to === k ? ic('check', 'w-4 h-4 c-cx') : ''}</button>`;
  const head = h => `<div class="px-3 pt-2 pb-1 text-[11.5px] text-ink4">${h}</div>`;
  return `<div id="m-sel" class="absolute left-0 bottom-full mb-2 w-[300px] max-w-full rounded-xl bg-panel border border-line2 shadow-2xl p-1.5 z-20">${head(t ? `In ${t.id}` : 'Ask')}${first.map(row).join('')}${rest.length ? head(t ? 'Bring in another agent' : 'Or ask one agent directly') + rest.map(row).join('') : ''}</div>`;
}
/* What an agent that is not the owner says about the mission. Every fact is read from the world. */
function mGuestAnswer(t, k, q) {
  const W = M.W, rules = (t.affects.rules || []).map(mRule).filter(Boolean), src = W.sources.find(s => s.id === t.affects.source);
  if (k === 'inv') { const n = rules.reduce((a, r) => a + (r.issues7d || 0), 0);
    return rules.length ? `I work on cases, not on rules. The ${rules.length === 1 ? 'rule' : rules.length + ' rules'} in this mission usually bring me about **${n.toLocaleString()} issues a week**. ${t.layer === 'rule' ? 'That is the volume this mission changes.' : 'While they are silent, those issues are not created, so I have nothing to triage from them.'}` : 'I work on cases. Nothing in this mission touches a case I am working on.'; }
  if (k === 'pipe') return t.affects.node ? `The cause is at the **${MY_LAYER[t.affects.node.stage].name.toLowerCase()}** step of ${esc(W.pipes.find(p => p.id === t.affects.node.pipe).product)}.` : src ? `The data for this mission comes from **${src.name}**. ${src.instances.some(i => i.status !== 'ok') ? 'One of its instances is stopped.' : 'Its instances are connected and events arrive.'}` : 'Nothing in this mission touches the data pipeline.';
  if (k === 'det') return rules.length ? `The rules here: ${rules.map(r => `${r.name} (ID ${r.id})`).join(', ')}. None of them was edited.` : 'No correlation rule is part of this mission.';
  if (k === 'hunt') return 'No open hunt covers the objects in this mission.';
  return mTaskAnswer(t, q).text;
}
const M_CHANGES = /^(also|add|include|re-?run|run again|check again|re-?check|extend|look at|look for|test)\b/i;
const M_REQUEST = /^(please )?(check why|find out why|look into|investigate|fix|create|write|build|tune|add a rule)\b/i;
function mSend(q) {
  const el = $('m-cmd'); q = (q || el.value || '').trim(); if (!q) return; el.value = ''; M.sel = false;
  const t = M.panelTask && mTask(M.panelTask), o = !t && M.panelObj;
  if (t) return mSendMission(t, q);
  const key = o ? o.kind + ':' + o.id : M.chatKey, meta = key === '_' ? M.chatMeta : M.hist.find(h => h.id === key), about = meta && meta.task && mTask(meta.task);
  let a;
  if (o && o.kind === 'tech' && /review/i.test(q)) a = { text: 'Checked. The data this technique needs is already ingested, and no built-in or Marketplace content covers it. A correlation rule can be written for it. Say **open a mission** and the Detection Engineer will draft one and test it silently before it asks you.' };
  /* A private chat about a mission: answers, never decisions. Decisions happen in the mission, where everyone sees them. */
  else if (about) { const x = mTaskAnswer(about, q); a = x.act ? { text: `Decisions are made in the mission, where everyone in it can see them. Open **${about.id}** to ${x.act === 'reject' ? 'decline' : 'approve'}.`, task: about.id } : { text: x.text }; }
  /* A request for work: the agent opens a mission, and the chat links to it. */
  else if (M_REQUEST.test(q) && /check ?point/i.test(q)) { const n = M.W.incoming.findIndex(x => x.id === 'MSN-1009'), x = M.W.incoming[n];
    if (x && !M.W.tasks.includes(x)) { x.trigger = { kind: 'human', text: `${M_USER} asked in a chat: “${q}”` }; mLater(900, () => mArrive(n)); a = { text: `That needs work in your environment, so I opened **${x.id}** for it. The ${M_AG[x.agent].name} owns it. You can leave: it is on the Missions screen and comes back to you when there is something to decide. This chat stays private.`, task: x.id }; }
    else a = { text: `It is already running in **MSN-1009**.`, task: 'MSN-1009' }; }
  else if (M_REQUEST.test(q)) a = { text: 'That needs work in your environment, so it would become a mission. In this demo, try: **Check why Check Point verdicts are missing**.' };
  else a = mAnswer(q);
  if (!(M.chats[key] || []).length && key === '_') M.chatMeta = { title: a.task && !about ? mTask(a.task) ? mTask(a.task).title : q : q.replace(/\?$/, ''), task: a.task || null, t: Date.now() };
  (M.chats[key] = M.chats[key] || []).push({ role: 'user', text: q });
  M.typing = { key }; mPanelRender(); icons(); mPanelBottom();
  const who = M.to !== 'sec' && M_AG[M.to] ? M.to : a.agent || 'sec';
  mLater(650, () => { M.typing = null; M.chats[key].push({ role: 'agent', agent: who, text: a.text, task: a.task }); mPanelRender(); icons(); mPanelBottom(); });
}
function mSendMission(t, q) {
  const to = M_AG[M.to] && M.to !== 'sec' ? M.to : t.agent, a = mTaskAnswer(t, q), change = !a.act && M_CHANGES.test(q) && t.status !== 'done';
  /* An agent that is not in the mission yet joins when it is asked. */
  if (!mMissionAgents(t).includes(to)) { (t.invited = t.invited || []).push(to); mNote(t.id, { who: to, kind: 'join' }); }
  mNote(t.id, { who: 'me', kind: 'msg', text: q, to: mMissionAgents(t).length > 1 || to !== t.agent ? to : null });
  M.typing = { key: t.id, who: to }; mPanelRender(); icons(); mPanelBottom();
  mLater(650, () => { M.typing = null;
    if (a.act && to === t.agent) return mDecide(t.id, a.act);
    if (change && to === t.agent) {
      mNote(t.id, { who: to, kind: 'msg', text: M_UPD[t.id] && !t.next && (t.ver || 1) === 1 ? 'On it. If the proposal changes I will post a **new version** here, and it will need a human again.' : 'Checked. Nothing new was found, so the proposal stays as it is.' });
      if (M_UPD[t.id]) M.timers.push(setTimeout(() => mUpdate(t.id, 'material'), 2600));
    } else mNote(t.id, { who: to, kind: 'msg', text: to === t.agent ? a.text : mGuestAnswer(t, to, q) });
    mPanelRender(); icons(); mPanelBottom(); });
}
/* A private question about a mission goes to a chat, linked to the mission. */
function mAskPrivately(tid) {
  const t = mTask(tid); if (!t) return;
  if ((M.chats._ || []).length) { const id = 'c' + Date.now(); M.hist.unshift(Object.assign({ id }, M.chatMeta || { title: 'Chat', t: Date.now() })); M.chats[id] = M.chats._; }
  M.chatKey = '_'; M.chatMeta = { title: `About ${t.id}: ${t.title}`, task: t.id, t: Date.now() };
  M.chats._ = [{ role: 'agent', text: `This chat is private. Ask anything about **${t.id}**. Nothing here is posted to the mission, and decisions are made in the mission.` }];
  mPanelHome(); const el = $('m-cmd'); if (el) el.focus();
}

/* ======================================================================
   THE QUEUE: moving between missions
   ====================================================================== */
const mMine = t => String(t.by || '').replace(/\.$/, '') === mMe();
function mQueue() {
  const W = M.W;
  return { need: myPendingTasks(W), mine: W.tasks.filter(t => (t.status === 'progress' && mMine(t)) || (t.status === 'done' && mMine(t) && mPlan(t) && mPlan(t).some(s => s.state !== 'done'))), wait: myWaiting(W), run: W.tasks.filter(t => t.status === 'progress' && !mMine(t)) };
}
function mMove(dir) {
  const t = M.panelTask && mTask(M.panelTask); if (!t) return;
  const ids = mDeckOn(t) ? M.deck : myPendingTasks(M.W).map(x => x.id), n = ids.length; if (!n) return;
  let i = ids.indexOf(t.id); if (i < 0) return mOpenTask(ids[0]);
  for (let k = 0; k < n; k++) { i = (i + dir + n) % n; if (mTask(ids[i]).status === 'pending' || n === 1) break; }
  if (ids[i] !== t.id) mOpenTask(ids[i]);
}
function mQRow(t, sel) {
  const meta = t.status === 'pending' && !t.waitOn ? `${t.impact} · ${myAge(Date.now() - t.opened)}` : t.waitOn ? 'waits on ' + t.waitOn : mLife(t);
  return `<button data-q="${t.id}" onclick="mOpenTask('${t.id}')" class="w-full text-left px-3 py-2.5 rounded-xl ${sel ? 'bg-hov' : 'hover:bg-hov/60'}">
    <span class="flex items-start gap-2"><span class="min-w-0 flex-1 text-[13.5px] leading-snug line-clamp-2 ${t.unread ? 'text-ink font-bold' : sel ? 'text-ink' : 'text-ink2'}">${esc(t.title)}</span>${t.unread ? `<span class="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" title="Changed since you last looked"></span>` : ''}</span>
    <span class="block text-[11.5px] text-ink4 mt-1 truncate">${t.id} · ${esc(meta)}</span></button>`;
}
function mRailHtml() {
  const q = mQueue(), cur = M.panelTask;
  const group = (key, title, n, body) => { if (!n) return ''; const k = 'rail:' + key, on = !!M.more[k];
    return `<div class="mt-2"><button onclick="M.more['${k}']=!M.more['${k}'];mPanelRender();icons()" class="w-full px-3 py-2 flex items-center justify-between text-[12.5px] text-ink3 hover:text-ink"><span>${title}</span><span class="inline-flex items-center gap-1.5">${n}${ic(on ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5')}</span></button>${on ? `<div class="space-y-0.5">${body}</div>` : ''}</div>`; };
  const chat = (id, title, task, on) => `<button onclick="${id ? `mOpenChat('${id}')` : `mOpenTask('${task}')`}" class="w-full text-left px-3 py-2 rounded-xl ${on ? 'bg-hov' : 'hover:bg-hov/60'}"><span class="block text-[13.5px] text-ink2 truncate">${esc(title)}</span>${task ? `<span class="block text-[11.5px] text-ink4 mt-0.5">${task}</span>` : ''}</button>`;
  const live = (M.chats._ || []).length && M.chatMeta ? chat('_', M.chatMeta.title, M.chatMeta.task, !cur && !M.panelObj && M.chatKey === '_') : '';
  const chats = live + M.hist.map(h => chat(h.id, h.title, h.task, !cur && !M.panelObj && M.chatKey === h.id)).join('');
  return `<div class="px-3 pt-3 pb-2 shrink-0 flex items-center gap-1">
      <button data-act="newchat" onclick="mNewChat()" class="flex-1 px-3 py-2 rounded-xl text-[13.5px] text-ink hover:bg-hov inline-flex items-center gap-2.5">${ic('square-pen', 'w-4 h-4 text-ink3')}New chat</button></div>
    <div class="flex-1 overflow-y-auto px-2 pb-3">
      <div class="px-3 pt-3 pb-2 text-[12.5px] text-ink3">Needs a human · ${q.need.length}</div>
      <div class="space-y-0.5">${q.need.map(t => mQRow(t, t.id === cur)).join('') || `<div class="px-3 py-2 text-[12.5px] text-ink4">Nothing right now.</div>`}</div>
      ${group('mine', 'Approved by you, in progress', q.mine.length, q.mine.map(t => mQRow(t, t.id === cur)).join(''))}
      ${group('wait', 'Waiting on another mission', q.wait.length, q.wait.map(t => mQRow(t, t.id === cur)).join(''))}
      ${group('chats', 'Your chats', M.hist.length + (live ? 1 : 0), chats)}
    </div>`;
}
function mNewChat() {
  if ((M.chats._ || []).length) { const id = 'c' + Date.now(); M.hist.unshift(Object.assign({ id }, M.chatMeta || { title: 'Chat', t: Date.now() })); M.chats[id] = M.chats._; M.chats._ = []; M.chatMeta = null; }
  M.chatKey = '_'; mPanelHome(); const el = $('m-cmd'); if (el) el.focus();
}
function mOpenChat(id) { M.chatKey = id; M.panelOpen = true; mPanelHome(); mPanelBottom(); }

/* ======================================================================
   STANDING BY: the agent speaks first
   ====================================================================== */
function mFastCard(t) {
  const d = t.decision;
  return `<div data-fast="${t.id}" class="rounded-2xl border border-line2 bg-card p-3.5">
    <div class="flex items-center gap-2 flex-wrap">${mSug(t.sug, { solid: true })}${mConf(t.conf)}${mImpact(t.impact)}<span class="font-mono text-[11.5px] text-ink3 ml-auto">${t.id}</span></div>
    <button onclick="mOpenTask('${t.id}')" class="block text-left mt-2 text-[14.5px] font-bold text-ink leading-snug hover:underline">${esc(t.title)}</button>
    <p class="text-[13px] text-ink2 leading-relaxed mt-1">${esc(d.effect)}</p>
    <div class="mt-2.5 flex items-center gap-2 flex-wrap"><button data-fast-ok="${t.id}" onclick="mDecide('${t.id}','approve')" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 hover:opacity-90">${ic('check', 'w-3.5 h-3.5')}${esc(d.approve)}</button><button onclick="mDecide('${t.id}','reject')" class="px-3.5 py-2 rounded-xl tn tn-rose text-[13px] font-bold">Decline</button>
      <button onclick="mOpenTask('${t.id}')" class="ml-auto px-3 py-2 rounded-xl text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1">Open the mission${ic('arrow-right', 'w-3.5 h-3.5')}</button></div></div>`;
}
function mStandby() {
  const W = M.W, st = myStats(W), run = W.tasks.find(mRunning), q = mQueue(), key = M.chatKey, chat = mChatHtml(key), work = mSize() === 'work';
  const label = run ? `Working on ${run.id}` : 'Standing by';
  if (chat && key === '_' && !M.chatMeta) M.chatMeta = { title: 'Decisions review', task: null, t: Date.now() };
  if (chat) { const h = M.hist.find(x => x.id === key) || M.chatMeta;
    return `<div class="space-y-4 ${work ? 'max-w-[760px] mx-auto' : ''}"><div class="flex items-center gap-3 pb-3 border-b border-line">${mAv('sec', 40, true)}<div class="min-w-0 flex-1"><div class="text-[15px] font-bold text-ink truncate">${esc(h ? h.title : 'Chat')}</div><div class="text-[12px] text-ink3 inline-flex items-center gap-1.5">${ic('lock', 'w-3 h-3')}Private chat${h && h.task ? ` · about <button onclick="mOpenTask('${h.task}')" class="font-mono c-indigo hover:underline">${h.task}</button>` : ''}</div></div></div>${chat}</div>`; }
  const auto = W.tasks.filter(t => t.status === 'done' && t.end === 'auto').length, n = q.need.length, show = q.need.slice(0, work ? 3 : 2);
  const line = `**${n}** mission${n === 1 ? ' needs' : 's need'} a human. **${q.wait.length}** wait${q.wait.length === 1 ? 's' : ''} on another mission and will continue on ${q.wait.length === 1 ? 'its' : 'their'} own. **${st.progress}** ${st.progress === 1 ? 'is' : 'are'} in progress and need${st.progress === 1 ? 's' : ''} nothing from you${auto ? `, and **${auto}** closed on ${auto === 1 ? 'its' : 'their'} own` : ''}.`;
  return `<div class="${work ? 'max-w-[760px] mx-auto pt-6' : 'pt-2'} space-y-4">
    <div class="flex items-center gap-3.5">${mAv('sec', work ? 64 : 48, true)}<div><div class="text-[20px] font-black text-ink leading-tight">SecOps</div><div class="text-[13px] c-blue font-semibold flex items-center gap-1.5">${run ? `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>` : ''}${label}</div></div></div>
    <div class="rounded-2xl rounded-tl-md px-4 py-3 bg-card border border-line text-[14px] text-ink2 leading-relaxed">${md(`Here is where things stand. ${line}`)}${n ? md(`\n\nThe ${show.length === 1 ? 'first one is' : `first ${show.length} are`} below, most valuable first. You can decide from here, or open one to see the evidence and the conversation.`) : md('\n\nNothing is waiting for you.')}</div>
    ${show.map(mFastCard).join('')}
    ${n > show.length ? `<button onclick="M.tab='pending';mClosePanel()" class="text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1.5">See all ${n} on the Missions screen${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : ''}</div>`;
}

/* ======================================================================
   THE PANEL
   One rule for both sizes: the panel is a conversation, and the mission is
   a card in it. In the side panel the card is short and sits at the top of
   the conversation; "Show details" opens the full card in place. In the
   workspace the same card is open in full, next to the conversation. Same
   mission, same version, same buttons.
   ====================================================================== */
/* What a mission changes. One object has at most one open mission that changes it. */
function mChangesTxt(t) {
  if (t.waitOn) { const o = mTask(t.waitOn); return `nothing. ${o.id} changes the ${(o.recommended ? o.recommended.label.split(' · ')[0] : 'object').toLowerCase()}`; }
  const b = t.recommended || t.current; if (!b) return '';
  return /^\w+ rules$/i.test(b.label) ? 'rules ' + (t.affects.rules || []).join(', ') : b.label;
}
function mMini(t) {
  const d = t.decision, k = t.id + ':full', pending = t.status === 'pending' && d, ch = mChangesTxt(t);
  const state = pending ? `<div class="mt-3"><div class="text-[14.5px] font-bold text-ink leading-snug">${esc(d.q)}</div><p class="text-[13px] text-ink2 leading-relaxed mt-1">${esc(d.effect)}</p></div>`
    : t.status === 'pending' && t.waitOn ? `<p class="mt-3 text-[13px] text-ink2 leading-relaxed">Nothing to decide here. It waits on <button onclick="mOpenTask('${t.waitOn}')" class="font-mono c-indigo hover:underline">${t.waitOn}</button> and continues on its own.</p>`
    : t.status === 'progress' ? `<p class="mt-3 text-[13px] text-ink2 leading-relaxed">No decision needed now. ${esc(t.progressNote || '')}.</p>`
    : `<p class="mt-3 text-[13px] text-ink2 leading-relaxed">${esc(t.outcome || '')}</p>`;
  return `<div data-card="short">${mCardBanners(t)}<div class="${t.next || t.lockBy ? 'mt-4' : ''}">
    <div class="flex items-center gap-2 flex-wrap">${mSug(t.sug, { solid: true })}<span class="text-[12px] text-ink3">${esc(MY_CARD[t.card])}</span>${mVerTag(t)}</div>
    <h2 class="text-[17px] font-bold text-ink leading-snug mt-2">${esc(t.title)}</h2>
    ${ch ? `<div class="text-[12.5px] text-ink3 mt-1">Changes: <span class="text-ink2">${esc(ch)}</span></div>` : ''}
    <p class="text-[13.5px] text-ink2 leading-relaxed mt-2">${esc(t.summary)}</p>${state}
    <button data-act="details" onclick="M.more['${k}']=true;mPanelRender();icons()" class="mt-3 text-[13px] c-indigo hover:underline inline-flex items-center gap-1">Show details${ic('chevron-down', 'w-3.5 h-3.5')}</button></div></div>`;
}
function mScrollInit() {
  const sc = $('m-panel-scroll'), art = $('m-art-scroll'); if (!sc) return;
  const two = mSize() === 'work' && mWide() && !!M.panelTask;
  if (art) art.scrollTop = 0;
  sc.scrollTop = two ? sc.scrollHeight : 0;
}
function mPanelRender() {
  mPanelShow(); mScnBar(); if (!mPanelOn()) return;
  const W = M.W, t = M.panelTask && mTask(M.panelTask), o = !t && M.panelObj, pend = myPendingTasks(W), work = mSize() === 'work', wide = mWide();
  const head = $('m-panel-head'), body = $('m-panel-scroll'), pending = t && t.status === 'pending' && t.decision, two = work && wide && !!t;
  const btn = (fn, icon, title, extra = '') => `<button ${extra} onclick="${fn}" class="w-8 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center shrink-0" title="${title}">${ic(icon, 'w-[18px] h-[18px]')}</button>`;
  /* the queue on the left, in the workspace only */
  const rail = $('m-ws-rail'), railOn = work && wide; rail.classList.toggle('hidden', !railOn); rail.classList.toggle('flex', railOn);
  if (railOn) { const rs = rail.querySelector('.overflow-y-auto'), top = rs ? rs.scrollTop : 0; rail.innerHTML = mRailHtml(); const r2 = rail.querySelector('.overflow-y-auto'); if (r2) r2.scrollTop = top; }
  /* head, one row: what this is, who is in it, the way to the next one, close */
  const ids = t ? pend.map(x => x.id) : [], i = t ? ids.indexOf(t.id) : -1;
  const o2 = t && t.waitOn && mTask(t.waitOn);
  const status = !t ? '' : t.status === 'done' ? mStatus(t) : o2 ? `<span class="text-[12.5px] c-indigo whitespace-nowrap">Waits on the ${M_AG[o2.agent].name}</span>` : t.status === 'pending' ? `<span class="text-[12.5px] c-amber whitespace-nowrap">Needs a human</span>` : `<span class="text-[12.5px] c-blue whitespace-nowrap">${t.handed ? 'Waits on another team' : 'Agent is working'}</span>`;
  const left = `${t || o ? btn('mPanelHome()', 'arrow-left', 'Back to the conversation (Esc)') : ''}
    ${t ? `<span class="text-[13.5px] font-semibold text-ink font-mono whitespace-nowrap">${t.id}</span><span class="min-w-0 truncate">${status}</span>`
      : o ? `<span class="text-[13.5px] font-semibold text-ink whitespace-nowrap">${o.kind === 'rule' ? 'Correlation rule ' + o.id : o.kind === 'tech' ? 'Technique ' + o.id : 'IOC rule ' + o.id}</span>`
      : `<span class="font-semibold text-ink text-[13.5px]">AgentiX</span><span class="text-[12.5px] text-ink3 truncate">${W.tasks.some(mRunning) ? 'Working' : 'Standing by'}</span>`}`;
  const ps = t ? mPeople(t) : [];
  const people = !t ? '' : work && wide ? `<button data-act="people" onclick="M.people=!M.people;M.sel=false;mPanelRender();icons()" class="flex items-center rounded-full hover:bg-hov px-1 py-0.5 shrink-0" title="${ps.length} in this mission. Click for the list"><span class="flex -space-x-1.5">${ps.slice(0, 6).map(p => `<span class="rounded-full ring-2 ring-[rgb(var(--panel))] inline-flex">${mWho(p.k, 22)}</span>`).join('')}</span>${ps.length > 6 ? `<span class="ml-1 text-[11.5px] text-ink3">+${ps.length - 6}</span>` : ''}</button>`
    : `<button data-act="people" onclick="M.people=!M.people;M.sel=false;mPanelRender();icons()" class="h-8 px-1.5 rounded-lg hover:bg-hov text-ink3 hover:text-ink inline-flex items-center gap-1 text-[12.5px] shrink-0" title="${ps.length} in this mission. Click for the list">${ic('users', 'w-4 h-4')}${ps.length}</button>`;
  const nav = t && ids.length > 1 ? `<div class="flex items-center shrink-0"><button data-act="prev" onclick="mMove(-1)" class="w-7 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Previous mission (← or K)">${ic('chevron-left', 'w-4 h-4')}</button><span data-act="switch" class="px-1 text-[12.5px] text-ink3 whitespace-nowrap" title="${ids.length} missions need a human">${i >= 0 ? `${i + 1} / ${ids.length}` : ids.length}</span><button data-act="next" onclick="mMove(1)" class="w-7 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Next mission (→ or J)">${ic('chevron-right', 'w-4 h-4')}</button></div>` : '';
  head.innerHTML = `<div class="flex items-center gap-2.5 min-w-0">${left}</div><div class="flex items-center gap-1 shrink-0">${people}${nav}${wide ? btn('mSizeToggle()', work ? 'minimize-2' : 'maximize-2', work ? 'Shrink to a side panel (F)' : 'Open as the workspace (F)', 'data-act="size"') : ''}${btn('mClosePanel()', 'x', 'Close (Esc)', 'data-act="close"')}</div>`;
  const ppl = $('m-people'); ppl.classList.toggle('hidden', !(t && M.people)); ppl.innerHTML = t && M.people ? mPeopleBar(t) : '';
  /* body */
  const art = $('m-art'); art.classList.toggle('hidden', !two); art.classList.toggle('flex', two);
  const full = t && (two || M.more[t.id + ':full'] || M.editing === t.id), card = !t ? '' : mRunning(t) ? mWorking(t) : full ? mCard(t) : mMini(t);
  if (two) { $('m-art-scroll').innerHTML = `<div class="m-flat">${card}</div>`; body.innerHTML = `<div class="max-w-[680px] mx-auto">${mThreadHtml(t)}</div>`; }
  else { $('m-art-scroll').innerHTML = ''; body.innerHTML = t ? `<div class="${work && wide ? 'max-w-[720px] mx-auto' : ''}"><div class="m-flat">${card}</div>${full && !mRunning(t) ? `<button onclick="M.more['${t.id}:full']=false;mPanelRender();icons()" class="mt-2 text-[13px] c-indigo hover:underline inline-flex items-center gap-1">Show less${ic('chevron-up', 'w-3.5 h-3.5')}</button>` : ''}<div class="mt-5 pt-5 border-t border-line">${mThreadHtml(t)}</div></div>` : o ? mObjCard(o) : mStandby(); }
  /* the decision: two buttons. Everything else is behind "more". */
  const foot = two ? $('m-art-acts') : $('m-panel-acts'); (two ? $('m-panel-acts') : $('m-art-acts')).innerHTML = '';
  const big = 'py-2.5 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2';
  if (pending && t.next) foot.innerHTML = `<button data-act="see2" onclick="mSeeUpdate('${t.id}')" class="w-full ${big} bg-amber-500 hover:bg-amber-400 text-slate-950">Show version ${(t.ver || 1) + 1} before deciding</button>`;
  else if (pending && M.editing === t.id) foot.innerHTML = `<div class="flex gap-2"><button onclick="mDecide('${t.id}','edit')" class="flex-[1.5] ${big} bg-ink text-panel">Approve my version</button><button onclick="M.editing=null;mPanelRender();icons()" class="flex-1 ${big} border border-line2 text-ink2 hover:bg-hov">Cancel</button></div>`;
  else if (pending) { const d = t.decision, canEdit = t.current && t.recommended && !t.affects.instance && t.card !== 'content', pv = (t.pivots || [])[0], pvOn = pv && M.view !== pv[0];
    const item = (fn, icon, label) => `<button onclick="M.menu=false;${fn}" class="w-full text-left px-3 py-2 rounded-lg hover:bg-hov text-[13px] text-ink2 hover:text-ink flex items-center gap-2.5">${ic(icon, 'w-4 h-4 text-ink3')}${label}</button>`;
    const menu = M.menu ? `<div id="m-menu" class="absolute right-0 bottom-full mb-2 w-64 rounded-xl bg-panel border border-line2 shadow-2xl p-1.5 z-10">${canEdit ? item(`M.editing='${t.id}';M.more['${t.id}:why']=false;mPanelRender();icons();const e=$('m-edit');if(e){e.scrollIntoView({block:'center'});e.focus();}`, 'pencil', 'Edit the change, then approve') : ''}${pvOn ? item(`mPivot('${t.id}','${pv[0]}')`, 'arrow-up-right', `Open in ${esc(pv[1])}`) : ''}</div>` : '';
    foot.innerHTML = `<div class="flex gap-2 relative">
      <button data-act="approve" onclick="mDecide('${t.id}','approve')" class="flex-[1.5] min-w-0 ${big} bg-ink text-panel hover:opacity-90" title="A"><span class="truncate">${esc(d.approve)}</span></button>
      <button data-act="reject" onclick="mDecide('${t.id}','reject')" class="flex-1 min-w-0 ${big} border border-line2 text-ink2 hover:text-ink hover:bg-hov" title="D">Decline</button>
      <button data-act="more" onclick="M.menu=!M.menu;mPanelRender();icons()" class="w-11 shrink-0 ${big} border border-line2 text-ink3 hover:text-ink hover:bg-hov" title="More">${ic('ellipsis', 'w-4 h-4')}</button>${menu}</div>${(t.ver || 1) > 1 ? `<div class="mt-1.5 text-[11.5px] text-ink4 text-center">You are deciding on version ${t.ver}.</div>` : ''}`; }
  else if (t && t.status !== 'pending' && pend.length) foot.innerHTML = `<div class="flex items-center justify-between gap-3"><span class="text-[13px] text-ink3 truncate">${esc(M.lastDecision && M.lastDecision.id === t.id ? M.lastDecision.text : '')}</span><button data-act="next" onclick="mOpenTask('${pend[0].id}')" class="px-4 ${big} bg-ink text-panel whitespace-nowrap">Next mission${ic('arrow-right', 'w-4 h-4')}</button></div>`;
  else if (!t && !o && !mChatHtml(M.chatKey)) foot.innerHTML = `<div class="flex flex-wrap gap-1.5 justify-center">${[['Brief me', "mSend('Brief me')"], ['Why did SentinelOne break?', "mSend('Why did SentinelOne break?')"], ['Are we covered for impossible travel?', "mSend('Are we covered for impossible travel?')"]].map(([l, f]) => `<button onclick="${f}" class="px-3 py-1.5 rounded-full border border-line2 text-[12.5px] text-ink2 hover:text-ink hover:bg-hov">${esc(l)}</button>`).join('')}</div>`;
  else foot.innerHTML = '';
  /* the composer: who answers, and one line that says who sees it */
  $('m-foot').className = `px-4 pb-4 pt-3 shrink-0 space-y-2 ${work && wide ? 'w-full max-w-[720px] mx-auto' : ''}`;
  if (t && (!M_AG[M.to] || M.to === 'sec')) M.to = t.agent; if (!t && !M_AG[M.to]) M.to = 'sec';
  const to = M_AG[M.to] ? M.to : t ? t.agent : 'sec', joins = t && !mMissionAgents(t).includes(to);
  $('m-say').innerHTML = M.sel ? mSelHtml(t) : '';
  const tb = $('m-to'); tb.innerHTML = `${mAv(to, 18)}<span class="max-w-[150px] truncate">${esc(M_AG[to].name)}</span>${ic('chevron-down', 'w-3.5 h-3.5 text-ink3')}`;
  tb.dataset.to = to; tb.title = to === 'sec' && !t ? 'SecOps picks the right agent. Click to ask one agent directly.' : 'Who answers. Click to change.';
  $('m-cmd-box').className = 'flex-1 min-w-0 flex items-center rounded-2xl bg-sunk border border-line focus-within:border-line2 transition';
  $('m-cmd').placeholder = joins ? `Ask the ${M_AG[to].name}. It joins ${t.id}…` : t ? `Ask the ${M_AG[to].name}…` : to === 'sec' ? 'Ask anything, or ask for work…' : `Ask the ${M_AG[to].name}…`;
  $('m-hint').innerHTML = t ? `Everyone in ${t.id} sees this conversation. <button data-act="private" onclick="mAskPrivately('${t.id}')" class="text-ink3 hover:text-ink underline underline-offset-2">Ask privately in a chat</button>` : '';
}

/* ======================================================================
   DEMO SCENARIOS
   Each one starts from a fresh world and sets up one situation, so every
   state of the panel can be seen without playing the whole story.
   ====================================================================== */
const mLater = (ms, fn) => M.timers.push(setTimeout(fn, ms));
const mScnSee = sel => mLater(350, () => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
const mScnOpen = (id, keepDeck) => { mNav('work'); mOpenTask(id); if (!keepDeck) { M.deck = null; mRender(); } };
const M_SCN = [
  ['The Missions screen, panel closed', 'The whole screen and its widgets, live. A new trigger arrives in a moment. The AgentiX icon is in the top right corner, with the number of missions that need a human.',
    () => { mNav('work'); mLater(1600, () => mArrive(0)); }],
  ['AgentiX opens with no mission', 'The panel covers the screen and the agent speaks first. The selector in the prompt bar says SecOps: it picks the right agent, so you do not have to know who does what. Click it to ask one agent directly.',
    () => { mNav('work'); mOpenPanel(); }],
  ['A mission in the workspace', 'Right: the mission. “Changes:” under the title says which object it changes. Middle: the conversation. Top: who is in it. Under the input: everyone in the mission sees this conversation.',
    () => { mScnOpen('MSN-1012'); }],
  ['Ask the owner of the mission', 'The selector starts on the owner, the Pipeline Engineer. The question and the answer are part of the mission, and everyone in it sees them. There is no private mode inside a mission.',
    () => { mScnOpen('MSN-1012'); mLater(900, () => mSend('What is the risk?')); }],
  ['An agent asks another agent a question', 'The Detection Engineer tags the Investigation Agent and gets an answer in the same conversation. A question does not create a mission. The Investigation Agent now shows among the avatars.',
    () => { mScnOpen('MSN-1002'); }],
  ['A change in another agent’s area', 'The Detection Engineer asks the Pipeline Engineer. The answer shows the cause is in the data model, which the Pipeline Engineer owns, so it becomes its own mission: MSN-1012. This one changes nothing and waits on it.',
    () => { mScnOpen('MSN-1001'); }],
  ['Bring in another agent', 'You open the selector. Agents already in the mission come first. You pick the Investigation Agent and ask it. It joins the mission (one quiet line says so), and its answer is tagged to you.',
    () => { mScnOpen('MSN-1012'); mLater(700, () => { M.sel = true; mPanelRender(); icons(); }); mLater(1900, () => { M.to = 'inv'; M.sel = false; mPanelRender(); icons(); }); mLater(2500, () => mSend('How many issues did these rules create last week?')); }],
  ['Ask privately in a chat', '“Ask privately in a chat”, under the input, opens your own chat about the mission. Answers come here and nothing is posted to the mission. Asking to approve sends you back to the mission, where decisions are made.',
    () => { mScnOpen('MSN-1012'); mLater(900, () => mAskPrivately('MSN-1012')); mLater(1500, () => mSend('What is the risk?')); mLater(2900, () => mSend('Approve it')); }],
  ['A chat that becomes a mission', 'A question in a chat gets an answer and stays a chat. A request for work becomes a mission: the agent opens MSN-1009, links it, and the chat stays private. The mission runs on the Missions screen.',
    () => { mNav('work'); mOpenPanel(); mLater(900, () => mSend('Check why Check Point verdicts are missing in XSIAM')); }],
  ['An instruction that changes the mission', 'You ask for more work. The owner goes back to it and posts version 2. Approve is replaced until you have seen the new version.',
    () => { mScnOpen('MSN-1012'); mLater(900, () => mSend('Also check other renamed fields')); }],
  ['A new finding on the same object', 'The agent found a second problem in the same data model. It does not open a second mission, because one object has one open mission. The finding becomes version 2 of this one. What is on screen does not change until you ask.',
    () => { mScnOpen('MSN-1012'); mLater(1700, () => mUpdate('MSN-1012', 'material')); }],
  ['A small update, in place', 'A re-check that changes nothing in the proposal. No new version and nothing to acknowledge: one line in the conversation and a short note on the mission.',
    () => { mScnOpen('MSN-1012'); mLater(1500, () => mUpdate('MSN-1012', 'minor')); }],
  ['Someone else decided first', 'Dana K. approved the mission while you had it open. It locks and says who decided. You stay on it. The first version learns this on its next check or when you press Approve, without live presence.',
    () => { mScnOpen('MSN-1012'); mLater(2300, () => mOther('MSN-1012', 'dana', 'approve')); }],
  ['The object was fixed outside the mission', 'On Data Sources a person replaces the expired key by hand. The mission that held this instance sees the data arrive and closes itself. Nobody has to approve it.',
    () => { mNav('sources'); mOpenTask('MSN-1003'); mLater(1900, () => mDoReconnect('s3-audit')); }],
  ['One approval, steps in order', 'The steps depend on each other, so there is one Approve for the plan. After it: step 1 is applied, step 2 runs, then MSN-1001 checks the rules and closes on its own.',
    () => { mScnOpen('MSN-1012'); mLater(1600, () => mDecide('MSN-1012', 'approve')); mLater(2000, () => { const a = $('m-art-scroll'); if (a) a.scrollTo({ top: a.scrollHeight, behavior: 'smooth' }); }); }],
  ['Approve and move on', 'After Approve the next mission comes up on its own. The approved one moves to “Approved by you, in progress” on the left and returns only if it needs you.',
    () => { mNav('work'); mReviewAll(); mLater(1700, () => { const t = M.panelTask && mTask(M.panelTask); if (t) mDecide(t.id, 'approve'); }); }],
  ['Side panel: the short card', 'On a native screen the table stays the working area. The panel is the same conversation, with the short form of the same mission card on top: title, what it changes, the question. Approve and Decline are fixed at the bottom.',
    () => { mNav('rules'); mOpenTask('MSN-1002'); }],
  ['Side panel: details in place', '“Show details” opens the full card in place, and “Show less” closes it. The expand button (F) shows the same mission in the workspace. Nothing else differs between the two sizes.',
    () => { mNav('rules'); mOpenTask('MSN-1002'); mLater(1100, () => { M.more['MSN-1002:full'] = true; mPanelRender(); icons(); }); }]
];
function mScn(i) {
  i = (i + M_SCN.length) % M_SCN.length;
  closeDemoMenu(); mSheetShow(false); mInit(); mLiveStop(); M.scn = i; M.scnBar = true;
  M_SCN[i][2]();
}
function mScnBar() {
  const el = $('m-scn'); if (!el) return; el.classList.toggle('hidden', !M.scnBar); if (!M.scnBar) { el.innerHTML = ''; return; }
  const i = M.scn, sig = `${i}`; if (el.dataset.sig === sig) return; el.dataset.sig = sig;
  el.className = 'shrink-0 m-scnbar';
  el.innerHTML = `<div class="flex items-center gap-2.5 px-3 py-1.5 pr-14">
    <span class="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10.5px] font-black tracking-wider shrink-0">DEMO</span>
    <button onclick="mScn((M.scn ?? 0) - 1)" class="w-7 h-7 rounded-lg hover:bg-hov text-ink2 flex items-center justify-center shrink-0" title="Previous scenario">${ic('chevron-left', 'w-4 h-4')}</button>
    <select id="m-scn-sel" onchange="mScn(+this.value)" class="bg-sunk border border-line2 rounded-lg text-[12.5px] text-ink px-2 py-1 max-w-[300px] shrink-0 focus:outline-none">${i === null ? `<option value="" selected disabled>Pick a scenario…</option>` : ''}${M_SCN.map((s, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${k + 1}. ${esc(s[0])}</option>`).join('')}</select>
    <button data-act="scn-next" onclick="mScn((M.scn ?? -1) + 1)" class="w-7 h-7 rounded-lg hover:bg-hov text-ink2 flex items-center justify-center shrink-0" title="Next scenario">${ic('chevron-right', 'w-4 h-4')}</button>
    <span class="min-w-0 flex-1 text-[12.5px] text-ink2 leading-snug">${i === null ? 'Pick a scenario to see one state of the panel. Each one starts from a fresh demo.' : `<b class="text-ink">Look at:</b> ${esc(M_SCN[i][1])}`}</span>
    <button onclick="M.scnBar=false;mRender()" class="w-7 h-7 rounded-lg hover:bg-hov text-ink3 flex items-center justify-center shrink-0" title="Hide this bar. It comes back from the demo menu.">${ic('x', 'w-4 h-4')}</button></div>`;
}
function mScnMenu() {
  const menu = $('demo-menu'); if (!menu || $('m-scn-menu')) return;
  menu.insertAdjacentHTML('beforeend', `<button id="m-scn-menu" onclick="closeDemoMenu();M.scnBar=true;$('m-scn').dataset.sig='';mRender()" class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-hov flex items-center gap-2 text-ink2">${ic('clapperboard', 'w-3.5 h-3.5')} Show the scenario bar</button>`);
}
function mScnFromUrl() { try { const v = new URLSearchParams(location.search).get('scn'); if (v) mScn(+v - 1); } catch (e) {} }
