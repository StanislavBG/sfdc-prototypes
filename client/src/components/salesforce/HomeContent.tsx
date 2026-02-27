import {
  Sparkles,
  BarChart3,
  Users,
  Database,
  ArrowRight,
  TrendingUp,
  Zap,
  Globe,
} from 'lucide-react';

const shortcuts = [
  { icon: Database, label: 'Data Streams', color: 'var(--slds-g-color-brand-1)', description: 'Manage your data sources' },
  { icon: Users, label: 'Segments', color: 'var(--slds-g-color-brand)', description: 'Audience segmentation' },
  { icon: BarChart3, label: 'Reports', color: '#2E844A', description: 'View analytics & reports' },
  { icon: Globe, label: 'Activations', color: '#DD7A01', description: 'Manage activations' },
];

const recentItems = [
  { name: 'Acme Corporation', type: 'Account', time: '2 hours ago' },
  { name: 'Enterprise Tech Buyers', type: 'Segment', time: '3 hours ago' },
  { name: 'Q1 Pipeline Report', type: 'Report', time: 'Yesterday' },
  { name: 'John Smith', type: 'Contact', time: 'Yesterday' },
];

const metrics = [
  { label: 'Total Records', value: '2.4M', change: '+12%', icon: Database },
  { label: 'Active Segments', value: '47', change: '+3', icon: Users },
  { label: 'Data Quality', value: '94%', change: '+2%', icon: TrendingUp },
  { label: 'Activations', value: '12', change: '+1', icon: Zap },
];

export default function HomeContent() {
  return (
    <div className="slds-p-around_large" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metrics row */}
      <div className="slds-css-grid slds-css-grid-cols-4 slds-gap_medium">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="sf-card slds-p-around_medium">
              <div className="slds-grid slds-grid_vertical-align-center slds-grid_align-spread slds-m-bottom_x-small">
                <span className="slds-text-size_small slds-font-weight_medium slds-text-neutral-7 slds-text-uppercase slds-tracking-wide">
                  {m.label}
                </span>
                <Icon className="slds-icon-size_small slds-text-neutral-7" />
              </div>
              <div className="slds-text-size_x-large slds-font-weight_bold slds-text-neutral-base">{m.value}</div>
              <div className="slds-text-size_small slds-text-success slds-font-weight_medium slds-m-top_xx-small">{m.change}</div>
            </div>
          );
        })}
      </div>

      <div className="slds-css-grid slds-css-grid-cols-3 slds-gap_large">
        {/* Left 2/3 – Assistant + shortcuts */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Agentforce assistant card */}
          <div className="sf-home-assistant-card">
            <div className="slds-flex slds-items-center slds-justify-center slds-flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #9B8BF4, #6B5CE7)' }}>
              <Sparkles className="slds-square_x-small slds-text-white" />
            </div>
            <div className="slds-col slds-min-w-0">
              <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_xxx-small">
                Agentforce Assistant
              </h3>
              <p className="slds-text-size_small slds-text-neutral-7 slds-leading-relaxed">
                Ask questions about your data, create segments, or get insights. Use the agent panel
                on the right to start a conversation.
              </p>
            </div>
            <button className="slds-grid slds-grid_vertical-align-center slds-gap_xx-small slds-text-size_small slds-font-weight_medium sf-text-link slds-nowrap">
              Open Agent
              <ArrowRight className="slds-icon-size_x-small" />
            </button>
          </div>

          {/* Quick access shortcuts */}
          <div>
            <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base slds-m-bottom_small">
              Quick Access
            </h2>
            <div className="slds-css-grid slds-css-grid-cols-4 slds-gap_small">
              {shortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="sf-home-shortcut">
                    <div
                      className="slds-flex slds-items-center slds-justify-center slds-border-radius_large"
                      style={{ width: '40px', height: '40px', backgroundColor: s.color, margin: '0 auto 8px' }}
                    >
                      <Icon className="slds-square_x-small slds-text-white" />
                    </div>
                    <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">
                      {s.label}
                    </div>
                    <div className="slds-text-size_small slds-text-neutral-7" style={{ marginTop: '2px' }}>
                      {s.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1/3 – Recent items */}
        <div className="sf-card">
          <div className="sf-card-header">
            <h2 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
              Recent Items
            </h2>
          </div>
          <div className="sf-divide-y">
            {recentItems.map((item) => (
              <div
                key={item.name}
                className="slds-p-horizontal_medium slds-p-vertical_small sf-hover-bg-neutral slds-cursor-pointer slds-transition-colors"
              >
                <div className="slds-text-size_medium slds-font-weight_medium sf-text-link sf-hover-underline">
                  {item.name}
                </div>
                <div className="slds-text-size_small slds-text-neutral-7" style={{ marginTop: '2px' }}>
                  {item.type} &middot; {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
