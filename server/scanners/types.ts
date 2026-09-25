export type ScanStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'passed';

export type FindingCategory = 
  | 'security'
  | 'ssl'
  | 'headers'
  | 'dns'
  | 'seo'
  | 'performance'
  | 'cookies'
  | 'availability'
  | 'technology';

export interface SolutionGuide {
  summary: string;
  steps?: string[];
  code_snippets?: {
    label: string;
    language: string;
    code: string;
  }[];
}

export interface ScanFinding {
  id: string;
  category: FindingCategory;
  check_key: string;
  severity: Severity;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  technical_details?: string;
  documentation_url?: string;
  solution_guide?: SolutionGuide;
}

export interface CategoryScores {
  overall: number;
  security: number;
  performance: number;
  seo: number;
  availability: number;
  technical: number;
}

export interface SslInfo {
  enabled: boolean;
  valid: boolean;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  issuer?: string;
  subject?: string;
  subjectAltNames?: string[];
  protocol?: string;
  cipher?: string;
  error?: string;
}

export interface SecurityHeadersInfo {
  evaluated: {
    name: string;
    value: string | null;
    status: 'good' | 'warning' | 'missing' | 'bad';
    recommendation: string;
  }[];
  allHeaders: Record<string, string>;
}

export interface DnsRecordInfo {
  a?: string[];
  aaaa?: string[];
  mx?: { exchange: string; priority: number }[];
  ns?: string[];
  txt?: string[];
  cname?: string[];
  caa?: any[];
  spf?: { exists: boolean; record?: string; valid: boolean };
  dmarc?: { exists: boolean; record?: string; policy?: string };
}

export interface SeoInfo {
  title?: string;
  titleLength?: number;
  description?: string;
  descriptionLength?: number;
  canonical?: string;
  hasViewport: boolean;
  ogTitle?: string;
  ogDescription?: string;
  headings: {
    h1: string[];
    h2Count: number;
    h3Count: number;
  };
  images: {
    total: number;
    missingAlt: number;
  };
}

export interface RobotsInfo {
  exists: boolean;
  statusCode: number;
  sitemaps: string[];
  disallowRulesCount: number;
  rawSample?: string;
}

export interface SitemapInfo {
  exists: boolean;
  statusCode: number;
  isIndex: boolean;
  urlCount?: number;
  sampleUrls?: string[];
}

export interface ScannedLink {
  url: string;
  statusCode: number;
  statusText?: string;
  isInternal: boolean;
  anchorText?: string;
}

export interface PerformanceInfo {
  dnsLookupMs: number;
  tcpConnectMs: number;
  tlsHandshakeMs: number;
  ttfbMs: number;
  totalTimeMs: number;
  contentSizeBytes: number;
  compression: string;
  cacheControl?: string;
  httpVersion?: string;
}

export interface CookieInfo {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  domain?: string;
  path?: string;
}

export interface DetectedTechnology {
  name: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  evidence?: string;
}

export interface ScanReport {
  id: string;
  projectId?: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  ipAddress?: string;
  status: ScanStatus;
  progressStep?: string;
  progressPercent: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  publicToken: string;
  publicEnabled: boolean;
  scores: CategoryScores;
  metrics: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    passedCount: number;
  };
  findings: ScanFinding[];
  categories: {
    ssl: SslInfo;
    headers: SecurityHeadersInfo;
    dns: DnsRecordInfo;
    seo: SeoInfo;
    robots: RobotsInfo;
    sitemap: SitemapInfo;
    links: {
      crawledCount: number;
      internalCount: number;
      externalCount: number;
      brokenCount: number;
      items: ScannedLink[];
    };
    performance: PerformanceInfo;
    cookies: {
      count: number;
      insecureCount: number;
      items: CookieInfo[];
    };
    technologies: DetectedTechnology[];
  };
  aiSummary?: {
    summary: string;
    executiveScoreRating: string;
    topPriorities: string[];
    positiveHighlights: string[];
  };
  errorMessage?: string;
}

export interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  latestScore?: number;
  lastScanAt?: string;
  scanCount: number;
}
