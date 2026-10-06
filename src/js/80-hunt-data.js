/* ======================================================================
   THREAT HUNTING · THE WORLD
   One object model, the same on every screen:

     Hunt (one agent task)  ->  Hunt report (one per hunt, never edited)
        -> Threat found     ->  Issue, type Threat Hunting (one per report)
                            ->  Case, through the existing grouping engine
        -> No threat found  ->  stays in the Hunts list as history

   This file is the ONLY place where hunts, findings and numbers live.
   Screens count from it and never type a number of their own.
   Field names in the queries follow XQL style and are illustrative.
   ====================================================================== */
const HY_STAGES = ['Scope', 'Hypothesize', 'Plan', 'Collect evidence', 'Analyze', 'Report'];
const HY_TRIGGER = {
  rotation: ['Rotation', 'repeat', 'The agent works through the ATT&CK techniques on a schedule.'],
  intel: ['New intel', 'radar', 'A new threat report or indicator set started this hunt.'],
  manual: ['Analyst request', 'user', 'A person asked for this hunt.'],
  handoff: ['Handoff', 'corner-down-right', 'Another agent asked for this hunt.']
};
const HY_FLEET = [['Windows', 3120], ['macOS', 742], ['Linux', 348]];
const HY_ENDPOINTS = HY_FLEET.reduce((n, x) => n + x[1], 0);
const HY_DAY = 864e5;
const hyDate = (ts, time) => { const d = new Date(ts), m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  return `${d.getDate()} ${m}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}${time ? ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : ''}`; };
const hyId = (ts, n) => { const d = new Date(ts); return `HNT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(n).padStart(3, '0')}`; };

