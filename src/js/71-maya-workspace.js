/* ======================================================================
   SECOPS · THE WORKSPACE (aligned with the AgentiX Always On Experts brief)

   JOB AND MISSION. A job is a predefined piece of work (a sweep, a change
   check, a review on request). Every run of a job is a mission, including
   a run that finds nothing. A mission has one owner, an objective, what it
   looked at, findings, proposals with versions, and decisions.

   STATES. Needs you (a decision, or blocked), Running, Waiting (on another
   mission or team), Done. Done ends as changes applied, nothing found,
   partly applied, declined (with a reason), handed over, cancelled, or
   closed because the problem disappeared.

   CHAT. A general chat can switch agents, answer, and run a one-off
   action with approval. It creates a mission only when it starts a job,
   and the mission card is anchored in the chat.

   MISSION AND OBJECT. Several missions can involve the same object. A
   mission reads the object's record when it reaches it: same problem, add
   evidence to the open mission; other work, go ahead; another change
   pending on it, say so. A change applies only to the version it expects.
   People can edit or delete with a warning; open proposals then become
   out of date and are checked again, or cancelled.

   IN A MISSION. You talk only to the owner. The activity is shared; your
   conversation is yours. The owner says how it treats each ask (question,
   change, stop, outside), and a change is shared after you confirm it.

   PANEL. Three sizes: full screen, split (drag 30% to 80%), side panel.
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
  mNote('MSN-1012', { who: 'dana', kind: 'context', t: now - 4 * H, text: 'I installed the pack update. I did not touch the data model, so the old mapping is still there.' });
  mNote('MSN-1002', { who: 'noam', kind: 'context', t: now - 6 * H, text: 'These come from the extensions that IT approved. I close them by hand every day.' });
  mNote('MSN-1005', { who: 'dana', kind: 'context', t: now - 40 * H, text: 'Rule 222 is a copy I made for a test. It is safe to disable.' });
  /* An agent asks another agent. A question stays in the conversation... */
  mNote('MSN-1002', { who: 'det', to: 'inv', kind: 'crumb', t: t2.opened + 2 * M1, text: 'How did you close the Chrome extension issues in the last 30 days?' });
  mNote('MSN-1002', { who: 'inv', to: 'det', kind: 'crumb', t: t2.opened + 3 * M1, text: '1,150 of 1,250 were closed with no action: the extension was on the list IT approved. The other 100 were on extensions nobody approved, and those were escalated.' });
  /* ...and a change in the other agent's area becomes a linked mission (MSN-1012). */
  mNote('MSN-1001', { who: 'det', to: 'pipe', kind: 'crumb', t: t1.opened + 6 * M1, text: 'xdm.event.type is empty on every new SentinelOne event since the pack update. The rules did not change. Did the mapping change?' });
  mNote('MSN-1001', { who: 'pipe', to: 'det', kind: 'crumb', t: t1.opened + 9 * M1, text: 'Yes. The pack renamed eventType to event_type, and the data model still reads the old name. That is a change in the data model, so it gets its own mission.' });
  /* Steering already given by people. Each was asked in someone's own conversation, confirmed, and shared as one line. */
  (t2.history = t2.history || []).push({ t: now - 5 * H, kind: 'steer', who: 'noam', text: 'asked to keep alerts on extensions installed outside the Chrome Web Store. Accepted by the Detection Engineer: the proposal keeps them.' });
  const t12 = mTask('MSN-1012'); (t12.history = t12.history || []).push({ t: now - 3 * H, kind: 'steer', who: 'dana', text: 'asked to replay 2 days of events, not 1, before proposing. Accepted by the Pipeline Engineer.' });
  /* A later run reached the same rule, found the same problem, and added its evidence here instead of proposing again. */
  mNote('MSN-1002', { who: 'det', kind: 'evidence', t: now - 4 * H + 3 * M1, link: 'MSN-1015', text: 'The daily noise review (MSN-1015) reached this rule, saw this mission, and added this week’s 38 issues here instead of proposing again.' });
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
  if (t.stale) out.push(`<section class="rounded-2xl border-2 border-indigo-500/60 bg-indigo-500/10 p-4 flex items-start gap-3"><span class="c-indigo mt-0.5">${ic('loader', 'w-5 h-5 animate-spin')}</span><div class="min-w-0"><div class="text-[14.5px] font-bold text-ink">Out of date: rule ${t.stale.rule} changed</div><p class="text-[13px] text-ink2 mt-0.5 leading-relaxed">It is now version ${t.stale.to}, not version ${t.stale.from} (${esc(t.stale.why)}). The proposal cannot be approved on the old version, so the agent is checking it again.</p></div></section>`);
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
    <p class="pt-1 text-[12px] text-ink3">Who worked on or decided this mission. Each person’s conversation with the owner is their own. The activity is shared.</p></div>`;
}

/* ======================================================================
   THE MISSION CONVERSATION
   Built from the mission (trigger, steps, handoffs, decision, outcome)
   plus the messages people and agents add. Everyone in the mission sees
   all of it. Private questions belong in a chat.
   ====================================================================== */
function mThreadItems(t) {
  const out = [], run = mRunning(t), n = run ? Math.min(t.shown || 1, t.steps.length) : t.steps.length, from = t.trigger.from && M_FROM[t.trigger.from];
  out.push({ t: t.opened, kind: 'event', icon: MY_TRIGGER[t.trigger.kind][1], text: `${MY_TRIGGER[t.trigger.kind][0]}${from ? ' from the ' + M_AG[from].name : ''}. ${t.trigger.text}` });
  const u = t.unblocks && mTask(t.unblocks), w = (t.waitOn && mTask(t.waitOn)) || (t.unblockedBy && mTask(t.unblockedBy));
  if (u) out.push({ t: t.opened + 1, kind: 'call', who: t.agent, link: u.id, text: `Opened because the ${M_AG[u.agent].name} asked for help in ${u.id}.` });
  out.push({ t: t.opened + 2, kind: 'work', who: t.agent, steps: t.steps.slice(0, n), run, text: run ? 'Working on it.' : `Finished the analysis in ${n} steps.` });
  if (w) out.push({ t: Math.max(w.opened, t.opened + 3), kind: 'call', who: t.agent, link: w.id, text: `Asked the ${M_AG[w.agent].name} for help. The fix is in its area, so ${w.id} was opened${t.waitOn ? ' and this mission waits on it' : ''}.` });
  (t.notes || []).forEach(x => out.push(x));
  (t.history || []).forEach(x => out.push(x));
  if (t.status === 'progress' && t.by && t.actedAt) out.push({ t: t.actedAt, kind: 'decision', by: t.by, tone: 'cx', text: `approved. ${t.progressNote}.` });
  if (t.status === 'done') out.push(['auto', 'nothing', 'cancelled', 'partly'].includes(t.end) || !t.by ? { t: t.closed, kind: 'outcome', who: t.agent, text: t.outcome } : { t: t.closed, kind: 'decision', by: t.by, tone: t.end === 'rejected' ? 'slate' : 'cx', text: `${t.end === 'rejected' ? 'declined' : t.end === 'mixed' ? 'decided' : 'approved'}${(t.ver || 1) > 1 ? ' version ' + (t.decVer || t.ver) : ''}${t.declined && t.end === 'rejected' ? ' · ' + myDeclTxt(t.declined) : ''}.`, more: String(t.outcome || '').replace(/^(Approved|Declined|Approved with edits) by [^.]+\. ?/, '') });
  return out.map((x, i) => [x, i]).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map(x => x[0]);
}
/* How the owner treats what you asked. It says so before answering. */
const M_CLS = { question: ['Question', 'message-circle-question', 'Only you see the answer.'], change: ['Change to this mission', 'git-pull-request-arrow', ''], stop: ['Stop', 'circle-pause', ''], outside: ['Outside this mission', 'arrow-up-right', ''], linked: ['Linked mission', 'link-2', ''] };
function mThreadItem(t, x) {
  const when = `<span class="text-[11px] text-ink4 whitespace-nowrap">${mAgo(x.t)}</span>`;
  const name = k => esc(M_PPL[k] ? (k === 'me' ? 'You' : M_PPL[k].name) : M_AG[k].name);
  const quiet = (icon, html, cls = 'text-ink3') => `<div class="flex items-start gap-2.5 text-[12.5px] ${cls} leading-relaxed"><span class="w-[26px] flex justify-center shrink-0 mt-[3px]">${ic(icon, 'w-3.5 h-3.5')}</span><span class="min-w-0 flex-1">${html}</span>${when}</div>`;
  const msg = (k, html, tag = '', after = '') => `<div class="flex gap-2.5">${mWho(k, 26)}<div class="min-w-0 flex-1"><div class="flex items-center gap-2 text-[12.5px] flex-wrap"><b class="text-ink font-semibold">${name(k)}</b>${when}${tag}</div><div class="mt-0.5 text-[13.5px] text-ink2 leading-relaxed">${html}</div>${after}</div></div>`;
  const go = id => `<button onclick="mOpenTask('${id}')" class="font-mono c-indigo hover:underline">${id}</button>`;
  if (x.kind === 'event') return quiet(x.icon, esc(x.text));
  if (x.kind === 'work') return quiet(x.run ? 'loader' : 'list-checks', `${esc(M_AG[x.who].name)}: ${x.run ? 'working on it' : `${x.steps.length} steps`}.<ol class="mt-1.5 space-y-1 list-decimal pl-4">${x.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`);
  if (x.kind === 'call') return quiet('corner-down-right', esc(x.text).replace(x.link, go(x.link)));
  /* one agent asked another: a breadcrumb, not a conversation */
  if (x.kind === 'crumb') return quiet('corner-down-right', `${esc(M_AG[x.who].name)} ${x.who === t.agent ? 'asked' : 'answered'} the ${esc(M_AG[x.to].name)}: <span class="text-ink2">“${esc(x.text)}”</span>`);
  if (x.kind === 'context') return quiet('message-square-text', `<b class="text-ink2">${esc(M_PPL[x.who].name)}</b> added context: <span class="text-ink2">“${esc(x.text)}”</span>`);
  if (x.kind === 'evidence') return quiet('plus-circle', esc(x.text).replace(x.link, go(x.link)), 'text-ink2');
  if (x.kind === 'steer') return quiet('git-pull-request-arrow', `<span class="inline-flex px-1.5 py-0.5 mr-1 rounded-md tn tn-indigo text-[10.5px] font-bold uppercase tracking-wider">Steering</span><b class="text-ink2">${name(x.who)}</b> ${esc(x.text)}`, 'text-ink2');
  if (x.kind === 'feedback') return quiet('flag', `<b class="text-ink2">${name(x.who)}</b> ${esc(x.text)}`, 'text-ink2');
  if (x.kind === 'minor') return quiet('refresh-cw', `${esc(M_AG[x.who].name)} checked again. ${esc(x.text)}`);
  if (x.kind === 'outcome') return quiet('circle-check', esc(x.text), 'text-ink2');
  if (x.kind === 'decision') { const k = Object.keys(M_PPL).find(p => M_PPL[p].name.replace(/\.$/, '') === String(x.by || '').replace(/\.$/, '')) || 'me';
    return quiet(x.tone === 'slate' ? 'circle-x' : x.tone === 'rose' ? 'triangle-alert' : 'circle-check', `<b class="text-ink">${k === 'me' ? 'You' : esc(M_PPL[k].name)} ${esc(x.text)}</b>${x.more ? ` <span class="text-ink3">${esc(x.more)}</span>` : ''}`, 'text-ink2'); }
  /* a new version is the one thing in the activity that asks for an action, so it is the one thing with a frame */
  if (x.kind === 'update') return `<div class="rounded-2xl border border-amber-500/50 px-4 py-3"><div class="flex items-center gap-2 text-[12.5px]">${mAv(x.who, 20)}<b class="text-ink">Version ${x.ver}: ${esc(x.title)}</b><span class="ml-auto">${when}</span></div>
    <ul class="mt-2 space-y-1 list-disc pl-5 text-[13px] text-ink2 leading-relaxed">${x.what.map(s => `<li>${esc(s)}</li>`).join('')}</ul><div class="mt-2 text-[12px] text-ink3">The same problem on the same object, so it was added here as a new version, not as a second mission.</div></div>`;
  /* your own conversation with the owner */
  if (x.kind === 'mine') return `<div class="flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 bg-indigo-500/20 text-ink text-[13.5px]">${esc(x.text)}</div></div>`;
  if (x.kind === 'reply') { const c = M_CLS[x.cls || 'question'];
    return msg(x.who, md(x.text), `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sunk text-[11px] text-ink3">${ic(c[1], 'w-3 h-3')}${c[0]}</span>`, x.acts ? `<div class="mt-2 flex gap-2 flex-wrap">${x.acts}</div>` : ''); }
  return '';
}
const M_SHARED = ['event', 'work', 'call', 'crumb', 'context', 'evidence', 'steer', 'feedback', 'minor', 'outcome', 'decision', 'update'];
function mThreadHtml(t) {
  const list = mThreadItems(t), steerOnly = M.actF === t.id, shared = list.filter(x => M_SHARED.includes(x.kind) && (!steerOnly || ['steer', 'context', 'decision'].includes(x.kind))), mine = list.filter(x => ['mine', 'reply'].includes(x.kind)), nSteer = list.filter(x => x.kind === 'steer').length;
  /* How the mission started is one quiet line. It opens on request, and while the agent is still working. */
  const story = shared.filter(x => ['event', 'work', 'call', 'crumb'].includes(x.kind)), rest = shared.filter(x => !story.includes(x)), k = t.id + ':story', run = mRunning(t), open = !!M.more[k] || run;
  const from = t.unblocks && mTask(t.unblocks);
  const line = `<button onclick="M.more['${k}']=!M.more['${k}'];mPanelRender();icons()" class="w-full flex items-center gap-2.5 text-[12.5px] text-ink3 hover:text-ink text-left"><span class="w-[26px] flex justify-center shrink-0">${mAv(t.agent, 20)}</span><span class="min-w-0 flex-1">${esc(M_AG[t.agent].name)} opened this ${mAgo(t.opened)}${from ? `, asked by the ${esc(M_AG[from.agent].name)}` : t.trigger.kind === 'human' ? ', from a request' : ''}. ${t.steps.length} steps${story.filter(x => x.kind === 'crumb').length ? ', asked another agent for help' : ''}.</span>${run ? '' : ic(open ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5')}</button>`;
  const typing = M.typing && M.typing.key === t.id ? `<div class="flex gap-2.5">${mAv(t.agent, 26)}<div class="bg-sunk rounded-2xl rounded-tl-md px-3.5 py-3"><span class="inline-flex gap-1 items-center h-4"><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.2s"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.4s"></span></span></div></div>` : '';
  const head = (icon, title, sub) => `<div class="flex items-center gap-2 text-[11px] font-black tracking-[.14em] uppercase text-ink3">${ic(icon, 'w-3.5 h-3.5')}${title}<span class="normal-case tracking-normal font-normal text-ink4">· ${sub}</span></div>`;
  return `<div class="space-y-5" id="m-thread">
    <div class="space-y-3"><div class="flex items-center justify-between gap-2">${head('users', 'Activity', 'everyone in the mission sees this')}<span class="flex items-center gap-0.5 text-[11.5px] shrink-0">${[['all', 'All'], ['steer', `Steering · ${nSteer}`]].map(([k, l]) => `<button data-actf="${k}" onclick="M.actF=${k === 'steer' ? `'${t.id}'` : 'null'};mPanelRender();icons()" class="px-2 py-0.5 rounded-md ${(k === 'steer') === steerOnly ? 'bg-hov text-ink font-semibold' : 'text-ink3 hover:text-ink'}">${l}</button>`).join('')}</span></div>
      ${steerOnly ? `<p class="text-[12px] text-ink3">What people told this mission: steering they confirmed, context they added, and decisions.</p>` : line}${!steerOnly && open ? `<div class="space-y-2.5 pb-1">${story.map(x => mThreadItem(t, x)).join('')}</div>` : ''}${(steerOnly ? shared : rest).map(x => mThreadItem(t, x)).join('') || (steerOnly ? '<p class="text-[12.5px] text-ink4">No steering yet. Ask the owner for a change in your conversation below, and confirm it to share it here.</p>' : '')}</div>
    <div class="space-y-3 pt-4 border-t border-line">${head('lock', `Your conversation with the ${M_AG[t.agent].name}`, 'only you see this')}
      ${mine.map(x => mThreadItem(t, x)).join('')}${typing}${!mine.length && !typing ? `<p class="text-[12.5px] text-ink4">Ask anything about this mission. Questions and answers stay yours. A change you ask for is added to the activity after you confirm it.</p>` : ''}</div></div>`;
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
    if (x && !M.W.tasks.includes(x)) { x.trigger = { kind: 'human', text: `${M_USER} asked in a chat: “${q}”` }; mLater(900, () => mArrive(n)); a = { card: x.id, text: `That starts a job, the **third-party source check**, so it runs as a mission: **${x.id}**. The card below stays here and shows where it is. The ${M_AG[x.agent].name} owns it. You can leave: it is on the Missions screen and comes back to you when there is something to decide.`, task: x.id }; }
    else a = { text: `It is already running in **MSN-1009**.`, task: 'MSN-1009' }; }
  /* A result worth looking at in full is an artifact: a card in the chat that opens next to it. */
  else if (/top \d+ noisy|noisiest rules|noisy rules/i.test(q)) { const nz = myNoise(M.W);
    a = { agent: 'det', text: `These ${nz.top.length} rules make **${Math.round(nz.topShare * 100)}%** of the issues that end with no action this week.`, artifact: { kind: 'table', title: `Top ${nz.top.length} noisy rules`, cols: ['Rule', 'Issues with no action, 7 days', 'AI suggestion'],
      rows: nz.top.map(r => { const rr = r.id ? mRule(r.id) : null, rv = rr ? myRuleReview(M.W, rr) : { sug: '' }; return [r.name, r.n.toLocaleString(), rv.sug || '—']; }) } }; }
  /* An action with approval in a chat. It is not a job, so no mission is opened. */
  else if (/^(please )?run (rule )?233|run .*root console/i.test(q)) a = { approval: 'run233', text: 'I can run **AWS - Root console login** (rule 233) now on the last 24 hours. It may create issues if it matches. This is a one-off action, so no mission is opened.' };
  else if (M_REQUEST.test(q)) a = { text: 'That needs work in your environment, so it would become a mission. In this demo, try: **Check why Check Point verdicts are missing**.' };
  else a = mAnswer(q);
  if (!(M.chats[key] || []).length && key === '_') M.chatMeta = { title: a.task && !about ? mTask(a.task) ? mTask(a.task).title : q : q.replace(/\?$/, ''), task: a.task || null, t: Date.now() };
  (M.chats[key] = M.chats[key] || []).push({ role: 'user', text: q });
  M.typing = { key }; mPanelRender(); icons(); mPanelBottom();
  const who = M.to !== 'sec' && M_AG[M.to] ? M.to : a.agent || 'sec';
  mLater(650, () => { M.typing = null; M.chats[key].push({ role: 'agent', agent: who, text: a.text, task: a.task, card: a.card, approval: a.approval, artifact: a.artifact }); mPanelRender(); icons(); mPanelBottom(); });
}
const M_STOP = /^(stop|pause|hold)\b/i;
const M_OUTSIDE = /(brief me|top \d+|noisy rules|impossible travel|okta|which rules|are we covered|hunt for|what else)/i;
/* In a mission you talk only to its owner. It says how it treats each ask: a question, a change to the mission, a stop, or something outside it. */
function mSendMission(t, q) {
  const to = t.agent, a = mTaskAnswer(t, q), open = t.status !== 'done';
  const cls = a.act ? 'act' : M_STOP.test(q) && open ? 'stop' : M_CHANGES.test(q) && open ? 'change' : M_OUTSIDE.test(q) && !q.includes(t.id) ? 'outside' : 'question';
  mNote(t.id, { who: 'me', kind: 'mine', text: q });
  M.typing = { key: t.id, who: to }; mPanelRender(); icons(); mPanelBottom();
  mLater(650, () => { M.typing = null;
    if (a.act) { mNote(t.id, { who: to, kind: 'reply', cls: 'question', text: a.text }); return mDecide(t.id, a.act); }
    const q2 = esc(q).replace(/'/g, '&#39;');
    if (cls === 'change') { M.steer = { tid: t.id, q, kind: 'change' };
      mNote(t.id, { who: to, kind: 'reply', cls: 'change', steer: true, text: `I’ll treat this as a **change to this mission**. Before I start, it goes into the shared activity as: “You asked to ${q.charAt(0).toLowerCase() + q.slice(1).replace(/\.$/, '')}.” If the proposal changes, I post a new version and it needs a person again.`,
        acts: `<button data-act="steer-ok" onclick="mSteer('${t.id}',true)" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold">Confirm and share</button><button data-act="steer-no" onclick="mSteer('${t.id}',false)" class="px-3 py-1.5 rounded-lg border border-line2 text-[12.5px] text-ink2 hover:bg-hov">Keep it a question</button>` }); }
    else if (cls === 'stop') { M.steer = { tid: t.id, q, kind: 'stop' };
      mNote(t.id, { who: to, kind: 'reply', cls: 'stop', steer: true, text: 'I’ll treat this as a **stop**. I do no more work on this mission until someone resumes it. It goes into the shared activity as: “Paused by you.”',
        acts: `<button data-act="steer-ok" onclick="mSteer('${t.id}',true)" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold">Pause the mission</button><button onclick="mSteer('${t.id}',false)" class="px-3 py-1.5 rounded-lg border border-line2 text-[12.5px] text-ink2 hover:bg-hov">Cancel</button>` }); }
    else if (cls === 'outside') { M.carry = q;
      mNote(t.id, { who: to, kind: 'reply', cls: 'outside', text: `That is **outside ${t.id}**, so I will not add it to this mission. Continue in a general chat, with your question carried over.`,
        acts: `<button data-act="carry" onclick="mCarry()" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold inline-flex items-center gap-1.5">Continue in a general chat${ic('arrow-right', 'w-3.5 h-3.5')}</button>` }); }
    else mNote(t.id, { who: to, kind: 'reply', cls: 'question', text: a.text });
    mPanelRender(); icons(); mPanelBottom(); });
}
/* Confirming what goes into the shared activity. Only the summary is shared, never the conversation. */
function mSteer(tid, ok) {
  const t = mTask(tid), st = M.steer; if (!t || !st || st.tid !== tid) return; M.steer = null;
  (t.notes || []).forEach(n => { if (n.steer) { n.acts = ''; n.steer = false; } });
  if (!ok) { mNote(tid, { who: t.agent, kind: 'reply', cls: 'question', text: st.kind === 'stop' ? 'Nothing changes. The mission goes on.' : mTaskAnswer(t, st.q).text }); mPanelRender(); icons(); return mPanelBottom(); }
  if (st.kind === 'stop') { t.paused = true; (t.history = t.history || []).push({ t: Date.now(), kind: 'steer', who: 'me', text: 'paused the mission. The agent does no more work on it until someone resumes it.' }); if (t.status === 'progress') t.progressNote = 'Paused by ' + mMe(); }
  else { (t.history = t.history || []).push({ t: Date.now(), kind: 'steer', who: 'me', text: `asked to ${st.q.charAt(0).toLowerCase() + st.q.slice(1).replace(/\.$/, '')}. Accepted by the ${M_AG[t.agent].name}.` });
    t.objective = (t.objective || '').replace(/\.$/, '') + '. ' + st.q.replace(/\.$/, '') + '.';
    const upd = M_UPD[t.id] && !t.next && (t.ver || 1) === 1;
    mNote(tid, { who: t.agent, kind: 'reply', cls: 'change', text: upd ? 'Shared. Working on it. If the proposal changes, version 2 appears in the activity.' : 'Shared. Checked again: nothing new was found, so the proposal stays as it is.' });
    if (upd) M.timers.push(setTimeout(() => mUpdate(t.id, 'material'), 2600)); }
  mRender(); mPanelBottom();
}
/* A question outside the mission moves to a general chat, carried over. */
function mCarry() { const q = M.carry; M.carry = null; if (!q) return; mPanelHome(); M.chatKey = '_'; M.chats._ = []; M.chatMeta = null; mSend(q); }
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
/* The history, like a chat app's sidebar: what needs you, then everything you worked on lately, missions and chats together. */
function mRecent() {
  const W = M.W, need = new Set(myPendingTasks(W).map(t => t.id)), out = [], seen = new Set();
  (M.recent || []).forEach(r => { if (!need.has(r.id) && !seen.has(r.id) && mTask(r.id)) { seen.add(r.id); out.push({ kind: 'mission', id: r.id, t: r.t }); } });
  W.tasks.filter(t => mMine(t) && !need.has(t.id) && !seen.has(t.id)).forEach(t => { seen.add(t.id); out.push({ kind: 'mission', id: t.id, t: t.actedAt || t.closed || t.opened }); });
  if ((M.chats._ || []).length && M.chatMeta) out.push({ kind: 'chat', id: '_', title: M.chatMeta.title, task: M.chatMeta.task, t: M.chatMeta.t || Date.now() });
  (M.hist || []).forEach(h => out.push({ kind: 'chat', id: h.id, title: h.title, task: h.task, t: h.t }));
  return out.sort((a, b) => b.t - a.t);
}
function mRailHtml() {
  const q = mQueue(), cur = M.panelTask, rec = mRecent();
  const row = r => { if (r.kind === 'chat') { const on = !cur && !M.panelObj && M.chatKey === r.id;
      return `<button data-recent="chat" onclick="mOpenChat('${r.id}')" class="w-full text-left px-3 py-2 rounded-xl flex items-start gap-2.5 ${on ? 'bg-hov' : 'hover:bg-hov/60'}"><span class="mt-0.5 text-ink4">${ic('message-square', 'w-3.5 h-3.5')}</span><span class="min-w-0 flex-1"><span class="block text-[13px] text-ink2 truncate">${esc(r.title)}</span><span class="block text-[11.5px] text-ink4 truncate">Chat${r.task ? ' · started ' + r.task : ''} · ${mAgo(r.t)}</span></span></button>`; }
    const t = mTask(r.id), on = cur === r.id;
    return `<button data-recent="mission" onclick="mOpenTask('${t.id}')" class="w-full text-left px-3 py-2 rounded-xl flex items-start gap-2.5 ${on ? 'bg-hov' : 'hover:bg-hov/60'}"><span class="mt-0.5 text-ink4">${ic('target', 'w-3.5 h-3.5')}</span><span class="min-w-0 flex-1"><span class="block text-[13px] text-ink2 truncate">${esc(t.title)}</span><span class="block text-[11.5px] text-ink4 truncate">${t.id} · ${esc(mStatusTxt(t))}</span></span></button>`; };
  return `<div class="px-3 pt-3 pb-2 shrink-0 flex items-center gap-1">
      <button data-act="newchat" onclick="mNewChat()" class="flex-1 px-3 py-2 rounded-xl text-[13.5px] text-ink hover:bg-hov inline-flex items-center gap-2.5">${ic('square-pen', 'w-4 h-4 text-ink3')}New chat</button>
      <button data-act="rail-off" onclick="M.railOff=true;mPanelRender();icons()" class="w-8 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Hide the history">${ic('panel-left-close', 'w-4 h-4')}</button></div>
    <div class="flex-1 overflow-y-auto px-2 pb-3">
      <div class="px-3 pt-3 pb-1.5 text-[11.5px] font-semibold text-ink3 uppercase tracking-wider">Needs you · ${q.need.length}</div>
      <div class="space-y-0.5">${q.need.map(t => mQRow(t, t.id === cur)).join('') || `<div class="px-3 py-2 text-[12.5px] text-ink4">Nothing right now.</div>`}</div>
      <div class="px-3 pt-5 pb-1.5 text-[11.5px] font-semibold text-ink3 uppercase tracking-wider">Recent</div>
      <div class="space-y-0.5">${rec.slice(0, 14).map(row).join('') || `<div class="px-3 py-2 text-[12.5px] text-ink4">Missions you open and chats you start show here.</div>`}</div>
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
  const d = mNeed(t), one = !!t.decision && !t.findings && t.status === 'pending';
  return `<div data-fast="${t.id}" class="rounded-2xl border border-line2 bg-card p-3.5">
    <div class="flex items-center gap-2 flex-wrap">${mSug(t.sug, { solid: true })}${mConf(t.conf)}${mImpact(t.impact)}<span class="font-mono text-[11.5px] text-ink3 ml-auto">${t.id}</span></div>
    <button onclick="mOpenTask('${t.id}')" class="block text-left mt-2 text-[14.5px] font-bold text-ink leading-snug hover:underline">${esc(t.title)}</button>
    <p class="text-[13px] text-ink2 leading-relaxed mt-1">${esc(one ? d.effect : d.q)}</p>
    <div class="mt-2.5 flex items-center gap-2 flex-wrap">${one ? '' : `<span class="text-[12.5px] ${t.status === 'blocked' ? 'c-rose' : 'c-amber'} font-semibold">${t.status === 'blocked' ? 'Blocked · partly applied' : 'Several decisions'}</span>`}${one ? `<button data-fast-ok="${t.id}" onclick="mDecide('${t.id}','approve')" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 hover:opacity-90">${ic('check', 'w-3.5 h-3.5')}${esc(d.approve)}</button>` : ''}<button onclick="mDecide('${t.id}','reject')" class="px-3.5 py-2 rounded-xl tn tn-rose text-[13px] font-bold">Decline</button>
      <button onclick="mOpenTask('${t.id}')" class="ml-auto px-3 py-2 rounded-xl text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1">Open the mission${ic('arrow-right', 'w-3.5 h-3.5')}</button></div></div>`;
}
function mStandby() {
  const W = M.W, st = myStats(W), run = W.tasks.find(mRunning), q = mQueue(), key = M.chatKey, chat = mChatHtml(key), work = mSize() === 'work';
  const label = run ? `Working on ${run.id}` : 'Standing by';
  if (chat && key === '_' && !M.chatMeta) M.chatMeta = { title: 'Decisions review', task: null, t: Date.now() };
  if (chat) { const h = M.hist.find(x => x.id === key) || M.chatMeta;
    return `<div class="space-y-4 ${work ? 'max-w-[760px] mx-auto' : ''}"><div class="flex items-center gap-3 pb-3 border-b border-line">${mAv('sec', 40, true)}<div class="min-w-0 flex-1"><div class="text-[15px] font-bold text-ink truncate">${esc(h ? h.title : 'Chat')}</div><div class="text-[12px] text-ink3 inline-flex items-center gap-1.5">${ic('lock', 'w-3 h-3')}Your chat${h && h.task ? ` · about <button onclick="mOpenTask('${h.task}')" class="font-mono c-indigo hover:underline">${h.task}</button>` : ''}</div></div></div>${chat}</div>`; }
  const auto = W.tasks.filter(t => t.status === 'done' && t.end === 'auto').length, n = q.need.length, show = q.need.slice(0, work ? 3 : 2);
  const none = W.tasks.filter(t => t.end === 'nothing' && Date.now() - t.opened < 86400000).length, runN = W.tasks.filter(t => myState(t) === 'running').length;
  const line = `**${n}** mission${n === 1 ? ' needs' : 's need'} you. **${q.wait.length}** wait${q.wait.length === 1 ? 's' : ''} on another mission and will continue on ${q.wait.length === 1 ? 'its' : 'their'} own. **${runN}** ${runN === 1 ? 'is' : 'are'} running and need${runN === 1 ? 's' : ''} nothing from you. **${none}** run${none === 1 ? '' : 's'} today found nothing${auto ? `, and **${auto}** closed on ${auto === 1 ? 'its' : 'their'} own` : ''}.`;
  return `<div class="${work ? 'max-w-[760px] mx-auto pt-6' : 'pt-2'} space-y-4">
    <div class="flex items-center gap-3.5">${mAv('sec', work ? 64 : 48, true)}<div><div class="text-[20px] font-black text-ink leading-tight">SecOps</div><div class="text-[13px] c-blue font-semibold flex items-center gap-1.5">${run ? `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>` : ''}${label}</div></div></div>
    <div class="rounded-2xl rounded-tl-md px-4 py-3 bg-card border border-line text-[14px] text-ink2 leading-relaxed">${md(`Here is where things stand. ${line}`)}${n ? md(`\n\nThe ${show.length === 1 ? 'first one is' : `first ${show.length} are`} below, most valuable first. You can decide from here, or open one to see the evidence and the conversation.`) : md('\n\nNothing is waiting for you.')}</div>
    ${show.map(mFastCard).join('')}
    ${n > show.length ? `<button onclick="M.tab='needs';mClosePanel()" class="text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1.5">See all ${n} on the Missions screen${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : ''}</div>`;
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
  if (t.findings) return t.findings.filter(f => f.prop).map(f => 'rule ' + (f.affects.rules || []).join(', ')).join(' and ');
  if (t.nothing) return '';
  if (t.waitOn) { const o = mTask(t.waitOn); return `nothing. ${o.id} changes the ${(o.recommended ? o.recommended.label.split(' · ')[0] : 'object').toLowerCase()}`; }
  const b = t.recommended || t.current; if (!b) return '';
  return /^\w+ rules$/i.test(b.label) ? 'rules ' + (t.affects.rules || []).join(', ') : b.label;
}
function mMini(t) {
  const d = mNeed(t), k = t.id + ':full', pending = (t.status === 'pending' && !t.waitOn && (t.decision || t.findings)) || t.status === 'blocked', ch = mChangesTxt(t);
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
  const head = $('m-panel-head'), body = $('m-panel-scroll'), pending = t && t.status === 'pending' && t.decision && !t.findings, side = mSize() !== 'work', two = wide && work && (!!t || !!M.art);
  const btn = (fn, icon, title, extra = '') => `<button ${extra} onclick="${fn}" class="w-8 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center shrink-0" title="${title}">${ic(icon, 'w-[18px] h-[18px]')}</button>`;
  /* the queue on the left, in the workspace only */
  const rail = $('m-ws-rail'), railOn = work && wide && !M.railOff; rail.classList.toggle('hidden', !railOn); rail.classList.toggle('flex', railOn);
  if (railOn) { const rs = rail.querySelector('.overflow-y-auto'), top = rs ? rs.scrollTop : 0; rail.innerHTML = mRailHtml(); const r2 = rail.querySelector('.overflow-y-auto'); if (r2) r2.scrollTop = top; }
  /* head, one row: what this is, who is in it, the way to the next one, close */
  const ids = t ? pend.map(x => x.id) : [], i = t ? ids.indexOf(t.id) : -1;
  const o2 = t && t.waitOn && mTask(t.waitOn);
  const status = !t ? '' : t.status === 'done' || t.status === 'blocked' ? mStatus(t) : o2 ? `<span class="text-[12.5px] c-indigo whitespace-nowrap">Waiting on the ${M_AG[o2.agent].name}</span>` : t.status === 'pending' ? `<span class="text-[12.5px] c-amber whitespace-nowrap">Needs you</span>` : `<span class="text-[12.5px] c-blue whitespace-nowrap">${t.handed ? 'Waiting on another team' : t.paused ? 'Paused' : 'Running'}</span>`;
  const left = `${work && wide && M.railOff ? btn('M.railOff=false;mPanelRender();icons()', 'panel-left-open', 'Show the history', 'data-act="rail-on"') : ''}${t || o ? btn('mPanelHome()', 'arrow-left', 'Back to the conversation (Esc)') : ''}
    ${t ? `<span class="text-[13.5px] font-semibold text-ink font-mono whitespace-nowrap">${t.id}</span><span class="min-w-0 truncate">${status}</span>`
      : o ? `<span class="text-[13.5px] font-semibold text-ink whitespace-nowrap">${o.kind === 'rule' ? 'Correlation rule ' + o.id : o.kind === 'tech' ? 'Technique ' + o.id : 'IOC rule ' + o.id}</span>`
      : `<span class="font-semibold text-ink text-[13.5px]">AgentiX</span><span class="text-[12.5px] text-ink3 truncate">${W.tasks.some(mRunning) ? 'Working' : 'Standing by'}</span>`}`;
  const ps = t ? mPeople(t) : [];
  const people = !t ? '' : work && wide ? `<button data-act="people" onclick="M.people=!M.people;M.sel=false;mPanelRender();icons()" class="flex items-center rounded-full hover:bg-hov px-1 py-0.5 shrink-0" title="${ps.length} in this mission. Click for the list"><span class="flex -space-x-1.5">${ps.slice(0, 6).map(p => `<span class="rounded-full ring-2 ring-[rgb(var(--panel))] inline-flex">${mWho(p.k, 22)}</span>`).join('')}</span>${ps.length > 6 ? `<span class="ml-1 text-[11.5px] text-ink3">+${ps.length - 6}</span>` : ''}</button>`
    : `<button data-act="people" onclick="M.people=!M.people;M.sel=false;mPanelRender();icons()" class="h-8 px-1.5 rounded-lg hover:bg-hov text-ink3 hover:text-ink inline-flex items-center gap-1 text-[12.5px] shrink-0" title="${ps.length} in this mission. Click for the list">${ic('users', 'w-4 h-4')}${ps.length}</button>`;
  const nav = t && ids.length > 1 ? `<div class="flex items-center shrink-0"><button data-act="prev" onclick="mMove(-1)" class="w-7 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Previous mission (← or K)">${ic('chevron-left', 'w-4 h-4')}</button><span data-act="switch" class="px-1 text-[12.5px] text-ink3 whitespace-nowrap" title="${ids.length} missions need you">${i >= 0 ? `${i + 1} / ${ids.length}` : ids.length}</span><button data-act="next" onclick="mMove(1)" class="w-7 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Next mission (→ or J)">${ic('chevron-right', 'w-4 h-4')}</button></div>` : '';
  head.innerHTML = `<div class="flex items-center gap-2.5 min-w-0">${left}</div><div class="flex items-center gap-1 shrink-0">${people}${nav}${wide ? btn('mSizeToggle()', work ? 'minimize-2' : 'maximize-2', work ? 'Side panel (F)' : 'Full screen (F)', 'data-act="size"') : ''}${btn('mClosePanel()', 'x', 'Close (Esc)', 'data-act="close"')}</div>`;
  const ppl = $('m-people'); ppl.classList.toggle('hidden', !(t && M.people)); ppl.innerHTML = t && M.people ? mPeopleBar(t) : '';
  /* body */
  const art = $('m-art'); art.classList.toggle('hidden', !two); art.classList.toggle('flex', two);
  const full = t && (two || (side && mPanelPx() >= 560) || M.more[t.id + ':full'] || M.editing === t.id), card = !t ? '' : mRunning(t) ? mWorking(t) : full ? mCard(t) : mMini(t);
  if (two && !t) { $('m-art-scroll').innerHTML = mArtHtml(M.art); body.innerHTML = mStandby(); }
  else if (two) { $('m-art-scroll').innerHTML = `<div class="m-flat">${card}</div>`; body.innerHTML = `<div class="max-w-[680px] mx-auto">${mThreadHtml(t)}</div>`; }
  else { $('m-art-scroll').innerHTML = ''; body.innerHTML = t ? `<div class="${work && wide ? 'max-w-[720px] mx-auto' : ''}"><div class="m-flat">${card}</div>${full && !mRunning(t) && side && mPanelPx() < 560 ? `<button onclick="M.more['${t.id}:full']=false;mPanelRender();icons()" class="mt-2 text-[13px] c-indigo hover:underline inline-flex items-center gap-1">Show less${ic('chevron-up', 'w-3.5 h-3.5')}</button>` : ''}<div class="mt-5 pt-5 border-t border-line">${mThreadHtml(t)}</div></div>` : o ? mObjCard(o) : mStandby(); }
  /* the decision: two buttons. Everything else is behind "more". */
  const foot = two ? $('m-art-acts') : $('m-panel-acts'); (two ? $('m-panel-acts') : $('m-art-acts')).innerHTML = '';
  const big = 'py-2.5 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-2';
  if (t && t.status === 'blocked') foot.innerHTML = `<div class="flex gap-2"><button data-act="recheck" onclick="mBlockedGo('${t.id}','recheck')" class="flex-[1.5] min-w-0 ${big} bg-ink text-panel hover:opacity-90">Check rule 222 again</button><button data-act="stop" onclick="mBlockedGo('${t.id}','stop')" class="flex-1 min-w-0 ${big} border border-line2 text-ink2 hover:text-ink hover:bg-hov">Stop here</button></div>`;
  else if (t && t.findings && t.status === 'pending') { const left = t.findings.filter(f => f.prop && !f.dec).length; foot.innerHTML = `<div class="text-[12.5px] text-ink3 text-center py-1">${left} proposal${left === 1 ? '' : 's'} left. Each one has its own Approve and Decline in the mission.</div>`; }
  else if (pending && t.stale) foot.innerHTML = `<div class="w-full ${big} border border-line2 text-ink3">${ic('loader', 'w-4 h-4 animate-spin')}Out of date · checking the proposal again</div>`;
  else if (pending && M.decl && M.decl.id === t.id && M.decl.fi === undefined) foot.innerHTML = mDeclBox(t.id);
  else if (pending && t.next) foot.innerHTML = `<button data-act="see2" onclick="mSeeUpdate('${t.id}')" class="w-full ${big} bg-amber-500 hover:bg-amber-400 text-slate-950">Show version ${(t.ver || 1) + 1} before deciding</button>`;
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
  $('m-say').innerHTML = M.sel && !t ? mSelHtml(t) : '';
  const tb = $('m-to'); tb.classList.toggle('hidden', !!t); tb.innerHTML = `${mAv(to, 18)}<span class="max-w-[150px] truncate">${esc(M_AG[to].name)}</span>${ic('chevron-down', 'w-3.5 h-3.5 text-ink3')}`;
  tb.dataset.to = to; tb.title = to === 'sec' && !t ? 'SecOps picks the right agent. Click to ask one agent directly.' : 'Who answers. Click to change.';
  $('m-cmd-box').className = 'flex-1 min-w-0 flex items-center rounded-2xl bg-sunk border border-line focus-within:border-line2 transition';
  $('m-cmd').placeholder = t ? `Ask the ${M_AG[t.agent].name}, the owner of ${t.id}…` : to === 'sec' ? 'Ask anything, or ask for work…' : `Ask the ${M_AG[to].name}…`;
  $('m-hint').innerHTML = t ? `Only you see this conversation. A change you ask for is shared after you confirm it.` : '';
}

/* ======================================================================
   DEMO SCENARIOS
   Each one starts from a fresh world and sets up one situation, so every
   state of the panel can be seen without playing the whole story.
   ====================================================================== */
const mLater = (ms, fn) => M.timers.push(setTimeout(fn, ms));
const mScnSee = sel => mLater(350, () => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
const mScnOpen = (id, keepDeck) => { mNav('work'); mOpenTask(id); if (!keepDeck) { M.deck = null; mRender(); } };
/* A trigger that arrives in a scenario finishes its work at once, so the state can be seen without waiting. */
const mScnReady = n => { const t = myArrive(M.W, n); if (!t) return null; t.live = true; t.shown = t.steps.length; myReady(M.W, t); t.readyAt = Date.now(); mRender(); return t; };
const mScnObj = (view, id) => { mNav(view); M.panelObj = { kind: 'rule', id }; M.panelTask = null; M.deck = null; M.panelOpen = true; mRender(); };
/* ======================================================================
   DEMO FLOWS
   Each flow stresses one point, step by step. A movable card says what to
   do and what to notice. A step ticks itself when you do it, and "Show me"
   does it for you. The card is demo chrome, not product.
   ====================================================================== */
const mNF = job => { const xs = M.W.tasks.filter(t => t.nothing && t.job === job).sort((a, b) => b.opened - a.opened); return xs[0] ? xs[0].id : null; };
const mT = id => mTask(id) || {};
const M_FLOWS = [
  { name: 'What needs me this morning', point: 'The list opens on Needs you, one decision at a time, and the next one comes up on its own.',
    setup: () => mNav('work'),
    steps: [
      { do: 'Look at the Missions screen.', see: 'It opens on Needs you. Running and Waiting need nothing from you. Done holds every finished run, also the ones that found nothing.', act: () => { M.tab = 'needs'; mRender(); }, done: () => M.view === 'work' },
      { do: 'Open the first mission, MSN-1003.', see: 'Full screen: the history on the left, your conversation in the middle, the mission on the right.', act: () => mOpenTask('MSN-1003'), done: () => M.panelTask === 'MSN-1003' },
      { do: 'Press “Hand over to cloud team”.', see: 'It moves to Waiting on another team, and the next mission that needs you comes up on its own.', act: () => mDecide('MSN-1003', 'approve'), done: () => mT('MSN-1003').status !== 'pending' },
      { do: 'Close the panel and open the Done filter.', see: 'The runs that found nothing are here, with the AI suggestion Nothing found.', act: () => { mClosePanel(); M.tab = 'done'; mRender(); }, done: () => M.tab === 'done' && !mPanelOn() }
    ] },
  { name: 'A run that found nothing', point: 'Every run of a job is a mission. It is Done, it says what it looked at, and a person can say what it missed.',
    setup: () => { mNav('work'); M.tab = 'done'; mRender(); },
    steps: [
      { do: 'Open the latest Rule-health sweep run.', see: 'AI suggestion: Nothing found. “Looked at” lists the 152 rules, and one it skipped because MSN-1004 already handles it.', act: () => mOpenTask(mNF('rules')), done: () => M.panelTask === mNF('rules') },
      { do: 'Open “Give feedback, or say what it missed”, type what it missed and send.', see: 'The miss is recorded on the mission, shown in the activity and counted in the quality measure.', act: () => { const id = mNF('rules'); M.more[id + ':fb'] = true; mPanelRender(); icons(); setTimeout(() => { const el = $('m-missed-' + id); if (el) { el.value = 'Rule 232 stopped firing on Sunday'; mMissedSend(id); } }, 300); }, done: () => !!(mT(mNF('rules')).fb || {}).missed }
    ] },
  { name: 'Decline with a reason', point: 'A decline is final and has a reason. The reason decides when, if ever, the suggestion may come back.',
    setup: () => mNav('work'),
    steps: [
      { do: 'Open MSN-1002, the Chrome extension rule.', see: 'One proposal: suppression and an environment fact.', act: () => mOpenTask('MSN-1002'), done: () => M.panelTask === 'MSN-1002' },
      { do: 'Press Decline.', see: 'Four reasons: wrong, not now, accepted risk, never.', act: () => mDecide('MSN-1002', 'reject'), done: () => !!M.decl || mT('MSN-1002').status === 'done' },
      { do: 'Choose “Not now”.', see: 'Declined · Not now, until a date 14 days away. Nothing changed.', act: () => mDecide('MSN-1002', 'reject', 'later'), done: () => mT('MSN-1002').end === 'rejected' },
      { do: 'Open the rule in Correlation Rules.', see: 'Its AI suggestion shows “Tune · not now”, and the side panel shows the outcome.', act: () => mPivot('MSN-1002', 'rules'), done: () => M.view === 'rules' }
    ] },
  { name: 'A declined suggestion comes back worse', point: 'A cool-down holds unless the problem gets materially worse. Then the suggestion returns, linked to the decision it overrides.',
    setup: () => { mNav('work'); M.tab = 'done'; mRender(); },
    steps: [
      { do: 'Open MSN-0987, declined “not now” a week ago.', see: 'The outcome says who declined, why, and until when.', act: () => mOpenTask('MSN-0987'), done: () => M.panelTask === 'MSN-0987' },
      { do: 'Wait for the daily noise review, or press Show me.', see: 'The noise on the rule doubled, so a new mission is raised.', act: () => mScnReady(4), done: () => !!mTask('MSN-1017') },
      { do: 'Open MSN-1017.', see: '“Raised again”, linked to MSN-0987, with the numbers that made it materially worse.', act: () => mOpenTask('MSN-1017'), done: () => M.panelTask === 'MSN-1017' }
    ] },
  { name: 'Several findings in one mission', point: 'One run can find several things. Each proposal has its own decision, and what another mission handles is skipped.',
    setup: () => mNav('work'),
    steps: [
      { do: 'Open MSN-1015, today’s noise review.', see: 'Two findings with proposals, and a third marked “Handled in MSN-1002”.', act: () => mOpenTask('MSN-1015'), done: () => M.panelTask === 'MSN-1015' },
      { do: 'Approve finding 1.', see: 'Applied by you. One proposal is left.', act: () => mDecideP('MSN-1015', 0, 'approve'), done: () => !!(mT('MSN-1015').findings || [])[0].dec },
      { do: 'Decline finding 2, and pick a reason.', see: 'The mission is Done: 1 applied, 1 declined.', act: () => mDecideP('MSN-1015', 1, 'reject', 'risk'), done: () => !!(mT('MSN-1015').findings || [])[1].dec }
    ] },
  { name: 'Two missions change the same rule', point: 'Several missions can work on one rule. A change applies only to the version it expects, so the second one is checked again.',
    setup: () => mNav('work'),
    steps: [
      { do: 'Dana K. asks for a severity change on the Chrome extension rule. Press Show me.', see: 'MSN-1016 arrives and needs you.', act: () => mScnReady(3), done: () => !!mTask('MSN-1016') },
      { do: 'Open MSN-1016.', see: '“Another change is pending on this rule: MSN-1002.” Both apply to version 7.', act: () => mOpenTask('MSN-1016'), done: () => M.panelTask === 'MSN-1016' },
      { do: 'Approve it.', see: 'Rule 224 is now version 8.', act: () => mDecide('MSN-1016', 'approve'), done: () => mT('MSN-1016').status === 'done' },
      { do: 'Open MSN-1002.', see: 'Out of date, then version 2, rebuilt on the new rule. Approve waits for it.', act: () => mOpenTask('MSN-1002'), done: () => (mT('MSN-1002').ver || 1) > 1 }
    ] },
  { name: 'Someone changes the rule under you', point: 'Nothing is locked. A person can edit or delete with a warning, and open proposals are checked again or cancelled.',
    setup: () => mNav('rules'),
    steps: [
      { do: 'Open the record of rule 224 (Chrome extension).', see: 'Its version, open missions, pending changes and decisions.', act: () => mScnObj('rules', 224), done: () => !!M.panelObj && M.panelObj.id === 224 },
      { do: 'Press Edit rule.', see: 'A warning: MSN-1002 has a pending change on this rule.', act: () => { M.objWarn = { id: 224, kind: 'edit' }; mPanelRender(); icons(); }, done: () => !!M.objWarn || mRule(224).ver > 7 },
      { do: 'Press Save my edit.', see: 'Rule 224 becomes version 8. The pending change is marked out of date.', act: () => mObjDo(224, 'edit'), done: () => mRule(224).ver > 7 },
      { do: 'Open MSN-1002.', see: 'It was checked again on version 8 and posted version 2.', act: () => mOpenTask('MSN-1002'), done: () => M.panelTask === 'MSN-1002' && (mT('MSN-1002').ver || 1) > 1 },
      { do: 'Now delete the rule. Press Show me.', see: 'MSN-1002 has nothing left to change, so it closes as Cancelled.', act: () => { mObjDo(224, 'delete'); mLater(3200, () => mOpenTask('MSN-1002')); }, done: () => mT('MSN-1002').end === 'cancelled' }
    ] },
  { name: 'Blocked: partly applied', point: 'If part of an approved change is refused, the mission is Blocked and needs you again. Nothing else moves until you choose.',
    setup: () => { mNav('work'); mTask('MSN-1005').race = true; },
    steps: [
      { do: 'Open MSN-1005: retire 3 leftover rules.', see: 'One approval for three rules.', act: () => mOpenTask('MSN-1005'), done: () => M.panelTask === 'MSN-1005' },
      { do: 'Approve all three.', see: 'Dana K. edited rule 222 a moment before, so that write is refused. Blocked: 2 of 3 applied.', act: () => mDecide('MSN-1005', 'approve'), done: () => !!mT('MSN-1005').partial },
      { do: 'Press “Check rule 222 again”.', see: 'Version 2 asks only about rule 222, on its new version.', act: () => mBlockedGo('MSN-1005', 'recheck'), done: () => !!(mT('MSN-1005').partial || {}).rechecked },
      { do: 'Approve version 2.', see: 'Done: all three changes are applied.', act: () => mDecide('MSN-1005', 'approve'), done: () => mT('MSN-1005').status === 'done' }
    ] },
  { name: 'Waiting on another mission', point: 'When the fix is in another agent’s area, it becomes a linked mission. The first one waits, then continues and closes on its own.',
    setup: () => mNav('work'),
    steps: [
      { do: 'Open MSN-1001: three SentinelOne rules went silent.', see: 'Waiting on MSN-1012. The help from the Pipeline Engineer shows as a breadcrumb in the activity.', act: () => { mOpenTask('MSN-1001'); M.more['MSN-1001:story'] = true; mPanelRender(); icons(); }, done: () => M.panelTask === 'MSN-1001' },
      { do: 'Open MSN-1012 from the link.', see: 'One approval runs the steps in order.', act: () => mOpenTask('MSN-1012'), done: () => M.panelTask === 'MSN-1012' },
      { do: 'Approve the mapping fix.', see: 'Step 1 applied, step 2 replays, then MSN-1001 checks the rules.', act: () => mDecide('MSN-1012', 'approve'), done: () => mT('MSN-1012').status === 'done' },
      { do: 'Open MSN-1001 again.', see: 'It continued on its own and closes when the rules fire again.', act: () => mOpenTask('MSN-1001'), done: () => mT('MSN-1001').status === 'done' }
    ] },
  { name: 'Talking to the owner', point: 'In a mission you talk only to its owner. It says how it treats each ask. Your conversation is yours; only confirmed changes reach the shared activity.',
    setup: () => mNav('work'),
    steps: [
      { do: 'Open MSN-1012.', see: 'Activity on top, shared. Your conversation below, only yours. No agent selector.', act: () => mOpenTask('MSN-1012'), done: () => M.panelTask === 'MSN-1012' },
      { do: 'Ask: “What is the risk?”', see: 'Tagged “Question”. Only you see it and the answer.', act: () => mSend('What is the risk?'), done: () => (mT('MSN-1012').notes || []).some(n => n.kind === 'reply') },
      { do: 'Ask: “Also check other renamed fields”.', see: 'Tagged “Change to this mission”, with the line it will share.', act: () => mSend('Also check other renamed fields'), done: () => !!M.steer || (mT('MSN-1012').history || []).some(h => h.kind === 'steer') },
      { do: 'Press “Confirm and share”.', see: 'One line in the activity, never your conversation. Version 2 arrives.', act: () => mSteer('MSN-1012', true), done: () => (mT('MSN-1012').history || []).some(h => h.kind === 'steer') },
      { do: 'Ask: “Are we covered for impossible travel?”, then continue in a general chat.', see: 'It is outside the mission, so it moves to a general chat with the question carried over.', act: () => { mSend('Are we covered for impossible travel?'); mLater(1200, () => mCarry()); }, done: () => !M.panelTask && (M.chats._ || []).length > 0 }
    ] },
  { name: 'From a chat: artifacts and missions', point: 'A chat answers, shows results as artifacts next to it, runs a one-off action with approval, and starts a mission only when it starts a job.',
    setup: () => { mNav('work'); mOpenPanel(); },
    steps: [
      { do: 'Ask: “Top 5 noisy rules”.', see: 'The answer carries a table as an artifact card.', act: () => mSend('Top 5 noisy rules'), done: () => (M.chats._ || []).some(m => m.artifact) },
      { do: 'Open the table.', see: 'In full screen it opens next to the chat. Drag the divider to give it more or less room.', act: () => { const i = M.chats._.findIndex(m => m.artifact); if (i >= 0) mOpenArt(M.chats._[i].artifact); }, done: () => !!M.art },
      { do: 'Ask: “Check why Check Point verdicts are missing in XSIAM”.', see: 'That starts a job, so it runs as MSN-1009. Its card is anchored in the chat and opens next to it.', act: () => mSend('Check why Check Point verdicts are missing in XSIAM'), done: () => !!mTask('MSN-1009') },
      { do: 'Ask: “Run rule 233 now on the last 24 hours”, then press Run it.', see: 'A one-off action with approval in the chat. No mission is opened.', act: () => { mSend('Run rule 233 now on the last 24 hours'); mLater(1100, () => { const i = M.chats._.findIndex(m => m.approval); if (i >= 0) mChatAct('_', i, true); }); }, done: () => (M.chats._ || []).some(m => m.approval && m.done) }
    ] },
  { name: 'Panel sizes', point: 'Two sizes. The side panel is one column whose width you drag. Full screen has the history, the conversation and the mission, with a divider between the last two.',
    setup: () => { mNav('rules'); mOpenTask('MSN-1002'); },
    steps: [
      { do: 'Look at the side panel on Correlation Rules.', see: 'One column: the short card, the activity and your conversation. The table stays usable.', act: () => {}, done: () => M.view === 'rules' && M.panelTask === 'MSN-1002' },
      { do: 'Drag the panel’s left edge to make it wider.', see: 'From 560 pixels it shows the full mission card instead of the short one. It goes from 30% to 70% of the screen.', act: () => { M.pct.native = 50; mRender(); }, done: () => M.pct.native !== 34 },
      { do: 'Press the full-screen button, or F.', see: 'The history, the conversation and the mission.', act: () => mSizeToggle(), done: () => mSize() === 'work' },
      { do: 'Drag the divider between the conversation and the mission.', see: 'The mission takes 30% to 72%. The history hides with its own button.', act: () => { M.artPct = 38; mRender(); }, done: () => M.artPct !== 52 }
    ] }
];
const MF = { i: null, step: 0, ok: [], pos: null, min: false, iv: null, off: false };
function mFlow(i) {
  i = (i + M_FLOWS.length) % M_FLOWS.length;
  closeDemoMenu(); mSheetShow(false); mInit(); mLiveStop();
  Object.assign(MF, { i, step: 0, ok: [], min: false, off: false, busy: false }); M.scn = i; M.scnBar = false;
  M_FLOWS[i].setup(); mFlowRender();
  clearInterval(MF.iv); MF.iv = setInterval(mFlowTick, 600);
}
const mScn = mFlow;
/* A step ticks when its result is on screen; the card then moves to the next step. */
function mFlowTick() {
  const f = MF.i === null ? null : M_FLOWS[MF.i]; if (!f || !M) return;
  let moved = false;
  while (MF.step < f.steps.length) { let d = false; try { d = f.steps[MF.step].done(); } catch (e) {} if (!d) break; MF.ok[MF.step] = true; MF.step++; moved = true; }
  if (moved) mFlowRender();
}
function mFlowShow() { if (MF.busy) return; const f = M_FLOWS[MF.i], st = f && f.steps[MF.step]; if (st) { st.act(); setTimeout(mFlowTick, 250); } }
/* One step back. What a step did cannot be undone in place, so the flow restarts and replays every step before it. */
function mFlowBack() {
  if (MF.busy || MF.i === null) return; const target = Math.max(0, MF.step - 1), i = MF.i, min = MF.min;
  mFlow(i); MF.min = min; if (!target) return mFlowRender();
  MF.busy = true; mFlowRender();
  const run = k => {
    if (MF.i !== i) { MF.busy = false; return; }
    if (MF.step >= target) { MF.busy = false; return mFlowRender(); }
    const st = M_FLOWS[i].steps[MF.step]; st.act(); const t0 = Date.now();
    const wait = () => { mFlowTick(); if (MF.step > k || Date.now() - t0 > 12000) return run(MF.step); setTimeout(wait, 250); };
    setTimeout(wait, 250);
  };
  run(0);
}
function mFlowReset() { if (MF.busy || MF.i === null) return; const min = MF.min; mFlow(MF.i); MF.min = min; mFlowRender(); }
function mFlowRender() {
  let el = $('m-flow');
  if (!el) { document.body.insertAdjacentHTML('beforeend', '<div id="m-flow" class="m-flow"></div>'); el = $('m-flow'); }
  if (MF.pos) { el.style.left = MF.pos[0] + 'px'; el.style.top = MF.pos[1] + 'px'; el.style.bottom = 'auto'; }
  /* closed: a small pill reopens the list */
  if (MF.off) { el.className = 'm-flow m-flow-pill'; el.innerHTML = `<button data-act="flow-open" onclick="MF.off=false;mFlowRender()" class="px-3 py-2 inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink">${ic('clapperboard', 'w-4 h-4 c-amber')}Demo flows</button>`; icons(); return; }
  el.className = 'm-flow';
  /* no flow chosen yet: the list of flows, each with its point */
  if (MF.i === null) { el.innerHTML = `<div class="m-flow-head" onpointerdown="mFlowDrag(event)"><span class="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider shrink-0">DEMO FLOWS</span><span class="flex-1 text-[12.5px] text-ink2">Pick one. Each makes one point.</span>
      <button onpointerdown="event.stopPropagation()" onclick="MF.off=true;mFlowRender()" class="w-7 h-7 rounded-lg hover:bg-hov text-ink3 flex items-center justify-center shrink-0" title="Close">${ic('x', 'w-4 h-4')}</button></div>
    <div class="p-2 max-h-[60vh] overflow-y-auto">${M_FLOWS.map((f, k) => `<button data-flow="${k + 1}" onclick="mFlow(${k})" class="w-full text-left px-2.5 py-2 rounded-xl hover:bg-hov flex gap-2.5"><span class="w-5 h-5 mt-0.5 rounded-full bg-line2 text-ink2 text-[11px] font-bold flex items-center justify-center shrink-0">${k + 1}</span><span class="min-w-0"><span class="block text-[13px] text-ink font-semibold">${esc(f.name)}</span><span class="block text-[11.5px] text-ink3 leading-snug">${esc(f.point)}</span></span></button>`).join('')}</div>`; icons(); return; }
  const f = M_FLOWS[MF.i], all = MF.step >= f.steps.length;
  el.innerHTML = `<div class="m-flow-head" onpointerdown="mFlowDrag(event)">
      <span class="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider shrink-0">DEMO FLOW</span>
      <select onpointerdown="event.stopPropagation()" onchange="mFlow(+this.value)" class="min-w-0 flex-1 bg-sunk border border-line2 rounded-lg text-[12.5px] text-ink px-2 py-1 focus:outline-none">${M_FLOWS.map((x, k) => `<option value="${k}" ${k === MF.i ? 'selected' : ''}>${k + 1}. ${esc(x.name)}</option>`).join('')}</select>
      <button onpointerdown="event.stopPropagation()" onclick="MF.min=!MF.min;mFlowRender()" class="w-7 h-7 rounded-lg hover:bg-hov text-ink3 flex items-center justify-center shrink-0" title="${MF.min ? 'Open' : 'Minimize'}">${ic(MF.min ? 'chevron-up' : 'chevron-down', 'w-4 h-4')}</button>
      <button onpointerdown="event.stopPropagation()" onclick="clearInterval(MF.iv);MF.i=null;MF.off=true;mFlowRender()" class="w-7 h-7 rounded-lg hover:bg-hov text-ink3 flex items-center justify-center shrink-0" title="Close. The Demo flows button reopens it">${ic('x', 'w-4 h-4')}</button></div>
    ${MF.min ? `<div class="px-3 py-2 flex items-center gap-2">
      <button data-act="flow-back" onclick="mFlowBack()" ${MF.step === 0 || MF.busy ? 'disabled' : ''} class="w-8 h-8 rounded-lg border border-line2 text-ink2 hover:bg-hov flex items-center justify-center shrink-0 disabled:opacity-35" title="One step back">${ic('skip-back', 'w-4 h-4')}</button>
      <button data-act="flow-play" onclick="mFlowShow()" ${all || MF.busy ? 'disabled' : ''} class="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center justify-center shrink-0 disabled:opacity-35" title="Do the next step">${ic('play', 'w-4 h-4')}</button>
      <button data-act="flow-reset" onclick="mFlowReset()" ${MF.busy ? 'disabled' : ''} class="w-8 h-8 rounded-lg border border-line2 text-ink2 hover:bg-hov flex items-center justify-center shrink-0 disabled:opacity-35" title="Start the flow from the beginning">${ic('rotate-ccw', 'w-4 h-4')}</button>
      <span class="min-w-0 flex-1 text-[12px] leading-snug ${all ? 'c-cx font-semibold' : 'text-ink2'}">${MF.busy ? 'Going back…' : all ? 'Flow done' : `<span class="text-ink4 font-mono">${MF.step + 1}/${f.steps.length}</span> ${esc(f.steps[MF.step].do)}`}</span></div>` : ''}
    ${MF.min ? '' : `<div class="px-4 pt-3 pb-1 text-[12.5px] text-ink2 leading-relaxed"><b class="text-ink">The point:</b> ${esc(f.point)}</div>
    <ol class="px-3 py-2 space-y-1 max-h-[46vh] overflow-y-auto">${f.steps.map((s, k) => { const done = MF.ok[k], cur = k === MF.step;
      return `<li data-step="${k}" class="rounded-xl px-2.5 py-2 ${cur ? 'bg-hov' : ''}"><div class="flex gap-2.5"><span class="w-5 h-5 mt-0.5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${done ? 'bg-cx text-slate-950' : cur ? 'bg-amber-500 text-slate-950' : 'bg-line2 text-ink3'}">${done ? ic('check', 'w-3 h-3') : k + 1}</span>
        <div class="min-w-0 flex-1"><div class="text-[13px] ${cur ? 'text-ink font-semibold' : done ? 'text-ink3' : 'text-ink2'}">${esc(s.do)}</div>${cur || done ? `<div class="text-[12px] ${done ? 'text-ink4' : 'text-ink3'} mt-0.5 leading-snug">Notice: ${esc(s.see)}</div>` : ''}
        ${cur ? `<button data-act="flow-show" onclick="mFlowShow()" class="mt-1.5 px-2.5 py-1 rounded-lg border border-line2 text-[12px] text-ink2 hover:bg-panel inline-flex items-center gap-1.5">${ic('play', 'w-3 h-3')}Show me</button>` : ''}</div></div></li>`; }).join('')}</ol>
    <div class="px-4 pb-3 pt-1 flex items-center justify-between gap-2 text-[12px]"><span class="flex items-center gap-3"><button onclick="mFlowBack()" ${MF.step === 0 || MF.busy ? 'disabled' : ''} class="text-ink3 hover:text-ink inline-flex items-center gap-1 disabled:opacity-35">${ic('skip-back', 'w-3.5 h-3.5')}Back</button><button onclick="mFlowReset()" class="text-ink3 hover:text-ink inline-flex items-center gap-1">${ic('rotate-ccw', 'w-3.5 h-3.5')}Restart</button><button data-act="flow-list" onclick="clearInterval(MF.iv);MF.i=null;mFlowRender()" class="text-ink3 hover:text-ink inline-flex items-center gap-1">${ic('list', 'w-3.5 h-3.5')}All flows</button></span>${all ? `<span class="c-cx font-semibold">Flow done</span><button data-act="flow-next" onclick="mFlow(MF.i+1)" class="px-3 py-1.5 rounded-lg bg-ink text-panel font-bold inline-flex items-center gap-1">Next flow${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : `<span class="text-ink4">Step ${MF.step + 1} of ${f.steps.length}</span>`}</div>`}`;
  icons();
}
/* The card moves by its header and stays where it is put, also across flows. */
function mFlowDrag(e) {
  const el = $('m-flow'); if (!el) return; e.preventDefault();
  const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
  const move = ev => { const x = Math.max(4, Math.min(window.innerWidth - r.width - 4, ev.clientX - dx)), y = Math.max(4, Math.min(window.innerHeight - 60, ev.clientY - dy)); MF.pos = [x, y]; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.bottom = 'auto'; };
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
}
function mScnBar() { const el = $('m-scn'); if (el) { el.classList.add('hidden'); el.innerHTML = ''; } }
function mScnMenu() {
  const menu = $('demo-menu'); if (!menu || $('m-scn-menu')) return;
  menu.insertAdjacentHTML('beforeend', `<button id="m-scn-menu" onclick="closeDemoMenu();mFlow(MF.i === null ? 0 : MF.i)" class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-hov flex items-center gap-2 text-ink2">${ic('clapperboard', 'w-3.5 h-3.5')} Show the demo flows</button>`);
}
function mScnFromUrl() { let v = null; try { const u = new URLSearchParams(location.search); v = u.get('flow') || u.get('scn'); } catch (e) {} if (v) mFlow(+v - 1); else mFlowRender(); }

/* The approval for a one-off action in a chat. */
function mChatAct(key, i, ok) {
  const m = (M.chats[key] || [])[i]; if (!m || !m.approval || m.done) return; m.done = ok ? 'approved' : 'declined';
  M.chats[key].push({ role: 'agent', agent: 'det', text: ok ? 'Ran rule 233 on the last 24 hours: **0 matches**, so no issue was created. It was a one-off action in this chat, recorded in the audit log. No mission was opened.' : 'Not run. Nothing changed.' });
  mPanelRender(); icons(); mPanelBottom();
}
/* A mission started from a chat is anchored there: a small live card that shows where it is. */
function mChatCard(id) {
  const t = mTask(id); if (!t) return `<div class="mt-2 rounded-xl border border-line px-3 py-2 text-[12.5px] text-ink3">${id} is starting…</div>`;
  return `<button data-chatcard="${id}" onclick="mOpenArt({kind:'mission',id:'${id}'})" class="mt-2 w-full text-left rounded-xl border border-line2 bg-card px-3.5 py-2.5 hover:border-cx/60">
    <div class="flex items-center gap-2 text-[11.5px]"><span class="font-mono text-ink3">${id}</span><span class="text-ink4">·</span><span class="text-ink3">${esc((MY_JOBS[t.job] || {}).name || '')}</span><span class="ml-auto">${mStatus(t)}</span></div>
    <div class="text-[13.5px] font-semibold text-ink mt-1 leading-snug">${esc(t.title)}</div>
    <div class="text-[12px] text-ink3 mt-0.5">${mRunning(t) ? esc(t.steps[Math.min(t.shown || 1, t.steps.length) - 1]) + '…' : t.waitOn ? 'Waits on ' + t.waitOn : esc(mNeed(t).q || t.outcome || '')}</div></button>`;
}

/* ======================================================================
   ARTIFACTS
   A result in a chat that is worth looking at in full: a mission card, a
   table. In full screen it opens on the right, next to the chat, and the
   divider sets how much space it takes. In the side panel there is no room,
   so opening one switches to full screen with the artifact on the right.
   ====================================================================== */
function mOpenArt(a) {
  M.art = a; M.panelTask = null;
  if (mSize() !== 'work' && mWide()) { M.size[mSizeKey()] = 'work'; M.artFromSide = true; toast('Opened in full screen, next to the chat. F returns to the side panel', 'maximize-2'); }
  mRender();
}
function mArtChip(a, i, key) {
  return `<button data-art="${i}" onclick="mOpenArt(M.chats['${key}'][${i}].artifact)" class="mt-2 w-full text-left rounded-xl border border-line2 bg-card px-3.5 py-2.5 hover:border-cx/60 flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-sunk flex items-center justify-center text-ink3">${ic('table-2', 'w-4 h-4')}</span><span class="min-w-0 flex-1"><span class="block text-[13.5px] font-semibold text-ink">${esc(a.title)}</span><span class="block text-[12px] text-ink3">Table · ${a.rows.length} rows · opens next to the chat</span></span>${ic('panel-right-open', 'w-4 h-4 text-ink3')}</button>`;
}
function mArtHtml(a) {
  if (!a) return '';
  const bar = (title, extra = '') => `<div class="flex items-center gap-2 pb-3 mb-4 border-b border-line"><span class="text-[11px] font-black tracking-[.14em] uppercase text-ink3">From this chat</span><span class="min-w-0 flex-1 text-[13px] text-ink2 truncate">${esc(title)}</span>${extra}<button data-act="art-close" onclick="M.art=null;mRender()" class="w-8 h-8 rounded-lg hover:bg-hov text-ink3 hover:text-ink flex items-center justify-center" title="Close (Esc)">${ic('x', 'w-4 h-4')}</button></div>`;
  if (a.kind === 'mission') { const t = mTask(a.id); if (!t) return bar(a.id) + '<p class="text-[13px] text-ink3">Starting…</p>';
    return bar(t.id, `<button data-act="art-go" onclick="mOpenTask('${t.id}')" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold">Go to the mission</button>`) + `<div class="m-flat">${mRunning(t) ? mWorking(t) : mCard(t)}</div>`; }
  return bar(a.title) + `<div class="rounded-xl border border-line overflow-hidden"><table class="w-full text-[13px]"><thead class="bg-sunk text-ink3 text-left"><tr>${a.cols.map(c => `<th class="px-3 py-2 font-semibold">${esc(c)}</th>`).join('')}</tr></thead><tbody>${a.rows.map(r => `<tr class="border-t border-line">${r.map((c, k) => `<td class="px-3 py-2 ${k ? 'text-ink2' : 'text-ink'}">${k === 2 && c !== '—' ? mSug(c, { solid: true }) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="mt-3 text-[12.5px] text-ink3">Ask about it in the chat on the left. It stays open while you talk.</p>`;
}
