import {
  Lightbulb,
  Settings,
  ListChecks,
  BookOpen,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import type { WorkflowStep } from '@/lib/mock-data';

interface StepDetailPanelProps {
  step: WorkflowStep;
}

const typeIcons: Record<string, React.ElementType> = {
  config: Settings,
  choices: ListChecks,
  learning: BookOpen,
  review: ClipboardCheck,
};

const typeLabels: Record<string, string> = {
  config: 'Configuration',
  choices: 'Make a Selection',
  learning: 'Learn More',
  review: 'Review & Confirm',
};

export default function StepDetailPanel({ step }: StepDetailPanelProps) {
  const Icon = typeIcons[step.detailType] || Settings;
  const { detailContent } = step;

  return (
    <div className="sf-step-detail">
      {/* Detail header */}
      <div className="sf-step-detail-header">
        <div className="slds-grid slds-grid_vertical-align-center slds-gap_x-small">
          <div className="sf-step-detail-icon">
            <Icon className="slds-icon-size_small" />
          </div>
          <div>
            <h3 className="slds-text-size_medium slds-font-weight_semibold slds-text-neutral-base">
              {detailContent.heading}
            </h3>
            <span className="slds-text-size_small slds-text-neutral-7">
              {typeLabels[step.detailType]}
            </span>
          </div>
        </div>
        <div className="slds-grid slds-grid_vertical-align-center slds-gap_xx-small">
          <Sparkles className="slds-icon-size_x-small" style={{ color: '#9B8BF4' }} />
          <span className="slds-text-size_small slds-font-weight_medium" style={{ color: '#9B8BF4' }}>Agent-assisted</span>
        </div>
      </div>

      {/* Description */}
      <p className="slds-text-size_small slds-text-neutral-7 slds-p-horizontal_medium slds-p-bottom_small slds-leading-relaxed">
        {detailContent.description}
      </p>

      {/* Content based on detail type */}
      <div className="sf-step-detail-body">
        {/* Options / Choices */}
        {detailContent.options && (
          <div className="sf-step-options">
            {detailContent.options.map((opt) => (
              <button key={opt.label} className="sf-step-option-card">
                <div className="slds-grid slds-grid_vertical-align-start slds-grid_align-spread">
                  <span className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base">
                    {opt.label}
                  </span>
                  {opt.recommended && (
                    <span className="sf-badge sf-badge-info">Recommended</span>
                  )}
                </div>
                <span className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Config Fields */}
        {detailContent.fields && (
          <div className="sf-step-fields">
            {detailContent.fields.map((field) => (
              <div key={field.label} className="sf-step-field">
                <label className="sf-step-field-label">{field.label}</label>
                {field.editable ? (
                  <input
                    type="text"
                    defaultValue={field.value}
                    className="sf-step-field-input"
                    placeholder={`Enter ${field.label.toLowerCase()}…`}
                  />
                ) : (
                  <span className="sf-step-field-value">{field.value}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tips / Learning */}
        {detailContent.tips && (
          <div className="sf-step-tips">
            {detailContent.tips.map((tip, i) => (
              <div key={i} className="sf-step-tip">
                <Lightbulb className="slds-icon-size_x-small slds-text-warning slds-flex-shrink-0" style={{ marginTop: '2px' }} />
                <span className="slds-text-size_small slds-text-neutral-9 slds-leading-relaxed">
                  {tip}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