/* ---------- hunt 1: the full story, written by hand ---------- */
const HY_BGINFO = String.raw`C:\Users\Administrator\Bginfo.exe`;
function hyHero() {
  const at = new Date(2026, 7, 14, 10, 58).getTime();
  /* Clusters by who they turned out to belong to. Every total on the screens is summed from these rows. */
  const passes = [
    { c: 'C1', name: 'Windows autoruns, inventory pass', src: 'host_inventory_auto_runs', vendor: 71, internal: 16, lab: 8, open: 1 },
    { c: 'C1', name: 'Windows autoruns, process pass', src: 'xdr_process', vendor: 9, internal: 8, lab: 6, open: 0 },
    { c: 'C3', name: 'Linux cron and systemd units', src: 'host_inventory_auto_runs', vendor: 8, internal: 3, lab: 3, open: 0 }
  ];
  const mac = { seen: 451, done: 81, vendor: 64, internal: 17 };
  const tot = k => passes.reduce((n, p) => n + p[k], 0), all = p => p.vendor + p.internal + p.lab + p.open, reviewed = passes.reduce((n, p) => n + all(p), 0);
  const hosts = ['WIN-BLD-07', 'WIN-BLD-11', 'WIN-QA-02', 'WIN-JMP-01', 'WIN-FS-04'];
  const q = (id, cond, text, dataset, xql, rows, note) => ({ id, hyp: 'H1', cond, q: text, dataset, xql, rows, note });
  return {
    id: hyId(at, 1), hero: true, title: 'Autorun Persistence in User-Writable Paths',
    tech: 'T1547', techName: 'Boot or Logon Autostart Execution', tactic: 'Persistence',
    trigger: 'rotation', triggerText: 'Persistence is hunted every 30 days. This was the August run.',
    status: 'done', stage: 5, started: at - 41 * 60000, ended: at, severity: 'Critical',
    window: 'Last 30d', scope: 'Windows, macOS and Linux fleet', endpoints: HY_ENDPOINTS,
    verdict: 'threat', conf: 'Medium',
    summary: [
      'A 30-day snapshot-and-process hunt across the Windows, macOS, and Linux fleet in August 2026 tested whether scheduled tasks, services, registry autoruns, or login items resolve their executable command to a user-writable location (Temp, AppData, Downloads, ProgramData, /tmp, /var/tmp).',
      `No confirmed adversary persistence was found — every cluster resolved to vendor software, internal engineering, or lab automation — except one: unsigned, VT-unknown ${HY_BGINFO} on approximately 5 hosts, which remains unresolved and requires immediate IR escalation.`,
      'The hunt\'s most consequential output is a structural method defect: the specified data source (host_inventory_auto_runs) does not store scheduled-task arguments, making Condition C1 blind by design to interpreter-plus-script staging; a mandatory xdr_process companion pass closed that gap for this hunt and must be codified in the standing playbook.',
      'The macOS login-item surface (C2) remains the largest unresolved area — ~370 of ~451 clusters were never enumerated and enrichment is structurally blocked.'
    ],
    hypothesis: 'Scheduled tasks, services, registry autoruns, or login items whose executable command resolves to a user-writable location rather than a legitimate OS or vendor install directory are suspicious persistence mechanisms likely placed by an adversary. Legitimate autoruns reference fixed, ACL-protected directories (Program Files, System32, /opt, /Applications, /Library) rather than user-owned writable paths.',
    hyps: [{ id: 'H1', text: 'An autorun whose command resolves to a user-writable path was placed by an adversary.', result: 'partial', note: 'One cluster stays unexplained. Every other reviewed cluster has a known owner.' }],
    conds: [
      { id: 'C1', text: 'Windows scheduled tasks, services and registry autoruns', result: 'finding', note: '1 unresolved cluster (F1)' },
      { id: 'C2', text: 'macOS login items and launch agents', result: 'gap', note: `${mac.done} of ~${mac.seen} clusters reviewed` },
      { id: 'C3', text: 'Linux cron entries and systemd units', result: 'clear', note: 'Every cluster has an owner' }
    ],
    passes, mac, reviewed, tot,
    questions: [
      q('Q1', 'C1', 'Which Windows autoruns point to a user-writable path?', 'host_inventory_auto_runs', String.raw`preset = host_inventory_auto_runs
| filter os_type = "Windows" and type in ("Scheduled Task", "Service", "Registry")
| alter path = lowercase(image_path)
| filter path ~= "\\(temp|appdata|downloads|programdata)\\" or path ~= "^c:\\users\\[^\\]+\\[^\\]+\.exe$"
| comp count_distinct(endpoint_id) as hosts by image_path, type, signer`, 1284, `1,284 entries in ${all(passes[0])} clusters by path, type and signer.`),
      q('Q2', 'C1', 'Does the inventory keep the arguments of a scheduled task?', 'host_inventory_auto_runs', String.raw`preset = host_inventory_auto_runs
| filter type = "Scheduled Task"
| comp count() as tasks, count(arguments) as with_arguments`, 1, 'No. The arguments column is empty for every scheduled task. A task that starts powershell.exe with a script in Temp looks like a clean System32 autorun here. This is the method defect.'),
      q('Q3', 'C1', 'Which interpreters did the Task Scheduler start with a script from a user-writable path?', 'xdr_process', String.raw`preset = xdr_process
| filter causality_actor_process_image_name = "svchost.exe"
    and causality_actor_process_command_line contains "Schedule"
| filter action_process_image_name in ("powershell.exe", "pwsh.exe", "wscript.exe",
    "cscript.exe", "mshta.exe", "cmd.exe", "python.exe", "rundll32.exe")
| filter lowercase(action_process_image_command_line)
    ~= "\\(temp|appdata|downloads|programdata)\\"
| comp count() as starts, count_distinct(agent_hostname) as hosts
    by action_process_image_name, action_process_image_command_line`, 412, `412 process starts in ${all(passes[1])} clusters. This companion pass sees what Q1 cannot.`),
      q('Q4', 'C1', 'Who signed each cluster, and how common is it in the fleet?', 'xdr_process', String.raw`preset = xdr_process
| filter action_process_image_path in ($cluster_paths)
| comp count_distinct(agent_hostname) as hosts,
    values(action_process_signature_vendor) as signer,
    values(action_process_signature_status) as signature,
    values(action_wildfire_verdict) as verdict
    by action_process_image_sha256, action_process_image_path`, all(passes[0]) + all(passes[1]), `${tot('vendor') - passes[2].vendor} clusters are signed vendor software, ${tot('internal') - passes[2].internal} belong to internal engineering, ${tot('lab') - passes[2].lab} to lab automation. One has no signer and no verdict.`),
      q('Q5', 'C1', 'Where does the unsigned Bginfo.exe run, and how is it started?', 'host_inventory_auto_runs', String.raw`preset = host_inventory_auto_runs
| filter lowercase(image_path) = "c:\\users\\administrator\\bginfo.exe"
| fields endpoint_name, type, name, image_path, signer, report_timestamp
| sort asc report_timestamp`, hosts.length, `${hosts.length} hosts, each with a registry Run entry named BGInfo. The snapshot of one host is 12 days old, so the count is approximate.`),
      q('Q6', 'C1', 'What did Bginfo.exe do after it started?', 'xdr_data', String.raw`dataset = xdr_data
| filter lowercase(actor_process_image_path) = "c:\\users\\administrator\\bginfo.exe"
| comp count() as events, count_distinct(action_remote_ip) as destinations,
    count_distinct(action_process_image_name) as children
    by agent_hostname, event_type`, 9, 'File and registry reads only. No child process and no outbound connection in 30 days on 4 hosts. The fifth host has no process events for this path. Nothing here clears the file, and nothing convicts it.'),
      q('Q7', 'C2', 'Which macOS login items and launch agents start from a user-writable path?', 'host_inventory_auto_runs', String.raw`preset = host_inventory_auto_runs
| filter os_type = "macOS" and type in ("Login Item", "Launch Agent")
| filter image_path ~= "^/(Users/[^/]+/(Downloads|Library/Application Support)|private/tmp|tmp)/"
| comp count_distinct(endpoint_id) as hosts by image_path, name`, 2906, `About ${mac.seen} clusters. ${mac.done} were reviewed before the query budget for this condition ran out. Login-item records hold a path and a name, with no hash and no signer, so the rest cannot be checked by signature or by how common they are.`),
      q('Q8', 'C3', 'Which Linux cron entries and systemd units run from /tmp or /var/tmp?', 'host_inventory_auto_runs', String.raw`preset = host_inventory_auto_runs
| filter os_type = "Linux" and type in ("Cron", "Systemd Unit")
| filter image_path ~= "^/(var/)?tmp/"
| comp count_distinct(endpoint_id) as hosts by image_path, type, owner`, 61, `61 entries in ${all(passes[2])} clusters: CI runners, vendor updaters and lab provisioning. All have an owner.`)
    ],
    sources: { queried: ['host_inventory_auto_runs', 'xdr_process', 'xdr_data', 'WildFire verdicts', 'VirusTotal (hash lookup)'], missing: [['macOS login-item hashes and signers', 'The inventory does not collect them'], ['Scheduled-task arguments in the inventory', 'The field exists and is never filled'], ['Process events for WIN-FS-04', 'The agent on this host stopped reporting 12 days before the hunt']] },
    logged: { facts: 214, entities: 139, tokens: 1840000 },
    findings: [{ id: 'F1', isNew: true, sev: 'Critical', title: 'potential implant masquerading as Microsoft SysInternals utility',
      text: `An unsigned file named Bginfo.exe starts at logon from ${HY_BGINFO} on about ${hosts.length} hosts. The real BGInfo is signed by Microsoft. This file has no signature, and VirusTotal and WildFire do not know its hash. Nobody in IT or engineering claimed it during the hunt.`,
      assets: hosts, user: 'Administrator (local)', first: new Date(2026, 7, 2).getTime(), hyp: 'H1', qs: ['Q1', 'Q4', 'Q5', 'Q6'], sets: ['host_inventory', 'xdr_process'] }],
    issue: { id: '978520', by: 'auto', opened: at + 60000, state: 'Open',
      ai: `An unsigned, unknown file that uses the name of a Microsoft SysInternals tool starts at every logon on about ${hosts.length} Windows hosts, from the local Administrator profile. The hunt could not prove it is malicious and could not find an owner. Treat it as a live implant until the file is retrieved and analyzed.`,
      evidence: [['File', HY_BGINFO], ['Signature', 'None. The real BGInfo is signed by Microsoft'], ['Reputation', 'Hash unknown to VirusTotal and WildFire'], ['Start', 'Registry Run entry "BGInfo", at logon'], ['Hosts', hosts.join(', ')], ['First seen', hyDate(new Date(2026, 7, 2).getTime())], ['Network', 'No outbound connection seen in 30 days on 4 hosts']],
      steps: [['Isolate the 5 hosts', 'Cuts them from the network. The agent stays reachable.', 'shield-off'], ['Retrieve Bginfo.exe and send it to WildFire', 'Turns "unknown" into a verdict.', 'file-search'], ['Block the file hash on all endpoints', 'Stops it from starting anywhere else.', 'ban'], ['Reset the local Administrator password on the 5 hosts', 'The file sits in that profile.', 'key-round'], ['Search the fleet for the same hash under other names', 'A renamed copy would not match this hunt.', 'search']],
      case: { id: 'CASE-4417', mode: 'new', why: 'No open case shares these hosts or this user, so the grouping engine opened a new case.' } },
    detection: { id: 'DET-HNT-PERSIST-USERWRITABLE-20260814-HNT-001', isNew: true, kind: 'Correlation rule', name: 'Task Scheduler starts an interpreter with a script from a user-writable path',
      xql: String.raw`preset = xdr_process
| filter causality_actor_process_command_line contains "Schedule"
| filter action_process_image_name in ("powershell.exe", "pwsh.exe", "wscript.exe",
    "cscript.exe", "mshta.exe", "cmd.exe", "rundll32.exe")
| filter lowercase(action_process_image_command_line)
    ~= "\\(temp|appdata|downloads|programdata)\\"
| filter action_process_image_command_line not in ($known_vendor_and_internal)` },
    report: hyHeroReport
  };
}
/* The long report. Built from the hunt object, so its numbers always match the other tabs. */
function hyHeroReport(h) {
  const all = p => p.vendor + p.internal + p.lab + p.open, f = h.findings[0], m = h.mac, left = m.seen - m.done;
  return [
    ['h', 'Purpose and trigger'],
    ['p', `This hunt is part of the 30-day rotation through the ATT&CK Persistence tactic. It was not started by an alert or by new intelligence. Its job is to look for persistence that no detection rule fires on today, and to say plainly where it could not look.`],
    ['p', `Attackers who want to survive a reboot need something to start their code again. The cheapest way is an autorun: a scheduled task, a service, a registry Run key or a login item. Attackers often lack the rights to write into protected folders, so their autoruns tend to point at folders any user can write to. That is the pattern this hunt looks for.`],
    ['h', 'Scope'],
    ['table', ['Platform', 'Endpoints', 'Autorun types', 'Condition'], [['Windows', HY_FLEET[0][1].toLocaleString(), 'Scheduled tasks, services, registry autoruns', 'C1'], ['macOS', HY_FLEET[1][1].toLocaleString(), 'Login items, launch agents', 'C2'], ['Linux', HY_FLEET[2][1].toLocaleString(), 'Cron entries, systemd units', 'C3']]],
    ['p', `Time window: 30 days, ending ${hyDate(h.ended)}. User-writable locations: Temp, AppData, Downloads, ProgramData, a file directly in a user profile, /tmp and /var/tmp. Out of scope: WMI event subscriptions, browser extensions and Office add-ins. Each of those has its own hunt in the rotation.`],
    ['h', 'Hypothesis and conditions'],
    ['p', h.hypothesis],
    ['ul', h.conds.map(c => `**${c.id}** ${c.text}.`)],
    ['p', 'A match is a lead, not a verdict. Plenty of real software installs itself per user (chat clients, updaters, developer tools). So every match is grouped into a cluster by path, type and signer, and each cluster must end with an owner: a software vendor, an internal team, or lab automation. A cluster with no owner is a finding.'],
    ['h', 'Method'],
    ['ul', [
      '**Snapshot pass.** Read the autorun inventory (`host_inventory_auto_runs`) for every endpoint and keep the entries whose command resolves to a user-writable path.',
      '**Process pass.** Read 30 days of process events (`xdr_process`) for interpreters started by the Task Scheduler with a script in a user-writable path. This pass was added during the hunt. See "Method defect" below.',
      '**Enrichment.** For each cluster: signer, signature status, WildFire and VirusTotal verdict, number of hosts, and first seen.',
      '**Ownership.** Match each cluster to the software catalog, the engineering build systems and the lab asset tags.'
    ]],
    ['h', 'Results by condition'],
    ['table', ['Pass', 'Data source', 'Clusters', 'Vendor software', 'Internal engineering', 'Lab automation', 'Unresolved'],
      h.passes.map(p => [`${p.c} · ${p.name}`, p.src, all(p), p.vendor, p.internal, p.lab, p.open]).concat([['Total, fully reviewed', '', h.reviewed, h.tot('vendor'), h.tot('internal'), h.tot('lab'), h.tot('open')], [`C2 · macOS login items`, 'host_inventory_auto_runs', `~${m.seen}`, m.vendor, m.internal, 0, `~${left} not reviewed`]])],
    ['p', `Of the ${h.reviewed} clusters that were fully reviewed, ${h.reviewed - h.tot('open')} have an owner. ${h.tot('vendor')} are signed vendor software that installs per user or keeps an updater in ProgramData. ${h.tot('internal')} are internal engineering tools, mostly build agents and developer environment scripts. ${h.tot('lab')} are lab automation on machines tagged as lab assets. ${h.tot('open')} cluster has no owner.`],
    ['h', `Finding ${f.id}: ${f.title}`],
    ['note', 'rose', `${f.sev} · unresolved · needs immediate IR escalation`],
    ['p', f.text],
    ['table', ['Fact', 'Value'], h.issue.evidence],
    ['p', 'Why it stands out. BGInfo is a real SysInternals tool that writes host details onto the desktop wallpaper, and administrators do start it from a Run key. Three things do not fit. The real file is signed by Microsoft and this one is not. The real file has a well-known hash and this one is unknown to both reputation services. And it sits in the Administrator profile on build, QA, jump and file servers, which do not share an owner or an image.'],
    ['p', 'What the hunt could not settle. The file was not retrieved, so nobody has looked inside it. In 30 days it opened no network connection and started no child process on the 4 hosts that report process events. That is what a harmless wallpaper tool looks like. It is also what a dormant implant looks like. The fifth host stopped reporting 12 days before the hunt, so the host count is approximate.'],
    ['p', 'This is why the verdict is Threat Found with medium confidence and not with high confidence. The honest state is "suspicious and unexplained on servers that matter".'],
    ['h', 'Method defect: the inventory cannot see task arguments'],
    ['note', 'amber', 'The most important output of this hunt is about the method, not about a host.'],
    ['p', 'The hunt was specified against `host_inventory_auto_runs`. For a scheduled task, that source stores the program and leaves the arguments empty. A common attacker pattern is a task that starts a signed interpreter and passes it a script:'],
    ['code', String.raw`Program:    C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Arguments:  -w hidden -ep bypass -f C:\Users\Public\AppData\upd.ps1`],
    ['p', 'In the inventory this task resolves to System32. Condition C1 passes it as clean. So C1, as specified, is blind by design to interpreter-plus-script staging, which is the most likely form of the thing it was written to find.'],
    ['p', `The agent noticed this when Q2 returned zero tasks with arguments, and added a process pass over \`xdr_process\`. That pass found ${all(h.passes[1])} more clusters that the inventory pass could not see. All ${all(h.passes[1])} have an owner, so the gap did not hide a threat this time. Without the pass, the hunt would have reported a clean result on a surface it never looked at.`],
    ['p', 'The process pass has its own limit: it only sees tasks that ran during the 30 days. A task set to run once a quarter is invisible to it. The two passes cover each other only in part.'],
    ['h', 'Coverage and limits'],
    ['ul', [
      `**macOS login items (C2) are mostly unreviewed.** About ${m.seen} clusters matched. ${m.done} were reviewed and all have an owner. About ${left} were never enumerated. Enrichment is structurally blocked: a login-item record has a path and a name and no hash or signer, and no process event links a login item to the binary it starts. There is nothing to check a signature or a reputation against.`,
      '**No verdict on C2.** This report does not say the macOS fleet is clean. It says it was not possible to look.',
      '**One Windows host is stale.** WIN-FS-04 last sent an inventory snapshot 12 days before the hunt.',
      '**Tasks that did not run in the window** are covered by the inventory pass only, without their arguments.'
    ]],
    ['h', 'Recommendations'],
    ['ul', [
      `**Now:** escalate ${f.id} to incident response. Isolate the hosts, retrieve the file, get a verdict.`,
      '**Playbook:** make the `xdr_process` companion pass a required step of this hunt. A result from the inventory pass alone must not be reported as "No threat found".',
      '**Data:** collect scheduled-task arguments in the host inventory. Collect hash and signer for macOS login items. Both are requests to the product, not to the SOC.',
      '**Next run:** give C2 its own hunt with its own budget, once the login-item data can be enriched.',
      '**Detection:** the process pass is repeatable, so it was turned into a detection (below).'
    ]],
    ['h', 'Detection created'],
    ['p', `\`${h.detection.id}\` · ${h.detection.kind}. ${h.detection.name}. It fires when the Task Scheduler starts an interpreter with a script from a user-writable path, and skips the ${all(h.passes[1])} clusters this hunt already explained.`],
    ['code', h.detection.xql],
    ['h', 'Appendix: data sources'],
    ['table', ['Queried', 'Used for'], [['host_inventory_auto_runs', 'Autorun entries on all three platforms'], ['xdr_process', 'Process starts by the Task Scheduler, signer and prevalence'], ['xdr_data', 'What Bginfo.exe did after it started'], ['WildFire, VirusTotal', 'File reputation by hash']]],
    ['table', ['Not available', 'Why'], h.sources.missing]
  ];
}

