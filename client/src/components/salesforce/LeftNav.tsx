import {
  Home,
  Database,
  GitBranch,
  Search,
  Fingerprint,
  UserSearch,
  Calculator,
  Terminal,
  BarChart3,
  LayoutDashboard,
  Users,
  Target,
  Zap,
  ChevronDown,
  HardDrive,
  FileSearch,
} from 'lucide-react';
import { appNavGroups, type NavGroup } from '@/lib/mock-data';

// Map nav labels to icons for visual clarity
const navIcons: Record<string, React.ElementType> = {
  Home,
  'Data Streams': Database,
  'Data Model': GitBranch,
  'Data Explorer': Search,
  'Identity Resolutions': Fingerprint,
  'Profile Explorer': UserSearch,
  'Calculated Insights': Calculator,
  'Query Editor': Terminal,
  Reports: BarChart3,
  Dashboards: LayoutDashboard,
  Segments: Users,
  'Activation Targets': Target,
  Activations: Zap,
  'Google Drive': HardDrive,
  'Semantic Search': FileSearch,
};

interface LeftNavProps {
  currentApp: string;
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

export default function LeftNav({
  currentApp,
  activeTab,
  onChangeTab,
}: LeftNavProps) {
  const groups: NavGroup[] = appNavGroups[currentApp] || appNavGroups['data-cloud'];

  return (
    <nav className="sf-left-nav">
      {/* Scrollable nav groups */}
      <div className="sf-left-nav-body">
        {groups.map((group, gi) => (
          <div key={gi} className="sf-left-nav-group">
            {group.title && (
              <div className="sf-left-nav-group-title">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = navIcons[item.label];
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  className={`sf-left-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onChangeTab(item.label)}
                >
                  {Icon && <Icon className="slds-icon-size_small slds-flex-shrink-0" />}
                  <span className="slds-truncate slds-col">{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="slds-icon-size_xx-small slds-opacity_50 slds-flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
