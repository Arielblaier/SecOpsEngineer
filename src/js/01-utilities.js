/* ======================================================================
   UTILITIES
   ====================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ic = (n, c = 'w-3.5 h-3.5') => `<i data-lucide="${n}" class="${c}"></i>`;
const icons = () => { try { if (window.lucide) lucide.createIcons(); } catch (e) {} };
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rng = mulberry32(7);
const rint = n => Math.floor(Math.random() * n);
const sint = n => Math.floor(rng() * n);
const clock = (d = new Date()) => d.toTimeString().slice(0, 8);
const confLevel = v => !v ? '' : v >= 85 ? 'High' : v >= 65 ? 'Medium' : 'Low';
const confN = v => !v ? 0 : v >= 85 ? 3 : v >= 65 ? 2 : 1;
const fmtDur = s => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${String(s%60).padStart(2,'0')}s`;
const fmtAgo = ts => { const s = Math.max(0, Math.round((Date.now()-ts)/1000)); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`; return `${Math.floor(s/3600)}h ago`; };
const md = t => esc(t).replace(/\*\*(.+?)\*\*/g,'<strong class="text-ink font-semibold">$1</strong>').replace(/`(.+?)`/g,'<code class="px-1 py-0.5 rounded bg-code font-mono text-[11px] c-cx break-all">$1</code>').replace(/\n/g,'<br>');
let uidN = 0; const uid = () => 'e' + (++uidN);
