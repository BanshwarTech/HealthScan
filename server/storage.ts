import { ScanReport, Project } from './scanners/types.js';

interface ScanProgressState {
  step: string;
  percent: number;
}

export class AppStorage {
  private scans: Map<string, ScanReport> = new Map();
  private publicTokenMap: Map<string, string> = new Map(); // token -> scanId
  private projects: Map<string, Project> = new Map();
  private scanProgress: Map<string, ScanProgressState> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private ipScanCounts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // --- Scans ---
  public saveScan(scan: ScanReport): void {
    this.scans.set(scan.id, scan);
    this.publicTokenMap.set(scan.publicToken, scan.id);

    // Update project if attached
    if (scan.projectId && this.projects.has(scan.projectId)) {
      const project = this.projects.get(scan.projectId)!;
      project.latestScore = scan.scores.overall;
      project.lastScanAt = scan.completedAt || scan.startedAt;
      project.scanCount = (project.scanCount || 0) + 1;
      project.updatedAt = new Date().toISOString();
    }
  }

  public getScan(id: string): ScanReport | undefined {
    return this.scans.get(id);
  }

  public getScanByPublicToken(token: string): ScanReport | undefined {
    const id = this.publicTokenMap.get(token);
    if (!id) return undefined;
    const scan = this.scans.get(id);
    if (!scan || !scan.publicEnabled) return undefined;
    return scan;
  }

  public getAllScans(): ScanReport[] {
    return Array.from(this.scans.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public getScansForProject(projectId: string): ScanReport[] {
    return this.getAllScans().filter(s => s.projectId === projectId);
  }

  public updateScanProgress(id: string, step: string, percent: number): void {
    this.scanProgress.set(id, { step, percent });
    const existing = this.scans.get(id);
    if (existing) {
      existing.progressStep = step;
      existing.progressPercent = percent;
      existing.status = percent >= 100 ? 'completed' : 'running';
    }
    this.emitEvent(id, { type: 'progress', step, percent });
  }

  public getScanProgress(id: string): ScanProgressState | undefined {
    return this.scanProgress.get(id);
  }

  public regeneratePublicToken(id: string): string | null {
    const scan = this.scans.get(id);
    if (!scan) return null;
    this.publicTokenMap.delete(scan.publicToken);
    const newToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    scan.publicToken = newToken;
    this.publicTokenMap.set(newToken, scan.id);
    return newToken;
  }

  public togglePublicReport(id: string, enabled: boolean): boolean {
    const scan = this.scans.get(id);
    if (!scan) return false;
    scan.publicEnabled = enabled;
    return true;
  }

  // --- Real-Time Events (SSE) ---
  public addListener(scanId: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(scanId)) {
      this.listeners.set(scanId, new Set());
    }
    this.listeners.get(scanId)!.add(callback);

    return () => {
      const set = this.listeners.get(scanId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(scanId);
        }
      }
    };
  }

  public emitEvent(scanId: string, data: any): void {
    const callbacks = this.listeners.get(scanId);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(data);
      }
    }
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  public createProject(name: string, url: string): Project {
    const id = 'proj_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const proj: Project = {
      id,
      name: name || url,
      url,
      createdAt: now,
      updatedAt: now,
      scanCount: 0
    };
    this.projects.set(id, proj);
    return proj;
  }

  public deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  // --- Rate Limiting ---
  public checkRateLimit(clientIp: string, maxPerDay: number = 30): { allowed: boolean; remaining: number; resetInMinutes: number } {
    const now = Date.now();
    const entry = this.ipScanCounts.get(clientIp);

    if (!entry || now > entry.resetAt) {
      this.ipScanCounts.set(clientIp, {
        count: 1,
        resetAt: now + 24 * 60 * 60 * 1000
      });
      return { allowed: true, remaining: maxPerDay - 1, resetInMinutes: 1440 };
    }

    if (entry.count >= maxPerDay) {
      const resetInMinutes = Math.ceil((entry.resetAt - now) / 60000);
      return { allowed: false, remaining: 0, resetInMinutes };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxPerDay - entry.count,
      resetInMinutes: Math.ceil((entry.resetAt - now) / 60000)
    };
  }

  // Seed sample initial projects
  private seedInitialData() {
    const p1: Project = {
      id: 'proj_demo_stripe',
      name: 'Stripe Payments',
      url: 'https://stripe.com',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      latestScore: 94,
      lastScanAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      scanCount: 3
    };

    const p2: Project = {
      id: 'proj_demo_wiki',
      name: 'Wikipedia Foundation',
      url: 'https://wikipedia.org',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      latestScore: 88,
      lastScanAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      scanCount: 2
    };

    this.projects.set(p1.id, p1);
    this.projects.set(p2.id, p2);
  }
}

export const storage = new AppStorage();
