/* ======================================================================
   SECOPS · THE WORKSPACE
   One panel, three sizes. Closed: the screen. Side: a narrow panel next to
   a native screen. Workspace: the panel covers the screen and becomes the
   place to work, with the mission on the right and its conversation on
   the left.

   A mission has ONE conversation and everyone in the mission sees it:
   what the agents did, handoffs, every version of the proposal, decisions
   and comments. A question a person asks the agent is private to that
   person until they share it.

   Also here: versions (a change never replaces what is on screen), several
   recommendations in one mission, the plan after an approval, the queue,
   the quick switcher and the demo scenarios.
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
  const now = Date.now(), H = 3600000;
  M.presence = { 'MSN-1012': { dana: 'viewing' }, 'MSN-1002': { noam: 'past' }, 'MSN-1005': { dana: 'past' } };
  mNote('MSN-1012', { who: 'dana', vis: 'shared', kind: 'msg', t: now - 4 * H, text: 'I installed the pack update. I did not touch the data model, so the old mapping is still there.' });
  mNote('MSN-1002', { who: 'noam', vis: 'shared', kind: 'msg', t: now - 6 * H, text: 'These come from the extensions that IT approved. I close them by hand every day.' });
  mNote('MSN-1005', { who: 'dana', vis: 'shared', kind: 'msg', t: now - 40 * H, text: 'Rule 222 is a copy I made for a test. It is safe to disable.' });
  /* Earlier private chats. The answers are computed from the world, like every other answer. */
  M.hist = [];
  [['h1', 'SentinelOne: why three rules went silent', 'Why did SentinelOne break?', 'MSN-1012', 4.5], ['h2', 'Impossible travel coverage', 'Are we covered for impossible travel?', 'MSN-1006', 28], ['h3', 'Status brief', 'Brief me', null, 52]].forEach(([id, title, q, task, h]) => {
    M.hist.push({ id, title, task, t: now - h * H });
    M.chats[id] = [{ role: 'user', text: q }, { role: 'agent', text: mAnswer(q).text }];
  });
}
function mNote(tid, o) { const t = mTask(tid); if (!t) return null; t.notes = t.notes || []; const n = Object.assign({ id: 'n' + (t.notes.length + 1), t: Date.now(), vis: 'shared' }, o); t.notes.push(n); return n; }

/* ======================================================================
   VERSIONS
   A material change (the proposal, the evidence, the impact) is a new
   version. If the mission is on screen, the old version stays there until
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
const mVerTag = t => `<span class="inline-flex items-center gap-1.5 shrink-0"><span class="font-mono text-[11px] px-1.5 py-0.5 rounded-md border border-line2 text-ink3" title="The version of the proposal on screen. A decision is recorded with its version.">version ${t.ver || 1}</span>${t.next ? `<span class="font-mono text-[11px] px-1.5 py-0.5 rounded-md tn tn-amber font-bold">version ${(t.ver || 1) + 1} is ready</span>` : ''}</span>`;
function mCardBanners(t) {
  const out = [];
  if (t.lockBy) out.push(`<section class="rounded-2xl border-2 border-cx/60 bg-cx/10 p-4 flex items-start gap-3">${mHu(t.lockBy, 30)}<div class="min-w-0"><div class="text-[14.5px] font-bold text-ink">${esc(M_PPL[t.lockBy].name)} ${t.end === 'rejected' ? 'declined' : 'approved'} this ${mAgo(t.closed)}, while you were viewing it</div><p class="text-[13px] text-ink2 mt-0.5 leading-relaxed">Nothing is left to decide here. The mission is locked and you stay on it, so nothing moves under you.</p></div></section>`);
  if (t.next) out.push(`<section class="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-4 m-pulse tn-amber">
      <div class="flex items-start gap-3"><span class="c-amber mt-0.5">${ic('git-compare-arrows', 'w-5 h-5')}</span><div class="min-w-0 flex-1"><div class="text-[14.5px] font-bold text-ink">This mission changed while you were viewing it</div>
      <p class="text-[13px] text-ink2 mt-0.5 leading-relaxed">You are still looking at <b class="text-ink">version ${t.ver || 1}</b>. ${esc(t.next.title)}. Approve is locked until you see version ${(t.ver || 1) + 1}.</p>
      <button data-act="see" onclick="mSeeUpdate('${t.id}')" class="mt-2.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13.5px] font-bold inline-flex items-center gap-2">Show version ${(t.ver || 1) + 1}${ic('arrow-right', 'w-4 h-4')}</button></div></div></section>`);
  if (t.cameBack && t.status === 'pending') out.push(`<section class="rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 p-4 flex items-start gap-3"><span class="c-rose mt-0.5">${ic('undo-2', 'w-5 h-5')}</span><div class="min-w-0"><div class="text-[14.5px] font-bold text-ink">This mission came back to you</div><p class="text-[13px] text-ink2 mt-0.5 leading-relaxed">A step you approved could not be applied. Everything else went through. Choose Retry or Skip on the failed step.</p></div></section>`);
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
  (M.presence[tid] = M.presence[tid] || {})[who] = 'viewing';
  toast(`${tid}: ${choice === 'reject' ? 'declined' : 'approved'} by ${M_PPL[who].name}`, 'user-check');
  mRender(); mThreadEnd(tid);
}

/* ======================================================================
   SEVERAL RECOMMENDATIONS IN ONE MISSION
   When the recommendations do not depend on each other, each one has its
   own Approve and its own status. The row stays after the decision:
   Approved, Applying, Verifying, Done, or Failed.
   ====================================================================== */
