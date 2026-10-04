/* ======================================================================
   HAND-WRITTEN HERO CASES, the ones clicked during the demo
   ====================================================================== */
const HERO = {
  '555548': {
    label: 'Browser Exploit', files: ['rundll32.exe', 'promo_banner.webp'], ext: '8.130.54.67',
    descs: ['Edge crashed and recovered inside the WebP image decoder', 'msedge.exe started rundll32.exe with no arguments', 'Encrypted beacon to 8.130.54.67 every 45 seconds'],
    story: 'An employee on SOC-Tech opened a web page in Microsoft Edge that carried a booby-trapped WebP image. The image exploited a known Edge flaw (CVE-2023-4863), and within seconds Edge started rundll32.exe, something a browser never does. That process then began calling out to 8.130.54.67 every 45 seconds over encrypted TLS, the heartbeat of a Cobalt Strike command-and-control server. Seven related issues on SOC-Tech and two hosts that visited the same page were grouped into this case.',
    why: 'Every stage of a real attack is present and confirmed: the exploit, a process the browser should never start, and live contact with known attacker infrastructure. Nothing legitimate explains it.',
    shift: 'Would drop to Medium if 8.130.54.67 turned out to belong to an approved security-testing vendor.',
    gaps: ['Did not inspect the memory of rundll32.exe, the EDR policy on SOC-Tech blocks memory dumps.', 'Did not trace where the page came from, web proxy logs are not connected to this tenant.'],
    Q: [
      { q: 'Did Edge actually run the exploit?', ans: 'Yes', tone: 'support', w: 1.4, text: 'Edge crashed and recovered inside the WebP decoder at 14:22:01, the exact signature of CVE-2023-4863, right after loading promo_banner.webp.',
        ev: [{ kind: 'telemetry', label: 'Edge renderer crash', detail: 'Heap write outside buffer in libwebp, process recovered 0.4s later' }, { kind: 'artifact', label: 'promo_banner.webp', detail: 'Sandbox: malformed Huffman table that triggers CVE-2023-4863' }] },
      { q: 'Did Edge start a process it never should?', ans: 'Yes', tone: 'support', w: 1.5, text: 'msedge.exe launched rundll32.exe with no arguments. No browser has done this on SOC-Tech, or anywhere in the tenant, in the last 30 days.',
        ev: [{ kind: 'query', label: 'XQL · Process lineage', detail: 'msedge.exe → rundll32.exe (offset 0x7FFE0014)', query: 'dataset = xdr_data | filter agent_hostname = "SOC-Tech" and actor_process_image_name = "msedge.exe" | comp count() by action_process_image_name, action_process_command_line' },
             { kind: 'telemetry', label: '30-day baseline', detail: '0 browser-spawned rundll32.exe events across 4,812 endpoints' }] },
      { q: 'Is the new process talking to attacker infrastructure?', ans: 'Yes', tone: 'support', w: 1.6, text: '24 encrypted connections to 8.130.54.67 at a steady 45-second rhythm. The IP and the TLS fingerprint both match a known Cobalt Strike server.',
        ev: [{ kind: 'query', label: 'XQL · Network beaconing', detail: '24 handshakes, 45s ± 3s jitter, JA3 72a589da…', query: 'dataset = network_story | filter src_ip = "10.0.4.12" and dst_ip = "8.130.54.67" | fields bytes_out, interval_seconds, tls_ja3' },
             { kind: 'intel', label: '8.130.54.67', detail: 'Listed as Cobalt Strike C2 on 3 feeds · first seen 6 days ago' }] },
      { q: 'Could this be approved security testing?', ans: 'No', tone: 'support', w: 1, text: 'No red-team engagement, change ticket or approved vendor covers SOC-Tech or this IP this month.',
        ev: [{ kind: 'change', label: 'Change management', detail: '0 matching tickets or engagements in the last 30 days' }, { kind: 'asset', label: 'SOC-Tech', detail: 'Owner: SOC team · no test exemption on record' }] },
      { q: 'Did the attacker move further, other hosts or credentials?', ans: 'Not yet', tone: 'neutral', w: .5, text: 'No LSASS access and no logins from SOC-Tech to other machines so far. The two related hosts only loaded the same page and did not run the exploit.',
        ev: [{ kind: 'query', label: 'XQL · Lateral logins', detail: '0 outbound authentications from SOC-Tech since 14:22', query: 'dataset = identity_story | filter src_host = "SOC-Tech" and event_time > "14:22:00" | comp count() by dst_host' },
             { kind: 'asset', label: 'DOL-AMROTH, PELARGIR', detail: 'Loaded the page; browser patched, no crash' }] }
    ]
  },
  '183347': {
    label: 'Unsigned Binary', files: ['qa_harness_x64.exe', 'jenkins-agent.exe'], ext: '10.0.8.1',
    descs: ['Unsigned executable written to AppData\\Temp', 'Dropped by rundll32.exe started from the Jenkins build agent', 'Same hash seen on 3 other QA runners'],
    story: 'An unsigned program, qa_harness_x64.exe, appeared in the temp folder of Lab-Runner-04. It was written by rundll32.exe, which the Jenkins build agent started, so it came out of the QA pipeline, not from a user or the internet. The same file has run on three other QA runners over two weeks and never connected outside the network. The only problem: it is not code-signed, which breaks policy for anything built for production.',
    why: 'The trail points to the normal QA pipeline, but an unsigned binary inside a trusted pipeline is exactly how supply-chain attacks hide. The agent cannot tell these apart without knowing whether this build is approved.',
    shift: 'Would rise to High (benign) if you confirm Lab-Runner-04 is an approved runner, or to High (malicious) if the build is not in the release plan.',
    gaps: ['Did not diff the binary against the last signed build, the artifact store is not connected.', 'Could not reach the build owner to confirm the change.'],
    Q: [
      { q: 'Where did the file come from?', ans: 'QA pipeline', tone: 'counter', w: 1.2, text: 'Written by rundll32.exe, which was started by jenkins-agent.exe on Lab-Runner-04, the normal build path.',
        ev: [{ kind: 'query', label: 'XQL · File provenance', detail: 'jenkins-agent.exe → rundll32.exe → qa_harness_x64.exe', query: 'dataset = xdr_data | filter agent_hostname = "Lab-Runner-04" and action_file_path contains "AppData\\\\Local\\\\Temp" | fields actor_process_image_name, action_file_sha256, signature_status' }] },
      { q: 'Is the file signed?', ans: 'No', tone: 'support', w: 1.5, text: 'No code-signing signature. Every other binary produced by this pipeline in the last 90 days was signed.',
        ev: [{ kind: 'artifact', label: 'qa_harness_x64.exe (9f2c…e71a)', detail: 'Unsigned · not known to intel vendors' }] },
      { q: 'Has it been seen before?', ans: 'Yes, 3 runners', tone: 'counter', w: .9, text: 'The same hash ran on three other QA runners in the last 14 days with identical behavior.',
        ev: [{ kind: 'query', label: 'XQL · Prevalence', detail: 'Seen on 4 hosts, all QA runners', query: 'dataset = xdr_data | filter action_file_sha256 = "9f2c…e71a" | comp count_distinct(agent_hostname)' }] },
      { q: 'Did it reach the internet?', ans: 'No', tone: 'counter', w: .8, text: 'No outbound connections outside the lab network from any of the four runners.',
        ev: [{ kind: 'telemetry', label: 'Network egress', detail: '0 external connections in 14 days' }] },
      { q: 'Is this build approved?', ans: 'Unclear', tone: 'unclear', w: 1, text: 'No approval record or code-signing exception was found. The agent needs you to confirm.',
        ev: [{ kind: 'change', label: 'Change management', detail: '0 tickets mention qa_harness_x64' }, { kind: 'asset', label: 'Lab-Runner-04', detail: 'Owner: QA automation · role: build runner' }] }
    ]
  },
  '994821': {
    label: 'Network Reconnaissance', files: ['svc_scan.exe', 'lsass.exe'], ext: '10.240.12.77',
    descs: ['Hundreds of ports probed on Domain-Ctrl-02 in under a minute', 'Kerberos service tickets requested for privileged accounts', 'Source workstation 10.240.12.77 has no scanning role'],
    story: 'Domain-Ctrl-02 suddenly received a burst of connection attempts from a workstation on the 10.240.12.0/24 subnet, hundreds of ports probed in under a minute, followed by requests for Kerberos tickets for privileged service accounts. That combination is how attackers map a network before moving through it. The agent is still working through the evidence.',
    why: 'The pattern looks like reconnaissance, but the agent has not yet ruled out an approved scan.',
    shift: 'Will settle once the agent checks for an approved scan and whether any connection succeeded.',
    gaps: ['Has not yet checked the vulnerability-scanner schedule.'],
    Q: [
      { q: 'Is the scan real?', ans: 'Yes', tone: 'support', w: 1, need: 1, text: '612 connection attempts to 140 ports on Domain-Ctrl-02 in 48 seconds from 10.240.12.77.',
        ev: [{ kind: 'query', label: 'XQL · Port sweep', detail: '612 SYN attempts · 140 ports · 48s', query: 'dataset = network_story | filter dst_host = "Domain-Ctrl-02" and src_ip = "10.240.12.77" | comp count_distinct(dst_port)' }] },
      { q: 'Were tickets requested for privileged accounts?', ans: 'Yes', tone: 'support', w: 1.4, need: 2, text: 'TGS requests for svc_sql and svc_backup, both domain-admin equivalents, right after the sweep.',
        ev: [{ kind: 'query', label: 'XQL · Kerberos requests', detail: '14 TGS requests, RC4 downgrade', query: 'dataset = xdr_data | filter event_type = "KERBEROS_TGS" and actor_host = "10.240.12.77" | comp count() by spn' }] },
      { q: 'Is the source a known, approved scanner?', ans: 'No', tone: 'support', w: 1.2, need: 3, text: '10.240.12.77 is a finance workstation with no scanning role.',
        ev: [{ kind: 'asset', label: '10.240.12.77', detail: 'FIN-WS-31 · finance workstation' }] },
      { q: 'Did any connection succeed?', ans: 'Checking', tone: 'neutral', w: .6, need: 4, text: 'Two SMB sessions were established; the agent is inspecting what they did.',
        ev: [{ kind: 'query', label: 'XQL · SMB sessions', detail: '2 sessions established', query: 'dataset = network_story | filter dst_port = 445 and src_ip = "10.240.12.77"' }] },
      { q: 'Is there an approved penetration test?', ans: 'No', tone: 'support', w: 1, need: 5, text: 'No test is scheduled against Domain-Ctrl-02 this quarter.',
        ev: [{ kind: 'change', label: 'Change management', detail: '0 matching engagements' }] }
    ]
  }
};
const GAPS = {
  Endpoint: ['Did not collect a memory image, not needed at this confidence.', 'Did not interview the device owner.'],
  Identity: ['Did not check the user’s personal devices, out of scope.', 'Did not confirm travel plans with HR.'],
  Network: ['Did not decrypt the payload, TLS inspection is off for this segment.', 'Did not check the web proxy, not connected.'],
  Cloud: ['Did not review CloudTrail data events older than 7 days.', 'Did not contact the key owner.'],
  Posture: ['Did not run an active exploit test against the service.', 'Did not verify the patch schedule with the owner.']
};