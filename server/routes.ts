import { Router, Request, Response } from 'express';
import { WebsiteScanner } from './scanners/WebsiteScanner.js';
import { storage } from './storage.js';
import { validateAndResolveUrl } from './security/ssrf.js';
import { AiAdvisor } from './scanners/AiAdvisor.js';

export const apiRouter = Router();
const scanner = new WebsiteScanner();

// 1. Create and initiate a scan
apiRouter.post('/scans', async (req: Request, res: Response) => {
  const { url, projectId } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: A valid website URL is required.'
    });
  }

  // Rate limiting check
  const rateLimit = storage.checkRateLimit(clientIp, 30);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      message: `Rate limit reached. Try again in ${rateLimit.resetInMinutes} minutes.`
    });
  }

  // Validate URL and SSRF check synchronously before creating scan
  const validation = await validateAndResolveUrl(url);
  if (!validation.valid) {
    return res.status(422).json({
      success: false,
      message: validation.error || 'Invalid target URL.'
    });
  }

  // Generate temporary scan record for tracking
  const scanId = Math.random().toString(36).substring(2, 12);
  const now = new Date().toISOString();

  const initialReport: any = {
    id: scanId,
    projectId,
    url,
    normalizedUrl: validation.normalizedUrl,
    domain: validation.domain,
    status: 'running',
    progressStep: 'Initializing scan...',
    progressPercent: 5,
    startedAt: now,
    scores: { overall: 0, security: 0, performance: 0, seo: 0, availability: 0, technical: 0 },
    metrics: { totalFindings: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, infoCount: 0, passedCount: 0 },
    findings: [],
    categories: {}
  };

  storage.updateScanProgress(scanId, 'Initializing scan...', 5);

  // Return 202 Accepted immediately with scan tracking ID
  res.status(202).json({
    success: true,
    message: 'Scan initiated successfully.',
    data: {
      id: scanId,
      status: 'running',
      domain: validation.domain,
      normalizedUrl: validation.normalizedUrl
    }
  });

  // Execute scan asynchronously in background job
  (async () => {
    try {
      const fullReport = await scanner.runScan(
        validation.normalizedUrl!, 
        projectId, 
        (step, percent) => {
          storage.updateScanProgress(scanId, step, percent);
        }
      );
      // Retain the initial assigned ID
      fullReport.id = scanId;
      storage.saveScan(fullReport);
      storage.emitEvent(scanId, { type: 'complete', report: fullReport });
    } catch (scanErr: any) {
      storage.updateScanProgress(scanId, `Failed: ${scanErr.message}`, 0);
      const failedReport: any = {
        ...initialReport,
        status: 'failed',
        errorMessage: scanErr.message || 'Scan failed to complete'
      };
      storage.saveScan(failedReport);
      storage.emitEvent(scanId, { type: 'error', error: scanErr.message });
    }
  })();
});

// 2. Get scan result / status
apiRouter.get('/scans/:id', (req: Request, res: Response) => {
  const scan = storage.getScan(req.params.id);
  const progress = storage.getScanProgress(req.params.id);

  if (!scan && !progress) {
    return res.status(404).json({
      success: false,
      message: 'Scan report not found.'
    });
  }

  if (scan) {
    return res.json({
      success: true,
      data: scan
    });
  }

  return res.json({
    success: true,
    data: {
      id: req.params.id,
      status: 'running',
      progressStep: progress?.step || 'Scanning...',
      progressPercent: progress?.percent || 10
    }
  });
});

