import tls from 'node:tls';
import http from 'node:http';
import { ScanFinding, SslInfo } from './types.js';

export class SslScanner {
  public async scan(domain: string, normalizedUrl: string): Promise<{ sslInfo: SslInfo; findings: ScanFinding[]; score: number }> {
    const findings: ScanFinding[] = [];
    let score = 100;

    const sslInfo: SslInfo = {
      enabled: false,
      valid: false,
    };

    // 1. Inspect TLS Certificate
    try {
      const certResult = await this.getCertificate(domain);
      sslInfo.enabled = true;
      sslInfo.protocol = certResult.protocol;
      sslInfo.cipher = certResult.cipher ? `${certResult.cipher.name} (${certResult.cipher.version})` : undefined;

      const cert = certResult.cert;
      if (cert) {
        sslInfo.validFrom = cert.valid_from;
        sslInfo.validTo = cert.valid_to;
        const cn = cert.subject?.CN;
        sslInfo.subject = Array.isArray(cn) ? cn.join(', ') : (cn || '');
        const issuerO = cert.issuer?.O;
        const issuerCn = cert.issuer?.CN;
        sslInfo.issuer = Array.isArray(issuerO) ? issuerO.join(', ') : (issuerO || (Array.isArray(issuerCn) ? issuerCn.join(', ') : issuerCn) || 'Unknown CA');

        // Parse SANs
        const sans: string[] = [];
        if (cert.subjectaltname) {
          const parts = cert.subjectaltname.split(',').map((s: string) => s.trim());
          for (const p of parts) {
            if (p.startsWith('DNS:')) {
              sans.push(p.replace('DNS:', ''));
            }
          }
        }
        sslInfo.subjectAltNames = sans;

        const expiryDate = new Date(cert.valid_to);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        sslInfo.daysRemaining = daysRemaining;

        if (daysRemaining < 0) {
          sslInfo.valid = false;
          score -= 50;
          findings.push({
            id: 'ssl-expired',
            category: 'ssl',
            check_key: 'ssl_certificate_expired',
            severity: 'critical',
            title: 'SSL/TLS Certificate is Expired',
            description: `The SSL certificate expired on ${cert.valid_to} (${Math.abs(daysRemaining)} days ago). Browsers will display security warnings to visitors.`,
            impact: 'Users cannot securely access the website and will see warning screens indicating unsafe connection.',
            recommendation: 'Renew the SSL certificate immediately through your certificate authority or web host.',
            technical_details: `Issuer: ${sslInfo.issuer}, Expiry: ${cert.valid_to}, Subject: ${sslInfo.subject}`
          });
        } else if (daysRemaining < 15) {
          sslInfo.valid = true;
          score -= 15;
          findings.push({
            id: 'ssl-expiring-soon',
            category: 'ssl',
            check_key: 'ssl_certificate_expiring_soon',
            severity: 'high',
            title: `SSL/TLS Certificate Expires in ${daysRemaining} Days`,
            description: `The certificate is valid but expires in less than 15 days (${cert.valid_to}).`,
            impact: 'Failure to renew before expiry will result in outage and browser warnings.',
            recommendation: 'Ensure auto-renewal is operational or manually issue a renewed certificate.',
            technical_details: `Expires: ${cert.valid_to}`
          });
        } else if (daysRemaining < 30) {
          sslInfo.valid = true;
          score -= 5;
          findings.push({
            id: 'ssl-expiring-month',
            category: 'ssl',
            check_key: 'ssl_certificate_expiring_month',
            severity: 'medium',
            title: `SSL/TLS Certificate Expires Within 30 Days (${daysRemaining} Days Remaining)`,
            description: `The certificate will expire on ${cert.valid_to}.`,
            impact: 'Requires renewal within the coming weeks.',
            recommendation: 'Verify that ACME or your certificate provider is set to renew automatically.',
            technical_details: `Expires: ${cert.valid_to}`
          });
        } else {
          sslInfo.valid = true;
          findings.push({
            id: 'ssl-valid',
            category: 'ssl',
            check_key: 'ssl_certificate_valid',
            severity: 'passed',
            title: 'SSL/TLS Certificate is Valid and Active',
            description: `Issued by ${sslInfo.issuer}. Valid for ${daysRemaining} more days (expires ${cert.valid_to}).`,
            impact: 'Traffic is encrypted in transit between users and the server.',
            recommendation: 'Keep automated certificate renewal configured.',
            technical_details: `Common Name: ${sslInfo.subject}, Protocol: ${sslInfo.protocol}`
          });
        }

        // Protocol check (TLSv1.3 or TLSv1.2)
        if (certResult.protocol === 'TLSv1.3') {
          findings.push({
            id: 'ssl-tlsv13',
            category: 'ssl',
            check_key: 'ssl_tls_v13_supported',
            severity: 'passed',
            title: 'Modern TLS 1.3 Protocol Negotiated',
            description: 'The server supports the latest TLS 1.3 cryptographic protocol with enhanced security and reduced round-trip times.',
            impact: 'Optimal encryption speed and modern security ciphers.',
            recommendation: 'Maintain TLS 1.3 as standard.',
            technical_details: `Negotiated Cipher: ${certResult.cipher?.name || 'N/A'}`
          });
        } else if (certResult.protocol === 'TLSv1.2') {
          findings.push({
            id: 'ssl-tlsv12',
            category: 'ssl',
            check_key: 'ssl_tls_v12_supported',
            severity: 'info',
            title: 'TLS 1.2 Protocol Supported',
            description: 'Connection negotiated with TLS 1.2. Consider enabling TLS 1.3 for enhanced security and 0-RTT speed.',
            impact: 'TLS 1.2 is secure, though TLS 1.3 offers better performance and modern cipher suites.',
            recommendation: 'Enable TLS 1.3 on your web server or CDN (Cloudflare, Nginx, Apache).',
            technical_details: `Negotiated Cipher: ${certResult.cipher?.name || 'N/A'}`
          });
        }
      }
    } catch (err: any) {
      sslInfo.enabled = false;
      sslInfo.valid = false;
      sslInfo.error = err.message || 'Failed to connect via HTTPS/TLS';
      score = 0;
      findings.push({
        id: 'ssl-connection-failed',
        category: 'ssl',
        check_key: 'ssl_connection_failed',
        severity: 'critical',
        title: 'HTTPS / SSL Connection Failed',
        description: `Unable to establish a secure TLS connection: ${err.message}`,
        impact: 'Website does not support secure HTTPS or has invalid SSL configurations.',
        recommendation: 'Install a trusted SSL/TLS certificate (e.g., via Let\'s Encrypt or your web host) and bind it to port 443.',
        technical_details: `Error: ${err.message}`
      });
    }

    // 2. Check HTTP to HTTPS redirection
    try {
      const redirectResult = await this.checkHttpRedirect(domain);
      if (redirectResult.redirectsToHttps) {
        findings.push({
          id: 'ssl-http-redirect-passed',
          category: 'ssl',
          check_key: 'ssl_http_to_https_redirect',
          severity: 'passed',
          title: 'Automatic HTTP to HTTPS Redirection Active',
          description: `Insecure HTTP requests to http://${domain} automatically redirect with status ${redirectResult.statusCode} to HTTPS.`,
          impact: 'Ensures all visitors are upgraded to an encrypted connection.',
          recommendation: 'Keep HTTP to HTTPS 301 permanent redirection enabled.',
          technical_details: `Redirect target: ${redirectResult.location}`
        });
      } else {
        score -= 20;
        findings.push({
          id: 'ssl-no-http-redirect',
          category: 'ssl',
          check_key: 'ssl_no_http_redirect',
          severity: 'high',
          title: 'HTTP Does Not Redirect to HTTPS',
          description: `Accessing http://${domain} returned status ${redirectResult.statusCode} without redirecting to a secure HTTPS URL.`,
          impact: 'Users who type the domain without "https://" may browse over unencrypted HTTP, vulnerable to eavesdropping and MITM attacks.',
          recommendation: 'Configure your web server or CDN to automatically return a 301 Moved Permanently redirect to HTTPS.',
          technical_details: `HTTP status was ${redirectResult.statusCode}`
        });
      }
    } catch (redirectErr: any) {
      // If port 80 is closed, not necessarily fatal if HTTPS is strictly enforced
    }

    return {
      sslInfo,
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }

  private getCertificate(domain: string): Promise<{ cert: tls.PeerCertificate; protocol: string; cipher: tls.CipherNameAndProtocol }> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect(
        {
          host: domain,
          port: 443,
          servername: domain,
          rejectUnauthorized: false, // Allows us to inspect invalid/expired certificates instead of immediately crashing
          timeout: 7000
        },
        () => {
          const cert = socket.getPeerCertificate(true);
          const protocol = socket.getProtocol() || '';
          const cipher = socket.getCipher();
          socket.end();
          resolve({ cert, protocol, cipher });
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timed out while negotiating TLS handshake.'));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  }

  private checkHttpRedirect(domain: string): Promise<{ redirectsToHttps: boolean; statusCode: number; location?: string }> {
    return new Promise((resolve) => {
      const req = http.request(
        {
          host: domain,
          port: 80,
          path: '/',
          method: 'GET',
          headers: {
            'User-Agent': 'WebsiteHealthScanner/1.0 (+https://scanner.internal)',
            'Accept': '*/*'
          },
          timeout: 5000
        },
        (res) => {
          const status = res.statusCode || 0;
          const location = res.headers.location || '';
          const redirectsToHttps = (status === 301 || status === 302 || status === 307 || status === 308) && location.startsWith('https://');
          res.destroy();
          resolve({ redirectsToHttps, statusCode: status, location });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ redirectsToHttps: false, statusCode: 0 });
      });

      req.on('error', () => {
        resolve({ redirectsToHttps: false, statusCode: 0 });
      });

      req.end();
    });
  }
}
