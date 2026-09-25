import crypto from 'node:crypto';
import { validateAndResolveUrl } from '../security/ssrf.js';
import { SslScanner } from './SslScanner.js';
import { HeaderScanner } from './HeaderScanner.js';
import { DnsScanner } from './DnsScanner.js';
import { SeoScanner } from './SeoScanner.js';
import { RobotsScanner } from './RobotsScanner.js';
import { SitemapScanner } from './SitemapScanner.js';
import { LinkScanner } from './LinkScanner.js';
import { PerformanceScanner } from './PerformanceScanner.js';
import { CookieScanner } from './CookieScanner.js';
import { TechnologyScanner } from './TechnologyScanner.js';
import { ScoreCalculator } from './ScoreCalculator.js';
import { AiAdvisor } from './AiAdvisor.js';
import { getSolutionForFinding } from './solutions.js';
import { ScanReport, ScanFinding } from './types.js';

export type ProgressCallback = (step: string, percent: number) => void;

export class WebsiteScanner {
  private sslScanner = new SslScanner();
  private headerScanner = new HeaderScanner();
  private dnsScanner = new DnsScanner();
  private seoScanner = new SeoScanner();
  private robotsScanner = new RobotsScanner();
  private sitemapScanner = new SitemapScanner();
  private linkScanner = new LinkScanner();
  private perfScanner = new PerformanceScanner();
  private cookieScanner = new CookieScanner();
  private techScanner = new TechnologyScanner();

