import { useRef } from 'react';
import { Clock, Calendar, Sparkles, Check, Compass } from 'lucide-react';

export interface TimelineOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const timelines: TimelineOption[] = [
  {
    id: 'today',
    label: 'Today',
    description: 'Current state of your data platform',
    icon: Clock,
    color: '#0176D3',
  },
  {
    id: '2-years',
    label: '2 Years Away',
    description: 'Projected future state with planned capabilities',
    icon: Calendar,
    color: '#9B8BF4',
  },
  {
    id: 'context-explorer',
    label: 'Context Explorer',
    description: 'Admin view for help documents & setup',
    icon: Compass,
    color: '#54698D',
  },
];

interface TimeMachineProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTimeline: (id: string) => void;
  currentTimeline: string;
}

export default function TimeMachine({ isOpen, onClose, onSelectTimeline, currentTimeline }: TimeMachineProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute left-0 top-[44px] w-[320px] bg-white rounded-b-lg shadow-xl border border-[var(--sf-border)]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--sf-border)]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#9B8BF4]" />
            <span className="text-sm font-semibold text-[var(--sf-text-primary)]">
              Time Machine
            </span>
          </div>
          <p className="text-xs text-[var(--sf-text-tertiary)]">
            Switch your Data 360 view between timelines
          </p>
        </div>

        {/* Timeline options */}
        <div className="p-3 space-y-2">
          {timelines.map((t) => {
            const Icon = t.icon;
            const isActive = currentTimeline === t.id;
            return (
              <button
                key={t.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'border-[var(--sf-blue)] bg-[#EEF4FF]'
                    : 'border-[var(--sf-border)] hover:border-[var(--sf-blue-light)] hover:bg-[#F9FAFF]'
                }`}
                onClick={() => {
                  onSelectTimeline(t.id);
                  onClose();
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-[var(--sf-text-primary)]">
                    {t.label}
                  </div>
                  <div className="text-xs text-[var(--sf-text-tertiary)]">
                    {t.description}
                  </div>
                </div>
                {isActive && (
                  <Check className="w-4 h-4 text-[var(--sf-blue)] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
