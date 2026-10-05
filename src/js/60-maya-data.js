/* ======================================================================
   SECOPS ENGINEERING · THE WORLD
   One source of truth. Every number on every screen is computed from the
   objects below, so the screens cannot disagree with each other.
   Rule names and screen layouts follow the real product screens. Volumes,
   people and failures are invented for the story.
   Two agents work this domain: the Detection Engineer (rules, indicators,
   coverage) and the Pipeline Engineer (filtering, parsing, normalizing).
   ====================================================================== */
const MY_LAYERS = [
  ['source', 'Data source', 'cable'], ['filter', 'Filter', 'filter'], ['parsing', 'Parsing', 'braces'],
  ['model', 'Data model', 'database'], ['routing', 'Routing', 'git-branch'], ['rule', 'Rule', 'file-code-2']
];
const MY_LAYER = Object.fromEntries(MY_LAYERS.map(([k, n, i]) => [k, { name: n, icon: i }]));
const MY_VERDICT = {
  Healthy: ['cx', 'Checked, nothing wrong'], Broken: ['rose', 'It cannot fire, or it fires on wrong data'], Noisy: ['amber', 'It fires too much'],
  Gap: ['indigo', 'Something that should be detected is not'], Mismatch: ['purple', 'XSIAM and the source product disagree'],
  Inconclusive: ['slate', 'Not enough evidence yet'], Leftover: ['slate', 'Disabled and unused'], Retired: ['slate', 'Disabled on an agent suggestion'], 'Not reviewed': ['slate', 'Not reviewed yet']
};
/* What the agent suggests doing. This is what the user sees: proactive, not a judgment. */
const MY_SUGGEST = {
  Fix: ['rose', 'Repair something that is broken: a source, a filter, a parsing rule or a mapping'],
  Tune: ['amber', 'Reduce noise without losing detections: a setting, an environment fact or the rule logic'],
  Adopt: ['cx', 'Add a new rule, or enable content that already exists'],
  Connect: ['cyan', 'Bring a data source that detections are waiting for'],
  Drop: ['purple', 'Disable or retire a rule or an indicator that no longer earns its place'],
  Watch: ['slate', 'Not enough evidence yet. No change, checked again later'],
  'Hand over': ['indigo', 'The fix belongs to another owner, such as the Cortex content team'],
  Keep: ['slate', 'Checked. Nothing to change']
};
const MY_CARD = {
  source: 'Missing data source', pipeline: 'Broken data or mapping', broken: 'Broken rule', noisy: 'Noisy rule',
  content: 'Existing content available', gap: 'Coverage gap', ioc: 'Indicator', retire: 'Rules to retire', settings: 'Rule settings', handover: 'Handed over', check: 'Third-party source check'
};
const MY_TRIGGER = { sweep: ['Scheduled sweep', 'clock'], change: ['Change event', 'git-commit-horizontal'], handoff: ['Handoff', 'corner-down-right'], human: ['Human request', 'user'] };

