import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, UserPlus, RefreshCw, Crown, Database, BarChart3, Zap } from 'lucide-react';
import WorkflowProgress from './WorkflowProgress';
import StepDetailPanel from './StepDetailPanel';
import type { Workflow } from '@/lib/mock-data';
import type { UserPersona } from './OnboardingOverlay';

interface WorkflowAreaProps {
  workflow: Workflow | null;
  persona?: UserPersona;
}

function PersonaLanding({ persona }: { persona: UserPersona }) {
  if (persona === 'new-configure') {
    return (
      <div className="sf-workflow-empty">
        <div className="sf-workflow-empty-inner">
          <div className="sf-workflow-empty-icon" style={{ background: '#E8F5E9' }}>
            <UserPlus className="slds-square_large" style={{ color: '#0F9D58' }} />
          </div>
          <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base slds-m-top_medium">
            Welcome — Let's Get You Started
          </h2>
          <p className="slds-text-size_medium slds-text-neutral-7 slds-m-top_x-small slds-text-center slds-leading-relaxed" style={{ maxWidth: '32rem' }}>
            You're new here — no worries! Start by describing what you want to do in the sidebar,
            or select <strong>Connect & Unify</strong> from Popular Use Cases to connect your
            data sources and create unified customer profiles.
          </p>
          <div className="sf-workflow-landing-cards">
            <div className="sf-workflow-landing-card">
              <Database style={{ width: 20, height: 20, color: '#0F9D58' }} />
              <div>
                <strong>Connect your data</strong>
                <span>Link CRM, MDM, and external sources</span>
              </div>
            </div>
            <div className="sf-workflow-landing-card">
              <Sparkles style={{ width: 20, height: 20, color: '#0F9D58' }} />
              <div>
                <strong>AI guides every step</strong>
                <span>Your agent is embedded in each workflow</span>
              </div>
            </div>
            <div className="sf-workflow-landing-card">
              <Zap style={{ width: 20, height: 20, color: '#0F9D58' }} />
              <div>
                <strong>Unified profiles</strong>
                <span>Identity resolution creates 360 views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (persona === 'frequent') {
    return (
      <div className="sf-workflow-empty">
        <div className="sf-workflow-empty-inner">
          <div className="sf-workflow-empty-icon" style={{ background: '#E8F1FE' }}>
            <RefreshCw className="slds-square_large" style={{ color: '#1B96FF' }} />
          </div>
          <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base slds-m-top_medium">
            Welcome Back
          </h2>
          <p className="slds-text-size_medium slds-text-neutral-7 slds-m-top_x-small slds-text-center slds-leading-relaxed" style={{ maxWidth: '32rem' }}>
            Your personalized workflows are in the <strong>For You</strong> section.
            Pick up where you left off, or describe a new task to get started.
          </p>
          <div className="sf-workflow-landing-cards">
            <div className="sf-workflow-landing-card">
              <BarChart3 style={{ width: 20, height: 20, color: '#1B96FF' }} />
              <div>
                <strong>3 recent workflows</strong>
                <span>Continue from your last session</span>
              </div>
            </div>
            <div className="sf-workflow-landing-card">
              <Database style={{ width: 20, height: 20, color: '#1B96FF' }} />
              <div>
                <strong>2 data streams active</strong>
                <span>Ingesting new records hourly</span>
              </div>
            </div>
            <div className="sf-workflow-landing-card">
              <Sparkles style={{ width: 20, height: 20, color: '#1B96FF' }} />
              <div>
                <strong>AI suggestions ready</strong>
                <span>Based on your recent activity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Power user
  return (
    <div className="sf-workflow-empty">
      <div className="sf-workflow-empty-inner">
        <div className="sf-workflow-empty-icon" style={{ background: '#F3F0FF' }}>
          <Crown className="slds-square_large" style={{ color: '#9B8BF4' }} />
        </div>
        <h2 className="slds-text-size_large slds-font-weight_semibold slds-text-neutral-base slds-m-top_medium">
          Power Mode Active
        </h2>
        <p className="slds-text-size_medium slds-text-neutral-7 slds-m-top_x-small slds-text-center slds-leading-relaxed" style={{ maxWidth: '32rem' }}>
          Full access enabled. Your <strong>For You</strong> workflows are personalized
          to your advanced usage patterns. Describe any task or select a workflow to jump in.
        </p>
        <div className="sf-workflow-landing-cards">
          <div className="sf-workflow-landing-card">
            <Zap style={{ width: 20, height: 20, color: '#9B8BF4' }} />
            <div>
              <strong>Advanced configurations</strong>
              <span>Bulk operations and custom rules</span>
            </div>
          </div>
          <div className="sf-workflow-landing-card">
            <Database style={{ width: 20, height: 20, color: '#9B8BF4' }} />
            <div>
              <strong>All data sources</strong>
              <span>Full connector library available</span>
            </div>
          </div>
          <div className="sf-workflow-landing-card">
            <BarChart3 style={{ width: 20, height: 20, color: '#9B8BF4' }} />
            <div>
              <strong>Analytics & monitoring</strong>
              <span>Pipeline health and data quality metrics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowArea({ workflow, persona = 'new-configure' }: WorkflowAreaProps) {
  const activeStep =
    workflow?.steps.find((s) => s.status === 'active') || workflow?.steps[0];
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Use selected step or fallback to the active step
  const currentStep = workflow?.steps.find((s) => s.id === selectedStepId) || activeStep;

  if (!workflow) {
    return <PersonaLanding persona={persona} />;
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
