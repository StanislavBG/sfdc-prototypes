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
    description: 'Next release — Informatica & new capabilities',
    icon: Rocket,
    color: '#FF5D2D',
  },
  {
    id: '2-years',
    label: 'Revolution Release',
    description: 'Future state with planned capabilities',
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
      className="sf-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="sf-panel" style={{ width: '320px' }}>
        {/* Header */}
        <div className="slds-p-horizontal_medium slds-p-top_medium slds-p-bottom_small slds-border_bottom" style={{ borderColor: 'var(--slds-g-color-border-1)' }}>
          <div className="slds-grid slds-grid_vertical-align-center slds-gap_x-small slds-m-bottom_xxx-small">
            <Sparkles className="slds-icon-size_small" style={{ color: '#9B8BF4' }} />
            <span className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
              Time Machine
            </span>
          </div>
          <p className="slds-text-size_small slds-text-neutral-7">
            Switch your Data 360 view between timelines
          </p>
        </div>

        {/* Timeline options */}
        <div className="slds-p-around_small" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {timelines.map((t) => {
            const Icon = t.icon;
            const isActive = currentTimeline === t.id;
            return (
              <button
                key={t.id}
                className={`sf-timeline-option ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTimeline(t.id);
                  onClose();
                }}
              >
                <div
                  className="sf-timeline-option-icon"
                  style={{ backgroundColor: t.color }}
                >
                  <Icon className="slds-square_x-small slds-text-white" />
                </div>
                <div className="slds-col slds-text-left">
                  <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">
                    {t.label}
                  </div>
                  <div className="slds-text-size_small slds-text-neutral-7">
                    {t.description}
                  </div>
                </div>
                {isActive && (
                  <Check className="slds-icon-size_small slds-text-brand slds-flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
