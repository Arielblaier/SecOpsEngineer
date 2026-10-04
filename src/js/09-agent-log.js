/* ======================================================================
   AGENT LOG, light, grouped, batched
   ====================================================================== */
const AGENTS = {
  Endpoint: { name: 'Sentinel', role: 'Endpoint', col: '#f43f5e', icon: 'cpu' },
  Identity: { name: 'Warden', role: 'Identity', col: '#6366f1', icon: 'fingerprint' },
  Network:  { name: 'Tracer', role: 'Network', col: '#06b6d4', icon: 'network' },
  Cloud:    { name: 'Nimbus', role: 'Cloud', col: '#0ea5e9', icon: 'cloud' },
  Posture:  { name: 'Auditor', role: 'Posture', col: '#f59e0b', icon: 'clipboard-check' }
};
const agentFor = c => (c && AGENTS[c.domain]) || { name: 'Orchestrator', role: 'Queue', col: '#00c389', icon: 'sparkles' };
const KIND = {
  system: ['Info', 'slate'], xql: ['Query', 'cyan'], evidence: ['Evidence', 'purple'], decision: ['Verdict', 'indigo'],
  danger: ['Threat', 'rose'], ok: ['Resolved', 'cx'], alert: ['Needs you', 'amber'], task: ['Action', 'amber'],
  new: ['New case', 'indigo'], user: ['You', 'indigo'], warn: ['Notice', 'amber']
};

function stepToLine(c, e) {
  const clean = e.title.replace(/^Query: /, '').replace(/^Evidence: /, '');
  if (e.type === 'decision') {
    const v = e.verdict || c.verdict;
    return { kind: v === 'Malicious' ? 'danger' : v === 'Benign' ? 'ok' : 'decision', text: `${clean.replace(/^Verdict: /, '')} on ${c.host}`, sub: e.detail };
  }
  if (e.type === 'task' && /staged|Decision needed|Steering requested/.test(e.title)) return { kind: 'alert', text: `${clean.replace(/^(Action staged|Decision needed): /, '')} on ${c.host}`, sub: 'Waiting for your decision' };
  const txt = e.type === 'xql' ? `${clean.charAt(0).toUpperCase() + clean.slice(1)} on ${c.host}` : clean;
  return { kind: e.by && e.by !== 'agent' ? 'user' : e.type, text: txt, sub: e.result || (e.type === 'xql' ? '' : e.detail) };
}

let logSeq = 0, logTimer = null;
function pushLog(caseId, kind, text, sub, time) {
  const mm = /^(Josh|Maya|Tom|Avi)\b/.exec(text || ''), agent = caseId ? 'analyst' : mm ? PILLAR_KEYS.find(k => PILLARS[k].name === mm[1]) : (kind === 'system' ? null : 'analyst');
  const l = { id: uid(), seq: ++logSeq, time: time || clock(), caseId, kind, text, sub: sub || '', agent };
  S.log.push(l); if (S.log.length > 500) S.log.shift();
  if (inScope(l)) S.logUnseen++;
  scheduleLog();
  return l;
}
const inScope = l => (S.logScope === 'all' || l.caseId === S.selectedId) && (!S.logAgent || S.logAgent === 'all' || l.agent === S.logAgent);
function scheduleLog() { if (logTimer) return; logTimer = setTimeout(() => { logTimer = null; renderLog(); }, 450); }

function seedLog() {
  const lines = [];
  ['183347', '813054', '555548', '994821'].map(byId).forEach(c => getWorklog(c).forEach(e => { const l = stepToLine(c, e); lines.push({ id: uid(), time: e.time, caseId: c.id, agent: 'analyst', ...l }); }));
  lines.sort((a, b) => a.time.localeCompare(b.time));
  S.log = [{ id: uid(), time: lines[0]?.time || clock(), caseId: null, kind: 'system', text: 'Workforce on shift · 248 cases in scope', sub: 'Every containment action waits for your approval' }, ...lines];
  S.log.forEach(l => l.seq = ++logSeq);
  S.logSeen = logSeq; S.logUnseen = 0;
}

