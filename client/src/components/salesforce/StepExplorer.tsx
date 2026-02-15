/**
 * Region 3: Step Explorer Panel
 * Uses bilko-flow StepDetail component for detailed step inspection.
 * Shows input/output/goal/instructions for the selected step.
 * Toggleable between tracker (actual values) and definition (expected values).
 */
import { useMemo } from 'react';
import {
  ArrowRightLeft,
  Eye,
  Sparkles,
} from 'lucide-react';
import { StepDetail } from 'bilko-flow/react';
import type { PlannerStep, StepDataSource, PlannedWorkflow } from '@/lib/planner-data';
import {
  toFlowStep,
  toFlowDefinition,
  toStepExecutions,
} from '@/lib/bilko-adapter';

interface StepExplorerProps {
  step: PlannerStep | null;
  workflow: PlannedWorkflow | null;
  dataSource: StepDataSource;
  onToggleSource: () => void;
}

export default function StepExplorer({
  step,
  workflow,
  dataSource,
  onToggleSource,
}: StepExplorerProps) {
  const flowDefinition = useMemo(
    () => (workflow ? toFlowDefinition(workflow) : null),
    [workflow],
  );

  const flowStep = useMemo(
    () => (step ? toFlowStep(step) : null),
    [step],
  );

  const executions = useMemo(
    () => (workflow ? toStepExecutions(workflow.steps) : {}),
    [workflow],
  );

  const isTracker = dataSource === 'tracker';

  if (!step || !flowStep || !flowDefinition) {
    return (
      <div className="sf-explorer-empty">
        <Eye className="w-6 h-6 text-[var(--sf-text-tertiary)]" />
        <p className="text-xs text-[var(--sf-text-tertiary)] mt-2">
          Select a step to explore its details
        </p>
      </div>
    );
  }

  // When viewing as "definition", don't pass execution data
  const execution = isTracker ? executions[step.id] : undefined;

  return (
    <div className="sf-explorer-panel">
      {/* Header with source toggle */}
      <div className="sf-explorer-header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="sf-explorer-step-badge">
            <span className="text-[10px] font-bold text-white">
              {step.title.split(' ')[0]?.[0] || '#'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--sf-text-primary)] truncate">
              {step.title}
            </h3>
            <span className={`text-[10px] font-medium ${
              step.status === 'completed' ? 'text-[var(--sf-success)]' :
              step.status === 'running' ? 'text-[var(--sf-blue)]' :
              'text-[var(--sf-text-tertiary)]'
            }`}>
              {step.status === 'completed' ? 'Completed' :
               step.status === 'running' ? `Running (${step.progress}%)` :
               'Pending'}
            </span>
          </div>
        </div>

        {/* Source toggle */}
        <button
          className={`sf-explorer-source-toggle ${isTracker ? 'tracker' : 'definition'}`}
          onClick={onToggleSource}
          title={`Viewing: ${isTracker ? 'Tracker (actual values)' : 'Definition (expected values)'}`}
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span>{isTracker ? 'Tracker' : 'Definition'}</span>
        </button>
      </div>

      {/* Source indicator banner */}
      <div className={`sf-explorer-source-banner ${isTracker ? 'tracker' : 'definition'}`}>
        <Sparkles className="w-3 h-3" />
        <span>
          {isTracker
            ? execution
              ? 'Showing actual values from tracker execution'
              : 'No execution data yet — showing definition'
            : 'Showing expected values from workflow definition'}
        </span>
      </div>

      {/* Bilko-Flow StepDetail component */}
      <div className="sf-explorer-bilko-detail">
        <StepDetail
          step={flowStep}
          flow={flowDefinition}
          execution={execution}
          className="bilko-step-detail-panel"
        />
      </div>
    </div>
  );
}
