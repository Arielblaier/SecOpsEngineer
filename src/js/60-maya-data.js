/* ======================================================================
   MAYA · THE SECOPS ENGINEER'S WORLD
   One source of truth. Every number on every Maya screen is computed from
   the objects below, so the screens cannot disagree with each other.
   Rule names and screen layouts follow the real product screens. Volumes,
   people and failures are invented for the story.
   ====================================================================== */
const MY_LAYERS = [
  ['source', 'Data source', 'cable'], ['filter', 'Filter', 'filter'], ['parsing', 'Parsing', 'braces'],
  ['model', 'Data model', 'database'], ['routing', 'Routing', 'git-branch'], ['rule', 'Rule', 'file-code-2']
];
const MY_LAYER = Object.fromEntries(MY_LAYERS.map(([k, n, i]) => [k, { name: n, icon: i }]));
const MY_VERDICT = {
  Healthy: ['cx', 'Checked, nothing wrong'], Broken: ['rose', 'It cannot fire, or it fires on wrong data'], Noisy: ['amber', 'It fires too much'],
  Gap: ['indigo', 'Something that should be detected is not'], Mismatch: ['purple', 'XSIAM and the source product disagree'],
  Inconclusive: ['slate', 'Maya could not decide yet'], Leftover: ['slate', 'Disabled and unused'], Retired: ['slate', 'Disabled on Maya’s recommendation'], 'Not reviewed': ['slate', 'Maya has not looked at this rule']
};
const MY_CARD = {
  source: 'Missing data source', pipeline: 'Broken data or mapping', broken: 'Broken rule', noisy: 'Noisy rule',
  content: 'Existing content available', gap: 'Coverage gap', retire: 'Rules to retire', settings: 'Rule settings', handover: 'Handed over', check: 'Third-party source check'
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
      parsing: { name: 'check_point_threat_emulation', origin: 'Default', text: '[INGEST:vendor="Check Point", product="Threat Emulation",\n target_dataset="check_point_threat_emulation_raw", no_hit=drop]' },
      model: { name: 'Check Point model', origin: 'Default', ok: true }, dest: ['Analytics'] },
    { id: 'p-m365', src: 'm365', product: 'Microsoft 365 audit', filter: null,
      parsing: { name: 'msft_o365', origin: 'Default', text: '[INGEST:vendor="Microsoft", product="Office 365",\n target_dataset="msft_o365_general_raw", no_hit=keep]' },
      model: { name: 'Microsoft 365 model', origin: 'Default', ok: true }, dest: ['Analytics', 'Data lake'] },
    { id: 'p-dns', src: 'dns', product: 'DNS queries',
      filter: { name: 'Keep external lookups only', by: 'Guy R.', on: 'Jun 2', ok: true },
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
    R(230, 'FortiGate - Port scan from internal host', { pipe: 'p-fg', source: U('Guy R.'), issues7d: 0, mod: 'May 20th 2026', tactic: 'TA0007 - Discovery', tech: 'T1046 - Network Service Discovery', cat: 'Discovery', desc: 'One internal host is denied on more than 100 ports of another internal host in 5 minutes',
      xql: 'datamodel dataset = fortinet_fortigate_raw\n| filter xdm.observer.action = "deny" and xdm.source.zone = "internal"\n| comp count_distinct(xdm.target.port) as ports by xdm.source.ipv4, xdm.target.ipv4\n| filter ports > 100' }),
    R(231, 'FortiGate - Brute force on VPN portal', { pipe: 'p-fg', source: U('Guy R.'), issues7d: 266, mod: 'Mar 3rd 2026', tactic: 'TA0006 - Credential Access', tech: 'T1110 - Brute Force', cat: 'Credential Access', desc: 'More than 5 failed VPN logins for one user',
      xql: 'datamodel dataset = fortinet_fortigate_raw\n| filter xdm.event.type = "vpn-login" and xdm.event.outcome = "failure"\n| comp count() as fails by xdm.target.user.username\n| filter fails > 5' }),
    R(232, 'FortiGate - Outbound to rare country', { pipe: 'p-fg', source: U('Guy R.'), issues7d: 11, mod: 'Feb 11th 2026', tactic: 'TA0011 - Command and Control', tech: 'T1071 - Application Layer Protocol', cat: 'Command and Control', desc: 'Allowed outbound session to a country seen fewer than 3 times in 90 days',
      xql: 'datamodel dataset = fortinet_fortigate_raw\n| filter xdm.observer.action = "allow" and xdm.target.location.country not in (dataset = common_countries)\n| fields *' }),
    R(233, 'AWS - Root console login', { pipe: 'p-aws', source: U('Dana L.'), issues7d: 0, mod: 'Jan 9th 2026', tactic: 'TA0001 - Initial Access', tech: 'T1078.004 - Cloud Accounts', cat: 'Infiltration', desc: 'Console login by the root account',
      xql: 'datamodel dataset = amazon_aws_raw\n| filter xdm.event.operation = "ConsoleLogin" and xdm.source.user.user_type = "Root"\n| fields *' }),
    R(234, 'AWS - IAM policy change by new user', { pipe: 'p-aws', source: U('Dana L.'), issues7d: 0, mod: 'Jan 9th 2026', tactic: 'TA0003 - Persistence', tech: 'T1098 - Account Manipulation', cat: 'Persistence', desc: 'IAM policy attached by a user created in the last 7 days',
      xql: 'datamodel dataset = amazon_aws_raw\n| filter xdm.event.operation in ("AttachUserPolicy", "PutUserPolicy")\n| join (dataset = new_iam_users) as n n.user = xdm.source.user.username\n| fields *' }),
    R(235, 'Check Point - Malicious file verdict', { pipe: 'p-cp', source: U('Guy R.'), issues7d: 14, mod: 'Apr 2nd 2026', tactic: 'TA0002 - Execution', tech: 'T1204.002 - User Execution', cat: 'Malware', desc: 'Passes through malicious verdicts from Check Point Threat Emulation',
      xql: 'datamodel dataset = check_point_threat_emulation_raw\n| filter xdm.alert.name = "malicious"\n| fields *' }),
    R(236, 'M365 - Mail forwarding rule to external domain', { pipe: 'p-m365', source: U('Dana L.'), issues7d: 6, mod: 'Jun 18th 2026', tactic: 'TA0009 - Collection', tech: 'T1114.003 - Email Forwarding Rule', cat: 'Collection', desc: 'Inbox rule that forwards mail outside the company',
      xql: 'datamodel dataset = msft_o365_general_raw\n| filter xdm.event.operation = "New-InboxRule" and xdm.target.domain != "bankus.example"\n| fields *' }),
    R(237, 'M365 - Mass download from SharePoint', { pipe: 'p-m365', source: U('Dana L.'), issues7d: 3, mod: 'Jun 18th 2026', tactic: 'TA0010 - Exfiltration', tech: 'T1567 - Exfiltration Over Web Service', cat: 'Exfiltration', desc: 'One user downloads more than 500 files in 10 minutes',
      xql: 'datamodel dataset = msft_o365_general_raw\n| filter xdm.event.operation = "FileDownloaded"\n| comp count() as files by xdm.source.user.username\n| filter files > 500' }),
    R(238, 'DNS - Tunneling to rare TLD', { pipe: 'p-dns', source: U('Guy R.'), issues7d: 2, mod: 'Sep 30th 2026', tactic: 'TA0011 - Command and Control', tech: 'T1071.004 - DNS', cat: 'Command and Control', desc: 'Steady stream of long DNS queries to a rarely seen top-level domain',
      xql: 'datamodel dataset = infoblox_dns_raw\n| filter length(xdm.network.dns.dns_question.name) > 60\n| comp count() as q by xdm.source.ipv4, tld\n| filter q > 200' })
  ];

  /* ---------- Agentic tasks ---------- */
  const tasks = [
    { id: 'TSK-1001', card: 'pipeline', title: 'SentinelOne severity arrives empty: 3 rules create issues with no severity', verdict: 'Broken', conf: 'High', impact: 'High', layer: 'model', status: 'pending', opened: now - 5 * H,
      trigger: { kind: 'handoff', from: 'analyst', text: 'Josh opened 38 SentinelOne cases in 2 days with no severity, so they were triaged late.' },
      summary: 'A change in the SentinelOne pack renamed the field that carries severity. Three rules read it through the data model, so one mapping line breaks all three.',
      steps: ['Read the 38 cases Josh handed over: all came from three rules and all had an empty severity', 'Checked the three rules: the queries are valid and still fire', 'Followed the field the rules read, xdm.alert.severity, down to the data model', `Found that the SentinelOne pack update on ${packDay} stopped sending threatInfo_severity`, 'Wrote a corrected mapping and replayed 7 days of events through it'],
      diagnosis: 'The rules are fine. The data model maps xdm.alert.severity from a field the source no longer sends.',
      current: { kind: 'code', label: 'Data model rule · SentinelOne model', lines: [['[MODEL: dataset = sentinelone_xdr_raw]'], ['alter'], ['  xdm.event.type = eventType,'], ['  xdm.alert.original_threat_name = threatInfo_threatName,'], ['  xdm.alert.severity = threatInfo_severity,', 'del'], ['  xdm.source.host.hostname = agentRealtimeInfo_agentComputerName;']] },
      recommended: { kind: 'code', label: 'Data model rule · SentinelOne model', lines: [['[MODEL: dataset = sentinelone_xdr_raw]'], ['alter'], ['  xdm.event.type = eventType,'], ['  xdm.alert.original_threat_name = threatInfo_threatName,'], ['  xdm.alert.severity = coalesce(threatInfo_confidenceLevel, threatInfo_severity),', 'add'], ['  xdm.source.host.hostname = agentRealtimeInfo_agentComputerName;']] },
      validation: { rows: [['Issues with a severity (7 days)', 0, 1204, 1204]], note: 'Backtest on 7 days of stored events. The three rules themselves do not change.' },
      decision: { q: 'Approve the mapping fix?', approve: 'Approve fix', effect: 'The data model rule is updated. Severity is filled on new issues from all three rules.', risk: 'Medium. A mapping feeds every rule that reads the field, so all three were backtested.', reversible: true },
      affects: { rules: [215, 217, 220], node: { pipe: 'p-s1', stage: 'model' }, source: 'sentinelone' },
      pivots: [['streams', 'Data Streams', 'the data model step'], ['rules', 'Correlation Rules', 'the 3 rules']] },

    { id: 'TSK-1003', card: 'source', title: 'AWS audit logs stopped 46 hours ago: 2 detections are blind', verdict: 'Broken', conf: 'High', impact: 'High', layer: 'source', status: 'pending', opened: now - 3 * H,
      trigger: { kind: 'sweep', text: 'Hourly data-health sweep: the instance returned an error on 46 checks in a row.' },
      summary: `The production audit-log instance of Amazon S3 is in error. Two rules that look healthy have had no data to read since ${keyDay}.`,
      steps: [`Saw the instance “Cloud audit logs · production” in error since ${myWhen(down)}`, 'Read the error: access denied when reading the queue, the access key expired', 'Listed the rules that read this dataset: 2 rules, both enabled, both silent since then', 'Checked whether the events can be recovered: the queue keeps 14 days, so a backfill is possible'],
      diagnosis: 'The rules are fine and enabled. Their data source stopped, so they cannot fire.',
      current: { kind: 'settings', label: 'Amazon S3 · Cloud audit logs · production', rows: [['Status', 'Error'], ['Last event received', myWhen(down)], ['Error', 'Access denied, the access key expired'], ['Rules without data', '2']] },
      recommended: { kind: 'settings', label: 'Amazon S3 · Cloud audit logs · production', rows: [['Status', 'Connected'], ['Action', 'Replace the access key (needs a person)'], ['After reconnect', 'Backfill 46 hours from the queue'], ['Rules without data', '0']] },
      validation: { rows: [['Rules receiving data', 0, 2, 2]], note: `The queue keeps 14 days of events, so nothing is lost if the key is replaced before ${lastChance}.` },
      decision: { q: 'Replace the access key, or hand this to the cloud team?', approve: 'Hand over to cloud team', effect: 'Maya opens a request for the cloud team with the error, the instance and the two rules. She cannot create credentials herself.', risk: 'Low. Restores access that existed before. No new access is granted.', reversible: true, selfFix: 'You can also replace the key yourself in Data Sources.' },
      affects: { rules: [233, 234], instance: 's3-audit', source: 's3', node: { pipe: 'p-aws', stage: 'source' } },
      pivots: [['sources', 'Data Sources & Integrations', 'the instance in error'], ['rules', 'Correlation Rules', 'the 2 rules']] },

    { id: 'TSK-1002', card: 'noisy', title: 'Chrome extension installs: 1,250 issues a month, 92% from approved extensions', verdict: 'Noisy', conf: 'High', impact: 'Medium', layer: 'rule', status: 'pending', opened: now - 9 * H, noise: 'Low-value true positive',
      trigger: { kind: 'handoff', from: 'analyst', text: 'Josh resolved 140 cases from this rule as benign in 14 days. Analysts agreed with 138 of them.' },
      summary: 'The rule alerts on any installation of a browser extension. It is correct, and almost nobody acts on it.',
      steps: ['Measured 30 days: 1,250 issues', 'Grouped them by user and extension: 9 extensions approved by IT produce 1,150 of them', 'Checked the label quality: 138 of 140 benign verdicts were confirmed by an analyst', 'Selected issue suppression and an environment fact. The query does not change', 'Ran the change silently next to the live rule for 14 days'],
      diagnosis: 'Low-value true positive. The rule is correct and the behavior is expected in this environment.',
      current: { kind: 'settings', label: 'Chrome - Chrome Extension Install Event', rows: [['Issue suppression', 'Off'], ['Environment facts', 'None'], ['Issues in 30 days', '1,250']] },
      recommended: { kind: 'settings', label: 'Chrome - Chrome Extension Install Event', rows: [['Issue suppression', 'On · 24 hours · by user and extension ID'], ['Environment facts', `9 extensions approved by IT · review on ${reviewDay}`], ['Issues in 30 days', '100']] },
      validation: { rows: [['Issues per month', 1250, 100, 1250], ['Issues on unapproved extensions kept', 100, 100, 100]], silent: true, note: 'Backtest on 30 days and a 14-day silent test.' },
      decision: { q: 'Approve the suppression and the environment fact?', approve: 'Approve change', effect: 'Suppression is turned on for this rule. The fact is saved with a review date and is shared with Josh.', risk: 'Low. Unapproved extensions still alert.', reversible: true },
      affects: { rules: [224], source: 'chrome' },
      pivots: [['rules', 'Correlation Rules', 'the rule']] },

    { id: 'TSK-1004', card: 'pipeline', title: 'A cost-saving filter drops the events a port-scan rule needs', verdict: 'Broken', conf: 'Medium', impact: 'Medium', layer: 'filter', status: 'pending', opened: now - 26 * H,
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

    { id: 'TSK-1006', card: 'content', title: 'Impossible-travel logins: connect Okta and adopt the Marketplace rule', verdict: 'Gap', conf: 'High', impact: 'Medium', layer: 'source', status: 'pending', opened: now - 30 * H,
      trigger: { kind: 'human', text: 'Guy R. asked: “Add a rule for impossible-travel logins.”' },
      summary: 'The identity provider is not connected. A Marketplace rule covers impossible travel once it is, so no new rule is needed.',
      steps: ['Looked for the data first: Okta sign-in logs are not connected', 'Searched existing content: the Marketplace has “Okta - Impossible travel”', 'Checked what else the source unlocks: 9 Marketplace detections need Okta sign-in logs', 'No new rule is needed'],
      diagnosis: 'Coverage gap caused by a missing data source.',
      current: { kind: 'settings', label: 'Coverage for impossible travel', rows: [['Okta sign-in logs', 'Not connected'], ['Rule', 'None'], ['Detections that need Okta', '0 of 9 working']] },
      recommended: { kind: 'settings', label: 'Coverage for impossible travel', rows: [['Okta sign-in logs', 'Connect (needs the identity team)'], ['Rule', 'Enable Marketplace “Okta - Impossible travel”'], ['Detections that need Okta', '9 of 9 working']] },
      validation: { rows: [['Detections unlocked', 0, 9, 9]], note: 'The Marketplace rule runs in a silent test for 14 days after the source is connected, before it creates issues.' },
      decision: { q: 'Ask the identity team to connect Okta?', approve: 'Send the request', effect: 'Maya opens a request for the identity team. When data arrives she enables the Marketplace rule in a silent test and comes back with the result.', risk: 'Low. It is a recommendation. Nothing changes until the source is connected.', reversible: true },
      affects: { rules: [], source: 'okta' },
      pivots: [['sources', 'Data Sources & Integrations', 'where Okta would be added']] },

    { id: 'TSK-1005', card: 'retire', title: 'Retire 3 leftover rules: a duplicate, an old beta and a test', verdict: 'Noisy', conf: 'High', impact: 'Low', layer: 'rule', status: 'pending', opened: now - 50 * H, noise: 'Duplicate',
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

    { id: 'TSK-0998', card: 'noisy', title: 'VPN brute-force rule counts retries as attacks: tuned version is in a silent test', verdict: 'Noisy', conf: 'Medium', impact: 'Medium', layer: 'rule', status: 'progress', opened: now - 9 * D, noise: 'Logic error', progressNote: 'Silent test · day 9 of 14',
      trigger: { kind: 'handoff', from: 'analyst', text: 'Josh resolved 61 cases from this rule as benign in 14 days. Most were one user retrying an expired password.' },
      summary: 'The rule counts failed logins per user. A person or a service retrying an expired password looks the same as an attack.',
      steps: ['Read the rule’s intent: catch password guessing against the VPN portal', 'Found the flaw: it groups by user, not by source, and never asks whether a login then succeeded', 'Rewrote it: group by source address, raise the threshold, require a success after the failures', 'Backtested on 30 days, then started a 14-day silent test'],
      diagnosis: 'Logic error in the rule. It counts failed logins per user and never checks whether a login then succeeded.',
      current: { kind: 'code', label: 'XQL · FortiGate - Brute force on VPN portal', lines: [['datamodel dataset = fortinet_fortigate_raw'], ['| filter xdm.event.type = "vpn-login" and xdm.event.outcome = "failure"', 'del'], ['| comp count() as fails by xdm.target.user.username', 'del'], ['| filter fails > 5', 'del']] },
      recommended: { kind: 'code', label: 'XQL · FortiGate - Brute force on VPN portal', lines: [['datamodel dataset = fortinet_fortigate_raw'], ['| filter xdm.event.type = "vpn-login"', 'add'], ['| comp count_if(xdm.event.outcome = "failure") as fails,', 'add'], ['       count_if(xdm.event.outcome = "success") as ok by xdm.source.ipv4', 'add'], ['| filter fails > 20 and ok > 0', 'add']] },
      validation: { rows: [['Issues in 9 days of silent test', 342, 31, 342], ['Confirmed attacks kept', 4, 4, 4]], silent: true, note: 'Silent test, day 9 of 14. A decision is requested when the test ends.' },
      decision: null,
      affects: { rules: [231], source: 'fortigate' },
      pivots: [['rules', 'Correlation Rules', 'the rule']] },

    { id: 'TSK-0996', card: 'noisy', title: 'DNS tunneling rule: too little volume to judge', verdict: 'Inconclusive', conf: 'Low', impact: 'Low', layer: 'rule', status: 'done', end: 'watch', opened: now - 4 * D, closed: now - 4 * D + 2 * H,
      trigger: { kind: 'sweep', text: 'Weekly sweep: a rule edited 5 days ago has fired twice.' },
      summary: 'The rule was edited five days ago. Two issues in five days are not enough to say whether it is noisy or healthy.',
      steps: ['Counted issues since the edit: 2', 'Both were closed as benign, by one analyst, with no reason given', 'Decided not to act on two weak labels'],
      diagnosis: 'Not enough evidence to call the rule noisy or healthy.',
      validation: null, decision: null, outcome: `No change. Maya checks again on ${recheck}.`,
      affects: { rules: [238] }, pivots: [['rules', 'Correlation Rules', 'the rule']] },

    { id: 'TSK-0994', card: 'settings', title: 'ATT&CK mapping added to 2 Chrome rules', verdict: 'Gap', conf: 'High', impact: 'Low', layer: 'rule', status: 'done', end: 'approved', by: 'Guy R.', opened: now - 3 * D, closed: now - 30 * H,
      trigger: { kind: 'sweep', text: 'Weekly sweep: two enabled rules had no tactic or technique.' },
      summary: 'Two Chrome rules had no ATT&CK mapping, so they were missing from the coverage view.',
      steps: ['Read each rule’s query and description', 'Proposed a tactic and a technique for each', 'Guy R. approved both'],
      diagnosis: 'Missing ATT&CK mapping. The rules worked but were not counted in the coverage view.',
      validation: null, decision: null, outcome: 'Approved by Guy R. Both rules now appear under their techniques in the coverage view.',
      affects: { rules: [221, 223] }, pivots: [['rules', 'Correlation Rules', 'the 2 rules']] },

    { id: 'TSK-0991', card: 'source', title: 'Microsoft 365 audit logs arrived 3 hours late', verdict: 'Healthy', conf: 'High', impact: 'Low', layer: 'source', status: 'done', end: 'auto', opened: now - 2 * D, closed: now - 2 * D + 3 * H,
      trigger: { kind: 'sweep', text: 'Hourly data-health sweep: no events for 3 checks in a row.' },
      summary: 'The source went quiet for 3 hours and recovered without help. The late events arrived and both rules ran on them.',
      steps: ['Saw no events from “Audit logs · general” for 3 hours', 'Opened a task and kept watching', 'Events resumed, including the delayed ones', 'Confirmed both Microsoft 365 rules ran on the late events'],
      diagnosis: 'A delay on the vendor side. Nothing was lost.',
      validation: null, decision: null, outcome: 'Closed automatically when the problem went away. No decision was needed.',
      affects: { rules: [236, 237], source: 'm365' }, pivots: [['sources', 'Data Sources & Integrations', 'the source']] },

    { id: 'TSK-0988', card: 'handover', title: 'Palo Alto analytic “Suspicious PowerShell download” is noisy here: evidence sent to the content team', verdict: 'Noisy', conf: 'Medium', impact: 'Medium', layer: 'rule', status: 'done', end: 'handed', opened: now - 6 * D, closed: now - 6 * D + 4 * H,
      trigger: { kind: 'handoff', from: 'analyst', text: 'Josh resolved 412 issues from this analytic as benign in one week.' },
      summary: 'This analytic is Palo Alto content and cannot be tuned in the tenant.',
      steps: ['Traced the benign issues to signed software-distribution scripts', 'Confirmed the logic belongs to Palo Alto, not to the customer', 'Sent the field evidence to the Palo Alto content team', 'Changed nothing in this tenant'],
      diagnosis: 'Noise in Palo Alto content.',
      validation: null, decision: null, outcome: 'Handed over. Nothing changed in the tenant. The fix arrives in a content release.',
      affects: { rules: [] }, pivots: [] }
  ];

  /* ---------- What Maya did, newest first ---------- */
  const log = [
    [now - 6 * 60000, 'sweep', `Hourly data-health sweep: ${sources.flatMap(x => x.instances).length} instances checked, ${sources.flatMap(x => x.instances).filter(i => i.status === 'err').length} in error`],
    [now - 41 * 60000, 'check', 'Compared Check Point verdicts with XSIAM: 14 of 14 match'],
    [now - 3 * H, 'task', 'Opened TSK-1003: AWS audit logs stopped'],
    [now - 5 * H, 'handoff', 'Josh handed over 38 SentinelOne cases with no severity'],
    [now - 5 * H + 9 * 60000, 'task', 'Opened TSK-1001: one mapping line behind 3 rules'],
    [now - 9 * H, 'test', 'Silent test finished for the Chrome extension rule: 14 days'],
    [now - 9 * H + 60000, 'task', 'Opened TSK-1002 with the test result'],
    [now - 26 * H, 'sweep', `Weekly sweep: ${rules.length} rules reviewed, 2 candidates`],
    [now - 30 * H, 'done', 'Guy R. approved TSK-0994: ATT&CK mapping on 2 rules']
  ].map(([t, kind, text]) => ({ t, kind, text }));

  return { sources, pipes, rules, tasks, log, facts: [], dates: { packDay, filterDay, reviewDay } };
}

/* ---------- Derived values: never typed twice ---------- */
const myOpen = W => W.tasks.filter(t => t.status !== 'done');
/* One order everywhere: most impact first, then the one that has waited longest. */
const myRank = (a, b) => ({ High: 0, Medium: 1, Low: 2 })[a.impact] - ({ High: 0, Medium: 1, Low: 2 })[b.impact] || a.opened - b.opened;
const myPendingTasks = W => W.tasks.filter(t => t.status === 'pending').sort(myRank);
function myRuleReview(W, r) {
  if (r.retired) return { v: 'Retired', conf: '', task: W.tasks.find(t => (t.affects.rules || []).includes(r.id) && t.card === 'retire'), st: 'Done' };
  const ts = W.tasks.filter(t => (t.affects.rules || []).includes(r.id));
  const open = ts.find(t => t.status !== 'done');
  if (open && open.card === 'retire' && r.status === 'Disabled') return { v: 'Leftover', conf: open.conf, task: open, st: 'Pending decision' };
  if (open) return { v: open.verdict, conf: open.conf, task: open, st: open.status === 'pending' ? 'Pending decision' : 'In progress' };
  const last = ts.slice().sort((a, b) => (b.closed || 0) - (a.closed || 0))[0];
  if (last) {
    if (last.end === 'rejected' || last.end === 'dismissed') return { v: last.verdict, conf: last.conf, task: last, st: 'Done' };
    if (last.end === 'watch') return { v: 'Inconclusive', conf: last.conf, task: last, st: 'Done' };
    return { v: 'Healthy', conf: 'High', task: last, st: 'Done' };
  }
  if (r.status === 'Disabled') return { v: 'Not reviewed', conf: '', task: null, st: '' };
  return { v: 'Healthy', conf: 'High', task: null, st: '' };
}
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
    sources: W.sources.length, byVerdict, removed
  };
}
/* Open tasks that sit on one step of one pipeline */
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
  if (choice === 'reject') return close('rejected', `Rejected by ${who}. Nothing changed. The verdict stays on the affected objects.`);
  if (choice === 'dismiss') return close('dismissed', `Dismissed by ${who}. Nothing changed, and Maya will not raise this again unless it gets worse.`);
  const edited = choice === 'edit', end = edited ? 'edited' : 'approved', verb = edited ? 'Approved with edits' : 'Approved';
  if (t.id === 'TSK-1001') {
    W.pipes.find(p => p.id === 'p-s1').model.ok = true;
    close(end, `${verb} by ${who}. Severity is filled on new issues from all three rules. Maya watches for 7 days and reopens the task if the field goes empty again.`);
  } else if (t.id === 'TSK-1002') {
    const r = rule(224); r.supp = { dur: '24 hours', fields: 'user, extension ID' }; r.issues7d = 23; t.weekly = 267;
    W.facts.push({ text: '9 browser extensions approved by IT', review: W.dates.reviewDay, by: who });
    close(end, `${verb} by ${who}. Suppression is on. In the backtest this removes 1,150 of 1,250 issues a month and keeps every issue on an unapproved extension.`);
  } else if (t.id === 'TSK-1003') {
    t.status = 'progress'; t.by = who; t.progressNote = 'Waiting for the cloud team'; t.decision = null; t.handed = true;
    W.log.unshift({ t: now, kind: 'handoff', text: 'TSK-1003 handed to the cloud team: replace the expired access key' });
    return;
  } else if (t.id === 'TSK-1004') {
    W.pipes.find(p => p.id === 'p-fg').filter.ok = true; W.pipes.find(p => p.id === 'p-fg').filter.name = 'Drop internet-side firewall deny';
    close(end, `${verb} by ${who}. Internal deny events are kept. A 7-day silent test started on the port-scan rule, because no backtest was possible.`);
  } else if (t.id === 'TSK-1005') {
    rule(222).status = 'Disabled'; rule(222).retired = true; rule(222).issues7d = 0; rule(216).retired = true; rule(218).retired = true; t.weekly = 61;
    close(end, `${verb} by ${who}. Rule 222 is disabled and rules 216 and 218 are retired. All three can be restored.`);
  } else if (t.id === 'TSK-1006') {
    t.status = 'progress'; t.by = who; t.progressNote = 'Waiting for the identity team'; t.decision = null; t.handed = true;
    W.log.unshift({ t: now, kind: 'handoff', text: 'TSK-1006: request sent to the identity team to connect Okta' });
    return;
  }
  W.log.unshift({ t: now, kind: 'done', text: `${who} ${edited ? 'approved an edited version of' : 'approved'} ${t.id}` });
}
/* A person fixes the source in the native screen. The task notices and closes itself. */
function myReconnect(W, instId, whoName) {
  const who = whoName.replace(/\.$/, '');
  const inst = W.sources.flatMap(s => s.instances).find(i => i.id === instId); if (!inst) return null;
  inst.status = 'ok'; inst.last = Date.now(); inst.count = 18400; inst.note = '';
  const t = W.tasks.find(x => x.status !== 'done' && x.affects.instance === instId);
  if (t) { t.status = 'done'; t.end = 'auto'; t.closed = Date.now(); t.by = who; t.decision = null;
    t.outcome = `Closed automatically. ${who} replaced the access key in Data Sources, events are arriving again, and Maya is backfilling 46 hours from the queue.`;
    W.rules.filter(r => t.affects.rules.includes(r.id)).forEach(r => { r.backfill = true; });
    W.log.unshift({ t: Date.now(), kind: 'done', text: `${t.id} closed automatically: data is arriving again` }); }
  return t;
}
