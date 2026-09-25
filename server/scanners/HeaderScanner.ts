import { ScanFinding, SecurityHeadersInfo } from './types.js';

export class HeaderScanner {
  public scan(headers: Record<string, string>): { headerInfo: SecurityHeadersInfo; findings: ScanFinding[]; score: number } {
    const findings: ScanFinding[] = [];
    let score = 100;

    // Normalize header keys to lowercase
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      normalized[k.toLowerCase()] = v;
    }

    const evaluated: SecurityHeadersInfo['evaluated'] = [];

    // 1. Content-Security-Policy
    const csp = normalized['content-security-policy'];
    if (csp) {
      evaluated.push({
        name: 'Content-Security-Policy',
        value: csp,
        status: 'good',
        recommendation: 'Active. Continue auditing directives to keep restrictions minimal.'
      });
      findings.push({
        id: 'header-csp-present',
        category: 'headers',
        check_key: 'header_content_security_policy',
        severity: 'passed',
        title: 'Content-Security-Policy (CSP) Header Configured',
        description: 'A Content-Security-Policy header is configured to control which scripts and resources are permitted to run in the user browser.',
        impact: 'Greatly reduces the risk of Cross-Site Scripting (XSS) and data injection vulnerabilities.',
        recommendation: 'Review directives periodically to ensure unsafe-inline and wildcard sources are avoided.',
        technical_details: `Value: ${csp.substring(0, 150)}${csp.length > 150 ? '...' : ''}`
      });
    } else {
      score -= 22;
      evaluated.push({
        name: 'Content-Security-Policy',
        value: null,
        status: 'missing',
        recommendation: 'Implement a CSP header restricting allowed script, frame, and style origins.'
      });
      findings.push({
        id: 'header-csp-missing',
        category: 'headers',
        check_key: 'header_content_security_policy_missing',
        severity: 'high',
        title: 'Content-Security-Policy (CSP) is Missing',
        description: 'The HTTP response does not include a Content-Security-Policy header.',
        impact: 'Without CSP, malicious scripts injected via Cross-Site Scripting (XSS) or untrusted third parties can execute without browser restriction.',
        recommendation: 'Define a restrictive CSP appropriate for your application resources (e.g. `default-src \'self\'; script-src \'self\' https://cdn.example.com;`).',
        technical_details: 'Header "Content-Security-Policy" was not found in the HTTP response.'
      });
    }

    // 2. Strict-Transport-Security (HSTS)
    const hsts = normalized['strict-transport-security'];
    if (hsts) {
      evaluated.push({
        name: 'Strict-Transport-Security',
        value: hsts,
        status: 'good',
        recommendation: 'HSTS is enabled. Ensure max-age is at least 31536000 (1 year) and includeSubDomains is set.'
      });
      findings.push({
        id: 'header-hsts-present',
        category: 'headers',
        check_key: 'header_strict_transport_security',
        severity: 'passed',
        title: 'Strict-Transport-Security (HSTS) is Enabled',
        description: 'HSTS instructs compliant browsers to always interact with your domain exclusively over HTTPS.',
        impact: 'Protects visitors from SSL-stripping and man-in-the-middle attacks.',
        recommendation: 'Keep max-age set to at least 31536000 and consider HSTS preloading via hstspreload.org.',
        technical_details: `Value: ${hsts}`
      });
    } else {
      score -= 18;
      evaluated.push({
        name: 'Strict-Transport-Security',
        value: null,
        status: 'missing',
        recommendation: 'Add "Strict-Transport-Security: max-age=31536000; includeSubDomains".'
      });
      findings.push({
        id: 'header-hsts-missing',
        category: 'headers',
        check_key: 'header_strict_transport_security_missing',
        severity: 'high',
        title: 'Strict-Transport-Security (HSTS) is Missing',
        description: 'The website does not enforce HTTPS through the HSTS response header.',
        impact: 'First-time visitors or connections over insecure networks could be intercepted or downgraded to unencrypted HTTP.',
        recommendation: 'Add the header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` in your server or CDN configuration.',
        technical_details: 'Missing "Strict-Transport-Security" header.'
      });
    }

