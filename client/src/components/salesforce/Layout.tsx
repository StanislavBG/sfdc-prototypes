import { useState } from 'react';
import Header from './Header';
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

      {/* Body: WorkflowSidebar | Main Content (WorkflowArea) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Region 1: Workflow sidebar (replaces LeftNav) */}
        <WorkflowSidebar
          activeWorkflow={activeWorkflow}
          onSelectWorkflow={setActiveWorkflow}
        />

        {/* Pointer 3 + Region 4 + Region 5: Workflow area */}
        <main className="flex-1 overflow-y-auto">
          {children || <WorkflowArea workflow={activeWorkflow} />}
        </main>
      </div>

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
