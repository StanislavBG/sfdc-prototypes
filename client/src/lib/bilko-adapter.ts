/**
 * Adapter layer bridging our planner-data types to bilko-flow types.
 * Converts PlannedWorkflow/PlannerStep to FlowDefinition/FlowStep/FlowProgressStep/StepExecution.
 */
import type {
  FlowDefinition,
  FlowStep,
  FlowProgressStep,
  StepExecution,
  UIStepType,
  SchemaField,
} from 'bilko-flow/react';
import type { PlannedWorkflow, PlannerStep } from './planner-data';

/** Map our step status to bilko-flow FlowProgressStep status */
function toBilkoProgressStatus(status: PlannerStep['status']): FlowProgressStep['status'] {
  switch (status) {
    case 'completed': return 'complete';
    case 'running': return 'active';
    case 'error': return 'error';
    case 'pending':
    default: return 'pending';
  }
}

/** Map our step status to bilko-flow StepExecution status */
function toBilkoExecutionStatus(status: PlannerStep['status']): StepExecution['status'] {
  switch (status) {
    case 'completed': return 'success';
    case 'running': return 'running';
    case 'error': return 'error';
    case 'pending':
    default: return 'idle';
  }
}

/** Infer a UI step type from step title/content */
function inferStepType(step: PlannerStep): UIStepType {
  const lower = step.title.toLowerCase();
  if (lower.includes('analyz') || lower.includes('inventory') || lower.includes('detect')) return 'transform';
  if (lower.includes('defin') || lower.includes('configur') || lower.includes('set')) return 'user-input';
  if (lower.includes('valid') || lower.includes('review') || lower.includes('test')) return 'validate';
  if (lower.includes('publish') || lower.includes('deploy') || lower.includes('monitor')) return 'display';
  if (lower.includes('generat') || lower.includes('plan') || lower.includes('remediat')) return 'llm';
  return 'transform';
}

/** Convert Record<string, string> to SchemaField[] */
function toSchemaFields(record: Record<string, string>): SchemaField[] {
  return Object.entries(record).map(([name, type]) => ({
    name,
    type: 'string',
    description: type,
    required: true,
  }));
}

/** Convert a PlannerStep to a bilko-flow FlowStep */
export function toFlowStep(step: PlannerStep): FlowStep {
  return {
    id: step.id,
    name: step.title,
    type: inferStepType(step),
    description: step.goal,
    prompt: step.instructions.join('\n'),
    inputSchema: toSchemaFields(step.expectedInput),
    outputSchema: toSchemaFields(step.expectedOutput),
    dependsOn: [],
  };
}

/** Convert a PlannedWorkflow to a bilko-flow FlowDefinition */
export function toFlowDefinition(workflow: PlannedWorkflow): FlowDefinition {
  const steps = workflow.steps.map((step, i) => {
    const flowStep = toFlowStep(step);
    // Set dependencies: each step depends on the previous
    if (i > 0) {
      flowStep.dependsOn = [workflow.steps[i - 1].id];
    }
    return flowStep;
  });

  return {
    id: workflow.id,
    name: workflow.title,
    description: workflow.description,
    version: '1.0.0',
    steps,
    tags: [workflow.jobInput.persona.role, `${workflow.steps.length} steps`],
    icon: 'Workflow',
  };
}

/** Convert PlannerSteps to bilko-flow FlowProgressStep[] for FlowProgress */
export function toFlowProgressSteps(steps: PlannerStep[]): FlowProgressStep[] {
  return steps.map((step) => ({
    id: step.id,
    label: step.title,
    status: toBilkoProgressStatus(step.status),
    type: inferStepType(step),
    meta: {
      message: step.status === 'running'
        ? `${step.progress}% complete`
        : step.status === 'completed'
        ? 'Done'
        : undefined,
      progress: step.status === 'running' ? step.progress / 100 : undefined,
    },
  }));
}

/** Convert PlannerSteps to bilko-flow StepExecution map for FlowCanvas/StepDetail */
export function toStepExecutions(steps: PlannerStep[]): Record<string, StepExecution> {
  const executions: Record<string, StepExecution> = {};
  for (const step of steps) {
    if (step.status === 'pending') continue;
    executions[step.id] = {
      stepId: step.id,
      status: toBilkoExecutionStatus(step.status),
      input: step.actualInput || step.expectedInput,
      output: step.actualOutput || step.expectedOutput,
      durationMs: step.status === 'completed' ? 2400 + Math.random() * 5000 : undefined,
      startedAt: Date.now() - (step.status === 'completed' ? 10000 : 3000),
      completedAt: step.status === 'completed' ? Date.now() - 2000 : undefined,
    };
  }
  return executions;
}

/** Get the overall flow status for FlowProgress */
export function toFlowStatus(workflow: PlannedWorkflow): 'idle' | 'running' | 'complete' | 'error' {
  switch (workflow.status) {
    case 'running': return 'running';
    case 'completed': return 'complete';
    case 'error': return 'error';
    default: return 'idle';
  }
}
