/**
 * Region 2: Workflow Tracker Panel
 * Uses bilko-flow FlowProgress component for live execution tracking.
 * Shows the workflow as it builds/executes with animations and actual data values.
 */
import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { FlowProgress } from 'bilko-flow/react';
import type { PlannedWorkflow } from '@/lib/planner-data';
import {
  toFlowProgressSteps,
  toFlowStatus,
} from '@/lib/bilko-adapter';

interface WorkflowTrackerPanelProps {
  workflow: PlannedWorkflow | null;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
}

export default function WorkflowTrackerPanel({
  workflow,
  selectedStepId,
  onStepSelect,
}: WorkflowTrackerPanelProps) {
  const progressSteps = useMemo(
    () => (workflow ? toFlowProgressSteps(workflow.steps) : []),
    [workflow],
  );

  const flowStatus = useMemo(
    () => (workflow ? toFlowStatus(workflow) : 'idle' as const),
    [workflow],
  );

  const completedCount = workflow?.steps.filter(s => s.status === 'completed').length ?? 0;
  const totalCount = workflow?.steps.length ?? 0;

  if (!workflow) {
    return (
      <div className="sf-tracker-empty">
        <div className="sf-tracker-empty-inner">
          <Zap className="w-8 h-8 text-[var(--sf-text-tertiary)]" />
          <p className="text-sm text-[var(--sf-text-tertiary)] mt-3">
            Submit a job to generate a workflow
          </p>
        </div>
      </div>
    );
  }

  const activity = workflow.status === 'running'
    ? `Step ${completedCount + 1} of ${totalCount} in progress...`
    : workflow.status === 'completed'
    ? 'All steps completed successfully'
    : `${totalCount} steps ready`;

  return (
    <div className="sf-tracker-panel">
      {/* Header */}
      <div className="sf-tracker-header">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--sf-text-primary)] truncate">
            {workflow.title}
          </h2>
          <span className={`sf-badge sf-badge-${workflow.status === 'running' ? 'info' : workflow.status === 'completed' ? 'success' : 'neutral'}`}>
            {workflow.status}
          </span>
        </div>
        <p className="text-[11px] text-[var(--sf-text-tertiary)] mt-0.5 truncate">
          {workflow.description}
        </p>
      </div>

      {/* Bilko-Flow FlowProgress — Vertical mode for tracker */}
      <div className="sf-tracker-bilko-progress">
        <FlowProgress
          mode="vertical"
          steps={progressSteps}
          status={flowStatus}
          label={workflow.title}
          activity={activity}
          lastResult={
            completedCount > 0
              ? `${completedCount}/${totalCount} steps done`
              : undefined
          }
          onStepClick={onStepSelect}
          className="bilko-tracker-vertical"
        />
      </div>

      {/* Bilko-Flow FlowProgress — Expanded mode as secondary view */}
      <div className="sf-tracker-bilko-expanded">
        <div className="sf-tracker-bilko-expanded-label">
          <span className="text-[10px] font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide">
            Pipeline View
          </span>
        </div>
        <FlowProgress
          mode="pipeline"
          steps={progressSteps}
          status={flowStatus}
          label={workflow.title}
          pipelineConfig={{
            showDuration: true,
            showStageNumbers: true,
            continuousTrack: true,
            stageSize: 32,
          }}
          onStepClick={onStepSelect}
          className="bilko-tracker-pipeline"
        />
      </div>
    </div>
  );
}