/* ---------- hunt 2: running when the demo opens ---------- */
function hyLive(now) {
  const first = now - 15 * HY_DAY;
  const q = (id, hyp, text, dataset, xql, rows, note) => ({ id, hyp, q: text, dataset, xql, rows, note });
  return {
    id: hyId(now, 1), live: true, title: 'T1053.005 Scheduled-task persistence',
    tech: 'T1053.005', techName: 'Scheduled Task', tactic: 'Persistence',
    trigger: 'rotation', triggerText: 'The process pass from the August autorun hunt is now a required step, so this technique gets its own run.',
    status: 'running', stage: 3, shown: 3, started: now - 6 * 60000, severity: 'High',
    window: 'Last 30d', scope: 'all endpoints', endpoints: HY_ENDPOINTS,
    verdict: 'threat', conf: 'High',
    summary: ['2 finance hosts run scheduled tasks created by a non-admin that launch encoded PowerShell beaconing every 30 min.'],
    hypothesis: 'A scheduled task that a non-administrator creates, that carries an encoded payload and that talks to a host almost nobody else talks to, is persistence placed by an adversary.',
    hyps: [
      { id: 'H1', text: 'Non-admin creates schtasks with encoded payload', result: 'supported', note: 'j.smith created 3 tasks on 2 hosts. All start encoded PowerShell.' },
      { id: 'H2', text: 'Tasks registered remotely via ATSVC', result: 'not', note: 'No remote registration. The tasks were created in a local session.' },
      { id: 'H3', text: 'Task actions beacon to rare hosts', result: 'supported', note: 'One destination, 2 hosts in the fleet, every 30 minutes.' }
    ],
    questions: [
      q('Q1', 'H1', 'Which hosts created tasks with -enc?', 'xdr_data', String.raw`dataset = xdr_data | filter
action_process_image_command_line contains "-enc" and
action_process_image_name = "schtasks.exe"
| fields agent_hostname, actor_effective_username, action_process_image_command_line, _time`, 3, '3 task creations on FIN-WS-22 and FIN-WS-31.'),
      q('Q2', 'H1', 'Who created them?', 'identity', String.raw`dataset = xdr_data
| filter action_process_image_name = "schtasks.exe" and agent_hostname in ("FIN-WS-22", "FIN-WS-31")
| comp count() as tasks by actor_effective_username`, 1, 'One account: j.smith.'),
      q('Q3', 'H2', 'Remote ATSVC registration?', 'rpc', String.raw`dataset = xdr_data
| filter event_type = ENUM.RPC_CALL and action_rpc_interface_name = "ATSVC"
| filter agent_hostname in ("FIN-WS-22", "FIN-WS-31")`, 0, 'None.'),
      q('Q4', 'H1', 'Is j.smith an administrator on those hosts?', 'identity', String.raw`dataset = pan_dss_raw
| filter sam_account_name = "j.smith"
| fields member_of, user_account_control`, 1, 'No. A standard user in Finance, with no local admin group.'),
      q('Q5', 'H1', 'What do the task actions run?', 'xdr_data', String.raw`dataset = xdr_data
| filter causality_actor_process_command_line contains "Schedule"
    and agent_hostname in ("FIN-WS-22", "FIN-WS-31")
| filter action_process_image_name = "powershell.exe"
| comp count() as starts by action_process_image_command_line`, 2, 'powershell.exe -w hidden -enc … on both hosts. The decoded script downloads and runs a second stage.'),
      q('Q6', 'H3', 'Where do the task actions connect?', 'xdr_data', String.raw`dataset = xdr_data
| filter event_type = ENUM.NETWORK and actor_process_image_name = "powershell.exe"
    and agent_hostname in ("FIN-WS-22", "FIN-WS-31")
| comp count() as connections by action_remote_ip, dst_action_external_hostname`, 96, '96 connections, all to one address: 185.213.154.77.'),
      q('Q7', 'H3', 'How many hosts in the fleet talk to that address?', 'xdr_data', String.raw`dataset = xdr_data
| filter event_type = ENUM.NETWORK and action_remote_ip = "185.213.154.77"
| comp count_distinct(agent_hostname) as hosts`, 1, `2 of ${HY_ENDPOINTS.toLocaleString()}. Only the two finance hosts.`),
      q('Q8', 'H3', 'How regular are the connections?', 'xdr_data', String.raw`dataset = xdr_data
| filter event_type = ENUM.NETWORK and action_remote_ip = "185.213.154.77"
| bin _time span = 30m
| comp count() as connections by _time, agent_hostname`, 96, 'One connection every 30 minutes, day and night. A person does not work like that.'),
      q('Q9', 'H2', 'Were the tasks registered from another host over SMB?', 'xdr_data', String.raw`dataset = xdr_data
| filter event_type = ENUM.FILE and action_file_path contains "\\Windows\\System32\\Tasks\\"
    and actor_process_image_name = "System" and action_remote_ip != null
| filter agent_hostname in ("FIN-WS-22", "FIN-WS-31")`, 0, 'None. H2 is not supported.'),
      q('Q10', 'H1', 'Does any other host have the same task name or payload?', 'xdr_data', String.raw`dataset = xdr_data
| filter action_process_image_command_line contains "OneDriveSyncHelper"
    or action_process_image_command_line contains "JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA"
| comp count_distinct(agent_hostname) as hosts`, 1, 'No. It stops at the two hosts.'),
      q('Q11', 'H1', 'When did it start?', 'xdr_data', String.raw`dataset = xdr_data
| filter action_process_image_name = "schtasks.exe" and action_process_image_command_line contains "OneDriveSyncHelper"
| comp min(_time) as first_seen by agent_hostname`, 2, `First seen ${hyDate(first)} on FIN-WS-22, the next day on FIN-WS-31.`)
    ],
    sources: { queried: ['xdr_data (process, network, file, RPC)', 'identity (directory sync)'], missing: [['Email logs for j.smith', 'Would show how the first script arrived. The source is not connected']] },
    logged: { facts: 47, entities: 9, tokens: 386000 },
    findings: [{ id: 'F1', isNew: true, sev: 'High', title: 'encoded PowerShell persistence on 2 finance hosts',
      text: 'The account j.smith, a standard user, created 3 scheduled tasks named OneDriveSyncHelper on 2 finance workstations. Each task starts hidden, encoded PowerShell that connects to one outside address every 30 minutes.',
      assets: ['FIN-WS-22', 'FIN-WS-31'], user: 'j.smith', first, hyp: 'H1', qs: ['Q1', 'Q2'], sets: ['xdr', 'identity'] }],
    issue: { id: '981304', by: 'auto', state: 'Open',
      ai: 'Two finance workstations run a scheduled task that a standard user created. The task starts encoded PowerShell and calls one outside address every 30 minutes. This is working persistence with a live command channel.',
      evidence: [['Hosts', 'FIN-WS-22, FIN-WS-31'], ['User', 'j.smith (standard user, Finance)'], ['Task', 'OneDriveSyncHelper, runs every 30 minutes'], ['Action', 'powershell.exe -w hidden -enc …'], ['Destination', '185.213.154.77, seen from 2 hosts only'], ['First seen', hyDate(first)]],
      steps: [['Isolate FIN-WS-22 and FIN-WS-31', 'Cuts the command channel.', 'shield-off'], ['Block 185.213.154.77 at the firewall', 'For every host, not only these two.', 'ban'], ['Reset the password of j.smith and end the sessions', 'The account created the tasks.', 'key-round'], ['Delete the 3 OneDriveSyncHelper tasks', 'Removes the persistence.', 'trash-2']],
      case: { id: 'CASE-4502', mode: 'joined', why: 'An open case already holds a phishing issue for j.smith on FIN-WS-22. The entities overlap, so the grouping engine added this issue to it.' } },
    detection: { id: `DET-HNT-SCHTASK-ENCODED-${hyId(now, 1).slice(4, 12)}-HNT-001`, isNew: true, kind: 'Correlation rule', name: 'A standard user creates a scheduled task that starts encoded PowerShell',
      xql: String.raw`dataset = xdr_data
| filter action_process_image_name = "schtasks.exe"
    and action_process_image_command_line contains "/create"
| filter action_process_image_command_line ~= "(?i)powershell.+-e(nc|ncodedcommand)?\s"
| filter actor_effective_username not in ($local_admins)` },
    report: h => [
      ['h', 'Purpose and trigger'], ['p', h.triggerText + ' The August hunt showed that the autorun inventory cannot see task arguments. This run reads process events, where the full command line is recorded.'],
      ['h', 'Scope'], ['p', `${h.window}, ${h.scope} (${h.endpoints.toLocaleString()}). Windows scheduled tasks only.`],
      ['h', 'Hypotheses'], ['ul', h.hyps.map(x => `**${x.id}** ${x.text}. ${{ supported: 'Supported', not: 'Not supported', partial: 'Supported in part' }[x.result]}. ${x.note}`)],
      ['h', `Finding ${h.findings[0].id}: ${h.findings[0].title}`], ['note', 'rose', 'High · confirmed by three independent facts'], ['p', h.findings[0].text],
      ['table', ['Fact', 'Value'], h.issue.evidence],
      ['p', 'Why the confidence is high. Each fact alone has an innocent reading. A user can create a task. An IT script can be encoded. A rare address can be a new vendor. Together they do not: a standard user in Finance has no reason to create a hidden, encoded task that calls an address nobody else in the company uses, every 30 minutes, at night.'],
      ['h', 'Timeline'], ['ul', [`**${hyDate(h.findings[0].first)}** first task created on FIN-WS-22.`, `**${hyDate(h.findings[0].first + HY_DAY)}** same task created on FIN-WS-31.`, '**Since then** one connection every 30 minutes from each host.', `**${hyDate(h.ended || Date.now())}** found by this hunt.`]],
      ['h', 'What was ruled out'], ['p', 'The tasks were not pushed from another machine. There is no remote registration over ATSVC and no task file written over SMB. So this is not lateral movement into these hosts, at least not by this route. No other host has the task name or the payload.'],
      ['h', 'Limits'], ['p', 'Email logs are not connected, so the hunt cannot say how the first script reached j.smith. The open phishing case on FIN-WS-22 is the most likely answer, and the issue joined that case.'],
      ['h', 'Recommended next steps'], ['ul', h.issue.steps.map(s => `**${s[0]}.** ${s[1]}`)],
      ['h', 'Detection created'], ['p', `\`${h.detection.id}\` · ${h.detection.kind}. ${h.detection.name}. The August detection looks for a script path in the command line. An encoded command has no path, so it needs a rule of its own.`], ['code', h.detection.xql]
    ]
  };
}

