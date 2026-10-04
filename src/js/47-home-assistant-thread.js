/* ======================================================================
   HOME, the assistant, as one continuous thread
   ====================================================================== */
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
let storyResolve = null;
function storyContinue(all) {
  if (all) S.home.skipAll = true;
  S.home.paused = false; S.home.scrollNext = true;
  if (!storyResolve) return;
  const r = storyResolve; storyResolve = null;
  S.home.msgs = S.home.msgs.filter(x => x.type !== 'continue');
  r();
}
function pauseStory() {
  if (!S.home.playing || S.home.paused) return;
  S.home.paused = true;
  S.home.msgs = S.home.msgs.filter(x => x.type !== 'continue');
}
function homeInit() {
  S.home.playing = false; S.home.paused = false;
  S.home.msgs = ['top', 'news', 'observe', 'needs'].map(t => ({ role: 'agent', type: t, sec: true }));
  S.home.msgs.push({ role: 'agent', type: 'text', text: 'Everything else is handled. Where would you like to start?' });
}
let homeObs = null;
function revealWrap(wrap) {
  const m = S.home.msgs[+wrap.dataset.mi]; if (m) m.revealed = true;
  wrap.classList.add('in');
  wrap.querySelectorAll('.rv').forEach(el => setTimeout(() => el.classList.add('in'), +(el.dataset.d || 0)));
  wrap.querySelectorAll('.wfg').forEach(g => setTimeout(() => g.classList.add('go'), 150));
  wrap.querySelectorAll('[data-count]').forEach(el => {
    const card = el.closest('.rv'), delay = +(el.dataset.delay || (card ? +(card.dataset.d || 0) + 250 : 250)), to = +el.dataset.count;
    el.textContent = '0';
    setTimeout(() => { const t0 = performance.now(); const stp = now => { const k = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(stp); }; requestAnimationFrame(stp); }, delay);
  });
}
const HOME_CHIPS = ['What needs me?', 'Tell me more about FIN7', 'How is my environment doing?', 'Show my team', 'View my workforce'];
function pillarBadge(p) { const P = PILLARS[p]; return `<span class="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style="background:${P.col}1f;color:${P.col}">${agentAv(P, 18, false)}${P.name}</span>`; }
function homeMsgHTML(m) {
  if (m.sec) return homeSection(m);
  if (m.role === 'user') return `<div class="flex justify-end"><div class="max-w-[80%] rounded-2xl rounded-br-md bg-ink text-panel px-4 py-2.5 text-[14px]">${esc(m.text)}</div></div>`;
  if (m.type === 'typing') return `<div class="flex gap-3"><span class="w-7 h-7 agent-av shrink-0"></span><div class="typing pt-2"><span></span><span></span><span></span></div></div>`;
  const wrap = inner => `<div class="flex gap-3"><span class="w-7 h-7 agent-av shrink-0 mt-0.5"></span><div class="min-w-0 flex-1 space-y-3">${inner}</div></div>`;
  if (m.type === 'continue') return `<div class="-mt-16 pt-16 pb-2 flex justify-center pointer-events-none" style="background:linear-gradient(to bottom, transparent, rgb(var(--bg)) 75%)">
      <button onclick="storyContinue()" class="pointer-events-auto group flex flex-col items-center gap-0.5 text-ink3 hover:text-ink transition">
        <span class="text-[12.5px]">${esc(m.label)}</span>
        <span class="animate-bounce">${ic('chevrons-down', 'w-4 h-4')}</span>
      </button>
    </div>`;
  if (m.type === 'catchup') return wrap(homeCatchupHTML(m));
  if (m.type === 'detail') return wrap(`<div class="text-[14.5px] text-ink2 leading-relaxed">${md(m.text)}</div><div class="rounded-2xl border border-line bg-panel overflow-hidden">${inlineDetail(m.kind, m.id, true, m._fresh)}</div>`);
  if (m.type === 'text') return wrap(`<div class="text-[14.5px] text-ink2 leading-relaxed">${md(m.text)}</div>${m.btn ? `<button onclick="${m.btn[1]}" class="px-4 py-2.5 rounded-xl bg-ink text-panel text-[13px] font-semibold inline-flex items-center gap-1.5">${m.btn[0]} ${ic('arrow-right', 'w-4 h-4')}</button>` : ''}`);
  if (m.type === 'greet') {
    const done = PILLAR_KEYS.reduce((a, k) => a + pillarStats(k).done, 0), need = S.tasks.length;
    const parts = [[SINGLE ? 'Here’s your briefing. While you were away, Josh completed ' : 'Here’s your briefing. While you were away, Josh, Maya, Tom and Avi completed ', ''], [`${done} tasks`, 'font-bold text-ink'], ['. I’ll walk you through what happened, what’s in the news for Bank US, how the environment looks, and then the ', ''], [`${need} decision${need === 1 ? '' : 's'}`, 'font-bold c-amber'], [' that need you.', '']];
    let k = 0;
    const words = parts.map(([t, cls]) => t.split(/(\s+)/).filter(Boolean).map(w => m._fresh ? `<span class="w ${cls}" style="animation-delay:${(k++) * 45}ms">${esc(w)}</span>` : `<span class="${cls}">${esc(w)}</span>`).join('')).join('');
    return wrap(`<div class="text-[17px] text-ink2 leading-relaxed">${words}</div>
      <div class="flex flex-wrap gap-2">${PILLAR_KEYS.map((k, i) => { const P = PILLARS[k], st = pillarStats(k); return `<button onclick="homeSend('Tell me about ${P.name}')" class="rv inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-line bg-panel hover:border-cx" data-d="${1600 + i * 150}">${agentAv(P, 26)}<span class="text-[12px] text-ink2"><b class="text-ink">${P.name}</b> <span class="text-ink3">${P.title}</span> · <span data-count="${st.done}">${m._fresh ? 0 : st.done}</span> done</span></button>`; }).join('')}</div>`);
  }
  if (m.type === 'team') return wrap(`<div class="rv text-[15px] font-semibold text-ink" data-d="0">${ic('orbit', 'w-4 h-4 inline -mt-0.5 mr-1 c-brand')}How your workforce worked together</div>
      <div class="rv" data-d="150">${workforceGraphHTML()}</div>
      <p class="rv text-[14.5px] text-ink2 leading-relaxed" data-d="2600">Josh handled <b class="text-ink">150 investigations</b> and asked Maya to tune <b class="text-ink">16 noisy rules</b>. Maya went further and shipped <b class="text-ink">20 new detections and automations</b>. Tom ran <b class="text-ink">50 hunts</b>: 10 became rules for Maya and 2 became cases for Josh. Avi researched <b class="text-ink">4 new threat groups</b>, which sent <b class="text-ink">15 older cases</b> back to Josh for re-investigation.</p>`);
  if (m.type === 'top') {
    const ev = topEvents(), sevC = { Critical: 'bg-rose-500', High: 'bg-amber-500', Medium: 'bg-blue-500', Info: 'bg-cx' };
    return wrap(`<div class="rv text-[15px] font-semibold text-ink" data-d="0">${ic('activity', 'w-4 h-4 inline -mt-0.5 mr-1 c-brand')}What happened in your environment</div>
      <div class="rounded-2xl border border-line bg-panel overflow-hidden divide-y divide-line">${ev.map((e, i) => `<button onclick="${e.kind === 'nav' ? `goWorkforce('${e.id}')` : `openCanvas('${e.kind}','${e.id}')`}" class="rv w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-hov/50" data-d="${200 + i * 260}">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 ${sevC[e.sev]}"></span>
        <span class="min-w-0 flex-1"><span class="block text-[14px] font-semibold text-ink leading-snug">${esc(e.t)}</span><span class="block text-[12.5px] text-ink3 mt-0.5">${esc(e.sub)}</span></span>
        <span class="hidden sm:inline">${pillarBadge(e.p)}</span>${ic((S.home.open || {})[e.kind + ':' + e.id] ? 'chevron-up' : 'chevron-down', 'w-4 h-4 text-ink3 shrink-0')}</button>${e.kind === 'nav' ? '' : inlineDetail(e.kind, e.id)}`).join('')}</div>`);
  }
  if (m.type === 'news') {
    return wrap(`<div class="rv text-[15px] font-semibold text-ink" data-d="0">${ic('newspaper', 'w-4 h-4 inline -mt-0.5 mr-1 c-brand')}In the news, and what it means for you</div>
      <div class="grid gap-3">${NEWS.map((n, i) => { const it = itemByTitle(n.item); return `<div class="rv rounded-2xl border border-line bg-panel p-4" data-d="${250 + i * 500}">
        <div class="flex items-center gap-2 flex-wrap text-[11.5px]"><span class="text-ink3">${n.src}</span><span class="tn tn-${n.tn} px-1.5 py-0.5 rounded-md font-semibold">${n.tag}</span></div>
        <div class="text-[15.5px] font-bold text-ink leading-snug mt-1.5">${esc(n.head)}</div>
        <div class="mt-2.5 flex gap-2.5 rounded-xl bg-sunk p-3"><span class="w-1 rounded-full shrink-0" style="background:${n.status === 'Needs you' ? '#f59e0b' : n.status === 'In hand' ? '#3b82f6' : '#94a3b8'}"></span>
          <div class="min-w-0"><div class="text-[11px] font-bold text-ink3 tracking-wide">WHAT IT MEANS FOR BANK US</div><div class="text-[13.5px] text-ink2 leading-relaxed mt-0.5">${esc(n.impact)}</div></div></div>
        <div class="flex items-center justify-between mt-3"><span class="text-[12px] font-semibold ${n.status === 'Needs you' ? 'c-amber' : n.status === 'In hand' ? 'c-blue' : 'text-ink3'}">${n.status}</span>
          ${it ? `<button onclick="openCanvas('item','${it.id}')" class="text-[12.5px] font-semibold c-brand inline-flex items-center gap-1">${(S.home.open || {})['item:' + it.id] ? 'Hide the analysis' : 'See the analysis'} ${ic((S.home.open || {})['item:' + it.id] ? 'chevron-up' : 'chevron-down', 'w-3.5 h-3.5')}</button>` : ''}</div>
        ${it ? `<div class="-mx-4 -mb-4 mt-3 rounded-b-2xl overflow-hidden">${inlineDetail('item', it.id)}</div>` : ''}
      </div>`; }).join('')}</div>`);
  }
  if (m.type === 'observe') {
    const o = envObservations(), mx = Math.max(...o.spark), mn = Math.min(...o.spark);
    return wrap(`<div class="rv text-[15px] font-semibold text-ink" data-d="0">${ic('scan-eye', 'w-4 h-4 inline -mt-0.5 mr-1 c-brand')}How your environment looks</div>
      <div class="rv rounded-2xl border border-line bg-panel p-4" data-d="200">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">${o.tiles.map(([l, v, sub, c]) => `<div class="rounded-xl bg-sunk p-3"><div class="text-[11px] text-ink3">${l}</div><div class="text-[22px] font-black font-mono ${c} leading-tight mt-0.5">${v}</div><div class="text-[11px] text-ink3">${sub}</div></div>`).join('')}</div>
        <div class="mt-4 flex items-end gap-1.5 h-12">${o.spark.map((v, i) => `<div class="flex-1 rounded-t-md ${i === o.spark.length - 1 ? 'bg-cx' : 'bg-line2'}" style="height:${20 + (v - mn) / Math.max(1, mx - mn) * 80}%" title="${v} issues"></div>`).join('')}</div>
        <div class="flex justify-between text-[11px] text-ink3 mt-1"><span>7 days ago</span><span>Issues per day</span><span>Today</span></div>
      </div>
      <ul class="space-y-2">${o.notes.map((t, i) => `<li class="rv flex gap-2.5 text-[14px] text-ink2 leading-relaxed" data-d="${700 + i * 350}"><span class="c-brand mt-1">${ic('sparkle', 'w-3.5 h-3.5')}</span>${esc(t)}</li>`).join('')}</ul>`);
  }
  if (m.type === 'pillars') return wrap(`<div class="text-[14.5px] text-ink2 rv" data-d="0">Here’s your team and how each of them spent that time:</div><div class="grid sm:grid-cols-2 gap-3">${PILLAR_KEYS.map((k, pi) => {
    const P = PILLARS[k], st = pillarStats(k), hl = pillarHighlights(k);
    return `<div class="rv sheen rounded-2xl border border-line bg-panel p-4 flex flex-col hover:shadow-md transition" data-d="${250 + pi * 420}" style="box-shadow: inset 0 3px 0 ${P.col}">
      <div class="flex items-center gap-2.5">
        ${agentAv(P, 40)}
        <div class="min-w-0"><div class="text-[15px] font-bold text-ink">${P.name} <span class="font-normal text-ink3 text-[13px]">· ${P.title}</span></div><div class="text-[11.5px] text-ink3">${P.role}</div></div>
      </div>
      <div class="flex items-end gap-4 mt-3">
        <div><div class="text-[28px] font-black font-mono text-ink leading-none" data-count="${st.done}">${m._fresh ? 0 : st.done}</div><div class="text-[11px] text-ink3 mt-1">done</div></div>
        <div class="text-[12px] text-ink2 pb-0.5"><span class="c-blue font-semibold">${st.prog}</span> in progress${st.need ? ` · <span class="c-amber font-semibold">${st.need}</span> need you` : ''}</div>
      </div>
      <ul class="mt-3 space-y-1.5 flex-1">${hl.map(h => `<li class="text-[12.5px] text-ink2 leading-snug flex gap-1.5"><span style="color:${P.col}">•</span><span class="clamp2">${esc(h)}</span></li>`).join('')}</ul>
      <div class="flex items-center gap-2 mt-3 pt-3 border-t border-line">
        <button onclick="homeSend('Tell me about ${P.name}')" class="text-[12px] font-semibold text-ink2 hover:text-ink">Ask ${P.name}</button>
        <button onclick="goWorkforce('${k}')" class="ml-auto text-[12px] font-semibold inline-flex items-center gap-1" style="color:${P.col}">Open queue ${ic('arrow-right', 'w-3.5 h-3.5')}</button>
      </div>
    </div>`; }).join('')}</div>`);
  if (m.type === 'needs') {
    const L = S.tasks.slice(0, 5);
    if (!L.length) return wrap(`<div class="text-[14.5px] text-ink2">Nothing is waiting for you. I'll tell you the moment something is.</div>`);
    return wrap(`<div class="rv text-[15px] font-semibold text-ink" data-d="0">${ic('bell-ring', 'w-4 h-4 inline -mt-0.5 mr-1 c-amber')}Decisions that need you</div>
      <div class="rv rounded-2xl border border-amber-500/40 bg-amber-500/5 divide-y divide-amber-500/20 overflow-hidden" data-d="200">${L.map(t => {
        const p = t.pillar || 'analyst', c = t.caseId && byId(t.caseId), it = t.itemId && itemById(t.itemId);
        return `<button onclick="openCanvas('${t.caseId ? 'case' : 'item'}','${t.caseId || t.itemId}')" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-amber-500/10">
          ${pillarBadge(p)}<span class="min-w-0 flex-1"><span class="block text-[13.5px] font-semibold text-ink truncate">${esc(t.title)}</span><span class="block text-[12px] text-ink3 truncate">${esc(c ? c.name : it ? it.title : t.target)}</span></span>
          <span class="shrink-0 text-[12px] font-mono ${Date.now() - t.created > SLA_MS ? 'c-rose' : 'text-ink3'}">${fmtMs(Date.now() - t.created)}</span></button>${inlineDetail(t.caseId ? 'case' : 'item', t.caseId || t.itemId)}`; }).join('')}</div>
      <div class="rv flex gap-2 flex-wrap" data-d="700"><button onclick="startHomeCatchup()" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13px] font-bold inline-flex items-center gap-1.5">${ic('bell-ring', 'w-4 h-4')}Review decisions</button>
      ${S.tasks.length > 5 ? `<span class="text-[12px] text-ink3 self-center">+${S.tasks.length - 5} more</span>` : ''}</div>`);
  }
  if (m.type === 'pillar') {
    const P = PILLARS[m.p], st = pillarStats(m.p);
    let rows;
    if (m.p === 'analyst') rows = S.cases.filter(c => c.task || verdictOf(c) === 'Malicious' || c.verdict === 'Contained').slice(0, 6).map(c => ({ kind: 'case', id: c.id, title: c.name, sub: c.task ? 'Needs your decision' : c.verdict === 'Contained' ? 'Contained' : 'Confirmed threat', st: lifecycle(c) }));
    else rows = (S.items[m.p] || []).slice().sort((a, b) => ({ pending: 0, in_progress: 1, resolved: 2 })[a.status] - ({ pending: 0, in_progress: 1, resolved: 2 })[b.status] || b.updated - a.updated).slice(0, 6)
      .map(it => ({ kind: 'item', id: it.id, title: it.title, sub: it.status === 'pending' ? it.ask : it.status === 'resolved' ? (it.done || it.result) : it.result, st: it.status }));
    const intro = m.p === 'analyst' ? `${P.name} (${P.title}) handled ${st.done} cases on his own and is working ${st.prog} more. Here's what's worth your attention:`
      : `${P.name} (${P.title}) finished ${st.done} ${P.noun}, is working on ${st.prog}${st.need ? `, and needs you on ${st.need}` : ''}. The latest:`;
    return wrap(`<div class="text-[14.5px] text-ink2 leading-relaxed">${esc(intro)}</div>
      <div class="rounded-2xl border border-line bg-panel divide-y divide-line overflow-hidden">${rows.map(r => `<button onclick="openCanvas('${r.kind}','${r.id}')" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-hov/50">
        <span class="w-2 h-2 rounded-full shrink-0 ${r.st === 'pending' ? 'bg-amber-500' : r.st === 'in_progress' ? 'bg-blue-500' : 'bg-cx'}"></span>
        <span class="min-w-0 flex-1"><span class="block text-[13.5px] font-medium text-ink truncate">${esc(r.title)}</span><span class="block text-[12px] text-ink3 truncate">${esc(r.sub)}</span></span>${ic((S.home.open || {})[r.kind + ':' + r.id] ? 'chevron-up' : 'chevron-down', 'w-4 h-4 text-ink3 shrink-0')}</button>${inlineDetail(r.kind, r.id)}`).join('')}</div>
      <button onclick="goWorkforce('${m.p}')" class="text-[13px] font-semibold inline-flex items-center gap-1" style="color:${P.col}">Open ${P.name}’s queue ${ic('arrow-right', 'w-4 h-4')}</button>`);
  }
  return '';
}
function renderHome(anim, fromStory) {
  setHomeHeight();
  if (!S.home.msgs.length) homeInit();
  if (anim === true) renderHero(!S.home.heroDone); S.home.heroDone = true;
  { const ae = document.activeElement; if (!fromStory && anim !== true && ae && ae.tagName === 'INPUT' && $('home-thread').contains(ae)) return; }
  $('home-hello').textContent = `${greeting()}, Guy`;
  const box = $('home-thread'), sc = $('home-scroll');
  S.home.msgs.forEach(m => { m._fresh = !m.revealed; if (m.type === 'catchup' && !m.closed && m.revealed) m._fresh = false; });
  const html = S.home.msgs.map((m, i) => { let h = homeMsgHTML(m); if (!m._fresh) h = h.replace(/\b(rv|sheen)\b/g, ''); return `<div data-mi="${i}" class="${m._fresh ? 'rv' : ''}" data-d="0">${h}</div>`; }).join('');
  if (html !== S._homeHtml) {
    box.innerHTML = html; S._homeHtml = html;
    if (homeObs) homeObs.disconnect();
    homeObs = window.IntersectionObserver ? new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { homeObs.unobserve(en.target); revealWrap(en.target); } }), { root: sc, threshold: .12 }) : null;
    box.querySelectorAll('[data-mi]').forEach(wrap => {
      const m = S.home.msgs[+wrap.dataset.mi];
      if (!m || !m._fresh) { wrap.querySelectorAll('.rv').forEach(x => x.classList.add('in')); wrap.querySelectorAll('.wfg').forEach(g => g.classList.add('go', 'now')); return; }
      if (homeObs) homeObs.observe(wrap); else revealWrap(wrap);
    });
  }
  if (anim === true && S.home.msgs.every(m => !m.revealed || m.type !== 'text')) sc.scrollTop = 0;
  else if (fromStory) setTimeout(() => {
    const last = box.lastElementChild, lm = S.home.msgs[S.home.msgs.length - 1]; if (!last || !lm) return;
    if (lm.role === 'user' || lm.type === 'typing') { if (last.scrollIntoView) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    const top = sc.scrollTop + last.getBoundingClientRect().top - sc.getBoundingClientRect().top - 24;
    if (sc.scrollTo) sc.scrollTo({ top, behavior: 'smooth' }); else sc.scrollTop = top;
  }, 80);
  S._chipWhere = null; renderHomeChips();
  const orb = document.querySelector('[data-jv="home"]');
  if (orb) { orb.classList.remove('st-pending', 'st-progress', 'st-resolved'); orb.classList.add('st-cortex'); }
  renderCanvas();
  icons();
}
function homeInsertAt() {
  // answer right where the reader is: after the section in view (and any Q&A already attached to it)
  const sc = $('home-scroll'), M = S.home.msgs;
  if (!sc || sc.scrollTop < $('home-hero').offsetHeight * .55) { let k = 0; while (k < M.length && !M[k].sec) k++; return k; }
  const mid = sc.getBoundingClientRect().top + sc.clientHeight * .5;
  let at = -1;
  document.querySelectorAll('#home-thread [data-mi]').forEach(w => { const m = M[+w.dataset.mi]; if (m && m.sec && w.getBoundingClientRect().top < mid) at = +w.dataset.mi; });
  if (at < 0) return 0;
  let k = at + 1; while (k < M.length && !M[k].sec) k++;
  return k;
}
function homeShow(idx, block) {
  setTimeout(() => { const w = document.querySelector(`#home-thread [data-mi="${idx}"]`); if (w && w.scrollIntoView) w.scrollIntoView({ block: block || 'nearest', behavior: 'smooth' }); }, 60);
}
function homeSend(text) {
  const inp = $('home-input'); const q = (text || inp.value).trim(); if (!q) return; inp.value = '';
  if (S.home.playing) pauseStory();
  const at = homeInsertAt();
  const userMsg = { role: 'user', text: q }, typing = { role: 'agent', type: 'typing' };
  S.home.msgs.splice(at, 0, userMsg, typing);
  S._homeHtml = null; renderHome(false, false); homeShow(at + 1, 'nearest');
  setTimeout(() => {
    const ti = S.home.msgs.indexOf(typing);
    const reply = homeRespond(q);
    if (ti >= 0) S.home.msgs.splice(ti, 1, ...reply); else S.home.msgs.push(...reply);
    S._homeHtml = null; renderHome(false, false);
    const li = S.home.msgs.indexOf(reply[reply.length - 1]); if (li >= 0) homeShow(li, 'nearest');
  }, 650 + rint(400));
}
function homeRespond(q) {
  const l = q.toLowerCase();
  const tk0 = S.tasks[S.home.deckIdx || 0];
  if (/why did avi|reopen/.test(l)) return [{ role: 'agent', type: 'text', text: 'Avi researched 4 new threat groups overnight. Their indicators matched **15 older cases** that had been closed as benign, so Josh is re-checking them: 9 tied to the FIN7 help-desk campaign, 4 to BlackSuit tooling and 2 to the Citrix CVE. 3 have been confirmed malicious so far.' }];
  if (/what did tom find/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'hunter' }];
  if (/svc_legacy/.test(l)) { const it = itemByTitle('dormant admin'); return it ? [{ role: 'agent', type: 'detail', kind: 'item', id: it.id, text: '**svc_legacy** is a service account nobody has used since 2023. At 03:12 it signed in to three payment servers from an unmanaged laptop. Tom recommends disabling it and opening a case:' }] : []; }
  if (/benign cases josh closed|benign/.test(l)) return [{ role: 'agent', type: 'detail', kind: 'closed', id: 'auto', text: `Josh closed **${S.stats.autoResolved} cases** as benign. Here are the latest, each with its reason:` }];
  if (/citrix|exposed/.test(l)) return [{ role: 'agent', type: 'text', text: 'Yes, partly. **3 of your 5 NetScaler appliances** run the vulnerable version and face the internet. Avi opened patch tickets with the network team, and Maya added a detection for the known exploit pattern while they patch.' }];
  if (/blacksuit/.test(l)) return [{ role: 'agent', type: 'text', text: 'BlackSuit is a ransomware group that recently started going after **VMware ESXi** hosts directly, encrypting whole virtual machines at once. You have 4 ESXi hosts that match. Tom hunted for their tools and found nothing so far; Avi is watching for new indicators.' }];
  if (/alert volume|issue volume/.test(l)) return [{ role: 'agent', type: 'text', text: 'Issue volume is **down 18% this week**. Most of it is Maya’s tuning of 16 noisy rules that Josh flagged; the biggest was "Suspicious PowerShell download", which alone removed 412 false-positive issues a week. No real detections were lost in the replay tests.' }];
  if (/riskiest assets/.test(l)) { const o = envObservations(); return [{ role: 'agent', type: 'text', text: o.notes[1] + ' Each has an open critical investigation, and SOC-Tech is one hop away from the payments file server.' }]; }
  if (/slowest/.test(l)) return [{ role: 'agent', type: 'text', text: 'The slowest step is human approval. The agents reach a verdict in about **2 minutes**, but decisions wait longer for you. The deck below has them one at a time.' }];
  if (/why this decision|show me the evidence|tell me more/.test(l) && tk0) { const A = apvData(tk0); return [{ role: 'agent', type: 'text', text: `${A.statement}
${A.signals.map((x, i) => `${i + 1}. **${x.t}.** ${x.d}`).join('\n')}` }]; }
  if (/if i wait/.test(l) && tk0) return [{ role: 'agent', type: 'text', text: tk0.caseId ? `Every minute ${byId(tk0.caseId).host} stays connected, the attacker keeps their foothold and can move toward ${blastModel(byId(tk0.caseId)).ring2.map(r => r.k.toLowerCase()).join(', ')}. Nothing breaks if you wait a few minutes, but the risk grows.` : itemAnswer(itemById(tk0.itemId), 'what happens if I wait') }];
  if (/news|fin7|campaign|headline|cve|citrix|blacksuit/.test(l)) { const it = itemByTitle('Campaign: FIN7'); if (/fin7/.test(l) && it) return [{ role: 'agent', type: 'detail', kind: 'item', id: it.id, text: `FIN7 is calling bank help desks while pretending to be IT support, then talking staff into installing remote-access tools. **Two of its domains were already contacted from inside Bank US.** Here's Avi's analysis:` }]; return [{ role: 'agent', type: 'news' }]; }
  if (/environment|how.*doing|health|observ|posture/.test(l)) return [{ role: 'agent', type: 'observe' }];
  if (/my team|four teams|pillars|show.*team|everyone/.test(l)) return [{ role: 'agent', type: 'pillars' }];
  if (/\bjosh\b/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'analyst' }];
  if (/\bmaya\b/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'engineer' }];
  if (/\btom\b/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'hunter' }];
  if (/\bavi\b/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'intel' }];
  if (/what happened|top things|top events/.test(l)) return [{ role: 'agent', type: 'top' }];
  if (/workforce|queue|autonomous|board|agents working/.test(l)) { setTimeout(() => goWorkforce(), 900); return [{ role: 'agent', type: 'text', text: 'Taking you to your workforce, all four queues are live there.' }]; }
  if (/catch|decision/.test(l)) { setTimeout(startHomeCatchup, 50); return [{ role: 'agent', type: 'text', text: 'Your decisions are in the deck below the briefing. Flip through them one at a time.' }]; }
  if (/need|decision|approve|waiting/.test(l)) return [{ role: 'agent', type: 'needs' }];
  if (/hunt/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'hunter' }];
  if (/intel|campaign|indicator|ioc|leak/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'intel' }];
  if (/engineer|detection|rule|playbook|ingest|tuning|changed/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'engineer' }];
  if (/case|incident|analyst|triage|investigat|respon|threat(?!.*(hunt|intel))/.test(l)) return [{ role: 'agent', type: 'pillar', p: 'analyst' }];
  if (/summar|overnight|what happened|status|recap|everything/.test(l)) return [{ role: 'agent', type: 'greet' }, { role: 'agent', type: 'pillars' }];
  if (/worst|biggest|critical|urgent|risk/.test(l)) {
    const t = S.tasks.find(x => x.severity === 'Critical') || S.tasks[0];
    if (!t) return [{ role: 'agent', type: 'text', text: 'Nothing urgent right now. Everything open is being handled.' }];
    return [{ role: 'agent', type: 'text', text: `The most urgent item is **${t.title}** (${(PILLARS[t.pillar || 'analyst']).name}). It has been waiting ${fmtMs(Date.now() - t.created)}.`, btn: null }, { role: 'agent', type: 'detail', kind: t.caseId ? 'case' : 'item', id: t.caseId || t.itemId, text: 'Here it is:' }];
  }
  return [{ role: 'agent', type: 'text', text: 'I can answer that with the right team. Try asking about **what needs you**, one of the four teams, or say **view my workforce** to watch them work.' }];
}

