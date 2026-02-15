import { Check } from 'lucide-react';
import type { WorkflowStep, Workflow } from '@/lib/mock-data';

interface WorkflowProgressProps {
  workflow: Workflow;
  activeStepId: string;
  onStepClick: (stepId: string) => void;
}

export default function WorkflowProgress({
  workflow,
  activeStepId,
  onStepClick,
}: WorkflowProgressProps) {
  const steps = workflow.steps;

  return (
    <div className="sf-wf-progress">
      <div className="sf-wf-progress-header">
        <h2 className="text-sm font-semibold text-[var(--sf-text-primary)]">
          {workflow.title}
        </h2>
        <span className="text-xs text-[var(--sf-text-tertiary)]">
          Step {steps.findIndex((s) => s.id === activeStepId) + 1} of {steps.length}
        </span>
      </div>

      <div className="sf-wf-progress-track">
        {steps.map((step, i) => {
          const isActive = step.id === activeStepId;
          const isCompleted = step.status === 'completed';
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="sf-wf-progress-step-wrap">
              {/* Step node */}
              <button
                className={`sf-wf-progress-node ${
                  isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'
                }`}
                onClick={() => onStepClick(step.id)}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </button>

              {/* Step label */}
              <span
                className={`sf-wf-progress-label ${
                  isActive ? 'active' : isCompleted ? 'completed' : ''
                }`}
              >
                {step.title}
              </span>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`sf-wf-progress-connector ${
                    isCompleted ? 'completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
