/* ======================================================================
   SECOPS ENGINEERING · HOME
   The morning briefing: the chain from data to detection, the one finding
   worth reading first, what the agents did alone, and what waits for a person.
   ====================================================================== */
function mStageStats(W) {
  /* Counted over the pipelines that at least one enabled rule reads. A source nobody depends on is not a detection problem. */
  const used = W.pipes.filter(p => W.rules.some(r => r.pipe === p.id && r.status === 'Enabled'));
  const filters = used.filter(p => p.filter), models = used.filter(p => p.model), st = myStats(W);
  return {
    source: [used.filter(p => mPipeInst(W, p).status === 'ok').length, used.length, 'sources that rules need are connected'],
    filter: [filters.filter(p => p.filter.ok).length, filters.length, 'filters safe for rules'],
    parsing: [used.length, used.length, 'parsing rules working'],
    model: [models.filter(p => p.model.ok).length, models.length, 'mappings correct'],
    routing: [used.filter(p => p.dest.includes('Analytics')).length, used.length, 'pipelines reach analytics'],
    rule: [st.healthy, st.enabled, 'rules working and useful']
  };
}
function mStageClick(layer) { const t = myLayerOpen(M.W, layer)[0]; if (t) mOpenTask(t.id); else toast(`${MY_LAYER[layer].name}: nothing is wrong at this step`, 'check'); }