    // 3. X-Content-Type-Options
    const xcto = normalized['x-content-type-options'];
    if (xcto && xcto.toLowerCase().includes('nosniff')) {
      evaluated.push({
        name: 'X-Content-Type-Options',
        value: xcto,
        status: 'good',
        recommendation: 'Correctly configured with "nosniff".'
      });
      findings.push({
        id: 'header-xcto-present',
        category: 'headers',
        check_key: 'header_x_content_type_options',
        severity: 'passed',
        title: 'X-Content-Type-Options is Configured (nosniff)',
        description: 'Prevents MIME-type sniffing by browsers.',
        impact: 'Prevents the browser from interpreting files as a different MIME type than declared.',
        recommendation: 'Maintain `X-Content-Type-Options: nosniff`.',
        technical_details: `Value: ${xcto}`
      });
    } else {
      score -= 12;
      evaluated.push({
        name: 'X-Content-Type-Options',
        value: xcto || null,
        status: 'missing',
        recommendation: 'Set `X-Content-Type-Options: nosniff`.'
      });
      findings.push({
        id: 'header-xcto-missing',
        category: 'headers',
        check_key: 'header_x_content_type_options_missing',
        severity: 'medium',
        title: 'X-Content-Type-Options (nosniff) is Missing',
        description: 'The header is either missing or does not contain "nosniff".',
        impact: 'Browsers may attempt to sniff MIME types, allowing malicious uploads disguised as harmless files (e.g. images) to execute as JavaScript.',
        recommendation: 'Add `X-Content-Type-Options: nosniff` to all HTTP responses.',
        technical_details: `Current: ${xcto || 'Not set'}`
      });
    }

    // 4. X-Frame-Options
    const xfo = normalized['x-frame-options'];
    if (xfo && (xfo.toUpperCase().includes('DENY') || xfo.toUpperCase().includes('SAMEORIGIN'))) {
      evaluated.push({
        name: 'X-Frame-Options',
        value: xfo,
        status: 'good',
        recommendation: 'Configured properly to mitigate clickjacking.'
      });
      findings.push({
        id: 'header-xfo-present',
        category: 'headers',
        check_key: 'header_x_frame_options',
        severity: 'passed',
        title: 'Clickjacking Protection Active (X-Frame-Options)',
        description: `Website framing restricted with value "${xfo}".`,
        impact: 'Prevents UI redressing and clickjacking attacks in unauthorized iframes.',
        recommendation: 'Keep SAMEORIGIN or DENY depending on embed requirements.',
        technical_details: `Value: ${xfo}`
      });
    } else if (csp && csp.includes('frame-ancestors')) {
      evaluated.push({
        name: 'X-Frame-Options',
        value: 'Handled via CSP frame-ancestors',
        status: 'good',
        recommendation: 'CSP frame-ancestors is active (modern alternative to X-Frame-Options).'
      });
    } else {
      score -= 12;
      evaluated.push({
        name: 'X-Frame-Options',
        value: xfo || null,
        status: 'missing',
        recommendation: 'Configure `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors`.'
      });
      findings.push({
        id: 'header-xfo-missing',
        category: 'headers',
        check_key: 'header_x_frame_options_missing',
        severity: 'medium',
        title: 'Clickjacking Protection (X-Frame-Options) is Missing',
        description: 'Neither X-Frame-Options nor CSP frame-ancestors is configured to restrict framing.',
        impact: 'Attackers can render your pages inside an invisible iframe on their malicious website to trick users into unintentional clicks (clickjacking).',
        recommendation: 'Set `X-Frame-Options: SAMEORIGIN` or define `frame-ancestors \'self\';` in your Content-Security-Policy.',
        technical_details: 'Missing X-Frame-Options and frame-ancestors directive.'
      });
    }

