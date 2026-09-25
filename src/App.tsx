import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroScanner } from './components/HeroScanner';
import { ScanProgressModal } from './components/ScanProgressModal';
import { ReportView } from './components/ReportView';
import { DashboardView } from './components/DashboardView';
import { AdminView } from './components/AdminView';
import { PricingFaqSection } from './components/PricingFaqSection';
import { AuthModal } from './components/auth/AuthModal';
import { PlanUpgradeModal } from './components/auth/PlanUpgradeModal';
import { ScanLimitReachedModal } from './components/auth/ScanLimitReachedModal';
import { ScanHistoryModal } from './components/auth/ScanHistoryModal';
import { initiateScan, getScan, getPublicReport } from './api';
import { ScanReport } from './types';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { PlanType } from './firebase';

function MainApp() {
  const [currentView, setCurrentView] = useState<'scanner' | 'report' | 'dashboard' | 'admin'>('scanner');
  const [activeReport, setActiveReport] = useState<ScanReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitReason, setLimitReason] = useState<string | undefined>(undefined);

  const { recordScan, user, changePlan, openAuthModal } = useAuth();

  const [scanProgress, setScanProgress] = useState<{
    targetDomain: string;
    step: string;
    percent: number;
  }>({
    targetDomain: '',
    step: '',
    percent: 0
  });

  // Check URL query parameters for public token or direct link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      loadPublicToken(token);
    }
  }, []);

  const loadPublicToken = async (token: string) => {
    try {
      const rep = await getPublicReport(token);
      setActiveReport(rep);
      setIsPublicView(true);
      setCurrentView('report');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to open public report.');
    }
  };

  const handleStartScan = async (url: string, projectId?: string) => {
    setErrorMessage(null);
    setIsScanning(true);
    let domainGuess = url.replace(/^https?:\/\//, '').split('/')[0];

    setScanProgress({
      targetDomain: domainGuess,
      step: 'Initializing scanner and SSRF defense check...',
      percent: 5
    });

    try {
      const initResult = await initiateScan(url, projectId);
      const scanId = initResult.id;
      setScanProgress(prev => ({ ...prev, targetDomain: initResult.domain }));

      // Listen via Server-Sent Events (SSE)
      const eventSource = new EventSource(`/api/scans/${scanId}/stream`);

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress') {
            setScanProgress(prev => ({
              ...prev,
              step: data.step,
              percent: data.percent
            }));
          } else if (data.type === 'complete') {
            eventSource.close();
            setActiveReport(data.report);
            setIsScanning(false);
            setCurrentView('report');

            // Record scan into user quota and history
            await recordScan({
              url: data.report.url,
              domain: data.report.domain,
              overallScore: data.report.scores.overall,
              securityScore: data.report.scores.security
            });
          } else if (data.type === 'error') {
            eventSource.close();
            setIsScanning(false);
            setErrorMessage(data.error || 'Scan failed.');
          }
        } catch (e) {
          console.error(e);
        }
      };

      eventSource.onerror = async () => {
        eventSource.close();
        // Fallback: poll every 1.5 seconds if SSE connection drops
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const data: any = await getScan(scanId);
            if (data.status === 'completed' && data.scores) {
              clearInterval(interval);
              setActiveReport(data);
              setIsScanning(false);
              setCurrentView('report');

              await recordScan({
                url: data.url,
                domain: data.domain,
                overallScore: data.scores.overall,
                securityScore: data.scores.security
              });
            } else if (data.status === 'failed') {
              clearInterval(interval);
              setIsScanning(false);
              setErrorMessage(data.errorMessage || 'Scan failed to complete.');
            } else if (data.progressPercent) {
              setScanProgress(prev => ({
                ...prev,
                step: data.progressStep || 'Scanning...',
                percent: data.progressPercent
              }));
            }
          } catch {
            // keep trying
          }

          if (attempts > 30) {
            clearInterval(interval);
            setIsScanning(false);
            setErrorMessage('Scan timed out. Please verify target domain availability.');
          }
        }, 1500);
      };
    } catch (err: any) {
      setIsScanning(false);
      setErrorMessage(err.message || 'Failed to start scan.');
    }
  };

  const handleOpenReportFromHistory = (report: ScanReport) => {
    setActiveReport(report);
    setCurrentView('report');
  };

  const handleQuotaReached = (reason?: string) => {
    setLimitReason(reason);
    setLimitModalOpen(true);
  };

  const handleSelectPlan = async (planId: PlanType) => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    await changePlan(planId);
    setIsUpgradeModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNewScan={() => {
          setCurrentView('scanner');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasActiveReport={Boolean(activeReport)}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 py-2.5 px-4 text-center text-xs sm:text-sm text-rose-200 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-3 font-bold hover:underline text-rose-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'scanner' && (
          <div>
            <HeroScanner
              onScan={(url) => handleStartScan(url)}
              isLoading={isScanning}
              onQuotaReached={handleQuotaReached}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            />
            <PricingFaqSection
              onScanClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectPlan={handleSelectPlan}
            />
          </div>
        )}

        {currentView === 'report' && activeReport && (
          <ReportView
            report={activeReport}
            onBack={() => setCurrentView('scanner')}
            onRescan={(url) => handleStartScan(url, activeReport.projectId)}
            isPublicView={isPublicView}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onScanUrl={(url, pId) => handleStartScan(url, pId)}
            onOpenReport={handleOpenReportFromHistory}
          />
        )}

        {currentView === 'admin' && (
          <AdminView />
        )}
      </main>

      {/* Live Scan Progress Modal */}
      <ScanProgressModal
        isOpen={isScanning}
        targetDomain={scanProgress.targetDomain}
        currentStep={scanProgress.step}
        progressPercent={scanProgress.percent}
      />

      {/* Authentication Modal */}
      <AuthModal />

      {/* Subscription Plans & Upgrade Modal */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Daily Quota Reached Modal */}
      <ScanLimitReachedModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        reason={limitReason}
      />

      {/* User Scan History Modal */}
      <ScanHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectUrl={(url) => {
          setIsHistoryModalOpen(false);
          setCurrentView('scanner');
          handleStartScan(url);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-300">HealthScan Security & Technical Auditor</span>
            <span>© 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>SSRF Defended</span>
            <span>•</span>
            <span>Firebase Auth & Firestore</span>
            <span>•</span>
            <span>Google reCAPTCHA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
