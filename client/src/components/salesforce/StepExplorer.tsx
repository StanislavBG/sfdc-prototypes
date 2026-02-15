import {
  Target,
  FileInput,
  FileOutput,
  ListChecks,
  ArrowRightLeft,
  Eye,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlannerStep, StepDataSource } from '@/lib/planner-data';

interface StepExplorerProps {
  step: PlannerStep | null;
  dataSource: StepDataSource;
  onToggleSource: () => void;
}

function DataTable({ data, variant }: { data: Record<string, string>; variant: 'input' | 'output' }) {
  return (
    <div className="sf-explorer-data-table">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="sf-explorer-data-row">
          <span className="sf-explorer-data-key">{key}</span>
          <span className={`sf-explorer-data-value ${variant}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StepExplorer({
  step,
  dataSource,
  onToggleSource,
}: StepExplorerProps) {
  if (!step) {
    return (
      <div className="sf-explorer-empty">
        <Eye className="w-6 h-6 text-[var(--sf-text-tertiary)]" />
        <p className="text-xs text-[var(--sf-text-tertiary)] mt-2">
          Select a step to explore its details
        </p>
      </div>
    );
  }

  const isTracker = dataSource === 'tracker';
  const inputData = isTracker && step.actualInput ? step.actualInput : step.expectedInput;
  const outputData = isTracker && step.actualOutput ? step.actualOutput : step.expectedOutput;
  const hasActualData = Boolean(step.actualInput || step.actualOutput);

  return (
    <div className="sf-explorer-panel">
      {/* Header */}
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
            ? hasActualData
              ? 'Showing actual values from tracker execution'
              : 'No actual data yet — showing expected values'
            : 'Showing expected values from workflow definition'}
        </span>
      </div>

      {/* Content body */}
      <div className="sf-explorer-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${step.id}-${dataSource}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Goal section */}
            <div className="sf-explorer-section">
              <div className="sf-explorer-section-header">
                <Target className="w-3.5 h-3.5 text-[#9B8BF4]" />
                <span>Goal</span>
              </div>
              <p className="text-xs text-[var(--sf-text-secondary)] leading-relaxed">
                {step.goal}
              </p>
            </div>

            {/* Instructions section */}
            <div className="sf-explorer-section">
              <div className="sf-explorer-section-header">
                <ListChecks className="w-3.5 h-3.5 text-[#9B8BF4]" />
                <span>Instructions</span>
              </div>
              <ol className="sf-explorer-instructions">
                {step.instructions.map((inst, i) => (
                  <li key={i} className="sf-explorer-instruction">
                    <span className="sf-explorer-instruction-num">{i + 1}</span>
                    <span className="text-xs text-[var(--sf-text-secondary)] leading-relaxed">
                      {inst}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Input section */}
            <div className="sf-explorer-section">
              <div className="sf-explorer-section-header">
                <FileInput className="w-3.5 h-3.5 text-[var(--sf-blue)]" />
                <span>Input</span>
                {isTracker && step.actualInput && (
                  <span className="sf-explorer-actual-badge">Actual</span>
                )}
              </div>
              <DataTable data={inputData} variant="input" />
            </div>

            {/* Output section */}
            <div className="sf-explorer-section">
              <div className="sf-explorer-section-header">
                <FileOutput className="w-3.5 h-3.5 text-[var(--sf-success)]" />
                <span>Output</span>
                {isTracker && step.actualOutput && (
                  <span className="sf-explorer-actual-badge">Actual</span>
                )}
              </div>
              <DataTable data={outputData} variant="output" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
