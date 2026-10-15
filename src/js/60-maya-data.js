/* ======================================================================
   SECOPS ENGINEERING · THE WORLD
   One source of truth. Every number on every screen is computed from the
   objects below, so the screens cannot disagree with each other.
   Rule names and screen layouts follow the real product screens. Volumes,
   people and failures are invented for the story.
   One agent is in scope: the Detection Engineer (rules, indicators,
   coverage). When a cause sits in the data pipeline (a filter, a parsing
   rule, a data model, an integration), it finds the cause, writes the fix
   and sends it to the team that owns that part. It does not change it.
   ====================================================================== */
const MY_LAYERS = [
  ['integration', 'Integration', 'plug'], ['source', 'Data source', 'cable'], ['filter', 'Filter', 'filter'], ['parsing', 'Parsing', 'braces'],
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
  Keep: ['slate', 'Checked. Nothing to change'],
  'Nothing found': ['slate', 'A run of a job that found nothing new. Nothing needs you']
};
const MY_CARD = {
  source: 'Missing data source', integration: 'Missing integration', pipeline: 'Broken data or mapping', broken: 'Broken rule', noisy: 'Noisy rule',
  content: 'Existing content available', gap: 'Coverage gap', ioc: 'Indicator', retire: 'Rules to retire', settings: 'Rule settings', handover: 'Handed over', check: 'Third-party source check'
};
const MY_TRIGGER = { threshold: ['Threshold reached', 'gauge'], sweep: ['Scheduled sweep', 'clock'], change: ['Change event', 'git-commit-horizontal'], handoff: ['Handoff', 'corner-down-right'], human: ['Human request', 'user'] };

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
      filter: { name: 'Drop internet-side firewall deny', by: 'Dana L.', on: filterDay, ok: true },
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
      xql: 'datamodel dataset = msft_o365_general_raw\n| filter xdm.event.operation = "New-InboxRule" and xdm.target.domain != "corp.example"\n| fields *' }),
    R(237, 'M365 - Mass download from SharePoint', { pipe: 'p-m365', source: U('Dana L.'), issues7d: 25, mod: 'Jun 18th 2026', tactic: 'TA0010 - Exfiltration', tech: 'T1567 - Exfiltration Over Web Service', cat: 'Exfiltration', desc: 'One user downloads more than 500 files in 10 minutes',
      xql: 'datamodel dataset = msft_o365_general_raw\n| filter xdm.event.operation = "FileDownloaded"\n| comp count() as files by xdm.source.user.username\n| filter files > 500' }),
    R(238, 'DNS - Tunneling to rare TLD', { pipe: 'p-dns', source: U('Ariel B.'), issues7d: 2, mod: 'Sep 30th 2026', tactic: 'TA0011 - Command and Control', tech: 'T1071.004 - DNS', cat: 'Command and Control', desc: 'Steady stream of long DNS queries to a rarely seen top-level domain',
      xql: 'datamodel dataset = infoblox_dns_raw\n| filter length(xdm.network.dns.dns_question.name) > 60\n| comp count() as q by xdm.source.ipv4, tld\n| filter q > 200' })
  ];

  /* ---------- The rest of the tenant ----------
     A real tenant has dozens of sources and well over a hundred correlation rules. The story above happens
     inside that. Everything below is generated from one fixed seed, so every load shows the same tenant. */
  let seed = 20261005; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296, pick = a => a[Math.floor(rnd() * a.length)];
  const KIT = {
    identity: [['Brute force followed by a successful login', 'TA0006 - Credential Access', 'T1110 - Brute Force'], ['MFA method removed for a user', 'TA0003 - Persistence', 'T1556 - Modify Authentication Process'], ['Login from a country not seen in 90 days', 'TA0001 - Initial Access', 'T1078 - Valid Accounts'], ['Admin role granted outside change window', 'TA0004 - Privilege Escalation', 'T1098 - Account Manipulation'], ['Dormant account became active', 'TA0001 - Initial Access', 'T1078 - Valid Accounts']],
    network: [['Outbound session to a known C2 address', 'TA0011 - Command and Control', 'T1071 - Application Layer Protocol'], ['Large upload to a rare destination', 'TA0010 - Exfiltration', 'T1048 - Exfiltration Over Alternative Protocol'], ['Internal host scanning many ports', 'TA0007 - Discovery', 'T1046 - Network Service Discovery'], ['Traffic over a non-standard port', 'TA0011 - Command and Control', 'T1571 - Non-Standard Port'], ['Remote access tool traffic', 'TA0011 - Command and Control', 'T1219 - Remote Access Software']],
    cloud: [['Storage made public', 'TA0010 - Exfiltration', 'T1530 - Data from Cloud Storage'], ['Security group opened to the internet', 'TA0005 - Defense Evasion', 'T1562.007 - Disable or Modify Cloud Firewall'], ['Audit logging disabled', 'TA0005 - Defense Evasion', 'T1562.008 - Disable Cloud Logs'], ['Access key created for another user', 'TA0003 - Persistence', 'T1098.001 - Additional Cloud Credentials'], ['Unusual instance type launched', 'TA0040 - Impact', 'T1496 - Resource Hijacking']],
    endpoint: [['Credential dumping tool executed', 'TA0006 - Credential Access', 'T1003 - OS Credential Dumping'], ['Shadow copies deleted', 'TA0040 - Impact', 'T1490 - Inhibit System Recovery'], ['Unsigned driver loaded', 'TA0004 - Privilege Escalation', 'T1068 - Exploitation for Privilege Escalation'], ['Scheduled task created by a script', 'TA0003 - Persistence', 'T1053.005 - Scheduled Task'], ['Security tool stopped', 'TA0005 - Defense Evasion', 'T1562.001 - Disable or Modify Tools']],
    email: [['Mail from a look-alike domain', 'TA0001 - Initial Access', 'T1566.002 - Spearphishing Link'], ['Attachment with a macro delivered', 'TA0001 - Initial Access', 'T1566.001 - Spearphishing Attachment'], ['Many users clicked the same link', 'TA0002 - Execution', 'T1204.001 - Malicious Link']],
    saas: [['Mass download by one user', 'TA0009 - Collection', 'T1530 - Data from Cloud Storage'], ['Sensitive file shared outside the company', 'TA0010 - Exfiltration', 'T1567 - Exfiltration Over Web Service'], ['API token created', 'TA0003 - Persistence', 'T1098.001 - Additional Cloud Credentials'], ['Admin impersonated a user', 'TA0004 - Privilege Escalation', 'T1078 - Valid Accounts']],
    infra: [['Privileged command on a production host', 'TA0002 - Execution', 'T1059 - Command and Scripting Interpreter'], ['New privileged container', 'TA0004 - Privilege Escalation', 'T1611 - Escape to Host'], ['Secret read by an unusual identity', 'TA0006 - Credential Access', 'T1552 - Unsecured Credentials'], ['Configuration changed outside change window', 'TA0005 - Defense Evasion', 'T1562 - Impair Defenses']]
  };
  /* name, vendor, category, kit, instances, GB a day, number of correlation rules */
  const MORE = [
    ['Palo Alto Networks NGFW', 'Palo Alto Networks', 'Network Security', 'network', 6, 410, 5], ['Prisma Access', 'Palo Alto Networks', 'Network Security', 'network', 2, 180, 3], ['Cortex XDR Agent', 'Palo Alto Networks', 'Endpoint', 'endpoint', 1, 620, 5],
    ['Microsoft Entra ID', 'Microsoft', 'Identity', 'identity', 2, 38, 5], ['Microsoft Defender for Endpoint', 'Microsoft', 'Endpoint', 'endpoint', 1, 95, 4], ['Azure Activity Logs', 'Microsoft', 'Cloud Services', 'cloud', 3, 44, 4], ['Azure Flow Logs', 'Microsoft', 'Cloud Services', 'network', 3, 260, 2], ['Microsoft Intune', 'Microsoft', 'Endpoint', 'infra', 1, 4, 2],
    ['Windows Event Collector', 'Microsoft', 'Endpoint', 'endpoint', 4, 340, 5], ['Active Directory', 'Microsoft', 'Identity', 'identity', 2, 52, 5],
    ['Google Workspace', 'Google', 'Email', 'saas', 2, 21, 4], ['Google Cloud Audit Logs', 'Google', 'Cloud Services', 'cloud', 2, 36, 4], ['Google Cloud VPC Flow', 'Google', 'Cloud Services', 'network', 2, 150, 2],
    ['AWS GuardDuty', 'Amazon', 'Cloud Services', 'cloud', 1, 2, 3], ['AWS VPC Flow Logs', 'Amazon', 'Cloud Services', 'network', 4, 390, 3], ['AWS WAF', 'Amazon', 'Network Security', 'network', 2, 85, 2],
    ['Cloudflare', 'Cloudflare', 'Network Security', 'network', 1, 120, 3], ['Akamai WAF', 'Akamai', 'Network Security', 'network', 1, 64, 2], ['Imperva WAF', 'Imperva', 'Network Security', 'network', 1, 30, 0],
    ['Zscaler Internet Access', 'Zscaler', 'Network Security', 'network', 2, 280, 4], ['Zscaler Private Access', 'Zscaler', 'Network Security', 'network', 1, 40, 2], ['Netskope', 'Netskope', 'Network Security', 'saas', 1, 58, 3],
    ['Cisco ASA', 'Cisco', 'Network Security', 'network', 3, 140, 3], ['Cisco Umbrella', 'Cisco', 'Network Security', 'network', 1, 76, 2], ['Cisco ISE', 'Cisco', 'Identity', 'identity', 1, 12, 2], ['Cisco Duo', 'Cisco', 'Identity', 'identity', 1, 3, 3],
    ['F5 BIG-IP', 'F5', 'Network Security', 'network', 2, 48, 2], ['Citrix NetScaler', 'Citrix', 'Network Security', 'network', 2, 26, 2], ['Corelight', 'Corelight', 'Network Security', 'network', 2, 310, 4], ['Darktrace', 'Darktrace', 'Network Security', 'network', 1, 6, 0],
    ['Proofpoint TAP', 'Proofpoint', 'Email', 'email', 1, 9, 3], ['Mimecast', 'Mimecast', 'Email', 'email', 1, 14, 3],
    ['Linux auditd', 'Linux', 'Endpoint', 'infra', 5, 210, 4], ['Kubernetes Audit Logs', 'CNCF', 'Cloud Services', 'infra', 3, 88, 4], ['VMware vCenter', 'VMware', 'Cloud Services', 'infra', 1, 7, 2], ['Jamf Pro', 'Jamf', 'Endpoint', 'endpoint', 1, 5, 2],
    ['GitHub Audit Log', 'GitHub', 'Applications', 'saas', 1, 3, 4], ['GitLab Audit Events', 'GitLab', 'Applications', 'saas', 1, 2, 2], ['Slack Audit Logs', 'Slack', 'Applications', 'saas', 1, 2, 2], ['Salesforce', 'Salesforce', 'Applications', 'saas', 1, 11, 3],
    ['ServiceNow', 'ServiceNow', 'Applications', 'saas', 1, 4, 0], ['Workday', 'Workday', 'Applications', 'saas', 1, 1, 2], ['Box', 'Box', 'Applications', 'saas', 1, 6, 2], ['Atlassian Cloud', 'Atlassian', 'Applications', 'saas', 1, 3, 0],
    ['CyberArk PAM', 'CyberArk', 'Identity', 'identity', 1, 2, 4], ['HashiCorp Vault', 'HashiCorp', 'Identity', 'infra', 1, 1, 2], ['Ping Identity', 'Ping Identity', 'Identity', 'identity', 1, 8, 0],
    ['Tenable Vulnerability Management', 'Tenable', 'Vulnerability Management', 'infra', 1, 5, 0], ['Wiz', 'Wiz', 'Cloud Services', 'cloud', 1, 3, 2], ['Snowflake', 'Snowflake', 'Applications', 'saas', 1, 17, 2], ['Oracle Database Audit', 'Oracle', 'Applications', 'infra', 2, 72, 0], ['Microsoft SQL Server Audit', 'Microsoft', 'Applications', 'infra', 3, 45, 2]
  ];
  const WHO = ['Dana L.', 'Omer A.', 'Ariel B.', 'Noa S.', 'Yuval K.'], SITES = ['US East', 'US West', 'EMEA', 'APAC', 'Israel', 'India'], MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  [['s3', 12], ['fortigate', 18], ['crowdstrike', 54], ['unit42', 1], ['chrome', 3], ['sentinelone', 8], ['m365', 6], ['mitre', 1], ['checkpoint', 1], ['dns', 9]].forEach(([id, gb]) => { sources.find(x => x.id === id).gb = gb; });
  let rid = 300;
  MORE.forEach(([name, vendor, cat, kit, n, gb, nr]) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ds = id.replace(/-/g, '_');
    const per = Math.round(gb * 1.6e6 / n);
    sources.push({ id, name, vendor, cat, pack: '', gb, instances: Array.from({ length: n }, (_, k) => ({ id: `${id}-${k + 1}`, name: n === 1 ? name : `${name} · ${SITES[k]}`, status: 'ok', count: Math.round(per * (.7 + rnd() * .6)), last: now - Math.round(20000 + rnd() * 240000) })) });
    const origin = pick(['Default', 'Default', 'Marketplace']);
    pipes.push({ id: 'p-' + id, src: id, product: name, filter: rnd() < .22 ? { name: 'Drop health-check events', by: pick(WHO), on: `${pick(MONTHS)} ${1 + Math.floor(rnd() * 27)}`, ok: true } : null,
      parsing: { name: ds, origin, text: `[INGEST:vendor="${vendor}", product="${name}",\n target_dataset="${ds}_raw", no_hit=keep]` },
      model: nr ? { name: `${name} model`, origin, ok: true } : null, dest: nr ? ['Analytics', 'Data lake'] : ['Data lake'] });
    const short = name.replace(/^(Microsoft|Google|Palo Alto Networks|AWS|Cisco) /, '').replace(/ (Audit Logs?|Audit Events|Vulnerability Management)$/, '');
    KIT[kit].slice().sort(() => rnd() - .5).slice(0, nr).forEach(([what, tactic, tech]) => {
      const iss = rnd() < .3 ? 0 : Math.round(Math.pow(rnd(), 2.2) * 160) + 1;
      rules.push(R(rid++, `${short} - ${what}`, { pipe: 'p-' + id, source: rnd() < .35 ? P(vendor) : U(pick(WHO)), issues7d: iss, nshare: +(.12 + rnd() * .5).toFixed(2), mod: `${pick(MONTHS)} ${1 + Math.floor(rnd() * 27)}th 2026`, tactic, tech, cat: tactic.split(' - ')[1], desc: `${what}, seen in ${name} data`,
        type: rnd() < .25 ? 'SCHEDULED' : 'REAL_TIME', xql: `datamodel dataset = ${ds}_raw\n| filter xdm.event.type != null\n| comp count() as hits by xdm.source.user.username\n| filter hits > 0` }));
    });
  });
  /* How much of what each story rule creates ends with no action. Read from analyst and Investigation Agent verdicts. */
  [[224, .92], [231, .81], [237, .88], [222, .95], [215, .34], [217, .41], [220, .22], [221, .3], [223, .11], [225, .36], [232, .45], [235, .07], [236, .17], [238, .5]].forEach(([id, n]) => { rules.find(r => r.id === id).nshare = n; });

  /* ---------- Missions ---------- */
  const tasks = [
    { id: 'MSN-1001', card: 'broken', title: '3 SentinelOne rules went silent after a pack update', verdict: 'Broken', conf: 'High', impact: 'High', layer: 'model', status: 'pending', opened: now - 5 * H,
      teamFix: 'data platform team', teamAuto: true, teamCheck: 'Replay the 2 days and check that the three rules fire', teamThen: 'When the team applies it, the Detection Engineer replays the 2 days and closes the mission if the rules fire',
      trigger: { kind: 'change', text: `The SentinelOne pack was updated on ${packDay}. Three rules have created no issue since then.` },
      summary: 'Three rules that created 1,204 issues a week stopped firing two days ago. The rules did not change. The pack update renamed a raw field, and the data model still maps the old name, so the field the rules filter on arrives empty.',
      steps: ['Saw three enabled SentinelOne rules with no issue since the pack update', 'Checked the rules: valid queries, nothing was edited', 'Checked the data: events still arrive, 12.1K a day', 'Followed the field the rules filter on, xdm.event.type: it is empty on every new event', 'Compared raw events before and after the update: eventType is gone, event_type is new', 'Read the data model rule: it still maps xdm.event.type from eventType. The data model belongs to the data platform team', 'Wrote a mapping that reads the new name and falls back to the old one', 'Replayed the 2 days since the update through it: the three rules fire again'],
      diagnosis: 'The rules are fine. They filter on xdm.event.type, and the data model no longer fills it because it reads a raw field the source stopped sending.',
      current: { kind: 'code', label: 'Data model rule · SentinelOne model', lines: [['[MODEL: dataset = sentinelone_xdr_raw]'], ['alter'], ['  xdm.event.type = eventType,', 'del'], ['  xdm.alert.original_threat_name = threatInfo_threatName,'], ['  xdm.alert.severity = threatInfo_confidenceLevel,'], ['  xdm.source.host.hostname = agentRealtimeInfo_agentComputerName;']] },
      recommended: { kind: 'code', label: 'Data model rule · SentinelOne model', lines: [['[MODEL: dataset = sentinelone_xdr_raw]'], ['alter'], ['  xdm.event.type = coalesce(event_type, eventType),', 'add'], ['  xdm.alert.original_threat_name = threatInfo_threatName,'], ['  xdm.alert.severity = threatInfo_confidenceLevel,'], ['  xdm.source.host.hostname = agentRealtimeInfo_agentComputerName;']] },
      validation: { rows: [['Issues from the three rules (2-day replay)', 0, 344, 344]], note: 'Replayed the 2 days since the update through the corrected mapping. The three rules themselves do not change.' },
      decision: { q: 'Send the mapping fix to the data platform team?', approve: 'Send the fix', effect: 'The Detection Engineer sends the data platform team the corrected mapping, the replay and the three rules. It does not change the data model itself.', risk: 'Medium. A mapping feeds every rule that reads the field, so all three were replayed. The team reviews it before applying.', reversible: true },
      after: 'Closed automatically. The data platform team applied the mapping fix. The last 2 days were replayed: the three rules fire again and the 344 missed issues were created.',
      affects: { rules: [215, 217, 220], node: { pipe: 'p-s1', stage: 'model' }, source: 'sentinelone' },
      pivots: [['rules', 'Correlation Rules', 'the 3 rules'], ['streams', 'Data Streams', 'the data model step']] },

    { id: 'MSN-1003', card: 'source', title: 'AWS audit logs stopped 46 hours ago: 2 detections are blind', verdict: 'Broken', conf: 'High', impact: 'High', layer: 'source', status: 'pending', opened: now - 45 * H,
      teamFix: 'cloud team', teamCheck: 'Backfill 46 hours and check that the two rules run', teamThen: 'The mission closes on its own when the data arrives',
      trigger: { kind: 'sweep', text: 'Hourly data check for detections: the instance returned an access error on the first check after the key expired.' },
      summary: `The production audit-log instance of Amazon S3 is in error. Two rules that look healthy have had no data to read since ${keyDay}.`,
      steps: [`Saw the instance “Cloud audit logs · production” in error since ${myWhen(down)}`, 'Read the error: access denied when reading the queue, the access key expired', 'Listed the rules that read this dataset: 2 rules, both enabled, both silent since then', 'Checked whether the events can be recovered: the queue keeps 14 days, so a backfill is possible'],
      diagnosis: 'The rules are fine and enabled. Their data source stopped, so they cannot fire.',
      current: { kind: 'settings', label: 'Amazon S3 · Cloud audit logs · production', rows: [['Status', 'Error'], ['Last event received', myWhen(down)], ['Error', 'Access denied, the access key expired'], ['Rules without data', '2']] },
      recommended: { kind: 'settings', label: 'Amazon S3 · Cloud audit logs · production', rows: [['Status', 'Connected'], ['Action', 'Replace the access key (needs a person)'], ['After reconnect', 'Backfill 46 hours from the queue'], ['Rules without data', '0']] },
      validation: { rows: [['Rules receiving data', 0, 2, 2]], note: `The queue keeps 14 days of events, so nothing is lost if the key is replaced before ${lastChance}.` },
      decision: { q: 'Replace the access key, or hand this to the cloud team?', approve: 'Hand over to cloud team', effect: 'The Detection Engineer opens a request for the cloud team with the error, the instance and the two rules. An agent cannot create credentials.', risk: 'Low. Restores access that existed before. No new access is granted.', reversible: true, selfFix: 'You can also replace the key yourself in Data Sources.' },
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

    { id: 'MSN-1004', card: 'broken', title: 'Port-scan rule was silent for 23 days: data is back, silent test running', verdict: 'Broken', conf: 'Medium', impact: 'Medium', layer: 'filter', status: 'progress', progressNote: 'Silent test · day 1 of 7', opened: now - 26 * H,
      trigger: { kind: 'sweep', text: 'Daily rule-health sweep: an enabled rule has not fired for 23 days, while its source is healthy.' },
      summary: `The port-scan rule only reads firewall “deny” events, and a filter added on ${filterDay} dropped all of them. Ariel B. sent the narrower filter to the data platform team and they applied it. The dropped events were never stored, so the rule is now proven with a silent test.`,
      steps: [`Saw the rule “FortiGate - Port scan from internal host” silent since ${filterDay}`, 'Checked the rule: valid, nothing was edited', 'Checked the source: connected, 1.9M events a day', `Counted deny events before and after the filter step: 38,000 a day go in, none come out. The filter “Drop firewall deny (cost saving)” was added ${filterDay} by Dana L.`, 'Wrote a narrower filter that keeps internal deny events and still drops internet-side ones', 'Ariel B. approved sending it. The data platform team applied it: internal deny events are kept again', 'Started a 7-day silent test, because no backtest is possible'],
      diagnosis: 'The rule is valid. Its events were removed by a filter before the rule saw them.',
      validation: null, decision: null,
      affects: { rules: [230], source: 'fortigate' },
      pivots: [['rules', 'Correlation Rules', 'the rule']] },
    { id: 'MSN-1006', card: 'gap', title: 'Impossible-travel logins are not detected: no Okta sign-in data', verdict: 'Gap', conf: 'High', impact: 'Medium', layer: 'integration', status: 'pending', opened: now - 30 * H,
      teamFix: 'identity team', teamCheck: 'Run the Marketplace rule in a 14-day silent test', teamThen: 'The mission continues on its own when the Okta data arrives',
      trigger: { kind: 'human', text: 'Ariel B. asked: “Add a rule for impossible-travel logins.”' },
      summary: 'No rule can detect impossible travel today, because Okta sign-in logs are not ingested. A Marketplace rule covers it once they are, so no new rule is needed. Connecting Okta needs an API token from the identity team.',
      steps: ['Looked for the data first: Entra ID and Active Directory sign-ins arrive, Okta sign-ins do not', 'Searched existing content: the Marketplace has “Okta - Impossible travel”', 'Checked the Okta pack: it brings the parser, the data model and 9 detections, with no custom work', 'Estimated the volume: about 2 GB a day', 'No new rule is needed. The missing piece is the integration, and an agent cannot create credentials, so this needs the identity team'],
      diagnosis: 'Coverage gap caused by a missing integration, not by a missing rule.',
      current: { kind: 'settings', label: 'Okta', rows: [['Integration', 'Not connected'], ['Detections that need it', '0 of 9 working'], ['Impossible travel', 'Not detected']] },
      recommended: { kind: 'settings', label: 'Okta', rows: [['Integration', 'Connect (API token from the identity team)'], ['Detections that need it', '9 of 9, after a 14-day silent test'], ['Impossible travel', 'Marketplace rule “Okta - Impossible travel”']] },
      validation: { rows: [['Detections unlocked', 0, 9, 9]], note: 'Expected ingestion is about 2 GB a day. The Marketplace rules run in a silent test for 14 days before they create issues.' },
      decision: { q: 'Ask the identity team to connect Okta?', approve: 'Send the request', effect: 'The Detection Engineer opens a request for the identity team, with the steps and the scope of the API token. Nothing changes in XSIAM until the source is connected.', risk: 'Low. Nothing changes until the source is connected.', reversible: true },
      after: 'Closed automatically. Okta sign-in logs arrive and the Marketplace rule finished its silent test.',
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
      trigger: { kind: 'sweep', text: 'Hourly data check for detections: no events for 3 checks in a row.' },
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
    { id: 1, mod: 'Dec 22nd 2022 21:25:52', ind: '51ff4a033018d9343049305061dcde77cb5f26f5ec48d1be42669f368b1f5705', type: 'Hash', sev: 'High', issues: 1241, issues7d: 290, nshare: .97, source: 'Dana L.', exp: 'Never', status: 'Enabled', rep: 'Bad', rel: 'B - Usually reliable' },
    { id: 5, mod: 'Mar 4th 2024 10:12:03', ind: 'update-check.example.net', type: 'Domain Name', sev: 'Low', issues: 0, issues7d: 0, source: 'Omer A.', exp: 'Expired', status: 'Disabled', rep: 'Unknown', rel: 'F - Cannot be judged' },
    { id: 4, mod: 'Jan 9th 2023 08:40:11', ind: '198.51.100.23', type: 'IP', sev: 'Medium', issues: 0, issues7d: 0, source: 'Dana L.', exp: 'Expired', status: 'Disabled', rep: 'Unknown', rel: 'F - Cannot be judged' }
  ];

  /* ---------- A rule the agent suggests. It becomes a real rule when adopted. ---------- */
  const suggested = [R(241, 'SentinelOne - Office application launching a script host', { pipe: 'p-s1', source: { kind: 'agent', name: 'Detection Engineer' }, mod: 'Today', tactic: 'TA0005 - Defense Evasion', tech: 'T1218.005 - Mshta', cat: 'Defense Evasion', desc: 'An Office application starts mshta, wscript or cscript', task: 'MSN-1008',
    xql: 'datamodel dataset = sentinelone_xdr_raw\n| filter xdm.source.process.name in ("winword.exe", "excel.exe", "powerpnt.exe")\n| filter xdm.target.process.name in ("mshta.exe", "wscript.exe", "cscript.exe")\n| fields *' })];

  /* ---------- Which agent owns each mission, and what it suggests ---------- */
  const TEAM = {
    'MSN-1001': { sug: 'Fix', agent: 'det' }, 'MSN-1003': { sug: 'Fix', agent: 'det' },
    'MSN-1002': { sug: 'Tune', agent: 'det' }, 'MSN-1004': { sug: 'Fix', agent: 'det' },
    'MSN-1006': { sug: 'Connect', agent: 'det' }, 'MSN-1005': { sug: 'Drop', agent: 'det' }, 'MSN-1007': { sug: 'Drop', agent: 'det' }, 'MSN-1008': { sug: 'Adopt', agent: 'det' },
    'MSN-0998': { sug: 'Tune', agent: 'det' }, 'MSN-0996': { sug: 'Watch', agent: 'det' }, 'MSN-0994': { sug: 'Tune', agent: 'det' },
    'MSN-0991': { sug: 'Keep', agent: 'det' }, 'MSN-0988': { sug: 'Hand over', agent: 'det' }
  };
  tasks.forEach(t => Object.assign(t, TEAM[t.id]));

  /* ---------- Missions that arrive while the screen is open ---------- */
  const incoming = [
    { id: 'MSN-1009', card: 'broken', title: 'Check Point: 5 of 14 verdicts never reach the rule', verdict: 'Mismatch', sug: 'Fix', agent: 'det', conf: 'High', impact: 'Medium', layer: 'parsing', progressNote: 'Comparing the product with XSIAM',
      teamFix: 'data platform team', teamAuto: true, teamCheck: 'Compare the product with XSIAM again', teamThen: 'When the team applies it, the Detection Engineer compares again and closes the mission if all verdicts arrive',
      trigger: { kind: 'change', text: 'The Check Point Threat Emulation pack was updated 20 minutes ago.' },
      summary: 'After a pack update the product reports 14 verdicts and XSIAM shows 9. The rule is valid and fired on all 9. The 5 others are dropped by the parsing rule, because the update added an event type it does not know.',
      steps: ['Compared the product with XSIAM after the update: the product reports 14 verdicts, XSIAM shows 9', 'Checked the rule: valid, and it fired on all 9', 'Counted events before and after each step: 14 arrive, 9 leave the parsing step', 'Read the 5 dropped events: all have the new event type “archive verdict”', 'Read the parsing rule: no_hit=drop removes what it does not know. The parsing rule belongs to the data platform team', 'Replayed the last 24 hours through a changed rule: all 14 verdicts reach the rule'],
      diagnosis: 'The product and XSIAM disagree. The rule is fine. The parsing rule drops an event type that the pack update added.',
      current: { kind: 'code', label: 'Parsing rule · check_point_threat_emulation', lines: [['[INGEST:vendor="Check Point", product="Threat Emulation",'], [' target_dataset="check_point_threat_emulation_raw", no_hit=drop]', 'del']] },
      recommended: { kind: 'code', label: 'Parsing rule · check_point_threat_emulation', lines: [['[INGEST:vendor="Check Point", product="Threat Emulation",'], [' target_dataset="check_point_threat_emulation_raw", no_hit=keep]', 'add']] },
      validation: { rows: [['Verdicts reaching the rule (24 hours)', 9, 14, 14]], note: 'Replayed the last 24 hours through the changed parsing rule.' },
      decision: { q: 'Send the parsing fix to the data platform team?', approve: 'Send the fix', effect: 'The Detection Engineer sends the data platform team the changed parsing rule and the replay. It does not change the parsing rule itself.', risk: 'Low. It adds a small number of events.', reversible: true },
      after: 'Closed automatically. The data platform team applied the parsing fix. The product and XSIAM were compared again: 14 of 14 verdicts match.',
      affects: { rules: [235], node: { pipe: 'p-cp', stage: 'parsing' }, source: 'checkpoint' }, pivots: [['rules', 'Correlation Rules', 'the rule'], ['streams', 'Data Streams', 'the parsing step']] },
    { id: 'MSN-1010', card: 'noisy', title: 'SharePoint mass-download rule fires on the nightly backup account', verdict: 'Noisy', sug: 'Tune', agent: 'det', conf: 'High', impact: 'Low', layer: 'rule', noise: 'Benign true positive', progressNote: 'Detection Engineer is diagnosing',
      trigger: { kind: 'threshold', text: 'The 7th issue from this rule was closed as benign in 7 days. The noise threshold for a rule is 7 in 7 days.' },
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
  const W0 = { rules, iocs };
  const history = [.936, .951, .963, .972, .983, .991, .997].map(f => Math.round(myIssuesNow(W0) * f));
  const noiseHistory = [.06, .05, .045, .035, .02, .015, .005].map(d => +(myNoise(W0).share - d).toFixed(3));

  /* ---------- Agent activity, newest first ---------- */
  const log = [
    [now - 6 * 60000, 'sweep', `Hourly data check for detections: ${sources.flatMap(x => x.instances).length} instances checked, ${sources.flatMap(x => x.instances).filter(i => i.status === 'err').length} in error`],
    [now - 41 * 60000, 'check', 'Compared Check Point verdicts with XSIAM: 14 of 14 match'],
    [now - 45 * H, 'task', 'Opened MSN-1003: AWS audit logs stopped'],
    [now - 5 * H, 'sweep', 'Change event: the SentinelOne pack was updated and 3 rules went silent'],
    [now - 5 * H + 9 * 60000, 'task', 'Opened MSN-1001: 3 SentinelOne rules went silent'],
    [now - 5 * H + 12 * 60000, 'step', 'MSN-1001: the cause is in the SentinelOne data model. A fix for the data platform team is ready'],
    [now - 20 * H, 'handoff', 'MSN-1004: the data platform team applied the narrower firewall filter. Internal deny events are kept'],
    [now - 20 * H + 60000, 'test', 'MSN-1004 continued: 7-day silent test started on the port-scan rule'],
    [now - 9 * H, 'test', 'Silent test finished for the Chrome extension rule: 14 days'],
    [now - 9 * H + 60000, 'task', 'Opened MSN-1002 with the test result'],
    [now - 30 * H + 15 * 60000, 'step', 'MSN-1006: impossible travel needs the Okta integration. A request for the identity team is ready'],
    [now - 26 * H, 'sweep', `Weekly sweep: ${rules.length} rules reviewed, 2 candidates`],
    [now - 30 * H, 'done', 'Ariel B. approved MSN-0994: ATT&CK mapping on 2 rules']
  ].map(([t, kind, text]) => ({ t, kind, text }));

  const W = { sources, pipes, rules, tasks, iocs, suggested, incoming, history, noiseHistory, log, facts: [], dates: { packDay, filterDay, reviewDay } };
  myEnrich(W, { now, H, D, day });
  return W;
}

/* ---------- Derived values: never typed twice ---------- */
const myOpen = W => W.tasks.filter(t => t.status !== 'done');
/* One order everywhere: most impact first, then the one that has waited longest. */
const myRank = (a, b) => ({ High: 0, Medium: 1, Low: 2 })[a.impact] - ({ High: 0, Medium: 1, Low: 2 })[b.impact] || a.opened - b.opened;
/* Decisions that wait for a person. A mission that waits on another mission is pending too, but not on a person. */
const myPendingTasks = W => W.tasks.filter(t => (t.status === 'pending' && !t.waitOn) || t.status === 'blocked').sort(myRank);
const myWaiting = W => W.tasks.filter(t => (t.status === 'pending' && t.waitOn) || (t.status === 'progress' && t.handed));
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
    if (last.end === 'rejected' && (!last.declined || !last.declined.until || last.declined.until > Date.now())) return { v: last.verdict, sug: last.sug, conf: last.conf, task: last, declined: last.declined || true };
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
  const last = ts[0]; if (last && last.end === 'rejected') return { sug: last.sug, conf: last.conf, task: last, declined: last.declined || true };
  return { sug: 'Keep', conf: 'High', task: null };
}
const myIssuesNow = W => W.rules.reduce((a, r) => a + r.issues7d, 0) + W.iocs.reduce((a, i) => a + i.issues7d, 0);
/* Noise: issues that ended with no action, by the verdicts of analysts and the Investigation Agent. */
function myNoise(W) {
  const rows = W.rules.map(r => ({ name: r.name, id: r.id, n: Math.round(r.issues7d * (r.nshare || 0)) })).concat(W.iocs.map(i => ({ name: 'IOC rule ' + i.id, ioc: i.id, n: Math.round(i.issues7d * (i.nshare || 0)) }))).sort((a, b) => b.n - a.n);
  const noise = rows.reduce((a, r) => a + r.n, 0), total = myIssuesNow(W), top = rows.slice(0, 5);
  return { noise, total, share: total ? noise / total : 0, top, topShare: noise ? top.reduce((a, r) => a + r.n, 0) / noise : 0 };
}
/* Detections that cannot fire now, and detections that fire mostly on nothing. */
function myDetections(W) {
  const en = W.rules.filter(r => r.status === 'Enabled').map(r => ({ r, rv: myRuleReview(W, r) })), open = x => x.rv.task && x.rv.task.status !== 'done' && !(x.rv.task.live && x.rv.task.status === 'progress');
  const blind = en.filter(x => open(x) && ['Fix', 'Connect'].includes(x.rv.sug)), noisy = en.filter(x => open(x) && ['Tune', 'Drop'].includes(x.rv.sug));
  return { enabled: en.length, blind: blind.length, noisy: noisy.length, ok: en.length - blind.length - noisy.length };
}
/* Sources that are ingested and that no correlation rule reads. */
function myUnused(W) {
  const xs = W.sources.filter(s => !/Threat Intelligence/.test(s.cat) && !W.rules.some(r => r.status === 'Enabled' && (W.pipes.find(p => p.id === r.pipe) || {}).src === s.id));
  return { n: xs.length, gb: xs.reduce((a, s) => a + (s.gb || 0), 0), list: xs };
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
    pending: myPendingTasks(W).length, waiting: myWaiting(W).length, progress: W.tasks.filter(t => t.status === 'progress').length, done: W.tasks.filter(t => t.status === 'done').length,
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
function myApply(W, t, choice, whoName, reason) {
  const who = whoName.replace(/\.$/, '');
  const now = Date.now(), rule = id => W.rules.find(r => r.id === id);
  const close = (end, outcome) => { t.status = 'done'; t.end = end; t.closed = now; t.by = who; t.outcome = outcome; };
  if (choice === 'reject') { const r = reason || 'later', D = 86400000;
    t.declined = { reason: r, until: r === 'later' ? now + 14 * D : r === 'risk' ? now + 90 * D : null, by: who, at: now, ver: t.ver || 1 };
    close('rejected', `Declined by ${who} · ${myDeclTxt(t.declined)}. Nothing changed. ${r === 'never' ? 'It is not raised again for this rule.' : r === 'wrong' ? 'The agent records why, and learns from it.' : 'It comes back earlier only if the problem gets materially worse.'}`);
    W.log.unshift({ t: now, kind: 'done', text: `${who} declined ${t.id} · ${myDeclTxt(t.declined)}` });
    return myUnblock(W, t); }
  /* Partly applied: one of the rules changed between the approval and the write, so that write was refused. */
  if (t.id === 'MSN-1005' && t.race) {
    rule(222).ver = t.expects[222] + 1; rule(222).editedBy = 'Dana K.';
    rule(216).retired = true; rule(218).retired = true; t.weekly = 0; t.status = 'blocked'; t.by = who; t.actedAt = now;
    t.partial = { done: ['Rule 216 retired', 'Rule 218 retired'], failed: `Rule 222 was not disabled. Dana K. edited it after your approval, so it is now version ${rule(222).ver}, not version ${t.expects[222]}. The change was refused, because a change applies only to the version that was approved.` };
    W.log.unshift({ t: now, kind: 'task', text: `MSN-1005 is blocked: 2 of 3 changes applied. Rule 222 changed after the approval` });
    (t.history = t.history || []).push({ t: now, kind: 'decision', by: who, tone: 'rose', text: 'approved.', more: 'Partly applied: rules 216 and 218 retired. Rule 222 changed after the approval, so that change was refused.' });
    return; }
  const edited = choice === 'edit', end = edited ? 'edited' : 'approved', verb = edited ? 'Approved with edits' : 'Approved';
  /* The cause belongs to another team: the fix is sent, not applied. The mission waits for the team. */
  if (t.teamFix) {
    t.status = 'progress'; t.by = who; t.progressNote = `Waiting for the ${t.teamFix}`; t.decision = null; t.handed = true;
    (t.history = t.history || []).push({ t: now, kind: 'decision', by: who, tone: 'cx', text: `${edited ? 'approved an edited version' : 'approved'}. Sent to the ${t.teamFix}.` });
    W.log.unshift({ t: now, kind: 'handoff', text: `${t.id}: fix sent to the ${t.teamFix}` });
    return;
  }
  if (t.id === 'MSN-1002') {
    const r = rule(224); r.supp = { dur: '24 hours', fields: 'user, extension ID' }; r.issues7d = 23; t.weekly = 267;
    W.facts.push({ text: '9 browser extensions approved by IT', review: W.dates.reviewDay, by: who });
    close(end, `${verb} by ${who}. Suppression is on. In the backtest this removes 1,150 of 1,250 issues a month and keeps every issue on an unapproved extension.`);
  } else if (t.id === 'MSN-1005') {
    rule(222).status = 'Disabled'; rule(222).retired = true; rule(222).issues7d = 0; rule(216).retired = true; rule(218).retired = true; t.weekly = 61;
    close(end, `${verb} by ${who}. Rule 222 is disabled and rules 216 and 218 are retired. All three can be restored.`);
  }
  else if (t.id === 'MSN-1007') {
    const i = W.iocs.find(x => x.id === 1); i.status = 'Disabled'; i.exp = 'Expired'; i.issues7d = 0; t.weekly = 290;
    close(end, `${verb} by ${who}. The indicator is disabled and expired. It removes 290 issues a week.`);
  } else if (t.id === 'MSN-1008') {
    const r = W.suggested.find(x => x.id === 241); if (r) { W.suggested = W.suggested.filter(x => x !== r); r.task = null; if (edited) r.xql = t.recommended.lines.map(l => l[0]).join('\n'); W.rules.unshift(r); t.affects.rules = [241]; }
    close(end, `${verb} by ${who}. The rule is enabled in Correlation Rules, with the Detection Engineer as its source.`);
  } else if (t.id === 'MSN-1010') {
    rule(237).issues7d = 3; t.weekly = 22; W.facts.push({ text: 'svc-backup is the nightly backup account', review: W.dates.reviewDay, by: who });
    close(end, `${verb} by ${who}. The environment fact is saved. It removes 22 issues a week and keeps alerts on every other account.`);
  } else if (t.id === 'MSN-1016') {
    close(end, `${verb} by ${who}. Installs of unapproved extensions now create High issues.`);
  } else if (t.id === 'MSN-1017') {
    rule(236).issues7d = 2; W.facts.push({ text: 'partner.example is a finance partner', review: W.dates.reviewDay, by: who });
    close(end, `${verb} by ${who}. The environment fact is saved. Forwarding to partner.example no longer creates issues.`);
  } else if (t.id === 'MSN-1011') {
    W.iocs.filter(x => [3, 2].includes(x.id)).forEach(x => { x.status = 'Disabled'; x.exp = 'Expired'; });
    close(end, `${verb} by ${who}. Both indicators are disabled and expired.`);
  }
  W.log.unshift({ t: now, kind: 'done', text: `${who} ${edited ? 'approved an edited version of' : 'approved'} ${t.id}` });
  (t.targets || []).forEach(id => { if (!(t.id === 'MSN-1005' && id === 222 && t.partial)) myBump(W, id, `changed by ${t.id}`, t); });
  /* An approved noise fix leaves the rule with little noise. */
  if (t.verdict === 'Noisy') (t.affects.rules || []).forEach(id => { const r = rule(id); if (r) r.nshare = .1; });
  myUnblock(W, t);
}
/* A mission that waited on this one continues on its own. If the fix was declined, it closes with nothing changed. */
function myUnblock(W, p) {
  const d = W.tasks.find(x => x.waitOn === p.id); if (!d) return;
  d.waitOn = null;
  if (['approved', 'edited'].includes(p.end)) { d.status = 'progress'; d.progressNote = `${p.id} approved · checking that the detection works again`; d.unblockedBy = p.id; d.resume = true;
    W.log.unshift({ t: Date.now(), kind: 'step', text: `${d.id}: continued after ${p.id} was approved` }); }
  else { d.status = 'done'; d.end = 'rejected'; d.declined = p.declined; d.closed = Date.now(); d.outcome = `Closed with nothing changed. The fix in ${p.id} was declined, so the detection stays as it is. The suggestion stays visible on the affected rules.`; }
}
/* The other team applied the fix. The Detection Engineer checks that the detection works again, then closes the mission. */
function myTeamApplied(W, t) {
  if (!t || !t.handed || t.status !== 'progress') return;
  if (t.id === 'MSN-1001') W.pipes.find(p => p.id === 'p-s1').model.ok = true;
  if (t.id === 'MSN-1009') { const p = W.pipes.find(x => x.id === 'p-cp'); p.parsing.text = p.parsing.text.replace('no_hit=drop', 'no_hit=keep'); }
  const now = Date.now(); t.handed = false; t.teamDone = now; t.resume = true; t.progressNote = `The ${t.teamFix} applied the fix · ${t.teamCheck.charAt(0).toLowerCase() + t.teamCheck.slice(1)}`;
  (t.history = t.history || []).push({ t: now, kind: 'team', text: `The ${t.teamFix} applied the fix. The Detection Engineer is checking the detection.` });
  W.log.unshift({ t: now, kind: 'step', text: `${t.id}: the ${t.teamFix} applied the fix. Checking the detection` });
}
/* The check after an unblock is done: the mission closes itself. */
function myResolve(W, d) {
  if (!d || d.status !== 'progress' || !d.resume) return;
  d.resume = false; d.status = 'done'; d.end = 'auto'; d.autoWhy = 'verified'; d.closed = Date.now(); d.fresh = Date.now(); d.outcome = d.after || 'Closed automatically. The detection works again.';
  W.log.unshift({ t: Date.now(), kind: 'done', text: `${d.id} closed automatically: the detection works again` });
}
/* A person fixes the source in the native screen. The mission notices and closes itself. */
function myReconnect(W, instId, whoName) {
  const who = whoName.replace(/\.$/, '');
  const inst = W.sources.flatMap(s => s.instances).find(i => i.id === instId); if (!inst) return null;
  inst.status = 'ok'; inst.last = Date.now(); inst.count = 18400; inst.note = '';
  const t = W.tasks.find(x => x.status !== 'done' && x.affects.instance === instId);
  if (t) { t.status = 'done'; t.end = 'auto'; t.autoWhy = 'outside'; t.closed = Date.now(); t.by = who; t.decision = null;
    t.outcome = `Closed automatically. ${who} replaced the access key in Data Sources, events are arriving again, and XSIAM is backfilling 46 hours from the queue. The two rules run on the backfilled events.`;
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
  if (!t || t.status !== 'progress' || !t.live) return;
  t.live = false; t.fresh = Date.now(); t.progressNote = '';
  if (!t.decision) return;
  t.status = 'pending';
  W.log.unshift({ t: Date.now(), kind: 'task', text: `${t.id} needs you: a decision is ready` });
}


/* ======================================================================
   JOBS, MISSIONS AND THE OBJECT RECORD (the AgentiX Always On Experts brief)
   A job is a predefined piece of work. Every run of a job is a mission,
   including a run that finds nothing. A mission has a shared part that is
   the same for every expert, and a detection engineering part.
   ====================================================================== */
const MY_JOBS = {
  health: { name: 'Data check for detections', agent: 'det', ver: 4, when: 'Every hour', budget: '5 minutes' },
  change: { name: 'Change check', agent: 'det', ver: 2, when: 'On every pack, parser or rule change', budget: '20 minutes' },
  noise: { name: 'Noise review', agent: 'det', ver: 5, when: 'Daily, and on Investigation Agent handoffs', budget: '40 minutes' },
  rules: { name: 'Rule-health sweep', agent: 'det', ver: 3, when: 'Daily', budget: '30 minutes' },
  hygiene: { name: 'Weekly rule hygiene', agent: 'det', ver: 2, when: 'Weekly', budget: '30 minutes' },
  coverage: { name: 'Coverage review', agent: 'det', ver: 2, when: 'Weekly, on a new source, or on request', budget: '60 minutes' },
  source: { name: 'Third-party source check', agent: 'det', ver: 1, when: 'On a pack update, or on request', budget: '30 minutes' },
  review: { name: 'Rule review on request', agent: 'det', ver: 2, when: 'When a person asks', budget: '20 minutes' },
  ioc: { name: 'Indicator review', agent: 'det', ver: 2, when: 'Weekly', budget: '15 minutes' },
  content: { name: 'Content feedback', agent: 'det', ver: 1, when: 'On repeated noise in Palo Alto content', budget: '20 minutes' }
};
/* What each mission is for, what it looked at, and what it cost. */
const MY_SPEC = {
  'MSN-1001': ['change', 'Find out why three SentinelOne rules stopped firing after the pack update, and write the fix.', '3 rules, the 6 fields they read, the data model rule and 2 days of raw events', [32, 77, 92]],
  'MSN-1003': ['health', 'Check that the data every enabled rule reads is arriving.', '103 instances · 1 in error', [3, 12, 60]],
  'MSN-1002': ['noise', 'Reduce the noise from the Chrome extension rule without losing real detections.', '1,250 issues in 30 days and 140 case verdicts', [22, 58, 55]],
  'MSN-1004': ['rules', 'Check that every enabled rule can fire.', '152 enabled rules · 1 cannot fire · the FortiGate filter step', [20, 85, 67]],
  'MSN-1006': ['coverage', 'Answer whether impossible-travel logins can be detected, and what is missing.', 'Okta, Entra ID and Active Directory sources, Palo Alto Analytics and the Marketplace', [11, 30, 25]],
  'MSN-1005': ['hygiene', 'Find rules that duplicate others or no longer run.', '152 rules, 90 days of issues', [16, 47, 53]],
  'MSN-1007': ['noise', 'Reduce the noise from indicator 1 without losing real matches.', '290 issues in 7 days, and its reputation today', [6, 14, 15]],
  'MSN-1008': ['coverage', 'Cover what the Threat Hunter found: Office launching a script host.', '41 SentinelOne rules, Analytics and the Marketplace', [26, 73, 43]],
  'MSN-0998': ['noise', 'Reduce the noise from the VPN brute-force rule.', '61 cases and 266 issues', [19, 52, 48]],
  'MSN-0996': ['rules', 'Check the rules edited in the last week.', '4 edited rules', [5, 9, 17]],
  'MSN-0994': ['coverage', 'Find enabled rules with no ATT&CK mapping.', '152 enabled rules', [4, 6, 7]],
  'MSN-0991': ['health', 'Check that the data every enabled rule reads is arriving.', '103 instances · 1 delayed', [3, 12, 60]],
  'MSN-0988': ['content', 'Send repeated noise in a Palo Alto analytic to the content team.', '1 analytic and 412 issues', [8, 17, 40]],
  'MSN-1009': ['source', 'Compare the Check Point verdicts with what XSIAM receives, and find where the rest are lost.', '14 product verdicts, the parsing rule and 20 minutes of events', [20, 47, 67]],
  'MSN-1010': ['noise', 'Reduce the noise from the SharePoint mass-download rule.', '22 cases from one service account', [10, 24, 25]],
  'MSN-1011': ['ioc', 'Find indicators that never matched or never expire.', '6 indicators', [3, 7, 20]],
  'MSN-1015': ['noise', 'Find rules whose issues mostly end with no action, and suggest the smallest fix.', '64 rules with issues this week · 1 skipped, handled in MSN-1002', [24, 81, 60]],
  'MSN-1016': ['review', 'Raise the severity of the Chrome extension rule for extensions IT did not approve.', '1 rule and its last 30 days of issues', [6, 13, 30]],
  'MSN-0987': ['noise', 'Reduce the noise from the mail forwarding rule.', '6 issues a week, 4 to one partner domain', [7, 15, 18]],
  'MSN-1017': ['noise', 'Reduce the noise from the mail forwarding rule.', '13 issues this week, 11 to one partner domain', [8, 16, 20]]
};
/* The rule a proposal changes, and which part of it. A change applies only if the rule is still the version the approval saw. */
const MY_TARGET = { 'MSN-1002': [[224], 'issue settings'], 'MSN-1005': [[222, 216, 218], 'status'], 'MSN-1010': [[237], 'environment facts'], 'MSN-1016': [[224], 'issue settings'], 'MSN-1017': [[236], 'environment facts'], 'MSN-0998': [[231], 'query'] };
/* The evidence behind each mission: the questions the agent asked, the queries it ran and what they returned, and the datasets it read. */
const MY_EVID = {
  'MSN-1001': { q: ['Did the three rules stop at the same moment?', 'Is the data still arriving?', 'Which field do the rules filter on, and is it filled?', 'What changed in the raw events after the pack update?'],
    x: [['issues | filter rule_id in (215, 217, 220) | comp count() as n by rule_id, bin(_time, 1h)', 'All three drop to 0 at 09:12 on the update day'],
      ['dataset = sentinelone_xdr_raw | filter _time > -1d | comp count()', '12,140 events in 24 hours: the data arrives'],
      ['datamodel dataset = sentinelone_xdr_raw | comp count_distinct(xdm.event.type)', '0 values since the update: the field is empty'],
      ['dataset = sentinelone_xdr_raw | fields eventType, event_type | limit 20', 'eventType is gone, event_type is new']],
    d: ['issues', 'sentinelone_xdr_raw', 'Data model rule · SentinelOne model', 'Marketplace pack changelog'] },
  'MSN-1003': { q: ['Is any instance in error?', 'Which rules read the data it brings?', 'Can the missing events be recovered?'],
    x: [['Data Sources › Amazon S3 › Cloud audit logs · production', 'Status Error since 46 hours · access denied, the key expired'],
      ['dataset = amazon_aws_raw | filter _time > -2d | comp count() by bin(_time, 1h)', '0 events for 46 hours'],
      ['correlation_rules | filter query contains "amazon_aws_raw" and status = "Enabled"', '2 rules: 233 and 234'],
      ['SQS queue · message retention', '14 days: a backfill is possible']],
    d: ['amazon_aws_raw', 'Data Sources: instance status', 'correlation_rules'] },
  'MSN-1002': { q: ['Who installs the extensions that fire the rule?', 'Are those extensions approved?', 'Do analysts agree these issues are benign?', 'Does anything real still alert after the change?'],
    x: [['issues | filter rule_id = 224 and _time > -30d | comp count() by actor_user, extension_id | sort desc', '1,250 issues · 9 extension IDs make 1,150'],
      ['IT software list › approved browser extensions', 'All 9 are on the list'],
      ['cases | filter rule_id = 224 | comp count() by resolution_status, resolved_by', '140 resolved · 138 benign confirmed by an analyst'],
      ['Silent test: the changed rule next to the live rule, 14 days', '100 issues kept, every one on an unapproved extension']],
    d: ['issues', 'cases', 'google_chrome_raw', 'IT approved software list'] },
  'MSN-1004': { q: ['Why is the port-scan rule silent?', 'Does the source still send deny events?', 'Where are the events lost?'],
    x: [['issues | filter rule_id = 230 | comp max(_time)', `Last issue 23 days ago`],
      ['dataset = fortinet_fortigate_raw | filter action = "deny" | comp count()', '0 deny events in XSIAM'],
      ['Data Streams › FortiGate traffic · counts before and after each step', '38,000 deny events a day go into the filter, none come out']],
    d: ['fortinet_fortigate_raw', 'Data Streams: filter step', 'issues'] },
  'MSN-1006': { q: ['Which identity data arrives today?', 'Is there existing content for impossible travel?', 'What does the integration cost?'],
    x: [['datamodel | filter xdm.event.type = "sign-in" | comp count() by _vendor', 'Microsoft and Active Directory · no Okta'],
      ['Marketplace search: impossible travel', '“Okta - Impossible travel”, in the Okta pack'],
      ['Okta pack contents', 'Parser, data model, 9 detections · about 2 GB a day']],
    d: ['xdm sign-in events', 'Marketplace', 'Data Sources'] },
  'MSN-1005': { q: ['Are any two rules identical?', 'Does a disabled rule still matter?', 'Has the test rule ever fired?'],
    x: [['correlation_rules | comp count() by query_hash | filter count > 1', 'Rules 221 and 222 have the same query'],
      ['issues | filter rule_id in (221, 222) and _time > -90d | comp count() by rule_id, event_id', 'Every issue from 222 is also raised by 221'],
      ['issues | filter rule_id in (216, 218) | comp count()', '0 issues, ever']],
    d: ['correlation_rules', 'issues'] },
  'MSN-1007': { q: ['Which process makes the matches?', 'Is the file signed and common?', 'Do intel sources still list the hash?'],
    x: [['issues | filter ioc_id = 1 and _time > -7d | comp count() by process_name, host_count', '290 issues · one updater · 1,900 hosts'],
      ['File signature check', 'Signed by its vendor, valid certificate'],
      ['Threat intel: 3 sources', 'Not listed as malicious by any of them']],
    d: ['issues', 'xdr_data (process events)', 'Threat Intel Management'] },
  'MSN-1008': { q: ['Is the data for this behavior here?', 'Does any rule, analytic or pack already cover it?', 'How often would a new rule fire?'],
    x: [['datamodel dataset = sentinelone_xdr_raw | filter xdm.source.process.name in ("winword.exe","excel.exe") | comp count()', '41,300 Office process events a week, mapped'],
      ['Cortex analytics + Marketplace search: T1218.005', 'Nothing on SentinelOne data'],
      ['Backtest of the new rule on 30 days', '2 matches, both from a red-team exercise']],
    d: ['sentinelone_xdr_raw', 'Cortex analytics', 'Marketplace', 'MITRE ATT&CK coverage'] },
  'MSN-1015': { q: ['Which rules made most of the noise this week?', 'Is each one already handled by another mission?', 'What do the issues have in common?'],
    x: [['issues | filter _time > -7d and resolution in ("False positive", "Benign") | comp count() by rule_id | sort desc | limit 5', 'Rules 224, 232 and 225 lead'],
      ['missions | filter object = rule 224 and status != "Done"', 'MSN-1002 already handles rule 224'],
      ['issues | filter rule_id = 232 | comp count() by dst_country', '9 of 11 go to Portugal and Poland'],
      ['issues | filter rule_id = 225 | comp count() by actor_user in phishing_sim_accounts', '12 of 14 from simulation accounts']],
    d: ['issues', 'missions', 'fortinet_fortigate_raw', 'common_countries (lookup)'] },
  'MSN-1009': { q: ['Do the product and XSIAM agree?', 'Where do the missing verdicts drop?'],
    x: [['Check Point API: verdicts in 24 hours', '14'], ['dataset = check_point_threat_emulation_raw | comp count()', '9'], ['Counts before and after each step', '14 arrive, 9 leave parsing · 5 have the new type “archive verdict”']],
    d: ['check_point_threat_emulation_raw', 'Check Point API', 'Parsing rule'] },
  'MSN-1010': { q: ['Who makes the benign issues?', 'Is that account expected to do this?'],
    x: [['issues | filter rule_id = 237 and _time > -7d | comp count() by actor_user', '22 of 25 from svc-backup'], ['Identity inventory: svc-backup', 'Service account · nightly backup job']],
    d: ['issues', 'cases', 'msft_o365_general_raw', 'Identity inventory'] },
  'MSN-1011': { q: ['Which indicators never expire?', 'Have they ever matched?'],
    x: [['ioc_rules | filter expiration = "Never" and status = "Enabled"', '2 from December 2022'], ['issues | filter ioc_id in (2, 3) | comp count()', '0, ever']],
    d: ['ioc_rules', 'issues', 'Threat Intel Management'] },
  'MSN-0998': { q: ['What does the rule count as an attack?', 'How many issues are retries by one user?'],
    x: [['issues | filter rule_id = 231 | comp count() by actor_user, outcome', 'Most come from users retrying their own password'], ['Backtest of the tuned query, 30 days', '72 → 9 issues · every confirmed attack kept']],
    d: ['issues', 'fortinet_fortigate_raw'] }
};
/* What kind of fix a mission proposes. Most fixes are on the rule; some are lower in the pipeline and go to the team that owns that step. */
const MY_FIX = { 'MSN-1001': 'Data model mapping', 'MSN-1003': 'Data source instance', 'MSN-1002': 'Issue suppression + exclusion', 'MSN-1004': 'Filter step', 'MSN-1006': 'New integration',
  'MSN-1005': 'Rule status: disable, retire', 'MSN-1007': 'Indicator status', 'MSN-1008': 'New rule', 'MSN-0998': 'XQL logic', 'MSN-1009': 'Parsing rule', 'MSN-1010': 'Exclusion (environment fact)',
  'MSN-1011': 'Indicator status', 'MSN-1016': 'Severity', 'MSN-1017': 'Exclusion (environment fact)', 'MSN-0987': 'Exclusion (environment fact)', 'MSN-0994': 'ATT&CK mapping',
  'MSN-1015:F1': 'Rule parameter (lookup list)', 'MSN-1015:F2': 'Exclusion (environment fact)' };
const M_DECL = { wrong: ['Wrong', 'The diagnosis or the change is wrong. The agent learns from it.'], later: ['Not now', 'Ask again after the cool-down: 14 days.'], risk: ['Accepted risk', 'Keep it as it is until a date: 90 days.'], never: ['Never', 'Do not raise this again for this rule.'] };
const myDay = ts => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const myDeclTxt = d => d ? `${M_DECL[d.reason] ? M_DECL[d.reason][0] : 'Declined'}${d.until ? ', until ' + myDay(d.until) : ''}` : '';

function myEnrich(W, k) {
  const { now, H, D } = k, rule = id => W.rules.find(r => r.id === id);
  W.rules.forEach(r => { r.ver = 3 + (r.id % 7); r.checked = { at: now - (r.id % 9 + 1) * H, why: r.id % 3 ? 'Daily rule-health sweep' : 'Noise review', next: now + (24 - r.id % 9) * H }; });
  rule(224).ver = 7; rule(222).ver = 5;
  /* An earlier decline, and a mission with several findings */
  W.tasks.push({ id: 'MSN-0987', card: 'noisy', title: 'Mail forwarding rule: forwarding to a partner domain is expected', verdict: 'Noisy', sug: 'Tune', agent: 'det', conf: 'Medium', impact: 'Low', layer: 'rule', status: 'done', end: 'rejected', by: 'Ariel B', opened: now - 8 * D, closed: now - 8 * D + 5 * H,
    noise: 'Benign true positive', declined: { reason: 'later', until: now + 6 * D, by: 'Ariel B', at: now - 8 * D + 5 * H },
    trigger: { kind: 'sweep', text: 'Daily noise review: 4 of 6 issues a week go to one partner domain.' },
    summary: 'Most issues are mail forwarded to a partner the finance team works with.', steps: ['Counted 6 issues a week', 'Grouped them by target domain: 4 go to partner.example', 'Proposed an environment fact for the partner domain'],
    diagnosis: 'Benign true positive. Forwarding to this partner is part of the finance process.',
    current: { kind: 'settings', label: 'M365 - Mail forwarding rule to external domain', rows: [['Environment facts', 'None'], ['Issues a week', '6']] },
    recommended: { kind: 'settings', label: 'M365 - Mail forwarding rule to external domain', rows: [['Environment facts', 'partner.example is a finance partner · review in 6 months'], ['Issues a week', '2']] },
    validation: null, decision: { q: 'Add the partner domain as an environment fact?', approve: 'Approve fact', effect: 'Forwarding to partner.example no longer creates issues.', risk: 'Low.', reversible: true },
    outcome: 'Declined by Ariel B · Not now. Nothing changed.', affects: { rules: [236] }, pivots: [['rules', 'Correlation Rules', 'the rule']] });
  W.tasks.push({ id: 'MSN-1015', card: 'noisy', title: 'Noise review: 2 rules to tune, 1 already handled', verdict: 'Noisy', sug: 'Tune', agent: 'det', conf: 'High', impact: 'Medium', layer: 'rule', status: 'pending', opened: now - 4 * H,
    trigger: { kind: 'sweep', text: 'Daily noise review, 09:00.' },
    summary: 'Two rules make most of their issues on things the company expects. A third is already being handled.',
    steps: ['Listed the 64 rules that created issues this week', 'Skipped rule 224: MSN-1002 already handles its noise. Added this week’s 38 issues to MSN-1002 as evidence', 'Found two rules whose issues mostly end with no action', 'Named the cause of each and chose the smallest change', 'Backtested both changes on 30 days'],
    diagnosis: 'Two benign true positives. Both rules are right, and the behavior is expected here.',
    findings: [
      { id: 'F1', title: 'Outbound to rare country: 9 of 11 issues go to the two new offices', card: 'noisy', layer: 'rule', noise: 'Benign true positive', conf: 'High', status: 'proposal', affects: { rules: [232] },
        diagnosis: 'The company opened offices in Portugal and Poland. The country list the rule uses is from February.',
        prop: { ver: 1, kind: 'Act on an object', part: 'query', current: { kind: 'settings', label: 'FortiGate - Outbound to rare country', rows: [['Common countries', '31 countries'], ['Issues a week', '11']] },
          recommended: { kind: 'settings', label: 'FortiGate - Outbound to rare country', rows: [['Common countries', '33 countries: adds Portugal and Poland'], ['Issues a week', '2']] },
          validation: { rows: [['Issues a week', 11, 2, 11]], note: 'Backtest on 30 days. The 2 issues left go to countries with no office.' },
          decision: { q: 'Add Portugal and Poland to the common countries?', approve: 'Add both', effect: 'The rule stops raising issues for traffic to the two new offices.', risk: 'Low. Traffic to other rare countries still alerts.', reversible: true } } },
      { id: 'F2', title: 'Password reuse: 12 of 14 issues come from phishing-simulation accounts', card: 'noisy', layer: 'rule', noise: 'Benign true positive', conf: 'High', status: 'proposal', affects: { rules: [225] },
        diagnosis: 'The security team runs a phishing simulation with 6 test accounts. The rule is right about them, and nobody acts on it.',
        prop: { ver: 1, kind: 'Act on an object', part: 'environment facts', current: { kind: 'settings', label: 'Chrome - User Phished and/or Password Re-use/Breach event', rows: [['Environment facts', 'None'], ['Issues a week', '14']] },
          recommended: { kind: 'settings', label: 'Chrome - User Phished and/or Password Re-use/Breach event', rows: [['Environment facts', '6 phishing-simulation accounts · review in 3 months'], ['Issues a week', '2']] },
          validation: { rows: [['Issues a week', 14, 2, 14]], note: 'Backtest on 30 days. Real users are still covered.' },
          decision: { q: 'Add the 6 test accounts as an environment fact?', approve: 'Add the fact', effect: 'Issues from the test accounts stop. The fact is reviewed in 3 months.', risk: 'Low. Only the 6 listed accounts are affected.', reversible: true } } },
      { id: 'F3', title: 'Chrome extension installs: still noisy', card: 'noisy', layer: 'rule', conf: 'High', status: 'handled', handledIn: 'MSN-1002', affects: { rules: [224] },
        diagnosis: 'MSN-1002 already proposes a fix for this. This week’s 38 issues were added to it as evidence, and nothing new is proposed here.' }
    ],
    affects: { rules: [232, 225] }, pivots: [['rules', 'Correlation Rules', 'the 2 rules']] });
  /* Missions that arrive later in the scenarios */
  W.incoming.push({ id: 'MSN-1016', card: 'settings', title: 'Chrome extension rule: High severity for extensions IT did not approve', verdict: 'Gap', sug: 'Tune', agent: 'det', conf: 'High', impact: 'Medium', layer: 'rule', progressNote: 'Detection Engineer is checking the rule',
    trigger: { kind: 'human', text: 'Dana K. asked: “Make installs of unapproved extensions High severity.”' },
    summary: 'Installs of extensions that IT did not approve are the ones that matter. Today they are Medium, like every other install.',
    steps: ['Read the rule and its issue settings: severity Medium for every install', 'Found that MSN-1002 also proposes a change to the issue settings of this rule', 'Wrote the severity change so it works with or without that change'],
    diagnosis: 'A severity change on the same rule, in the same part that MSN-1002 changes.',
    current: { kind: 'settings', label: 'Chrome - Chrome Extension Install Event', rows: [['Severity', 'Medium for every install']] },
    recommended: { kind: 'settings', label: 'Chrome - Chrome Extension Install Event', rows: [['Severity', 'High when the extension is not on the IT list, otherwise Medium']] },
    validation: { rows: [['High-severity issues a month', 0, 100, 1250]], note: 'Backtest on 30 days: 100 issues would have been High.' },
    decision: { q: 'Raise the severity for unapproved extensions?', approve: 'Approve change', effect: 'Installs of extensions that IT did not approve create High issues.', risk: 'Low.', reversible: true },
    affects: { rules: [224] }, pivots: [['rules', 'Correlation Rules', 'the rule']] });
  W.incoming.push({ id: 'MSN-1017', card: 'noisy', title: 'Raised again: mail forwarding noise doubled since you declined it', verdict: 'Noisy', sug: 'Tune', agent: 'det', conf: 'High', impact: 'Medium', layer: 'rule', noise: 'Benign true positive', progressNote: 'Detection Engineer is measuring the rule', raisedFrom: 'MSN-0987',
    trigger: { kind: 'sweep', text: 'Daily noise review: issues on a rule with a “not now” decline doubled.' },
    summary: 'You declined this on ' + myDay(now - 8 * D + 5 * H) + ', “not now”. The cool-down has not ended, but the noise is materially worse: 13 issues this week instead of 6.',
    steps: ['Read the decision on the rule: declined, not now, cool-down until ' + myDay(now + 6 * D), 'Measured this week: 13 issues, 11 to partner.example', 'The job’s policy says a doubling is materially worse, so the suggestion is raised again'],
    diagnosis: 'The same benign true positive, with twice the volume.',
    current: { kind: 'settings', label: 'M365 - Mail forwarding rule to external domain', rows: [['Environment facts', 'None'], ['Issues a week', '13']] },
    recommended: { kind: 'settings', label: 'M365 - Mail forwarding rule to external domain', rows: [['Environment facts', 'partner.example is a finance partner · review in 6 months'], ['Issues a week', '2']] },
    validation: { rows: [['Issues a week', 13, 2, 13]], note: 'Backtest on 30 days.' },
    decision: { q: 'Add the partner domain as an environment fact?', approve: 'Approve fact', effect: 'Forwarding to partner.example no longer creates issues.', risk: 'Low.', reversible: true },
    affects: { rules: [236] }, pivots: [['rules', 'Correlation Rules', 'the rule']] });
  /* Runs that found nothing. Every run of a job is a mission, so these are kept, measured and open to feedback.
     Most belong to the Detection Engineer's own jobs. */
  const NF = [
    [2, 'rules', 'det', 'Rule-health sweep', 'Check that every enabled rule can fire.', '152 enabled rules · 1 skipped, handled in MSN-1004', ['port-scan rule 230', 'MSN-1004'], ['Checked that 152 enabled rules have data, filled fields and recent issues', 'Skipped the port-scan rule: MSN-1004 already handles it', 'Nothing new found'], 'Every enabled rule can fire, except one that MSN-1004 already handles.'],
    [26, 'rules', 'det', 'Rule-health sweep', 'Check that every enabled rule can fire.', '152 enabled rules', null, ['Checked that 152 enabled rules have data, filled fields and recent issues', 'Nothing found'], 'Every enabled rule can fire.'],
    [50, 'rules', 'det', 'Rule-health sweep', 'Check that every enabled rule can fire.', '152 enabled rules', null, ['Checked that 152 enabled rules have data, filled fields and recent issues', 'Nothing found'], 'Every enabled rule can fire.'],
    [6, 'change', 'det', 'Change check · Google Chrome pack updated', 'Check that the rules on Chrome data still fire after the pack update.', '6 Chrome rules and the 4 fields they read', null, ['Read what the pack update changed: 2 parsing rules', 'Checked the 4 fields the Chrome rules read: all filled', 'Replayed one hour of events: all 6 rules fire as before'], 'The pack update changed nothing that the Chrome rules depend on.'],
    [30, 'change', 'det', 'Change check · rule 238 edited', 'Check that an edited rule still fires.', 'Rule 238 and its last 24 hours', null, ['Compared the edit with the previous version', 'Ran the new query on 24 hours: it fires where the old one did'], 'The edit kept the rule working.'],
    [27, 'noise', 'det', 'Noise review', 'Find rules whose issues mostly end with no action, and suggest the smallest fix.', '64 rules with issues this week · 1 skipped, handled in MSN-1002', ['rule 224', 'MSN-1002'], ['Listed the 64 rules that created issues this week', 'Skipped rule 224: MSN-1002 already handles its noise', 'No other rule crossed the threshold'], 'No new noisy rule, beyond the one MSN-1002 already handles.'],
    [74, 'coverage', 'det', 'Coverage review', 'Find log sources with no working detection.', '62 sources and the techniques they can show', null, ['Listed the sources added this week: none', 'Checked the priority techniques: no new gap with data'], 'No new source and no new gap this week.'],
    [52, 'ioc', 'det', 'Indicator review', 'Find indicators that never matched or never expire.', '6 indicators · 2 skipped, handled in MSN-1011', null, ['Checked 6 indicators', 'Nothing new beyond what is already open'], 'Nothing new.'],
    [1, 'health', 'det', 'Data check for detections', 'Check that the data every enabled rule reads is arriving.', '103 instances · 1 skipped, handled in MSN-1003', ['Cloud audit logs · production', 'MSN-1003'], ['Checked 103 instances: 102 sent events in the last hour', 'Skipped “Cloud audit logs · production”: MSN-1003 already handles it', 'Nothing new found'], 'Every instance sent events in the last hour, except one that MSN-1003 already handles.']
  ].sort((a, b) => b[0] - a[0]);
  NF.forEach(([h, job, agent, name, obj, cov, skip, steps, summary], n) => {
    const at = now - h * H - 7 * 60000, id = 'MSN-' + (1101 + n), hh = new Date(at).toTimeString().slice(0, 5);
    MY_SPEC[id] = [job, obj, cov, [Math.max(2, steps.length * 3), steps.length * 7, 10 + steps.length * 6]];
    W.tasks.push({ id, card: 'check', title: /sweep|review|check for/i.test(name) ? `${name} · ${myDay(at)}, ${hh}` : name, verdict: 'Healthy', sug: 'Nothing found', agent, conf: 'High', impact: 'Low', layer: job === 'health' ? 'source' : 'rule', status: 'done', end: 'nothing', opened: at, closed: at + 4 * 60000, nothing: true,
      trigger: { kind: job === 'change' ? 'change' : 'sweep', text: job === 'change' ? name.split(' · ')[1] + '.' : `${MY_JOBS[job].name}, ${hh}.` },
      summary, steps, diagnosis: 'Nothing new.', skips: skip ? [skip] : null, validation: null, decision: null,
      outcome: 'Nothing found. Nothing needs you.', affects: {} });
  });
  W.log.forEach(l => { if (/^Hourly data check/.test(l.text)) l.text = 'MSN-1109: ' + l.text; });
  W.tasks.concat(W.incoming).forEach(t => myShape(W, t));
}
/* The shared part of every mission: job, objective, coverage, cost and result. */
function myShape(W, t) {
  const sp = MY_SPEC[t.id] || (t.nothing ? ['health', 'Check that the data every enabled rule reads is arriving.', '103 instances · 1 skipped, handled in MSN-1003', [3, 12, 60]] : ['review', t.title, '', [5, 10, 20]]);
  const j = MY_JOBS[sp[0]];
  Object.assign(t, { job: sp[0], jobVer: j.ver, objective: sp[1], coverage: sp[2], cost: { min: sp[3][0], queries: sp[3][1], pct: sp[3][2] } });
  t.resultClass = t.sug === 'Keep' || t.sug === 'Nothing found' ? 'nothing' : t.sug === 'Watch' ? 'inconclusive' : 'action';
  if (!t.skips && !t.nothing && /handled in (MSN-\d+)/.test(t.coverage)) t.skips = [['rule 224', t.coverage.match(/handled in (MSN-\d+)/)[1]]];
  const tg = MY_TARGET[t.id];
  if (tg) { t.targets = tg[0]; t.part = tg[1]; t.expects = {}; tg[0].forEach(id => { const r = W.rules.find(x => x.id === id); if (r) t.expects[id] = r.ver; }); }
  t.history = t.history || [];
}
/* ---------- states ---------- */
const myState = t => t.status === 'blocked' ? 'blocked' : t.status === 'done' ? 'done' : t.status === 'pending' ? (t.waitOn ? 'waiting' : 'needs') : t.handed ? 'waiting' : 'running';
/* Three mission statuses: Pending (a person has to decide), In progress (the agent works, or waits on another team or mission), Done. */
const M_STATE = { needs: ['Pending', 'amber'], running: ['In progress', 'blue'], waiting: ['In progress', 'blue'], blocked: ['Pending', 'rose'], done: ['Done', 'cx'] };
function myEndTxt(t) {
  if (t.status !== 'done') return '';
  return ({ approved: 'Changes applied', edited: 'Changes applied, with your edits', rejected: 'Declined' + (t.declined ? ' · ' + myDeclTxt(t.declined) : ''), handed: 'Handed over', watch: 'Inconclusive · checks again', nothing: 'Nothing found', partly: 'Partly applied', cancelled: 'Cancelled',
    auto: t.autoWhy === 'outside' ? 'Closed · fixed outside the mission' : t.autoWhy === 'verified' ? 'Changes applied · verified' : 'Closed · the problem disappeared', mixed: 'Done · ' + (t.mixTxt || 'some changes applied') })[t.end] || 'Done';
}
/* A rule changed: its version goes up, and every other open proposal on it is out of date until the agent checks it again. */
function myBump(W, id, why, from) {
  const r = W.rules.find(x => x.id === id); if (!r) return;
  r.ver++;
  W.tasks.filter(x => x !== from && x.status !== 'done' && x.targets && x.targets.includes(id) && x.expects && x.expects[id] < r.ver && !x.stale)
    .forEach(x => { x.stale = { rule: id, from: x.expects[id], to: r.ver, why }; (x.history = x.history || []).push({ t: Date.now(), kind: 'evidence', text: `Rule ${id} changed (${why}). It is now version ${r.ver}, so the proposal on version ${x.expects[id]} is out of date.` }); W.log.unshift({ t: Date.now(), kind: 'task', text: `${x.id}: rule ${id} changed (${why}). The proposal is out of date and is checked again` }); });
}

/* A decision on one proposal of a mission with several findings. The mission is done when every proposal is decided. */
function myApplyProp(W, t, fi, choice, whoName, reason) {
  const who = whoName.replace(/\.$/, ''), now = Date.now(), f = t.findings[fi], D = 86400000; if (!f || !f.prop || f.dec) return;
  f.dec = { choice, by: who, at: now, ver: f.prop.ver };
  if (choice === 'reject') { const r = reason || 'later'; f.dec.reason = r; f.dec.until = r === 'later' ? now + 14 * D : r === 'risk' ? now + 90 * D : null; }
  else { (f.affects.rules || []).forEach(id => { const r = W.rules.find(x => x.id === id); if (r) { r.issues7d = Math.round(r.issues7d * .18); r.nshare = .1; } myBump(W, id, `changed by ${t.id}`, t); }); }
  W.log.unshift({ t: now, kind: 'done', text: `${who} ${choice === 'reject' ? 'declined' : 'approved'} ${t.id} · ${f.id}` });
  const props = t.findings.filter(x => x.prop), left = props.filter(x => !x.dec);
  if (left.length) return;
  const ok = props.filter(x => x.dec.choice !== 'reject').length;
  t.status = 'done'; t.closed = now; t.by = who; t.end = ok === props.length ? 'approved' : ok === 0 ? 'rejected' : 'mixed';
  t.mixTxt = `${ok} applied, ${props.length - ok} declined`;
  if (t.end === 'rejected') t.declined = { reason: props[0].dec.reason, until: props[0].dec.until, by: who, at: now };
  t.outcome = ok === props.length ? `Both changes applied by ${who}.` : ok === 0 ? `Both declined by ${who}. Nothing changed.` : `${t.mixTxt}. ${props.map(x => `${x.id}: ${x.dec.choice === 'reject' ? 'declined · ' + myDeclTxt(x.dec) : 'applied'}`).join(' · ')}.`;
}
/* A blocked mission: check the refused part again, or stop with what was applied. */
function myUnblockPartial(W, t, how, whoName) {
  const who = whoName.replace(/\.$/, ''), now = Date.now(), r = W.rules.find(x => x.id === 222);
  if (how === 'stop') { (t.history = t.history || []).push({ t: now, kind: 'steer', who: 'me', text: 'stopped here, with 2 of 3 changes applied.' }); t.status = 'done'; t.end = 'partly'; t.closed = now; t.outcome = `Partly applied. ${t.partial.done.join(' and ')}. ${who} stopped here, so rule 222 stays enabled.`; return; }
  t.status = 'pending'; t.race = false; t.ver = (t.ver || 1) + 1; t.expects[222] = r.ver; t.targets = [222];
  t.prevRec = JSON.parse(JSON.stringify(t.recommended));
  t.current = { kind: 'settings', label: 'Rule 222, version ' + r.ver, rows: [['Chrome - Known Malicious Site Visit (ID 222)', 'Enabled · Dana K. renamed it · still a copy of 221']] };
  t.recommended = { kind: 'settings', label: 'Rule 222, version ' + r.ver, rows: [['Chrome - Known Malicious Site Visit (ID 222)', 'Disable']] };
  t.decision = { q: `Disable rule 222 (version ${r.ver})?`, approve: 'Disable rule 222', effect: 'Rule 222 is disabled. Rules 216 and 218 are already retired.', risk: 'Low. Dana K. only renamed it: the query is still a copy of rule 221.', reversible: true };
  t.changed = { ver: t.ver, title: 'Checked rule 222 again', what: ['Rule 222 changed after your approval: Dana K. renamed it.', 'The query is still identical to rule 221, so disabling it is still right.', 'Rules 216 and 218 were already retired, so only rule 222 is left.'] };
  t.partial.rechecked = true;
  (t.history = t.history || []).push({ t: now, kind: 'steer', who: 'me', text: `asked the agent to check rule 222 again. Version ${t.ver} is ready.` });
}
/* The agent checks an out-of-date proposal again, on the new version of the rule. */
function myReassess(W, t) {
  const s = t.stale; if (!s) return; const r = W.rules.find(x => x.id === s.rule);
  t.stale = null; if (t.status === 'done') return;
  if (r && r.deleted) { t.status = 'done'; t.end = 'cancelled'; t.closed = Date.now(); t.decision = null; t.outcome = `Cancelled. Rule ${s.rule} was deleted, so there is nothing left to change.`; return; }
  t.ver = (t.ver || 1) + 1; t.expects[s.rule] = r.ver; t.prevRec = JSON.parse(JSON.stringify(t.recommended || null));
  t.changed = { ver: t.ver, title: `Checked again on version ${r.ver} of rule ${s.rule}`, what: [`Rule ${s.rule} changed: ${s.why}. It is now version ${r.ver}.`, 'The agent read the new version and rebuilt the proposal on it.', 'The change still applies, so the suggestion stays the same.'] };
  (t.history = t.history || []).push({ t: Date.now(), kind: 'evidence', text: `Checked again on version ${r.ver} of rule ${s.rule}. Version ${t.ver} of the proposal is ready.` });
  W.log.unshift({ t: Date.now(), kind: 'task', text: `${t.id}: version ${t.ver} of the proposal is ready` });
}
