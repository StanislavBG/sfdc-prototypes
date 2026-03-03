import { useState } from 'react';
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
  ChevronRight,
  HardDrive,
  FileSearch,
  ListFilter,
  Landmark,
  FileText,
  Grid3X3,
  TrendingUp,
  Timer,
  Share2,
} from 'lucide-react';
import { appNavGroups, type NavGroup } from '@/lib/mock-data';

// Map group-level icon identifiers → lucide components (for section headers)
const groupIcons: Record<string, React.ElementType> = {
  'list-filter': ListFilter,
  'landmark': Landmark,
  'file-text': FileText,
  'grid-3x3': Grid3X3,
  'trending-up': TrendingUp,
  'timer': Timer,
  'share-2': Share2,
};

// Legacy per-item icons (for apps that don't use section-header icons)
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
  const [quickFind, setQuickFind] = useState('');
  const groups: NavGroup[] = appNavGroups[currentApp] || appNavGroups['data-cloud'];

  // Do any groups use section-header icons? (modern Data Cloud style)
  const useSectionHeaders = groups.some((g) => !!g.icon);

  // Collapsible sections — only first section expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => new Set([0]));

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Find which group contains the active tab
  const activeGroupIdx = groups.findIndex((g) =>
    g.items.some((item) => item.label === activeTab)
  );

  // Auto-expand the section that contains the active tab
  if (activeGroupIdx >= 0 && !expandedSections.has(activeGroupIdx)) {
    setExpandedSections((prev) => new Set(prev).add(activeGroupIdx));
  }

  // Filter items by quick find
  const query = quickFind.trim().toLowerCase();
  const isSearching = query.length > 0;
  const filteredGroups = isSearching
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (item) =>
              item.label.toLowerCase().includes(query) ||
              g.title.toLowerCase().includes(query)
          ),
        }))
        .filter((g) => g.items.length > 0 || g.title.toLowerCase().includes(query))
    : groups;

  // ── Modern section-header layout (Data Cloud) ──
  if (useSectionHeaders) {
    return (
      <nav className="sf-left-nav">
        {/* Quick find search */}
        <div className="sf-left-nav-search">
          <Search className="sf-left-nav-search-icon" />
          <input
            type="text"
            placeholder="Quick find"
            value={quickFind}
            onChange={(e) => setQuickFind(e.target.value)}
            className="sf-left-nav-search-input"
          />
        </div>

        <div className="sf-left-nav-body">
          {filteredGroups.map((group, gi) => {
            const GroupIcon = group.icon ? groupIcons[group.icon] : null;
            const origIdx = groups.indexOf(group);
            const isActiveSection = origIdx === activeGroupIdx;
            const isExpanded = isSearching || expandedSections.has(origIdx);

            return (
              <div key={gi} className="sf-left-nav-section">
                {group.title && (
                  <button
                    className={`sf-left-nav-section-header ${isActiveSection ? 'active' : ''}`}
                    onClick={() => toggleSection(origIdx)}
                  >
                    <ChevronRight
                      className={`sf-left-nav-section-chevron ${isExpanded ? 'expanded' : ''}`}
                    />
                    {GroupIcon && (
                      <GroupIcon className="sf-left-nav-section-icon" />
                    )}
                    <span className="sf-left-nav-section-title">
                      {group.title}
                    </span>
                  </button>
                )}
                {isExpanded &&
                  group.items.map((item) => {
                    const isActive = activeTab === item.label;
                    return (
                      <button
                        key={item.label}
                        className={`sf-left-nav-item sf-left-nav-item--section ${isActive ? 'active' : ''}`}
                        onClick={() => onChangeTab(item.label)}
                      >
                        <span className="slds-truncate">{item.label}</span>
                        {item.hasDropdown && (
                          <ChevronRight className="sf-left-nav-chevron" />
                        )}
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </nav>
    );
  }

  // ── Legacy layout (Sales, Service, Marketing, Admin) ──
  return (
    <nav className="sf-left-nav">
      <div className="sf-left-nav-body">
        {groups.map((group, gi) => (
          <div key={gi} className="sf-left-nav-group">
            {group.title && (
              <div className="sf-left-nav-group-title">{group.title}</div>
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
                  {Icon && (
                    <Icon className="slds-icon-size_small slds-flex-shrink-0" />
                  )}
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