function mHome() {
  const W = M.W, st = myStats(W), ss = mStageStats(W), pend = myPendingTasks(W);
  const auto = W.tasks.filter(t => t.status === 'done');
  const chain = MY_LAYERS.map(([k, n, i], idx) => { const [ok, total, label] = ss[k], open = myLayerOpen(W, k), bad = open.some(t => t.status === 'pending');
    return `${idx ? `<div class="hidden md:flex items-center text-ink4 m-flow">${ic('chevron-right', 'w-4 h-4')}</div>` : ''}
      <button onclick="mStageClick('${k}')" class="flex-1 min-w-[128px] text-left rounded-2xl border p-3 transition ${bad ? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10' : 'border-line bg-panel hover:border-line2'}">
        <div class="flex items-center justify-between"><span class="${bad ? 'c-amber' : 'c-cx'}">${ic(i, 'w-4 h-4')}</span>${open.length ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold c-amber">${mAv(k === 'rule' ? 'det' : 'pipe', 16)}${open.length}</span>` : `<span class="c-cx">${ic('check', 'w-3.5 h-3.5')}</span>`}</div>
        <div class="mt-2 text-[13px] font-bold text-ink">${n}</div>
        <div class="text-[20px] leading-6 font-bold font-mono ${ok === total ? 'text-ink' : 'c-amber'}">${ok}<span class="text-ink4 text-[13px]"> / ${total}</span></div>
        <div class="text-[11.5px] text-ink3 leading-snug">${label}</div></button>`; }).join('');

  const top = pend[0], topTr = top && MY_TRIGGER[top.trigger.kind];
  const story = top ? `<section class="rounded-3xl border border-line bg-panel p-5 sm:p-6">
      <div class="flex items-center justify-between gap-3 flex-wrap"><div class="hm-label">TOP FINDING</div><div class="flex items-center gap-2">${mSug(top.sug, { solid: true })}${mConf(top.conf)}${mImpact(top.impact)}<span class="font-mono text-[12px] text-ink3">${top.id}</span></div></div>
      <h2 class="hm-title mt-1">${esc(top.title)}</h2>
      <p class="mt-2 text-[14px] text-ink2 leading-relaxed">${esc(top.summary)}</p>
      <div class="mt-4">${mChain(top.layer, top.sug)}</div>
      <div class="mt-3 flex gap-2.5 text-[13px] text-ink3">${top.trigger.from ? mAv(M_FROM[top.trigger.from], 20) : ic(topTr[1], 'w-4 h-4 mt-0.5 shrink-0')}<span><b class="text-ink2">${topTr[0]}${top.trigger.from ? ' from the ' + mFromName(top) : ''}.</b> ${esc(top.trigger.text)}</span></div>
      <div class="mt-4 flex items-center gap-3 flex-wrap"><button onclick="mOpenTask('${top.id}')" class="px-4 py-2.5 rounded-xl bg-ink text-panel text-[13.5px] font-bold inline-flex items-center gap-2">Review this decision${ic('arrow-right', 'w-4 h-4')}</button>${(top.pivots || []).slice(0, 1).map(([v, n]) => `<button onclick="mPivot('${top.id}','${v}')" class="text-[13px] text-ink3 hover:text-ink inline-flex items-center gap-1">${ic('arrow-up-right', 'w-3.5 h-3.5')}Open in ${esc(n)}</button>`).join('')}</div>
    </section>` : '';

  const waiting = `<section class="rounded-3xl border border-line bg-panel p-5 sm:p-6">
      <div class="flex items-end justify-between gap-3 flex-wrap"><div><div class="hm-label">WAITING FOR YOU</div><h2 class="hm-title mt-1">${pend.length ? `${pend.length} decision${pend.length === 1 ? '' : 's'}, most valuable first` : 'Nothing is waiting for you'}</h2></div>${pend.length ? `<button onclick="mReviewAll()" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13.5px] font-bold inline-flex items-center gap-2">${ic('bell-ring', 'w-4 h-4')}Review them one by one</button>` : ''}</div>
      <div class="mt-4 divide-y divide-line rounded-2xl border border-line overflow-hidden">${pend.map(t => `<button onclick="mOpenTask('${t.id}')" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-hov">
        <span class="w-[76px] shrink-0">${mSug(t.sug, { solid: true })}</span>${mAvs(t, 20)}<span class="min-w-0 flex-1"><span class="block text-[14px] text-ink truncate">${esc(t.title)}</span><span class="block text-[12px] text-ink3 truncate">${esc(t.decision.q)} · starts at: ${MY_LAYER[t.layer].name.toLowerCase()}</span></span>${mImpact(t.impact)}<span class="text-ink4">${ic('chevron-right', 'w-4 h-4')}</span></button>`).join('') || `<div class="px-4 py-6 text-center text-[13.5px] text-ink3">No open decisions.</div>`}</div>
    </section>`;

  const prog = W.tasks.filter(t => t.status === 'progress');
  const own = `<section class="rounded-3xl border border-line bg-panel p-5 sm:p-6">
      <div class="hm-label">NO DECISION NEEDED</div><h2 class="hm-title mt-1">${auto.length} task${auto.length === 1 ? '' : 's'} closed, ${prog.length} in progress</h2>
      <div class="mt-4 grid sm:grid-cols-2 gap-3">
        <div class="rounded-2xl bg-sunk p-4"><div class="text-[26px] font-bold font-mono c-cx">${st.healthy}</div><div class="text-[13.5px] text-ink font-semibold inline-flex items-center gap-1.5">rules checked and healthy ${mInfo('A healthy check opens no task. Tasks are opened only for detections that need attention.')}</div></div>
        <div class="rounded-2xl bg-sunk p-4"><div class="text-[26px] font-bold font-mono c-indigo">${prog.length}</div><div class="text-[13.5px] text-ink font-semibold">in progress</div><p class="text-[12.5px] text-ink3 mt-1 leading-relaxed">${prog.map(t => `<button onclick="mOpenTask('${t.id}')" class="hover:text-ink underline underline-offset-2">${esc(t.progressNote)}</button>`).join(' · ')}</p></div>
      </div>
      <div class="mt-3 divide-y divide-line rounded-2xl border border-line overflow-hidden">${auto.map(t => `<button onclick="mOpenTask('${t.id}')" class="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-hov"><span class="w-[150px] shrink-0">${mStatus(t)}</span><span class="min-w-0 flex-1 text-[13.5px] text-ink2 truncate">${esc(t.title)}</span><span class="text-[12px] text-ink4 font-mono">${t.id}</span><span class="text-ink4">${ic('chevron-right', 'w-4 h-4')}</span></button>`).join('')}</div>
    </section>`;

  const fromInv = W.tasks.filter(t => t.trigger.from === 'analyst'), joint = W.tasks.filter(t => mTaskAgents(t).length > 1);
  const exchange = `<section class="rounded-3xl border border-line bg-panel p-5 sm:p-6">
      <div class="hm-label inline-flex items-center gap-1.5">HANDOFFS ${mInfo('Agents pass work to each other. A single benign verdict does not open a task. A pattern across many cases does. A case that could not be judged because data was missing opens a task at once.')}</div>
      <div class="mt-3 grid md:grid-cols-3 gap-3">
        <div class="rounded-2xl bg-sunk p-4"><div class="flex items-center gap-2 text-[12px] font-bold text-ink3">${mAv('inv', 20)}FROM THE INVESTIGATION AGENT · ${fromInv.length}</div><div class="mt-2 space-y-1.5">${fromInv.map(t => `<button onclick="mOpenTask('${t.id}')" class="w-full text-left flex items-center gap-2 text-[13px] text-ink2 hover:text-ink"><span class="font-mono text-[11.5px] text-ink4 shrink-0">${t.id}</span><span class="truncate flex-1">${esc(t.trigger.text)}</span>${mStatus(t)}</button>`).join('')}</div></div>
        <div class="rounded-2xl bg-sunk p-4"><div class="flex items-center gap-2 text-[12px] font-bold text-ink3">${mAv('inv', 20)}TO THE INVESTIGATION AGENT</div><div class="mt-2 grid grid-cols-2 gap-3"><div><div class="text-[22px] font-bold font-mono c-indigo">${st.removed.toLocaleString()}</div><div class="text-[12.5px] text-ink3">fewer issues a week</div></div><div><div class="text-[22px] font-bold font-mono text-ink">${W.facts.length}</div><div class="text-[12.5px] text-ink3 inline-flex items-center gap-1.5">environment facts shared ${mInfo('A reviewed statement about your environment, with a review date. All agents read the same facts.')}</div></div></div></div>
        <div class="rounded-2xl bg-sunk p-4"><div class="flex items-center gap-2 text-[12px] font-bold text-ink3"><span class="inline-flex">${mAv('det', 20)}<span class="-ml-1.5">${mAv('pipe', 20)}</span></span>BETWEEN THE TWO AGENTS · ${joint.length}</div><div class="mt-2 space-y-1.5">${joint.map(t => `<button onclick="mOpenTask('${t.id}')" class="w-full text-left flex items-center gap-2 text-[13px] text-ink2 hover:text-ink"><span class="font-mono text-[11.5px] text-ink4 shrink-0">${t.id}</span><span class="truncate flex-1">${esc(M_AG[t.agent].name)} asked the ${esc(M_AG[mTaskAgents(t)[1]].name)}</span>${mStatus(t)}</button>`).join('')}</div></div>
      </div>
    </section>`;

  const chat = M.chats._.map(m => m.role === 'user' ? `<div class="flex justify-end"><div class="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-indigo-500/25 text-ink text-[14px]">${esc(m.text)}</div></div>` : `<div class="flex gap-2.5">${mAv(m.agent || 'det', 26)}<div class="rounded-2xl rounded-tl-md px-4 py-3 bg-panel border border-line text-[14px] text-ink2 leading-relaxed max-w-[85%]">${md(m.text)}${m.task ? `<div class="mt-2"><button onclick="mOpenTask('${m.task}')" class="text-[13px] font-semibold c-cx inline-flex items-center gap-1">Open ${m.task}${ic('arrow-right', 'w-3.5 h-3.5')}</button></div>` : ''}</div></div>`).join('');

  $('mv-home').innerHTML = `<div data-scroll id="m-home-scroll" class="flex-1 overflow-y-auto"><div class="max-w-[1080px] mx-auto px-5 sm:px-8 py-8 space-y-5">
      <div class="text-center"><div class="hm-label">BANK US · SECURITY OPERATIONS</div>
        <div class="flex justify-center items-end mt-4">${mAv('det', 72, true)}<span class="-ml-4">${mAv('pipe', 72, true)}</span></div>
        <h1 class="text-[clamp(26px,2.8vw,40px)] font-black text-ink leading-tight mt-3">Good morning, Guy</h1>
        <p class="text-[clamp(14px,1.1vw,16px)] text-ink2 mt-1.5">While you were away, the <b class="text-ink">Detection Engineer</b> and the <b class="text-ink">Pipeline Engineer</b> checked <b class="text-ink">${st.rules} detections</b> and <b class="text-ink">${st.inst} data instances</b>. <b class="c-amber">${st.pending} decision${st.pending === 1 ? '' : 's'}</b> need${st.pending === 1 ? 's' : ''} you.</p></div>
      <section class="rounded-3xl border border-line bg-panel2 p-4 sm:p-5">
        <div class="flex items-end justify-between gap-6 mb-3"><div class="min-w-0"><div class="hm-label inline-flex items-center gap-1.5">DETECTION CHAIN ${mInfo('A detection works only if every step before it works. Each step shows how many of the pipelines that rules depend on are healthy. A step with an open task is marked.')}</div></div>
          <div class="text-right shrink-0"><div class="text-[32px] leading-8 font-black font-mono ${st.share >= 70 ? 'c-cx' : 'c-amber'}">${st.share}%</div><div class="text-[12px] text-ink3">of enabled detections are working and useful</div></div></div>
        <div class="flex gap-1.5 flex-wrap md:flex-nowrap">${chain}</div>
      </section>
      ${story}${waiting}${own}${exchange}
      <div id="m-chat" class="space-y-3 pt-1">${chat}</div>
    </div></div>
    <div class="shrink-0 border-t border-line bg-panel"><div class="max-w-[880px] mx-auto px-5 sm:px-8 py-3 space-y-2">
      <div class="flex flex-wrap gap-1.5">${[[`${st.pending} decision${st.pending === 1 ? '' : 's'}`, 'mReviewAll()', true], ['Why did SentinelOne break?', "mAsk('Why did SentinelOne break?')"], ['What did the Investigation Agent hand over?', "mAsk('What did the Investigation Agent hand over?')"], ['Are we covered for impossible travel?', "mAsk('Are we covered for impossible travel?')"], ['What changed since yesterday?', "mAsk('What changed since yesterday?')"]].map(([l, f, hot]) => `<button onclick="${f}" class="px-3 py-1.5 rounded-full border text-[12.5px] ${hot ? 'border-amber-500/60 c-amber font-bold bg-amber-500/10' : 'border-line2 text-ink2 hover:text-ink hover:bg-hov'}">${l}</button>`).join('')}</div>
      <div class="flex items-center rounded-2xl bg-sunk border border-line focus-within:border-cx"><span class="pl-3 shrink-0">${mAv('det', 22)}</span>
        <input id="m-ask" data-keep placeholder="Ask the agents anything, or tell them what to check…" onkeydown="if(event.key==='Enter'){const v=this.value;this.value='';mAsk(v);}" class="flex-1 min-w-0 bg-transparent px-3 py-3.5 text-[14px] text-ink placeholder:text-ink3 focus:outline-none">
        <button onclick="const e=$('m-ask'),v=e.value;e.value='';mAsk(v)" class="mr-2 p-2 rounded-xl text-ink3 hover:bg-ink hover:text-panel">${ic('arrow-up', 'w-4 h-4')}</button></div>
    </div></div>`;
}

/* Scripted answers. Every number is read from the world, not typed. */
function mAnswer(q) {
  const W = M.W, st = myStats(W), l = q.toLowerCase(), t = id => mTask(id);
  if (/sentinel|severity|broke/.test(l)) { const x = t('TSK-1001'); return { agent: 'det', text: x.status === 'done' ? `It is fixed. ${x.outcome}` : `The rules did not break. **The data model did.** The SentinelOne pack update on ${W.dates.packDay} stopped sending the field that carried severity, and the mapping still reads it. Three rules read that mapping, so all three create issues with no severity. I asked the Pipeline Engineer, who wrote one corrected mapping line and replayed 7 days through it: severity is filled on all 1,204 issues.`, task: 'TSK-1001' }; }
  if (/investigation|hand/.test(l)) { const xs = W.tasks.filter(x => x.trigger.from === 'analyst'); return { agent: 'det', text: `The Investigation Agent handed over **${xs.length} patterns**:\n${xs.map(x => `• ${x.id}: ${x.trigger.text}`).join('\n')}\n\nI never act on a single benign verdict. I wait for a pattern across many cases, and I check whether analysts agreed with it.` }; }
  if (/travel|okta|covered/.test(l)) { const x = t('TSK-1006'); return { agent: 'det', text: `**Not yet.** Impossible travel needs identity sign-in logs, and Okta is not connected. A rule in the Marketplace already covers it, so I would not write a new one. Connecting Okta also unlocks 8 more Marketplace detections. ${x.status === 'pending' ? 'The request to the identity team is waiting for your approval.' : x.progressNote ? x.progressNote + '.' : ''}`, task: 'TSK-1006' }; }
  if (/chang|yesterday|new/.test(l)) return { agent: 'det', text: `Since yesterday:\n${W.log.slice(0, 6).map(x => `• ${x.text}`).join('\n')}\n\nRight now **${st.healthy} of ${st.enabled}** enabled detections are working and useful, and **${st.pending}** decision${st.pending === 1 ? '' : 's'} wait${st.pending === 1 ? 's' : ''} for you.` };
  if (/aws|s3|audit/.test(l)) return { agent: 'pipe', text: `The production audit-log instance of Amazon S3 has been in error for 46 hours because its access key expired. Two AWS rules have no data. I cannot create credentials, so this needs a person. The queue keeps 14 days, so nothing is lost if the key is replaced in time.`, task: 'TSK-1003' };
  if (/nois|tun|chrome|extension/.test(l)) return { agent: 'det', text: `The noisiest customer rule is the Chrome extension rule: 1,250 issues a month, 1,150 of them from 9 extensions that IT approved. The rule is right, so I do not change its query. I suggest issue suppression and an environment fact with a review date.`, task: 'TSK-1002' };
  if (/pipeline|parsing|filter|agent/.test(l)) { const j = W.tasks.filter(x => mTaskAgents(x).length > 1); return { agent: 'pipe', text: `Two agents work this domain. The **Detection Engineer** owns rules, indicators and coverage. I am the **Pipeline Engineer**: filtering, parsing and normalizing. Each of us can pass a task to the other and wait for the answer. That happened on **${j.length} task${j.length === 1 ? '' : 's'}**: ${j.map(x => x.id).join(', ')}.` }; }
  return { agent: 'det', fallback: true, text: `We keep **${st.rules} detections**, **${st.iocs} indicators** and **${st.inst} data instances** under watch. **${st.pending}** decision${st.pending === 1 ? '' : 's'} wait${st.pending === 1 ? 's' : ''} for you. Ask about a rule, a data source, or what the Investigation Agent handed over.` };
}
function mAsk(q) {
  q = (q || '').trim(); if (!q) return;
  M.chats._.push({ role: 'user', text: q }); const a = mAnswer(q); M.chats._.push({ role: 'agent', agent: a.agent, text: a.text, task: a.task });
  if (M.view !== 'home') mNav('home', { keepScroll: true }); else mRender();
  const sc = $('m-home-scroll'); if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
}