function mRecs(t) {
  if (!t || t.card !== 'retire' || !t.recommended || t.recommended.kind !== 'settings') return null;
  if (!t.recs) t.recs = t.recommended.rows.map(([name, act], i) => ({ id: +(name.match(/ID (\d+)/) || [])[1], name: name.replace(/ \(ID \d+\)/, ''), now: t.current.rows[i][1], act, state: t.status === 'done' ? (['rejected', 'dismissed'].includes(t.end) ? 'declined' : 'done') : 'proposed' }));
  return t.recs;
}
const M_RS = { proposed: ['Proposed', 'slate', 'circle-dashed'], applying: ['Applying', 'blue', 'loader'], verifying: ['Verifying', 'blue', 'loader'], done: ['Done', 'cx', 'circle-check'], declined: ['Declined', 'slate', 'x'], failed: ['Failed', 'rose', 'triangle-alert'] };
function mRecsBox(t) {
  const rs = mRecs(t), done = rs.filter(r => r.state === 'done').length, busy = rs.filter(r => ['applying', 'verifying'].includes(r.state)).length, fail = rs.filter(r => r.state === 'failed').length, open = rs.filter(r => r.state === 'proposed').length;
  const sum = [open && `${open} to decide`, busy && `${busy} running`, done && `${done} done`, fail && `${fail} failed`, rs.filter(r => r.state === 'declined').length && `${rs.filter(r => r.state === 'declined').length} declined`].filter(Boolean).join(' · ');
  return `<div>${mLabel('Recommendations', `<span class="text-[12px] text-ink3 font-mono">${sum}</span>`)}
    <p class="text-[12.5px] text-ink3 mt-1 leading-relaxed">These do not depend on each other. Decide each one, or all at once at the bottom. A row keeps its status after you decide.</p>
    <div class="mt-2 rounded-xl border border-line divide-y divide-line overflow-hidden">${rs.map(r => { const s = M_RS[r.state], spin = ['applying', 'verifying'].includes(r.state);
      return `<div data-rec="${r.id}" class="px-3 py-2.5 ${r.state === 'failed' ? 'bg-rose-500/10' : 'bg-sunk'}">
        <div class="flex items-start gap-3"><div class="min-w-0 flex-1"><div class="text-[13.5px] text-ink font-semibold leading-snug">${esc(r.act)}: ${esc(r.name)} <span class="font-mono text-ink4 font-normal">ID ${r.id}</span></div><div class="text-[12px] text-ink3 mt-0.5">Now: ${esc(r.now)}</div></div>
          ${r.state === 'proposed' && t.status === 'pending' && !t.next ? `<span class="flex gap-1.5 shrink-0"><button data-rec-ok="${r.id}" onclick="mRec('${t.id}',${r.id},'approve')" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold hover:opacity-90">Approve</button><button onclick="mRec('${t.id}',${r.id},'decline')" class="px-3 py-1.5 rounded-lg tn tn-rose text-[12.5px] font-bold">Decline</button></span>`
            : `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg tn tn-${s[1]} text-[12px] font-semibold whitespace-nowrap shrink-0">${ic(s[2], 'w-3.5 h-3.5' + (spin ? ' animate-spin' : ''))}${s[0]}</span>`}</div>
        ${r.state === 'failed' ? `<div class="mt-2 flex items-center gap-2 flex-wrap"><span class="text-[12.5px] c-rose flex-1 min-w-[200px]">${esc(r.err)}</span><button data-rec-retry="${r.id}" onclick="mRec('${t.id}',${r.id},'retry')" class="px-3 py-1.5 rounded-lg bg-ink text-panel text-[12.5px] font-bold">Retry</button><button onclick="mRec('${t.id}',${r.id},'decline')" class="px-3 py-1.5 rounded-lg border border-line2 text-ink text-[12.5px] font-bold">Skip</button></div>` : ''}</div>`; }).join('')}</div></div>`;
}
function mRec(tid, rid, choice) {
  const t = mTask(tid), r = t && (mRecs(t) || []).find(x => x.id === rid); if (!r || t.status === 'done') return;
  if (t.next) return toast(`${t.id}: review the new version before deciding`, 'triangle-alert');
  if (choice === 'decline') r.state = 'declined';
  else { if (choice === 'retry') r.willFail = false; r.state = 'applying'; t.decVer = t.ver || 1;
    M.timers.push(setTimeout(() => {
      if (r.willFail) { r.state = 'failed'; r.err = `Could not ${r.act.toLowerCase()} this rule: it was open for editing in another session, so the change was not saved.`; }
      else { r.state = 'verifying'; M.timers.push(setTimeout(() => { myApplyPart(M.W, t, r.id); r.state = 'done'; mRecSync(t); mRender(); }, 1700)); }
      mRecSync(t); mRender(); }, 1300)); }
  mRecSync(t); mRender();
}
function mRecAll(tid, choice) { const t = mTask(tid); (mRecs(t) || []).filter(r => r.state === 'proposed').forEach(r => mRec(tid, r.id, choice)); }
/* The mission follows its recommendations: with you while something is open, in progress while they run, done when all have an answer. */
function mRecSync(t) {
  const rs = mRecs(t), st = k => rs.filter(r => r.state === k), was = t.status;
  if (t.status === 'done') return;
  if (st('failed').length) { if (!t.cameBack) { t.cameBack = true; t.unread = M.panelTask !== t.id || !mPanelOn(); const f = st('failed')[0];
      mNote(t.id, { who: t.agent, kind: 'fail', text: `Could not ${f.act.toLowerCase()} rule ${f.id}. The other steps are not affected. This needs a human again.` });
      M.W.log.unshift({ t: Date.now(), kind: 'task', text: `${t.id} is ready for a decision` }); toast(`${t.id} came back: a step failed`, 'undo-2'); mThreadEnd(t.id); }
    t.status = 'pending'; return; }
  t.cameBack = false;
  if (st('proposed').length) { t.status = 'pending'; return; }
  const busy = st('applying').length + st('verifying').length, ok = st('done');
  if (busy) { t.status = 'progress'; t.by = mMe(); t.progressNote = `Applying · ${ok.length} of ${ok.length + busy} done`; }
  else myClosePart(M.W, t, M_USER, ok.map(r => r.id), st('declined').map(r => r.id));
  /* Approve and forget: once nothing is left to decide, the next mission comes up on its own. */
  if (was === 'pending' && t.status !== 'pending' && !M.scn && M.deck && M.panelTask === t.id && !M.pivot) M.timers.push(setTimeout(() => { const nx = myPendingTasks(M.W)[0]; if (nx && M.panelTask === t.id) mOpenTask(nx.id); }, 1400));
}

/* ======================================================================
   THE PLAN AFTER AN APPROVAL
   Steps that depend on each other are one plan with one Approve. The
   states are read from the missions, not kept on the side.
   ====================================================================== */
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
  const S = Object.assign({ queued: ['Queued', 'slate', 'clock'] }, M_RS), pending = t.status === 'pending';
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
  const rs = t.recs, p = mPlan(t);
  if (t.cameBack) return 'Came back: a step failed';
  if (rs && t.status === 'progress') return t.progressNote;
  if (p && t.status === 'done') { const cur = p.find(s => s.state !== 'done'); return cur ? `${M_RS[cur.state] ? M_RS[cur.state][0] : 'Queued'}: step ${p.indexOf(cur) + 1} of ${p.length}` : 'All steps done'; }
  return t.status === 'progress' ? (t.progressNote || 'In progress') : mStatusTxt(t);
}

/* ======================================================================
   WHO IS IN THE MISSION, AND WHO IT WAITS ON
   ====================================================================== */
function mPeople(t) {
  const out = [], seen = {}, add = (k, role, state, live) => { if (seen[k]) return; seen[k] = 1; out.push({ k, role, state, live: !!live }); };
  const st = x => mRunning(x) || x.status === 'progress' ? ['Working now', true] : x.status === 'pending' ? [x.waitOn ? `Waits on ${x.waitOn}` : 'Waits for a human', false] : ['Finished', false];
  add(t.agent, 'Owns this mission', ...st(t));
  const w = t.waitOn && mTask(t.waitOn), ub = t.unblockedBy && mTask(t.unblockedBy), u = t.unblocks && mTask(t.unblocks);
  if (w) add(w.agent, `Called for help · ${w.id}`, ...st(w));
  if (ub) add(ub.agent, `Helped · ${ub.id}`, ...st(ub));
  if (u) add(u.agent, `Asked for this · ${u.id}`, ...st(u));
  if (t.trigger.from && M_FROM[t.trigger.from]) add(M_FROM[t.trigger.from], 'Handed this over', 'Not active here', false);
  add('me', 'You', 'Viewing now', true);
  Object.entries(M.presence[t.id] || {}).forEach(([k, v]) => add(k, M_PPL[k].role, t.lockBy === k ? 'Decided just now' : v === 'viewing' ? 'Reviewing now' : 'Took part earlier', v === 'viewing'));
  (t.notes || []).filter(n => M_PPL[n.who] && n.vis === 'shared').forEach(n => add(n.who, M_PPL[n.who].role, 'Took part earlier', false));
  return out;
}
/* Who the mission waits on: an agent or a human. It never names one person. Presence shows who is already looking. */
function mBall(t) {
  const chip = (tone, icon, text) => `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full tn tn-${tone} text-[12px] font-bold whitespace-nowrap">${icon}${text}</span>`;
  const o = t.waitOn && mTask(t.waitOn);
  if (t.status === 'done') return chip(['rejected', 'dismissed'].includes(t.end) ? 'slate' : 'cx', ic('circle-check', 'w-3.5 h-3.5'), 'Closed');
  if (o) return chip('indigo', mAv(o.agent, 16), `Waits on the ${M_AG[o.agent].name}`);
  if (t.status === 'pending') return chip('amber', ic('user-round', 'w-3.5 h-3.5'), 'Needs a human');
  return chip('blue', mAv(t.agent, 16), t.handed ? 'Waits on another team' : `The ${M_AG[t.agent].name} is working`);
}
function mPeopleBar(t) {
  const ps = mPeople(t), others = ps.filter(p => M_PPL[p.k] && p.k !== 'me' && p.live), side = mSize() !== 'work';
  const stack = `<button data-act="people" onclick="M.people=!M.people;mPanelRender();icons()" class="flex items-center rounded-full hover:bg-hov pl-1 pr-2 py-0.5 gap-1.5" title="Who is in this mission"><span class="flex -space-x-1.5">${ps.slice(0, 6).map(p => `<span class="rounded-full ring-2 ring-[rgb(var(--panel))] inline-flex">${mWho(p.k, 22, p.live)}</span>`).join('')}</span><span class="text-[12px] text-ink3">${ps.length}</span>${ic(M.people ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5 text-ink3')}</button>`;
  const list = M.people ? `<div class="px-4 sm:px-5 pb-3 grid ${side ? '' : 'sm:grid-cols-2'} gap-x-6 gap-y-1.5">${ps.map(p => `<div class="flex items-center gap-2.5 text-[12.5px]">${mWho(p.k, 24, p.live)}<span class="min-w-0 flex-1"><span class="block text-ink font-semibold truncate">${esc(M_PPL[p.k] ? M_PPL[p.k].name : M_AG[p.k].name)} <span class="font-normal text-ink3">· ${esc(p.role)}</span></span></span><span class="shrink-0 ${p.live ? 'c-cx font-semibold' : 'text-ink3'}">${esc(p.state)}</span></div>`).join('')}</div>` : '';
  return `<div class="px-4 sm:px-5 py-2 flex items-center gap-2.5 flex-wrap">${stack}${mBall(t)}${others.length && t.status === 'pending' ? `<span class="text-[12px] text-ink2 inline-flex items-center gap-1.5">${ic('eye', 'w-3.5 h-3.5 c-cx')}${others.map(p => esc(M_PPL[p.k].name)).join(', ')} ${others.length === 1 ? 'is' : 'are'} reviewing now</span>` : ''}
    <button data-act="team" onclick="M.asTeam=!M.asTeam;mPanelRender();icons()" class="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold border ${M.asTeam ? 'tn tn-indigo' : 'border-line text-ink3 hover:text-ink'}" title="Hide your private questions and see exactly what everyone else sees">${ic(M.asTeam ? 'eye' : 'eye-off', 'w-3.5 h-3.5')}${side ? 'Team view' : 'View as the team'}</button></div>${list}`;
}

