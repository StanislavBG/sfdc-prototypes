import { useState, useRef, useCallback } from 'react';
import { toSvg } from 'html-to-image';
import Header from './Header';
import LeftNav from './LeftNav';
import AgentPanel from './AgentPanel';
import HomeContent from './HomeContent';
import HelpDocExplorer from './HelpDocExplorer';
import IdentityResolutionContent from './IdentityResolutionContent';
import DataStreamsContent from './DataStreamsContent';
import DataCloudSetupContent from './DataCloudSetupContent';
import WorkflowSidebar from './WorkflowSidebar';
import WorkflowArea from './WorkflowArea';
import TimeMachine from './TimeMachine';
import AppLauncher from './AppLauncher';
import { salesforceApps, type Workflow } from '@/lib/mock-data';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [currentTimeline, setCurrentTimeline] = useState('today');
  const [activeTab, setActiveTab] = useState('Home');
  const [agentMinimized, setAgentMinimized] = useState(false);
  const [currentApp, setCurrentApp] = useState('data-cloud');
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);
  const [showDataCloudSetup, setShowDataCloudSetup] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const isAdmin = currentTimeline === 'context-explorer';
  const effectiveApp = isAdmin ? 'admin' : currentApp;
  const currentAppData = salesforceApps.find((a) => a.id === effectiveApp);
  const appName = currentAppData?.name || 'Data 360';

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  const handleSelectTimeline = (id: string) => {
    setCurrentTimeline(id);
    setShowDataCloudSetup(false);
    if (id === 'context-explorer') {
      setActiveTab('Context Manager');
    } else if (id === 'today' && activeTab === 'Context Manager' && currentApp !== 'data-cloud') {
      setActiveTab('Home');
    }
  };

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId);
    setShowDataCloudSetup(false);
    if (appId === 'admin') {
      setCurrentTimeline('context-explorer');
      setActiveTab('Context Manager');
    } else {
      setCurrentTimeline('today');
      setActiveTab('Home');
    }
  };

  // ── Figma export handlers ──
  const showToast = useCallback((msg: string) => {
    setExportToast(msg);
    setTimeout(() => setExportToast(null), 3000);
  }, []);

  const handleExportSvg = useCallback(async () => {
    const el = mainRef.current;
    if (!el) return;
    try {
      const dataUrl = await toSvg(el, { backgroundColor: '#F3F3F3' });
      const link = document.createElement('a');
      link.download = `${activeTab.replace(/\s+/g, '-').toLowerCase()}-export.svg`;
      link.href = dataUrl;
      link.click();
      showToast('SVG downloaded — drag into Figma to import');
    } catch {
      showToast('Export failed — try again');
    }
  }, [activeTab, showToast]);

  const handleExportHtml = useCallback(async () => {
    const el = mainRef.current;
    if (!el) return;
    try {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((s) => s.outerHTML)
        .join('\n');
      const html = `<!DOCTYPE html>\n<html><head><meta charset="utf-8">\n${styles}\n</head><body>\n${el.outerHTML}\n</body></html>`;
      await navigator.clipboard.writeText(html);
      showToast('HTML copied — paste into html.to.design Figma plugin');
    } catch {
      showToast('Copy failed — check clipboard permissions');
    }
  }, [showToast]);

  // Determine layout based on timeline
  const showTodayLayout = currentTimeline === 'today' || currentTimeline === 'context-explorer';

  // Data Cloud Setup takes over the whole content area
  if (showDataCloudSetup) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--sf-content-bg)]">
        <Header
          appName="Data Cloud Setup"
          currentApp={effectiveApp}
          currentTimeline={currentTimeline}
          onOpenTimeMachine={() => setTimeMachineOpen(!timeMachineOpen)}
          onSelectSearchResult={handleSelectSearchResult}
          onSetup={() => {
            setShowDataCloudSetup(false);
            setCurrentTimeline('context-explorer');
            setActiveTab('Context Manager');
          }}
          onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
          onOpenDataCloudSetup={() => {}}
          onExportSvg={handleExportSvg}
          onExportHtml={handleExportHtml}
        />
        <div className="flex flex-1 overflow-hidden">
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            <DataCloudSetupContent onBack={() => setShowDataCloudSetup(false)} />
          </main>
        </div>
        <TimeMachine
          isOpen={timeMachineOpen}
          onClose={() => setTimeMachineOpen(false)}
          onSelectTimeline={(id) => { setShowDataCloudSetup(false); handleSelectTimeline(id); }}
          currentTimeline={currentTimeline}
        />
        <AppLauncher
          isOpen={appLauncherOpen}
          onClose={() => setAppLauncherOpen(false)}
          onSelectApp={handleSelectApp}
          currentApp={effectiveApp}
        />
        {exportToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-[#032D60] text-white text-sm font-medium rounded-lg shadow-xl animate-[fadeIn_0.2s_ease-out]">
            {exportToast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sf-content-bg)]">
      {/* Single-row header */}
      <Header
        appName={appName}
        currentApp={effectiveApp}
        currentTimeline={currentTimeline}
        onOpenTimeMachine={() => setTimeMachineOpen(!timeMachineOpen)}
        onSelectSearchResult={handleSelectSearchResult}
        onSetup={() => {
          setCurrentTimeline('context-explorer');
          setActiveTab('Context Manager');
        }}
        onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
        onOpenDataCloudSetup={() => setShowDataCloudSetup(true)}
        onExportSvg={handleExportSvg}
        onExportHtml={handleExportHtml}
      />

      {/* Body: conditionally render based on timeline */}
      {showTodayLayout ? (
        /* Today / Context Explorer view: LeftNav + Content + AgentPanel */
        <div className="flex flex-1 overflow-hidden">
          <LeftNav
            currentApp={effectiveApp}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            {children || (
              activeTab === 'Home' ? (
                <HomeContent />
              ) : activeTab === 'Context Manager' ? (
                <HelpDocExplorer />
              ) : activeTab === 'Identity Resolutions' ? (
                <IdentityResolutionContent />
              ) : activeTab === 'Data Streams' ? (
                <DataStreamsContent />
              ) : (
                <div className="p-6">
                  <div className="sf-card">
                    <div className="sf-card-header">
                      <h1 className="text-base font-semibold text-[var(--sf-text-primary)]">
                        {activeTab}
                      </h1>
                    </div>
                    <div className="sf-card-body">
                      <p className="text-sm text-[var(--sf-text-tertiary)]">
                        Content area for {activeTab}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </main>
          {!isAdmin && (
            <AgentPanel
              isMinimized={agentMinimized}
              onToggleMinimize={() => setAgentMinimized(!agentMinimized)}
            />
          )}
        </div>
      ) : (
        /* 2 Years view: WorkflowSidebar + WorkflowArea */
        <div className="flex flex-1 overflow-hidden">
          <WorkflowSidebar
            activeWorkflow={activeWorkflow}
            onSelectWorkflow={setActiveWorkflow}
          />
          <main className="flex-1 overflow-y-auto">
            {children || <WorkflowArea workflow={activeWorkflow} />}
          </main>
        </div>
      )}

      {/* Time Machine overlay */}
      <TimeMachine
        isOpen={timeMachineOpen}
        onClose={() => setTimeMachineOpen(false)}
        onSelectTimeline={handleSelectTimeline}
        currentTimeline={currentTimeline}
      />

      {/* App Launcher overlay */}
      <AppLauncher
        isOpen={appLauncherOpen}
        onClose={() => setAppLauncherOpen(false)}
        onSelectApp={handleSelectApp}
        currentApp={effectiveApp}
      />

      {/* Export toast notification */}
      {exportToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-[#032D60] text-white text-sm font-medium rounded-lg shadow-xl animate-[fadeIn_0.2s_ease-out]">
          {exportToast}
        </div>
      )}
    </div>
  );
}