const TASK = { system: 'Update', xql: 'Querying', evidence: 'Evidence', decision: 'Verdict', danger: 'Threat confirmed', ok: 'Resolved', alert: 'Needs you', task: 'Action', new: 'New case', user: 'You', warn: 'Notice' };
function mergeLines(lines) {
  const out = [];
  lines.forEach(l => {
    const last = out[out.length - 1];
    if (l.kind === 'new' && last && last.kind === 'new') { last.ids.push(l.caseId); last.seq = l.seq; last.time = l.time; return; }
    out.push(l.kind === 'new' ? { ...l, ids: [l.caseId] } : l);
  });
  return out;
}
function lineHTML(l) {
  const fresh = l.seq > S.logSeen;
  let text = l.text, ids = l.caseId ? `<button data-case="${l.caseId}" class="font-mono text-[11px] text-ink3 hover:text-ink">#${l.caseId}</button>` : '';
  if (l.kind === 'new') {
    text = l.ids.length > 1 ? `${l.ids.length} new cases received, in progress` : `New case received: ${l.text}`;
    if (l.ids.length > 1) ids = `<span class="font-mono text-[11px] text-ink3">${l.ids.map(i => `<button data-case="${i}" class="hover:text-ink">#${i}</button>`).join(' ')}</span>`;
  }
  const tone = { alert: 'c-amber', danger: 'c-rose', ok: 'c-cx', user: 'c-indigo', warn: 'c-amber' }[l.kind] || 'text-ink3';
  const dot = { alert: 'bg-amber-500', danger: 'bg-rose-500', ok: 'bg-cx', user: 'bg-indigo-500', warn: 'bg-amber-500', xql: 'bg-cyan-500', evidence: 'bg-purple-500', decision: 'bg-indigo-500', new: 'bg-indigo-400' }[l.kind] || 'bg-slate-400';
  return `<div class="${fresh ? 'fresh' : ''} px-4 py-3 border-b border-line/60 hover:bg-hov/30">
    <div class="flex items-center gap-2 text-[11px]">
      ${l.agent ? agentAv(PILLARS[l.agent], 18, false) : `<span class="w-2 h-2 rounded-full shrink-0 ${dot}"></span>`}${l.agent ? `<span class="font-semibold text-ink2">${PILLARS[l.agent].name}</span><span class="text-ink4">·</span>` : ''}
      <span class="font-semibold ${tone}">${TASK[l.kind] || 'Update'}</span>
      <span class="font-mono text-ink4">${l.time}</span>
      <span class="ml-auto">${ids}</span>
    </div>
    <div class="mt-1 pl-4 text-[13.5px] leading-snug ${l.kind === 'alert' || l.kind === 'danger' ? 'font-semibold text-ink' : 'text-ink'} break-words">${esc(text)}</div>
    ${l.sub ? `<div class="mt-0.5 pl-4 text-[12.5px] leading-relaxed text-ink3 break-words">${esc(l.sub)}</div>` : ''}
  </div>`;
}
function logDesktopCollapsed() { return S.logCollapsed && window.innerWidth >= 1024; }

function renderLog() {
  renderLogControls(); renderStats();
  if (logDesktopCollapsed() || S.view !== 'autonomous') { renderRail(); return; }
  const box = $('console');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 140 || S.logStick;
  const lines = mergeLines(S.log.filter(inScope)).slice(-200);
  box.innerHTML = lines.length ? lines.map(lineHTML).join('') : `<div class="p-6 text-center text-[12px] text-ink3">Nothing logged for #${S.selectedId} yet.</div>`;
  S.logSeen = logSeq;
  if (near) { box.scrollTop = box.scrollHeight; S.logUnseen = 0; S.logStick = false; }
  const pill = $('log-newpill');
  pill.classList.toggle('hidden', !S.logUnseen); pill.classList.toggle('flex', !!S.logUnseen);
  $('log-newcount').textContent = `${S.logUnseen} new update${S.logUnseen === 1 ? '' : 's'}`;
  renderRail();
  icons();
}
const renderConsole = () => { S.logStick = true; renderLog(); };
function logToBottom() { S.logUnseen = 0; S.logStick = true; renderLog(); }
document.addEventListener('wheel', e => {
  const sc = $('home-scroll'); if (!sc || S.view !== 'home' || !storyResolve || S.home.paused || e.deltaY <= 0) return;
  if (sc.contains(e.target) && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 6) storyContinue();
}, { passive: true });
$('console').addEventListener('scroll', () => {
  const b = $('console');
  if (b.scrollHeight - b.scrollTop - b.clientHeight < 40 && S.logUnseen) { S.logUnseen = 0; $('log-newpill').classList.add('hidden'); $('log-newpill').classList.remove('flex'); }
});
$('console').addEventListener('click', e => {
  const cs = e.target.closest('[data-case]'); if (cs) { e.stopPropagation(); showBrief(cs.dataset.case); }
});