/* ======================================================================
   THE MISSION CONVERSATION
   Built from the mission (trigger, steps, handoffs, decision, outcome)
   plus the notes people and agents add. Private notes are only for the
   person who wrote them.
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
  if (t.status === 'progress' && t.by && !t.recs && t.actedAt) out.push({ t: t.actedAt, kind: 'decision', by: t.by, tone: 'cx', text: `approved version ${t.decVer || 1}. ${t.progressNote}.` });
  if (t.status === 'done') out.push(t.end === 'auto' ? { t: t.closed, kind: 'outcome', who: t.agent, text: t.outcome } : { t: t.closed, kind: 'decision', by: t.by, tone: ['rejected', 'dismissed'].includes(t.end) ? 'slate' : 'cx', text: `${['rejected', 'dismissed'].includes(t.end) ? 'declined' : 'approved'} version ${t.decVer || t.ver || 1}.`, more: t.outcome });
  return out.map((x, i) => [x, i]).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map(x => x[0]);
}
const mVis = v => v === 'private' ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold c-indigo">${ic('lock', 'w-3 h-3')}Only you</span>` : `<span class="inline-flex items-center gap-1 text-[11px] text-ink4">${ic('users', 'w-3 h-3')}Everyone</span>`;
function mThreadItem(t, x) {
  const when = `<span class="text-[11px] text-ink4 font-mono">${mAgo(x.t)}</span>`;
  const head = (k, extra = '') => `<div class="flex items-center gap-2 flex-wrap text-[12px]"><b class="text-ink font-semibold">${esc(M_PPL[k] ? (k === 'me' ? 'You' : M_PPL[k].name) : M_AG[k].name)}</b>${M_PPL[k] ? '' : `<span class="text-ink4">agent</span>`}${when}${extra}</div>`;
  const row = (k, body, live) => `<div class="flex gap-2.5">${mWho(k, 26, live)}<div class="min-w-0 flex-1">${body}</div></div>`;
  const bub = (html, cls = 'bg-card border border-line') => `<div class="mt-1 rounded-2xl rounded-tl-md px-3.5 py-2.5 ${cls} text-[13.5px] text-ink2 leading-relaxed">${html}</div>`;
  if (x.kind === 'event') return `<div class="flex items-center gap-2 text-[12px] text-ink3"><span class="w-6 h-6 rounded-full bg-sunk border border-line flex items-center justify-center shrink-0">${ic(x.icon, 'w-3 h-3')}</span><span class="min-w-0 flex-1 leading-snug">${esc(x.text)}</span>${when}</div>`;
  if (x.kind === 'work') { const k = t.id + ':tsteps', on = !!M.more[k] || x.run;
    return row(x.who, head(x.who, mVis('shared')) + bub(`${esc(x.text)} <button onclick="M.more['${k}']=!M.more['${k}'];mPanelRender();icons()" class="c-indigo font-semibold hover:underline">${x.run ? '' : on ? 'Hide the steps' : 'Show the steps'}</button>${on ? `<ol class="mt-2 space-y-1.5">${x.steps.map((s, i) => `<li class="flex gap-2 text-[13px]"><span class="w-4 h-4 mt-0.5 shrink-0 ${x.run && i === x.steps.length - 1 ? 'c-blue' : 'c-cx'}">${ic(x.run && i === x.steps.length - 1 ? 'loader' : 'check', 'w-3.5 h-3.5' + (x.run && i === x.steps.length - 1 ? ' animate-spin' : ''))}</span>${esc(s)}</li>`).join('')}</ol>` : ''}`), x.run); }
  if (x.kind === 'call') return row(x.who, head(x.who, mVis('shared')) + bub(`<span class="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[.12em] uppercase c-blue">${ic('corner-down-right', 'w-3.5 h-3.5')}Handoff</span><div class="mt-1">${esc(x.text)}</div><div class="mt-2">${mLink(x.link)}</div>`, 'bg-blue-500/5 border border-blue-500/30'));
  if (x.kind === 'ask') return row(x.who, head(x.who, mVis('shared')) + bub(`<span class="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[.12em] uppercase c-amber">${ic('user-round', 'w-3.5 h-3.5')}Needs a human · version 1</span><div class="mt-1 text-ink font-semibold">${esc(x.text)}</div>`, 'bg-amber-500/5 border border-amber-500/30'));
  if (x.kind === 'update') return row(x.who, head(x.who, mVis('shared')) + bub(`<span class="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[.12em] uppercase c-amber">${ic('git-compare-arrows', 'w-3.5 h-3.5')}Version ${x.ver} replaces version ${x.ver - 1}</span><div class="mt-1 text-ink font-semibold">${esc(x.title)}</div><ul class="mt-1.5 space-y-1">${x.what.map(s => `<li class="flex gap-2 text-[13px]"><span class="c-amber mt-[3px] shrink-0">${ic('dot', 'w-3.5 h-3.5')}</span>${esc(s)}</li>`).join('')}</ul>${t.next ? `<button onclick="mSeeUpdate('${t.id}')" class="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[12.5px] font-bold inline-flex items-center gap-1.5">Show version ${x.ver}${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : `<div class="mt-2 text-[12px] text-ink3">You are viewing version ${t.ver || 1}.</div>`}`, 'bg-amber-500/5 border border-amber-500/40'));
  if (x.kind === 'minor') return `<div class="flex items-center gap-2 text-[12px] text-ink3"><span class="w-6 h-6 rounded-full bg-sunk border border-line flex items-center justify-center shrink-0 c-cx">${ic('refresh-cw', 'w-3 h-3')}</span><span class="min-w-0 flex-1 leading-snug"><b class="text-ink2">${esc(M_AG[x.who].name)}</b> updated the mission in place: ${esc(x.text)}</span>${when}</div>`;
  if (x.kind === 'fail') return row(x.who, head(x.who, mVis('shared')) + bub(`<span class="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[.12em] uppercase c-rose">${ic('undo-2', 'w-3.5 h-3.5')}Came back</span><div class="mt-1">${esc(x.text)}</div>`, 'bg-rose-500/5 border border-rose-500/40'));
  if (x.kind === 'outcome') return row(x.who, head(x.who, mVis('shared')) + bub(`<span class="inline-flex items-center gap-1.5 text-[11px] font-black tracking-[.12em] uppercase c-cx">${ic('circle-check', 'w-3.5 h-3.5')}Closed</span><div class="mt-1">${esc(x.text)}</div>`, 'bg-cx/5 border border-cx/30'));
  if (x.kind === 'decision') { const k = Object.keys(M_PPL).find(p => M_PPL[p].name.replace(/\.$/, '') === String(x.by || '').replace(/\.$/, '')) || 'me';
    return `<div class="rounded-xl border px-3.5 py-2.5 ${x.tone === 'cx' ? 'border-cx/40 bg-cx/10' : 'border-line bg-sunk'}"><div class="flex items-center gap-2 text-[13px] text-ink flex-wrap">${mHu(k, 22)}<span><b>${k === 'me' ? 'You' : esc(M_PPL[k].name)}</b> ${esc(x.text)}</span><span class="ml-auto flex items-center gap-2">${mVis('shared')}${when}</span></div>${x.more ? `<p class="text-[12.5px] text-ink2 mt-1.5 leading-relaxed">${esc(x.more)}</p>` : ''}</div>`; }
  /* messages */
  if (x.vis === 'private') {
    if (x.kind === 'q') return `<div class="flex justify-end"><div class="max-w-[86%]"><div class="flex items-center justify-end gap-2 mb-1">${mVis('private')}${when}</div><div class="m-priv rounded-2xl rounded-br-md px-3.5 py-2.5 text-ink text-[13.5px]">${esc(x.text)}</div></div></div>`;
    return row(x.who, head(x.who, mVis('private')) + `<div class="mt-1 m-priv rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[13.5px] text-ink2 leading-relaxed">${md(x.text)}</div>
      <div class="mt-1.5 flex items-center gap-3 text-[12px]">${x.shared ? `<span class="text-ink3 inline-flex items-center gap-1">${ic('check', 'w-3.5 h-3.5 c-cx')}Shared with the mission</span>` : `<button data-share="${x.id}" onclick="mShare('${t.id}','${x.id}')" class="font-semibold c-indigo hover:underline inline-flex items-center gap-1">${ic('share-2', 'w-3.5 h-3.5')}Share with the mission</button>`}<button onclick="mForget('${t.id}','${x.id}')" class="text-ink3 hover:text-ink inline-flex items-center gap-1">${ic('trash-2', 'w-3.5 h-3.5')}Delete</button></div>`);
  }
  const tag = x.auto ? `<span class="text-[11px] c-amber font-semibold inline-flex items-center gap-1">${ic('megaphone', 'w-3 h-3')}Posted to everyone: it changes the mission</span>` : x.kind === 'shared-a' ? `<span class="text-[11px] text-ink3">shared an answer from the ${esc(M_AG[x.from].name)}</span>` : '';
  if (x.kind === 'shared-a') return row(x.who, head(x.who, mVis('shared') + tag) + bub(`<div class="text-[12.5px] text-ink3 border-l-2 border-line2 pl-2.5">${esc(x.q)}</div><div class="mt-2">${md(x.text)}</div>`));
  return row(x.who, head(x.who, mVis('shared') + tag) + bub(M_PPL[x.who] ? esc(x.text) : md(x.text)));
}
function mThreadHtml(t) {
  const all = mThreadItems(t), mine = all.filter(x => x.vis === 'private').length, list = M.asTeam ? all.filter(x => x.vis !== 'private') : all;
  const typing = M.typing && M.typing.key === t.id ? `<div class="flex gap-2.5">${mAv(t.agent, 26)}<div class="${M.typing.vis === 'private' ? 'm-priv' : 'bg-card border border-line'} rounded-2xl rounded-tl-md px-3.5 py-3"><span class="inline-flex gap-1 items-center h-4"><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.2s"></span><span class="w-1.5 h-1.5 rounded-full bg-ink3 animate-pulse" style="animation-delay:.4s"></span></span></div></div>` : '';
  return `<div class="space-y-3.5" id="m-thread">
    <div class="flex items-center justify-between gap-3 flex-wrap"><div class="text-[11px] font-black tracking-[.14em] text-ink3 uppercase">Mission conversation</div><div class="text-[11.5px] text-ink3 inline-flex items-center gap-2">${ic('users', 'w-3.5 h-3.5')}Shared with everyone in ${t.id}${mine && !M.asTeam ? `<span class="c-indigo inline-flex items-center gap-1">· ${ic('lock', 'w-3 h-3')}${mine} only you</span>` : ''}</div></div>
    ${M.asTeam ? `<div class="rounded-xl tn tn-indigo px-3.5 py-2 text-[12.5px] flex items-center gap-2">${ic('eye', 'w-3.5 h-3.5 shrink-0')}<span class="flex-1">This is exactly what everyone else in the mission sees.${mine ? ` Your ${mine} private message${mine === 1 ? ' is' : 's are'} hidden.` : ''}</span><button onclick="M.asTeam=false;mPanelRender();icons()" class="font-bold hover:underline">Back to my view</button></div>` : ''}
    ${list.map(x => mThreadItem(t, x)).join('')}${typing}</div>`;
}
function mThreadEnd(tid) { if (M.panelTask === tid) setTimeout(mPanelBottom, 30); }
/* An answer the person chose to share. From then on it is part of the mission record. */
function mShare(tid, nid) {
  const t = mTask(tid), a = (t.notes || []).find(n => n.id === nid); if (!a || a.shared) return;
  a.shared = true; mNote(tid, { who: 'me', vis: 'shared', kind: 'shared-a', from: a.who, q: a.q, text: a.text });
  toast('Shared with everyone in ' + tid, 'share-2'); mPanelRender(); icons(); mThreadEnd(tid);
}
function mForget(tid, nid) { const t = mTask(tid), a = (t.notes || []).find(n => n.id === nid); if (!a) return; t.notes = t.notes.filter(n => n !== a && !(n.kind === 'q' && n.pair === nid)); mPanelRender(); icons(); }

