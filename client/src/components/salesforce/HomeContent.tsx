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
  { icon: Database, label: 'Data Streams', color: '#032D60', description: 'Manage your data sources' },
  { icon: Users, label: 'Segments', color: '#0176D3', description: 'Audience segmentation' },
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
    <div className="p-6 space-y-6">
      {/* Hero section */}
      <div className="sf-home-hero">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-white/90" />
            <span className="text-sm font-medium text-white/80 tracking-wide uppercase">
              Trailblazer
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Good morning! Blaze Your Trail.
          </h1>
          <p className="text-sm text-white/80 max-w-lg leading-relaxed">
            Your unified customer data platform is ready. Explore your data streams,
            build segments, and activate insights across every channel.
          </p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="sf-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--sf-text-tertiary)] uppercase tracking-wide">
                  {m.label}
                </span>
                <Icon className="w-4 h-4 text-[var(--sf-text-tertiary)]" />
              </div>
              <div className="text-xl font-bold text-[var(--sf-text-primary)]">{m.value}</div>
              <div className="text-xs text-[var(--sf-success)] font-medium mt-1">{m.change}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left 2/3 – Assistant + shortcuts */}
        <div className="col-span-2 space-y-6">
          {/* Agentforce assistant card */}
          <div className="sf-home-assistant-card">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9B8BF4] to-[#6B5CE7] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-1">
                Agentforce Assistant
              </h3>
              <p className="text-xs text-[var(--sf-text-tertiary)] leading-relaxed">
                Ask questions about your data, create segments, or get insights. Use the agent panel
                on the left to start a conversation.
              </p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-[var(--sf-blue)] hover:text-[var(--sf-blue-hover)] whitespace-nowrap">
              Open Agent
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick access shortcuts */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--sf-text-primary)] mb-3">
              Quick Access
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {shortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="sf-home-shortcut">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{ backgroundColor: s.color }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm font-medium text-[var(--sf-text-primary)]">
                      {s.label}
                    </div>
                    <div className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
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
            <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
              Recent Items
            </h2>
          </div>
          <div className="divide-y divide-[var(--sf-border-light)]">
            {recentItems.map((item) => (
              <div
                key={item.name}
                className="px-4 py-3 hover:bg-[#F3F3F3] cursor-pointer transition-colors"
              >
                <div className="text-sm text-[var(--sf-link)] font-medium hover:underline">
                  {item.name}
                </div>
                <div className="text-xs text-[var(--sf-text-tertiary)] mt-0.5">
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
