import { CategoryScores, ScanFinding } from './types.js';

export class ScoreCalculator {
  public static calculate(
    rawScores: {
      ssl: number;
      headers: number;
      dns: number;
      seo: number;
      performance: number;
      cookies: number;
      availability: number;
      sitemap: number;
      robots: number;
    },
    findings: ScanFinding[]
  ): CategoryScores {
    // 1. Security Score (SSL 40%, Headers 40%, Cookies 20%)
    const security = Math.round(
      rawScores.ssl * 0.4 +
      rawScores.headers * 0.4 +
      rawScores.cookies * 0.2
    );

    // 2. SEO Score (HTML SEO 60%, Sitemap 20%, Robots 20%)
    const seo = Math.round(
      rawScores.seo * 0.6 +
      rawScores.sitemap * 0.2 +
      rawScores.robots * 0.2
    );

    // 3. Performance Score
    const performance = Math.round(rawScores.performance);

    // 4. Availability Score
    const availability = Math.round(rawScores.availability);

    // 5. Technical Health Score (DNS 60%, Server banners/leaks 40%)
    const technical = Math.round(rawScores.dns);

    // Severe penalties if critical findings exist
    let criticalPenalty = 0;
    for (const f of findings) {
      if (f.severity === 'critical') {
        criticalPenalty += 15;
      }
    }

    // Overall weighted score
    const weighted = (
      security * 0.30 +
      performance * 0.20 +
      seo * 0.25 +
      availability * 0.15 +
      technical * 0.10
    ) - criticalPenalty;

    const overall = Math.max(0, Math.min(100, Math.round(weighted)));

    return {
      overall,
      security: Math.max(0, Math.min(100, security)),
      performance: Math.max(0, Math.min(100, performance)),
      seo: Math.max(0, Math.min(100, seo)),
      availability: Math.max(0, Math.min(100, availability)),
      technical: Math.max(0, Math.min(100, technical))
    };
  }
}
