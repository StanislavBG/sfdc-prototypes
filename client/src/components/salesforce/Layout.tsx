import { useState } from 'react';
import Header from './Header';
import LeftNav from './LeftNav';
import AgentPanel from './AgentPanel';
import HomeContent from './HomeContent';
import HelpDocExplorer from './HelpDocExplorer';
import Provocations from './Provocations';
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

  const currentAppData = salesforceApps.find((a) => a.id === currentApp);
  const appName = currentAppData?.name || 'Data 360';

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId);
    setCurrentTimeline('today');
    if (appId === 'admin') {
      setActiveTab('Help Documents');
    } else {
      setActiveTab('Home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sf-content-bg)]">
      {/* Single-row header */}
      <Header
        appName={appName}
        currentApp={currentApp}
        currentTimeline={currentTimeline}
        onOpenTimeMachine={() => setTimeMachineOpen(!timeMachineOpen)}
        onSelectSearchResult={handleSelectSearchResult}
        onSetup={() => {
          setCurrentApp('admin');
          setCurrentTimeline('today');
          setActiveTab('Help Documents');
        }}
        onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
        onChangeTab={setActiveTab}
        activeTab={activeTab}
      />

      {/* Body: conditionally render based on timeline */}
      {currentTimeline === 'today' ? (
        /* Today view: original LeftNav + HomeContent + AgentPanel layout */
        <div className="flex flex-1 overflow-hidden">
          <LeftNav
            currentApp={currentApp}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
          <main className="flex-1 overflow-y-auto">
            {children || (
              activeTab === 'Home' ? (
                <HomeContent />
              ) : activeTab === 'Help Documents' ? (
                <HelpDocExplorer />
              ) : activeTab === 'Provocations' ? (
                <Provocations />
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
          {currentApp !== 'admin' && (
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
        onSelectTimeline={setCurrentTimeline}
        currentTimeline={currentTimeline}
      />

      {/* App Launcher overlay */}
      <AppLauncher
        isOpen={appLauncherOpen}
        onClose={() => setAppLauncherOpen(false)}
        onSelectApp={handleSelectApp}
        currentApp={currentApp}
      />
    </div>
  );
}
