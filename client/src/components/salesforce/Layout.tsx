import { useState } from 'react';
import Header from './Header';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentApp, setCurrentApp] = useState('data-cloud');
  const [activeTab, setActiveTab] = useState('Home');

  const handleChangeApp = (appId: string) => {
    setCurrentApp(appId);
    setActiveTab('Home');
  };

  const handleSelectSearchResult = (id: string) => {
    // Placeholder - would navigate to record detail in a full implementation
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

      {/* Content area */}
      <main className="flex-1">
        {children || (
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
        )}
      </main>
    </div>
  );
}
