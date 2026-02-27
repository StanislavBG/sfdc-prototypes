import { useRef } from 'react';
import { Clock, Calendar, Sparkles, Check, Compass, Rocket } from 'lucide-react';

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
    description: 'Current live product state',
    icon: Clock,
    color: 'var(--slds-g-color-brand)',
  },
  {
    id: '264-release',
    label: '264 Release',
    description: 'Next release — Informatica MDM & new capabilities',
    icon: Rocket,
    color: '#FF5D2D',
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
      <div className="absolute left-0 top-[44px] w-[320px] bg-white rounded-b-lg shadow-xl border border-slds-border-1">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slds-border-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#9B8BF4]" />
            <span className="text-sm font-semibold text-slds-neutral-base">
              Time Machine
            </span>
          </div>
          <p className="text-xs text-slds-neutral-7">
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
                    ? 'border-slds-brand bg-[#EEF4FF]'
                    : 'border-slds-border-1 hover:border-slds-brand-2 hover:bg-[#F9FAFF]'
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
                  <div className="text-sm font-medium text-slds-neutral-base">
                    {t.label}
                  </div>
                  <div className="text-xs text-slds-neutral-7">
                    {t.description}
                  </div>
                </div>
                {isActive && (
                  <Check className="w-4 h-4 text-slds-brand flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
