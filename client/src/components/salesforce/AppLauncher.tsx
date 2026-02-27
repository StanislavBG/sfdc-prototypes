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
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute left-0 top-[44px] w-[400px] bg-white rounded-b-lg shadow-xl border border-slds-border-1">
        {/* Search */}
        <div className="p-4 border-b border-slds-border-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slds-neutral-7" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slds-border-1 rounded text-sm focus:outline-none focus:border-slds-brand-2 focus:ring-2 focus:ring-slds-brand-2/30"
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
                className={`sf-app-tile ${isActive ? 'bg-slds-neutral-2 ring-2 ring-slds-brand/30' : ''}`}
                onClick={() => {
                  onSelectApp(app.id);
                  onClose();
                }}
              >
                <div
                  className="sf-app-tile-icon text-white"
                  style={{ backgroundColor: app.color }}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slds-neutral-base text-center leading-tight">
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="p-8 text-center text-sm text-slds-neutral-7">
            No apps found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