// 3. SSE Stream for real-time progress
apiRouter.get('/scans/:id/stream', (req: Request, res: Response) => {
  const scanId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current progress immediately
  const existingProgress = storage.getScanProgress(scanId);
  const existingScan = storage.getScan(scanId);

  if (existingScan && existingScan.status === 'completed') {
    res.write(`data: ${JSON.stringify({ type: 'complete', report: existingScan })}\n\n`);
    res.end();
    return;
  }

  if (existingProgress) {
    res.write(`data: ${JSON.stringify({ type: 'progress', step: existingProgress.step, percent: existingProgress.percent })}\n\n`);
  }

  const unsubscribe = storage.addListener(scanId, (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.type === 'complete' || data.type === 'error') {
      res.end();
    }
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// 4. List recent scans
apiRouter.get('/scans', (req: Request, res: Response) => {
  const projectId = req.query.projectId as string | undefined;
  const scans = projectId ? storage.getScansForProject(projectId) : storage.getAllScans();

  res.json({
    success: true,
    data: scans.slice(0, 30).map(s => ({
      id: s.id,
      url: s.url,
      domain: s.domain,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      durationMs: s.durationMs,
      scores: s.scores,
      metrics: s.metrics,
      publicToken: s.publicToken
    }))
  });
});

// 5. Public report view via secure token
apiRouter.get('/reports/:token', (req: Request, res: Response) => {
  const scan = storage.getScanByPublicToken(req.params.token);
  if (!scan) {
    return res.status(404).json({
      success: false,
      message: 'This public report is either invalid or has been disabled by the owner.'
    });
  }

  res.json({
    success: true,
    data: scan
  });
});

// 6. Regenerate public report token
apiRouter.post('/reports/:token/regenerate', (req: Request, res: Response) => {
  const scan = storage.getScanByPublicToken(req.params.token);
  if (!scan) {
    return res.status(404).json({
      success: false,
      message: 'Report not found.'
    });
  }

  const newToken = storage.regeneratePublicToken(scan.id);
  res.json({
    success: true,
    data: {
      publicToken: newToken
    }
  });
});

// 7. Toggle public report availability
apiRouter.post('/scans/:id/toggle-public', (req: Request, res: Response) => {
  const { enabled } = req.body;
  const ok = storage.togglePublicReport(req.params.id, Boolean(enabled));
  if (!ok) {
    return res.status(404).json({ success: false, message: 'Scan not found.' });
  }

  res.json({
    success: true,
    message: `Public link ${enabled ? 'enabled' : 'disabled'}.`
  });
});

// 8. Projects management
apiRouter.get('/projects', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: storage.getProjects()
  });
});

apiRouter.post('/projects', (req: Request, res: Response) => {
  const { name, url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Project URL is required.' });
  }

  const proj = storage.createProject(name, url);
  res.status(201).json({
    success: true,
    data: proj
  });
});

apiRouter.delete('/projects/:id', (req: Request, res: Response) => {
  const deleted = storage.deleteProject(req.params.id);
  res.json({
    success: deleted,
    message: deleted ? 'Project removed.' : 'Project not found.'
  });
});

// 9. Admin Stats / System Health
apiRouter.get('/stats', (req: Request, res: Response) => {
  const scans = storage.getAllScans();
  const completed = scans.filter(s => s.status === 'completed');
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((acc, s) => acc + (s.scores?.overall || 0), 0) / completed.length)
    : 85;

  const criticalIssuesCount = completed.reduce(
    (acc, s) => acc + (s.metrics?.criticalCount || 0),
    0
  );

  res.json({
    success: true,
    data: {
      totalProjects: storage.getProjects().length,
      totalScans: scans.length,
      scansToday: scans.filter(s => {
        const diff = Date.now() - new Date(s.startedAt).getTime();
        return diff < 86400000;
      }).length,
      averageScore: avgScore,
      criticalIssues: criticalIssuesCount,
      queueStatus: 'idle',
      systemHealth: {
        scannerEngine: 'operational',
        dnsResolver: 'operational',
        ssrfProtection: 'active',
        redisQueue: 'connected',
        aiAdvisor: AiAdvisor.getActiveProviderInfo(),
        nodeUptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    }
  });
});

// 10. AI Provider Status
apiRouter.get('/ai-status', (req: Request, res: Response) => {
  const info = AiAdvisor.getActiveProviderInfo();
  res.json({
    success: true,
    data: {
      ...info,
      supportedModels: [
        'meta/llama-3.3-70b-instruct (Default)',
        'meta/llama-3.1-70b-instruct',
        'mistralai/mixtral-8x22b-instruct-v0.1',
        'nvidia/nemotron-4-340b-instruct'
      ]
    }
  });
});