function myWorld() {
  const H = 3600000, D = 24 * H, now = Date.now();
  /* Every date in the story is counted back from now, so the texts and the timestamps always agree. */
  const day = ts => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const down = now - 46 * H, packDay = day(now - 2 * D), filterDay = day(now - 23 * D), keyDay = day(down), lastChance = day(down + 14 * D), recheck = day(now + 14 * D);
  const reviewDay = new Date(now + 182 * D).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* ---------- Data sources and their instances ---------- */
  const sources = [
    { id: 's3', name: 'Amazon S3', vendor: 'Amazon', cat: 'Cloud Services', pack: '', instances: [
      { id: 's3-lab', name: 'AWS research data lab', status: 'ok', count: 410800, last: now - 2 * 60000 },
      { id: 's3-audit', name: 'Cloud audit logs · production', status: 'err', count: 0, last: down, note: 'Access denied when reading the queue. The access key expired.' },
      { id: 's3-vpn', name: 'openvpn_log_collector', status: 'warn', count: 0, last: now - 440 * D, note: 'No events for more than a year. No detection depends on it.' },
      { id: 's3-demo', name: 'Prisma SA demo collector', status: 'off', count: 0, last: now - 175 * D, note: 'Disabled by an admin.' }] },
    { id: 'fortigate', name: 'Fortinet FortiGate', vendor: 'Fortinet', cat: 'Network Security', pack: '', instances: [
      { id: 'fg-1', name: 'HQ firewall cluster', status: 'ok', count: 1920000, last: now - 40000 }] },
    { id: 'crowdstrike', name: 'CrowdStrike Falcon', vendor: 'CrowdStrike', cat: 'Endpoint', pack: '', instances: [
      { id: 'cs-1', name: 'Falcon event stream', status: 'ok', count: 82400, last: now - 55000 }] },
    { id: 'unit42', name: 'Unit 42 Feed', vendor: 'Palo Alto Networks', cat: 'Data Enrichment & Threat Intelligence', pack: 'Update Available', instances: [
      { id: 'u42-1', name: 'Unit 42 indicators', status: 'ok', count: 77200, last: now - 9 * 60000 }] },
    { id: 'chrome', name: 'Google Chrome Enterprise', vendor: 'Google', cat: 'Browser', pack: '', instances: [
      { id: 'ch-1', name: 'Chrome reporting connector', status: 'ok', count: 35600, last: now - 70000 }] },
    { id: 'sentinelone', name: 'SentinelOne', vendor: 'SentinelOne', cat: 'Endpoint', pack: 'Updated ' + packDay, instances: [
      { id: 's1-1', name: 'SentinelOne XDR', status: 'ok', count: 12100, last: now - 30000 }] },
    { id: 'm365', name: 'Microsoft 365', vendor: 'Microsoft', cat: 'Email', pack: '', instances: [
      { id: 'm365-1', name: 'Audit logs · general', status: 'ok', count: 5100, last: now - 4 * 60000 },
      { id: 'm365-2', name: 'Audit logs · SharePoint', status: 'ok', count: 2300, last: now - 6 * 60000 }] },
    { id: 'mitre', name: 'MITRE ATT&CK', vendor: 'MITRE Corporation', cat: 'Data Enrichment & Threat Intelligence', pack: 'Update Available', instances: [
      { id: 'mi-1', name: 'ATT&CK feed', status: 'ok', count: 6500, last: now - 3 * H }] },
    { id: 'checkpoint', name: 'Check Point Threat Emulation', vendor: 'Check Point', cat: 'Network Security', pack: '', instances: [
      { id: 'cp-1', name: 'Threat Emulation verdicts', status: 'ok', count: 2300, last: now - 3 * 60000 }] },
    { id: 'dns', name: 'Infoblox DNS', vendor: 'Infoblox', cat: 'Network Security', pack: '', instances: [
      { id: 'dns-1', name: 'DNS query logs', status: 'ok', count: 890000, last: now - 20000 }] }
  ];

  /* ---------- Pipelines: source -> filter -> parsing -> data model -> destination ---------- */
  const pipes = [
    { id: 'p-s1', src: 'sentinelone', product: 'SentinelOne XDR', filter: null,
      parsing: { name: 'sentinelone_xdr', origin: 'Marketplace', text: '[INGEST:vendor="SentinelOne", product="XDR",\n target_dataset="sentinelone_xdr_raw", no_hit=keep]' },
      model: { name: 'SentinelOne model', origin: 'User defined', ok: false }, dest: ['Analytics', 'Data lake'] },
    { id: 'p-fg', src: 'fortigate', product: 'FortiGate traffic',
      filter: { name: 'Drop firewall deny (cost saving)', by: 'Dana L.', on: filterDay, ok: false },
      parsing: { name: 'fortinet_fortigate', origin: 'Default', text: '[INGEST:vendor="Fortinet", product="FortiGate",\n target_dataset="fortinet_fortigate_raw", no_hit=drop]' },
      model: { name: 'Fortinet model', origin: 'Default', ok: true }, dest: ['Analytics', 'Data lake'] },
    { id: 'p-aws', src: 's3', inst: 's3-audit', product: 'AWS audit logs', filter: null,
      parsing: { name: 'aws_audit', origin: 'Default', text: '[INGEST:vendor="Amazon", product="AWS",\n target_dataset="amazon_aws_raw", no_hit=drop]' },
      model: { name: 'AWS model', origin: 'Default', ok: true }, dest: ['Analytics', 'Data lake'] },
    { id: 'p-ch', src: 'chrome', product: 'Chrome events', filter: null,
      parsing: { name: 'google_chrome', origin: 'Marketplace', text: '[INGEST:vendor="Google", product="Chrome",\n target_dataset="google_chrome_raw", no_hit=keep]' },
      model: { name: 'Chrome model', origin: 'Marketplace', ok: true }, dest: ['Analytics'] },
    { id: 'p-cp', src: 'checkpoint', product: 'Threat Emulation', filter: null,
      parsing: { name: 'check_point_threat_emulation', origin: 'User defined', text: '[INGEST:vendor="Check Point", product="Threat Emulation",\n target_dataset="check_point_threat_emulation_raw", no_hit=drop]' },
      model: { name: 'Check Point model', origin: 'Default', ok: true }, dest: ['Analytics'] },
    { id: 'p-m365', src: 'm365', product: 'Microsoft 365 audit', filter: null,
      parsing: { name: 'msft_o365', origin: 'Default', text: '[INGEST:vendor="Microsoft", product="Office 365",\n target_dataset="msft_o365_general_raw", no_hit=keep]' },
      model: { name: 'Microsoft 365 model', origin: 'Default', ok: true }, dest: ['Analytics', 'Data lake'] },
    { id: 'p-dns', src: 'dns', product: 'DNS queries',
      filter: { name: 'Keep external lookups only', by: 'Ariel B.', on: 'Jun 2', ok: true },
      parsing: { name: 'infoblox_dns', origin: 'Marketplace', text: '[INGEST:vendor="Infoblox", product="DNS",\n target_dataset="infoblox_dns_raw", no_hit=drop]' },
      model: { name: 'DNS model', origin: 'Marketplace', ok: true }, dest: ['Analytics'] },
    { id: 'p-vpn', src: 's3', inst: 's3-vpn', product: 'OpenVPN logs', filter: null,
      parsing: { name: 'openvpn', origin: 'User defined', text: '[INGEST:vendor="OpenVPN", product="Access Server",\n target_dataset="openvpn_raw", no_hit=keep]' },
      model: null, dest: ['AWS archive bucket'] }
  ];

  /* ---------- Correlation rules ---------- */
  const U = n => ({ kind: 'user', name: n }), P = n => ({ kind: 'pack', name: n });
  const R = (id, name, o) => Object.assign({ id, name, type: 'REAL_TIME', status: 'Enabled', issues7d: 0, supp: null, tactic: '', tech: '', cat: 'User Defined', desc: '', mod: 'Aug 3rd 2026' }, o);
  const rules = [
    R(215, 'SentinelOne Threat', { pipe: 'p-s1', source: U('Dana L.'), issues7d: 412, mod: 'Aug 26th 2026', desc: 'SentinelOne Threats',
      xql: 'datamodel dataset = sentinelone_xdr_raw\n| filter xdm.event.type = "Threat"\n| fields *', sev: 'xdm.alert.severity', issueName: '$xdm.alert.original_threat_name on $xdm.source.host.hostname' }),
    R(216, 'SentinelOne - Threats (BETA)', { pipe: 'p-s1', source: P('SentinelOne'), status: 'Disabled', cat: 'Other', mod: 'Aug 26th 2026', desc: 'Generates alerts from threat events detected by the SentinelOne agent',
      xql: 'dataset = sentinelone_xdr_raw\n| filter event_type = "threat"\n| fields *' }),
    R(217, 'SentinelOne Alert', { pipe: 'p-s1', source: U('Dana L.'), issues7d: 640, mod: 'Aug 23rd 2026', desc: 'SentinelOne Alerts',
      xql: 'datamodel dataset = sentinelone_xdr_raw\n| filter xdm.event.type = "Alert"\n| fields *', sev: 'xdm.alert.severity' }),
    R(218, 'test1726', { pipe: 'p-s1', source: U('Omer A.'), type: 'SCHEDULED', status: 'Disabled', mod: 'Aug 23rd 2026', cat: 'Credential Access', desc: '',
      xql: 'dataset = sentinelone_xdr_raw\n| limit 10' }),
    R(220, 'SentinelOne - Lateral movement to server', { pipe: 'p-s1', source: U('Dana L.'), issues7d: 152, mod: 'Jul 14th 2026', tactic: 'TA0008 - Lateral Movement', tech: 'T1021 - Remote Services', cat: 'Lateral Movement', desc: 'Remote service session from a workstation to a server, reported by SentinelOne',
      xql: 'datamodel dataset = sentinelone_xdr_raw\n| filter xdm.event.type = "Threat" and xdm.target.host.device_category = "server"\n| fields *', sev: 'xdm.alert.severity' }),
    R(221, 'Chrome - Known Malicious Site Visit', { pipe: 'p-ch', source: P('Google Chrome'), issues7d: 61, tactic: 'TA0001 - Initial Access', tech: 'T1189 - Drive-by Compromise', cat: 'Execution', desc: 'This rule alerts on events related to bad navigation, that resulted in a warning or a block',
      xql: 'datamodel dataset = google_chrome_raw\n| filter xdm.event.type = "badNavigationEvent"\n| fields *' }),
    R(222, 'Chrome - Known Malicious Site Visit', { pipe: 'p-ch', source: P('Google Chrome'), issues7d: 61, cat: 'Execution', desc: 'This rule alerts on events related to bad navigation, that resulted in a warning or a block',
      xql: 'datamodel dataset = google_chrome_raw\n| filter xdm.event.type = "badNavigationEvent"\n| fields *' }),
    R(223, 'Chrome - Known Malware Downloaded', { pipe: 'p-ch', source: P('Google Chrome'), issues7d: 9, tactic: 'TA0002 - Execution', tech: 'T1204.002 - User Execution', cat: 'Execution', desc: 'This rule alerts on dangerous file download.',
      xql: 'datamodel dataset = google_chrome_raw\n| filter xdm.event.type = "dangerousDownloadEvent"\n| fields *' }),
    R(224, 'Chrome - Chrome Extension Install Event', { pipe: 'p-ch', source: P('Google Chrome'), issues7d: 290, tactic: 'TA0003 - Persistence', tech: 'T1176 - Browser Extensions', cat: 'Persistence', desc: 'This rule alerts on any installation of a browser extension',
      xql: 'datamodel dataset = google_chrome_raw\n| filter xdm.event.type = "browserExtensionInstallEvent"\n| fields *' }),
    R(225, 'Chrome - User Phished and/or Password Re-use/Breach event', { pipe: 'p-ch', source: P('Google Chrome'), issues7d: 14, tactic: 'TA0001 - Initial Access', tech: 'T1078 - Valid Accounts', cat: 'Infiltration', desc: 'This rule alerts on events related to bad navigation via social engineering',
      xql: 'datamodel dataset = google_chrome_raw\n| filter xdm.event.type in ("passwordReuseEvent", "passwordBreachEvent")\n| fields *' }),
    R(230, 'FortiGate - Port scan from internal host', { pipe: 'p-fg', source: U('Ariel B.'), issues7d: 0, mod: 'May 20th 2026', tactic: 'TA0007 - Discovery', tech: 'T1046 - Network Service Discovery', cat: 'Discovery', desc: 'One internal host is denied on more than 100 ports of another internal host in 5 minutes',
      xql: 'datamodel dataset = fortinet_fortigate_raw\n| filter xdm.observer.action = "deny" and xdm.source.zone = "internal"\n| comp count_distinct(xdm.target.port) as ports by xdm.source.ipv4, xdm.target.ipv4\n| filter ports > 100' }),
    R(231, 'FortiGate - Brute force on VPN portal', { pipe: 'p-fg', source: U('Ariel B.'), issues7d: 266, mod: 'Mar 3rd 2026', tactic: 'TA0006 - Credential Access', tech: 'T1110 - Brute Force', cat: 'Credential Access', desc: 'More than 5 failed VPN logins for one user',
      xql: 'datamodel dataset = fortinet_fortigate_raw\n| filter xdm.event.type = "vpn-login" and xdm.event.outcome = "failure"\n| comp count() as fails by xdm.target.user.username\n| filter fails > 5' }),
    R(232, 'FortiGate - Outbound to rare country', { pipe: 'p-fg', source: U('Ariel B.'), issues7d: 11, mod: 'Feb 11th 2026', tactic: 'TA0011 - Command and Control', tech: 'T1071 - Application Layer Protocol', cat: 'Command and Control', desc: 'Allowed outbound session to a country seen fewer than 3 times in 90 days',
      xql: 'datamodel dataset = fortinet_fortigate_raw\n| filter xdm.observer.action = "allow" and xdm.target.location.country not in (dataset = common_countries)\n| fields *' }),
    R(233, 'AWS - Root console login', { pipe: 'p-aws', source: U('Dana L.'), issues7d: 0, mod: 'Jan 9th 2026', tactic: 'TA0001 - Initial Access', tech: 'T1078.004 - Cloud Accounts', cat: 'Infiltration', desc: 'Console login by the root account',
      xql: 'datamodel dataset = amazon_aws_raw\n| filter xdm.event.operation = "ConsoleLogin" and xdm.source.user.user_type = "Root"\n| fields *' }),
    R(234, 'AWS - IAM policy change by new user', { pipe: 'p-aws', source: U('Dana L.'), issues7d: 0, mod: 'Jan 9th 2026', tactic: 'TA0003 - Persistence', tech: 'T1098 - Account Manipulation', cat: 'Persistence', desc: 'IAM policy attached by a user created in the last 7 days',
      xql: 'datamodel dataset = amazon_aws_raw\n| filter xdm.event.operation in ("AttachUserPolicy", "PutUserPolicy")\n| join (dataset = new_iam_users) as n n.user = xdm.source.user.username\n| fields *' }),
    R(235, 'Check Point - Malicious file verdict', { pipe: 'p-cp', source: U('Ariel B.'), issues7d: 14, mod: 'Apr 2nd 2026', tactic: 'TA0002 - Execution', tech: 'T1204.002 - User Execution', cat: 'Malware', desc: 'Passes through malicious verdicts from Check Point Threat Emulation',
      xql: 'datamodel dataset = check_point_threat_emulation_raw\n| filter xdm.alert.name = "malicious"\n| fields *' }),
    R(236, 'M365 - Mail forwarding rule to external domain', { pipe: 'p-m365', source: U('Dana L.'), issues7d: 6, mod: 'Jun 18th 2026', tactic: 'TA0009 - Collection', tech: 'T1114.003 - Email Forwarding Rule', cat: 'Collection', desc: 'Inbox rule that forwards mail outside the company',
      xql: 'datamodel dataset = msft_o365_general_raw\n| filter xdm.event.operation = "New-InboxRule" and xdm.target.domain != "bankus.example"\n| fields *' }),
    R(237, 'M365 - Mass download from SharePoint', { pipe: 'p-m365', source: U('Dana L.'), issues7d: 25, mod: 'Jun 18th 2026', tactic: 'TA0010 - Exfiltration', tech: 'T1567 - Exfiltration Over Web Service', cat: 'Exfiltration', desc: 'One user downloads more than 500 files in 10 minutes',
      xql: 'datamodel dataset = msft_o365_general_raw\n| filter xdm.event.operation = "FileDownloaded"\n| comp count() as files by xdm.source.user.username\n| filter files > 500' }),
    R(238, 'DNS - Tunneling to rare TLD', { pipe: 'p-dns', source: U('Ariel B.'), issues7d: 2, mod: 'Sep 30th 2026', tactic: 'TA0011 - Command and Control', tech: 'T1071.004 - DNS', cat: 'Command and Control', desc: 'Steady stream of long DNS queries to a rarely seen top-level domain',
      xql: 'datamodel dataset = infoblox_dns_raw\n| filter length(xdm.network.dns.dns_question.name) > 60\n| comp count() as q by xdm.source.ipv4, tld\n| filter q > 200' })
  ];

  /* ---------- Missions ---------- */
  const tasks = [
    { id: 'MSN-1001', card: 'pipeline', title: 'SentinelOne severity arrives empty: 3 rules create issues with no severity', verdict: 'Broken', conf: 'High', impact: 'High', layer: 'model', status: 'pending', opened: now - 5 * H,
      trigger: { kind: 'handoff', from: 'analyst', text: 'The Investigation Agent opened 38 SentinelOne cases in 2 days with no severity, so they were triaged late.' },
      summary: 'A change in the SentinelOne pack renamed the field that carries severity. Three rules read it through the data model, so one mapping line breaks all three.',
      steps: ['Read the 38 cases the Investigation Agent handed over: all came from three rules and all had an empty severity', 'Checked the three rules: the queries are valid and still fire', 'Followed the field the rules read, xdm.alert.severity, down to the data model', `Found that the SentinelOne pack update on ${packDay} stopped sending threatInfo_severity`, 'Wrote a corrected mapping and replayed 7 days of events through it'],
      diagnosis: 'The rules are fine. The data model maps xdm.alert.severity from a field the source no longer sends.',
      current: { kind: 'code', label: 'Data model rule · SentinelOne model', lines: [['[MODEL: dataset = sentinelone_xdr_raw]'], ['alter'], ['  xdm.event.type = eventType,'], ['  xdm.alert.original_threat_name = threatInfo_threatName,'], ['  xdm.alert.severity = threatInfo_severity,', 'del'], ['  xdm.source.host.hostname = agentRealtimeInfo_agentComputerName;']] },
      recommended: { kind: 'code', label: 'Data model rule · SentinelOne model', lines: [['[MODEL: dataset = sentinelone_xdr_raw]'], ['alter'], ['  xdm.event.type = eventType,'], ['  xdm.alert.original_threat_name = threatInfo_threatName,'], ['  xdm.alert.severity = coalesce(threatInfo_confidenceLevel, threatInfo_severity),', 'add'], ['  xdm.source.host.hostname = agentRealtimeInfo_agentComputerName;']] },
      validation: { rows: [['Issues with a severity (7 days)', 0, 1204, 1204]], note: 'Backtest on 7 days of stored events. The three rules themselves do not change.' },
      decision: { q: 'Approve the mapping fix?', approve: 'Approve fix', effect: 'The data model rule is updated. Severity is filled on new issues from all three rules.', risk: 'Medium. A mapping feeds every rule that reads the field, so all three were backtested.', reversible: true },
      affects: { rules: [215, 217, 220], node: { pipe: 'p-s1', stage: 'model' }, source: 'sentinelone' },
      pivots: [['streams', 'Data Streams', 'the data model step'], ['rules', 'Correlation Rules', 'the 3 rules']] },

    { id: 'MSN-1003', card: 'source', title: 'AWS audit logs stopped 46 hours ago: 2 detections are blind', verdict: 'Broken', conf: 'High', impact: 'High', layer: 'source', status: 'pending', opened: now - 3 * H,
      trigger: { kind: 'sweep', text: 'Hourly data-health sweep: the instance returned an error on 46 checks in a row.' },
      summary: `The production audit-log instance of Amazon S3 is in error. Two rules that look healthy have had no data to read since ${keyDay}.`,
      steps: [`Saw the instance “Cloud audit logs · production” in error since ${myWhen(down)}`, 'Read the error: access denied when reading the queue, the access key expired', 'Listed the rules that read this dataset: 2 rules, both enabled, both silent since then', 'Checked whether the events can be recovered: the queue keeps 14 days, so a backfill is possible'],
      diagnosis: 'The rules are fine and enabled. Their data source stopped, so they cannot fire.',
      current: { kind: 'settings', label: 'Amazon S3 · Cloud audit logs · production', rows: [['Status', 'Error'], ['Last event received', myWhen(down)], ['Error', 'Access denied, the access key expired'], ['Rules without data', '2']] },
      recommended: { kind: 'settings', label: 'Amazon S3 · Cloud audit logs · production', rows: [['Status', 'Connected'], ['Action', 'Replace the access key (needs a person)'], ['After reconnect', 'Backfill 46 hours from the queue'], ['Rules without data', '0']] },
      validation: { rows: [['Rules receiving data', 0, 2, 2]], note: `The queue keeps 14 days of events, so nothing is lost if the key is replaced before ${lastChance}.` },
      decision: { q: 'Replace the access key, or hand this to the cloud team?', approve: 'Hand over to cloud team', effect: 'The Pipeline Engineer opens a request for the cloud team with the error, the instance and the two rules. An agent cannot create credentials.', risk: 'Low. Restores access that existed before. No new access is granted.', reversible: true, selfFix: 'You can also replace the key yourself in Data Sources.' },
      affects: { rules: [233, 234], instance: 's3-audit', source: 's3', node: { pipe: 'p-aws', stage: 'source' } },
      pivots: [['sources', 'Data Sources & Integrations', 'the instance in error'], ['rules', 'Correlation Rules', 'the 2 rules']] },

    { id: 'MSN-1002', card: 'noisy', title: 'Chrome extension installs: 1,250 issues a month, 92% from approved extensions', verdict: 'Noisy', conf: 'High', impact: 'Medium', layer: 'rule', status: 'pending', opened: now - 9 * H, noise: 'Low-value true positive',
      trigger: { kind: 'handoff', from: 'analyst', text: 'The Investigation Agent resolved 140 cases from this rule as benign in 14 days. Analysts agreed with 138 of them.' },
      summary: 'The rule alerts on any installation of a browser extension. It is correct, and almost nobody acts on it.',
      steps: ['Measured 30 days: 1,250 issues', 'Grouped them by user and extension: 9 extensions approved by IT produce 1,150 of them', 'Checked the label quality: 138 of 140 benign verdicts were confirmed by an analyst', 'Selected issue suppression and an environment fact. The query does not change', 'Ran the change silently next to the live rule for 14 days'],
      diagnosis: 'Low-value true positive. The rule is correct and the behavior is expected in this environment.',
      current: { kind: 'settings', label: 'Chrome - Chrome Extension Install Event', rows: [['Issue suppression', 'Off'], ['Environment facts', 'None'], ['Issues in 30 days', '1,250']] },
      recommended: { kind: 'settings', label: 'Chrome - Chrome Extension Install Event', rows: [['Issue suppression', 'On · 24 hours · by user and extension ID'], ['Environment facts', `9 extensions approved by IT · review on ${reviewDay}`], ['Issues in 30 days', '100']] },
      validation: { rows: [['Issues per month', 1250, 100, 1250], ['Issues on unapproved extensions kept', 100, 100, 100]], silent: true, note: 'Backtest on 30 days and a 14-day silent test.' },
      decision: { q: 'Approve the suppression and the environment fact?', approve: 'Approve change', effect: 'Suppression is turned on for this rule. The fact is saved with a review date and is shared with the Investigation Agent.', risk: 'Low. Unapproved extensions still alert.', reversible: true },
      affects: { rules: [224], source: 'chrome' },
      pivots: [['rules', 'Correlation Rules', 'the rule']] },

    { id: 'MSN-1004', card: 'pipeline', title: 'A cost-saving filter drops the events a port-scan rule needs', verdict: 'Broken', conf: 'Medium', impact: 'Medium', layer: 'filter', status: 'pending', opened: now - 26 * H,
      trigger: { kind: 'sweep', text: 'Weekly sweep: an enabled rule has not fired for 23 days, while its source is healthy.' },
      summary: `A filter added on ${filterDay} drops every firewall “deny” event. The port-scan rule only reads “deny” events, so it has been silent since that day.`,
      steps: [`Saw the rule “FortiGate - Port scan from internal host” silent since ${filterDay}`, 'Checked the source: connected, 1.9M events a day', 'Read what the rule needs: deny events between internal hosts', `Found the filter “Drop firewall deny (cost saving)”, added ${filterDay} by Dana L.`, 'Wrote a narrower filter that keeps internal deny events'],
      diagnosis: 'The source is healthy and the rule is valid. A filter in between removes the rule’s events before it sees them.',
      current: { kind: 'code', label: 'Filter rule · Drop firewall deny (cost saving)', lines: [['[FILTER: dataset = fortinet_fortigate_raw]'], ['drop where action = "deny"', 'del']] },
      recommended: { kind: 'code', label: 'Filter rule · Drop firewall deny (cost saving)', lines: [['[FILTER: dataset = fortinet_fortigate_raw]'], ['drop where action = "deny" and srcintfrole = "wan"', 'add']] },
      validation: { rows: [['Deny events kept per day', 0, 38000, 38000]], note: 'No backtest is possible: the events were dropped and are not stored. That is why confidence is medium. A silent test runs for 7 days after the change. Ingestion grows by about 3.2 GB a day.' },
      decision: { q: 'Approve the narrower filter?', approve: 'Approve filter change', effect: 'The filter keeps deny events from internal interfaces. Internet-side deny events are still dropped.', risk: 'Low for security. It adds about 3.2 GB of ingestion a day.', reversible: true },
      affects: { rules: [230], node: { pipe: 'p-fg', stage: 'filter' }, source: 'fortigate' },
      pivots: [['streams', 'Data Streams', 'the filter step'], ['rules', 'Correlation Rules', 'the rule']] },

    { id: 'MSN-1006', card: 'content', title: 'Impossible-travel logins: connect Okta and adopt the Marketplace rule', verdict: 'Gap', conf: 'High', impact: 'Medium', layer: 'source', status: 'pending', opened: now - 30 * H,
      trigger: { kind: 'human', text: 'Ariel B. asked: “Add a rule for impossible-travel logins.”' },
      summary: 'The identity provider is not connected. A Marketplace rule covers impossible travel once it is, so no new rule is needed.',
      steps: ['Looked for the data first: Okta sign-in logs are not connected', 'Searched existing content: the Marketplace has “Okta - Impossible travel”', 'Checked what else the source unlocks: 9 Marketplace detections need Okta sign-in logs', 'No new rule is needed'],
      diagnosis: 'Coverage gap caused by a missing data source.',
      current: { kind: 'settings', label: 'Coverage for impossible travel', rows: [['Okta sign-in logs', 'Not connected'], ['Rule', 'None'], ['Detections that need Okta', '0 of 9 working']] },
      recommended: { kind: 'settings', label: 'Coverage for impossible travel', rows: [['Okta sign-in logs', 'Connect (needs the identity team)'], ['Rule', 'Enable Marketplace “Okta - Impossible travel”'], ['Detections that need Okta', '9 of 9 working']] },
      validation: { rows: [['Detections unlocked', 0, 9, 9]], note: 'The Marketplace rule runs in a silent test for 14 days after the source is connected, before it creates issues.' },
      decision: { q: 'Ask the identity team to connect Okta?', approve: 'Send the request', effect: 'A request is opened for the identity team. When data arrives the Detection Engineer enables the Marketplace rule in a silent test and comes back with the result.', risk: 'Low. It is a recommendation. Nothing changes until the source is connected.', reversible: true },
      affects: { rules: [], source: 'okta' },
      pivots: [['sources', 'Data Sources & Integrations', 'where Okta would be added']] },

    { id: 'MSN-1005', card: 'retire', title: 'Retire 3 leftover rules: a duplicate, an old beta and a test', verdict: 'Noisy', conf: 'High', impact: 'Low', layer: 'rule', status: 'pending', opened: now - 50 * H, noise: 'Duplicate',
      trigger: { kind: 'sweep', text: 'Weekly sweep: two enabled rules have the same query, and two disabled rules have not run for 6 weeks.' },
      summary: 'One rule is an exact copy of another and doubles its issues. Two more are leftovers that nobody uses.',
      steps: ['Compared every rule’s query: rules 221 and 222 are identical', 'Checked 90 days: every issue from 222 is also raised by 221', 'Found “SentinelOne - Threats (BETA)”, disabled, replaced by “SentinelOne Threat”', 'Found “test1726”, disabled, never produced an issue'],
      diagnosis: 'Duplicate and leftover rules. Removing them changes no detection logic.',
      current: { kind: 'settings', label: 'Three rules', rows: [['Chrome - Known Malicious Site Visit (ID 222)', 'Enabled · copy of 221 · 61 duplicate issues a week'], ['SentinelOne - Threats (BETA) (ID 216)', 'Disabled · replaced'], ['test1726 (ID 218)', 'Disabled · never fired']] },
      recommended: { kind: 'settings', label: 'Three rules', rows: [['Chrome - Known Malicious Site Visit (ID 222)', 'Disable'], ['SentinelOne - Threats (BETA) (ID 216)', 'Retire'], ['test1726 (ID 218)', 'Retire']] },
      validation: { rows: [['Duplicate issues per week', 61, 0, 61], ['Detections lost', 0, 0, 1]], note: 'Checked on 90 days: nothing that rule 222 raised was missed by rule 221.' },
      decision: { q: 'Disable the duplicate and retire the two leftovers?', approve: 'Approve all three', effect: 'Rule 222 is disabled. Rules 216 and 218 are marked retired. All three can be restored.', risk: 'Low. No detection logic changes.', reversible: true },
      affects: { rules: [222, 216, 218] },
      pivots: [['rules', 'Correlation Rules', 'the 3 rules']] },

    { id: 'MSN-1007', card: 'ioc', title: 'Indicator hash matches a signed software updater: 290 issues a week, all benign', verdict: 'Noisy', conf: 'High', impact: 'Medium', layer: 'rule', status: 'pending', opened: now - 7 * H, noise: 'Stale indicator',
      trigger: { kind: 'handoff', from: 'analyst', text: 'The Investigation Agent resolved 290 issues from this indicator as benign in 7 days.' },
      summary: 'A file hash added in 2022 now matches the current version of a signed endpoint-management updater. Every match is benign.',
      steps: ['Grouped 7 days of issues: all 290 come from one process, the endpoint-management updater', 'Checked the file: signed by its vendor and present on 1,900 hosts', 'Checked reputation today: none of the 3 intel sources lists the hash as malicious', 'Checked the indicator: added in December 2022, no expiration date'],
      diagnosis: 'Stale indicator. It no longer points at a malicious file.',
      current: { kind: 'settings', label: 'IOC rule 1 · Hash', rows: [['Indicator', '51ff4a03…68b1f5705'], ['Status', 'Enabled'], ['Expiration date', 'Never'], ['Issues in 7 days', '290']] },
      recommended: { kind: 'settings', label: 'IOC rule 1 · Hash', rows: [['Indicator', '51ff4a03…68b1f5705'], ['Status', 'Disabled'], ['Expiration date', 'Today'], ['Issues in 7 days', '0']] },
      validation: { rows: [['Issues per week', 290, 0, 290], ['Confirmed malicious matches lost', 0, 0, 1]], note: 'Checked on 30 days: no match of this indicator was confirmed malicious.' },
      decision: { q: 'Drop this indicator?', approve: 'Drop indicator', effect: 'The indicator is disabled and expires today. It can be restored.', risk: 'Low. The hash is no longer listed as malicious.', reversible: true },
      affects: { rules: [], iocs: [1] },
      pivots: [['iocs', 'IOC Rules', 'the indicator']] },

    { id: 'MSN-1008', card: 'gap', title: 'New rule suggested: Office application launching a script host', verdict: 'Gap', conf: 'Medium', impact: 'Medium', layer: 'rule', status: 'pending', opened: now - 12 * H,
      trigger: { kind: 'handoff', from: 'hunter', text: 'The Threat Hunter agent found Word launching mshta.exe on 2 finance workstations and marked the hunt as repeatable.' },
      summary: 'The data is present, and no existing rule, Cortex analytic or Marketplace content covers this pattern on SentinelOne data. A new correlation rule is suggested.',
      steps: ['Checked the data: SentinelOne process events are arriving and mapped', 'Searched Cortex analytics and the Marketplace: nothing covers this pattern on SentinelOne data', 'Looked for an existing rule to enhance: none reads the parent and child process', 'Wrote a new rule and mapped it to ATT&CK T1218.005', 'Backtested it on 30 days'],
      diagnosis: 'Coverage gap. The data is present and no existing content covers it.',
      current: { kind: 'settings', label: 'Coverage for T1218.005 Mshta', rows: [['Rule', 'None'], ['Existing content', 'None found'], ['Data', 'SentinelOne process events, arriving']] },
      recommended: { kind: 'code', label: 'New rule · SentinelOne - Office application launching a script host', lines: [['datamodel dataset = sentinelone_xdr_raw', 'add'], ['| filter xdm.source.process.name in ("winword.exe", "excel.exe", "powerpnt.exe")', 'add'], ['| filter xdm.target.process.name in ("mshta.exe", "wscript.exe", "cscript.exe")', 'add'], ['| fields *', 'add']] },
      validation: { rows: [['Matches in 30 days', 0, 2, 2]], note: 'Backtest on 30 days: 2 matches, the two hosts the hunt found. No other match.' },
      decision: { q: 'Adopt this rule?', approve: 'Adopt rule', effect: 'The rule is added to Correlation Rules and enabled, with the Detection Engineer as its source.', risk: 'Low. Detection only, and two matches in 30 days.', reversible: true },
      affects: { rules: [], suggested: 241 },
      pivots: [['rules', 'Correlation Rules', 'the suggested rule']] },

    { id: 'MSN-0998', card: 'noisy', title: 'VPN brute-force rule counts retries as attacks: tuned version is in a silent test', verdict: 'Noisy', conf: 'Medium', impact: 'Medium', layer: 'rule', status: 'progress', opened: now - 9 * D, noise: 'Logic error', progressNote: 'Silent test · day 9 of 14',
      trigger: { kind: 'handoff', from: 'analyst', text: 'The Investigation Agent resolved 61 cases from this rule as benign in 14 days. Most were one user retrying an expired password.' },
      summary: 'The rule counts failed logins per user. A person or a service retrying an expired password looks the same as an attack.',
      steps: ['Read the rule’s intent: catch password guessing against the VPN portal', 'Found the flaw: it groups by user, not by source, and never asks whether a login then succeeded', 'Rewrote it: group by source address, raise the threshold, require a success after the failures', 'Backtested on 30 days, then started a 14-day silent test'],
      diagnosis: 'Logic error in the rule. It counts failed logins per user and never checks whether a login then succeeded.',
      current: { kind: 'code', label: 'XQL · FortiGate - Brute force on VPN portal', lines: [['datamodel dataset = fortinet_fortigate_raw'], ['| filter xdm.event.type = "vpn-login" and xdm.event.outcome = "failure"', 'del'], ['| comp count() as fails by xdm.target.user.username', 'del'], ['| filter fails > 5', 'del']] },
      recommended: { kind: 'code', label: 'XQL · FortiGate - Brute force on VPN portal', lines: [['datamodel dataset = fortinet_fortigate_raw'], ['| filter xdm.event.type = "vpn-login"', 'add'], ['| comp count_if(xdm.event.outcome = "failure") as fails,', 'add'], ['       count_if(xdm.event.outcome = "success") as ok by xdm.source.ipv4', 'add'], ['| filter fails > 20 and ok > 0', 'add']] },
      validation: { rows: [['Issues in 9 days of silent test', 342, 31, 342], ['Confirmed attacks kept', 4, 4, 4]], silent: true, note: 'Silent test, day 9 of 14. A decision is requested when the test ends.' },
      decision: null,
      affects: { rules: [231], source: 'fortigate' },
      pivots: [['rules', 'Correlation Rules', 'the rule']] },

    { id: 'MSN-0996', card: 'noisy', title: 'DNS tunneling rule: too little volume to judge', verdict: 'Inconclusive', conf: 'Low', impact: 'Low', layer: 'rule', status: 'done', end: 'watch', opened: now - 4 * D, closed: now - 4 * D + 2 * H,
      trigger: { kind: 'sweep', text: 'Weekly sweep: a rule edited 5 days ago has fired twice.' },
      summary: 'The rule was edited five days ago. Two issues in five days are not enough to say whether it is noisy or healthy.',
      steps: ['Counted issues since the edit: 2', 'Both were closed as benign, by one analyst, with no reason given', 'Decided not to act on two weak labels'],
      diagnosis: 'Not enough evidence to call the rule noisy or healthy.',
      validation: null, decision: null, outcome: `No change. Checked again on ${recheck}.`,
      affects: { rules: [238] }, pivots: [['rules', 'Correlation Rules', 'the rule']] },

    { id: 'MSN-0994', card: 'settings', title: 'ATT&CK mapping added to 2 Chrome rules', verdict: 'Gap', conf: 'High', impact: 'Low', layer: 'rule', status: 'done', end: 'approved', by: 'Ariel B.', opened: now - 3 * D, closed: now - 30 * H,
      trigger: { kind: 'sweep', text: 'Weekly sweep: two enabled rules had no tactic or technique.' },
      summary: 'Two Chrome rules had no ATT&CK mapping, so they were missing from the coverage view.',
      steps: ['Read each rule’s query and description', 'Proposed a tactic and a technique for each', 'Ariel B. approved both'],
      diagnosis: 'Missing ATT&CK mapping. The rules worked but were not counted in the coverage view.',
      validation: null, decision: null, outcome: 'Approved by Ariel B. Both rules now appear under their techniques in the coverage view.',
      affects: { rules: [221, 223] }, pivots: [['rules', 'Correlation Rules', 'the 2 rules']] },

    { id: 'MSN-0991', card: 'source', title: 'Microsoft 365 audit logs arrived 3 hours late', verdict: 'Healthy', conf: 'High', impact: 'Low', layer: 'source', status: 'done', end: 'auto', opened: now - 2 * D, closed: now - 2 * D + 3 * H,
      trigger: { kind: 'sweep', text: 'Hourly data-health sweep: no events for 3 checks in a row.' },
      summary: 'The source went quiet for 3 hours and recovered without help. The late events arrived and both rules ran on them.',
      steps: ['Saw no events from “Audit logs · general” for 3 hours', 'Opened a mission and kept watching', 'Events resumed, including the delayed ones', 'Confirmed both Microsoft 365 rules ran on the late events'],
      diagnosis: 'A delay on the vendor side. Nothing was lost.',
      validation: null, decision: null, outcome: 'Closed automatically when the problem went away. No decision was needed.',
      affects: { rules: [236, 237], source: 'm365' }, pivots: [['sources', 'Data Sources & Integrations', 'the source']] },

    { id: 'MSN-0988', card: 'handover', title: 'Cortex analytic “Suspicious PowerShell download” is noisy here: evidence sent to the content team', verdict: 'Noisy', conf: 'Medium', impact: 'Medium', layer: 'rule', status: 'done', end: 'handed', opened: now - 6 * D, closed: now - 6 * D + 4 * H,
      trigger: { kind: 'handoff', from: 'analyst', text: 'The Investigation Agent resolved 412 issues from this analytic as benign in one week.' },
      summary: 'This analytic is built-in Cortex content and cannot be tuned in the tenant.',
      steps: ['Traced the benign issues to signed software-distribution scripts', 'Confirmed the logic is built-in Cortex content, not a user rule', 'Sent the field evidence to the Cortex content team', 'Changed nothing in this tenant'],
      diagnosis: 'Noise in built-in Cortex content.',
      validation: null, decision: null, outcome: 'Handed over. Nothing changed in the tenant. The fix arrives in a content release.',
      affects: { rules: [] }, pivots: [] }
  ];


  /* ---------- IOC rules ---------- */
  const iocs = [
    { id: 7, mod: 'Dec 2nd 2025 03:49:29', ind: 'dnscat2.exe, dnscat2-client.exe, dnscat2-win32.exe, 8f3b4db351b8a50e…', type: 'File Name', sev: 'High', issues: 0, issues7d: 0, source: 'Ariel B.', exp: 'Never', status: 'Enabled', rep: 'Bad', rel: 'B - Usually reliable' },
    { id: 3, mod: 'Dec 22nd 2022 21:27:25', ind: '73.213.32.45', type: 'IP', sev: 'High', issues: 0, issues7d: 0, source: 'Dana L.', exp: 'Never', status: 'Enabled', rep: 'Suspicious', rel: 'C - Fairly reliable' },
    { id: 2, mod: 'Dec 22nd 2022 21:26:45', ind: 'myexternalip.com', type: 'Domain Name', sev: 'Medium', issues: 0, issues7d: 0, source: 'Dana L.', exp: 'Never', status: 'Enabled', rep: 'Suspicious', rel: 'C - Fairly reliable' },
    { id: 1, mod: 'Dec 22nd 2022 21:25:52', ind: '51ff4a033018d9343049305061dcde77cb5f26f5ec48d1be42669f368b1f5705', type: 'Hash', sev: 'High', issues: 1241, issues7d: 290, source: 'Dana L.', exp: 'Never', status: 'Enabled', rep: 'Bad', rel: 'B - Usually reliable' },
    { id: 5, mod: 'Mar 4th 2024 10:12:03', ind: 'update-check.example.net', type: 'Domain Name', sev: 'Low', issues: 0, issues7d: 0, source: 'Omer A.', exp: 'Expired', status: 'Disabled', rep: 'Unknown', rel: 'F - Cannot be judged' },
    { id: 4, mod: 'Jan 9th 2023 08:40:11', ind: '198.51.100.23', type: 'IP', sev: 'Medium', issues: 0, issues7d: 0, source: 'Dana L.', exp: 'Expired', status: 'Disabled', rep: 'Unknown', rel: 'F - Cannot be judged' }
  ];

  /* ---------- A rule the agent suggests. It becomes a real rule when adopted. ---------- */
  const suggested = [R(241, 'SentinelOne - Office application launching a script host', { pipe: 'p-s1', source: { kind: 'agent', name: 'Detection Engineer' }, mod: 'Today', tactic: 'TA0005 - Defense Evasion', tech: 'T1218.005 - Mshta', cat: 'Defense Evasion', desc: 'An Office application starts mshta, wscript or cscript', task: 'MSN-1008',
    xql: 'datamodel dataset = sentinelone_xdr_raw\n| filter xdm.source.process.name in ("winword.exe", "excel.exe", "powerpnt.exe")\n| filter xdm.target.process.name in ("mshta.exe", "wscript.exe", "cscript.exe")\n| fields *' })];

  /* ---------- Who works on what, and what the two agents said to each other ---------- */
  const TEAM = {
    'MSN-1001': { sug: 'Fix', agent: 'det', fixer: 'pipe', collab: [['det', 'Three rules read xdm.alert.severity and all three get it empty. The rules are valid, so I asked the Pipeline Engineer to check the mapping.'], ['pipe', 'The pack update stopped sending threatInfo_severity. I wrote a corrected mapping and replayed 7 days through it.']] },
    'MSN-1003': { sug: 'Fix', agent: 'pipe', collab: [['pipe', 'The audit-log instance is in error: the access key expired. I asked the Detection Engineer what depends on it.'], ['det', 'Two enabled rules read this dataset. Both have had no data since the instance stopped.']] },
    'MSN-1002': { sug: 'Tune', agent: 'det' },
    'MSN-1004': { sug: 'Fix', agent: 'det', fixer: 'pipe', collab: [['det', 'The port-scan rule is enabled and has been silent for 23 days. Its source is healthy, so I asked the Pipeline Engineer to check what happens in between.'], ['pipe', 'A filter added that day drops every deny event. I wrote a narrower filter that keeps deny events between internal hosts.']] },
    'MSN-1006': { sug: 'Connect', agent: 'det', collab: [['det', 'A rule for impossible travel was requested. I asked the Pipeline Engineer whether identity sign-in data exists.'], ['pipe', 'Okta is not connected. Once it is, the Marketplace parser and data model cover it with no custom work.']] },
    'MSN-1005': { sug: 'Drop', agent: 'det' }, 'MSN-1007': { sug: 'Drop', agent: 'det' }, 'MSN-1008': { sug: 'Adopt', agent: 'det' },
    'MSN-0998': { sug: 'Tune', agent: 'det' }, 'MSN-0996': { sug: 'Watch', agent: 'det' }, 'MSN-0994': { sug: 'Tune', agent: 'det' },
    'MSN-0991': { sug: 'Keep', agent: 'pipe' }, 'MSN-0988': { sug: 'Hand over', agent: 'det' }
  };
  tasks.forEach(t => Object.assign(t, TEAM[t.id]));

  /* ---------- Missions that arrive while the screen is open ---------- */
  const incoming = [
    { id: 'MSN-1009', card: 'pipeline', title: 'Check Point verdicts for archive files are dropped at parsing', verdict: 'Mismatch', sug: 'Fix', agent: 'det', fixer: 'pipe', conf: 'High', impact: 'Medium', layer: 'parsing', progressNote: 'Waiting for the Pipeline Engineer',
      trigger: { kind: 'change', text: 'The Check Point Threat Emulation pack was updated 20 minutes ago.' },
      summary: 'After a pack update the parsing rule drops a new event type, so 5 of 14 Check Point verdicts never reach the rule.',
      steps: ['Compared the product with XSIAM after the update: the product reports 14 verdicts, XSIAM shows 9', 'Checked the rule: valid, and it fired on all 9', 'Asked the Pipeline Engineer to trace the 5 missing events', 'Found the cause: the update added the event type “archive verdict”, and the parsing rule drops what it does not know', 'Replayed the last 24 hours through the changed parsing rule'],
      diagnosis: 'The product and XSIAM disagree. The parsing rule drops an event type that the pack update added.',
      current: { kind: 'code', label: 'Parsing rule · check_point_threat_emulation', lines: [['[INGEST:vendor="Check Point", product="Threat Emulation",'], [' target_dataset="check_point_threat_emulation_raw", no_hit=drop]', 'del']] },
      recommended: { kind: 'code', label: 'Parsing rule · check_point_threat_emulation', lines: [['[INGEST:vendor="Check Point", product="Threat Emulation",'], [' target_dataset="check_point_threat_emulation_raw", no_hit=keep]', 'add']] },
      validation: { rows: [['Verdicts reaching the rule (24 hours)', 9, 14, 14]], note: 'Replayed the last 24 hours through the changed rule.' },
      decision: { q: 'Approve the parsing change?', approve: 'Approve fix', effect: 'Event types the parsing rule does not know are kept. The rule sees every Check Point verdict.', risk: 'Low. It adds a small number of events.', reversible: true },
      affects: { rules: [235], node: { pipe: 'p-cp', stage: 'parsing' }, source: 'checkpoint' }, pivots: [['streams', 'Data Streams', 'the parsing step'], ['rules', 'Correlation Rules', 'the rule']],
      collab: [['det', 'After the pack update the product reports 14 verdicts and XSIAM shows 9. The rule is valid. I asked the Pipeline Engineer to trace the 5 missing events.']],
      answer: ['pipe', 'The update added the event type “archive verdict”. The parsing rule has no_hit=drop, so those events are dropped. The change is attached.'] },
    { id: 'MSN-1010', card: 'noisy', title: 'SharePoint mass-download rule fires on the nightly backup account', verdict: 'Noisy', sug: 'Tune', agent: 'det', conf: 'High', impact: 'Low', layer: 'rule', noise: 'Benign true positive', progressNote: 'Detection Engineer is diagnosing',
      trigger: { kind: 'handoff', from: 'analyst', text: 'The Investigation Agent resolved 22 cases from this rule as benign in 7 days. All came from one service account.' },
      summary: 'The backup service account downloads thousands of files every night. The rule is correct for people and wrong for this account.',
      steps: ['Grouped 7 days of issues: 22 of 25 come from the account svc-backup', 'Checked the account: a service account, registered as the nightly backup job', 'Checked the labels: analysts agreed with all 22 benign verdicts', 'Selected an environment fact. The query does not change'],
      diagnosis: 'Benign true positive. Expected behavior of one known account.',
      current: { kind: 'settings', label: 'M365 - Mass download from SharePoint', rows: [['Environment facts', 'None'], ['Issues in 7 days', '25']] },
      recommended: { kind: 'settings', label: 'M365 - Mass download from SharePoint', rows: [['Environment facts', `svc-backup is the nightly backup account · review on ${reviewDay}`], ['Issues in 7 days', '3']] },
      validation: { rows: [['Issues per week', 25, 3, 25], ['Issues on other accounts kept', 3, 3, 3]], note: 'Backtest on 30 days. Downloads by any other account still alert.' },
      decision: { q: 'Approve the environment fact?', approve: 'Approve change', effect: 'The fact is saved with a review date and shared with the Investigation Agent.', risk: 'Low. Only one named service account is affected.', reversible: true },
      affects: { rules: [237], source: 'm365' }, pivots: [['rules', 'Correlation Rules', 'the rule']] },
    { id: 'MSN-1011', card: 'ioc', title: '2 indicators from 2022 never matched and have no expiration date', verdict: 'Noisy', sug: 'Drop', agent: 'det', conf: 'Medium', impact: 'Low', layer: 'rule', noise: 'Stale indicator', progressNote: 'Detection Engineer is diagnosing',
      trigger: { kind: 'sweep', text: 'Weekly sweep of IOC rules.' },
      summary: 'Two indicators added in December 2022 have never matched and never expire. One of them is a public “what is my IP” service.',
      steps: ['Listed enabled indicators with no expiration date', 'Checked matches since they were added: none for either', 'Checked reputation today: the IP is no longer listed, and the domain is a public IP-lookup service'],
      diagnosis: 'Stale indicators. They cost matching time and can only produce false positives.',
      current: { kind: 'settings', label: 'IOC rules 3 and 2', rows: [['73.213.32.45 (IP)', 'Enabled · never expires · 0 matches'], ['myexternalip.com (Domain)', 'Enabled · never expires · 0 matches']] },
      recommended: { kind: 'settings', label: 'IOC rules 3 and 2', rows: [['73.213.32.45 (IP)', 'Disable · expire today'], ['myexternalip.com (Domain)', 'Disable · expire today']] },
      validation: { rows: [['Matches lost', 0, 0, 1]], note: 'Neither indicator matched since December 2022, so confidence is medium, not high.' },
      decision: { q: 'Drop these two indicators?', approve: 'Drop both', effect: 'Both indicators are disabled and expire today. They can be restored.', risk: 'Low. Neither has ever matched.', reversible: true },
      affects: { rules: [], iocs: [3, 2] }, pivots: [['iocs', 'IOC Rules', 'the 2 indicators']] }
  ];

  /* Issues per week before today. The last point of the trend is always computed from the rules and indicators. */
  const history = [2105, 2140, 2168, 2190, 2214, 2231, 2246];

  /* ---------- Agent activity, newest first ---------- */
  const log = [
    [now - 6 * 60000, 'sweep', `Hourly data-health sweep: ${sources.flatMap(x => x.instances).length} instances checked, ${sources.flatMap(x => x.instances).filter(i => i.status === 'err').length} in error`],
    [now - 41 * 60000, 'check', 'Compared Check Point verdicts with XSIAM: 14 of 14 match'],
    [now - 3 * H, 'task', 'Opened MSN-1003: AWS audit logs stopped'],
    [now - 5 * H, 'handoff', 'The Investigation Agent handed over 38 SentinelOne cases with no severity'],
    [now - 5 * H + 9 * 60000, 'task', 'Opened MSN-1001: one mapping line behind 3 rules'],
    [now - 9 * H, 'test', 'Silent test finished for the Chrome extension rule: 14 days'],
    [now - 9 * H + 60000, 'task', 'Opened MSN-1002 with the test result'],
    [now - 26 * H, 'sweep', `Weekly sweep: ${rules.length} rules reviewed, 2 candidates`],
    [now - 30 * H, 'done', 'Ariel B. approved MSN-0994: ATT&CK mapping on 2 rules']
  ].map(([t, kind, text]) => ({ t, kind, text }));

  return { sources, pipes, rules, tasks, iocs, suggested, incoming, history, log, facts: [], dates: { packDay, filterDay, reviewDay } };
}

