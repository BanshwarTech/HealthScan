import { DetectedTechnology, ScanFinding } from './types.js';

export class TechnologyScanner {
  public scan(headers: Record<string, string>, html: string): {
    technologies: DetectedTechnology[];
    findings: ScanFinding[];
  } {
    const findings: ScanFinding[] = [];
    const techMap = new Map<string, DetectedTechnology>();

    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      normalizedHeaders[k.toLowerCase()] = v;
    }

    const htmlLower = html.toLowerCase();

    // 1. Cloudflare
    if (normalizedHeaders['cf-ray'] || normalizedHeaders['server']?.toLowerCase().includes('cloudflare')) {
      techMap.set('Cloudflare', {
        name: 'Cloudflare',
        category: 'CDN & Security',
        confidence: 'high',
        evidence: 'cf-ray header / Cloudflare edge server'
      });
    }

    // 2. Next.js
    if (
      htmlLower.includes('/_next/static/') ||
      htmlLower.includes('__next_data__') ||
      normalizedHeaders['x-powered-by']?.toLowerCase().includes('next.js')
    ) {
      techMap.set('Next.js', {
        name: 'Next.js',
        category: 'Frontend Framework',
        confidence: 'high',
        evidence: '/_next/static path and __NEXT_DATA__ hydration'
      });
    }

    // 3. React
    if (
      techMap.has('Next.js') ||
      htmlLower.includes('react-dom') ||
      htmlLower.includes('data-reactroot') ||
      htmlLower.includes('react.min.js')
    ) {
      techMap.set('React', {
        name: 'React',
        category: 'JavaScript UI Library',
        confidence: 'high',
        evidence: 'React DOM runtime or hydration markers'
      });
    }

    // 4. Vue.js / Nuxt
    if (htmlLower.includes('data-v-') || htmlLower.includes('__nuxt') || htmlLower.includes('/_nuxt/')) {
      techMap.set('Vue.js', {
        name: htmlLower.includes('nuxt') ? 'Nuxt.js / Vue' : 'Vue.js',
        category: 'JavaScript UI Library',
        confidence: 'medium',
        evidence: 'Vue scoped attribute or Nuxt hydration marker'
      });
    }

    // 5. WordPress
    if (
      htmlLower.includes('/wp-content/') ||
      htmlLower.includes('/wp-includes/') ||
      htmlLower.includes('wp-json') ||
      htmlLower.includes('name="generator" content="wordpress')
    ) {
      techMap.set('WordPress', {
        name: 'WordPress',
        category: 'Content Management System',
        confidence: 'high',
        evidence: '/wp-content/ asset paths and WordPress meta generator'
      });
    }

    // 6. Shopify
    if (htmlLower.includes('cdn.shopify.com') || htmlLower.includes('shopify.theme')) {
      techMap.set('Shopify', {
        name: 'Shopify',
        category: 'E-commerce Platform',
        confidence: 'high',
        evidence: 'cdn.shopify.com script loader'
      });
    }

    // 7. Laravel
    if (
      normalizedHeaders['set-cookie']?.toLowerCase().includes('laravel_session') ||
      normalizedHeaders['set-cookie']?.toLowerCase().includes('xsrf-token') && normalizedHeaders['x-powered-by']?.toLowerCase().includes('php')
    ) {
      techMap.set('Laravel', {
        name: 'Laravel',
        category: 'Web Framework',
        confidence: 'medium',
        evidence: 'Session cookie naming convention'
      });
    }

    // 8. Tailwind CSS
    if (
      htmlLower.includes('flex flex-col') ||
      htmlLower.includes('grid-cols-') ||
      htmlLower.includes('text-gray-') ||
      htmlLower.includes('text-slate-') ||
      htmlLower.includes('bg-white')
    ) {
      techMap.set('Tailwind CSS', {
        name: 'Tailwind CSS',
        category: 'UI Styling Engine',
        confidence: 'medium',
        evidence: 'Utility-first class pattern signatures'
      });
    }

    // 9. Nginx
    if (normalizedHeaders['server']?.toLowerCase().includes('nginx')) {
      techMap.set('Nginx', {
        name: 'Nginx',
        category: 'Web Server / Reverse Proxy',
        confidence: 'high',
        evidence: `Server header: ${normalizedHeaders['server']}`
      });
    }

    // 10. Apache
    if (normalizedHeaders['server']?.toLowerCase().includes('apache')) {
      techMap.set('Apache', {
        name: 'Apache HTTP Server',
        category: 'Web Server',
        confidence: 'high',
        evidence: `Server header: ${normalizedHeaders['server']}`
      });
    }

    // 11. PHP
    if (normalizedHeaders['x-powered-by']?.toLowerCase().includes('php') || techMap.has('WordPress')) {
      techMap.set('PHP', {
        name: 'PHP',
        category: 'Backend Programming Language',
        confidence: 'medium',
        evidence: 'X-Powered-By header or CMS runtime'
      });
    }

    // 12. Google Analytics / Tag Manager
    if (htmlLower.includes('googletagmanager.com') || htmlLower.includes('google-analytics.com')) {
      techMap.set('Google Analytics / GTM', {
        name: 'Google Analytics / GTM',
        category: 'Analytics & Tracking',
        confidence: 'high',
        evidence: 'Google Tag Manager or Analytics script tag'
      });
    }

    const technologies = Array.from(techMap.values());

    if (technologies.length > 0) {
      findings.push({
        id: 'tech-stack-detected',
        category: 'technology',
        check_key: 'technologies_detected',
        severity: 'info',
        title: `Possible Technologies Detected (${technologies.length} found)`,
        description: `Heuristic inspection detected signatures for: ${technologies.map(t => t.name).join(', ')}.`,
        impact: 'Identifying visible technologies helps prioritize framework-specific patching and updates.',
        recommendation: 'Ensure all exposed frameworks and dependencies are kept up-to-date with security patches.',
        technical_details: technologies.map(t => `${t.name} (${t.category}): ${t.evidence}`).join('\n')
      });
    }

    return {
      technologies,
      findings
    };
  }
}
