import dns from 'node:dns/promises';
import { DnsRecordInfo, ScanFinding } from './types.js';

export class DnsScanner {
  public async scan(domain: string): Promise<{ dnsInfo: DnsRecordInfo; findings: ScanFinding[]; score: number }> {
    const findings: ScanFinding[] = [];
    let score = 100;

    const dnsInfo: DnsRecordInfo = {
      a: [],
      aaaa: [],
      mx: [],
      ns: [],
      txt: [],
      cname: [],
      caa: []
    };

    // 1. A Records (IPv4)
    try {
      const aRecords = await dns.resolve4(domain);
      dnsInfo.a = aRecords;
      findings.push({
        id: 'dns-a-found',
        category: 'dns',
        check_key: 'dns_a_record_present',
        severity: 'passed',
        title: 'IPv4 Address (A Records) Configured',
        description: `Resolved ${aRecords.length} IPv4 address(es).`,
        impact: 'Website is accessible across all IPv4 networks.',
        recommendation: 'Ensure redundant IP routing or Anycast CDN is active.',
        technical_details: aRecords.join(', ')
      });
    } catch (e: any) {
      // Could be CNAME
    }

    // 2. AAAA Records (IPv6)
    try {
      const aaaaRecords = await dns.resolve6(domain);
      dnsInfo.aaaa = aaaaRecords;
      if (aaaaRecords.length > 0) {
        findings.push({
          id: 'dns-aaaa-found',
          category: 'dns',
          check_key: 'dns_aaaa_record_present',
          severity: 'passed',
          title: 'IPv6 Address (AAAA Records) Enabled',
          description: `Resolved ${aaaaRecords.length} IPv6 address(es). Dual-stack IPv4/IPv6 supported.`,
          impact: 'Faster routing and modern network compatibility for mobile and IPv6-only users.',
          recommendation: 'Maintain dual-stack DNS configuration.',
          technical_details: aaaaRecords.join(', ')
        });
      }
    } catch {
      // IPv6 is good practice but not fatal
      findings.push({
        id: 'dns-no-ipv6',
        category: 'dns',
        check_key: 'dns_no_ipv6_configured',
        severity: 'info',
        title: 'No IPv6 (AAAA) DNS Records Found',
        description: 'The domain does not have IPv6 records configured.',
        impact: 'Users on IPv6-only networks must rely on transition translation (NAT64/DNS64).',
        recommendation: 'Configure an AAAA record or route through a CDN (like Cloudflare or Fastly) with IPv6 support.',
        technical_details: 'No AAAA record was returned.'
      });
    }

    // 3. NS (Nameservers)
    try {
      const nsRecords = await dns.resolveNs(domain);
      dnsInfo.ns = nsRecords;
      if (nsRecords.length >= 2) {
        findings.push({
          id: 'dns-ns-redundant',
          category: 'dns',
          check_key: 'dns_ns_redundancy',
          severity: 'passed',
          title: `Redundant Authoritative Nameservers (${nsRecords.length} NS Records)`,
          description: `Authoritative nameservers: ${nsRecords.slice(0, 3).join(', ')}${nsRecords.length > 3 ? '...' : ''}.`,
          impact: 'High availability DNS routing prevents domain resolution single points of failure.',
          recommendation: 'Maintain at least 2 distinct authoritative nameservers.',
          technical_details: nsRecords.join('\n')
        });
      } else {
        score -= 10;
        findings.push({
          id: 'dns-ns-low-redundancy',
          category: 'dns',
          check_key: 'dns_ns_low_redundancy',
          severity: 'medium',
          title: 'Insufficient DNS Nameserver Redundancy',
          description: `Only ${nsRecords.length} nameserver found for this domain.`,
          impact: 'If this single nameserver experiences downtime, the entire domain becomes unreachable.',
          recommendation: 'Configure at least two independent authoritative nameservers across different networks.',
          technical_details: nsRecords.join(', ')
        });
      }
    } catch (e: any) {
      // If root vs subdomain
    }

    // 4. MX (Mail Exchange)
    try {
      const mxRecords = await dns.resolveMx(domain);
      dnsInfo.mx = mxRecords.sort((a, b) => a.priority - b.priority);
      if (mxRecords.length > 0) {
        findings.push({
          id: 'dns-mx-present',
          category: 'dns',
          check_key: 'dns_mx_present',
          severity: 'passed',
          title: 'Mail Exchange (MX) Configured',
          description: `Found ${mxRecords.length} mail server(s): ${mxRecords.map(m => `${m.exchange} (pri ${m.priority})`).join(', ')}.`,
          impact: 'Email routing is defined.',
          recommendation: 'Verify SPF, DKIM, and DMARC are configured to protect this mail domain.',
          technical_details: mxRecords.map(m => `${m.priority}: ${m.exchange}`).join(', ')
        });
      }
    } catch {
      // Domain doesn't have MX - not an issue if domain does not send/receive mail
    }

    // 5. TXT Records & SPF (Sender Policy Framework)
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const flattenedTxt = txtRecords.map(t => t.join(''));
      dnsInfo.txt = flattenedTxt;

      const spfRecord = flattenedTxt.find(t => t.toLowerCase().startsWith('v=spf1'));
      if (spfRecord) {
        dnsInfo.spf = { exists: true, record: spfRecord, valid: true };
        findings.push({
          id: 'dns-spf-present',
          category: 'dns',
          check_key: 'dns_spf_record_present',
          severity: 'passed',
          title: 'SPF (Sender Policy Framework) Record Configured',
          description: `Active SPF TXT record: "${spfRecord}"`,
          impact: 'Protects the domain against unauthorized email spoofing.',
          recommendation: 'Ensure all authorized email senders are listed and policy ends with ~all or -all.',
          technical_details: spfRecord
        });
      } else {
        // Only deduct if MX exists
        if (dnsInfo.mx && dnsInfo.mx.length > 0) {
          score -= 10;
          findings.push({
            id: 'dns-spf-missing',
            category: 'dns',
            check_key: 'dns_spf_record_missing',
            severity: 'medium',
            title: 'Missing SPF Record on Mail Domain',
            description: 'Domain has MX records for email, but no SPF (Sender Policy Framework) record was found in TXT records.',
            impact: 'Spammers can forge emails pretending to originate from your domain without failing SPF checks.',
            recommendation: 'Add a TXT record with `v=spf1 include:_yourmailservice.com ~all`.',
            technical_details: 'No TXT record matching "v=spf1" found.'
          });
        }
      }
    } catch {
      // TXT resolve error
    }

