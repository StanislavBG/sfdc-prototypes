import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import WorkflowProgress from './WorkflowProgress';
import StepDetailPanel from './StepDetailPanel';
import type { Workflow } from '@/lib/mock-data';

interface WorkflowAreaProps {
  workflow: Workflow | null;
}

export default function WorkflowArea({ workflow }: WorkflowAreaProps) {
  const activeStep =
    workflow?.steps.find((s) => s.status === 'active') || workflow?.steps[0];
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Use selected step or fallback to the active step
  const currentStep = workflow?.steps.find((s) => s.id === selectedStepId) || activeStep;

  if (!workflow) {
    return (
      <div className="sf-workflow-empty">
        <div className="sf-workflow-empty-inner">
          <div className="sf-workflow-empty-icon">
            <Sparkles className="slds-square_large" style={{ color: '#9B8BF4' }} />
          </div>
          <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base slds-m-top_medium">
            Welcome to Data 360
          </h2>
          <p className="slds-text-size_medium slds-text-neutral-7 slds-m-top_x-small slds-text-center slds-leading-relaxed" style={{ maxWidth: '28rem' }}>
            Select a workflow from the sidebar or describe what you're working on
            to get started. Your AI agent is embedded in every step to help you along
            the way.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = workflow.steps.findIndex((s) => s.id === currentStep?.id);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < workflow.steps.length - 1;

  return (
    <div className="sf-workflow-area">
      {/* Region 4: Progress tracker */}
      <WorkflowProgress
        workflow={workflow}
        activeStepId={currentStep?.id || workflow.steps[0].id}
        onStepClick={setSelectedStepId}
      />

      {/* Pointer 3: Main workflow step content */}
      <div className="sf-workflow-step-content">
        <div className="sf-workflow-step-card">
          <div className="sf-workflow-step-card-header">
            <div>
              <h3 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base">
                {currentStep?.title}
              </h3>
              <p className="slds-text-size_small slds-text-neutral-7 slds-m-top_xx-small">
                {currentStep?.description}
              </p>
            </div>
            <span
              className={`sf-badge ${
                currentStep?.status === 'completed'
                  ? 'sf-badge-success'
                  : currentStep?.status === 'active'
                  ? 'sf-badge-info'
                  : 'sf-badge-neutral'
              }`}
            >
              {currentStep?.status === 'completed'
                ? 'Completed'
                : currentStep?.status === 'active'
                ? 'In Progress'
                : 'Upcoming'}
            </span>
          </div>

          {/* Embedded agent hint */}
          <div className="sf-workflow-agent-hint">
            <Sparkles className="slds-icon-size_x-small" style={{ color: '#9B8BF4' }} />
            <span className="slds-text-size_small slds-text-neutral-7">
              Agent is ready to help with this step. Ask questions or let it configure
              settings for you.
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="sf-workflow-step-nav">
          <button
            disabled={!canGoBack}
            onClick={() =>
              canGoBack &&
              setSelectedStepId(workflow.steps[currentIndex - 1].id)
            }
            className="sf-workflow-nav-btn"
          >
            <ArrowLeft className="slds-icon-size_x-small" />
            <span>Previous</span>
          </button>
          <button
            disabled={!canGoForward}
            onClick={() =>
              canGoForward &&
              setSelectedStepId(workflow.steps[currentIndex + 1].id)
            }
            className="sf-workflow-nav-btn primary"
          >
            <span>Next Step</span>
            <ArrowRight className="slds-icon-size_x-small" />
          </button>
        </div>
      </div>

      {/* Region 5: Step-specific detail panel */}
      {currentStep && <StepDetailPanel step={currentStep} />}
    </div>
  );
}
