import { useRef, useState } from 'react';
import { Sparkles, Rocket, Calendar, ArrowRight, Check, Clock, Compass, Settings, Zap, ChevronRight } from 'lucide-react';

interface OnboardingOverlayProps {
  onSelectTimeline: (id: string) => void;
  onDismiss: () => void;
  onLaunchSetup: () => void;
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

export default function OnboardingOverlay({ onSelectTimeline, onDismiss, onLaunchSetup }: OnboardingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'choose' | 'setup-prompt'>('choose');

  const handleTimelineClick = (id: string) => {
    if (id === '264-release') {
      setStep('setup-prompt');
    } else {
      onSelectTimeline(id);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      if (step === 'setup-prompt') {
        // Dismiss from step 2 → load 264 Release without setup
        onDismiss();
      } else {
        onDismiss();
      }
    }
  };

  return (
    <div
      ref={overlayRef}
      className="sf-onboarding-overlay"
      onClick={handleBackdropClick}
    >
      {step === 'choose' ? (
        <div className="sf-onboarding-panel">
          {/* Step 1: Choose timeline */}
          <div className="sf-onboarding-header">
            <div className="sf-onboarding-header-icon">
              <Sparkles style={{ color: '#9B8BF4', width: 24, height: 24 }} />
            </div>
            <h2 className="sf-onboarding-title">Welcome to Data 360</h2>
            <p className="sf-onboarding-subtitle">
              Choose a timeline to explore. Each represents a different stage of the product.
            </p>
          </div>

          <div className="sf-onboarding-step-indicator">
            <div className="sf-onboarding-step active">1</div>
            <div className="sf-onboarding-step-line" />
            <div className="sf-onboarding-step">2</div>
          </div>

          <div className="sf-onboarding-cards">
            {timelineCards.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className="sf-onboarding-card"
                  onClick={() => handleTimelineClick(t.id)}
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
      ) : (
        /* Step 2: Informatica setup prompt (264 Release path) */
        <div className="sf-onboarding-panel">
          <div className="sf-onboarding-header">
            <div className="sf-onboarding-header-icon" style={{ background: '#FFF0EB' }}>
              <Settings style={{ color: '#FF5D2D', width: 24, height: 24 }} />
            </div>
            <h2 className="sf-onboarding-title">Configure Informatica Tenant</h2>
            <p className="sf-onboarding-subtitle">
              The 264 Release showcases the Informatica MDM integration.
              Set up your tenant connection first so Data Streams and Identity Resolutions
              display the full experience.
            </p>
          </div>

          <div className="sf-onboarding-step-indicator">
            <div className="sf-onboarding-step completed">
              <Check style={{ width: 14, height: 14 }} />
            </div>
            <div className="sf-onboarding-step-line active" />
            <div className="sf-onboarding-step active">2</div>
          </div>

          {/* Visual walkthrough */}
          <div className="sf-onboarding-setup-guide">
            <div className="sf-onboarding-setup-step">
              <div className="sf-onboarding-setup-step-num">1</div>
              <div className="sf-onboarding-setup-step-content">
                <span className="sf-onboarding-setup-step-title">Create Informatica Connection</span>
                <span className="sf-onboarding-setup-step-desc">
                  Enter your tenant name, alias, and Org ID to link your MDM instance
                </span>
              </div>
            </div>
            <div className="sf-onboarding-setup-step">
              <div className="sf-onboarding-setup-step-num">2</div>
              <div className="sf-onboarding-setup-step-content">
                <span className="sf-onboarding-setup-step-title">Select Data Bundles</span>
                <span className="sf-onboarding-setup-step-desc">
                  Choose which MDM data bundles to install — these populate your Data Streams
                </span>
              </div>
            </div>
            <div className="sf-onboarding-setup-step">
              <div className="sf-onboarding-setup-step-num">3</div>
              <div className="sf-onboarding-setup-step-content">
                <span className="sf-onboarding-setup-step-title">Explore Data 360</span>
                <span className="sf-onboarding-setup-step-desc">
                  View Informatica tiles in Data Streams, configure Identity Resolutions, and more
                </span>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="sf-onboarding-setup-actions">
            <button
              className="sf-onboarding-setup-cta"
              onClick={onLaunchSetup}
            >
              <Zap style={{ width: 18, height: 18 }} />
              Open Data Cloud Setup
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
            <button
              className="sf-onboarding-setup-skip"
              onClick={onDismiss}
            >
              Skip for now — I'll explore on my own
            </button>
          </div>

          <div className="sf-onboarding-footer">
            <p className="sf-onboarding-footer-hint">
              You can always access setup later via the <Settings style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle' }} /> gear icon in the header.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
