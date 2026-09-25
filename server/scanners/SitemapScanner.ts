import { ScanFinding, SitemapInfo } from './types.js';

export class SitemapScanner {
  public async scan(baseUrl: string, declaredSitemaps: string[] = []): Promise<{ sitemapInfo: SitemapInfo; findings: ScanFinding[]; score: number }> {
    const findings: ScanFinding[] = [];
    let score = 100;

    const sitemapTarget = declaredSitemaps.length > 0 
      ? declaredSitemaps[0] 
      : new URL('/sitemap.xml', baseUrl).toString();

    const sitemapInfo: SitemapInfo = {
      exists: false,
      statusCode: 0,
      isIndex: false,
      sampleUrls: []
    };

    try {
      const res = await fetch(sitemapTarget, {
        headers: {
          'User-Agent': 'WebsiteHealthScanner/1.0 (+https://scanner.internal)',
          'Accept': 'application/xml,text/xml,*/*'
        },
        signal: AbortSignal.timeout(7000)
      });

      sitemapInfo.statusCode = res.status;

      if (res.ok) {
        const text = await res.text();
        const isXml = text.includes('<urlset') || text.includes('<sitemapindex') || text.includes('<?xml');

        if (isXml) {
          sitemapInfo.exists = true;
          sitemapInfo.isIndex = text.includes('<sitemapindex');

          // Count <loc> entries
          const locMatches = text.match(/<loc>([^<]+)<\/loc>/gi) || [];
          const extractedUrls: string[] = [];
          for (const match of locMatches.slice(0, 5)) {
            const clean = match.replace(/<\/?loc>/gi, '').trim();
            if (clean) extractedUrls.push(clean);
          }

          sitemapInfo.urlCount = locMatches.length;
          sitemapInfo.sampleUrls = extractedUrls;

          findings.push({
            id: 'sitemap-valid',
            category: 'seo',
            check_key: 'sitemap_xml_found',
            severity: 'passed',
            title: sitemapInfo.isIndex 
              ? `XML Sitemap Index Found (${locMatches.length} Sub-sitemaps)`
              : `XML Sitemap Found (${locMatches.length} URLs Indexed)`,
            description: `Successfully retrieved XML sitemap from ${sitemapTarget}.`,
            impact: 'Provides search engines like Google and Bing an up-to-date roadmap of all crawlable content.',
            recommendation: 'Keep sitemap automated through your CMS or build pipeline.',
            technical_details: `Status: 200, Entries: ${locMatches.length}, Type: ${sitemapInfo.isIndex ? 'Sitemap Index' : 'Standard URLSet'}`
          });
        } else {
          score -= 10;
          findings.push({
            id: 'sitemap-invalid-format',
            category: 'seo',
            check_key: 'sitemap_invalid_xml',
            severity: 'medium',
            title: 'Sitemap Does Not Contain Valid XML',
            description: `The URL ${sitemapTarget} returned 200 OK but does not appear to contain valid XML tags (<urlset> or <sitemapindex>).`,
            impact: 'Search engines will be unable to parse the sitemap.',
            recommendation: 'Ensure your server returns valid XML with proper Content-Type `application/xml`.',
            technical_details: `Content snippet: ${text.substring(0, 120)}...`
          });
        }
      } else {
        score -= 10;
        findings.push({
          id: 'sitemap-not-found',
          category: 'seo',
          check_key: 'sitemap_xml_missing',
          severity: 'low',
          title: `XML Sitemap Not Found (HTTP ${res.status})`,
          description: `No sitemap found at ${sitemapTarget}.`,
          impact: 'Crawlers must discover all URLs strictly through page link hops, which can cause deeper pages or new updates to be missed.',
          recommendation: 'Generate an XML sitemap at /sitemap.xml and submit it to Google Search Console.',
          technical_details: `Checked: ${sitemapTarget}, status: ${res.status}`
        });
      }
    } catch (err: any) {
      score -= 5;
      findings.push({
        id: 'sitemap-fetch-failed',
        category: 'seo',
        check_key: 'sitemap_fetch_error',
        severity: 'low',
        title: 'Unable to Retrieve XML Sitemap',
        description: `Request to ${sitemapTarget} failed: ${err.message}`,
        impact: 'Sitemap availability could not be verified.',
        recommendation: 'Verify sitemap routing and server access rules.',
        technical_details: err.message
      });
    }

    return {
      sitemapInfo,
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