/* ---------- Derived values: never typed twice ---------- */
const myOpen = W => W.tasks.filter(t => t.status !== 'done');
/* One order everywhere: most impact first, then the one that has waited longest. */
const myRank = (a, b) => ({ High: 0, Medium: 1, Low: 2 })[a.impact] - ({ High: 0, Medium: 1, Low: 2 })[b.impact] || a.opened - b.opened;
const myPendingTasks = W => W.tasks.filter(t => t.status === 'pending').sort(myRank);
/* v is the health of the rule. sug is what the agent suggests, which is what the user sees. */
function myRuleReview(W, r) {
  if (r.retired) return { v: 'Retired', sug: '', conf: '', task: W.tasks.find(t => (t.affects.rules || []).includes(r.id) && t.card === 'retire') };
  /* While an agent is still running, nothing is known about the rule yet: its health does not change. */
  const mine = W.tasks.filter(t => (t.affects.rules || []).includes(r.id)), run = mine.find(t => t.live && t.status === 'progress');
  if (run) { const base = myRuleReview({ tasks: W.tasks.filter(t => t !== run) }, r); return Object.assign(base, { task: run }); }
  const ts = mine;
  const open = ts.find(t => t.status !== 'done');
  if (open && open.card === 'retire' && r.status === 'Disabled') return { v: 'Leftover', sug: 'Drop', conf: open.conf, task: open };
  if (open) return { v: open.verdict, sug: open.sug, conf: open.conf, task: open };
  const last = ts.slice().sort((a, b) => (b.closed || 0) - (a.closed || 0))[0];
  if (last) {
    if (last.end === 'rejected' || last.end === 'dismissed') return { v: last.verdict, sug: last.sug, conf: last.conf, task: last, declined: true };
    if (last.end === 'watch') return { v: 'Inconclusive', sug: 'Watch', conf: last.conf, task: last };
    return { v: 'Healthy', sug: 'Keep', conf: 'High', task: last };
  }
  if (r.status === 'Disabled') return { v: 'Not reviewed', sug: '', conf: '', task: null };
  return { v: 'Healthy', sug: 'Keep', conf: 'High', task: null };
}
function myIocReview(W, i) {
  const run = W.tasks.find(t => (t.affects.iocs || []).includes(i.id) && t.live && t.status === 'progress');
  if (run) return { sug: 'Keep', conf: 'High', task: run };
  const ts = W.tasks.filter(t => (t.affects.iocs || []).includes(i.id)), open = ts.find(t => t.status !== 'done');
  if (open) return { sug: open.sug, conf: open.conf, task: open };
  if (i.status !== 'Enabled') return { sug: '', conf: '', task: ts[0] || null };
  const last = ts[0]; if (last && (last.end === 'rejected' || last.end === 'dismissed')) return { sug: last.sug, conf: last.conf, task: last, declined: true };
  return { sug: 'Keep', conf: 'High', task: null };
}
const myIssuesNow = W => W.rules.reduce((a, r) => a + r.issues7d, 0) + W.iocs.reduce((a, i) => a + i.issues7d, 0);
function myStats(W) {
  const enabled = W.rules.filter(r => r.status === 'Enabled');
  const rev = enabled.map(r => myRuleReview(W, r).v);
  const healthy = rev.filter(v => v === 'Healthy').length;
  const inst = W.sources.flatMap(s => s.instances);
  const byVerdict = {}; W.rules.forEach(r => { const v = myRuleReview(W, r).v; byVerdict[v] = (byVerdict[v] || 0) + 1; });
  const removed = W.tasks.filter(t => t.status === 'done' && ['approved', 'edited'].includes(t.end) && t.weekly).reduce((a, t) => a + t.weekly, 0);
  return {
    rules: W.rules.length, enabled: enabled.length, healthy, share: Math.round(healthy / enabled.length * 100),
    pending: myPendingTasks(W).length, progress: W.tasks.filter(t => t.status === 'progress').length, done: W.tasks.filter(t => t.status === 'done').length,
    inst: inst.length, instOk: inst.filter(i => i.status === 'ok').length, instErr: inst.filter(i => i.status === 'err').length,
    sources: W.sources.length, byVerdict, removed, iocs: W.iocs.length, issuesNow: myIssuesNow(W)
  };
}
/* Open missions that sit on one step of one pipeline */
const myNodeTask = (W, pipe, stage) => W.tasks.find(t => t.status !== 'done' && t.affects.node && t.affects.node.pipe === pipe && t.affects.node.stage === stage);
const mySourceTask = (W, sid) => W.tasks.find(t => t.status !== 'done' && t.affects.source === sid && (t.layer === 'source'));
const myLayerOpen = (W, layer) => W.tasks.filter(t => t.status !== 'done' && t.layer === layer);
const myNum = n => n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 2 : 0).replace(/\.?0+$/, '') + 'M' : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);
const myAge = ms => { const m = Math.max(1, Math.round(ms / 60000)); if (m < 60) return m + 'm'; const h = Math.round(m / 60); if (h < 48) return h + 'h'; return Math.round(h / 24) + 'd'; };
const myWhen = ts => { const d = new Date(ts); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toTimeString().slice(0, 5); };

