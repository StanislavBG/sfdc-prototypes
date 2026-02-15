import { useState, useEffect } from 'react';
import {
  Check,
  Loader2,
  Circle,
  AlertCircle,
  ChevronRight,
  Play,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlannedWorkflow, PlannerStep } from '@/lib/planner-data';

interface WorkflowTrackerPanelProps {
  workflow: PlannedWorkflow | null;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
}

function StepStatusIcon({ status, progress }: { status: PlannerStep['status']; progress: number }) {
  switch (status) {
    case 'completed':
      return (
        <motion.div
          className="sf-tracker-node completed"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Check className="w-3.5 h-3.5" />
        </motion.div>
      );
    case 'running':
      return (
        <div className="sf-tracker-node running">
          <svg className="sf-tracker-progress-ring" viewBox="0 0 36 36">
            <circle
              className="sf-tracker-progress-bg"
              cx="18" cy="18" r="15.5"
              fill="none"
              strokeWidth="3"
            />
            <motion.circle
              className="sf-tracker-progress-bar"
              cx="18" cy="18" r="15.5"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="97.39"
              initial={{ strokeDashoffset: 97.39 }}
              animate={{ strokeDashoffset: 97.39 - (97.39 * progress) / 100 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <Loader2 className="w-3 h-3 animate-spin sf-tracker-node-icon" />
        </div>
      );
    case 'error':
      return (
        <div className="sf-tracker-node error">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      );
    default:
      return (
        <div className="sf-tracker-node pending">
          <Circle className="w-3 h-3" />
        </div>
      );
  }
}

export default function WorkflowTrackerPanel({
  workflow,
  selectedStepId,
  onStepSelect,
}: WorkflowTrackerPanelProps) {
  const [animatedSteps, setAnimatedSteps] = useState<string[]>([]);

  // Animate steps appearing one by one when workflow loads
  useEffect(() => {
    if (!workflow) return;
    setAnimatedSteps([]);
    workflow.steps.forEach((step, i) => {
      setTimeout(() => {
        setAnimatedSteps((prev) => [...prev, step.id]);
      }, 150 * (i + 1));
    });
  }, [workflow?.id]);

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

  const completedCount = workflow.steps.filter(s => s.status === 'completed').length;
  const totalCount = workflow.steps.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="sf-tracker-panel">
      {/* Header */}
      <div className="sf-tracker-header">
        <div className="flex-1 min-w-0">
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
      </div>

      {/* Overall progress bar */}
      <div className="sf-tracker-overall">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide">
            Progress
          </span>
          <span className="text-[11px] font-semibold text-[var(--sf-text-primary)]">
            {completedCount}/{totalCount} steps
          </span>
        </div>
        <div className="sf-tracker-progress-bar-bg">
          <motion.div
            className="sf-tracker-progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="sf-tracker-steps">
        <AnimatePresence>
          {workflow.steps.map((step, index) => {
            const isVisible = animatedSteps.includes(step.id);
            const isSelected = step.id === selectedStepId;
            const isLast = index === workflow.steps.length - 1;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <button
                  className={`sf-tracker-step ${isSelected ? 'selected' : ''} ${step.status}`}
                  onClick={() => onStepSelect(step.id)}
                >
                  {/* Connector line */}
                  {!isLast && (
                    <div className={`sf-tracker-connector ${step.status === 'completed' ? 'completed' : ''}`} />
                  )}

                  {/* Status icon */}
                  <StepStatusIcon status={step.status} progress={step.progress} />

                  {/* Step content */}
                  <div className="sf-tracker-step-content">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[var(--sf-text-primary)]">
                        {step.title}
                      </span>
                      {step.status === 'running' && (
                        <span className="text-[10px] text-[var(--sf-blue)] font-medium">
                          {step.progress}%
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--sf-text-tertiary)] line-clamp-1">
                      {step.goal}
                    </span>

                    {/* Actual values preview (tracker shows real data) */}
                    {step.status === 'completed' && step.actualOutput && (
                      <div className="sf-tracker-step-data">
                        {Object.entries(step.actualOutput).slice(0, 2).map(([key, val]) => (
                          <div key={key} className="text-[10px]">
                            <span className="text-[var(--sf-text-tertiary)]">{key}: </span>
                            <span className="text-[var(--sf-success)] font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {step.status === 'running' && step.actualInput && (
                      <div className="sf-tracker-step-data">
                        {Object.entries(step.actualInput).slice(0, 1).map(([key, val]) => (
                          <div key={key} className="text-[10px]">
                            <span className="text-[var(--sf-text-tertiary)]">{key}: </span>
                            <span className="text-[var(--sf-blue)] font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    isSelected ? 'text-[var(--sf-blue)]' : 'text-[var(--sf-text-tertiary)] opacity-0 group-hover:opacity-100'
                  }`} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Run controls */}
      {workflow.status === 'ready' && (
        <div className="sf-tracker-controls">
          <button className="sf-tracker-run-btn">
            <Play className="w-3.5 h-3.5" />
            <span>Start Execution</span>
          </button>
        </div>
      )}
    </div>
  );
}
