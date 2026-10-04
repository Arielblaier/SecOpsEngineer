/* ======================================================================
   COPILOT, JARVIS ENTITY
   ====================================================================== */
function setEntity(mode) {
  const e = $('entity');
  const alert = Date.now() < S.entityAlertUntil;
  const m = mode || (S.thinking ? 'thinking' : alert ? 'alert' : document.activeElement === $('cmd') ? 'listening' : '');
  const bc = S.briefId && byId(S.briefId), bi = S.briefItem && itemById(S.briefItem);
  let st = 'st-cortex';
  if (m === 'thinking') st = 'st-cortex';
  if (m === 'alert') st = 'st-pending';
  e.classList.remove('thinking', 'alert', 'listening', 'st-pending', 'st-progress', 'st-resolved', 'st-cortex');
  e.classList.add(st); if (m) e.classList.add(m);
  e.classList.toggle('small', S.chat.length > 0 || !!S.briefId || !!S.briefItem);
  const label = { thinking: 'Thinking…', alert: 'New decision needs you', listening: 'Listening' }[m] || (S.chat.length || S.briefId ? 'Ready' : 'Standing by');
  $('ent-label').textContent = label;
  $('cp-mode').textContent = m === 'thinking' ? 'Working' : m === 'listening' ? 'Listening' : 'Standing by';
  $('ent-voice').classList.toggle('hidden', m !== 'thinking');
  $('ent-sub').classList.toggle('hidden', m === 'thinking');
}
function alertEntity() {
  S.entityAlertUntil = Date.now() + 2600;
  setEntity();
  const b = $('cp-bell'); b.classList.remove('bell-ring'); void b.offsetWidth; b.classList.add('bell-ring');
  setTimeout(() => setEntity(), 2700);
}
function focusCommand() { const b = $('entity-btn'); b.classList.add('tap'); setTimeout(() => b.classList.remove('tap'), 250); $('cmd').focus(); }

function renderCopilot() {
  const n = S.tasks.length, c = sel();
  $('cp-bell-badge').textContent = n;
  $('cp-bell-badge').classList.toggle('hidden', n === 0);
  const running = S.cases.filter(x => x.verdict === 'Running').length;
  { const P = PILLARS[S.pillar || 'analyst'], ps = pillarStats(S.pillar || 'analyst'); $('ent-sub').textContent = `${P.name} is working on ${ps.prog} ${P.noun}${n ? '' : ' · nothing needs you'}`; }
  const cta = $('cp-cta');
  cta.classList.toggle('hidden', !n); cta.classList.toggle('flex', !!n);
  const ctaTxt = `Review ${n} decision${n === 1 ? '' : 's'}`;
  if (cta.dataset.t !== ctaTxt) { cta.innerHTML = `${ic('bell-ring', 'w-4 h-4')}<span>${ctaTxt}</span>${ic('arrow-right', 'w-4 h-4')}`; cta.dataset.t = ctaTxt; icons(); }
  $('ctx-chip').textContent = '#' + c.id;
  const hasChat = S.chat.length > 0 || !!S.briefId || !!S.briefItem;
  $('stage').className = `flex flex-col items-center justify-center transition-all duration-500 px-6 ${hasChat ? 'pt-2 pb-1 shrink-0' : 'flex-1'}`;
  $('cp-scroll').classList.toggle('hidden', !hasChat);
  renderBrief();
  const sug = S.briefId || S.briefItem ? [] : hasChat ? [] : [n ? 'Brief me' : 'Queue status', c.verdict === 'Running' ? `What are you checking on #${c.id}?` : `Why is #${c.id} ${VERD[c.verdict].label.toLowerCase()}?`, 'What is the blast radius?'];
  $('suggestions').innerHTML = sug.map(s => `<button data-sug="${esc(s)}" class="px-2.5 py-1 text-[11px] rounded-full border border-line text-ink3 hover:text-ink hover:border-cx">${esc(s)}</button>`).join('');
  setEntity();
}
$('suggestions').addEventListener('click', e => { const b = e.target.closest('[data-sug]'); if (b) sendCmd(b.dataset.sug); });