/* ---------- the rotation: what the agent hunts for, technique by technique ---------- */
const HY_LIB = [
  { k: 'lsass', title: 'LSASS memory read by tools that are not security products', tech: 'T1003.001', techName: 'LSASS Memory', tactic: 'Credential Access', tested: 'whether a process that is not a security product opened LSASS memory',
    hyp: 'A process that opens LSASS with read access and is not a known security or backup product is dumping credentials.',
    qs: [['Which processes opened lsass.exe with read access?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.INJECTION and action_remote_process_image_name = "lsass.exe"\n| comp count() as opens, count_distinct(agent_hostname) as hosts by actor_process_image_name, actor_process_signature_vendor'], ['Which of them are unsigned or rare?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.INJECTION and action_remote_process_image_name = "lsass.exe"\n| filter actor_process_signature_status != ENUM.SIGNED\n| comp count_distinct(agent_hostname) as hosts by actor_process_image_sha256'], ['Was a dump file written afterwards?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.FILE and action_file_extension in ("dmp", "bin")\n| filter action_file_size > 30000000\n| fields agent_hostname, actor_process_image_name, action_file_path']] },
  { k: 'lolbin', title: 'Office apps launching living-off-the-land binaries', tech: 'T1218', techName: 'System Binary Proxy Execution', tactic: 'Defense Evasion', tested: 'whether an Office app started a Windows binary that can run code from the internet',
    hyp: 'An Office application that starts mshta, regsvr32, rundll32 or certutil is running a malicious document.',
    qs: [['Which Office apps started a LOLBin?', 'xdr_data', 'dataset = xdr_data\n| filter actor_process_image_name in ("winword.exe", "excel.exe", "powerpnt.exe", "outlook.exe")\n| filter action_process_image_name in ("mshta.exe", "regsvr32.exe", "rundll32.exe", "certutil.exe")\n| fields agent_hostname, actor_effective_username, action_process_image_command_line'], ['Did the child process reach the internet?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.NETWORK and actor_process_image_name in ("mshta.exe", "regsvr32.exe")\n| comp count() as connections by agent_hostname, action_remote_ip'], ['Which document was open at that moment?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.FILE and actor_process_image_name = "winword.exe"\n| filter action_file_extension in ("docm", "doc", "rtf")\n| fields agent_hostname, action_file_path, _time']],
    hit: { conf: 'High', sev: 'High', title: 'Word launching mshta.exe on 2 finance workstations', text: 'Word started mshta.exe with a remote URL on 2 finance workstations, minutes after each user opened the same invoice document.', assets: ['FIN-WS-08', 'FIN-WS-14'], user: 'm.cohen, d.levi', steps: [['Isolate the 2 workstations', 'Stops the second stage.', 'shield-off'], ['Block the URL and the document hash', 'For every user.', 'ban']], det: 'Office application starts mshta.exe with a remote URL', sum: 'Word started mshta.exe with a remote URL on 2 finance workstations, minutes after each user opened the same invoice document. The pattern is repeatable, so it was handed to the Detection Engineer as a new rule.' } },
  { k: 'dormant', title: 'Dormant admin accounts waking up', tech: 'T1078', techName: 'Valid Accounts', tactic: 'Initial Access', tested: 'whether a privileged account that was silent for 90 days signed in again',
    hyp: 'A privileged account with no sign-in for 90 days that suddenly signs in was taken over.',
    qs: [['Which privileged accounts were silent for 90 days?', 'identity', 'dataset = pan_dss_raw\n| filter admin_count = 1 and last_logon_timestamp < to_timestamp(subtract(to_epoch(current_time()), 7776000))\n| fields sam_account_name, last_logon_timestamp'], ['Did any of them sign in during the window?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.EVENT_LOG and action_evtlog_event_id = 4624\n| filter action_evtlog_username in ($dormant_admins)\n| comp count() as logons by action_evtlog_username, agent_hostname'], ['From where, and at what hour?', 'xdr_data', 'dataset = xdr_data\n| filter action_evtlog_event_id = 4624 and action_evtlog_username in ($dormant_admins)\n| fields action_evtlog_username, action_remote_ip, _time']],
    hit: { conf: 'High', sev: 'High', title: 'svc_legacy signed in at 03:12 after 214 silent days', text: 'The service account svc_legacy, a domain admin with no sign-in for 214 days, signed in at 03:12 from a workstation that never used it.', assets: ['DC-02', 'ENG-WS-41'], user: 'svc_legacy', steps: [['Disable svc_legacy', 'Nothing has used it for 214 days.', 'user-x'], ['Review what it did after 03:12', 'It is a domain admin.', 'search']], sum: 'The service account svc_legacy, a domain admin with no sign-in for 214 days, signed in at 03:12 from a workstation that never used it before.' } },
  { k: 'dns', title: 'DNS beacons to newly registered domains', tech: 'T1071.004', techName: 'DNS', tactic: 'Command and Control', tested: 'whether a host queries a domain younger than 30 days at a fixed rhythm',
    hyp: 'A host that resolves a newly registered domain at a regular interval is beaconing.',
    qs: [['Which newly registered domains were resolved?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.STORY and dns_query_name != null\n| join type = inner (dataset = domain_age | filter age_days < 30) as d d.domain = dns_query_name\n| comp count() as queries, count_distinct(agent_hostname) as hosts by dns_query_name'], ['Is the rhythm regular?', 'xdr_data', 'dataset = xdr_data\n| filter dns_query_name in ($young_domains)\n| bin _time span = 10m\n| comp count() as queries by _time, agent_hostname, dns_query_name'], ['Which process asked?', 'xdr_data', 'dataset = xdr_data\n| filter dns_query_name in ($young_domains)\n| comp count() as queries by actor_process_image_name, actor_process_signature_vendor']] },
  { k: 'pipes', title: 'Cobalt Strike default named pipes', tech: 'T1559', techName: 'Inter-Process Communication', tactic: 'Execution', trigger: 'intel', tested: 'whether any process created a named pipe that matches Cobalt Strike defaults',
    hyp: 'A named pipe that matches a Cobalt Strike default pattern means a beacon runs on the host.',
    qs: [['Which named pipes match the known patterns?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.FILE and action_file_path ~= "\\\\\\\\.\\\\pipe\\\\(msagent_|MSSE-|postex_|status_|mojo\\.5688)"\n| comp count() as pipes by agent_hostname, actor_process_image_name, action_file_path'], ['Which process created them?', 'xdr_data', 'dataset = xdr_data\n| filter action_file_path contains "\\\\pipe\\\\" and actor_process_image_name in ("rundll32.exe", "dllhost.exe", "svchost.exe")\n| fields agent_hostname, actor_process_image_command_line'], ['Any SMB connection to those pipes from another host?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.NETWORK and action_remote_port = 445\n| filter action_file_path ~= "(msagent_|MSSE-|postex_)"']] },
  { k: 'oauth', title: 'Risky OAuth grants in Microsoft 365', tech: 'T1528', techName: 'Steal Application Access Token', tactic: 'Credential Access', tested: 'whether a user granted mail or file access to an unverified app',
    hyp: 'An unverified app that receives consent to read mail or files is a token-theft attempt.',
    qs: [['Which apps received consent in the window?', 'msft_azure_ad_audit_raw', 'dataset = msft_azure_ad_audit_raw\n| filter activityDisplayName = "Consent to application"\n| fields initiatedBy, targetResources, _time'], ['Which of them ask for mail or file scopes?', 'msft_azure_ad_audit_raw', 'dataset = msft_azure_ad_audit_raw\n| filter activityDisplayName = "Add delegated permission grant"\n| filter to_string(targetResources) ~= "(Mail\\.Read|Files\\.ReadWrite|offline_access)"'], ['Is the publisher verified?', 'msft_azure_ad_raw', 'dataset = msft_azure_ad_raw\n| filter appId in ($consented_apps)\n| fields appDisplayName, verifiedPublisher, createdDateTime']] },
  { k: 'rdp', title: 'RDP reachable from the internet', tech: 'T1133', techName: 'External Remote Services', tactic: 'Initial Access', tested: 'whether any host accepted an RDP session from a public address',
    hyp: 'An RDP session that starts from a public address shows an exposed host that an attacker can reach.',
    qs: [['Which hosts accepted RDP from a public address?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.NETWORK and action_local_port = 3389 and action_network_is_server = true\n| filter incidr(action_remote_ip, "10.0.0.0/8") = false and incidr(action_remote_ip, "172.16.0.0/12") = false\n| comp count() as sessions by agent_hostname, action_remote_ip'], ['Did a sign-in succeed?', 'xdr_data', 'dataset = xdr_data\n| filter action_evtlog_event_id = 4624 and action_evtlog_logon_type = 10\n| comp count() as logons by agent_hostname, action_evtlog_username, action_remote_ip'], ['What does the firewall say about those hosts?', 'panw_ngfw_traffic_raw', 'dataset = panw_ngfw_traffic_raw\n| filter dest_port = 3389 and from_zone = "untrust" and action = "allow"\n| comp count() as sessions by dest_ip, rule_matched']] },
  { k: 'kerb', title: 'Kerberoasting: bursts of RC4 service tickets', tech: 'T1558.003', techName: 'Kerberoasting', tactic: 'Credential Access', tested: 'whether one account asked for many RC4 service tickets in a short time',
    hyp: 'One account that requests RC4 tickets for many services within minutes is collecting hashes to crack offline.',
    qs: [['Who asked for RC4 service tickets?', 'xdr_data', 'dataset = xdr_data\n| filter action_evtlog_event_id = 4769 and action_evtlog_ticket_encryption_type = "0x17"\n| comp count_distinct(action_evtlog_service_name) as services by action_evtlog_username, action_remote_ip'], ['How many services in 10 minutes?', 'xdr_data', 'dataset = xdr_data\n| filter action_evtlog_event_id = 4769 and action_evtlog_ticket_encryption_type = "0x17"\n| bin _time span = 10m\n| comp count_distinct(action_evtlog_service_name) as services by _time, action_evtlog_username\n| filter services > 10'], ['Is the source a host that normally does this?', 'xdr_data', 'dataset = xdr_data\n| filter action_evtlog_event_id = 4769\n| comp count() as requests by action_remote_ip\n| sort desc requests']] },
  { k: 'wmi', title: 'WMI event subscription persistence', tech: 'T1546.003', techName: 'WMI Event Subscription', tactic: 'Persistence', tested: 'whether a new WMI event consumer starts a command or a script',
    hyp: 'A new CommandLineEventConsumer or ActiveScriptEventConsumer that no management product owns is persistence.',
    qs: [['Which event consumers were created?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.EVENT_LOG and action_evtlog_provider_name = "Microsoft-Windows-WMI-Activity"\n| filter action_evtlog_event_id = 5861\n| fields agent_hostname, action_evtlog_message'], ['What does each consumer run?', 'xdr_data', 'dataset = xdr_data\n| filter actor_process_image_name = "wmiprvse.exe" or actor_process_image_name = "scrcons.exe"\n| comp count() as starts by action_process_image_name, action_process_image_command_line'], ['Which management products own them?', 'xdr_data', 'dataset = xdr_data\n| filter actor_process_image_name = "scrcons.exe"\n| comp count_distinct(agent_hostname) as hosts by actor_process_signature_vendor']] },
  { k: 'rundll', title: 'rundll32 started with no arguments', tech: 'T1218.011', techName: 'Rundll32', tactic: 'Defense Evasion', tested: 'whether rundll32 ran with an empty command line and then opened a connection',
    hyp: 'rundll32 with no arguments has no legitimate use and is a common host for injected code.',
    qs: [['Where did rundll32 start with no arguments?', 'xdr_data', 'dataset = xdr_data\n| filter action_process_image_name = "rundll32.exe"\n| filter action_process_image_command_line ~= "rundll32(\\.exe)?\\"?\\s*$"\n| comp count() as starts by agent_hostname, actor_process_image_name'], ['Did it open a network connection?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.NETWORK and actor_process_image_name = "rundll32.exe"\n| filter actor_process_command_line ~= "rundll32(\\.exe)?\\"?\\s*$"\n| comp count() as connections by agent_hostname, action_remote_ip'], ['Who is the parent?', 'xdr_data', 'dataset = xdr_data\n| filter action_process_image_name = "rundll32.exe"\n| comp count() as starts by causality_actor_process_image_name, causality_actor_process_signature_vendor']] },
  { k: 'travel', title: 'Impossible travel on privileged identities', tech: 'T1078.004', techName: 'Cloud Accounts', tactic: 'Initial Access', tested: 'whether a privileged identity signed in from two far places within an hour',
    hyp: 'Two sign-ins of one privileged identity from places too far apart to travel between mean a stolen session.',
    qs: [['Which privileged identities signed in from 2 countries in one hour?', 'msft_azure_ad_raw', 'dataset = msft_azure_ad_raw\n| filter userPrincipalName in ($privileged)\n| bin _time span = 1h\n| comp count_distinct(location_countryOrRegion) as countries by _time, userPrincipalName\n| filter countries > 1'], ['Was one of the two a known VPN exit?', 'msft_azure_ad_raw', 'dataset = msft_azure_ad_raw\n| filter userPrincipalName in ($suspects)\n| fields userPrincipalName, ipAddress, autonomousSystemNumber, location_city'], ['Did MFA pass on both?', 'msft_azure_ad_raw', 'dataset = msft_azure_ad_raw\n| filter userPrincipalName in ($suspects)\n| fields authenticationRequirement, status_errorCode, conditionalAccessStatus']] },
  { k: 'stage', title: 'Data staged in archives before upload', tech: 'T1560.001', techName: 'Archive via Utility', tactic: 'Collection', tested: 'whether a host built a large archive and uploaded it within the hour',
    hyp: 'A large archive created by a command-line tool and followed by an upload to an outside service is staging for exfiltration.',
    qs: [['Which hosts built archives larger than 500 MB?', 'xdr_data', 'dataset = xdr_data\n| filter actor_process_image_name in ("7z.exe", "rar.exe", "tar.exe", "zip")\n| filter event_type = ENUM.FILE and action_file_size > 500000000\n| fields agent_hostname, actor_effective_username, action_file_path, action_file_size'], ['Was there a large upload in the next hour?', 'panw_ngfw_traffic_raw', 'dataset = panw_ngfw_traffic_raw\n| filter bytes_sent > 500000000 and to_zone = "untrust"\n| comp sum(bytes_sent) as sent by source_ip, app, dest_ip'], ['Is the destination a sanctioned service?', 'panw_ngfw_url_raw', 'dataset = panw_ngfw_url_raw\n| filter source_ip in ($archive_hosts)\n| comp count() as requests by url_domain, url_category']] },
  { k: 'ssh', title: 'SSH authorized_keys changed on servers', tech: 'T1098.004', techName: 'SSH Authorized Keys', tactic: 'Persistence', tested: 'whether a key was added to authorized_keys outside configuration management',
    hyp: 'A new key in authorized_keys that the configuration management tool did not write is a backdoor.',
    qs: [['Which authorized_keys files changed?', 'xdr_data', 'dataset = xdr_data\n| filter event_type = ENUM.FILE and action_file_name = "authorized_keys"\n| filter event_sub_type in (ENUM.FILE_WRITE, ENUM.FILE_CREATE_NEW)\n| fields agent_hostname, actor_process_image_name, actor_effective_username, action_file_path'], ['Which process wrote them?', 'xdr_data', 'dataset = xdr_data\n| filter action_file_name = "authorized_keys"\n| comp count() as writes by actor_process_image_name, causality_actor_process_image_name'], ['Was the key used to sign in afterwards?', 'xdr_data', 'dataset = xdr_data\n| filter action_process_image_name = "sshd" and action_process_image_command_line contains "publickey"\n| comp count() as logons by agent_hostname, action_remote_ip']] },
  { k: 'esxi', title: 'BlackSuit tooling on ESXi hosts', tech: 'T1486', techName: 'Data Encrypted for Impact', tactic: 'Impact', trigger: 'intel', tested: 'whether the commands this group runs before encryption appear on the ESXi hosts',
    hyp: 'The group stops virtual machines with esxcli and vim-cmd before it encrypts. Those commands in a burst, from a new session, mean the attack has started.',
    qs: [['Were virtual machines stopped in a burst?', 'vmware_esxi_raw', 'dataset = vmware_esxi_raw\n| filter message ~= "(esxcli vm process kill|vim-cmd vmsvc/power.off)"\n| bin _time span = 5m\n| comp count() as kills by _time, hostname'], ['Did a new SSH session start on an ESXi host?', 'vmware_esxi_raw', 'dataset = vmware_esxi_raw\n| filter message contains "Accepted password for root"\n| fields hostname, message, _time'], ['Were the known file names written to a datastore?', 'vmware_esxi_raw', 'dataset = vmware_esxi_raw\n| filter message ~= "(README\\.BlackSuit\\.txt|\\.blacksuit$)"']] }
];