    // 5. Referrer-Policy
    const rp = normalized['referrer-policy'];
    if (rp) {
      evaluated.push({
        name: 'Referrer-Policy',
        value: rp,
        status: 'good',
        recommendation: 'Referrer-Policy is defined.'
      });
      findings.push({
        id: 'header-rp-present',
        category: 'headers',
        check_key: 'header_referrer_policy',
        severity: 'passed',
        title: 'Referrer-Policy Header Configured',
        description: `Referrer policy set to "${rp}".`,
        impact: 'Controls how much referrer information is included with requests made from your site.',
        recommendation: 'Ensure standard strict policy such as `strict-origin-when-cross-origin`.',
        technical_details: `Value: ${rp}`
      });
    } else {
      score -= 8;
      evaluated.push({
        name: 'Referrer-Policy',
        value: null,
        status: 'missing',
        recommendation: 'Set `Referrer-Policy: strict-origin-when-cross-origin`.'
      });
      findings.push({
        id: 'header-rp-missing',
        category: 'headers',
        check_key: 'header_referrer_policy_missing',
        severity: 'low',
        title: 'Referrer-Policy Header is Not Configured',
        description: 'No explicit Referrer-Policy header found in response.',
        impact: 'Sensitive path parameters or authentication tokens in URLs might be leaked to external third-party sites via the Referer header.',
        recommendation: 'Add `Referrer-Policy: strict-origin-when-cross-origin` to HTTP headers.',
        technical_details: 'Missing Referrer-Policy.'
      });
    }

    // 6. Permissions-Policy
    const pp = normalized['permissions-policy'] || normalized['feature-policy'];
    if (pp) {
      evaluated.push({
        name: 'Permissions-Policy',
        value: pp,
        status: 'good',
        recommendation: 'Permissions-Policy is present.'
      });
      findings.push({
        id: 'header-pp-present',
        category: 'headers',
        check_key: 'header_permissions_policy',
        severity: 'passed',
        title: 'Permissions-Policy is Defined',
        description: 'Restricts access to browser features such as camera, microphone, geolocation, and payment APIs.',
        impact: 'Reduces attack surface against compromised sub-resources.',
        recommendation: 'Maintain explicit permissions for sensitive browser APIs.',
        technical_details: `Value: ${pp.substring(0, 100)}`
      });
    } else {
      score -= 6;
      evaluated.push({
        name: 'Permissions-Policy',
        value: null,
        status: 'missing',
        recommendation: 'Define `Permissions-Policy` to disable unused browser APIs (camera, microphone, geolocation).'
      });
      findings.push({
        id: 'header-pp-missing',
        category: 'headers',
        check_key: 'header_permissions_policy_missing',
        severity: 'low',
        title: 'Permissions-Policy Header is Missing',
        description: 'Permissions-Policy (formerly Feature-Policy) is not defined.',
        impact: 'Any embedded scripts could attempt to invoke camera, microphone, or geolocation APIs if granted permissions.',
        recommendation: 'Implement `Permissions-Policy: camera=(), microphone=(), geolocation=()` to restrict unused capabilities.',
        technical_details: 'Missing Permissions-Policy.'
      });
    }

    // 7. Cross-Origin-Opener-Policy (COOP)
    const coop = normalized['cross-origin-opener-policy'];
    evaluated.push({
      name: 'Cross-Origin-Opener-Policy',
      value: coop || null,
      status: coop ? 'good' : 'warning',
      recommendation: coop ? 'COOP active' : 'Consider setting `Cross-Origin-Opener-Policy: same-origin` to isolate top-level browsing contexts.'
    });

    // 8. Server info leakage check
    const serverHeader = normalized['server'];
    const xPoweredBy = normalized['x-powered-by'];
    if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
      score -= 5;
      findings.push({
        id: 'header-server-version-leak',
        category: 'headers',
        check_key: 'header_server_version_leaked',
        severity: 'low',
        title: 'Detailed Server Version Disclosed',
        description: `The Server header reveals specific software and version info: "${serverHeader}".`,
        impact: 'Helps malicious actors fingerprint specific vulnerabilities tied to that software version.',
        recommendation: 'Disable detailed server banners (e.g. `ServerTokens Prod` in Apache or `server_tokens off;` in Nginx).',
        technical_details: `Server: ${serverHeader}`
      });
    }
    if (xPoweredBy) {
      score -= 5;
      findings.push({
        id: 'header-x-powered-by-leak',
        category: 'headers',
        check_key: 'header_x_powered_by_leaked',
        severity: 'low',
        title: 'X-Powered-By Header Discloses Technology Stack',
        description: `Server sent "X-Powered-By: ${xPoweredBy}".`,
        impact: 'Assists attackers with framework reconnaissance.',
        recommendation: 'Remove or disable the X-Powered-By header (e.g. `app.disable("x-powered-by")` in Express or `expose_php = Off` in php.ini).',
        technical_details: `X-Powered-By: ${xPoweredBy}`
      });
    }

    return {
      headerInfo: {
        evaluated,
        allHeaders: headers
      },
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
