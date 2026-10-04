/* ======================================================================
   DESIGN DIRECTIONS: combining the liquid core and the agents
   ====================================================================== */
function exBlob(cx, cy, r, c1, c2, id, dur = 8) {
  const vals = [7, 19, 33, 47, 7].map(sd => blobPath(sd, Math.max(3, r * .09), 0, r)).join(';');
  return `<defs><radialGradient id="${id}" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="${c2}"/><stop offset=".5" stop-color="${c1}"/><stop offset="1" stop-color="#0b1a4a"/></radialGradient></defs>
    <g transform="translate(${cx},${cy})"><path fill="url(#${id})"><animate attributeName="d" dur="${dur}s" repeatCount="indefinite" values="${vals}"/></path><ellipse cx="${-r * .3}" cy="${-r * .38}" rx="${r * .32}" ry="${r * .17}" fill="#fff" opacity=".35" transform="rotate(-28 ${-r * .3} ${-r * .38})"/></g>`;
}
function exCore(cx, cy, r) {
  return `${exBlob(cx, cy, r, '#00b37a', '#d2ffe9', 'exbc')}
    <g transform="translate(${cx},${cy})" fill="none">
      <circle r="${r + 14}" stroke="#4DFFA6" stroke-opacity=".7" stroke-width="2" stroke-dasharray="${(r + 14) * 1.6} ${(r + 14) * 4.6}"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite"/></circle>
      <circle r="${r + 14}" stroke="#22d3ee" stroke-opacity=".6" stroke-width="2" stroke-dasharray="${(r + 14) * 1.1} ${(r + 14) * 5.1}" transform="rotate(160)"><animateTransform attributeName="transform" type="rotate" from="160" to="-200" dur="12s" repeatCount="indefinite"/></circle>
      <circle r="${r + 22}" stroke="#4DFFA6" stroke-opacity=".35" stroke-width="5" stroke-dasharray="1 5"/>
      <circle r="${r + 30}" stroke="#4DFFA6" stroke-opacity=".15" stroke-width="1"/>
    </g>`;
}
function exBot(x, y, size, k, anim = true) { const [c1, c2, eye] = k ? ROBOT_COL[k] : ['#3ee6a0', '#36d4ea', '#7ff7d6']; return `<svg x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" viewBox="${ROBOT_VB}" overflow="visible">${robotInner(c1, c2, size >= 40, eye, anim, size >= 30)}</svg>`; }
const EX_OPTS = [
  { key: 'orbit', name: 'Core and satellites', tag: 'What we have today',
    idea: 'The liquid core is the shared intelligence. The four agents orbit it as specialists, each with its own job and colour.',
    story: '“One brain, four specialists.” The core is AgentiX; Josh, Maya, Tom and Avi are how it shows up for each kind of work.',
    where: 'Home hero, landing page, workforce header.', pro: 'Already built; reads instantly as a team around a centre.', con: 'Core and agents feel related but not physically connected.',
    svg: () => { let o = `<ellipse cx="200" cy="135" rx="150" ry="62" fill="none" stroke="rgb(129 140 248 / .25)" stroke-dasharray="3 6"/>${exBlob(200, 135, 46, '#3b82f6', '#bfdbfe', 'exb1')}`;
      ['analyst', 'engineer', 'hunter', 'intel'].forEach((k, i) => { o += `<g>${exBot(0, 0, 46, k)}<animateMotion dur="16s" begin="${-i * 4}s" repeatCount="indefinite" path="M50,135 a150,62 0 1,0 300,0 a150,62 0 1,0 -300,0"/></g>`; }); return o; } },
  { key: 'born', name: 'Born from the core', tag: 'Recommended',
    idea: 'Agents are droplets of the liquid core. When work arrives, a droplet separates and becomes an agent; when it’s done, it melts back in.',
    story: '“The agents are the core, taking shape when there is work.” Busy agents are out in the world, idle ones are inside the core. The size of the core shows how much of the workforce is free.',
    where: 'Home hero and the workforce header: you literally see agents leave to work and come back.', pro: 'Explains autonomy visually: work makes agents appear; nothing to set up.', con: 'Needs careful motion so it doesn’t feel busy.',
    svg: () => { const pts = [[200, 46, 'analyst'], [330, 135, 'engineer'], [200, 224, 'hunter'], [70, 135, 'intel']];
      let goo = `<circle cx="200" cy="135" r="46" fill="#3b82f6"/>`, bots = '';
      pts.forEach(([x, y, k], i) => { const d = `${7 + i * 1.3}s`, kt = '0;.18;.42;.6;.82;1';
        goo += `<circle r="20" fill="${ROBOT_COL[k][0]}"><animate attributeName="cx" values="200;200;${x};${x};200;200" keyTimes="${kt}" dur="${d}" repeatCount="indefinite" calcMode="spline" keySplines=".5 0 .5 1;.5 0 .5 1;.5 0 .5 1;.5 0 .5 1;.5 0 .5 1"/><animate attributeName="cy" values="135;135;${y};${y};135;135" keyTimes="${kt}" dur="${d}" repeatCount="indefinite" calcMode="spline" keySplines=".5 0 .5 1;.5 0 .5 1;.5 0 .5 1;.5 0 .5 1;.5 0 .5 1"/></circle>`;
        bots += `<g opacity="0">${exBot(x, y, 50, k)}<animate attributeName="opacity" values="0;0;0;1;1;0;0" keyTimes="0;.18;.36;.44;.56;.62;1" dur="${d}" repeatCount="indefinite"/></g>`; });
      return `<defs><filter id="exgoo"><feGaussianBlur stdDeviation="9" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter></defs><g filter="url(#exgoo)" opacity=".9">${goo.replace(/fill="#3b82f6"/, 'fill="#00b37a"').replace(/fill="(#[0-9a-f]{6})"/g, (m0, c0) => c0 === '#00b37a' ? m0 : 'fill="#4DFFA6"')}</g>${exCore(200, 135, 38)}${bots}`; } },
  { key: 'visor', name: 'The core lives in every visor', tag: 'Most personal',
    idea: 'There is no separate orb. The liquid fills each robot’s visor, so every agent carries the same mind, tinted in its own colour.',
    story: '“Same intelligence, different job.” When an agent thinks, the liquid behind its eyes moves faster; when it needs you, it glows amber.',
    where: 'Every avatar: chat, action plan, case assignee. The Home hero becomes four robots with no centre.', pro: 'Strongest character; works at 32 px; one consistent object everywhere.', con: 'Loses the big “collective” moment of the core.',
    svg: () => ['analyst', 'engineer', 'hunter', 'intel'].map((k, i) => { const [c1, c2] = ROBOT_COL[k], id = 'exv' + i, x = 62 + i * 92, vals = [5, 17, 29, 41, 5].map(sd => blobPath(sd, 22, 512, 150)).join(';');
      return `<svg x="${x - 44}" y="91" width="88" height="88" viewBox="${ROBOT_VB}" overflow="visible">${robotInner(c1, c2, true, '#ffffff', true, true)}
        <defs><clipPath id="${id}c"><rect x="262" y="372" width="500" height="300" rx="150" ry="140"/></clipPath><radialGradient id="${id}g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}" stop-opacity=".2"/></radialGradient></defs>
        <g transform="translate(512 512) scale(.84) translate(-512 -530)"><g clip-path="url(#${id}c)" opacity=".75"><path fill="url(#${id}g)" transform="translate(0 30)"><animate attributeName="d" dur="${5 + i}s" repeatCount="indefinite" values="${vals}"/></path></g>
        <g fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round"><path d="M372,568 Q422,490 472,568"/><path d="M552,568 Q602,490 652,568"/></g></g></svg>`; }).join('') },
  { key: 'stream', name: 'The core becomes the orbit', tag: 'Best for teamwork',
    idea: 'The liquid stretches into a flowing ring that connects all four agents. It is their shared memory, and you can see work travel along it from one agent to another.',
    story: '“They share one memory.” A hunt that turns into a rule is a drop of liquid moving from Tom to Maya.',
    where: 'Home hero and the case flow: handoffs between agents become visible movement.', pro: 'Makes collaboration and handoffs the hero.', con: 'Less of a single “face” for AgentiX.',
    svg: () => { const ring = 'M60,135 a140,74 0 1,0 280,0 a140,74 0 1,0 -280,0';
      let o = `<defs><linearGradient id="exst" x1="0" x2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs>
        <path d="${ring}" fill="none" stroke="url(#exst)" stroke-width="14" stroke-linecap="round" opacity=".55"/>
        <path d="${ring}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="14 22" opacity=".5"><animate attributeName="stroke-dashoffset" values="0;-72" dur="1.6s" repeatCount="indefinite"/></path>`;
      [[200, 61], [340, 135], [200, 209], [60, 135]].forEach(([x, y], i) => { o += exBot(x, y, 48, ['analyst', 'engineer', 'hunter', 'intel'][i]); });
      ['#f97316', '#06b6d4', '#3b82f6'].forEach((col, i) => { o += `<circle r="7" fill="${col}"><animateMotion dur="5s" begin="${-i * 1.7}s" repeatCount="indefinite" path="${ring}"/></circle>`; });
      return o; } },
  { key: 'morph', name: 'Liquid until it speaks', tag: 'Most cinematic',
    idea: 'AgentiX is a single liquid entity. When one agent takes the floor, the liquid forms that agent’s face; when it’s done talking, it melts back into the core.',
    story: '“One voice, many faces.” Calm liquid means everything is handled. A face means someone has something to tell you.',
    where: 'The AgentiX panel and Home greeting: the core turns into Josh when he brings you a decision.', pro: 'Beautiful state change; turns attention into a moment.', con: 'Only one agent “speaks” at a time; needs fast, subtle motion.',
    svg: () => `<g>${exBlob(200, 135, 60, '#3b82f6', '#bfdbfe', 'exb5', 6)}<animate attributeName="opacity" values="1;1;0;0;1;1" keyTimes="0;.35;.45;.8;.9;1" dur="7s" repeatCount="indefinite"/></g>
      <g opacity="0">${exBot(200, 135, 140, 'analyst')}<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.38;.48;.78;.88;1" dur="7s" repeatCount="indefinite"/></g>
      <text x="200" y="250" text-anchor="middle" font-size="12" fill="rgb(255 255 255 / .5)" font-family="Lato, sans-serif">idle core  →  Josh brings you a decision  →  back to the core</text>` }
];