/* ---------- the world ---------- */
/* One hunt from the rotation. o.hit: this run found something. o.running: it starts now and has no result yet. */
function hyMake(t, o) {
  const ri = o.ri, at = o.at, hit = o.hit || null, trig = o.trig || t.trigger || 'rotation';
  const rows = t.qs.map(() => hit ? 2 + ri(40) : ri(4) === 0 ? 0 : 1 + ri(180)), dur = 9 + ri(34);
  const h = { id: hyId(at, o.seq), lib: t.k, title: t.title, tech: t.tech, techName: t.techName, tactic: t.tactic,
    trigger: trig, triggerText: { rotation: `${t.tactic} is part of the 30-day rotation.`, intel: 'A new threat report named this technique.', manual: 'An analyst asked for this hunt.', handoff: 'The Investigation Agent saw this in a case and asked to check the whole fleet.' }[trig],
    status: 'done', stage: 5, started: at - dur * 60000, ended: at, severity: hit ? hit.sev : 'Low',
    window: 'Last 30d', scope: 'all endpoints', endpoints: HY_ENDPOINTS, verdict: hit ? 'threat' : 'clear', conf: hit ? hit.conf : rows.every(r => r === 0) ? 'High' : ['High', 'High', 'Medium'][ri(3)],
    hypothesis: t.hyp, hyps: [{ id: 'H1', text: t.hyp, result: hit ? 'supported' : 'not', note: hit ? hit.title + '.' : 'Nothing that the rows returned supports it.' }],
    questions: t.qs.map((x, i) => ({ id: 'Q' + (i + 1), hyp: 'H1', q: x[0], dataset: x[1], xql: x[2], rows: rows[i], note: rows[i] === 0 ? 'Nothing matched.' : hit && i === 0 ? hit.title + '.' : `${rows[i]} row${rows[i] === 1 ? '' : 's'}, all explained by known software or known people.` })),
    sources: { queried: [...new Set(t.qs.map(x => x[1]))], missing: [] }, logged: { facts: 6 + ri(40), entities: 2 + ri(30), tokens: (90 + ri(520)) * 1000 },
    findings: [], issue: null, detection: null, tested: t.tested, report: hyPlainReport };
  if (hit) {
    h.findings = [{ id: 'F1', isNew: false, sev: hit.sev, title: hit.title, text: hit.text, assets: hit.assets, user: hit.user, first: at - (2 + ri(9)) * HY_DAY, hyp: 'H1', qs: ['Q1', 'Q2'], sets: h.sources.queried.map(s => s.replace(/_raw$|_data$/, '')) }];
    h.issue = { id: String(960000 + ri(18000)), by: ri(2) ? 'auto' : 'analyst', opened: at + 60000, state: 'Resolved', ai: hit.sum, evidence: [['Hosts', hit.assets.join(', ')], ['User', hit.user], ['First seen', hyDate(h.findings[0].first)]], steps: hit.steps, stepsDone: hit.steps.map(() => true), case: { id: 'CASE-' + (4100 + ri(280)), mode: ri(2) ? 'new' : 'joined', why: 'Grouped by the hosts and the user.' } };
    if (hit.det) h.detection = { id: `DET-HNT-${t.k.toUpperCase()}-${h.id.slice(4)}`, isNew: false, kind: 'Correlation rule', name: hit.det, xql: t.qs[0][2] };
  }
  h.summary = [hit ? hit.sum : `A 30-day hunt across all ${HY_ENDPOINTS.toLocaleString()} endpoints tested ${t.tested}. ${h.questions.length} queries returned ${rows.reduce((a, b) => a + b, 0).toLocaleString()} rows, and every one is explained by known software or known people. No issue was opened. The hunt stays in the list as proof that this technique was checked.`];
  if (o.running) { h.status = 'running'; h.stage = 0; h.shown = 0; h.started = at; h.ended = null; }
  return h;
}
function hyWorld() {
  const now = Date.now(), rnd = mulberry32(41), ri = n => Math.floor(rnd() * n);
  const hero = hyHero(), live = hyLive(now);
  const hunts = [live, hero], per = { [new Date(hero.ended).toDateString()]: 1, [new Date(now).toDateString()]: 1 };
  /* A hunt every day or two, back past the hero's month. */
  let n = 0;
  for (let day = 1; day <= 64; day += 1 + ri(3)) {
    const t = HY_LIB[n % HY_LIB.length], at = now - day * HY_DAY - ri(9) * 36e5, key = new Date(at).toDateString();
    per[key] = (per[key] || 0) + 1;
    /* A technique finds something once: the first time the rotation reaches it. */
    const hit = t.hit && day > 6 && !hunts.some(h => h.lib === t.k && h.verdict === 'threat') ? t.hit : null;
    hunts.push(hyMake(t, { at, seq: per[key], hit, ri, trig: t.trigger || (ri(7) === 0 ? 'manual' : ri(9) === 0 ? 'handoff' : 'rotation') }));
    n++;
  }
  /* Hunts a person can start from the list. */
  return { hunts, per, ri, queue: ['pipes', 'kerb', 'ssh'], autoIssue: true, log: [] };
}
/* A person starts a hunt from the list. It runs like any other and ends with a report. */
function hyStart(W, k) {
  const t = HY_LIB.find(x => x.k === k), now = Date.now(), key = new Date(now).toDateString();
  W.per[key] = (W.per[key] || 0) + 1;
  const h = hyMake(t, { at: now, seq: W.per[key], ri: W.ri, trig: 'manual', running: true });
  W.hunts.unshift(h); W.queue = W.queue.filter(x => x !== k);
  return h;
}
/* One step of a running hunt: the next stage, or the next query. Returns true when the hunt just finished. */
function hyStep(W, h) {
  if (h.status !== 'running') return false;
  if (h.stage < 3) { h.stage++; return false; }
  if (h.stage === 3 && h.shown < h.questions.length) { h.shown++; return false; }
  if (h.stage < 5) { h.stage++; if (h.stage < 5) return false; }
  h.status = 'done'; h.ended = Date.now();
  if (h.verdict === 'threat' && W.autoIssue) hyOpenIssue(W, h, 'auto');
  return true;
}
/* No threat found, and a person still wants it looked at: the same issue, opened by hand. */
function hyEscalate(W, h) {
  if (h.issue) return hyOpenIssue(W, h, 'analyst');
  h.issue = { id: String(981400 + W.ri(500)), by: 'analyst', state: 'Open', ai: `Escalated by an analyst from a hunt that ended with No threat found. ${h.summary[0]}`, evidence: [['Hunt', h.id], ['Technique', `${h.tech} ${h.techName}`], ['Queries', String(h.questions.length)]], steps: [['Review the hunt queries and their rows', 'The agent explained every row. Check that you agree.', 'search']], case: { id: 'CASE-' + (4510 + W.ri(80)), mode: 'new', why: 'No open case shares these entities, so the grouping engine opened a new case.' } };
  h.escalated = true;
  return hyOpenIssue(W, h, 'analyst');
}
function hyPlainReport(h) {
  const f = h.findings[0];
  return [
    ['h', 'Purpose and trigger'], ['p', `${h.triggerText} ${h.tech} ${h.techName}.`],
    ['h', 'Scope'], ['p', `${h.window}, ${h.scope} (${h.endpoints.toLocaleString()}).`],
    ['h', 'Hypothesis'], ['p', h.hypothesis],
    ['h', 'Method'], ['ul', h.questions.map(q => `**${q.id}** ${q.q} Read from \`${q.dataset}\`.`)],
    ['h', 'Results'], ['table', ['Question', 'Rows', 'Result'], h.questions.map(q => [q.id + ' · ' + q.q, q.rows.toLocaleString(), q.note])],
    ...(f ? [['h', `Finding ${f.id}: ${f.title}`], ['note', 'rose', `${f.sev} · issue ${h.issue.id} · ${h.issue.case.id}`], ['p', f.text], ['table', ['Fact', 'Value'], h.issue.evidence], ['h', 'Recommended next steps'], ['ul', h.issue.steps.map(s => `**${s[0]}.** ${s[1]}`)]]
      : [['h', 'Outcome'], ['p', 'No threat found. No issue was opened. This is a statement about the queries above and the data they could read, for this window. It is not a statement that the technique cannot happen here.']]),
    ['h', 'Data sources'], ['p', 'Queried: ' + h.sources.queried.map(s => '`' + s + '`').join(', ') + '. None was unavailable.']
  ];
}

