import { useState, useRef, useCallback, useEffect } from 'react';
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
import WorkflowCapture from './WorkflowCapture';
import { MdsSimulatorProvider } from './MdsSimulatorContext';
import { salesforceApps, type Workflow } from '@/lib/mock-data';

// ── URL Routing Utilities ──────────────────────────────────────────
// Convert nav label → URL slug (kebab-case)
function toSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-');
}

// Convert URL slug → nav label (lookup table for known routes)
const slugToTab: Record<string, string> = {};
const tabToSlug: Record<string, string> = {};

// Populated from the nav groups at init time
function registerTab(label: string) {
  const slug = toSlug(label);
  slugToTab[slug] = label;
  tabToSlug[label] = slug;
}

// Register all known tabs
[
  'Home', 'Data Streams', 'Data Lake Objects', 'Data Transforms', 'Data Model',
  'Identity Resolutions', 'Data Spaces', 'Data Governance', 'Data Catalog',
  'Search Indexes', 'Secondary Indexes', 'Document AI', 'Content Viewer',
  'Content Lens', 'Google Drive', 'Semantic Search', 'Segments',
  'Calculated Insights', 'Data Graphs', 'View Data', 'Einstein Studio',
  'Semantic Models', 'Reports', 'Dashboards', 'Activations',
  'Activation Targets', 'Communication Capping', 'Data Actions',
  'Data Action Targets', 'Data Explorer', 'Profile Explorer', 'Query Editor',
].forEach(registerTab);

// IR detail tab slug mapping
const irTabSlugs: Record<string, string> = {
  properties: 'properties',
  details: 'details',
  history: 'processing-history',
};
const irSlugToTab: Record<string, string> = {
  properties: 'properties',
  details: 'details',
  'processing-history': 'history',
};

// Timeline URL slug mappings
const timelineToSlug: Record<string, string> = {
  'today': 'today',
  '264-release': '264',
  'context-explorer': 'context-explorer',
};
const slugToTimeline: Record<string, string> = {
  'today': 'today',
  '264': '264-release',
  'context-explorer': 'context-explorer',
};

interface UrlState {
  timeline: string;
  tab: string;
  irRulesetSlug?: string;
  irDetailTab?: string;
}

function parseUrl(pathname: string): UrlState {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length === 0) return { timeline: '264-release', tab: 'Home' };

  // First segment is timeline prefix
  const timelineSlug = parts[0];
  const timeline = slugToTimeline[timelineSlug];

  if (!timeline) {
    // Legacy URL without timeline prefix — treat first segment as tab slug
    const tab = slugToTab[timelineSlug];
    if (!tab) return { timeline: '264-release', tab: 'Home' };

    if (timelineSlug === 'identity-resolutions' && parts.length >= 2) {
      return {
        timeline: '264-release',
        tab: 'Identity Resolutions',
        irRulesetSlug: parts[1],
        irDetailTab: irSlugToTab[parts[2] || 'properties'] || 'properties',
      };
    }
    return { timeline: '264-release', tab };
  }

  // Second segment is tab slug
  const tabSlug = parts[1];
  if (!tabSlug) return { timeline, tab: 'Home' };

  const tab = slugToTab[tabSlug];
  if (!tab) return { timeline, tab: 'Home' };

  // IR sub-routes: /{timeline}/identity-resolutions/:rulesetSlug/:detailTab
  if (tabSlug === 'identity-resolutions' && parts.length >= 3) {
    const rulesetSlug = parts[2];
    const detailTabSlug = parts[3] || 'properties';
    return {
      timeline,
      tab: 'Identity Resolutions',
      irRulesetSlug: rulesetSlug,
      irDetailTab: irSlugToTab[detailTabSlug] || 'properties',
    };
  }

  return { timeline, tab };
}

