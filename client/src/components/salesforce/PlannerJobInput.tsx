import { useState } from 'react';
import {
  Mic,
  Send,
  Sparkles,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Persona, PlannedWorkflow } from '@/lib/planner-data';
import { mockPersonas, generateWorkflow } from '@/lib/planner-data';

interface PlannerJobInputProps {
  onWorkflowGenerated: (workflow: PlannedWorkflow) => void;
  activeWorkflow: PlannedWorkflow | null;
}

export default function PlannerJobInput({
  onWorkflowGenerated,
  activeWorkflow,
}: PlannerJobInputProps) {
  const [jobText, setJobText] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona>(mockPersonas[0]);
  const [personaExpanded, setPersonaExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = () => {
    if (!jobText.trim()) return;
    setIsGenerating(true);
    // Simulate planner delay
    setTimeout(() => {
      const workflow = generateWorkflow(jobText, selectedPersona);
      onWorkflowGenerated(workflow);
      setIsGenerating(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <nav className="sf-planner-sidebar">
      <div className="sf-planner-sidebar-body">
        {/* Persona selector */}
        <div className="sf-planner-persona-section">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#9B8BF4]" />
            <span className="text-xs font-semibold text-[var(--sf-text-primary)] uppercase tracking-wide">
              Acting User
            </span>
          </div>

          <button
            className="sf-planner-persona-card"
            onClick={() => setPersonaExpanded(!personaExpanded)}
          >
            <div className="sf-planner-persona-avatar">
              {selectedPersona.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--sf-text-primary)]">
                {selectedPersona.name}
              </div>
              <div className="text-[10px] text-[var(--sf-text-tertiary)]">
                {selectedPersona.role}
              </div>
            </div>
            {personaExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--sf-text-tertiary)]" />
            )}
          </button>

          {personaExpanded && (
            <div className="sf-planner-persona-dropdown">
              {mockPersonas.map((p) => (
                <button
                  key={p.id}
                  className={`sf-planner-persona-option ${p.id === selectedPersona.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPersona(p);
                    setPersonaExpanded(false);
                  }}
                >
                  <div className="sf-planner-persona-avatar-sm">
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{p.name}</div>
                    <div className="text-[10px] text-[var(--sf-text-tertiary)]">{p.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Persona agenda */}
          <div className="sf-planner-persona-agenda">
            <div className="text-[10px] font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-1.5">
              Agenda
            </div>
            {selectedPersona.agenda.map((item, i) => (
              <div key={i} className="sf-planner-agenda-item">
                <Briefcase className="w-3 h-3 text-[var(--sf-text-tertiary)] flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-[var(--sf-text-secondary)] leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Job input */}
        <div className="sf-planner-job-section">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#9B8BF4]" />
            <span className="text-xs font-semibold text-[var(--sf-text-primary)]">
              What job needs to be done?
            </span>
          </div>
          <div className="sf-planner-job-input-wrap">
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the job you want done..."
              className="sf-planner-job-textarea"
              rows={4}
            />
            <div className="sf-planner-job-actions">
              <button className="sf-planner-job-icon" title="Voice input">
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                className={`sf-planner-submit-btn ${isGenerating ? 'generating' : ''}`}
                onClick={handleSubmit}
                disabled={!jobText.trim() || isGenerating}
              >
                {isGenerating ? (
                  <div className="sf-planner-spinner" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isGenerating ? 'Planning...' : 'Plan Flow'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* System context */}
        <div className="sf-planner-context-section">
          <div className="text-[10px] font-semibold text-[var(--sf-text-tertiary)] uppercase tracking-wide mb-2">
            System Context
          </div>
          <p className="text-[11px] text-[var(--sf-text-tertiary)] leading-relaxed">
            {selectedPersona.context}
          </p>
        </div>

        {/* Active workflow indicator */}
        {activeWorkflow && (
          <div className="sf-planner-active-indicator">
            <div className="flex items-center gap-2">
              <div className={`sf-planner-status-dot ${activeWorkflow.status}`} />
              <span className="text-xs font-semibold text-[var(--sf-text-primary)]">
                {activeWorkflow.title}
              </span>
            </div>
            <p className="text-[10px] text-[var(--sf-text-tertiary)] mt-1 ml-5">
              {activeWorkflow.steps.filter(s => s.status === 'completed').length} of{' '}
              {activeWorkflow.steps.length} steps completed
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