/* ---------- what is private and what is shared, in one place ---------- */
function mLegend() {
  const li = (icon, cls, xs) => xs.map(x => `<li class="flex gap-2 text-[12.5px] text-ink2 leading-snug"><span class="${cls} mt-0.5 shrink-0">${ic(icon, 'w-3.5 h-3.5')}</span>${x}</li>`).join('');
  return `<div id="m-legend" class="rounded-2xl border border-line2 bg-panel shadow-2xl p-4 space-y-3">
    <div class="flex items-center justify-between"><div class="text-[13.5px] font-bold text-ink">What is private, what is shared</div><button onclick="M.legend=false;mPanelRender();icons()" class="p-1 rounded-lg hover:bg-hov text-ink3">${ic('x', 'w-4 h-4')}</button></div>
    <div class="grid sm:grid-cols-2 gap-3">
      <div class="m-priv rounded-xl p-3"><div class="text-[11px] font-black tracking-[.12em] uppercase c-indigo flex items-center gap-1.5">${ic('lock', 'w-3.5 h-3.5')}Only you</div><ul class="mt-2 space-y-1.5">${li('check', 'c-indigo', ['A question you ask the agent', 'The answer the agent gives you', 'That you asked at all: others see nothing'])}</ul></div>
      <div class="rounded-xl p-3 bg-card border border-line"><div class="text-[11px] font-black tracking-[.12em] uppercase text-ink2 flex items-center gap-1.5">${ic('users', 'w-3.5 h-3.5')}Everyone in the mission</div><ul class="mt-2 space-y-1.5">${li('check', 'c-cx', ['What the agents did and found', 'Handoffs between agents', 'Every version of the proposal', 'Decisions: who, and which version', 'A comment you post to Everyone', 'An answer you chose to share'])}</ul></div>
    </div>
    <ul class="space-y-1.5">${li('megaphone', 'c-amber', ['<span><b class="text-ink">Always shared, even if typed as private:</b> anything that changes the mission. Approve, decline, edit, or an instruction such as “also check…”. The panel says so when it posts.</span>']) + li('info', 'text-ink3', ['<span>A shared message stays on the record. A private one can be deleted. <span class="text-ink3">Open for the PRD: are private questions kept in the audit log?</span></span>'])}</ul></div>`;
}
function mSayBar(t) {
  const priv = M.say === 'private', n = mPeople(t).length;
  const b = (k, icon, label, on, cls) => `<button data-say="${k}" onclick="M.say='${k}';M.asTeam=false;mPanelRender();icons();$('m-cmd').focus()" class="px-2.5 py-1 rounded-lg text-[12px] font-bold inline-flex items-center gap-1.5 border ${on ? cls : 'border-transparent text-ink3 hover:text-ink'}">${ic(icon, 'w-3.5 h-3.5')}${label}</button>`;
  return `${M.legend ? `<div class="mb-2">${mLegend()}</div>` : ''}<div class="flex items-center gap-1.5 flex-wrap"><span class="text-[11.5px] text-ink3 mr-0.5">Send to</span>${b('private', 'lock', 'Only you', priv, 'm-priv c-indigo')}${b('shared', 'users', `Everyone in ${t.id} (${n})`, !priv, 'tn tn-amber')}
    <button data-act="legend" onclick="M.legend=!M.legend;mPanelRender();icons()" class="ml-auto inline-flex items-center gap-1 text-[11.5px] text-ink3 hover:text-ink" title="What is private, what is shared">${ic('circle-help', 'w-3.5 h-3.5')}What is shared?</button></div>`;
}

