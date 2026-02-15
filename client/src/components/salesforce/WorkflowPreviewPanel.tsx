import {
  FileText,
  ChevronRight,
  Target,
  FileInput,
  FileOutput,
  ListChecks,
  Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlannedWorkflow, PlannerStep } from '@/lib/planner-data';

interface WorkflowPreviewPanelProps {
  workflow: PlannedWorkflow | null;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
}

function StepDefinitionCard({
  step,
  index,
  isSelected,
  isExpanded,
  onSelect,
}: {
  step: PlannerStep;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`sf-preview-step ${isSelected ? 'selected' : ''}`}>
      <button className="sf-preview-step-header" onClick={onSelect}>
        <div className="sf-preview-step-num">{index + 1}</div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-[var(--sf-text-primary)] block truncate">
            {step.title}
          </span>
        </div>
        <ChevronRight
          className={`w-3 h-3 text-[var(--sf-text-tertiary)] transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <motion.div
          className="sf-preview-step-body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Goal */}
          <div className="sf-preview-field">
            <div className="sf-preview-field-label">
              <Target className="w-3 h-3" />
              <span>Goal</span>
            </div>
            <p className="text-[11px] text-[var(--sf-text-secondary)] leading-relaxed">
              {step.goal}
            </p>
          </div>

          {/* Instructions */}
          <div className="sf-preview-field">
            <div className="sf-preview-field-label">
              <ListChecks className="w-3 h-3" />
              <span>Instructions</span>
            </div>
            <ul className="sf-preview-instructions">
              {step.instructions.map((inst, i) => (
                <li key={i} className="text-[10px] text-[var(--sf-text-tertiary)] leading-snug">
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          {/* Expected Input */}
          <div className="sf-preview-field">
            <div className="sf-preview-field-label">
              <FileInput className="w-3 h-3" />
              <span>Expected Input</span>
            </div>
            <div className="sf-preview-kv-list">
              {Object.entries(step.expectedInput).map(([k, v]) => (
                <div key={k} className="sf-preview-kv">
                  <span className="sf-preview-kv-key">{k}</span>
                  <span className="sf-preview-kv-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Output */}
          <div className="sf-preview-field">
            <div className="sf-preview-field-label">
              <FileOutput className="w-3 h-3" />
              <span>Expected Output</span>
            </div>
            <div className="sf-preview-kv-list">
              {Object.entries(step.expectedOutput).map(([k, v]) => (
                <div key={k} className="sf-preview-kv">
                  <span className="sf-preview-kv-key">{k}</span>
                  <span className="sf-preview-kv-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function WorkflowPreviewPanel({
  workflow,
  selectedStepId,
  onStepSelect,
}: WorkflowPreviewPanelProps) {
  if (!workflow) {
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
      {/* Header */}
      <div className="sf-preview-header">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--sf-text-tertiary)]" />
          <span className="text-xs font-semibold text-[var(--sf-text-primary)]">
            Workflow Definition
          </span>
        </div>
        <span className="text-[10px] text-[var(--sf-text-tertiary)]">
          {workflow.steps.length} steps
        </span>
      </div>

      {/* Workflow metadata */}
      <div className="sf-preview-meta">
        <h3 className="text-xs font-semibold text-[var(--sf-text-primary)]">
          {workflow.title}
        </h3>
        <p className="text-[10px] text-[var(--sf-text-tertiary)] mt-1 leading-relaxed">
          {workflow.description}
        </p>
        <div className="sf-preview-meta-tags">
          <span className="sf-preview-tag">
            {workflow.jobInput.persona.role}
          </span>
          <span className="sf-preview-tag">
            {workflow.steps.length} steps
          </span>
        </div>
      </div>

      {/* Step definitions */}
      <div className="sf-preview-steps">
        {workflow.steps.map((step, i) => (
          <StepDefinitionCard
            key={step.id}
            step={step}
            index={i}
            isSelected={step.id === selectedStepId}
            isExpanded={step.id === selectedStepId}
            onSelect={() => onStepSelect(step.id)}
          />
        ))}
      </div>
    </div>
  );
}
