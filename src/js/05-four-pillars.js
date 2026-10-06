/* ======================================================================
   THE FOUR PILLARS OF THE AGENTIC WORKFORCE
   ====================================================================== */
const PILLARS = {
  analyst:  { name: 'Josh', title: 'Security Analyst', role: 'Triage · Investigate · Respond', icon: 'shield-half', col: '#3b82f6', c2: '#93c5fd', dark: '#1e3a8a', noun: 'investigations', task: 'Investigation', base: 0 },
  engineer: { name: 'Maya', title: 'SecOps Engineer', role: 'Detections · Automation · Data health', icon: 'wrench', col: '#8b5cf6', c2: '#c4b5fd', dark: '#4c1d95', noun: 'tickets', task: 'Ticket', base: 9 },
  hunter:   { name: 'Tom', title: 'Threat Hunter', role: 'Hypotheses · Hunts · Findings', icon: 'crosshair', col: '#f97316', c2: '#fdba74', dark: '#9a3412', noun: 'hunts', task: 'Hunt', base: 5 },
  intel:    { name: 'Avi', title: 'Intel Analyst', role: 'Feeds · Campaigns · Exposure', icon: 'radar', col: '#06b6d4', c2: '#67e8f9', dark: '#155e75', noun: 'assessments', task: 'Assessment', base: 21 }
};
const PILLAR_KEYS = ['analyst', 'engineer', 'hunter', 'intel'];
/* The key is per branch, so a mode saved by another build of this demo does not decide what opens here. */
const AGENT_MODE_KEY = 'cortex-agent-mode-hunter';
const AGENT_MODE = (() => { try { return localStorage.getItem(AGENT_MODE_KEY) || 'hunt'; } catch (e) { return 'hunt'; } })();
/* HUNT: the demo told from the Threat Hunter's side. See src/js/80-hunt-*.js */
const HUNT = AGENT_MODE === 'hunt';
/* MAYA: the demo told from the SecOps Engineer's side. See src/js/60-maya-*.js */
const MAYA = AGENT_MODE === 'maya';
const SINGLE = AGENT_MODE === 'single';
if (SINGLE) PILLAR_KEYS.splice(1);
function setAgentMode(m, inApp) { if (m === AGENT_MODE) return; try { localStorage.setItem(AGENT_MODE_KEY, m); if (inApp) sessionStorage.setItem('cortex-skip-landing', '1'); } catch (e) {} location.reload(); }
function agentModeToggle(cls) { return `<div class="inline-flex items-center rounded-full border border-white/15 p-1 bg-white/[.04] ${cls || ''}">${[['hunt', 'Threat Hunting'], ['maya', 'SecOps Engineering'], ['single', 'Josh · Analyst'], ['multi', 'Workforce']].map(([k, l]) => `<button onclick="setAgentMode('${k}')" class="px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap ${AGENT_MODE === k ? 'bg-white text-slate-950 font-bold' : 'text-white/70 hover:text-white'}">${l}</button>`).join('')}</div>`; }
