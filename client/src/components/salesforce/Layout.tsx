import { useState } from 'react';
import Header from './Header';
import LeftNav from './LeftNav';
import AgentPanel from './AgentPanel';
import HomeContent from './HomeContent';
import WorkflowSidebar from './WorkflowSidebar';
import WorkflowArea from './WorkflowArea';
import TimeMachine from './TimeMachine';
import type { Workflow } from '@/lib/mock-data';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [currentTimeline, setCurrentTimeline] = useState('today');
  const [activeTab, setActiveTab] = useState('Home');
  const [agentMinimized, setAgentMinimized] = useState(false);

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sf-content-bg)]">
      {/* Single-row header */}
      <Header
        appName="Data 360"
        currentTimeline={currentTimeline}
        onOpenTimeMachine={() => setTimeMachineOpen(!timeMachineOpen)}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {/* Body: conditionally render based on timeline */}
      {currentTimeline === 'today' ? (
        /* Today view: original LeftNav + HomeContent + AgentPanel layout */
        <div className="flex flex-1 overflow-hidden">
          <LeftNav
            currentApp="data-cloud"
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
          <main className="flex-1 overflow-y-auto">
            {children || (
              activeTab === 'Home' ? (
                <HomeContent />
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
          <AgentPanel
            isMinimized={agentMinimized}
            onToggleMinimize={() => setAgentMinimized(!agentMinimized)}
          />
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
    </div>
  );
}
