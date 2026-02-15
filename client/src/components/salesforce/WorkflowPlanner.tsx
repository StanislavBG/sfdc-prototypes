import { useState, useCallback } from 'react';
import PlannerJobInput from './PlannerJobInput';
import WorkflowTrackerPanel from './WorkflowTrackerPanel';
import StepExplorer from './StepExplorer';
import WorkflowPreviewPanel from './WorkflowPreviewPanel';
import type { PlannedWorkflow, StepDataSource } from '@/lib/planner-data';
import { getDefaultPlannedWorkflow } from '@/lib/planner-data';

/**
 * WorkflowPlanner — 4-region layout:
 *   Region 1 (left):   Job Input + persona
 *   Region 2 (center): Workflow Tracker (live execution, animations, actual values)
 *   Region 3 (right):  Step Explorer (input/output/goal/instructions)
 *   Region 4 (far-right): Workflow Preview (static definitions, expected values)
 */
export default function WorkflowPlanner() {
  // Load a default workflow so the demo isn't empty
  const [workflow, setWorkflow] = useState<PlannedWorkflow | null>(
    getDefaultPlannedWorkflow
  );
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    () => getDefaultPlannedWorkflow().steps[1]?.id ?? null // Default to the "running" step
  );
  const [stepDataSource, setStepDataSource] = useState<StepDataSource>('tracker');

  const handleWorkflowGenerated = useCallback((wf: PlannedWorkflow) => {
    setWorkflow(wf);
    // Auto-select the first step
    setSelectedStepId(wf.steps[0]?.id ?? null);
    setStepDataSource('definition');
  }, []);

  const handleStepSelect = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
  }, []);

  const toggleDataSource = useCallback(() => {
    setStepDataSource((prev) => (prev === 'tracker' ? 'definition' : 'tracker'));
  }, []);

  const selectedStep = workflow?.steps.find((s) => s.id === selectedStepId) ?? null;

  return (
    <div className="sf-planner-layout">
      {/* Region 1: Job Input */}
      <PlannerJobInput
        onWorkflowGenerated={handleWorkflowGenerated}
        activeWorkflow={workflow}
      />

      {/* Region 2: Workflow Tracker */}
      <div className="sf-planner-tracker-region">
        <WorkflowTrackerPanel
          workflow={workflow}
          selectedStepId={selectedStepId}
          onStepSelect={handleStepSelect}
        />
      </div>

      {/* Region 3: Step Explorer */}
      <div className="sf-planner-explorer-region">
        <StepExplorer
          step={selectedStep}
          workflow={workflow}
          dataSource={stepDataSource}
          onToggleSource={toggleDataSource}
        />
      </div>

      {/* Region 4: Workflow Preview */}
      <div className="sf-planner-preview-region">
        <WorkflowPreviewPanel
          workflow={workflow}
          selectedStepId={selectedStepId}
          onStepSelect={handleStepSelect}
        />
      </div>
    </div>
  );
}