/* ---------- the prompt bar ---------- */
const M_CHANGES = /^(also|add|include|re-?run|run again|check again|re-?check|extend|look at|look for|test)\b/i;
function mSend(q) {
  const el = $('m-cmd'); q = (q || el.value || '').trim(); if (!q) return; el.value = '';
  const t = M.panelTask && mTask(M.panelTask), o = !t && M.panelObj;
  if (t) return mSendMission(t, q);
  const key = o ? o.kind + ':' + o.id : M.chatKey;
  const a = o && o.kind === 'tech' && /review/i.test(q) ? { text: 'Checked. The data this technique needs is already ingested, and no built-in or Marketplace content covers it. A correlation rule can be written for it. Say **open a mission** and the Detection Engineer will draft one and test it silently before it asks you.' } : mAnswer(q);
  if (!(M.chats[key] || []).length && key === '_') M.chatMeta = { title: a.task ? mTask(a.task).title : q.replace(/\?$/, ''), task: a.task || null, t: Date.now() };
  (M.chats[key] = M.chats[key] || []).push({ role: 'user', text: q });
  M.typing = { key }; mPanelRender(); icons(); mPanelBottom();
  mLater(650, () => { M.typing = null; M.chats[key].push({ role: 'agent', text: a.text, task: a.task }); mPanelRender(); icons(); mPanelBottom(); });
}
function mSendMission(t, q) {
  const a = mTaskAnswer(t, q), change = !a.act && M_CHANGES.test(q) && t.status !== 'done';
  M.asTeam = false;
  /* A comment for the people in the mission. The agent does not answer it. */
  if (M.say === 'shared' && !a.act && !change) { mNote(t.id, { who: 'me', vis: 'shared', kind: 'msg', text: q }); mPanelRender(); icons(); return mPanelBottom(); }
  /* Anything that changes the mission is shared, whatever the composer says. */
  if (a.act || change) {
    mNote(t.id, { who: 'me', vis: 'shared', kind: 'msg', text: q, auto: M.say === 'private' });
    M.typing = { key: t.id, vis: 'shared' }; mPanelRender(); icons(); mPanelBottom();
    return mLater(650, () => { M.typing = null;
      if (a.act) return mDecide(t.id, a.act);
      mNote(t.id, { who: t.agent, vis: 'shared', kind: 'msg', text: M_UPD[t.id] && !t.next && (t.ver || 1) === 1 ? 'On it. I am checking the rest of the pack update. If the proposal changes I will post a **new version** here, and it will need a human again.' : 'Checked. Nothing new was found, so the proposal stays as it is.' });
      if (M_UPD[t.id]) M.timers.push(setTimeout(() => mUpdate(t.id, 'material'), 2600));
      mPanelRender(); icons(); mPanelBottom(); });
  }
  /* A question: private, and so is the answer. */
  const qn = mNote(t.id, { who: 'me', vis: 'private', kind: 'q', text: q });
  M.typing = { key: t.id, vis: 'private' }; mPanelRender(); icons(); mPanelBottom();
  mLater(650, () => { M.typing = null; const an = mNote(t.id, { who: t.agent, vis: 'private', kind: 'a', q, text: a.text }); qn.pair = an.id; mPanelRender(); icons(); mPanelBottom(); });
}

/* ======================================================================
   THE QUEUE: moving between missions
   ====================================================================== */
const mMine = t => String(t.by || '').replace(/\.$/, '') === mMe();
const mReason = t => t.cameBack ? 'Came back: a step failed' : `${t.impact} impact · ${myAge(Date.now() - t.opened)} waiting`;
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
  const tone = t.cameBack ? 'bg-rose-500' : t.status === 'pending' ? (t.waitOn ? 'bg-indigo-400' : 'bg-amber-500') : t.status === 'progress' ? 'bg-blue-500 animate-pulse' : 'bg-cx';
  const oth = Object.entries(M.presence[t.id] || {}).filter(([, v]) => v === 'viewing').map(([k]) => k);
  return `<button data-q="${t.id}" onclick="mOpenTask('${t.id}')" class="w-full text-left px-3 py-2 rounded-xl flex items-start gap-2.5 ${sel ? 'bg-hov ring-1 ring-line2' : 'hover:bg-hov/70'}">
    <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${tone}"></span>
    <span class="min-w-0 flex-1"><span class="block text-[13px] ${t.unread ? 'text-ink font-bold' : 'text-ink'} leading-snug line-clamp-2">${esc(t.title)}</span>
      <span class="block text-[11.5px] text-ink3 mt-0.5 truncate"><span class="font-mono">${t.id}</span> · <span class="${t.cameBack ? 'c-rose font-semibold' : ''}">${esc(t.status === 'pending' && !t.waitOn ? mReason(t) : t.waitOn ? 'waits on ' + t.waitOn : mLife(t))}</span></span></span>
    <span class="flex flex-col items-end gap-1 shrink-0">${t.unread ? `<span class="px-1.5 py-0.5 rounded-md tn tn-amber text-[10.5px] font-bold">Updated</span>` : ''}${oth.length && t.status === 'pending' ? `<span class="inline-flex" title="${esc(M_PPL[oth[0]].name)} is reviewing now">${mHu(oth[0], 18, true)}</span>` : ''}</span></button>`;
}
function mRailHtml() {
  const q = mQueue(), cur = M.panelTask, sec = (title, n, body, tip) => body ? `<div><div class="px-3 pt-3 pb-1 flex items-center justify-between text-[11px] font-black tracking-[.12em] uppercase text-ink3"><span class="inline-flex items-center gap-1.5">${title}${tip ? ' ' + mInfo(tip) : ''}</span><span class="font-mono ml-2">${n}</span></div><div class="px-1.5 space-y-0.5">${body}</div></div>` : '';
  const priv = M.W.tasks.filter(t => (t.notes || []).some(n => n.vis === 'private'));
  const chat = (id, title, task, on, lock) => `<button onclick="${id ? `mOpenChat('${id}')` : `mOpenTask('${task}')`}" class="w-full text-left px-3 py-1.5 rounded-xl flex items-center gap-2 ${on ? 'bg-hov ring-1 ring-line2' : 'hover:bg-hov/70'}"><span class="${lock ? 'c-indigo' : 'text-ink4'} shrink-0">${ic(lock ? 'lock' : 'message-square', 'w-3.5 h-3.5')}</span><span class="min-w-0 flex-1 text-[13px] text-ink2 truncate">${esc(title)}</span>${task ? `<span class="font-mono text-[10.5px] px-1.5 py-0.5 rounded-md border border-line2 text-ink3 shrink-0">${task}</span>` : ''}</button>`;
  const live = (M.chats._ || []).length && M.chatMeta ? chat('_', M.chatMeta.title, M.chatMeta.task, !cur && !M.panelObj && M.chatKey === '_') : '';
  return `<div class="p-3 shrink-0 space-y-2 border-b border-line">
      <button data-act="newchat" onclick="mNewChat()" class="w-full px-3 py-2 rounded-xl border border-line2 text-[13px] font-semibold text-ink hover:bg-hov inline-flex items-center gap-2">${ic('message-square-plus', 'w-4 h-4 c-cx')}New chat</button>
      <button onclick="mSwOpen()" class="w-full px-3 py-2 rounded-xl bg-sunk border border-line text-[12.5px] text-ink3 hover:text-ink inline-flex items-center gap-2">${ic('search', 'w-3.5 h-3.5')}<span class="flex-1 text-left">Find a mission</span><span class="font-mono text-[10.5px] px-1.5 py-0.5 rounded-md border border-line2">Ctrl K</span></button></div>
    <div class="flex-1 overflow-y-auto pb-3">
      ${sec('Needs a human', q.need.length, q.need.map(t => mQRow(t, t.id === cur)).join(''), 'Ordered by impact, then by how long the mission has waited. Use J and K, or the arrows, to move through it.') || `<div class="px-4 pt-4 text-[12.5px] text-ink3">Nothing needs a human right now.</div>`}
      ${sec('In progress · approved by you', q.mine.length, q.mine.map(t => mQRow(t, t.id === cur)).join(''), 'You approved these. They return to the list above only if a step fails or a new decision is needed.')}
      ${sec('Waits on another mission', q.wait.length, q.wait.map(t => mQRow(t, t.id === cur)).join(''))}
      ${sec('Your chats', priv.length + M.hist.length + (live ? 1 : 0), live + priv.map(t => chat(null, 'Your questions in this mission', t.id, false, true)).join('') + M.hist.map(h => chat(h.id, h.title, h.task, !cur && !M.panelObj && M.chatKey === h.id)).join(''), 'Private to you. A chat that was about a mission carries its tag. Missions themselves are not listed here: they are in the queue above and on the Missions screen.')}
    </div>
    <button onclick="mClosePanel()" class="shrink-0 px-4 py-2.5 border-t border-line text-[12.5px] text-ink3 hover:text-ink inline-flex items-center gap-2">${ic('layout-dashboard', 'w-3.5 h-3.5')}Back to the Missions screen<span class="ml-auto font-mono text-[10.5px]">Esc</span></button>`;
}
function mNewChat() {
  if ((M.chats._ || []).length) { const id = 'c' + Date.now(); M.hist.unshift(Object.assign({ id }, M.chatMeta || { title: 'Chat', t: Date.now() })); M.chats[id] = M.chats._; M.chats._ = []; M.chatMeta = null; }
  M.chatKey = '_'; mPanelHome(); const el = $('m-cmd'); if (el) el.focus();
}
function mOpenChat(id) { M.chatKey = id; M.panelOpen = true; mPanelHome(); mPanelBottom(); }