/* ---------- what the screens count ---------- */
const hyRunning = W => W.hunts.filter(h => h.status === 'running');
const hyIssues = W => W.hunts.filter(h => h.status === 'done' && h.issue && h.issue.opened);
function hyStats(W) {
  const since = Date.now() - 30 * HY_DAY, done = W.hunts.filter(h => h.status === 'done'), d30 = done.filter(h => h.ended >= since);
  const techAll = new Set(HY_LIB.map(t => t.tech).concat(W.hunts.map(h => h.tech))), tech30 = new Set(W.hunts.filter(h => h.status === 'running' || h.ended >= since).map(h => h.tech));
  const iss = hyIssues(W);
  return { total: W.hunts.length, running: hyRunning(W).length, done: done.length, d30: d30.length, threat30: d30.filter(h => h.verdict === 'threat').length, clear30: d30.filter(h => h.verdict === 'clear').length,
    threat: done.filter(h => h.verdict === 'threat').length, clear: done.filter(h => h.verdict === 'clear').length,
    techAll: techAll.size, tech30: tech30.size, issues: iss.length, issuesOpen: iss.filter(h => h.issue.state === 'Open').length, cases: new Set(iss.map(h => h.issue.case.id)).size,
    detections: W.hunts.filter(h => h.status === 'done' && h.detection).length, queries: done.reduce((n, h) => n + h.questions.length, 0),
    waiting: done.filter(h => h.verdict === 'threat' && !(h.issue && h.issue.opened)).length };
}
/* What happens when a report says Threat found: one issue, then the grouping engine decides the case. */
function hyOpenIssue(W, h, by) {
  if (!h.issue || h.issue.opened) return false;
  h.issue.opened = Date.now(); h.issue.by = by;
  W.log.unshift({ t: Date.now(), text: `${h.id}: issue ${h.issue.id} opened ${by === 'auto' ? 'automatically' : 'by an analyst'}, ${h.issue.case.mode === 'new' ? 'new case ' : 'joined case '}${h.issue.case.id}` });
  return true;
}