function renderTranscript() {
  let html = S.chat.map(m => m.role === 'user'
    ? `<div class="flex justify-end fade-up"><div class="max-w-[85%] text-[13px] text-ink2 bg-sunk rounded-2xl rounded-br-md px-3.5 py-2">${esc(m.text)}${m.ctx ? `<div class="text-[11px] font-mono text-ink4 mt-0.5">#${m.ctx}</div>` : ''}</div></div>`
    : `<div class="fade-up flex gap-2.5"><span class="w-5 h-5 mt-0.5 rounded-full shrink-0 agent-av"></span><div class="text-[13px] text-ink2 leading-relaxed min-w-0">${md(m.text)}${m.actions ? `<div class="flex flex-wrap gap-1.5 mt-2">${m.actions.map(a => `<button onclick="${a.fn}" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold ${a.primary ? 'bg-ink text-panel' : 'bg-sunk border border-line text-ink2 hover:border-cx'}">${esc(a.label)}</button>`).join('')}</div>` : ''}</div></div>`).join('');
  $('transcript').innerHTML = html;
  $('cp-scroll').scrollTop = $('cp-scroll').scrollHeight;
}

function submitCmd() { const i = $('cmd'); const v = i.value.trim(); if (!v) return; i.value = ''; sendCmd(v); }

function sendCmd(text) {
  if (window.innerWidth < 1024) mobileTab('copilot');
  const c = sel();
  S.chat.push({ role: 'user', text, ctx: c.id });
  S.thinking = true;
  renderCopilot(); renderTranscript();
  setTimeout(() => {
    S.thinking = false;
    const r = respond(c, text);
    const msg = typeof r === 'string' ? { text: r } : r;
    S.chat.push({ role: 'agent', ...msg });
    renderCopilot(); renderTranscript(); refresh();
  }, 700 + rint(500));
}

