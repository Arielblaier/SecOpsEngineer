/* ======================================================================
   LIVE KPIs
   ====================================================================== */
const SLA_MS = 15 * 60000;
function setNum(el, val, fmt = String, bump) {
  if (!el) return;
  const prev = el._v;
  el._v = val;
  if (prev === undefined || typeof val !== 'number' || typeof prev !== 'number') { el.textContent = fmt(val); return; }
  if (prev === val) return;
  cancelAnimationFrame(el._raf);
  const t0 = performance.now(), dur = 600;
  const step = now => { const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(prev + (val - prev) * e)); if (k < 1) el._raf = requestAnimationFrame(step); };
  el._raf = requestAnimationFrame(step);
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}
function flashKpi(id, text, warn) {
  const box = $(id); if (!box) return;
  box.classList.remove('kflash', 'kflash-warn'); void box.offsetWidth; box.classList.add(warn ? 'kflash-warn' : 'kflash');
  if (text) { const d = document.createElement('span'); d.className = 'delta ' + (warn ? 'c-amber' : 'c-cx'); d.textContent = text; box.appendChild(d); setTimeout(() => d.remove(), 1300); }
}
const fmtMs = ms => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };
function renderKpis() {
  if (!S || !$('kpi-auto')) return;
  updateHUD();
  // Auto-resolved
  const auto = S.stats.autoResolved;
  const aEl = $('kpi-auto').querySelector('[data-v]');
  if (aEl._v !== undefined && auto > aEl._v) flashKpi('kpi-auto', `+${auto - aEl._v}`);
  setNum(aEl, auto);
  // Human SLA, how long open decisions have been waiting on a human
  const now = Date.now();
  const waits = S.tasks.map(t => now - t.created);
  const slaEl = $('kpi-sla'), sv = slaEl.querySelector('[data-v]'), ss = slaEl.querySelector('[data-sub]');
  const nT = S.tasks.length;
  if (!nT) { sv.textContent = '—'; sv.className = 'c-cx'; ss.textContent = S.stats.decided ? `avg ${fmtMs(S.stats.decisionMs / S.stats.decided)} to decide` : 'Nothing waiting'; ss.className = 'text-[11px] text-ink4'; }
  else {
    const avg = waits.reduce((a, b) => a + b, 0) / nT;
    const within = waits.filter(w => w <= SLA_MS).length;
    const state = within === nT ? 'ok' : within >= nT / 2 ? 'warn' : 'bad';
    sv.textContent = fmtMs(avg);
    sv.className = state === 'ok' ? 'c-cx' : state === 'warn' ? 'c-amber' : 'c-rose';
    ss.textContent = `${within}/${nT} within 15m`;
    ss.className = 'text-[11px] ' + (state === 'ok' ? 'c-cx' : state === 'warn' ? 'c-amber' : 'c-rose');
    if (S._lastTasks !== undefined && nT > S._lastTasks) flashKpi('kpi-sla', `+${nT - S._lastTasks} waiting`, true);
  }
  S._lastTasks = nT;
  // Completed tasks in the last 60 minutes, with 5-minute sparkline
  const hr = now - 3600000;
  S.done = S.done.filter(d => d.t > hr);
  const nd = S.done.length, byA = S.done.filter(d => d.by === 'agent').length;
  const dEl = $('kpi-done').querySelector('[data-v]');
  if (dEl._v !== undefined && nd > dEl._v) flashKpi('kpi-done', `+${nd - dEl._v}`);
  setNum(dEl, nd);
  $('kpi-done').querySelector('[data-sub]').textContent = `agent ${byA} · you ${nd - byA}`;
  const b = Array(12).fill(0); S.done.forEach(d => { b[Math.min(11, Math.floor((d.t - hr) / 300000))]++; });
  const mx = Math.max(3, ...b);
  $('done-spark').innerHTML = b.map((v, i) => { const h = Math.max(1.5, v / mx * 17); return `<rect x="${i * 5}" y="${18 - h}" width="3.6" height="${h}" rx="1" fill="${i === 11 ? '#00c389' : 'rgb(var(--ink4))'}" opacity="${i === 11 ? 1 : .55}"/>`; }).join('');
  // Agent MTTR, mean agent time on cases it resolved itself
  const res = S.cases.filter(c => c.verdict === 'Benign' || c.verdict === 'Malicious' || c.verdict === 'Inconclusive' || c.verdict === 'Contained');
  const mttr = res.length ? Math.round(res.reduce((a, c) => a + c.dur, 0) / res.length) : 0;
  const mEl = $('kpi-mttr').querySelector('[data-v]');
  setNum(mEl, mttr, v => fmtDur(v));
  $('q-live').className = 'w-1.5 h-1.5 rounded-full ' + (S.running ? 'bg-cx animate-pulse' : 'bg-amber-500');
}
setInterval(() => { if (S && S.view === 'autonomous') renderKpis(); }, 1000);