function renderRail() {
  const b = $('rail-badge');
  b.textContent = S.logUnseen > 99 ? '99+' : S.logUnseen;
  b.classList.toggle('hidden', !S.logUnseen || !logDesktopCollapsed());
  $('rail-now').textContent = S.promptText || '';
  document.querySelectorAll('.rail-ping').forEach(x => x.style.display = S.running ? '' : 'none');
}

function toggleLog() { S.logCollapsed = !S.logCollapsed; applyLogCollapse(); }
function applyLogCollapse() {
  setTimeout(applySizes, 0);
  const c = S.logCollapsed;
  $('pane-log').classList.toggle('hidden', c); $('pane-log').classList.toggle('flex', !c);
  $('log-rail').classList.toggle('lg:flex', c);
  if (!c) { S.logStick = true; renderLog(); } else renderRail();
}

function setPrompt(text) {
  S.promptText = text;
  const el = $('prompt'); el.style.opacity = '0';
  setTimeout(() => { el.textContent = text; el.style.opacity = '1'; }, 150);
  renderRail();
}

function renderLogControls() {
  const btn = (on, label, fn) => `<button onclick="${fn}" class="px-2 py-0.5 rounded-md ${on ? 'bg-panel text-ink font-semibold shadow-sm' : 'text-ink3 hover:text-ink'}">${label}</button>`;
  S.logAgent = S.logAgent || 'all';
  $('log-scope').innerHTML = btn(S.logAgent === 'all' && S.logScope === 'all', 'All', "S.logAgent='all';setScope('all')") + PILLAR_KEYS.map(k => btn(S.logAgent === k, PILLARS[k].name, `S.logAgent='${k}';setScope('all')`)).join('');
  if ($('demo-speed')) $('demo-speed').innerHTML = [[5500, 'Slow'], [3000, 'Normal'], [1200, 'Fast']].map(([ms, l]) => `<button onclick="setSpeed(${ms})" class="flex-1 py-1 rounded-md ${S.speed === ms ? 'bg-panel text-ink font-semibold shadow-sm' : 'text-ink3 hover:text-ink'}">${l}</button>`).join('');
  $('btn-pause').innerHTML = ic(S.running ? 'pause' : 'play', 'w-3.5 h-3.5');
  $('live-label').textContent = S.running ? 'Live' : 'Paused';
  $('live-label').className = 'text-[11px] ' + (S.running ? 'c-cx' : 'c-amber');
  $('live-ping').style.display = S.running ? '' : 'none';
  $('live-dot').style.background = S.running ? '#00c389' : '#f59e0b';
  icons();
}
function setScope(s) { S.logScope = s; S.logUnseen = 0; renderConsole(); }

function renderStats() {
  const el = $('log-agents'); if (!el) return;
  el.innerHTML = PILLAR_KEYS.map(k => { const P = PILLARS[k], st = pillarStats(k), n = S.log.filter(l => l.agent === k).length;
    return `<button onclick="S.logAgent=S.logAgent==='${k}'?'all':'${k}';setScope('all')" class="py-2 flex flex-col items-center gap-0.5 ${S.logAgent === k ? 'bg-hov' : 'hover:bg-hov/50'}">${agentAv(P, 22, false)}<span class="text-[11px] font-semibold text-ink2">${P.name}</span><span class="text-[10.5px] text-ink3">${st.prog} active</span></button>`; }).join('');
}
