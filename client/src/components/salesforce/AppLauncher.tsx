import { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Headphones,
  Megaphone,
  Database,
  ShoppingCart,
  Code,
  Settings,
  Search,
} from 'lucide-react';
import { type SalesforceApp, salesforceApps } from '@/lib/mock-data';

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Headphones,
  Megaphone,
  Database,
  ShoppingCart,
  Code,
  Settings,
};

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApp: (appId: string) => void;
  currentApp: string;
}

export default function AppLauncher({ isOpen, onClose, onSelectApp, currentApp }: AppLauncherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredApps = salesforceApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      ref={overlayRef}
      className="sf-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="sf-panel" style={{ width: '400px' }}>
        {/* Search */}
        <div className="slds-p-around_medium slds-border_bottom" style={{ borderColor: 'var(--slds-g-color-border-1)' }}>
          <div className="slds-pos-relative">
            <Search className="slds-icon-size_small slds-text-neutral-7" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sf-app-search-input"
              autoFocus
            />
          </div>
        </div>

        {/* App grid */}
        <div className="sf-app-grid">
          {filteredApps.map((app) => {
            const IconComponent = iconMap[app.icon] || Database;
            const isActive = app.id === currentApp;
            return (
              <button
                key={app.id}
                className={`sf-app-tile ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectApp(app.id);
                  onClose();
                }}
              >
                <div
                  className="sf-app-tile-icon slds-text-white"
                  style={{ backgroundColor: app.color }}
                >
                  <IconComponent className="slds-square_small" />
                </div>
                <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-base slds-text-center" style={{ lineHeight: '1.25' }}>
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="slds-p-around_x-large slds-text-center slds-text-size_medium slds-text-neutral-7">
            No apps found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