  public async runScan(
    targetUrl: string, 
    projectId?: string, 
    onProgress?: ProgressCallback
  ): Promise<ScanReport> {
    const scanId = crypto.randomUUID();
    const publicToken = crypto.randomBytes(16).toString('hex');
    const startTime = Date.now();

    onProgress?.('Initializing scan & security validation', 5);

    // 1. SSRF Validation & DNS pre-resolution
    const val = await validateAndResolveUrl(targetUrl);
    if (!val.valid || !val.normalizedUrl || !val.domain) {
      throw new Error(val.error || 'Failed URL validation');
    }

    const { normalizedUrl, domain, resolvedIp } = val;

    onProgress?.('Checking website availability & fetching headers', 15);

    // 2. Fetch main URL and measure network timings
    const t0 = performance.now();
    let res: Response;
    let ttfb = 0;
    let totalTime = 0;
    let html = '';
    let responseHeaders: Record<string, string> = {};
    let setCookieHeader: string[] | string | undefined;

    try {
      const fetchStart = performance.now();
      res = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 WebsiteHealthScanner/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000)
      });

      ttfb = Math.round(performance.now() - fetchStart);

      // Collect headers
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get Set-Cookie
      const rawGet = res.headers.get('set-cookie');
      if (rawGet) {
        setCookieHeader = rawGet;
      }

      html = await res.text();
      totalTime = Math.round(performance.now() - t0);
    } catch (fetchErr: any) {
      throw new Error(`Failed to connect to ${domain}: ${fetchErr.message || 'Connection refused or timeout'}`);
    }

    const allFindings: ScanFinding[] = [];
    const rawScores = {
      ssl: 100,
      headers: 100,
      dns: 100,
      seo: 100,
      performance: 100,
      cookies: 100,
      availability: res.ok ? 100 : 50,
      sitemap: 100,
      robots: 100
    };

    // Availability finding
    if (res.ok) {
      allFindings.push({
        id: 'avail-status-ok',
        category: 'availability',
        check_key: 'http_status_ok',
        severity: 'passed',
        title: `Website is Online & Responding (HTTP ${res.status})`,
        description: `Primary URL returned HTTP ${res.status} ${res.statusText} in ${totalTime}ms.`,
        impact: 'Website is fully accessible to incoming traffic and crawlers.',
        recommendation: 'Maintain continuous uptime monitoring.',
        technical_details: `Status: ${res.status}, URL: ${normalizedUrl}`
      });
    } else {
      allFindings.push({
        id: 'avail-status-error',
        category: 'availability',
        check_key: 'http_status_error',
        severity: 'high',
        title: `Website Returned Error Status HTTP ${res.status}`,
        description: `Server responded with status code ${res.status}.`,
        impact: 'Visitors may experience service disruption.',
        recommendation: 'Inspect web server error logs to resolve the failure code.',
        technical_details: `Status: ${res.status} ${res.statusText}`
      });
    }

    // 3. SSL Scanner
    onProgress?.('Checking SSL/TLS certificate & encryption', 30);
    let sslResult = {
      sslInfo: { enabled: false, valid: false },
      findings: [] as ScanFinding[],
      score: 100
    };
    try {
      sslResult = await this.sslScanner.scan(domain, normalizedUrl);
      allFindings.push(...sslResult.findings);
      rawScores.ssl = sslResult.score;
    } catch (e: any) {
      rawScores.ssl = 30;
    }

    // 4. Headers Scanner
    onProgress?.('Evaluating HTTP security headers', 45);
    const headerResult = this.headerScanner.scan(responseHeaders);
    allFindings.push(...headerResult.findings);
    rawScores.headers = headerResult.score;

    // 5. DNS Scanner
    onProgress?.('Querying DNS records & email protections (SPF/DMARC/CAA)', 60);
    let dnsResult = {
      dnsInfo: {},
      findings: [] as ScanFinding[],
      score: 100
    };
    try {
      dnsResult = await this.dnsScanner.scan(domain);
      allFindings.push(...dnsResult.findings);
      rawScores.dns = dnsResult.score;
    } catch (e) {
      rawScores.dns = 50;
    }

    // 6. SEO Scanner
    onProgress?.('Analyzing on-page SEO & mobile responsiveness', 70);
    const seoResult = this.seoScanner.scan(html, normalizedUrl);
    allFindings.push(...seoResult.findings);
    rawScores.seo = seoResult.score;

    // 7. Robots.txt Scanner
    onProgress?.('Inspecting robots.txt directives', 78);
    let robotsResult: {
      robotsInfo: { exists: boolean; statusCode: number; sitemaps: string[]; disallowRulesCount: number };
      findings: ScanFinding[];
      score: number;
    } = {
      robotsInfo: { exists: false, statusCode: 0, sitemaps: [], disallowRulesCount: 0 },
      findings: [] as ScanFinding[],
      score: 100
    };
    try {
      robotsResult = await this.robotsScanner.scan(normalizedUrl);
      allFindings.push(...robotsResult.findings);
      rawScores.robots = robotsResult.score;
    } catch (e) {
      rawScores.robots = 70;
    }

    // 8. Sitemap Scanner
    onProgress?.('Verifying XML sitemap structure', 84);
    let sitemapResult: {
      sitemapInfo: { exists: boolean; statusCode: number; isIndex: boolean; sampleUrls?: string[] };
      findings: ScanFinding[];
      score: number;
    } = {
      sitemapInfo: { exists: false, statusCode: 0, isIndex: false, sampleUrls: [] },
      findings: [] as ScanFinding[],
      score: 100
    };
    try {
      sitemapResult = await this.sitemapScanner.scan(normalizedUrl, robotsResult.robotsInfo.sitemaps);
      allFindings.push(...sitemapResult.findings);
      rawScores.sitemap = sitemapResult.score;
    } catch (e) {
      rawScores.sitemap = 70;
    }

    // 9. Links & Performance & Cookies & Tech
    onProgress?.('Auditing links, cookies, performance & technologies', 90);
    
    // Links (non-blocking if some fail)
    let linksResult = {
      linksInfo: { crawledCount: 0, internalCount: 0, externalCount: 0, brokenCount: 0, items: [] as any[] },
      findings: [] as ScanFinding[],
      score: 100
    };
    try {
      linksResult = await this.linkScanner.scan(html, normalizedUrl, 15);
      allFindings.push(...linksResult.findings);
    } catch (e) {
      // ignore non-fatal crawler error
    }

    // Performance
    const perfResult = this.perfScanner.scan(
      {
        dnsLookupMs: 25,
        tcpConnectMs: 35,
        tlsHandshakeMs: 45,
        ttfbMs: ttfb,
        totalTimeMs: totalTime
      },
      Buffer.byteLength(html, 'utf8'),
      responseHeaders
    );
    allFindings.push(...perfResult.findings);
    rawScores.performance = perfResult.score;

    // Cookies
    const cookieResult = this.cookieScanner.scan(setCookieHeader);
    allFindings.push(...cookieResult.findings);
    rawScores.cookies = cookieResult.score;

    // Technologies
    const techResult = this.techScanner.scan(responseHeaders, html);
    allFindings.push(...techResult.findings);

    // Attach comprehensive solution guides with code snippets to findings
    for (const f of allFindings) {
      if (!f.solution_guide && f.severity !== 'passed') {
        const sol = getSolutionForFinding(f.check_key, domain);
        if (sol) {
          f.solution_guide = sol;
        }
      }
    }

    // 10. Calculate final scores
    onProgress?.('Calculating health scores & generating recommendations', 96);
    const scores = ScoreCalculator.calculate(rawScores, allFindings);

    // AI / Executive synthesis
    const aiSummary = await AiAdvisor.generateSummary(domain, scores, allFindings);

    // Count severities
    const metrics = {
      totalFindings: allFindings.length,
      criticalCount: allFindings.filter(f => f.severity === 'critical').length,
      highCount: allFindings.filter(f => f.severity === 'high').length,
      mediumCount: allFindings.filter(f => f.severity === 'medium').length,
      lowCount: allFindings.filter(f => f.severity === 'low').length,
      infoCount: allFindings.filter(f => f.severity === 'info').length,
      passedCount: allFindings.filter(f => f.severity === 'passed').length
    };

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    onProgress?.('Scan completed successfully!', 100);

    const report: ScanReport = {
      id: scanId,
      projectId,
      url: targetUrl,
      normalizedUrl,
      domain,
      ipAddress: resolvedIp,
      status: 'completed',
      progressStep: 'Completed',
      progressPercent: 100,
      startedAt: new Date(startTime).toISOString(),
      completedAt,
      durationMs,
      publicToken,
      publicEnabled: true,
      scores,
      metrics,
      findings: allFindings,
      categories: {
        ssl: sslResult.sslInfo,
        headers: headerResult.headerInfo,
        dns: dnsResult.dnsInfo,
        seo: seoResult.seoInfo,
        robots: robotsResult.robotsInfo,
        sitemap: sitemapResult.sitemapInfo,
        links: linksResult.linksInfo,
        performance: perfResult.performanceInfo,
        cookies: cookieResult.cookieData,
        technologies: techResult.technologies
      },
      aiSummary
    };

    return report;
  }
}
