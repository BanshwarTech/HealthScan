import * as cheerio from 'cheerio';
import { isRestrictedIP } from '../security/ssrf.js';
import dns from 'node:dns/promises';
import { ScanFinding, ScannedLink } from './types.js';

export class LinkScanner {
  public async scan(html: string, baseUrl: string, maxLinks: number = 20): Promise<{
    linksInfo: {
      crawledCount: number;
      internalCount: number;
      externalCount: number;
      brokenCount: number;
      items: ScannedLink[];
    };
    findings: ScanFinding[];
    score: number;
  }> {
    const findings: ScanFinding[] = [];
    let score = 100;

    const $ = cheerio.load(html);
    const base = new URL(baseUrl);

    const candidates: { url: string; isInternal: boolean; anchorText: string }[] = [];
    const seen = new Set<string>();

    $('a[href]').each((_, el) => {
      const rawHref = $(el).attr('href')?.trim();
      const anchorText = $(el).text().trim().replace(/\s+/g, ' ').substring(0, 50);

      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      try {
        const resolved = new URL(rawHref, baseUrl);
        if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
          return;
        }

        const normalized = resolved.origin + resolved.pathname;
        if (!seen.has(normalized)) {
          seen.add(normalized);
          const isInternal = resolved.hostname === base.hostname || resolved.hostname.endsWith(`.${base.hostname}`);
          candidates.push({
            url: resolved.toString(),
            isInternal,
            anchorText
          });
        }
      } catch {
        // Invalid URL attribute
      }
    });

    const toCheck = candidates.slice(0, maxLinks);
    const scannedItems: ScannedLink[] = [];
    const brokenItems: ScannedLink[] = [];

    let internalCount = 0;
    let externalCount = 0;

    // Check links concurrently with limit
    await Promise.all(
      toCheck.map(async (item) => {
        if (item.isInternal) internalCount++;
        else externalCount++;

        const result = await this.checkSingleUrl(item.url, item.isInternal, item.anchorText);
        scannedItems.push(result);
        if (result.statusCode >= 400 || result.statusCode === 0) {
          brokenItems.push(result);
        }
      })
    );

    if (brokenItems.length > 0) {
      score -= Math.min(30, brokenItems.length * 10);
      findings.push({
        id: 'links-broken-found',
        category: 'seo',
        check_key: 'links_broken_detected',
        severity: brokenItems.length > 2 ? 'high' : 'medium',
        title: `Detected ${brokenItems.length} Broken Link(s) (4xx/5xx)`,
        description: `Found ${brokenItems.length} link(s) on the page that return error status codes.`,
        impact: 'Broken links disrupt user experience, cause visitor drop-offs, and signal neglected site health to search engine spiders.',
        recommendation: 'Update or remove the broken links identified below.',
        technical_details: brokenItems.map(b => `${b.statusCode || 'ERR'}: ${b.url} (Anchor: "${b.anchorText || 'N/A'}")`).join('\n')
      });
    } else if (scannedItems.length > 0) {
      findings.push({
        id: 'links-all-healthy',
        category: 'seo',
        check_key: 'links_all_healthy',
        severity: 'passed',
        title: `All Audited Links are Healthy (${scannedItems.length} checked)`,
        description: `Tested ${scannedItems.length} links (${internalCount} internal, ${externalCount} external). All returned healthy responses.`,
        impact: 'Flawless navigation for visitors and positive crawl signals.',
        recommendation: 'Maintain periodic link health monitoring.',
        technical_details: `Sampled ${scannedItems.length} unique hyperlinks.`
      });
    }

    return {
      linksInfo: {
        crawledCount: scannedItems.length,
        internalCount,
        externalCount,
        brokenCount: brokenItems.length,
        items: scannedItems
      },
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }

  private async checkSingleUrl(targetUrl: string, isInternal: boolean, anchorText: string): Promise<ScannedLink> {
    try {
      const parsed = new URL(targetUrl);
      
      // SSRF check before requesting
      try {
        const addrs = await dns.lookup(parsed.hostname, { all: true });
        for (const a of addrs) {
          if (isRestrictedIP(a.address)) {
            return {
              url: targetUrl,
              statusCode: 403,
              statusText: 'Blocked SSRF target',
              isInternal,
              anchorText
            };
          }
        }
      } catch {
        return {
          url: targetUrl,
          statusCode: 0,
          statusText: 'DNS lookup failed',
          isInternal,
          anchorText
        };
      }

      // First try HEAD for speed
      let res = await fetch(targetUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'WebsiteHealthScanner/1.0 (+https://scanner.internal)'
        },
        signal: AbortSignal.timeout(4500)
      });

      // Some servers block HEAD; if 405 Method Not Allowed, fallback to GET
      if (res.status === 405) {
        res = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'WebsiteHealthScanner/1.0 (+https://scanner.internal)',
            'Range': 'bytes=0-1024'
          },
          signal: AbortSignal.timeout(4500)
        });
      }

      return {
        url: targetUrl,
        statusCode: res.status,
        statusText: res.statusText,
        isInternal,
        anchorText
      };
    } catch (err: any) {
      return {
        url: targetUrl,
        statusCode: 0,
        statusText: err.message || 'Timeout / Connection failed',
        isInternal,
        anchorText
      };
    }
  }
}
