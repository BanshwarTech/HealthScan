import { GoogleGenAI } from '@google/genai';
import { CategoryScores, ScanFinding } from './types.js';

export interface AiSummaryResult {
  summary: string;
  executiveScoreRating: string;
  topPriorities: string[];
  positiveHighlights: string[];
}

export class AiAdvisor {
  public static async generateSummary(
    domain: string,
    scores: CategoryScores,
    findings: ScanFinding[]
  ): Promise<AiSummaryResult> {
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    const mediumFindings = findings.filter(f => f.severity === 'medium');
    const passedFindings = findings.filter(f => f.severity === 'passed');

    let rating = 'Critical Attention Required';
    if (scores.overall >= 90) rating = 'Excellent Security & Health';
    else if (scores.overall >= 80) rating = 'Good Baseline';
    else if (scores.overall >= 60) rating = 'Needs Improvement';

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a Senior Website Security & DevOps Auditor.
Analyze the following automated scan results for the website "${domain}".
Only use the provided findings; do NOT invent checks that were not performed.

Overall Score: ${scores.overall}/100
Category Scores:
- Security: ${scores.security}/100
- Performance: ${scores.performance}/100
- SEO: ${scores.seo}/100
- Availability: ${scores.availability}/100
- Technical: ${scores.technical}/100

High/Critical Issues:
${[...criticalFindings, ...highFindings].map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n') || 'None'}

Medium Issues:
${mediumFindings.slice(0, 5).map(f => `- [MEDIUM] ${f.title}`).join('\n') || 'None'}

Passed Highlights:
${passedFindings.slice(0, 5).map(f => `- ${f.title}`).join('\n')}

Generate a JSON object with:
1. "summary": A concise, executive-level 2-3 paragraph explanation of the website's health, tailored for business owners and engineers.
2. "executiveScoreRating": A short phrase like "Strong Baseline", "Action Recommended", etc.
3. "topPriorities": An array of 3 to 5 highest priority actionable bullet points to improve the score.
4. "positiveHighlights": An array of 3 key things the website does right.

Return ONLY the raw JSON object, no markdown codeblocks.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const text = response.text?.trim() || '';
        const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          summary: parsed.summary || 'Scan audit complete.',
          executiveScoreRating: parsed.executiveScoreRating || rating,
          topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities : [],
          positiveHighlights: Array.isArray(parsed.positiveHighlights) ? parsed.positiveHighlights : []
        };
      } catch (err: any) {
        // Fall back gracefully to built-in heuristic synthesis
      }
    }

    // High quality deterministic fallback generator
    const topPriorities: string[] = [];
    const positiveHighlights: string[] = [];

    for (const f of [...criticalFindings, ...highFindings].slice(0, 4)) {
      topPriorities.push(`${f.title}: ${f.recommendation}`);
    }
    if (topPriorities.length < 3) {
      for (const f of mediumFindings.slice(0, 3 - topPriorities.length)) {
        topPriorities.push(`${f.title}: ${f.recommendation}`);
      }
    }
    if (topPriorities.length === 0) {
      topPriorities.push('Maintain automated SSL certificate renewal checks.');
      topPriorities.push('Periodically review security headers against new browser standards.');
    }

    for (const f of passedFindings.slice(0, 3)) {
      positiveHighlights.push(f.title);
    }
    if (positiveHighlights.length === 0) {
      positiveHighlights.push('Website responded to live availability checks.');
    }

    const summary = `The security and health evaluation for ${domain} resulted in an overall score of ${scores.overall}/100 (${rating}). ${
      criticalFindings.length > 0 || highFindings.length > 0
        ? `The audit identified ${criticalFindings.length} critical and ${highFindings.length} high priority issues that directly affect your security posture and compliance.`
        : 'The website displays solid technical hygiene with no critical vulnerabilities discovered.'
    } ${
      scores.security < 80 
        ? 'Implementing modern HTTP security headers (such as Content-Security-Policy and HSTS) is the most impactful step to protect visitors.'
        : 'Security fundamentals including encryption and certificate validity are operating smoothly.'
    }`;

    return {
      summary,
      executiveScoreRating: rating,
      topPriorities,
      positiveHighlights
    };
  }
}
