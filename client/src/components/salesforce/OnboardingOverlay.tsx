import { useRef } from 'react';
import { Sparkles, Rocket, Calendar, ArrowRight, Check, Clock, Compass } from 'lucide-react';

interface OnboardingOverlayProps {
  onSelectTimeline: (id: string) => void;
  onDismiss: () => void;
}

const timelineCards = [
  {
    id: '264-release',
    label: '264 Release',
    description: 'Next release — Informatica MDM & new capabilities',
    icon: Rocket,
    color: '#FF5D2D',
    badge: 'Recommended',
    features: [
      'Informatica MDM connector & data bundles',
      'Identity Resolution rulesets',
      'Data Streams ingestion',
      'AI-powered semantic search',
    ],
  },
  {
    id: '2-years',
    label: 'Revolution Release',
    description: 'Future state with planned capabilities',
    icon: Calendar,
    color: '#9B8BF4',
    badge: 'Preview',
    features: [
      'Workflow-driven task orchestration',
      'Advanced agent collaboration',
      'End-to-end data pipeline automation',
      'Full Data 360 vision',
    ],
  },
];

export default function OnboardingOverlay({ onSelectTimeline, onDismiss }: OnboardingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={overlayRef}
      className="sf-onboarding-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onDismiss();
      }}
    >
      <div className="sf-onboarding-panel">
        {/* Header */}
        <div className="sf-onboarding-header">
          <div className="sf-onboarding-header-icon">
            <Sparkles style={{ color: '#9B8BF4', width: 24, height: 24 }} />
          </div>
          <h2 className="sf-onboarding-title">Welcome to Data 360</h2>
          <p className="sf-onboarding-subtitle">
            Choose a timeline to explore. Each represents a different stage of the product.
          </p>
        </div>

        {/* Timeline cards */}
        <div className="sf-onboarding-cards">
          {timelineCards.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className="sf-onboarding-card"
                onClick={() => onSelectTimeline(t.id)}
              >
                <div className="sf-onboarding-card-top">
                  <div className="sf-onboarding-card-icon" style={{ backgroundColor: t.color }}>
                    <Icon style={{ width: 22, height: 22, color: 'white' }} />
                  </div>
                  <div className="sf-onboarding-card-info">
                    <span className="sf-onboarding-card-label">{t.label}</span>
                    <span className="sf-onboarding-card-desc">{t.description}</span>
                  </div>
                  <span
                    className="sf-onboarding-badge"
                    style={{
                      background: t.id === '264-release' ? '#FF5D2D' : '#9B8BF4',
                    }}
                  >
                    {t.badge}
                  </span>
                </div>

                <div className="sf-onboarding-card-features">
                  {t.features.map((f, i) => (
                    <div key={i} className="sf-onboarding-feature">
                      <Check style={{ width: 14, height: 14, color: t.color, flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="sf-onboarding-card-action" style={{ color: t.color }}>
                  Launch {t.label}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Other timelines hint */}
        <div className="sf-onboarding-footer">
          <div className="sf-onboarding-footer-options">
            <span className="sf-onboarding-footer-label">Also available:</span>
            <span className="sf-onboarding-footer-item">
              <Clock style={{ width: 14, height: 14 }} /> Today (live product)
            </span>
            <span className="sf-onboarding-footer-item">
              <Compass style={{ width: 14, height: 14 }} /> Context Explorer (admin)
            </span>
          </div>
          <p className="sf-onboarding-footer-hint">
            Switch timelines anytime via the Time Machine button in the header.
          </p>
        </div>
      </div>
    </div>
  );
}