function buildUrl(timeline: string, tab: string, irRulesetSlug?: string, irDetailTab?: string): string {
  const tSlug = timelineToSlug[timeline] || 'today';
  const slug = tabToSlug[tab] || toSlug(tab);
  if (tab === 'Identity Resolutions' && irRulesetSlug) {
    const dtSlug = irDetailTab ? (irTabSlugs[irDetailTab] || irDetailTab) : 'properties';
    return `/${tSlug}/${slug}/${irRulesetSlug}/${dtSlug}`;
  }
  return `/${tSlug}/${slug}`;
}

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

// ── URL Breadcrumb ─────────────────────────────────────────────────
function UrlBreadcrumb({ timeline, tab, rulesetSlug, detailTab }: { timeline: string; tab: string; rulesetSlug?: string; detailTab?: string }) {
  const url = buildUrl(timeline, tab, rulesetSlug, detailTab);
  const segments = url.replace(/^\//, '').split('/').filter(Boolean);
  return (
    <div className="sf-url-breadcrumb">
      <span className="sf-url-breadcrumb-segment sf-url-breadcrumb-root">setup</span>
      {segments.map((seg, i) => (
        <span key={i}>
          <span className="sf-url-breadcrumb-sep">&gt;</span>
          <span className={`sf-url-breadcrumb-segment ${i === segments.length - 1 ? 'sf-url-breadcrumb-current' : ''}`}>
            {seg}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  // Parse initial URL to set starting state
  const initialUrl = parseUrl(window.location.pathname);

  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [currentTimeline, setCurrentTimeline] = useState(initialUrl.timeline);
  const [activeTab, setActiveTab] = useState(initialUrl.tab);
  const [agentMinimized, setAgentMinimized] = useState(false);
  const [currentApp, setCurrentApp] = useState('data-cloud');
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);
  const [showDataCloudSetup, setShowDataCloudSetup] = useState(false);
  const [workflowCaptureActive, setWorkflowCaptureActive] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // IR sub-route state (from URL)
  const [irRulesetSlug, setIrRulesetSlug] = useState<string | undefined>(initialUrl.irRulesetSlug);
  const [irDetailTab, setIrDetailTab] = useState<string | undefined>(initialUrl.irDetailTab);

  // Demo session state — shared across Setup & IR pages
  const [demoSession, setDemoSession] = useState<DemoSessionState>({
    informaticaConnections: [],
    selectedBundles: [],
    installedDatakits: [],
  });

  const mainRef = useRef<HTMLElement>(null);
  const suppressUrlPush = useRef(false);

  const isAdmin = currentTimeline === 'context-explorer';
  const effectiveApp = isAdmin ? 'admin' : currentApp;
  const currentAppData = salesforceApps.find((a) => a.id === effectiveApp);
  const appName = currentAppData?.name || 'Data 360';

  // ── URL ↔ State sync ──────────────────────────────────────────────
  // On mount, ensure the URL includes the timeline prefix (replace, not push)
  const didInitialRewrite = useRef(false);

  useEffect(() => {
    if (!didInitialRewrite.current) {
      didInitialRewrite.current = true;
      const correctUrl = buildUrl(currentTimeline, activeTab, irRulesetSlug, irDetailTab);
      if (window.location.pathname !== correctUrl) {
        window.history.replaceState({ timeline: currentTimeline, tab: activeTab, irRulesetSlug, irDetailTab }, '', correctUrl);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Push URL when navigation state changes
  useEffect(() => {
    if (suppressUrlPush.current) {
      suppressUrlPush.current = false;
      return;
    }
    const url = buildUrl(currentTimeline, activeTab, irRulesetSlug, irDetailTab);
    if (window.location.pathname !== url) {
      window.history.pushState({ timeline: currentTimeline, tab: activeTab, irRulesetSlug, irDetailTab }, '', url);
    }
  }, [currentTimeline, activeTab, irRulesetSlug, irDetailTab]);

  // Handle browser back / forward
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseUrl(window.location.pathname);
      suppressUrlPush.current = true;
      setCurrentTimeline(parsed.timeline);
      setActiveTab(parsed.tab);
      setIrRulesetSlug(parsed.irRulesetSlug);
      setIrDetailTab(parsed.irDetailTab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Navigation helper that also updates URL sub-route state
  const navigateTo = useCallback((tab: string, rulesetSlug?: string, detailTab?: string) => {
    setActiveTab(tab);
    setIrRulesetSlug(tab === 'Identity Resolutions' ? rulesetSlug : undefined);
    setIrDetailTab(tab === 'Identity Resolutions' ? detailTab : undefined);
  }, []);

  // Wrapper for setActiveTab that clears IR sub-route
  const handleChangeTab = useCallback((tab: string) => {
    navigateTo(tab);
  }, [navigateTo]);

  // Callback for IR content to update URL when navigating to detail views
  const handleIrNavigate = useCallback((rulesetSlug?: string, detailTab?: string) => {
    setIrRulesetSlug(rulesetSlug);
    setIrDetailTab(detailTab);
  }, []);

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  const handleSelectTimeline = (id: string) => {
    setCurrentTimeline(id);
    setShowDataCloudSetup(false);
    if (id === 'context-explorer') {
      navigateTo('Google Drive');
    } else if ((id === 'today' || id === '264-release') && activeTab === 'Google Drive' && currentApp !== 'data-cloud') {
      navigateTo('Data Streams');
    }
  };

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId);
    setShowDataCloudSetup(false);
    if (appId === 'admin') {
      setCurrentTimeline('context-explorer');
      navigateTo('Google Drive');
    } else if (appId === 'data-cloud') {
      setCurrentTimeline('today');
      navigateTo('Home');
    } else {
      setCurrentTimeline('today');
      navigateTo('Home');
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
            navigateTo('Google Drive');
          }}
          onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
          onOpenDataCloudSetup={() => {}}
          onExportSvg={handleExportSvg}
          onExportHtml={handleExportHtml}

          onToggleWorkflowCapture={() => setWorkflowCaptureActive((v) => !v)}
          workflowCaptureActive={workflowCaptureActive}
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

        <WorkflowCapture
          active={workflowCaptureActive}
          onDeactivate={() => setWorkflowCaptureActive(false)}
          captureTargetRef={mainRef}
        />
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
        onToggleWorkflowCapture={() => setWorkflowCaptureActive((v) => !v)}
        workflowCaptureActive={workflowCaptureActive}
      />

      {/* Body: conditionally render based on timeline */}
      {showTodayLayout ? (
        /* Today / Context Explorer view: LeftNav + Content + AgentPanel */
        <div className="sf-layout-body">
          <LeftNav
            currentApp={effectiveApp}
            activeTab={activeTab}
            onChangeTab={handleChangeTab}
          />
          <main ref={mainRef} className="sf-layout-main">
            {/* URL breadcrumb bar */}
            <UrlBreadcrumb timeline={currentTimeline} tab={activeTab} rulesetSlug={irRulesetSlug} detailTab={irDetailTab} />
            {children || (
              activeTab === 'Home' ? (
                <HomeContent />
              ) : activeTab === 'Google Drive' ? (
                <GoogleDriveContent />
              ) : activeTab === 'Semantic Search' ? (
                <SemanticSearchContent />
              ) : activeTab === 'Identity Resolutions' ? (
                <IdentityResolutionContent demoSession={demoSession} onDemoSessionChange={setDemoSession} currentTimeline={currentTimeline} initialRulesetSlug={irRulesetSlug} initialDetailTab={irDetailTab} onNavigate={handleIrNavigate} />
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

      {/* Workflow Capture — floating overlay */}
      <WorkflowCapture
        active={workflowCaptureActive}
        onDeactivate={() => setWorkflowCaptureActive(false)}
        captureTargetRef={mainRef}
      />

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
