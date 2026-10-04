/* ======================================================================
   STATE
   ====================================================================== */

function heroCases() {
  const now = Date.now();
  const a = makeCase('555548', T.ps, 'Malicious', {
    name: 'Memory heap exploit via Microsoft Edge with outbound C2 beaconing', host: 'SOC-Tech', ip: '10.0.4.12', sev: 'Critical', score: 94,
    assignee: 'Agent (Autonomous)', dur: 192, updated: now - 30000,
    summary: 'Corroborated invalid heap write (CVE-2023-4863) in msedge.exe with persistent TLS beaconing to Cobalt Strike IP 8.130.54.67.'
  });
  a.conf = 98; a.mitre = ['T1189', 'T1071.001', 'T1055'];
  a.worklog = [
    {id:uid(),type:'system',time:'14:22:01',title:'Investigation triggered',detail:'Agent ingested the case. SmartScore 94 exceeded the tenant threshold (70). Evaluated the initial causality graph.',status:'Verified',tokens:110,latency:'240ms',by:'agent'},
    {id:uid(),type:'xql',time:'14:22:04',title:'Query: process lineage tracing',detail:'Ran a process ancestry query on SOC-Tech. Flagged rundll32.exe spawned by msedge.exe.',query:'dataset = xdr_data | filter agent_hostname = "SOC-Tech" and actor_process_image_name = "msedge.exe" | comp count() by action_file_name, action_process_command_line',result:'Irregular child invocation: msedge.exe → rundll32.exe (offset 0x7FFE0014).',status:'Success',tokens:420,latency:'680ms',by:'agent'},
    {id:uid(),type:'evidence',time:'14:22:15',title:'Evidence: CVE-2023-4863 heap write',detail:'Extracted an invalid memory dereference in the libwebp rendering pipeline. Confirmed the exploit delivery payload.',status:'High fidelity',tokens:310,latency:'410ms',by:'agent'},
    {id:uid(),type:'xql',time:'14:22:38',title:'Query: network beaconing',detail:'Analyzed outbound TLS streams for rundll32.exe over a 10-minute window.',query:'dataset = network_story | filter src_ip = "10.0.4.12" and dst_ip = "8.130.54.67" | fields bytes_out, interval_seconds, tls_ja3',result:'24 handshakes to 8.130.54.67. Regular 45s jitter matches a known C2 profile.',status:'Corroborated',tokens:480,latency:'920ms',by:'agent'},
    {id:uid(),type:'decision',time:'14:23:02',title:'Verdict: Malicious (High confidence)',detail:'Confirmed remote exploit chain plus outbound command-and-control beaconing.',status:'Formulated',tokens:380,latency:'1.1s',by:'agent'},
    {id:uid(),type:'task',time:'14:23:08',title:'Decision needed: host containment',detail:'Raised a high-priority quarantine in the Resolution Center. Automatic containment on hold until an analyst approves.',status:'Awaiting review',tokens:140,latency:'220ms',by:'agent'}
  ];

  const b = makeCase('183347', T.ps, 'Inconclusive', {
    name: 'Unsigned binary dropped to user temp directory by rundll32', host: 'Lab-Runner-04', ip: '10.0.8.44', sev: 'High', score: 68,
    assignee: 'Guy R.', dur: 105, updated: now - 70000,
    summary: 'Unsigned executable in AppData\\Temp. Lineage matches the automated QA runner, but the file has no code-signing signature.'
  });
  b.conf = 64;
  b.worklog = stampTimes([
    {id:uid(),type:'system',title:'Investigation triggered',detail:'Agent ingested the case. SmartScore 68 on Lab-Runner-04.',status:'Verified',tokens:90,latency:'180ms',by:'agent'},
    {id:uid(),type:'xql',title:'Query: file provenance',detail:'Traced the dropper chain for qa_harness_x64.exe.',query:'dataset = xdr_data | filter agent_hostname = "Lab-Runner-04" and action_file_path contains "\\\\AppData\\\\Local\\\\Temp" | fields actor_process_image_name, action_file_sha256, signature_status',result:'Parent chain: jenkins-agent.exe → rundll32.exe → qa_harness_x64.exe (unsigned).',status:'Success',tokens:360,latency:'540ms',by:'agent'},
    {id:uid(),type:'xql',title:'Query: prevalence in tenant',detail:'Checked how often this hash appears across the fleet.',query:'dataset = xdr_data | filter action_file_sha256 = "9f2c…e71a" | comp count_distinct(agent_hostname)',result:'Seen on 3 other QA runners over 14 days. No network egress.',status:'Mixed',tokens:240,latency:'380ms',by:'agent'},
    {id:uid(),type:'decision',title:'Verdict: Inconclusive (Low confidence)',detail:'Behavior fits the QA pipeline, but the unsigned binary breaks policy. Needs a human call.',status:'Formulated',tokens:310,latency:'700ms',by:'agent'},
    {id:uid(),type:'task',title:'Steering requested',detail:'Agent paused. Confirm whether Lab-Runner-04 is an authorized QA runner.',status:'Awaiting review',tokens:80,latency:'150ms',by:'agent'}
  ], now - 70000);

  const c = makeCase('994821', T.smb, 'Running', {
    name: 'Active reconnaissance scan from internal subnet 10.240.12.0/24', host: 'Domain-Ctrl-02', ip: '10.240.12.5', sev: 'Critical', score: 89,
    assignee: 'Agent (Autonomous)', dur: 42, updated: now - 5000, planned: 'Malicious'
  });

  const d = makeCase('813054', T.ssl, 'Benign', {
    name: 'Insecure Webmin management port 9667 exposed to perimeter', host: 'Dev-Web-Prod', ip: '192.168.1.90', sev: 'High', score: 40,
    assignee: 'Agent (Autonomous)', dur: 45, updated: now - 90000,
    summary: 'Socket is bound only to 127.0.0.1; perimeter probes fail the TCP handshake. Auto-resolved as benign.'
  });
  d.conf = 99; d.mitre = ['T1133'];
  return [a, b, c, d];
}


