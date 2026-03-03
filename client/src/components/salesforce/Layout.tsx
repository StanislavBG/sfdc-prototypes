import { useState, useRef, useCallback } from 'react';
import { toSvg } from 'html-to-image';
import Header from './Header';
import LeftNav from './LeftNav';
import AgentPanel from './AgentPanel';
import HomeContent from './HomeContent';
import GoogleDriveContent from './GoogleDriveContent';
import SemanticSearchContent from './SemanticSearchContent';
import IdentityResolutionContent from './IdentityResolutionContent';
import DataStreamsContent from './DataStreamsContent';
import DataCloudSetupContent from './DataCloudSetupContent';
import WorkflowSidebar from './WorkflowSidebar';
import WorkflowArea from './WorkflowArea';
import TimeMachine from './TimeMachine';
import AppLauncher from './AppLauncher';
import BSChartPlayground from './BSChartPlayground';
import { MdsSimulatorProvider } from './MdsSimulatorContext';
import { salesforceApps, type Workflow } from '@/lib/mock-data';

// ── Demo Session State ─────────────────────────────────────────────
// Tracks user selections across the multi-step demo flow:
// 1) Create Informatica Connections → remembered names
// 2) Select Data Bundles → remembered bundle names
// 3) Create IR from Datakit → uses remembered data
export interface DemoSessionState {
  informaticaConnections: { name: string; alias: string; orgId: string }[];
  selectedBundles: string[];
  installedDatakits: string[]; // datakit ruleset IDs installed via IR wizard (e.g. 'INFA-C360')
}

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
  const [showBSChart, setShowBSChart] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Demo session state — shared across Setup & IR pages
  const [demoSession, setDemoSession] = useState<DemoSessionState>({
    informaticaConnections: [],
    selectedBundles: [],
    installedDatakits: [],
  });

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
      setActiveTab('Google Drive');
    } else if ((id === 'today' || id === '264-release') && activeTab === 'Google Drive' && currentApp !== 'data-cloud') {
      setActiveTab('Home');
    }
  };

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId);
    setShowDataCloudSetup(false);
    if (appId === 'admin') {
      setCurrentTimeline('context-explorer');
      setActiveTab('Google Drive');
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
  // Today, 264 Release, and Context Explorer all use the LeftNav + Content layout
  const showTodayLayout = currentTimeline === 'today' || currentTimeline === '264-release' || currentTimeline === 'context-explorer';

  // Data Cloud Setup takes over the whole content area
  if (showDataCloudSetup) {
    return (
      <MdsSimulatorProvider>
      <div className="sf-layout-root">
        <Header
          appName="Data Cloud Setup"
          currentApp={effectiveApp}
          currentTimeline={currentTimeline}
          onOpenTimeMachine={() => setTimeMachineOpen(!timeMachineOpen)}
          onSelectSearchResult={handleSelectSearchResult}
          onSetup={() => {
            setShowDataCloudSetup(false);
            setCurrentTimeline('context-explorer');
            setActiveTab('Google Drive');
          }}
          onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
          onOpenDataCloudSetup={() => {}}
          onExportSvg={handleExportSvg}
          onExportHtml={handleExportHtml}
          onOpenBSChart={() => setShowBSChart(true)}
        />
        <div className="sf-layout-body">
          <main ref={mainRef} className="sf-layout-main">
            <DataCloudSetupContent onBack={() => setShowDataCloudSetup(false)} demoSession={demoSession} onDemoSessionChange={setDemoSession} currentTimeline={currentTimeline} />
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
        {showBSChart && <BSChartPlayground onClose={() => setShowBSChart(false)} />}
        {exportToast && (
          <div className="sf-export-toast">
            {exportToast}
          </div>
        )}
      </div>
      </MdsSimulatorProvider>
    );
  }

  return (
    <MdsSimulatorProvider>
    <div className="sf-layout-root">
      {/* Single-row header */}
      <Header
        appName={appName}
        currentApp={effectiveApp}
        currentTimeline={currentTimeline}
        onOpenTimeMachine={() => setTimeMachineOpen(!timeMachineOpen)}
        onSelectSearchResult={handleSelectSearchResult}
        onSetup={() => {
          setCurrentTimeline('context-explorer');
          setActiveTab('Google Drive');
        }}
        onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
        onOpenDataCloudSetup={() => setShowDataCloudSetup(true)}
        onExportSvg={handleExportSvg}
        onExportHtml={handleExportHtml}
        onOpenBSChart={() => setShowBSChart(true)}
      />

      {/* Body: conditionally render based on timeline */}
      {showTodayLayout ? (
        /* Today / Context Explorer view: LeftNav + Content + AgentPanel */
        <div className="sf-layout-body">
          <LeftNav
            currentApp={effectiveApp}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
          <main ref={mainRef} className="sf-layout-main">
            {children || (
              activeTab === 'Home' ? (
                <HomeContent />
              ) : activeTab === 'Google Drive' ? (
                <GoogleDriveContent />
              ) : activeTab === 'Semantic Search' ? (
                <SemanticSearchContent />
              ) : activeTab === 'Identity Resolutions' ? (
                <IdentityResolutionContent demoSession={demoSession} onDemoSessionChange={setDemoSession} currentTimeline={currentTimeline} />
              ) : activeTab === 'Data Streams' ? (
                <DataStreamsContent demoSession={demoSession} currentTimeline={currentTimeline} />
              ) : (
                <div className="slds-p-around_large">
                  <div className="sf-card">
                    <div className="sf-card-header">
                      <h1 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">
                        {activeTab}
                      </h1>
                    </div>
                    <div className="sf-card-body">
                      <p className="slds-text-size_medium slds-text-neutral-7">
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
        <div className="sf-layout-body">
          <WorkflowSidebar
            activeWorkflow={activeWorkflow}
            onSelectWorkflow={setActiveWorkflow}
          />
          <main className="sf-layout-main">
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

      {/* BS Chart Playground — global overlay, not affected by timeline */}
      {showBSChart && <BSChartPlayground onClose={() => setShowBSChart(false)} />}

      {/* Export toast notification */}
      {exportToast && (
        <div className="sf-export-toast">
          {exportToast}
        </div>
      )}
    </div>
    </MdsSimulatorProvider>
  );
}
