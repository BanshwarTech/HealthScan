import { PerformanceInfo, ScanFinding } from './types.js';

export class PerformanceScanner {
  public scan(
    timings: { dnsLookupMs: number; tcpConnectMs: number; tlsHandshakeMs: number; ttfbMs: number; totalTimeMs: number },
    contentSizeBytes: number,
    headers: Record<string, string>
  ): { performanceInfo: PerformanceInfo; findings: ScanFinding[]; score: number } {
    const findings: ScanFinding[] = [];
    let score = 100;

    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      normalized[k.toLowerCase()] = v;
    }

    const compression = normalized['content-encoding'] || 'none';
    const cacheControl = normalized['cache-control'];
    const etag = normalized['etag'];

    const performanceInfo: PerformanceInfo = {
      dnsLookupMs: timings.dnsLookupMs,
      tcpConnectMs: timings.tcpConnectMs,
      tlsHandshakeMs: timings.tlsHandshakeMs,
      ttfbMs: timings.ttfbMs,
      totalTimeMs: timings.totalTimeMs,
      contentSizeBytes,
      compression,
      cacheControl,
      httpVersion: normalized[':status'] ? 'HTTP/2+' : 'HTTP/1.1'
    };

    // 1. TTFB (Time to First Byte)
    if (timings.ttfbMs < 300) {
      findings.push({
        id: 'perf-ttfb-fast',
        category: 'performance',
        check_key: 'perf_ttfb_fast',
        severity: 'passed',
        title: `Excellent Server Response Time (TTFB: ${timings.ttfbMs}ms)`,
        description: `Server began delivering content within ${timings.ttfbMs}ms, well below Google's 800ms recommended threshold.`,
        impact: 'Provides snappy initial page rendering and boosts Core Web Vitals.',
        recommendation: 'Maintain current server/edge caching architecture.',
        technical_details: `TTFB: ${timings.ttfbMs}ms, Total: ${timings.totalTimeMs}ms`
      });
    } else if (timings.ttfbMs < 800) {
      score -= 5;
      findings.push({
        id: 'perf-ttfb-moderate',
        category: 'performance',
        check_key: 'perf_ttfb_moderate',
        severity: 'passed',
        title: `Good Server Response Time (TTFB: ${timings.ttfbMs}ms)`,
        description: `Initial response was received in ${timings.ttfbMs}ms.`,
        impact: 'Acceptable performance for most visitors.',
        recommendation: 'Consider edge caching or database query optimization to push TTFB below 300ms.',
        technical_details: `TTFB: ${timings.ttfbMs}ms`
      });
    } else {
      score -= 20;
      findings.push({
        id: 'perf-ttfb-slow',
        category: 'performance',
        check_key: 'perf_ttfb_slow',
        severity: 'high',
        title: `Slow Time to First Byte (TTFB: ${timings.ttfbMs}ms)`,
        description: `The web server took ${timings.ttfbMs}ms before sending the first byte of data (exceeds Google\'s 800ms limit).`,
        impact: 'Delays Largest Contentful Paint (LCP) and increases bounce rates on mobile.',
        recommendation: 'Leverage edge caching (CDN), optimize backend server queries, or enable PHP OPcache / Node SSR caching.',
        technical_details: `TTFB: ${timings.ttfbMs}ms`
      });
    }

    // 2. Compression check
    if (compression.includes('br')) {
      findings.push({
        id: 'perf-compression-brotli',
        category: 'performance',
        check_key: 'perf_compression_brotli',
        severity: 'passed',
        title: 'Brotli (br) Modern Compression Active',
        description: 'Server compresses payloads using modern Brotli algorithm.',
        impact: 'Typically achieves 15-25% smaller file sizes than gzip, speeding up mobile delivery.',
        recommendation: 'Keep Brotli compression enabled.',
        technical_details: `Content-Encoding: ${compression}`
      });
    } else if (compression.includes('gzip')) {
      findings.push({
        id: 'perf-compression-gzip',
        category: 'performance',
        check_key: 'perf_compression_gzip',
        severity: 'passed',
        title: 'Gzip Compression Enabled',
        description: 'Server compresses text resources with Gzip.',
        impact: 'Significantly lowers payload bandwidth usage.',
        recommendation: 'Consider adding Brotli for higher compression efficiency.',
        technical_details: `Content-Encoding: ${compression}`
      });
    } else {
      score -= 15;
      findings.push({
        id: 'perf-no-compression',
        category: 'performance',
        check_key: 'perf_no_compression',
        severity: 'medium',
        title: 'No HTTP Content Compression Detected',
        description: 'The response does not appear to use Gzip or Brotli compression.',
        impact: 'Uncompressed HTML and text payloads waste network bandwidth and slow page load on mobile networks.',
        recommendation: 'Enable Gzip or Brotli in Nginx (`gzip on;`), Apache (`mod_deflate`), or via Cloudflare.',
        technical_details: 'Missing Content-Encoding header.'
      });
    }

    // 3. Cache-Control & ETag
    if (cacheControl) {
      findings.push({
        id: 'perf-cache-control-present',
        category: 'performance',
        check_key: 'perf_cache_control_present',
        severity: 'passed',
        title: 'Cache-Control Header Present',
        description: `Cache policy defined: "${cacheControl}".`,
        impact: 'Directs browser and proxy caching lifetimes.',
        recommendation: 'Ensure static assets use immutable/long max-age while dynamic HTML uses must-revalidate.',
        technical_details: `Cache-Control: ${cacheControl}`
      });
    } else {
      score -= 8;
      findings.push({
        id: 'perf-no-cache-control',
        category: 'performance',
        check_key: 'perf_no_cache_control',
        severity: 'low',
        title: 'No Explicit Cache-Control Header',
        description: 'The server did not send a Cache-Control directive.',
        impact: 'Browsers may apply unpredictable heuristic caching.',
        recommendation: 'Set explicit `Cache-Control: public, max-age=...` or `no-cache` as appropriate.',
        technical_details: 'Cache-Control header missing.'
      });
    }

    // 4. Payload Size
    const kbSize = Math.round(contentSizeBytes / 1024);
    if (kbSize > 2500) {
      score -= 10;
      findings.push({
        id: 'perf-html-large',
        category: 'performance',
        check_key: 'perf_payload_large',
        severity: 'medium',
        title: `Heavy HTML Document Size (${kbSize} KB)`,
        description: `The raw document response is ${kbSize} KB. Large HTML documents take longer to download and parse.`,
        impact: 'Slows DOM construction and delays first render.',
        recommendation: 'Minify HTML and offload inline scripts, styles, and base64 images into separate cacheable files.',
        technical_details: `Size: ${kbSize} KB (${contentSizeBytes} bytes)`
      });
    } else {
      findings.push({
        id: 'perf-html-lean',
        category: 'performance',
        check_key: 'perf_payload_lean',
        severity: 'passed',
        title: `Lean Document Size (${kbSize} KB)`,
        description: `The document is ${kbSize} KB, allowing fast parsing.`,
        impact: 'Quick DOM processing for client devices.',
        recommendation: 'Keep DOM complexity concise.',
        technical_details: `Size: ${contentSizeBytes} bytes`
      });
    }

    return {
      performanceInfo,
      findings,
      score: Math.max(0, Math.min(100, score))
    };
  }
}