/* ---------- the quick switcher: Ctrl K or S ---------- */
function mSwList() {
  const q = (M.sw.q || '').trim().toLowerCase(), Q = mQueue(), done = M.W.tasks.filter(t => t.status === 'done' && !Q.mine.includes(t)).sort((a, b) => (b.closed || 0) - (a.closed || 0));
  const groups = [['Needs a human', Q.need], ['In progress · approved by you', Q.mine], ['Waits on another mission', Q.wait], ['In progress', Q.run], ['Done', q ? done : done.slice(0, 3)]];
  return groups.map(([g, ts]) => [g, ts.filter(t => !q || [t.id, t.title, t.sug, M_AG[t.agent].name].join(' ').toLowerCase().includes(q))]).filter(([, ts]) => ts.length);
}
function mSwOpen() { M.sw = { q: '', i: 0 }; mSwRender(); const el = $('m-sw-q'); if (el) el.focus(); }
function mSwClose() { M.sw = null; mSwRender(); }
function mSwGo(id) { mSwClose(); mOpenTask(id); }
function mSwKey(e) {
  const flat = mSwList().flatMap(([, ts]) => ts);
  if (e.key === 'Escape') { e.preventDefault(); return mSwClose(); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); M.sw.i = (M.sw.i + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % Math.max(1, flat.length); return mSwRender(true); }
  if (e.key === 'Enter' && flat[M.sw.i]) { e.preventDefault(); return mSwGo(flat[M.sw.i].id); }
}
function mSwRender(keep) {
  const el = $('m-sw'); if (!el) return; if (!M.sw) { el.classList.add('hidden'); el.innerHTML = ''; return; }
  const groups = mSwList(); let k = -1;
  const body = groups.map(([g, ts]) => `<div class="px-4 pt-3 pb-1 text-[11px] font-black tracking-[.12em] uppercase text-ink3">${g}</div>${ts.map(t => { k++; const on = k === M.sw.i;
    return `<button data-sw="${t.id}" onclick="mSwGo('${t.id}')" class="w-full text-left px-4 py-2 flex items-center gap-3 ${on ? 'bg-hov' : 'hover:bg-hov/60'}"><span class="w-[70px] shrink-0">${mRunning(t) ? mAnalyzing() : mSug(t.sug, { solid: true })}</span><span class="min-w-0 flex-1"><span class="block text-[13.5px] text-ink truncate">${esc(t.title)}</span><span class="block text-[11.5px] text-ink3 truncate"><span class="font-mono">${t.id}</span> · ${esc(t.status === 'pending' && !t.waitOn ? mReason(t) : mLife(t))}</span></span>${t.unread ? `<span class="px-1.5 py-0.5 rounded-md tn tn-amber text-[10.5px] font-bold">Updated</span>` : ''}${mAv(t.agent, 20)}${on ? `<span class="font-mono text-[10.5px] text-ink3">Enter</span>` : ''}</button>`; }).join('')}`).join('') || `<div class="p-8 text-[13px] text-ink3 text-center">No mission matches.</div>`;
  if (keep && $('m-sw-list')) { $('m-sw-list').innerHTML = body; icons(); const on = el.querySelector('.bg-hov[data-sw]'); if (on) on.scrollIntoView({ block: 'nearest' }); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<div class="absolute inset-0 bg-black/55" onclick="mSwClose()"></div><div class="absolute left-1/2 -translate-x-1/2 top-[11vh] w-[min(620px,94vw)] rounded-2xl bg-panel border border-line2 shadow-2xl overflow-hidden m-sheet-in">
    <div class="flex items-center gap-2.5 px-4 border-b border-line"><span class="text-ink3">${ic('search', 'w-4 h-4')}</span><input id="m-sw-q" type="text" autocomplete="off" placeholder="Go to a mission: ID, a word, an agent…" oninput="M.sw.q=this.value;M.sw.i=0;mSwRender(true)" class="flex-1 bg-transparent py-3.5 text-[14.5px] text-ink placeholder:text-ink4 focus:outline-none"><span class="font-mono text-[10.5px] px-1.5 py-0.5 rounded-md border border-line2 text-ink3">Esc</span></div>
    <div id="m-sw-list" class="max-h-[58vh] overflow-y-auto pb-2">${body}</div>
    <div class="px-4 py-2 border-t border-line text-[11.5px] text-ink3 flex gap-4 flex-wrap"><span><b class="font-mono text-ink2">↑ ↓</b> move</span><span><b class="font-mono text-ink2">Enter</b> open</span><span><b class="font-mono text-ink2">J K</b> next and previous mission, without this list</span></div></div>`;
  icons();
}

/* ======================================================================
   STANDING BY: the agent speaks first
   ====================================================================== */
function mFastCard(t) {
  const d = t.decision, multi = mRecs(t);
  return `<div data-fast="${t.id}" class="rounded-2xl border border-line2 bg-card p-3.5">
    <div class="flex items-center gap-2 flex-wrap">${mSug(t.sug, { solid: true })}${mConf(t.conf)}${mImpact(t.impact)}<span class="font-mono text-[11.5px] text-ink3 ml-auto">${t.id}</span></div>
    <button onclick="mOpenTask('${t.id}')" class="block text-left mt-2 text-[14.5px] font-bold text-ink leading-snug hover:underline">${esc(t.title)}</button>
    <p class="text-[13px] text-ink2 leading-relaxed mt-1">${esc(d.effect)}</p>
    <div class="mt-2.5 flex items-center gap-2 flex-wrap"><button data-fast-ok="${t.id}" onclick="mDecide('${t.id}','approve')" class="px-3.5 py-2 rounded-xl bg-ink text-panel text-[13px] font-bold inline-flex items-center gap-1.5 hover:opacity-90">${ic('check', 'w-3.5 h-3.5')}${esc(d.approve)}</button><button onclick="mDecide('${t.id}','reject')" class="px-3.5 py-2 rounded-xl tn tn-rose text-[13px] font-bold">Decline</button>
      <button onclick="mOpenTask('${t.id}')" class="ml-auto px-3 py-2 rounded-xl text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1">${multi ? `Decide each of the ${multi.length}` : 'Open the mission'}${ic('arrow-right', 'w-3.5 h-3.5')}</button></div></div>`;
}
function mStandby() {
  const W = M.W, st = myStats(W), run = W.tasks.find(mRunning), q = mQueue(), key = M.chatKey, chat = mChatHtml(key), work = mSize() === 'work';
  const label = run ? `Working on ${run.id}` : 'Standing by';
  if (chat && key === '_' && !M.chatMeta) M.chatMeta = { title: 'Decisions review', task: null, t: Date.now() };
  if (chat) { const h = M.hist.find(x => x.id === key) || M.chatMeta;
    return `<div class="space-y-4 ${work ? 'max-w-[760px] mx-auto' : ''}"><div class="flex items-center gap-3 pb-3 border-b border-line">${mAv('sec', 40, true)}<div class="min-w-0 flex-1"><div class="text-[15px] font-bold text-ink truncate">${esc(h ? h.title : 'Chat')}</div><div class="text-[12px] text-ink3 inline-flex items-center gap-1.5">${ic('lock', 'w-3 h-3 c-indigo')}Private chat with SecOps${h && h.task ? ` · about <button onclick="mOpenTask('${h.task}')" class="font-mono c-indigo hover:underline">${h.task}</button>` : ''}</div></div></div>${chat}</div>`; }
  const auto = W.tasks.filter(t => t.status === 'done' && t.end === 'auto').length, n = q.need.length, show = q.need.slice(0, work ? 3 : 2);
  const line = `**${n}** mission${n === 1 ? ' needs' : 's need'} a human. **${q.wait.length}** wait${q.wait.length === 1 ? 's' : ''} on another mission and will continue on ${q.wait.length === 1 ? 'its' : 'their'} own. **${st.progress}** ${st.progress === 1 ? 'is' : 'are'} in progress and need${st.progress === 1 ? 's' : ''} nothing from you${auto ? `, and **${auto}** closed on ${auto === 1 ? 'its' : 'their'} own` : ''}.`;
  return `<div class="${work ? 'max-w-[760px] mx-auto pt-6' : 'pt-2'} space-y-4">
    <div class="flex items-center gap-3.5">${mAv('sec', work ? 64 : 48, true)}<div><div class="text-[20px] font-black text-ink leading-tight">SecOps</div><div class="text-[13px] c-blue font-semibold flex items-center gap-1.5">${run ? `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>` : ''}${label}</div></div></div>
    <div class="rounded-2xl rounded-tl-md px-4 py-3 bg-card border border-line text-[14px] text-ink2 leading-relaxed">${md(`Here is where things stand. ${line}`)}${n ? md(`\n\nThe ${show.length === 1 ? 'first one is' : `first ${show.length} are`} below, most valuable first. You can decide from here, or open one to see the evidence and the conversation.`) : md('\n\nNothing is waiting for you.')}</div>
    ${show.map(mFastCard).join('')}
    ${n > show.length ? `<button onclick="mSwOpen()" class="text-[13px] font-semibold c-indigo hover:underline inline-flex items-center gap-1.5">Show all ${n} that need a human${ic('arrow-right', 'w-3.5 h-3.5')}</button>` : ''}</div>`;
}

/* ======================================================================
   THE PANEL
   ====================================================================== */
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
  const btn = (fn, icon, title, extra = '') => `<button ${extra} onclick="${fn}" class="w-8 h-8 rounded-lg hover:bg-hov text-ink2 hover:text-ink flex items-center justify-center shrink-0" title="${title}">${ic(icon, 'w-[18px] h-[18px]')}</button>`;
  /* the queue on the left, in the workspace only */
  const rail = $('m-ws-rail'), railOn = work && wide && !M.railOff; rail.classList.toggle('hidden', !railOn); rail.classList.toggle('flex', railOn);
  if (railOn) { const rs = rail.querySelector('.overflow-y-auto'), top = rs ? rs.scrollTop : 0; rail.innerHTML = mRailHtml(); const r2 = rail.querySelector('.overflow-y-auto'); if (r2) r2.scrollTop = top; }
  /* head: where you are, the way to the next mission, the size, close */
  const ids = t ? pend.map(x => x.id) : [], i = t ? ids.indexOf(t.id) : -1;
  const left = `${work && wide ? btn('M.railOff=!M.railOff;mPanelRender();icons()', M.railOff ? 'panel-left-open' : 'panel-left-close', M.railOff ? 'Show the queue' : 'Hide the queue') : ''}${t || o ? btn('mPanelHome()', 'arrow-left', 'Back to the conversation (Esc)') : ''}
    ${t ? `<span class="text-[14px] font-bold text-ink font-mono whitespace-nowrap">${t.id}</span>${work ? `<span class="hidden xl:inline text-[13px] text-ink2 truncate">${esc(t.title)}</span>` : ''}<span class="shrink-0">${mStatus(t)}</span>`
      : o ? `<span class="text-[13.5px] font-bold text-ink whitespace-nowrap">${o.kind === 'rule' ? 'Correlation rule ' + o.id : o.kind === 'tech' ? 'Technique ' + o.id : 'IOC rule ' + o.id}</span>`
      : `<svg viewBox="0 0 24 24" class="w-5 h-5 shrink-0"><circle cx="12" cy="12" r="9.5" fill="none" stroke="#2dd4bf" stroke-width="1.6"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#5eead4" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="#99f6e4"/></svg><span class="font-bold text-ink text-[13.5px]">AgentiX</span><span class="text-[12px] text-ink3 truncate">SecOps · ${W.tasks.some(mRunning) ? 'Working' : 'Standing by'}</span>`}`;
  const nav = t && ids.length ? `<div class="flex items-center gap-0.5 shrink-0 rounded-xl border border-line px-1"><button data-act="prev" onclick="mMove(-1)" class="w-7 h-7 rounded-lg hover:bg-hov text-ink2 flex items-center justify-center" title="Previous mission (← or K)">${ic('chevron-left', 'w-4 h-4')}</button><button data-act="switch" onclick="mSwOpen()" class="px-1.5 h-7 rounded-lg hover:bg-hov text-[12px] text-ink2 font-mono whitespace-nowrap" title="Find a mission (Ctrl K)">${i >= 0 ? `${i + 1} of ${ids.length}` : `${ids.length}`}${work ? `<span class="font-sans text-ink3"> need${ids.length === 1 ? 's' : ''} a human</span>` : ''}</button><button data-act="next" onclick="mMove(1)" class="w-7 h-7 rounded-lg hover:bg-hov text-ink2 flex items-center justify-center" title="Next mission (→ or J)">${ic('chevron-right', 'w-4 h-4')}</button></div>` : '';
  const bell = !t ? `<button data-act="bell" onclick="mReviewAll()" class="relative p-2 rounded-xl hover:bg-hov text-ink2 shrink-0" title="Missions that need a human (C)">${ic('bell', 'w-[18px] h-[18px]')}${pend.length ? `<span class="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold font-mono flex items-center justify-center">${pend.length}</span>` : ''}</button>` : '';
  head.innerHTML = `<div class="flex items-center gap-2 min-w-0">${left}</div><div class="flex items-center gap-1.5 shrink-0">${nav}${bell}${!work || !wide ? btn('mSwOpen()', 'search', 'Find a mission (Ctrl K)') : ''}${wide ? btn('mSizeToggle()', work ? 'panel-right-close' : 'maximize-2', work ? 'Shrink to a side panel (F)' : 'Open as the workspace (F)', 'data-act="size"') : ''}${btn('mClosePanel()', 'x', 'Close and go back to the screen (Esc)', 'data-act="close"')}</div>`;
  const ppl = $('m-people'); ppl.classList.toggle('hidden', !t); ppl.innerHTML = t ? mPeopleBar(t) : '';
  /* body: in the workspace the mission is on the right and its conversation on the left. In the side panel they are one column. */
  const art = $('m-art'); art.classList.toggle('hidden', !two); art.classList.toggle('flex', two);
  const card = t ? (mRunning(t) ? mWorking(t) : mCard(t)) : '';
  if (two) { $('m-art-scroll').innerHTML = card; body.innerHTML = `<div class="max-w-[720px] mx-auto">${mThreadHtml(t)}</div>`; }
  else { $('m-art-scroll').innerHTML = ''; body.innerHTML = t ? `<div class="space-y-5 ${work && wide ? 'max-w-[760px] mx-auto' : ''}">${card}<div class="pt-4 border-t border-line">${mThreadHtml(t)}</div></div>` : o ? mObjCard(o) : mStandby(); }
  /* the actions stay fixed under the mission, so a long card never hides them */
  const foot = two ? $('m-art-acts') : $('m-panel-acts'); (two ? $('m-panel-acts') : $('m-art-acts')).innerHTML = '';
  const big = 'py-3 rounded-2xl text-[14.5px] font-bold inline-flex items-center justify-center gap-2', recs = t && mRecs(t);
  if (pending && t.next) foot.innerHTML = `<div class="flex gap-2"><button data-act="see2" onclick="mSeeUpdate('${t.id}')" class="flex-[1.6] min-w-0 ${big} bg-amber-500 hover:bg-amber-400 text-slate-950">${ic('git-compare-arrows', 'w-4 h-4 shrink-0')}<span class="truncate">Review version ${(t.ver || 1) + 1} before deciding</span></button><button disabled class="flex-1 min-w-0 ${big} bg-sunk border border-line text-ink4 cursor-not-allowed" title="Approve is tied to the version on screen">${ic('lock', 'w-4 h-4 shrink-0')}<span class="truncate">Approve is locked</span></button></div>`;
  else if (pending && recs) { const open = recs.filter(r => r.state === 'proposed').length;
    foot.innerHTML = open ? `<div class="flex gap-2"><button data-act="approve" onclick="mRecAll('${t.id}','approve')" class="flex-[1.5] min-w-0 ${big} bg-ink text-panel hover:opacity-90" title="A">${ic('check-check', 'w-4 h-4 shrink-0')}<span class="truncate">${open === recs.length ? esc(t.decision.approve) : `Approve the ${open === 1 ? 'last one' : 'other ' + open}`}</span></button><button data-act="reject" onclick="mRecAll('${t.id}','decline')" class="flex-1 min-w-0 ${big} tn tn-rose" title="D">${ic('x', 'w-4 h-4 shrink-0')}${open === recs.length ? 'Decline all' : 'Decline the rest'}</button></div>`
      : `<div class="text-[13px] text-ink2 text-center py-1">A step failed. Choose <b class="text-ink">Retry</b> or <b class="text-ink">Skip</b> on it above.</div>`; }
  else if (pending && M.editing === t.id) foot.innerHTML = `<div class="flex gap-2"><button onclick="mDecide('${t.id}','edit')" class="flex-[1.6] ${big} bg-ink text-panel">${ic('check', 'w-4 h-4')}Approve my version</button><button onclick="M.editing=null;mPanelRender();icons()" class="flex-1 ${big} bg-sunk border border-line text-ink2">Cancel</button></div>`;
  else if (pending) { const d = t.decision, canEdit = t.current && t.recommended && !t.affects.instance && t.card !== 'content', pv = (t.pivots || [])[0];
    foot.innerHTML = `<div class="flex gap-2">
      <button data-act="approve" onclick="mDecide('${t.id}','approve')" class="flex-[1.5] min-w-0 ${big} bg-ink text-panel hover:opacity-90" title="A">${ic('check', 'w-4 h-4 shrink-0')}<span class="truncate">${esc(d.approve)}</span></button>
      <button data-act="reject" onclick="mDecide('${t.id}','reject')" class="flex-1 min-w-0 ${big} tn tn-rose" title="D">${ic('x', 'w-4 h-4 shrink-0')}Decline</button>
      ${canEdit ? `<button data-act="edit" onclick="M.editing='${t.id}';M.more['${t.id}:why']=false;mPanelRender();icons();const e=$('m-edit');if(e){e.scrollIntoView({block:'center'});e.focus();}" class="px-4 ${big} bg-sunk border border-line text-ink hover:border-line2" title="Edit the change before approving">${ic('pencil', 'w-4 h-4')}<span class="hidden 2xl:inline">Edit</span></button>` : ''}
      ${pv && M.view !== pv[0] ? `<button data-act="open" onclick="mPivot('${t.id}','${pv[0]}')" class="px-4 ${big} bg-sunk border border-line text-ink hover:border-line2 whitespace-nowrap" title="Open in ${esc(pv[1])}: ${esc(pv[2])}">${ic('maximize-2', 'w-4 h-4')}<span class="hidden 2xl:inline">Open in ${esc(pv[1])}</span></button>` : ''}</div>
      <div class="mt-1.5 text-[11.5px] text-ink3 text-center">The decision is recorded for <b class="text-ink2">version ${t.ver || 1}</b> and is shared with everyone in the mission.</div>`; }
  else if (t && t.status !== 'pending' && pend.length) foot.innerHTML = `<div class="flex items-center justify-between gap-3"><span class="text-[13px] text-ink2 truncate">${esc(M.lastDecision && M.lastDecision.id === t.id ? M.lastDecision.text : `${pend.length} mission${pend.length === 1 ? ' needs' : 's need'} a human.`)}</span><button data-act="next" onclick="mOpenTask('${pend[0].id}')" class="px-4 py-2.5 rounded-2xl bg-ink text-panel text-[13.5px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap">Next mission${ic('arrow-right', 'w-4 h-4')}</button></div>`;
  else if (!t && !o && !mChatHtml(M.chatKey)) foot.innerHTML = `<div class="flex flex-wrap gap-1.5 justify-center">${[['Brief me', "mSend('Brief me')"], ['Why did SentinelOne break?', "mSend('Why did SentinelOne break?')"], ['Are we covered for impossible travel?', "mSend('Are we covered for impossible travel?')"]].map(([l, f]) => `<button onclick="${f}" class="px-3 py-1.5 rounded-full border border-line2 text-[12.5px] text-ink2 hover:text-ink hover:bg-hov">${esc(l)}</button>`).join('')}</div>`;
  else foot.innerHTML = '';
  /* the composer: who the next message is for */
  $('m-foot').className = `px-4 pb-4 pt-3 shrink-0 space-y-2.5 ${work && wide ? 'w-full max-w-[760px] mx-auto' : ''}`;
  $('m-say').innerHTML = t ? mSayBar(t) : '';
  const ctx = $('m-panel-ctx'); ctx.classList.toggle('hidden', !!t); ctx.textContent = o ? (o.kind === 'rule' ? 'Rule ' : o.kind === 'tech' ? '' : 'IOC ') + o.id : 'All missions';
  $('m-cmd-box').className = `flex-1 min-w-0 flex items-center rounded-2xl transition ${!t ? 'bg-sunk border border-line focus-within:border-cx' : M.say === 'private' ? 'm-priv' : 'bg-sunk border-2 border-amber-500/60'}`;
  $('m-cmd').placeholder = !t ? 'Ask anything, or say what to check…' : M.say === 'private' ? 'Ask the agent. Only you see the question and the answer.' : `Write to everyone in ${t.id}. It stays on the record.`;
  const later = $('m-later'), showLater = !!(pending && ids.length > 1 && !two); later.classList.toggle('hidden', !showLater); later.classList.toggle('inline-flex', showLater);
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
  ['AgentiX opens with no mission', 'The panel covers the screen. The agent speaks first: where things stand, then the first missions as cards that can be approved on the spot. Left: the queue and your private chats. Close (Esc) brings the Missions screen back.',
    () => { mNav('work'); mOpenPanel(); }],
  ['A mission in the workspace', 'Left: the conversation everyone in the mission sees. Right: the mission, with Approve fixed at the bottom. Above: who is in it and who it waits on. Dana K. is reviewing it now. Click the avatars for the full list.',
    () => { mScnOpen('MSN-1012'); }],
  ['A private question', 'The question and the answer have a dashed indigo border and “Only you”. Nobody else in the mission sees them, or sees that you asked. Open “What is shared?” next to the composer for the rules.',
    () => { mScnOpen('MSN-1012'); mLater(900, () => mSend('What is the risk?')); }],
  ['Share an answer with the mission', 'You pressed “Share with the mission” on a private answer. It is now a normal message under your name that quotes the question. It stays on the record.',
    () => { mScnOpen('MSN-1012'); mLater(700, () => mSend('What is the risk?')); mLater(2400, () => { const t = mTask('MSN-1012'), a = t.notes.find(n => n.kind === 'a'); if (a) mShare(t.id, a.id); }); }],
  ['A comment for everyone', 'The composer is switched to Everyone: solid amber border. The message goes to the people in the mission. The agent does not answer a comment.',
    () => { mScnOpen('MSN-1012'); M.say = 'shared'; mRender(); mLater(1100, () => mSend('Dana, please confirm that nothing else changed in the pack update.')); }],
  ['An instruction that changes the mission', 'Typed with “Only you” selected, but posted to everyone, because it changes the work. The agent goes back to work and posts version 2. Approve is locked until you see it.',
    () => { mScnOpen('MSN-1012'); mLater(900, () => mSend('Also check other renamed fields')); }],
  ['A new version while you are viewing', 'The agent found something new. The mission on screen does NOT change: it still shows version 1, with a banner. Approve is locked. Press “Show version 2” to see what changed and to compare.',
    () => { mScnOpen('MSN-1012'); mLater(1700, () => mUpdate('MSN-1012', 'material')); }],
  ['A small update, in place', 'A re-check that changes nothing in the proposal. No new version and nothing to acknowledge: one line in the conversation and a short note on the mission.',
    () => { mScnOpen('MSN-1012'); mLater(1500, () => mUpdate('MSN-1012', 'minor')); }],
  ['Someone else decides while you look', 'Dana K. approves the mission you are reading. It locks at once and says who decided. You stay on the mission. The plan under it keeps running.',
    () => { mScnOpen('MSN-1012'); mLater(2300, () => mOther('MSN-1012', 'dana', 'approve')); }],
  ['Several recommendations in one mission', 'Three recommendations that do not depend on each other. Each has its own Approve. One is approved and moves through Applying, Verifying and Done. One is declined. One is still open.',
    () => { mScnOpen('MSN-1005'); mScnSee('[data-rec]'); mLater(1200, () => mRec('MSN-1005', 222, 'approve')); mLater(2300, () => mRec('MSN-1005', 218, 'decline')); }],
  ['A step fails and the mission comes back', 'All three were approved. Two went through. Rule 216 could not be changed, so the mission returns to “Needs a human” with Retry and Skip on that step only.',
    () => { mScnOpen('MSN-1005'); mScnSee('[data-rec]'); mLater(1100, () => { mRecs(mTask('MSN-1005')).find(r => r.id === 216).willFail = true; mRecAll('MSN-1005', 'approve'); }); }],
  ['One approval, steps in order', 'The steps depend on each other, so there is one Approve for the plan. After it: step 1 is applied, step 2 runs, then MSN-1001 checks the rules and closes on its own. Nothing has to be watched.',
    () => { mScnOpen('MSN-1012'); mLater(1600, () => mDecide('MSN-1012', 'approve')); mLater(2000, () => { const a = $('m-art-scroll'); if (a) a.scrollTo({ top: a.scrollHeight, behavior: 'smooth' }); }); }],
  ['Approve and move on', 'After Approve the next mission comes up on its own. The approved one moves to “In progress · approved by you” on the left and returns only if it needs you.',
    () => { mNav('work'); mReviewAll(); mLater(1700, () => { const t = M.panelTask && mTask(M.panelTask); if (t) mDecide(t.id, 'approve'); }); }],
  ['The quick switcher', 'Ctrl K or S. Type an ID, a word or an agent. ↑ ↓ and Enter. To step through the queue without a list: J and K, or the arrows next to the mission ID.',
    () => { mScnOpen('MSN-1012'); mLater(700, () => { mSwOpen(); }); }],
  ['The side panel on Correlation Rules', 'On a native screen the working object is in the table, so the panel takes 30% and the table stays in use. Same mission, same conversation, in one column. The expand button (F) opens the workspace.',
    () => { mNav('rules'); mOpenTask('MSN-1002'); }],
  ['What the team sees', '“View as the team” hides your private messages and shows the conversation exactly as everyone else has it.',
    () => { mScnOpen('MSN-1012'); mLater(700, () => mSend('What happens if I wait?')); mLater(2300, () => { M.asTeam = true; mPanelRender(); icons(); }); }]
];
function mScn(i) {
  i = (i + M_SCN.length) % M_SCN.length;
  closeDemoMenu(); mSheetShow(false); mInit(); mLiveStop(); M.scn = i; M.scnBar = true; mSwRender();
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