/* canvas, the screen adjusts: the thread slides left, detail opens on the right */
function openCanvas(kind, id) {
  pauseStory();
  const key = kind + ':' + id; S.home.open = S.home.open || {};
  if (S.home.open[key]) delete S.home.open[key]; else { S.home.open[key] = true; S.home.just = key; }
  S._homeHtml = null; renderHome(false);
  setTimeout(() => { const el = document.querySelector(`[data-xp="${key}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); S.home.just = null; }, 60);
}
function closeCanvas() { S.home.open = {}; S._homeHtml = null; renderHome(false); }
function inlineDetail(kind, id, force, anim) {
  const key = kind + ':' + id;
  if (!force && !(S.home.open || {})[key]) return '';
  const body = detailBody(kind, id); if (!body) return '';
  return `<div data-xp="${key}" class="${S.home.just === key || anim ? 'xp-in' : ''} border-t border-indigo-400/15 bg-black/20 px-5 py-4 text-left">${body}
    ${force ? '' : `<button onclick="openCanvas('${kind}','${id}')" class="mt-3 text-[12px] text-ink3 hover:text-ink inline-flex items-center gap-1">${ic('chevron-up', 'w-3.5 h-3.5')}Collapse</button>`}</div>`;
}
function decisionBox(tk, doneTxt) {
  if (!tk) return '';
  const waited = Date.now() - tk.created;
  return `<div class="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3.5 flex items-center justify-between gap-3 flex-wrap">
    <div class="min-w-0"><div class="text-[11.5px] c-amber font-semibold">Waiting for your decision · ${fmtMs(waited)}</div>
      <div class="text-[14.5px] font-semibold text-ink leading-snug mt-0.5">${esc(tk.title)}</div>
      ${doneTxt ? `<div class="text-[12px] text-ink3 mt-0.5">If you approve: ${esc(doneTxt)}</div>` : ''}</div>
    <div class="flex gap-2 shrink-0">
      <button onclick="homeDecide('${tk.id}','approve')" class="px-4 py-2 rounded-xl bg-ink text-panel hover:opacity-90 text-[13px] font-bold inline-flex items-center gap-1.5">${ic('check', 'w-4 h-4')}Approve</button>
      <button onclick="homeDecide('${tk.id}','decline')" class="px-4 py-2 rounded-xl tn tn-rose text-[13px] font-semibold">Decline</button>
    </div></div>`;
}
function askBox(kind, id) {
  const key = kind + ':' + id, qa = ((S.home.qa || {})[key]) || [];
  return `<div class="mt-4 space-y-2.5">
    ${qa.map(x => x.role === 'user' ? `<div class="flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md bg-ink text-panel px-3.5 py-2 text-[13px]">${esc(x.text)}</div></div>`
      : x.role === 'typing' ? `<div class="typing pl-1"><span></span><span></span><span></span></div>`
      : `<div class="flex gap-2.5"><span class="w-6 h-6 agent-av shrink-0"></span><div class="text-[13.5px] text-ink2 leading-relaxed">${md(x.text)}</div></div>`).join('')}
    <div class="flex items-center rounded-xl bg-panel border border-line focus-within:border-cx">
      <input id="hq-${key}" placeholder="Ask about this…" onkeydown="if(event.key==='Enter') homeAsk('${kind}','${id}')" class="flex-1 min-w-0 bg-transparent px-3 py-2 text-[13px] text-ink placeholder:text-ink3 focus:outline-none">
      <button onclick="homeAsk('${kind}','${id}')" class="mr-1 p-1.5 rounded-lg text-ink3 hover:bg-ink hover:text-panel">${ic('arrow-up', 'w-4 h-4')}</button>
    </div></div>`;
}
function detailBody(kind, id) {
  if (kind === 'closed') {
    const L = S.cases.filter(c => c.verdict === 'Benign').slice(0, 6);
    return `<div class="text-[13px] text-ink3 mb-2">The latest ones Josh closed, each with its reason:</div><div class="space-y-2">${L.map(c => `<div class="flex gap-3 rounded-xl px-3 py-2.5 bg-white/[.03] border border-indigo-400/10"><span class="mt-0.5 w-5 h-5 rounded-full border border-cx/50 bg-cx/10 c-cx flex items-center justify-center shrink-0">${ic('check', 'w-3 h-3')}</span><div class="min-w-0"><div class="text-[13.5px] font-semibold text-ink">${esc(c.name)}</div><div class="text-[12.5px] text-ink3">${esc(T[c.threat].sb)}</div></div><span class="ml-auto text-[11.5px] text-ink3 shrink-0">${confLevel(c.conf)} confidence</span></div>`).join('')}</div>${askBox(kind, id)}`;
  }
  if (kind === 'case') {
    const c = byId(id); if (!c) return '';
    const inv = investigation(c), tk = S.tasks.find(t => t.id === c.task), H = HERO[c.id];
    return `<div class="grid md:grid-cols-[1fr,220px] gap-4">
      <div class="min-w-0"><div class="text-[12px] font-semibold text-ink">What happened</div><p class="text-[13.5px] text-ink2 leading-relaxed mt-1">${esc(H ? H.story : c.summary)}</p>
        <div class="text-[12px] font-semibold text-ink mt-3">Why</div><p class="text-[13.5px] text-ink2 leading-relaxed mt-1">${esc(inv.expl)}</p></div>
      <div class="rounded-xl p-3 border-2 self-start" style="border-color:${inv.color}55;background:${inv.color}0d"><div class="text-[11px] text-ink3">Verdict · #${c.id}</div><div class="text-[20px] font-bold" style="color:${inv.color}">${inv.label}</div><div class="text-[12px] text-ink2">${confLevel(c.conf) || 'Building'} confidence · ${esc(c.host)}</div>
</div>
    </div>
    ${tk ? `<div class="mt-4">${approvalCardHTML(tk, 'case:' + c.id)}</div>` : ''}
    ${!tk && lifecycle(c) === 'resolved' ? `<div class="mt-3 text-[12.5px] c-cx font-semibold inline-flex items-center gap-1.5">${ic('circle-check', 'w-4 h-4')}${c.verdict === 'Contained' ? 'Approved by you and contained' : 'Resolved'}</div>` : ''}
    ${askBox(kind, id)}`;
  }
  const it = itemById(id); if (!it) return '';
  const P = PILLARS[it.pillar], tk = S.tasks.find(t => t.id === it.task);
  return `<p class="text-[14px] text-ink2 leading-relaxed">${esc(it.status === 'resolved' && it.done ? it.done + '. ' + it.result : it.result)}</p>
    <div class="grid md:grid-cols-2 gap-4 mt-3">
      <div><div class="text-[12px] font-semibold text-ink flex items-center gap-2">${agentAv(P, 20, false)}What ${P.name} did</div>
        <ol class="mt-2 space-y-2">${it.steps.map((x, i) => `<li class="flex gap-2.5 text-[13px] text-ink2"><span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style="background:${P.col}">${i + 1}</span>${esc(x)}</li>`).join('')}</ol></div>
      <div>${it.viz ? itemVizHTML(it) : ''}</div>
    </div>
    ${tk ? `<div class="mt-4">${approvalCardHTML(tk, 'item:' + it.id)}</div>` : ''}
    ${!tk && it.approved ? `<div class="mt-3 text-[12.5px] c-cx font-semibold inline-flex items-center gap-1.5">${ic('circle-check', 'w-4 h-4')}Approved by you. ${esc(it.done || '')}</div>` : ''}
    ${!tk && it.declined ? `<div class="mt-3 text-[12.5px] text-ink3 font-semibold">Declined by you. No change made.</div>` : ''}
    ${askBox(kind, id)}`;
}
function homeDecide(taskId, kind) {
  pauseStory();
  const tk = S.tasks.find(t => t.id === taskId); if (!tk) return;
  if (kind === 'approve') authorizeTask(taskId, true); else declineTask(taskId, true);
  toast(kind === 'approve' ? `Approved: ${tk.title}` : `Declined: ${tk.title}`, kind === 'approve' ? 'check' : 'x');
  S._homeHtml = null; renderHome(false);
}
function homeAsk(kind, id) {
  pauseStory();
  const key = kind + ':' + id, inp = document.getElementById('hq-' + key); const q = inp && inp.value.trim(); if (!q) return;
  S.home.qa = S.home.qa || {}; const qa = S.home.qa[key] = S.home.qa[key] || [];
  qa.push({ role: 'user', text: q }, { role: 'typing' });
  S._homeHtml = null; document.activeElement && document.activeElement.blur(); renderHome(false);
  setTimeout(() => {
    qa.splice(qa.findIndex(x => x.role === 'typing'), 1);
    let a;
    if (kind === 'closed') a = `All of them were closed because the evidence matched a known, approved pattern. Ask me about any one by name and I’ll show its full reasoning.`;
    else if (kind === 'case') { const r = respond(byId(id), q); a = typeof r === 'string' ? r : r.text; }
    else a = itemAnswer(itemById(id), q);
    qa.push({ role: 'agent', text: a });
    S._homeHtml = null; renderHome(false);
    setTimeout(() => { const el = document.getElementById('hq-' + key); if (el) el.focus(); }, 30);
  }, 650 + rint(350));
}

