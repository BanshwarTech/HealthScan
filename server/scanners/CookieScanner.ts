import { CookieInfo, ScanFinding } from './types.js';

export class CookieScanner {
  public scan(rawSetCookie: string[] | string | undefined): {
    cookieData: {
      count: number;
      insecureCount: number;
      items: CookieInfo[];
    };
    findings: ScanFinding[];
    score: number;
  } {
    const findings: ScanFinding[] = [];
    let score = 100;

    let cookieHeaders: string[] = [];
    if (Array.isArray(rawSetCookie)) {
      cookieHeaders = rawSetCookie;
    } else if (typeof rawSetCookie === 'string' && rawSetCookie.length > 0) {
      cookieHeaders = [rawSetCookie];
    }

    const items: CookieInfo[] = [];
    let insecureCount = 0;

    for (const raw of cookieHeaders) {
      const parts = raw.split(';').map(p => p.trim());
      if (parts.length === 0) continue;

      // Extract cookie name without storing its secret value
      const firstPart = parts[0];
      const equalIdx = firstPart.indexOf('=');
      const name = equalIdx > -1 ? firstPart.substring(0, equalIdx).trim() : firstPart;

      let secure = false;
      let httpOnly = false;
      let sameSite: string | undefined = undefined;
      let domain: string | undefined = undefined;
      let path: string | undefined = undefined;

      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].toLowerCase();
        if (attr === 'secure') secure = true;
        else if (attr === 'httponly') httpOnly = true;
        else if (attr.startsWith('samesite=')) {
          sameSite = parts[i].substring(9).trim();
        } else if (attr.startsWith('domain=')) {
          domain = parts[i].substring(7).trim();
        } else if (attr.startsWith('path=')) {
          path = parts[i].substring(5).trim();
        }
      }

      items.push({
        name,
        secure,
        httpOnly,
        sameSite,
        domain,
        path
      });

      // Flags analysis
      const issues: string[] = [];
      if (!secure) {
        issues.push('missing Secure flag');
      }
      if (!httpOnly) {
        issues.push('missing HttpOnly flag');
      }
      if (!sameSite) {
        issues.push('missing SameSite attribute');
      }

      if (issues.length > 0) {
        insecureCount++;
        score -= 8;
        findings.push({
          id: `cookie-${name}-insecure`,
          category: 'cookies',
          check_key: 'cookie_insecure_flags',
          severity: !secure ? 'high' : 'medium',
          title: `Cookie "${name}" Has Insecure Flags (${issues.join(', ')})`,
          description: `The cookie "${name}" was set without essential protection attributes.`,
          impact: !secure 
            ? 'Cookie can be transmitted over plain HTTP in cleartext, vulnerable to network interception.'
            : 'Without HttpOnly, JavaScript can read this cookie, increasing risk of session hijacking via XSS.',
          recommendation: `Configure this cookie with: Secure; HttpOnly; SameSite=Lax (or Strict).`,
          technical_details: `Cookie: "${name}", Secure: ${secure}, HttpOnly: ${httpOnly}, SameSite: ${sameSite || 'None'}`
        });
      }
    }

    if (items.length > 0 && insecureCount === 0) {
      findings.push({
        id: 'cookies-all-secure',
        category: 'cookies',
        check_key: 'cookies_all_secure',
        severity: 'passed',
        title: `All Cookies Properly Hardened (${items.length} detected)`,
        description: `Inspected ${items.length} cookies. All cookies use Secure, HttpOnly, and SameSite attributes.`,
        impact: 'Protects session identifiers and credentials against XSS and MITM exfiltration.',
        recommendation: 'Maintain strict cookie flags across all backend sessions.',
        technical_details: items.map(c => `${c.name} (Secure: true, HttpOnly: true)`).join(', ')
      });
    } else if (items.length === 0) {
      findings.push({
        id: 'cookies-none-set',
        category: 'cookies',
        check_key: 'cookies_none_found',
        severity: 'info',
        title: 'No Cookies Set on Initial Response',
        description: 'The root URL response does not issue any Set-Cookie headers (stateless landing page).',
        impact: 'Stateless initial load improves performance and privacy.',
        recommendation: 'Ensure any future cookies set during authentication apply Secure and HttpOnly flags.',
        technical_details: '0 Set-Cookie headers received.'
      });
    }

    return {
      cookieData: {
        count: items.length,
        insecureCount,
        items
      },
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