function respond(c, text) {
  const l = text.toLowerCase(), t = T[c.threat], wl = getWorklog(c);
  if (/another way|alternativ|other option/.test(l)) return `Here are softer options for **${c.host}**:\n1. **Block only the malicious traffic** at the firewall and keep the host online, with stricter alerting.\n2. **Contain after the user’s session ends**, within 2 hours, with the account locked meanwhile.\n3. **Monitor for 24 hours** with full capture. I don’t recommend this one: the attacker keeps access.`;
  if (/catch (me )?up|pending|decisions|what needs me/.test(l)) {
    if (!S.tasks.length) return 'Nothing needs you right now. I\'ll ping the bell when something does.';
    setTimeout(() => openCatchup(), 500);
    return `You have **${S.tasks.length}** decisions waiting. Opening them now.`;
  }
  if (/queue status|status|overview|what('s| is) happening/.test(l) && !/#/.test(l)) {
    const n = { pending: 0, in_progress: 0, resolved: 0 }; S.cases.forEach(x => n[lifecycle(x)]++);
    const cur = byId(S.agentId);
    return { text: `**${S.cases.length}** cases in scope.\n• ${n.in_progress} under investigation${cur ? `, I'm on **#${cur.id}** (${cur.host})` : ''}\n• ${n.pending} need attention, **${S.tasks.length}** waiting for your decision\n• ${n.resolved} resolved, ${S.stats.autoResolved} of them without a human`,
      actions: S.tasks.length ? [{ label: 'Review decisions', fn: 'openCatchup()', primary: true }] : null };
  }
  if (/^pause|stop the agent/.test(l)) { if (S.running) toggleSimulation(); return 'Paused. I\'ll hold all running investigations until you say resume.'; }
  if (/^resume|^start|continue/.test(l)) { if (!S.running) toggleSimulation(); return 'Resumed. Back on the queue.'; }
  if (/prioriti|rerun|re-?investigat|reopen/.test(l)) {
    if (c.verdict === 'Running') { S.agentId = c.id; ensurePlan(c); if (!S.running) toggleSimulation(); pushLog(c.id, 'user', 'Prioritized by Guy R.', 'Agent switched to this case'); return `On it. Switched to **#${c.id}**, ${c.plan.length} steps left. Follow along in agent.log.`; }
    reopenCase(c); if (!S.running) toggleSimulation();
    return `Reopened **#${c.id}** and moved it to the front of my queue. Any staged action was withdrawn.`;
  }
  if (/benign|false positive|authorized|qa runner|expected|mark.*safe/.test(l) && !/why|what/.test(l)) {
    if (lifecycle(c) === 'resolved') return `**#${c.id}** is already resolved.`;
    steerBenign(c, text);
    return `Understood. **#${c.id}** closed as benign, and I saved the rule so matching activity on **${c.host}** resolves on its own.`;
  }
  if (/isolat|contain|quarantin|stage|block|revoke|suspend/.test(l)) {
    const tk = S.tasks.find(x => x.id === c.task);
    if (tk) return { text: `**${tk.title}** is already staged for **${c.host}**.`, actions: [{ label: 'Approve', fn: `authorizeTask('${tk.id}')`, primary: true }, { label: 'Review the decision', fn: `openCatchup('${tk.id}')` }] };
    if (lifecycle(c) === 'resolved') return `**#${c.id}** is resolved, nothing to contain. Say "reopen" if you disagree.`;
    if (c.verdict === 'Running') return `No verdict yet on **#${c.id}**. I'll stage the right action when I finish, or tell me to prioritize it.`;
    stageAction(c); alertEntity();
    const tk2 = S.tasks.find(x => x.id === c.task);
    return { text: `Staged **${t.action}** for **${c.host}** via \`${t.playbook}\`. It won't run until you approve.`, actions: [{ label: 'Approve now', fn: `authorizeTask('${tk2.id}')`, primary: true }] };
  }
  if (/blast|radius|impact|lateral|spread|related/.test(l)) {
    const rel = S.cases.filter(x => x.threat === c.threat && x.id !== c.id && lifecycle(x) !== 'resolved');
    return `Blast radius for **${c.host}**:\n• 1 directly affected asset\n• ${rel.length} other open cases share the **${t.name.toLowerCase()}** pattern${rel.length ? ` (#${rel.slice(0, 3).map(x => x.id).join(', #')})` : ''}\n• ${c.verdict === 'Malicious' ? 'Lateral indicators present, containment recommended.' : 'No lateral movement observed.'}`;
  }
  if (/why|reason|verdict|explain|safe|malicious|inconclusive|resolved|contained/.test(l)) {
    const ev = wl.filter(e => e.by === 'agent' && (e.result || e.type === 'evidence')).slice(-3);
    if (c.verdict === 'Running') return `No verdict yet on **#${c.id}**. So far:\n${ev.map(e => '• ' + (e.result || e.detail)).join('\n') || '• Still gathering telemetry.'}`;
    return `**${VERD[c.verdict].label}**${c.conf ? ` with ${confLevel(c.conf).toLowerCase()} confidence` : ''} on **#${c.id}**, based on:\n${ev.map(e => '• ' + (e.result || e.detail)).join('\n')}\n\n${c.summary}`;
  }
  if (/query|xql|telemetry|checking|looking at/.test(l)) {
    const q = [...wl].reverse().find(e => e.query);
    return q ? `Latest query on **#${c.id}** (${q.time}):\n\`${q.query}\`\n**Result:** ${q.result}` : `No queries have run on **#${c.id}** yet.`;
  }
  if (/summar|tl;?dr|so far/.test(l)) return `**#${c.id}**, ${c.name}\n${c.summary}\n${wl.length} audit entries · ${fmtDur(c.dur)} agent time.`;
  if (/open question|remain|missing|unknown|what do you need/.test(l)) return `For **#${c.id}** I need to know:\n• Is **${c.host}** an approved automation host?\n• Was this activity expected in the current change window?\nAnswer either and I'll finalize.`;
  addWl(c, { type: 'system', title: 'Analyst steering note', detail: text });
  pushLog(c.id, 'user', `Steering note: ${text}`, 'Applied on next evaluation');
  return `Noted for **#${c.id}** and logged. I'll apply it on the next evaluation of ${c.host}.`;
}
