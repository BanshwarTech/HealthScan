import * as cheerio from 'cheerio';
import { ScanFinding, SeoInfo } from './types.js';

export class SeoScanner {
  public scan(html: string, pageUrl: string): { seoInfo: SeoInfo; findings: ScanFinding[]; score: number } {
    const findings: ScanFinding[] = [];
    let score = 100;

    const $ = cheerio.load(html);

    // 1. Title tag
    const titleText = $('title').first().text().trim();
    const titleLength = titleText.length;

    if (!titleText) {
      score -= 20;
      findings.push({
        id: 'seo-title-missing',
        category: 'seo',
        check_key: 'seo_title_missing',
        severity: 'high',
        title: 'Missing <title> Tag',
        description: 'The webpage has no title tag defined inside the <head> element.',
        impact: 'Search engines rely on page titles as the primary headline in search results and social shares. Significant SEO penalty.',
        recommendation: 'Add a descriptive `<title>` tag between 30 and 60 characters.',
        technical_details: '<title> is empty or absent.'
      });
    } else if (titleLength < 20) {
      score -= 5;
      findings.push({
        id: 'seo-title-short',
        category: 'seo',
        check_key: 'seo_title_too_short',
        severity: 'low',
        title: `Page Title Is Too Short (${titleLength} characters)`,
        description: `Current title: "${titleText}". Recommended length is between 30 and 60 characters for optimal search snippet display.`,
        impact: 'Underutilized search real estate and potentially vague topic targeting.',
        recommendation: 'Expand the title to incorporate your primary keyword and brand name.',
        technical_details: `Length: ${titleLength} chars`
      });
    } else if (titleLength > 65) {
      score -= 5;
      findings.push({
        id: 'seo-title-long',
        category: 'seo',
        check_key: 'seo_title_too_long',
        severity: 'low',
        title: `Page Title Exceeds 65 Characters (${titleLength} characters)`,
        description: `Current title: "${titleText.substring(0, 50)}...". It may be truncated in Google search results.`,
        impact: 'Search engines will truncate the title with an ellipsis (...).',
        recommendation: 'Keep primary keyword near the beginning and trim title to under 60 characters.',
        technical_details: `Length: ${titleLength} chars`
      });
    } else {
      findings.push({
        id: 'seo-title-good',
        category: 'seo',
        check_key: 'seo_title_optimal',
        severity: 'passed',
        title: `Optimal Page Title Length (${titleLength} characters)`,
        description: `Title: "${titleText}"`,
        impact: 'Clear representation in search engine result pages (SERPs).',
        recommendation: 'Maintain relevant, concise titles.',
        technical_details: `Title: ${titleText}`
      });
    }

    // 2. Meta description
    const metaDesc = $('meta[name="description"]').attr('content')?.trim() || 
                     $('meta[property="og:description"]').attr('content')?.trim() || '';
    const descLength = metaDesc.length;

    if (!metaDesc) {
      score -= 15;
      findings.push({
        id: 'seo-desc-missing',
        category: 'seo',
        check_key: 'seo_description_missing',
        severity: 'medium',
        title: 'Missing Meta Description',
        description: 'The page lacks a `<meta name="description">` tag.',
        impact: 'Search engines will auto-generate snippets from arbitrary text on the page, reducing click-through rate (CTR).',
        recommendation: 'Add a compelling meta description summarizing the page content between 120 and 160 characters.',
        technical_details: 'meta[name="description"] was not found in <head>.'
      });
    } else if (descLength < 60) {
      score -= 5;
      findings.push({
        id: 'seo-desc-short',
        category: 'seo',
        check_key: 'seo_description_too_short',
        severity: 'low',
        title: `Meta Description Is Short (${descLength} characters)`,
        description: `Description: "${metaDesc}"`,
        impact: 'Does not fully take advantage of search snippet preview space.',
        recommendation: 'Expand description to 120–150 characters to boost search engagement.',
        technical_details: `Length: ${descLength} chars`
      });
    } else if (descLength > 165) {
      score -= 5;
      findings.push({
        id: 'seo-desc-long',
        category: 'seo',
        check_key: 'seo_description_too_long',
        severity: 'low',
        title: `Meta Description Is Too Long (${descLength} characters)`,
        description: 'Search engines typically truncate snippets after ~160 characters on desktop and ~120 on mobile.',
        impact: 'End of description will be cut off in search results.',
        recommendation: 'Shorten meta description to under 160 characters.',
        technical_details: `Length: ${descLength} chars`
      });
    } else {
      findings.push({
        id: 'seo-desc-good',
        category: 'seo',
        check_key: 'seo_description_optimal',
        severity: 'passed',
        title: `Meta Description Configured (${descLength} characters)`,
        description: `Description: "${metaDesc}"`,
        impact: 'Good snippet representation on search engines.',
        recommendation: 'Ensure meta description is unique across all pages.',
        technical_details: `Description: ${metaDesc}`
      });
    }

    // 3. Viewport tag (Mobile Responsiveness)
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasViewport = Boolean(viewport);
    if (!hasViewport) {
      score -= 15;
      findings.push({
        id: 'seo-viewport-missing',
        category: 'seo',
        check_key: 'seo_viewport_missing',
        severity: 'high',
        title: 'Missing Viewport Meta Tag (Mobile Friendly)',
        description: 'No `<meta name="viewport">` found in document head.',
        impact: 'Mobile browsers will render the page at desktop width (typically 980px) and scale down, failing Google\'s mobile-friendly algorithm.',
        recommendation: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.',
        technical_details: 'Missing meta[name="viewport"]'
      });
    } else {
      findings.push({
        id: 'seo-viewport-passed',
        category: 'seo',
        check_key: 'seo_viewport_present',
        severity: 'passed',
        title: 'Mobile Viewport Configured',
        description: `Viewport tag present: "${viewport}".`,
        impact: 'Ensures page scales properly on smartphones and tablets.',
        recommendation: 'Keep standard width=device-width settings.',
        technical_details: viewport
      });
    }

    // 4. Canonical Tag
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      findings.push({
        id: 'seo-canonical-present',
        category: 'seo',
        check_key: 'seo_canonical_present',
        severity: 'passed',
        title: 'Canonical URL Specified',
        description: `Canonical link configured: "${canonical}".`,
        impact: 'Prevents duplicate content penalties across query parameters and alternate URLs.',
        recommendation: 'Ensure the canonical link points to the absolute preferred URL version.',
        technical_details: canonical
      });
    } else {
      findings.push({
        id: 'seo-canonical-missing',
        category: 'seo',
        check_key: 'seo_canonical_missing',
        severity: 'info',
        title: 'No Explicit Canonical Link Found',
        description: 'The page does not declare a `<link rel="canonical">` tag.',
        impact: 'Search engines might index duplicate variations of the page (with trailing slashes, www/non-www, or tracking parameters).',
        recommendation: 'Add `<link rel="canonical" href="https://yourdomain.com/path">` to identify preferred master URL.',
        technical_details: 'No link[rel="canonical"] found.'
      });
    }

