import { useState } from 'react';
import Header from './Header';
import LeftNav from './LeftNav';
import AgentPanel from './AgentPanel';
import AppLauncher from './AppLauncher';
import HomeContent from './HomeContent';
import { salesforceApps } from '@/lib/mock-data';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentApp, setCurrentApp] = useState('data-cloud');
  const [activeTab, setActiveTab] = useState('Home');
  const [agentMinimized, setAgentMinimized] = useState(false);
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);

  const currentAppData = salesforceApps.find((a) => a.id === currentApp);

  const handleChangeApp = (appId: string) => {
    setCurrentApp(appId);
    setActiveTab('Home');
    setAppLauncherOpen(false);
  };

  const handleSelectSearchResult = (id: string) => {
    console.log('Selected search result:', id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--sf-content-bg)]">
      {/* Single-row header: Waffle + Logo + App Name | Search | Icons */}
      <Header
        appName={currentAppData?.name || 'Data 360'}
        onOpenAppLauncher={() => setAppLauncherOpen(!appLauncherOpen)}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {/* Body: LeftNav | Content | AgentPanel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Far left: Vertical navigation */}
        <LeftNav
          currentApp={currentApp}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
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

        {/* Far right: Agent panel */}
        <AgentPanel
          isMinimized={agentMinimized}
          onToggleMinimize={() => setAgentMinimized(!agentMinimized)}
        />
      </div>

      {/* App Launcher overlay */}
      <AppLauncher
        isOpen={appLauncherOpen}
        onClose={() => setAppLauncherOpen(false)}
        onSelectApp={handleChangeApp}
        currentApp={currentApp}
      />
    </div>
  );
}
