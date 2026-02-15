import { useState } from 'react';
import Header from './Header';
import AgentPanel from './AgentPanel';
import HomeContent from './HomeContent';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentApp, setCurrentApp] = useState('data-cloud');
  const [activeTab, setActiveTab] = useState('Home');
  const [agentMinimized, setAgentMinimized] = useState(false);

  const handleChangeApp = (appId: string) => {
    setCurrentApp(appId);
    setActiveTab('Home');
  };

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sf-content-bg)]">
      <Header
        currentApp={currentApp}
        activeTab={activeTab}
        onChangeApp={handleChangeApp}
        onChangeTab={setActiveTab}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {/* Body: Agent panel + Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Permanent agent panel — left side */}
        <AgentPanel
          isMinimized={agentMinimized}
          onToggleMinimize={() => setAgentMinimized(!agentMinimized)}
        />

        {/* Main content area */}
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
      </div>
    </div>
  );
}
