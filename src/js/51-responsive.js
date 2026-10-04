/* ======================================================================
   RESPONSIVE: panes react to their own width
   ====================================================================== */
function applySizes() {
  const pc = $('pane-cases'), cp = $('pane-copilot');
  if (pc) { const w = pc.clientWidth; pc.classList.toggle('t-narrow', w > 0 && w < 520); pc.classList.toggle('t-wide', w >= 820); }
  if (cp) { const w = cp.clientWidth; cp.classList.toggle('cp-wide', w >= 640); cp.classList.toggle('cp-xwide', w >= 860); }
}
if (window.ResizeObserver) { const ro = new ResizeObserver(() => applySizes()); ['pane-cases', 'pane-copilot'].forEach(id => $(id) && ro.observe($(id))); }
window.addEventListener('resize', applySizes);
