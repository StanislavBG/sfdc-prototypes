import { useState } from 'react';
import Header from './Header';
import LeftNav from './LeftNav';
import AgentPanel from './AgentPanel';
import HomeContent from './HomeContent';
import HelpDocExplorer from './HelpDocExplorer';
import IdentityResolutionContent from './IdentityResolutionContent';
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

  const isAdmin = currentTimeline === 'context-explorer';
  const effectiveApp = isAdmin ? 'admin' : currentApp;
  const currentAppData = salesforceApps.find((a) => a.id === effectiveApp);
  const appName = currentAppData?.name || 'Data 360';

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  const handleSelectTimeline = (id: string) => {
    setCurrentTimeline(id);
    if (id === 'context-explorer') {
      setActiveTab('Help Documents');
    } else if (id === 'today' && activeTab === 'Help Documents' && currentApp !== 'data-cloud') {
      // Switching back from admin, reset to Home
      setActiveTab('Home');
    }
  };

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId);
    if (appId === 'admin') {
      setCurrentTimeline('context-explorer');
      setActiveTab('Help Documents');
    } else {
      setCurrentTimeline('today');
      setActiveTab('Home');
    }
  };

  // Determine layout based on timeline
  const showTodayLayout = currentTimeline === 'today' || currentTimeline === 'context-explorer';

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
          setActiveTab('Help Documents');
        }}
        onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
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
          <main className="flex-1 overflow-y-auto">
            {children || (
              activeTab === 'Home' ? (
                <HomeContent />
              ) : activeTab === 'Help Documents' ? (
                <HelpDocExplorer />
              ) : activeTab === 'Identity Resolutions' ? (
                <IdentityResolutionContent />
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
    </div>
  );
}