/* ---------- What a decision changes. The only place the world is modified. ---------- */
function myApply(W, t, choice, whoName) {
  const who = whoName.replace(/\.$/, '');
  const now = Date.now(), rule = id => W.rules.find(r => r.id === id);
  const close = (end, outcome) => { t.status = 'done'; t.end = end; t.closed = now; t.by = who; t.outcome = outcome; };
  if (choice === 'reject') return close('rejected', `Rejected by ${who}. Nothing changed. The suggestion stays visible on the affected objects.`);
  if (choice === 'dismiss') return close('dismissed', `Dismissed by ${who}. Nothing changed, and this is not raised again unless it gets worse.`);
  const edited = choice === 'edit', end = edited ? 'edited' : 'approved', verb = edited ? 'Approved with edits' : 'Approved';
  if (t.id === 'MSN-1001') {
    W.pipes.find(p => p.id === 'p-s1').model.ok = true;
    close(end, `${verb} by ${who}. Severity is filled on new issues from all three rules. The Pipeline Engineer watches for 7 days and reopens the mission if the field goes empty again.`);
  } else if (t.id === 'MSN-1002') {
    const r = rule(224); r.supp = { dur: '24 hours', fields: 'user, extension ID' }; r.issues7d = 23; t.weekly = 267;
    W.facts.push({ text: '9 browser extensions approved by IT', review: W.dates.reviewDay, by: who });
    close(end, `${verb} by ${who}. Suppression is on. In the backtest this removes 1,150 of 1,250 issues a month and keeps every issue on an unapproved extension.`);
  } else if (t.id === 'MSN-1003') {
    t.status = 'progress'; t.by = who; t.progressNote = 'Waiting for the cloud team'; t.decision = null; t.handed = true;
    W.log.unshift({ t: now, kind: 'handoff', text: 'MSN-1003 handed to the cloud team: replace the expired access key' });
    return;
  } else if (t.id === 'MSN-1004') {
    W.pipes.find(p => p.id === 'p-fg').filter.ok = true; W.pipes.find(p => p.id === 'p-fg').filter.name = 'Drop internet-side firewall deny';
    close(end, `${verb} by ${who}. Internal deny events are kept. A 7-day silent test started on the port-scan rule, because no backtest was possible.`);
  } else if (t.id === 'MSN-1005') {
    rule(222).status = 'Disabled'; rule(222).retired = true; rule(222).issues7d = 0; rule(216).retired = true; rule(218).retired = true; t.weekly = 61;
    close(end, `${verb} by ${who}. Rule 222 is disabled and rules 216 and 218 are retired. All three can be restored.`);
  } else if (t.id === 'MSN-1006') {
    t.status = 'progress'; t.by = who; t.progressNote = 'Waiting for the identity team'; t.decision = null; t.handed = true;
    W.log.unshift({ t: now, kind: 'handoff', text: 'MSN-1006: request sent to the identity team to connect Okta' });
    return;
  }
  else if (t.id === 'MSN-1007') {
    const i = W.iocs.find(x => x.id === 1); i.status = 'Disabled'; i.exp = 'Expired'; i.issues7d = 0; t.weekly = 290;
    close(end, `${verb} by ${who}. The indicator is disabled and expired. It removes 290 issues a week.`);
  } else if (t.id === 'MSN-1008') {
    const r = W.suggested.find(x => x.id === 241); if (r) { W.suggested = W.suggested.filter(x => x !== r); r.task = null; if (edited) r.xql = t.recommended.lines.map(l => l[0]).join('\n'); W.rules.unshift(r); t.affects.rules = [241]; }
    close(end, `${verb} by ${who}. The rule is enabled in Correlation Rules, with the Detection Engineer as its source.`);
  } else if (t.id === 'MSN-1009') {
    const p = W.pipes.find(x => x.id === 'p-cp'); p.parsing.text = p.parsing.text.replace('no_hit=drop', 'no_hit=keep');
    close(end, `${verb} by ${who}. The parsing rule keeps unknown event types. All Check Point verdicts reach the rule.`);
  } else if (t.id === 'MSN-1010') {
    rule(237).issues7d = 3; t.weekly = 22; W.facts.push({ text: 'svc-backup is the nightly backup account', review: W.dates.reviewDay, by: who });
    close(end, `${verb} by ${who}. The environment fact is saved. It removes 22 issues a week and keeps alerts on every other account.`);
  } else if (t.id === 'MSN-1011') {
    W.iocs.filter(x => [3, 2].includes(x.id)).forEach(x => { x.status = 'Disabled'; x.exp = 'Expired'; });
    close(end, `${verb} by ${who}. Both indicators are disabled and expired.`);
  }
  W.log.unshift({ t: now, kind: 'done', text: `${who} ${edited ? 'approved an edited version of' : 'approved'} ${t.id}` });
}
/* A person fixes the source in the native screen. The mission notices and closes itself. */
function myReconnect(W, instId, whoName) {
  const who = whoName.replace(/\.$/, '');
  const inst = W.sources.flatMap(s => s.instances).find(i => i.id === instId); if (!inst) return null;
  inst.status = 'ok'; inst.last = Date.now(); inst.count = 18400; inst.note = '';
  const t = W.tasks.find(x => x.status !== 'done' && x.affects.instance === instId);
  if (t) { t.status = 'done'; t.end = 'auto'; t.closed = Date.now(); t.by = who; t.decision = null;
    t.outcome = `Closed automatically. ${who} replaced the access key in Data Sources, events are arriving again, and the Pipeline Engineer is backfilling 46 hours from the queue.`;
    W.rules.filter(r => t.affects.rules.includes(r.id)).forEach(r => { r.backfill = true; });
    W.log.unshift({ t: Date.now(), kind: 'done', text: `${t.id} closed automatically: data is arriving again` }); }
  return t;
}

/* A new trigger arrives: the mission appears as in progress while the agent runs. */
function myArrive(W, n) {
  const t = W.incoming[n]; if (!t || W.tasks.includes(t)) return null;
  t.status = 'progress'; t.opened = Date.now(); t.fresh = Date.now(); W.tasks.unshift(t);
  W.log.unshift({ t: Date.now(), kind: t.trigger.kind === 'handoff' ? 'handoff' : 'sweep', text: `${MY_TRIGGER[t.trigger.kind][0]}: ${t.trigger.text}` });
  W.log.unshift({ t: Date.now(), kind: 'task', text: `Opened ${t.id}: ${t.title}` });
  return t;
}
/* The agent finishes: the mission now waits for a person. */
function myReady(W, t) {
  if (!t || t.status !== 'progress' || !t.decision) return;
  t.status = 'pending'; t.fresh = Date.now(); t.progressNote = '';
  if (t.answer) { t.collab = (t.collab || []).concat([t.answer]); t.answer = null; }
  W.log.unshift({ t: Date.now(), kind: 'task', text: `${t.id} is ready for a decision` });
}
