/* ======================================================================
   THREAT LIBRARY, drives case generation and live investigations
   ====================================================================== */
const THREATS = [
 {key:'kerb',name:'Kerberoasting ticket extraction attempt',domain:'Identity',sev:'High',score:84,mitre:['T1558.003'],mal:.7,host:'DC',
  action:'Reset Service Account Credentials',atype:'Credential Rotation',playbook:'AD Automated Remediation v2',risk:'Moderate, dependent services restart',
  q1:'dataset = xdr_data | filter event_type = "KERBEROS_TGS" and encryption = "RC4" | comp count() by actor_host, spn',
  r1m:'180 TGS requests for 14 privileged SPNs in 90s with RC4 downgrade.',r1b:'Low-volume TGS requests from the scheduled scanner account.',
  q2:'dataset = identity_story | filter src_host = "{host}" | fields user, logon_type, first_seen',
  r2m:'Requesting user has no history of SPN enumeration.',r2b:'Account matches the approved vulnerability scanner baseline.',
  evm:'Ticket burst pattern matches Rubeus kerberoast tooling.',sm:'Kerberoasting burst from a non-admin workstation with RC4 downgrade; tooling signature matches Rubeus.',sb:'TGS burst traced to the approved vulnerability scanner running its weekly job.'},
 {key:'smb',name:'Lateral SMB pipe enumeration via PsExec',domain:'Endpoint',sev:'Critical',score:92,mitre:['T1021.002','T1569.002'],mal:.8,host:'SRV',
  action:'Isolate Source Host & Revoke TGT',atype:'Active Defense',playbook:'Identity Shield: Rapid Ticket Revocation',risk:'Critical, blocks lateral movement; host goes offline',
  q1:'dataset = xdr_data | filter action_process_image_name = "psexesvc.exe" | comp count() by agent_hostname, actor_effective_username',
  r1m:'PSEXESVC created on 6 servers within 4 minutes from one source.',r1b:'PsExec usage from the IT admin jump host during a change window.',
  q2:'dataset = network_story | filter dst_port = 445 and src_host = "{host}" | comp count_distinct(dst_ip)',
  r2m:'SMB sessions to 23 distinct hosts; \\\\lsarpc named pipe queried.',r2b:'SMB traffic limited to 3 patched file servers.',
  evm:'Named-pipe enumeration followed by service creation targeting domain admins.',sm:'Service creation via PsExec across 6 servers attempting to harvest domain admin credentials over SMB named pipes.',sb:'PsExec activity matched approved change ticket CHG-4471 from the admin jump host.'},
 {key:'dns',name:'DNS tunneling query burst to rare top-level domain',domain:'Network',sev:'High',score:76,mitre:['T1071.004','T1048'],mal:.55,host:'WS',
  action:'Sinkhole Domain & Block Egress',atype:'Containment Action',playbook:'DNS Security Sinkhole v1.8',risk:'Low, domain has no business traffic',
  q1:'dataset = dns_story | filter src_host = "{host}" | comp count(), avg(query_length) by dns_query_domain',
  r1m:'4,200 TXT queries with 58-char average subdomains to one .xyz domain.',r1b:'High query count to a known CDN telemetry domain.',
  q2:'dataset = xdr_data | filter agent_hostname = "{host}" and dns_query_domain != null | comp count() by actor_process_image_name',
  r2m:'Queries issued by an unsigned binary in ProgramData.',r2b:'Queries issued by the signed endpoint telemetry agent.',
  evm:'High-entropy subdomains encode base32 data consistent with exfiltration.',sm:'Unsigned process tunneling base32-encoded data through TXT queries to a newly registered .xyz domain.',sb:'Burst traced to a signed telemetry agent contacting its CDN; entropy within vendor baseline.'},
 {key:'oauth',name:'Shadow IT OAuth grant to unverified app',domain:'Cloud',sev:'Medium',score:58,mitre:['T1528'],mal:.35,host:'M365',
  action:'Revoke OAuth Grant',atype:'Access Revocation',playbook:'SaaS Consent Revocation',risk:'Low, app loses mailbox access',
  q1:'dataset = saas_audit | filter operation = "Consent to application" | fields user, app_id, scopes',
  r1m:'Grant includes Mail.ReadWrite and offline_access scopes.',r1b:'Grant limited to the User.Read profile scope.',
  q2:'dataset = cloud_audit | filter app_id = "{id}" | comp count() by publisher_verified',
  r2m:'Publisher unverified; app registered 2 days ago.',r2b:'App used by 40 users in the marketing tenant for 6 months.',
  evm:'App requested persistent mailbox write access from a phishing landing page.',sm:'User consented to an unverified app requesting persistent mailbox access after a phishing link.',sb:'App is a long-standing marketing tool with minimal scopes.'},
 {key:'ssl',name:'Outdated OpenSSL 3.0.1 on container image',domain:'Posture',sev:'Medium',score:31,mitre:['T1190'],mal:.12,host:'K8S',
  action:'Rebuild Image with Patched Base',atype:'Remediation',playbook:'Container Rebuild Pipeline',risk:'Low, rolling redeploy',
  q1:'dataset = cloud_assets | filter image_packages contains "openssl 3.0.1" | fields image, cluster, exposed',
  r1m:'Vulnerable image serves an internet-facing ingress.',r1b:'Image only runs internal batch jobs with no ingress.',
  q2:'dataset = cloud_assets | filter image = "{id}" | fields last_deployed, replicas',
  r2m:'42 replicas exposed on port 443.',r2b:'2 replicas, no network exposure.',
  evm:'Exposed service reachable with a vulnerable TLS stack.',sm:'Internet-exposed workload running vulnerable OpenSSL; patch required.',sb:'Vulnerable package present but the workload is not network-reachable; tracked by the patch cycle.'},
 {key:'ps',name:'Encoded PowerShell spawned by Office macro',domain:'Endpoint',sev:'Critical',score:90,mitre:['T1059.001','T1566.001'],mal:.75,host:'WS',
  action:'Isolate Host',atype:'Containment Action',playbook:'Enterprise Quarantine v3.4',risk:'Elevated, user session paused',
  q1:'dataset = xdr_data | filter actor_process_image_name = "winword.exe" and action_process_image_name = "powershell.exe" | fields action_process_command_line',
  r1m:'winword.exe spawned powershell.exe -enc with a download cradle.',r1b:'Macro launched the signed finance add-in updater.',
  q2:'dataset = network_story | filter src_host = "{host}" | comp count() by dst_ip, dst_port',
  r2m:'Outbound HTTPS to a 3-day-old domain right after execution.',r2b:'Traffic limited to the vendor update server.',
  evm:'Decoded script downloads a second-stage loader into memory.',sm:'Macro-launched encoded PowerShell pulled a second-stage loader from a newly registered domain.',sb:'Encoded command belongs to the approved finance add-in updater.'},
 {key:'travel',name:'Impossible travel sign-in for privileged user',domain:'Identity',sev:'High',score:79,mitre:['T1078'],mal:.5,host:'IDP',
  action:'Revoke Sessions & Force MFA',atype:'Identity Response',playbook:'Identity Session Reset',risk:'Low, user must sign in again',
  q1:'dataset = identity_story | filter user = "{user}" | fields login_time, geo_country, src_ip, mfa_result',
  r1m:'Sign-ins from Tel Aviv and São Paulo 22 minutes apart.',r1b:'Second sign-in came from the corporate VPN egress in Frankfurt.',
  q2:'dataset = identity_story | filter src_ip = "{ip}" | comp count_distinct(user)',
  r2m:'Source IP hit 31 accounts with password spray in the last hour.',r2b:'IP is a known corporate VPN egress.',
  evm:'Session token replayed from an anonymizing proxy.',sm:'Privileged session replayed from a proxy that also sprayed 31 accounts.',sb:'Second location is the corporate VPN egress; no anomaly.'},
 {key:'s3',name:'Anomalous S3 bucket enumeration by IAM key',domain:'Cloud',sev:'High',score:81,mitre:['T1619','T1530'],mal:.55,host:'AWS',
  action:'Suspend IAM Access Key',atype:'Access Revocation',playbook:'Cloud Key Quarantine',risk:'Moderate, CI jobs using the key will fail',
  q1:'dataset = cloud_audit | filter api in ("ListBuckets","GetObject") | comp count() by access_key_id',
  r1m:'1,900 GetObject calls across 44 buckets in 10 minutes.',r1b:'Calls match the nightly backup job profile.',
  q2:'dataset = cloud_audit | filter access_key_id = "{id}" | comp count_distinct(src_ip)',
  r2m:'Key used from a new ASN never seen in this tenant.',r2b:'Key used only from the CI runner subnet.',
  evm:'Bulk object reads from a new ASN consistent with data staging.',sm:'Long-lived IAM key read 1,900 objects from a new ASN, likely a leaked credential.',sb:'Enumeration matches the nightly backup job from the CI subnet.'},
 {key:'vss',name:'Shadow copy deletion via vssadmin',domain:'Endpoint',sev:'Critical',score:96,mitre:['T1490','T1486'],mal:.9,host:'FIN',
  action:'Isolate Host & Snapshot Disk',atype:'Containment Action',playbook:'Ransomware Early Stop v2.1',risk:'Elevated, finance workstation offline',
  q1:'dataset = xdr_data | filter action_process_command_line contains "delete shadows" | fields agent_hostname, actor_process_image_name, causality_actor',
  r1m:'vssadmin delete shadows /all /quiet launched from a renamed binary.',r1b:'Shadow copy cleanup run by the backup vendor agent.',
  q2:'dataset = xdr_data | filter agent_hostname = "{host}" and event_sub_type = "FILE_RENAME" | comp count() by file_extension',
  r2m:'3,100 file renames to a new .lck extension in 60 seconds.',r2b:'No abnormal file rename activity.',
  evm:'Recovery inhibition followed by mass encryption, ransomware pre-detonation pattern.',sm:'Shadow copies wiped and mass file renames started, ransomware in its first minute.',sb:'Cleanup run by the signed backup agent during its retention job.'}
];
const T = Object.fromEntries(THREATS.map(t => [t.key, t]));
const ASSIGNEES = ['Agent (Autonomous)', 'Guy R.', 'Sarah C.', 'SecOps Tier 2', 'Unassigned'];
const SEV_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const SEV_TN = { Critical: 'rose', High: 'amber', Medium: 'indigo', Low: 'slate' };
const USERS = ['a.levi', 'd.cohen', 'm.klein', 'r.mizrahi', 'svc_backup', 'n.peretz', 'j.adler'];

const VERD = {
  Malicious:    { label: 'Malicious', dot: 'bg-rose-500', tn: 'rose' },
  Inconclusive: { label: 'Inconclusive', dot: 'bg-amber-500', tn: 'amber' },
  Running:      { label: 'In progress', dot: 'bg-blue-500 animate-pulse', tn: 'blue' },
  Benign:       { label: 'Auto-resolved', dot: 'bg-cx', tn: 'cx' },
  Contained:    { label: 'Contained', dot: 'bg-cx', tn: 'cx' },
  Closed:       { label: 'Closed', dot: 'bg-slate-400', tn: 'slate' }
};
const lifecycle = c => c.verdict === 'Running' ? 'in_progress' : (c.verdict === 'Malicious' || c.verdict === 'Inconclusive') ? 'pending' : 'resolved';
