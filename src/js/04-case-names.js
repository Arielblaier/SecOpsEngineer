/* ======================================================================
   CASE NAMES (cases group several issues) + OPEN TIME
   ====================================================================== */
const NAME_PARTS = {
  kerb: [['Kerberoasting ticket extraction', 'RC4 ticket downgrade burst', 'SPN enumeration and ticket harvesting'], ['from a non-admin workstation', 'targeting SQL service accounts', 'with Rubeus tooling signature', 'following a password spray', 'against backup service SPNs', 'alongside LDAP reconnaissance']],
  smb: [['PsExec lateral movement', 'Remote service creation over SMB', 'Named-pipe enumeration via PsExec'], ['toward domain admin credentials', 'across file servers', 'with LSASS access attempts', 'spreading from a jump host', 'after credential dumping', 'with admin share writes']],
  dns: [['DNS tunneling to a rare TLD', 'High-entropy TXT query burst', 'Covert DNS channel'], ['from an unsigned ProgramData binary', 'with base32-encoded payloads', 'during off-hours', 'to a newly registered .xyz domain', 'bypassing the corporate resolver', 'with a steady 30s beacon rhythm']],
  oauth: [['Unverified OAuth app consent', 'Risky mailbox permission grant', 'Shadow IT app authorization'], ['after a phishing link click', 'requesting offline mailbox access', 'from a new sign-in location', 'by a finance user', 'with Mail.ReadWrite scope', 'after MFA fatigue prompts']],
  ssl: [['Vulnerable OpenSSL in container image', 'Outdated TLS library in workload', 'Unpatched base image'], ['exposed via public ingress', 'in an internal batch cluster', 'with 40+ running replicas', 'in the payments namespace', 'missed by the last patch cycle', 'behind a legacy load balancer']],
  ps: [['Encoded PowerShell from Office macro', 'Macro-launched download cradle', 'Obfuscated PowerShell loader'], ['beaconing to a 3-day-old domain', 'with an in-memory second stage', 'after an invoice-themed email', 'with an AMSI bypass attempt', 'dropping a scheduled task', 'with LSASS dump via comsvcs.dll']],
  travel: [['Impossible travel for privileged user', 'Session token replay', 'Anomalous privileged sign-in'], ['from an anonymizing proxy', 'linked to a password spray source', '22 minutes after an office login', 'bypassing conditional access', 'from São Paulo and Tel Aviv', 'with a new device fingerprint']],
  s3: [['Bulk S3 reads by long-lived IAM key', 'Anomalous bucket enumeration', 'Mass GetObject activity'], ['from a never-seen ASN', 'across 44 buckets', 'touching customer PII buckets', 'outside the CI runner subnet', 'after key exposure in a public repo', 'at 3x the nightly backup volume']],
  vss: [['Shadow copy deletion', 'Recovery inhibition via vssadmin', 'Mass file renames after VSS wipe'], ['from a renamed binary', 'on a finance workstation', 'with .lck extension encryption', 'followed by SMB share access', 'preceding ransom note drops', 'by a newly created local admin']]
};
function uniqueName(key, rnd, used) {
  const P = NAME_PARTS[key] || NAME_PARTS.ps;
  for (let k = 0; k < 40; k++) {
    const a = P[0][Math.floor(rnd() * P[0].length)], b = P[1][Math.floor(rnd() * P[1].length)], hn = 2 + Math.floor(rnd() * 7);
    const nm = rnd() < .45 ? `${a} ${b}` : `${a} ${b} across ${hn} hosts`;
    if (!used.has(nm)) { used.add(nm); return nm; }
  }
  const nm = `${P[0][0]} ${P[1][0]} across ${used.size} hosts`; used.add(nm); return nm;
}
const openMs = c => ((lifecycle(c) === 'resolved' ? (c.closedAt || c.updated) : Date.now()) - (c.opened || c.updated));
const fmtOpen = ms => { const m = Math.max(1, Math.round(ms / 60000)); if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ${String(m % 60).padStart(2, '0')}m`; return `${Math.floor(h / 24)}d ${h % 24}h`; };
function stampOpen(c, now) {
  const lc = lifecycle(c);
  if (lc === 'in_progress') c.opened = now - (4 + Math.floor(rng() * 40)) * 60000;
  else if (lc === 'pending') c.opened = now - (25 + Math.floor(rng() * 320)) * 60000;
  else { c.closedAt = c.updated; c.opened = c.updated - (8 + Math.floor(rng() * 180)) * 60000; }
}
