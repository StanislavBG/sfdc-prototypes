/**
 * Region 4: Workflow Preview Panel
 * Uses bilko-flow FlowCanvas for DAG visualization and FlowCard for summary.
 * Shows workflow definitions (expected values, static view).
 */
import { useMemo, useState } from 'react';
import { FileText, Eye, LayoutGrid, Network } from 'lucide-react';
import { FlowCanvas, FlowCard, FlowTimeline } from 'bilko-flow/react';
import type { PlannedWorkflow } from '@/lib/planner-data';
import {
  toFlowDefinition,
  toStepExecutions,
} from '@/lib/bilko-adapter';

type PreviewMode = 'canvas' | 'timeline' | 'card';

interface WorkflowPreviewPanelProps {
  workflow: PlannedWorkflow | null;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
}

export default function WorkflowPreviewPanel({
  workflow,
  selectedStepId,
  onStepSelect,
}: WorkflowPreviewPanelProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('canvas');

  const flowDefinition = useMemo(
    () => (workflow ? toFlowDefinition(workflow) : null),
    [workflow],
  );

  const executions = useMemo(
    () => (workflow ? toStepExecutions(workflow.steps) : {}),
    [workflow],
  );

  if (!workflow || !flowDefinition) {
    return (
      <div className="sf-preview-empty">
        <FileText className="w-6 h-6 text-[var(--sf-text-tertiary)]" />
        <p className="text-xs text-[var(--sf-text-tertiary)] mt-2">
          Workflow definition will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="sf-preview-panel">
      {/* Header with view mode toggle */}
      <div className="sf-preview-header">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--sf-text-tertiary)]" />
          <span className="text-xs font-semibold text-[var(--sf-text-primary)]">
            Workflow Preview
          </span>
        </div>
        <div className="sf-preview-mode-toggle">
          <button
            className={`sf-preview-mode-btn ${previewMode === 'canvas' ? 'active' : ''}`}
            onClick={() => setPreviewMode('canvas')}
            title="DAG Canvas"
          >
            <Network className="w-3 h-3" />
          </button>
          <button
            className={`sf-preview-mode-btn ${previewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setPreviewMode('timeline')}
            title="Timeline"
          >
            <LayoutGrid className="w-3 h-3" />
          </button>
          <button
            className={`sf-preview-mode-btn ${previewMode === 'card' ? 'active' : ''}`}
            onClick={() => setPreviewMode('card')}
            title="Card Summary"
          >
            <FileText className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bilko-Flow Preview Content */}
      <div className="sf-preview-bilko-content">
        {previewMode === 'canvas' && (
          <FlowCanvas
            flow={flowDefinition}
            selectedStepId={selectedStepId}
            onSelectStep={onStepSelect}
            executions={executions}
            className="bilko-preview-canvas"
          />
        )}

        {previewMode === 'timeline' && (
          <FlowTimeline
            flow={flowDefinition}
            selectedStepId={selectedStepId}
            onSelectStep={onStepSelect}
            executions={executions}
            className="bilko-preview-timeline"
          />
        )}

        {previewMode === 'card' && (
          <div className="sf-preview-card-container">
            <FlowCard
              flow={flowDefinition}
              onClick={() => {}}
              className="bilko-preview-card"
            />

            {/* Additional definition info below card */}
            <div className="sf-preview-definition-info">
              <h4 className="text-xs font-semibold text-[var(--sf-text-primary)] mb-2">
                Step Definitions
              </h4>
              {workflow.steps.map((step, i) => (
                <button
                  key={step.id}
                  className={`sf-preview-def-step ${step.id === selectedStepId ? 'selected' : ''}`}
                  onClick={() => onStepSelect(step.id)}
                >
                  <span className="sf-preview-def-num">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-[var(--sf-text-primary)] block truncate">
                      {step.title}
                    </span>
                    <span className="text-[10px] text-[var(--sf-text-tertiary)] block truncate">
                      {step.goal}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