    // 6. DMARC Record (_dmarc.<domain>)
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const dmarcTxt = await dns.resolveTxt(dmarcDomain);
      const flattenedDmarc = dmarcTxt.map(t => t.join(''));
      const dmarcRecord = flattenedDmarc.find(t => t.toLowerCase().startsWith('v=dmarc1'));

      if (dmarcRecord) {
        let policy = 'none';
        const match = dmarcRecord.match(/p=([a-zA-Z]+)/i);
        if (match) policy = match[1].toLowerCase();

        dnsInfo.dmarc = { exists: true, record: dmarcRecord, policy };
        findings.push({
          id: 'dns-dmarc-present',
          category: 'dns',
          check_key: 'dns_dmarc_record_present',
          severity: 'passed',
          title: `DMARC Policy Configured (policy: ${policy})`,
          description: `DMARC record found at _dmarc.${domain}: "${dmarcRecord}".`,
          impact: 'Allows receiving mail servers to authenticate email and report spoofing attempts.',
          recommendation: policy === 'none' ? 'Upgrade DMARC policy from "p=none" to "p=quarantine" or "p=reject" after reviewing reports.' : 'Maintain active policy enforcement.',
          technical_details: dmarcRecord
        });
      } else {
        if (dnsInfo.mx && dnsInfo.mx.length > 0) {
          score -= 10;
          findings.push({
            id: 'dns-dmarc-missing',
            category: 'dns',
            check_key: 'dns_dmarc_record_missing',
            severity: 'medium',
            title: 'Missing DMARC Email Security Policy',
            description: `No DMARC record found at _dmarc.${domain}.`,
            impact: 'Leaves domain open to phishing and impersonation by bad actors sending spoofed emails.',
            recommendation: 'Publish a TXT record at `_dmarc.' + domain + '` with `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@' + domain + ';`.',
            technical_details: `Queried _dmarc.${domain}`
          });
        }
      }
    } catch {
      if (dnsInfo.mx && dnsInfo.mx.length > 0) {
        score -= 8;
        findings.push({
          id: 'dns-dmarc-not-found',
          category: 'dns',
          check_key: 'dns_dmarc_not_found',
          severity: 'medium',
          title: 'DMARC Record Not Found',
          description: `No DMARC record found at _dmarc.${domain}.`,
          impact: 'Email authenticity cannot be verified through DMARC.',
          recommendation: 'Set up a DMARC policy to protect your domain identity.',
          technical_details: `Queried _dmarc.${domain}`
        });
      }
    }

    // 7. CAA (Certificate Authority Authorization)
    try {
      const caaRecords = await dns.resolveCaa(domain);
      dnsInfo.caa = caaRecords;
      if (caaRecords.length > 0) {
        findings.push({
          id: 'dns-caa-present',
          category: 'dns',
          check_key: 'dns_caa_record_present',
          severity: 'passed',
          title: 'CAA (Certificate Authority Authorization) Configured',
          description: `Restricts which Certificate Authorities can issue SSL certificates for this domain (${caaRecords.map((c: any) => c.issue || c.issuewild || JSON.stringify(c)).join(', ')}).`,
          impact: 'Prevents rogue or unauthorized CAs from fraudulently minting certificates for your domain.',
          recommendation: 'Keep CAA records updated when changing SSL providers.',
          technical_details: JSON.stringify(caaRecords)
        });
      } else {
        findings.push({
          id: 'dns-caa-missing',
          category: 'dns',
          check_key: 'dns_caa_record_missing',
          severity: 'info',
          title: 'No CAA (Certificate Authority Authorization) Record',
          description: 'A CAA DNS record specifies which CAs are allowed to issue certificates for your domain.',
          impact: 'Any valid Certificate Authority in the world can issue an SSL certificate if validation succeeds.',
          recommendation: 'Add a CAA DNS record restricting issuance to your designated CA (e.g. `0 issue "letsencrypt.org"`).',
          technical_details: 'CAA query returned empty.'
        });
      }
    } catch {
      // Many domains don't have CAA yet
    }

    return {
      dnsInfo,
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
