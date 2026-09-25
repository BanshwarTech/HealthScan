import { RobotsInfo, ScanFinding } from './types.js';

export class RobotsScanner {
  public async scan(baseUrl: string): Promise<{ robotsInfo: RobotsInfo; findings: ScanFinding[]; score: number }> {
    const findings: ScanFinding[] = [];
    let score = 100;

    const url = new URL('/robots.txt', baseUrl).toString();
    const robotsInfo: RobotsInfo = {
      exists: false,
      statusCode: 0,
      sitemaps: [],
      disallowRulesCount: 0,
    };

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'WebsiteHealthScanner/1.0 (+https://scanner.internal)',
          'Accept': 'text/plain,*/*'
        },
        signal: AbortSignal.timeout(6000)
      });

      robotsInfo.statusCode = res.status;

      if (res.ok) {
        const text = await res.text();
        // Check if actually text/plain or looks like robots.txt
        const isRobotsText = text.toLowerCase().includes('user-agent:') || text.toLowerCase().includes('disallow:');
        
        if (isRobotsText) {
          robotsInfo.exists = true;
          robotsInfo.rawSample = text.substring(0, 500);

          // Extract sitemaps and disallows
          const lines = text.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith('sitemap:')) {
              const sm = trimmed.substring(8).trim();
              if (sm) robotsInfo.sitemaps.push(sm);
            } else if (trimmed.toLowerCase().startsWith('disallow:')) {
              robotsInfo.disallowRulesCount++;
            }
          }

          findings.push({
            id: 'robots-file-found',
            category: 'seo',
            check_key: 'robots_txt_found',
            severity: 'passed',
            title: 'robots.txt File is Accessible',
            description: `Found valid robots.txt with ${robotsInfo.disallowRulesCount} disallow rule(s) and ${robotsInfo.sitemaps.length} referenced sitemap(s).`,
            impact: 'Guides search engine crawlers on what pages to index or exclude.',
            recommendation: 'Periodically review disallow paths so important landing pages are not accidentally blocked.',
            technical_details: `Status: ${res.status}, Sitemaps declared: ${robotsInfo.sitemaps.join(', ') || 'None'}`
          });

          if (robotsInfo.sitemaps.length > 0) {
            findings.push({
              id: 'robots-sitemap-declared',
              category: 'seo',
              check_key: 'robots_txt_sitemap_declared',
              severity: 'passed',
              title: 'Sitemap Declared in robots.txt',
              description: `Robots file points crawlers to: ${robotsInfo.sitemaps[0]}`,
              impact: 'Accelerates search engine indexing of new and updated content.',
              recommendation: 'Ensure referenced sitemap matches live canonical XML URL.',
              technical_details: robotsInfo.sitemaps.join('\n')
            });
          } else {
            score -= 5;
            findings.push({
              id: 'robots-no-sitemap-ref',
              category: 'seo',
              check_key: 'robots_txt_no_sitemap',
              severity: 'low',
              title: 'No Sitemap Referenced in robots.txt',
              description: 'The robots.txt file exists but does not specify a `Sitemap: https://yourdomain.com/sitemap.xml` directive.',
              impact: 'Crawlers must discover sitemaps manually or via Webmaster consoles.',
              recommendation: 'Add a line at the bottom of robots.txt: `Sitemap: https://yourdomain.com/sitemap.xml`.',
              technical_details: 'No "Sitemap:" line found in file.'
            });
          }
        } else {
          // Returned 200 with HTML (e.g. 404 soft fallback)
          score -= 10;
          findings.push({
            id: 'robots-soft-404',
            category: 'seo',
            check_key: 'robots_txt_soft_404',
            severity: 'medium',
            title: 'robots.txt Returns HTML instead of Text',
            description: 'URL /robots.txt returned HTTP 200 but content appears to be an HTML webpage rather than a standard robots.txt file.',
            impact: 'Search engines may reject invalid formats or fail to process crawling boundaries.',
            recommendation: 'Return standard plain text `text/plain` for /robots.txt.',
            technical_details: `Content preview: ${text.substring(0, 100)}...`
          });
        }
      } else {
        score -= 10;
        findings.push({
          id: 'robots-not-found',
          category: 'seo',
          check_key: 'robots_txt_not_found',
          severity: 'low',
          title: `robots.txt Not Found (HTTP ${res.status})`,
          description: 'No robots.txt file is published at /robots.txt.',
          impact: 'While crawlers will assume everything is allowable, providing a robots.txt is standard for directing bots and declaring sitemaps.',
          recommendation: 'Create a `/robots.txt` file at the root of your web server.',
          technical_details: `HTTP Status: ${res.status}`
        });
      }
    } catch (err: any) {
      score -= 5;
      findings.push({
        id: 'robots-fetch-error',
        category: 'seo',
        check_key: 'robots_txt_fetch_error',
        severity: 'low',
        title: 'Unable to Retrieve robots.txt',
        description: `Request to /robots.txt failed: ${err.message}`,
        impact: 'Bot crawling behavior cannot be verified.',
        recommendation: 'Verify server routing for /robots.txt.',
        technical_details: err.message
      });
    }

    return {
      robotsInfo,
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