    // 5. Headings (H1, H2, H3)
    const h1s: string[] = [];
    $('h1').each((_, el) => {
      const txt = $(el).text().trim();
      if (txt) h1s.push(txt);
    });
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;

    if (h1s.length === 0) {
      score -= 10;
      findings.push({
        id: 'seo-h1-missing',
        category: 'seo',
        check_key: 'seo_h1_missing',
        severity: 'medium',
        title: 'No <h1> Heading Found',
        description: 'Page does not have a top-level <h1> heading.',
        impact: 'H1 tags provide primary semantic context for search engines and accessibility screen readers.',
        recommendation: 'Add a single, descriptive <h1> heading communicating the main topic.',
        technical_details: '0 <h1> elements detected.'
      });
    } else if (h1s.length > 1) {
      score -= 5;
      findings.push({
        id: 'seo-h1-multiple',
        category: 'seo',
        check_key: 'seo_h1_multiple',
        severity: 'low',
        title: `Multiple <h1> Headings Detected (${h1s.length} found)`,
        description: `Page defines ${h1s.length} separate <h1> tags: "${h1s.slice(0, 2).join('", "')}"...`,
        impact: 'While HTML5 permits multiple H1s, SEO best practices recommend a single H1 per page for distinct topic hierarchy.',
        recommendation: 'Structure content with one primary <h1> and use <h2> and <h3> for sub-sections.',
        technical_details: `H1 texts: ${h1s.join(' | ')}`
      });
    } else {
      findings.push({
        id: 'seo-h1-good',
        category: 'seo',
        check_key: 'seo_h1_single',
        severity: 'passed',
        title: 'Single, Clear <h1> Heading Present',
        description: `H1: "${h1s[0]}"`,
        impact: 'Strong semantic hierarchy for search engines and screen readers.',
        recommendation: 'Keep <h1> focused on primary page subject.',
        technical_details: h1s[0]
      });
    }

    // 6. Image alt attributes
    const totalImages = $('img').length;
    let missingAlt = 0;
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt === undefined || alt.trim() === '') {
        missingAlt++;
      }
    });

    if (totalImages > 0 && missingAlt > 0) {
      score -= Math.min(15, missingAlt * 3);
      findings.push({
        id: 'seo-images-missing-alt',
        category: 'seo',
        check_key: 'seo_images_missing_alt',
        severity: missingAlt > 3 ? 'medium' : 'low',
        title: `${missingAlt} Image(s) Missing Alt Text`,
        description: `${missingAlt} out of ${totalImages} image(s) on the page do not have descriptive alt attributes.`,
        impact: 'Hurts accessibility for visually impaired users using screen readers and misses Google Image search ranking opportunities.',
        recommendation: 'Provide meaningful, descriptive `alt="..."` attributes for all informative images.',
        technical_details: `${missingAlt} / ${totalImages} images missing alt.`
      });
    } else if (totalImages > 0) {
      findings.push({
        id: 'seo-images-alt-good',
        category: 'seo',
        check_key: 'seo_images_alt_passed',
        severity: 'passed',
        title: `All Images Include Alt Attributes (${totalImages} images)`,
        description: 'Every image inspected on this page has an alt attribute configured.',
        impact: 'Great accessibility and image SEO compliance.',
        recommendation: 'Continue providing descriptive alt text for new images.',
        technical_details: `Audited ${totalImages} image elements.`
      });
    }

    // 7. Social / OpenGraph tags
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content');
    if (ogTitle) {
      findings.push({
        id: 'seo-og-present',
        category: 'seo',
        check_key: 'seo_opengraph_present',
        severity: 'passed',
        title: 'Open Graph Social Sharing Meta Tags Detected',
        description: `Social share title configured: "${ogTitle}".`,
        impact: 'Generates rich previews when shared on Slack, Twitter/X, LinkedIn, and Facebook.',
        recommendation: 'Ensure og:image is also specified with high resolution (1200x630).',
        technical_details: `og:title: ${ogTitle}`
      });
    }

    return {
      seoInfo: {
        title: titleText || undefined,
        titleLength,
        description: metaDesc || undefined,
        descriptionLength: descLength,
        canonical,
        hasViewport,
        ogTitle,
        ogDescription: ogDesc,
        headings: {
          h1: h1s,
          h2Count,
          h3Count
        },
        images: {
          total: totalImages,
          missingAlt
        }
      },
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
