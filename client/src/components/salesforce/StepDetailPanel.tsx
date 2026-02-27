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
        <div className="flex items-center gap-2">
          <div className="sf-step-detail-icon">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slds-neutral-base">
              {detailContent.heading}
            </h3>
            <span className="text-xs text-slds-neutral-7">
              {typeLabels[step.detailType]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#9B8BF4]" />
          <span className="text-xs text-[#9B8BF4] font-medium">Agent-assisted</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slds-neutral-7 px-4 pb-3 leading-relaxed">
        {detailContent.description}
      </p>

      {/* Content based on detail type */}
      <div className="sf-step-detail-body">
        {/* Options / Choices */}
        {detailContent.options && (
          <div className="sf-step-options">
            {detailContent.options.map((opt) => (
              <button key={opt.label} className="sf-step-option-card">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-slds-neutral-base">
                    {opt.label}
                  </span>
                  {opt.recommended && (
                    <span className="sf-badge sf-badge-info">Recommended</span>
                  )}
                </div>
                <span className="text-xs text-slds-neutral-7 mt-1">
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
                <Lightbulb className="w-3.5 h-3.5 text-slds-warning-1 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slds-neutral-9 leading-relaxed">
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
