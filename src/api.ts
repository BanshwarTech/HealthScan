import { ScanReport, Project } from './types';

export async function initiateScan(url: string, projectId?: string): Promise<{ id: string; domain: string }> {
  const res = await fetch('/api/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, projectId })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to start scan.');
  }

  return json.data;
}

export async function getScan(id: string): Promise<ScanReport | { id: string; status: string; progressStep: string; progressPercent: number }> {
  const res = await fetch(`/api/scans/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to retrieve scan.');
  }
  return json.data;
}

export async function getPublicReport(token: string): Promise<ScanReport> {
  const res = await fetch(`/api/reports/${token}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Public report not accessible.');
  }
  return json.data;
}

export async function regeneratePublicToken(token: string): Promise<string> {
  const res = await fetch(`/api/reports/${token}/regenerate`, { method: 'POST' });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to regenerate public token.');
  }
  return json.data.publicToken;
}

export async function getRecentScans(projectId?: string): Promise<any[]> {
  const q = projectId ? `?projectId=${projectId}` : '';
  const res = await fetch(`/api/scans${q}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load scans.');
  }
  return json.data;
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load projects.');
  }
  return json.data;
}

export async function createProject(name: string, url: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create project.');
  }
  return json.data;
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  const json = await res.json();
  return Boolean(json.success);
}

export async function getAdminStats(): Promise<any> {
  const res = await fetch('/api/stats');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load stats.');
  }
  return json.data;
}
